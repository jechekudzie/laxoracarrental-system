<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\Currency;
use App\Enums\CustomerStatus;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => null,
            'name' => fake()->name(),
            'id_number' => fake()->numerify('##-#######-?-##'),
            'phone' => '+2637'.fake()->numerify('########'),
            'email' => fake()->unique()->safeEmail(),
            'address' => fake()->address(),
            'licence_number' => strtoupper(fake()->bothify('?#######')),
            'licence_class' => fake()->randomElement(['Class 4', 'Class 2']),
            'licence_expiry' => fake()->dateTimeBetween('+6 months', '+5 years'),
            'emergency_contact_name' => fake()->name(),
            'emergency_contact_phone' => '+2637'.fake()->numerify('########'),
            'wallet_balance' => 0,
            'wallet_currency' => Currency::USD,
            'status' => CustomerStatus::Active,
            'blacklist_reason' => null,
            'notes' => null,
        ];
    }

    public function blacklisted(): static
    {
        return $this->state(fn () => [
            'status' => CustomerStatus::Blacklisted,
            'blacklist_reason' => 'Non-payment',
        ]);
    }
}
