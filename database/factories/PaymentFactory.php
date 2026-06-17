<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\Currency;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Customer;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'reference' => 'PAY-'.strtoupper(Str::random(10)),
            'invoice_id' => null,
            'booking_id' => null,
            'customer_id' => Customer::factory(),
            'recorded_by_user_id' => null,
            'amount' => fake()->randomFloat(2, 50, 500),
            'currency' => Currency::USD,
            'method' => PaymentMethod::EcoCash,
            'gateway' => null,
            'gateway_reference' => null,
            'paynow_poll_url' => null,
            'status' => PaymentStatus::Completed,
            'paid_at' => now(),
            'notes' => null,
        ];
    }
}
