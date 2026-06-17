<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Quotation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Quotation>
 */
class QuotationFactory extends Factory
{
    public function definition(): array
    {
        $year = now()->format('Y');

        return [
            'number' => 'QT-' . $year . '-' . $this->faker->unique()->numerify('####'),
            'created_by' => User::factory(),
            'issued_at' => now()->toDateString(),
            'valid_until' => now()->addDays(30)->toDateString(),
            'status' => 'draft',
            'subtotal' => 0,
            'tax' => 0,
            'discount' => 0,
            'total' => 0,
            'currency' => 'USD',
        ];
    }
}
