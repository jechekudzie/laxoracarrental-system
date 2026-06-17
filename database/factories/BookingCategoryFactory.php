<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\Currency;
use App\Models\BookingCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BookingCategory>
 */
class BookingCategoryFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->randomElement([
            'Economy', 'Compact', 'Standard', 'Premium', 'SUV', 'Luxury',
        ]).' '.fake()->randomNumber(3);

        return [
            'name' => $name,
            'description' => fake()->sentence(),
            'security_deposit' => 150,
            'km_per_day_limit' => 200,
            'excess_km_rate' => 0.50,
            'fuel_charge_per_level' => 15,
            'currency' => Currency::USD,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    public function small(): static
    {
        return $this->state(fn () => [
            'name' => 'Small Car',
            'security_deposit' => 150,
            'km_per_day_limit' => 200,
            'excess_km_rate' => 0.50,
            'fuel_charge_per_level' => 15,
        ]);
    }

    public function large(): static
    {
        return $this->state(fn () => [
            'name' => 'Large / SUV',
            'security_deposit' => 500,
            'km_per_day_limit' => 250,
            'excess_km_rate' => 0.80,
            'fuel_charge_per_level' => 25,
        ]);
    }
}
