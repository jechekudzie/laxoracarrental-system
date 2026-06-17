<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\VehicleStatus;
use App\Exceptions\CustomerBlacklistedException;
use App\Exceptions\InvalidBookingException;
use App\Exceptions\VehicleUnavailableException;
use App\Models\Booking;
use App\Models\BookingCategory;
use App\Models\Customer;
use App\Models\MileageLog;
use App\Models\Vehicle;
use App\Services\BookingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class BookingLifecycleTest extends TestCase
{
    use LazilyRefreshDatabase;

    private BookingService $bookings;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bookings = app(BookingService::class);
    }

    // ---------------------------------------------------------------------------
    // create
    // ---------------------------------------------------------------------------

    public function test_can_create_a_pending_booking(): void
    {
        $customer = Customer::factory()->create();
        $vehicle = Vehicle::factory()->create([
            'status' => VehicleStatus::Available,
            'daily_rate' => 80.0,
            'km_per_day_limit' => 100,
        ]);

        $booking = $this->bookings->create([
            'customer_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'pickup_datetime' => '2030-01-01 08:00:00',
            'return_datetime' => '2030-01-06 08:00:00',
        ]);

        $this->assertInstanceOf(Booking::class, $booking);
        $this->assertSame(BookingStatus::Pending, $booking->status);
        $this->assertSame(5, $booking->rental_days);
        $this->assertEqualsWithDelta(400.0, (float) $booking->base_amount, 0.01);
        $this->assertMatchesRegularExpression('/^BK-[A-Z0-9]{8}$/', $booking->reference);
        $this->assertModelExists($booking);
    }

    public function test_blacklisted_customer_cannot_book(): void
    {
        $customer = Customer::factory()->blacklisted()->create();
        $vehicle = Vehicle::factory()->create();

        $this->expectException(CustomerBlacklistedException::class);

        $this->bookings->create([
            'customer_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'pickup_datetime' => '2030-01-01 08:00:00',
            'return_datetime' => '2030-01-06 08:00:00',
        ]);
    }

    public function test_return_before_pickup_throws_exception(): void
    {
        $customer = Customer::factory()->create();
        $vehicle = Vehicle::factory()->create();

        $this->expectException(InvalidBookingException::class);

        $this->bookings->create([
            'customer_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'pickup_datetime' => '2030-01-06 08:00:00',
            'return_datetime' => '2030-01-01 08:00:00',
        ]);
    }

    public function test_decommissioned_vehicle_cannot_be_booked(): void
    {
        $customer = Customer::factory()->create();
        $vehicle = Vehicle::factory()->status(VehicleStatus::Decommissioned)->create();

        $this->expectException(VehicleUnavailableException::class);

        $this->bookings->create([
            'customer_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'pickup_datetime' => '2030-01-01 08:00:00',
            'return_datetime' => '2030-01-06 08:00:00',
        ]);
    }

    public function test_overlapping_booking_blocks_new_booking(): void
    {
        $customer = Customer::factory()->create();
        $vehicle = Vehicle::factory()->create(['status' => VehicleStatus::Available]);

        // First booking occupies 2030-01-01 to 2030-01-06
        Booking::factory()->create([
            'vehicle_id' => $vehicle->id,
            'status' => BookingStatus::Confirmed,
            'pickup_datetime' => '2030-01-01 08:00:00',
            'return_datetime' => '2030-01-06 08:00:00',
        ]);

        $this->expectException(VehicleUnavailableException::class);

        // Second booking overlaps (starts Jan 3, ends Jan 8)
        $this->bookings->create([
            'customer_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'pickup_datetime' => '2030-01-03 08:00:00',
            'return_datetime' => '2030-01-08 08:00:00',
        ]);
    }

    // ---------------------------------------------------------------------------
    // confirm
    // ---------------------------------------------------------------------------

    public function test_pending_booking_can_be_confirmed(): void
    {
        $booking = Booking::factory()->status(BookingStatus::Pending)->create();

        $confirmed = $this->bookings->confirm($booking);

        $this->assertSame(BookingStatus::Confirmed, $confirmed->status);
    }

    public function test_cannot_confirm_an_already_active_booking(): void
    {
        $booking = Booking::factory()->status(BookingStatus::Active)->create();

        $this->expectException(InvalidBookingException::class);

        $this->bookings->confirm($booking);
    }

    // ---------------------------------------------------------------------------
    // activate
    // ---------------------------------------------------------------------------

    public function test_confirmed_booking_can_be_activated(): void
    {
        $vehicle = Vehicle::factory()->create([
            'status' => VehicleStatus::Available,
            'current_odometer' => 50000,
        ]);
        $booking = Booking::factory()->status(BookingStatus::Confirmed)->create([
            'vehicle_id' => $vehicle->id,
        ]);

        $activated = $this->bookings->activate($booking, 50000);

        $this->assertSame(BookingStatus::Active, $activated->status);
        $this->assertSame(50000, (int) $activated->odometer_start);
        $this->assertNotNull($activated->actual_pickup_at);

        $vehicle->refresh();
        $this->assertSame(VehicleStatus::Rented, $vehicle->status);

        $this->assertDatabaseHas('mileage_logs', [
            'booking_id' => $booking->id,
            'odometer_reading' => 50000,
            'notes' => 'Pickup',
        ]);
    }

    public function test_cannot_activate_a_completed_booking(): void
    {
        $booking = Booking::factory()->status(BookingStatus::Completed)->create();

        $this->expectException(InvalidBookingException::class);

        $this->bookings->activate($booking, 60000);
    }

    // ---------------------------------------------------------------------------
    // complete
    // ---------------------------------------------------------------------------

    public function test_active_booking_can_be_completed_with_overage(): void
    {
        $category = BookingCategory::factory()->create([
            'km_per_day_limit' => 100,
            'excess_km_rate' => 0.35,
            'security_deposit' => 0,
            'fuel_charge_per_level' => 0,
        ]);
        $vehicle = Vehicle::factory()->create([
            'status' => VehicleStatus::Rented,
            'booking_category_id' => $category->id,
            'daily_rate' => 80.0,
            'km_per_day_limit' => 100,
            'excess_km_rate' => 0.35,
            'current_odometer' => 10000,
        ]);
        $booking = Booking::factory()->status(BookingStatus::Active)->create([
            'vehicle_id' => $vehicle->id,
            'pickup_datetime' => Carbon::parse('2030-01-01 08:00:00'),
            'return_datetime' => Carbon::parse('2030-01-06 08:00:00'),
            'odometer_start' => 10000,
            'rental_days' => 5,
            'daily_rate' => 80.0,
            'excess_km_rate' => 0.35,
            'fuel_charge' => 0,
            'damage_charge' => 0,
        ]);

        // Return at 10720 → 720 km driven; 500 km allowance; 220 excess × $0.35 = $77 overage
        $completed = $this->bookings->complete($booking, 10720);

        $this->assertSame(BookingStatus::Completed, $completed->status);
        $this->assertEqualsWithDelta(77.0, (float) $completed->mileage_overage_amount, 0.01);
        $this->assertEqualsWithDelta(477.0, (float) $completed->total_amount, 0.01);
        $this->assertNotNull($completed->actual_return_at);

        $vehicle->refresh();
        $this->assertSame(VehicleStatus::Available, $vehicle->status);
        $this->assertSame(10720, (int) $vehicle->current_odometer);

        $this->assertDatabaseHas('mileage_logs', [
            'booking_id' => $booking->id,
            'odometer_reading' => 10720,
            'notes' => 'Return',
        ]);
    }

    public function test_complete_with_no_overage_keeps_base_amount(): void
    {
        $category = BookingCategory::factory()->create([
            'km_per_day_limit' => 200,
            'excess_km_rate' => 0.35,
            'security_deposit' => 0,
            'fuel_charge_per_level' => 0,
        ]);
        $vehicle = Vehicle::factory()->create([
            'status' => VehicleStatus::Rented,
            'booking_category_id' => $category->id,
            'daily_rate' => 80.0,
            'km_per_day_limit' => 200,
            'excess_km_rate' => 0.35,
        ]);
        $booking = Booking::factory()->status(BookingStatus::Active)->create([
            'vehicle_id' => $vehicle->id,
            'pickup_datetime' => Carbon::parse('2030-01-01 08:00:00'),
            'return_datetime' => Carbon::parse('2030-01-03 08:00:00'),
            'odometer_start' => 10000,
            'rental_days' => 2,
            'daily_rate' => 80.0,
            'excess_km_rate' => 0.35,
            'fuel_charge' => 0,
            'damage_charge' => 0,
        ]);

        // 2 days × $80 = $160; drove 300 km, allowance 400 km → no overage
        $completed = $this->bookings->complete($booking, 10300);

        $this->assertEqualsWithDelta(0.0, (float) $completed->mileage_overage_amount, 0.01);
        $this->assertEqualsWithDelta(160.0, (float) $completed->total_amount, 0.01);
    }

    public function test_odometer_regression_throws_exception(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => VehicleStatus::Rented]);
        $booking = Booking::factory()->status(BookingStatus::Active)->create([
            'vehicle_id' => $vehicle->id,
            'odometer_start' => 50000,
        ]);

        $this->expectException(InvalidBookingException::class);

        $this->bookings->complete($booking, 49000); // lower than start
    }

    // ---------------------------------------------------------------------------
    // cancel
    // ---------------------------------------------------------------------------

    public function test_pending_booking_can_be_cancelled(): void
    {
        $booking = Booking::factory()->status(BookingStatus::Pending)->create();

        $cancelled = $this->bookings->cancel($booking, 'Customer changed plans');

        $this->assertSame(BookingStatus::Cancelled, $cancelled->status);
        $this->assertSame('Customer changed plans', $cancelled->cancellation_reason);
    }

    public function test_active_booking_cannot_be_cancelled(): void
    {
        $booking = Booking::factory()->status(BookingStatus::Active)->create();

        $this->expectException(InvalidBookingException::class);

        $this->bookings->cancel($booking, 'No reason');
    }

    // ---------------------------------------------------------------------------
    // Full lifecycle: pending → confirmed → active → completed
    // ---------------------------------------------------------------------------

    public function test_full_lifecycle_from_pending_to_completed(): void
    {
        $category = BookingCategory::factory()->create([
            'km_per_day_limit' => 100,
            'excess_km_rate' => 0.35,
            'security_deposit' => 0,
            'fuel_charge_per_level' => 0,
        ]);
        $vehicle = Vehicle::factory()->create([
            'status' => VehicleStatus::Available,
            'booking_category_id' => $category->id,
            'daily_rate' => 80.0,
            'km_per_day_limit' => 100,
            'excess_km_rate' => 0.35,
            'current_odometer' => 10000,
        ]);
        $customer = Customer::factory()->create();

        $booking = $this->bookings->create([
            'customer_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'pickup_datetime' => '2030-01-01 08:00:00',
            'return_datetime' => '2030-01-06 08:00:00',
        ]);
        $this->assertSame(BookingStatus::Pending, $booking->status);

        $booking = $this->bookings->confirm($booking);
        $this->assertSame(BookingStatus::Confirmed, $booking->status);

        $booking = $this->bookings->activate($booking, 10000);
        $this->assertSame(BookingStatus::Active, $booking->status);
        $this->assertSame(VehicleStatus::Rented, $vehicle->fresh()->status);

        $booking = $this->bookings->complete($booking, 10720);
        $this->assertSame(BookingStatus::Completed, $booking->status);
        $this->assertEqualsWithDelta(477.0, (float) $booking->total_amount, 0.01);
        $this->assertSame(VehicleStatus::Available, $vehicle->fresh()->status);

        $this->assertSame(2, MileageLog::where('booking_id', $booking->id)->count());
    }
}
