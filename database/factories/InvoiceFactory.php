<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\Currency;
use App\Enums\InvoiceStatus;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Invoice;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 200, 1000);

        return [
            'number' => 'INV-'.fake()->unique()->numerify('######'),
            'booking_id' => Booking::factory(),
            'customer_id' => Customer::factory(),
            'issued_at' => now()->toDateString(),
            'due_at' => now()->addDays(14)->toDateString(),
            'subtotal' => $subtotal,
            'mileage_overage' => 0,
            'fuel_charge' => 0,
            'extras' => 0,
            'damage_charge' => 0,
            'tax' => 0,
            'total' => $subtotal,
            'paid_amount' => 0,
            'currency' => Currency::USD,
            'line_items' => null,
            'status' => InvoiceStatus::Draft,
            'notes' => null,
        ];
    }
}
