<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ServiceProvider;
use App\Models\ServiceProviderPayment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServiceProviderPayment>
 */
class ServiceProviderPaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'service_provider_id' => ServiceProvider::factory(),
            'description' => $this->faker->sentence(4),
            'amount' => $this->faker->randomFloat(2, 100, 5000),
            'currency' => 'USD',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'pending',
        ];
    }
}
