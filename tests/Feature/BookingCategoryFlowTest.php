<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\FuelLevel;
use App\Enums\PaymentType;
use App\Enums\VehicleStatus;
use App\Exceptions\InvalidBookingException;
use App\Models\Booking;
use App\Models\BookingCategory;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Vehicle;
use App\Services\BookingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

/**
 * End-to-end tests for the BookingCategory feature: security deposit snapshot
 * at creation, fuel + mileage reconciliation on return, and deposit refund
 * payments.
 */
class BookingCategoryFlowTest extends TestCase
{
    use LazilyRefreshDatabase;

    private BookingService $bookings;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bookings = app(BookingService::class);
    }

    // ---------------------------------------------------------------------------
    // create — deposit and km rules snapshot from category
    // ---------------------------------------------------------------------------

    public function test_booking_snapshots_deposit_and_km_allowance_from_category(): void
    {
        $category = BookingCategory::factory()->create([
            'security_deposit' => 150,
            'km_per_day_limit' => 200,
            'excess_km_rate' => 0.50,
            'fuel_charge_per_level' => 15,
        ]);

        $vehicle = Vehicle::factory()->create([
            'booking_category_id' => $category->id,
            'daily_rate' => 45.00,
            'status' => VehicleStatus::Available,
        ]);

        $booking = $this->bookings->create([
            'customer_id' => Customer::factory()->create()->id,
            'vehicle_id' => $vehicle->id,
            'pickup_datetime' => '2030-06-01 08:00:00',
            'return_datetime' => '2030-06-04 08:00:00', // 3 days
        ]);

        $this->assertSame(3, $booking->rental_days);
        $this->assertSame(600, $booking->km_allowance, '3 days × 200 km should be 600');
        $this->assertEqualsWithDelta(150.0, (float) $booking->deposit_amount, 0.01);
        $this->assertEqualsWithDelta(0.50, (float) $booking->excess_km_rate, 0.01);
        $this->assertEqualsWithDelta(135.0, (float) $booking->base_amount, 0.01);
    }

    public function test_vehicle_without_category_cannot_be_booked(): void
    {
        $vehicle = Vehicle::factory()->create([
            'booking_category_id' => null,
            'status' => VehicleStatus::Available,
        ]);

        $this->expectException(InvalidBookingException::class);

        $this->bookings->create([
            'customer_id' => Customer::factory()->create()->id,
            'vehicle_id' => $vehicle->id,
            'pickup_datetime' => '2030-06-01 08:00:00',
            'return_datetime' => '2030-06-04 08:00:00',
        ]);
    }

    // ---------------------------------------------------------------------------
    // complete — reconciliation math
    // ---------------------------------------------------------------------------

    public function test_return_with_no_overage_refunds_full_deposit(): void
    {
        $booking = $this->activeBooking(
            depositAmount: 150,
            kmPerDay: 200,
            excessKmRate: 0.50,
            fuelChargePerLevel: 15,
            odoStart: 10_000,
            pickupFuel: FuelLevel::Full,
        );

        $completed = $this->bookings->complete(
            $booking,
            10_500, // 500 km over 3 days, allowance 600 → no overage
            null,
            FuelLevel::Full,
        );

        $this->assertSame(BookingStatus::Completed, $completed->status);
        $this->assertEqualsWithDelta(0.0, (float) $completed->mileage_overage_amount, 0.01);
        $this->assertEqualsWithDelta(0.0, (float) $completed->fuel_charge, 0.01);

        $refund = Payment::where('booking_id', $completed->id)
            ->where('type', PaymentType::DepositRefund->value)
            ->first();
        $this->assertNotNull($refund, 'A deposit refund payment should be created');
        $this->assertEqualsWithDelta(150.0, (float) $refund->amount, 0.01);
    }

    public function test_return_with_mileage_overage_reduces_refund(): void
    {
        $booking = $this->activeBooking(
            depositAmount: 150,
            kmPerDay: 200,
            excessKmRate: 0.50,
            fuelChargePerLevel: 0,
            odoStart: 10_000,
            pickupFuel: FuelLevel::Full,
        );

        $completed = $this->bookings->complete(
            $booking,
            10_800, // 800 km over 3 days, allowance 600 → 200 excess × $0.50 = $100 overage
            null,
            FuelLevel::Full,
        );

        $this->assertEqualsWithDelta(100.0, (float) $completed->mileage_overage_amount, 0.01);

        $refund = Payment::where('booking_id', $completed->id)
            ->where('type', PaymentType::DepositRefund->value)
            ->first();
        $this->assertEqualsWithDelta(50.0, (float) $refund->amount, 0.01, '150 deposit − 100 overage = 50');
    }

    public function test_return_with_deductions_exceeding_deposit_creates_no_refund(): void
    {
        $booking = $this->activeBooking(
            depositAmount: 50,
            kmPerDay: 200,
            excessKmRate: 0.50,
            fuelChargePerLevel: 15,
            odoStart: 10_000,
            pickupFuel: FuelLevel::Full,
        );

        $completed = $this->bookings->complete(
            $booking,
            11_200, // 1200 km, allowance 600 → 600 excess × $0.50 = $300 overage
            null,
            FuelLevel::Half, // 2 levels short × $15 = $30 fuel charge
        );

        $this->assertEqualsWithDelta(300.0, (float) $completed->mileage_overage_amount, 0.01);
        $this->assertEqualsWithDelta(30.0, (float) $completed->fuel_charge, 0.01);

        $this->assertSame(0, Payment::where('booking_id', $completed->id)
            ->where('type', PaymentType::DepositRefund->value)
            ->count(), 'No refund when deductions exceed deposit');
    }

    public function test_return_with_surplus_fuel_is_ignored(): void
    {
        // Pickup at half tank, returned with full tank — no credit, no charge.
        $booking = $this->activeBooking(
            depositAmount: 150,
            kmPerDay: 200,
            excessKmRate: 0.50,
            fuelChargePerLevel: 15,
            odoStart: 10_000,
            pickupFuel: FuelLevel::Half,
        );

        $completed = $this->bookings->complete(
            $booking,
            10_500,
            null,
            FuelLevel::Full,
        );

        $this->assertEqualsWithDelta(0.0, (float) $completed->fuel_charge, 0.01);

        $refund = Payment::where('booking_id', $completed->id)
            ->where('type', PaymentType::DepositRefund->value)
            ->first();
        $this->assertEqualsWithDelta(150.0, (float) $refund->amount, 0.01);
    }

    public function test_fuel_shortfall_charges_category_rate_per_level(): void
    {
        // Pickup full, return quarter → 3 quarter-tank levels short.
        $booking = $this->activeBooking(
            depositAmount: 200,
            kmPerDay: 200,
            excessKmRate: 0.50,
            fuelChargePerLevel: 20,
            odoStart: 10_000,
            pickupFuel: FuelLevel::Full,
        );

        $completed = $this->bookings->complete(
            $booking,
            10_300,
            null,
            FuelLevel::Quarter,
        );

        $this->assertEqualsWithDelta(60.0, (float) $completed->fuel_charge, 0.01, '3 levels × $20');

        $refund = Payment::where('booking_id', $completed->id)
            ->where('type', PaymentType::DepositRefund->value)
            ->first();
        $this->assertEqualsWithDelta(140.0, (float) $refund->amount, 0.01, '200 − 60 = 140');
    }

    // ---------------------------------------------------------------------------
    // helpers
    // ---------------------------------------------------------------------------

    private function activeBooking(
        float $depositAmount,
        int $kmPerDay,
        float $excessKmRate,
        float $fuelChargePerLevel,
        int $odoStart,
        FuelLevel $pickupFuel,
    ): Booking {
        $category = BookingCategory::factory()->create([
            'security_deposit' => $depositAmount,
            'km_per_day_limit' => $kmPerDay,
            'excess_km_rate' => $excessKmRate,
            'fuel_charge_per_level' => $fuelChargePerLevel,
        ]);

        $vehicle = Vehicle::factory()->create([
            'booking_category_id' => $category->id,
            'status' => VehicleStatus::Rented,
            'daily_rate' => 45.00,
            'current_odometer' => $odoStart,
        ]);

        return Booking::factory()->status(BookingStatus::Active)->create([
            'vehicle_id' => $vehicle->id,
            'customer_id' => Customer::factory()->create()->id,
            'pickup_datetime' => Carbon::parse('2030-06-01 08:00:00'),
            'return_datetime' => Carbon::parse('2030-06-04 08:00:00'),
            'rental_days' => 3,
            'km_allowance' => 3 * $kmPerDay,
            'daily_rate' => 45.00,
            'excess_km_rate' => $excessKmRate,
            'deposit_amount' => $depositAmount,
            'odometer_start' => $odoStart,
            'fuel_level_pickup' => $pickupFuel->value,
            'fuel_charge' => 0,
            'damage_charge' => 0,
        ]);
    }
}
