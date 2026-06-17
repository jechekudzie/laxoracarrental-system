<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Enums\Currency;
use App\Models\BookingCategory;
use App\Models\Vehicle;
use App\Services\PricingService;
use Carbon\Carbon;
use PHPUnit\Framework\TestCase;

class PricingServiceTest extends TestCase
{
    private PricingService $pricing;

    protected function setUp(): void
    {
        parent::setUp();
        $this->pricing = new PricingService;
    }

    // ---------------------------------------------------------------------------
    // calculateRentalDays
    // ---------------------------------------------------------------------------

    public function test_exact_24_hours_is_one_day(): void
    {
        $pickup = Carbon::parse('2026-01-01 08:00:00');
        $return = Carbon::parse('2026-01-02 08:00:00');

        $this->assertSame(1, $this->pricing->calculateRentalDays($pickup, $return));
    }

    public function test_26_hours_rounds_up_to_two_days(): void
    {
        $pickup = Carbon::parse('2026-01-01 08:00:00');
        $return = Carbon::parse('2026-01-02 10:00:00'); // 26 hours

        $this->assertSame(2, $this->pricing->calculateRentalDays($pickup, $return));
    }

    public function test_five_days_exact(): void
    {
        $pickup = Carbon::parse('2026-01-01 08:00:00');
        $return = Carbon::parse('2026-01-06 08:00:00');

        $this->assertSame(5, $this->pricing->calculateRentalDays($pickup, $return));
    }

    public function test_one_minute_over_midnight_rounds_up_to_two_days(): void
    {
        $pickup = Carbon::parse('2026-01-01 23:59:00');
        $return = Carbon::parse('2026-01-03 00:00:00'); // 25h 1min

        $this->assertSame(2, $this->pricing->calculateRentalDays($pickup, $return));
    }

    public function test_return_before_pickup_returns_zero(): void
    {
        $pickup = Carbon::parse('2026-01-02 08:00:00');
        $return = Carbon::parse('2026-01-01 08:00:00');

        $this->assertSame(0, $this->pricing->calculateRentalDays($pickup, $return));
    }

    public function test_same_time_pickup_and_return_returns_zero(): void
    {
        $pickup = Carbon::parse('2026-01-01 08:00:00');
        $return = Carbon::parse('2026-01-01 08:00:00');

        $this->assertSame(0, $this->pricing->calculateRentalDays($pickup, $return));
    }

    public function test_one_second_over_counts_as_one_day(): void
    {
        $pickup = Carbon::parse('2026-01-01 08:00:00');
        $return = Carbon::parse('2026-01-01 08:00:01');

        $this->assertSame(1, $this->pricing->calculateRentalDays($pickup, $return));
    }

    // ---------------------------------------------------------------------------
    // calculateMileageOverage
    // ---------------------------------------------------------------------------

    public function test_proposal_worked_example_overage(): void
    {
        // 5 days × 100 km/day = 500 km allowance; drove 720 km; excess = 220
        [$actualDistance, $excessKm, $overageAmount] = $this->pricing->calculateMileageOverage(
            odometerStart: 10000,
            odometerEnd: 10720,
            kmAllowance: 500,
            excessKmRate: 0.35,
        );

        $this->assertSame(720, $actualDistance);
        $this->assertSame(220, $excessKm);
        $this->assertEqualsWithDelta(77.0, $overageAmount, 0.001);
    }

    public function test_within_allowance_no_overage(): void
    {
        [$actualDistance, $excessKm, $overageAmount] = $this->pricing->calculateMileageOverage(
            odometerStart: 10000,
            odometerEnd: 10400,
            kmAllowance: 500,
            excessKmRate: 0.35,
        );

        $this->assertSame(400, $actualDistance);
        $this->assertSame(0, $excessKm);
        $this->assertEqualsWithDelta(0.0, $overageAmount, 0.001);
    }

    public function test_exactly_at_allowance_no_overage(): void
    {
        [$actualDistance, $excessKm, $overageAmount] = $this->pricing->calculateMileageOverage(
            odometerStart: 10000,
            odometerEnd: 10500,
            kmAllowance: 500,
            excessKmRate: 0.35,
        );

        $this->assertSame(500, $actualDistance);
        $this->assertSame(0, $excessKm);
        $this->assertEqualsWithDelta(0.0, $overageAmount, 0.001);
    }

    public function test_null_odometer_start_returns_zero_overage(): void
    {
        [$actualDistance, $excessKm, $overageAmount] = $this->pricing->calculateMileageOverage(
            odometerStart: null,
            odometerEnd: 10720,
            kmAllowance: 500,
            excessKmRate: 0.35,
        );

        $this->assertSame(0, $actualDistance);
        $this->assertSame(0, $excessKm);
        $this->assertEqualsWithDelta(0.0, $overageAmount, 0.001);
    }

    public function test_null_odometer_end_returns_zero_overage(): void
    {
        [$actualDistance, $excessKm, $overageAmount] = $this->pricing->calculateMileageOverage(
            odometerStart: 10000,
            odometerEnd: null,
            kmAllowance: 500,
            excessKmRate: 0.35,
        );

        $this->assertSame(0, $actualDistance);
        $this->assertSame(0, $excessKm);
        $this->assertEqualsWithDelta(0.0, $overageAmount, 0.001);
    }

    public function test_both_odometers_null_returns_zero_overage(): void
    {
        [$actualDistance, $excessKm, $overageAmount] = $this->pricing->calculateMileageOverage(
            odometerStart: null,
            odometerEnd: null,
            kmAllowance: 500,
            excessKmRate: 0.35,
        );

        $this->assertSame(0, $actualDistance);
        $this->assertSame(0, $excessKm);
        $this->assertEqualsWithDelta(0.0, $overageAmount, 0.001);
    }

    // ---------------------------------------------------------------------------
    // quote — full proposal worked example
    // ---------------------------------------------------------------------------

    public function test_proposal_quote_477_dollars(): void
    {
        // Proposal: 5 days × $80 + 220 excess km × $0.35 = $400 + $77 = $477
        $vehicle = $this->makeVehicle(dailyRate: 80.0, kmPerDay: 100, excessKmRate: 0.35);

        $pickup = Carbon::parse('2026-01-01 08:00:00');
        $return = Carbon::parse('2026-01-06 08:00:00'); // exactly 5 days

        $quote = $this->pricing->quote(
            vehicle: $vehicle,
            pickup: $pickup,
            return: $return,
            odometerStart: 10000,
            odometerEnd: 10720,
        );

        $this->assertSame(5, $quote->rentalDays);
        $this->assertSame(500, $quote->kmAllowance);       // 5 × 100
        $this->assertEqualsWithDelta(400.0, $quote->baseAmount, 0.001);
        $this->assertSame(720, $quote->actualDistance);
        $this->assertSame(220, $quote->excessKm);
        $this->assertEqualsWithDelta(77.0, $quote->mileageOverageAmount, 0.001);
        $this->assertEqualsWithDelta(477.0, $quote->totalAmount, 0.001);
        $this->assertSame('USD', $quote->currency);
    }

    public function test_quote_with_no_odometer_data_excludes_overage(): void
    {
        $vehicle = $this->makeVehicle(dailyRate: 80.0, kmPerDay: 100, excessKmRate: 0.35);

        $pickup = Carbon::parse('2026-01-01 08:00:00');
        $return = Carbon::parse('2026-01-06 08:00:00');

        $quote = $this->pricing->quote(
            vehicle: $vehicle,
            pickup: $pickup,
            return: $return,
        );

        $this->assertEqualsWithDelta(400.0, $quote->baseAmount, 0.001);
        $this->assertEqualsWithDelta(0.0, $quote->mileageOverageAmount, 0.001);
        $this->assertEqualsWithDelta(400.0, $quote->totalAmount, 0.001);
    }

    public function test_quote_includes_extras_fuel_and_damage(): void
    {
        $vehicle = $this->makeVehicle(dailyRate: 80.0, kmPerDay: 100, excessKmRate: 0.35);

        $pickup = Carbon::parse('2026-01-01 08:00:00');
        $return = Carbon::parse('2026-01-02 08:00:00'); // 1 day

        $quote = $this->pricing->quote(
            vehicle: $vehicle,
            pickup: $pickup,
            return: $return,
            extras: ['GPS unit' => 10.0, 'Child seat' => 15.0],
            fuelCharge: 20.0,
            damageCharge: 50.0,
        );

        $this->assertEqualsWithDelta(80.0, $quote->baseAmount, 0.001);
        $this->assertEqualsWithDelta(25.0, $quote->extrasAmount, 0.001);
        $this->assertEqualsWithDelta(20.0, $quote->fuelCharge, 0.001);
        $this->assertEqualsWithDelta(50.0, $quote->damageCharge, 0.001);
        $this->assertEqualsWithDelta(175.0, $quote->totalAmount, 0.001);
    }

    public function test_quote_rounds_up_partial_day(): void
    {
        $vehicle = $this->makeVehicle(dailyRate: 80.0, kmPerDay: 100, excessKmRate: 0.35);

        $pickup = Carbon::parse('2026-01-01 08:00:00');
        $return = Carbon::parse('2026-01-02 10:00:00'); // 26 hours → 2 days

        $quote = $this->pricing->quote(vehicle: $vehicle, pickup: $pickup, return: $return);

        $this->assertSame(2, $quote->rentalDays);
        $this->assertEqualsWithDelta(160.0, $quote->baseAmount, 0.001);
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private function makeVehicle(float $dailyRate, int $kmPerDay, float $excessKmRate): Vehicle
    {
        $category = new BookingCategory;
        $category->km_per_day_limit = $kmPerDay;
        $category->excess_km_rate = $excessKmRate;
        $category->security_deposit = 0;
        $category->fuel_charge_per_level = 0;
        $category->currency = Currency::USD;

        $vehicle = new Vehicle;
        $vehicle->daily_rate = $dailyRate;
        $vehicle->currency = Currency::USD;
        $vehicle->setRelation('bookingCategory', $category);

        return $vehicle;
    }
}
