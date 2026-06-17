<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Enums\Currency;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    public function definition(): array
    {
        $pickup = fake()->dateTimeBetween('+1 day', '+10 days');
        $returnAt = (clone $pickup)->modify('+'.fake()->numberBetween(2, 7).' days');
        $days = max(1, (int) ceil(($returnAt->getTimestamp() - $pickup->getTimestamp()) / 86400));
        $dailyRate = 80.00;
        $kmAllowance = $days * 200;
        $baseAmount = $days * $dailyRate;

        return [
            'reference' => 'BK-'.strtoupper(Str::random(8)),
            'customer_id' => Customer::factory(),
            'vehicle_id' => Vehicle::factory(),
            'created_by_user_id' => null,
            'pickup_datetime' => $pickup,
            'return_datetime' => $returnAt,
            'actual_pickup_at' => null,
            'actual_return_at' => null,
            'odometer_start' => null,
            'odometer_end' => null,
            'rental_days' => $days,
            'km_allowance' => $kmAllowance,
            'daily_rate' => $dailyRate,
            'excess_km_rate' => 0.35,
            'currency' => Currency::USD,
            'base_amount' => $baseAmount,
            'mileage_overage_amount' => 0,
            'extras_amount' => 0,
            'fuel_charge' => 0,
            'damage_charge' => 0,
            'tax_amount' => 0,
            'total_amount' => $baseAmount,
            'deposit_amount' => 0,
            'paid_amount' => 0,
            'extras' => null,
            'pickup_location' => 'Harare Office',
            'return_location' => 'Harare Office',
            'fuel_level_pickup' => null,
            'fuel_level_return' => null,
            'cross_border' => false,
            'cross_border_countries' => null,
            'status' => BookingStatus::Pending,
            'cancellation_reason' => null,
            'notes' => null,
        ];
    }

    public function status(BookingStatus $status): static
    {
        return $this->state(fn () => ['status' => $status]);
    }
}
