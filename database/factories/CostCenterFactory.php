<?php

namespace Database\Factories;

use App\Models\CostCenter;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CostCenter>
 */
class CostCenterFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper($this->faker->unique()->lexify('???-###')),
            'name' => $this->faker->words(2, true),
            'description' => $this->faker->optional()->sentence(),
            'budget_amount' => $this->faker->randomFloat(2, 1000, 50000),
            'is_active' => true,
        ];
    }
}
