<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\CostCategory;
use App\Enums\Currency;
use App\Models\Vehicle;
use App\Models\VehicleCost;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VehicleCost>
 */
class VehicleCostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'vehicle_id' => Vehicle::factory(),
            'booking_id' => null,
            'recorded_by_user_id' => null,
            'category' => fake()->randomElement(CostCategory::cases()),
            'description' => fake()->sentence(),
            'amount' => fake()->randomFloat(2, 10, 500),
            'currency' => Currency::USD,
            'vendor_name' => fake()->company(),
            'vendor_phone' => '+2637'.fake()->numerify('########'),
            'odometer' => fake()->numberBetween(10_000, 200_000),
            'incident_date' => now()->subDays(fake()->numberBetween(0, 90))->toDateString(),
            'notes' => null,
        ];
    }
}
