<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\Currency;
use App\Enums\MaintenanceType;
use App\Models\MaintenanceRecord;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MaintenanceRecord>
 */
class MaintenanceRecordFactory extends Factory
{
    public function definition(): array
    {
        $labour = fake()->randomFloat(2, 20, 200);
        $parts = fake()->randomFloat(2, 30, 400);

        return [
            'vehicle_id' => Vehicle::factory(),
            'recorded_by_user_id' => null,
            'type' => MaintenanceType::Scheduled,
            'service_type' => fake()->randomElement(['Oil Change', 'Brake Pads', 'Tyres', 'Full Service']),
            'description' => fake()->sentence(),
            'odometer' => fake()->numberBetween(10_000, 200_000),
            'service_provider' => fake()->company(),
            'labour_cost' => $labour,
            'parts_cost' => $parts,
            'tow_cost' => 0,
            'total_cost' => $labour + $parts,
            'currency' => Currency::USD,
            'downtime_days' => fake()->numberBetween(0, 3),
            'insurance_claim_ref' => null,
            'police_report_ref' => null,
            'customer_liable' => false,
            'started_at' => now()->subDays(2),
            'completed_at' => now()->subDay(),
            'notes' => null,
        ];
    }
}
