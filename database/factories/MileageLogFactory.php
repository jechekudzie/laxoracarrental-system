<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\MileageSource;
use App\Models\MileageLog;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MileageLog>
 */
class MileageLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'vehicle_id' => Vehicle::factory(),
            'booking_id' => null,
            'recorded_by_user_id' => null,
            'odometer_reading' => fake()->numberBetween(10_000, 200_000),
            'source' => MileageSource::Manual,
            'recorded_at' => now(),
            'notes' => null,
        ];
    }
}
