<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Requisition;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Requisition>
 */
class RequisitionFactory extends Factory
{
    public function definition(): array
    {
        $year = now()->format('Y');

        return [
            'number' => 'REQ-' . $year . '-' . $this->faker->unique()->numerify('####'),
            'requested_by' => User::factory(),
            'title' => $this->faker->sentence(4),
            'status' => 'draft',
            'priority' => 'normal',
            'total_estimated' => $this->faker->randomFloat(2, 100, 5000),
        ];
    }
}
