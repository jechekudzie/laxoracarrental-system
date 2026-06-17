<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\CommissionType;
use App\Models\VehicleOwner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VehicleOwner>
 */
class VehicleOwnerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'phone' => '+2637'.fake()->numerify('########'),
            'email' => fake()->unique()->safeEmail(),
            'national_id' => fake()->numerify('##-#######-?-##'),
            'address' => fake()->address(),
            'bank_details' => null,
            'agreed_daily_rate' => fake()->randomFloat(2, 30, 90),
            'commission_type' => CommissionType::Percentage,
            'commission_value' => fake()->randomFloat(2, 10, 25),
            'notes' => null,
        ];
    }
}
