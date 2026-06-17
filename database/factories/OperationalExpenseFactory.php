<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\OperationalExpense;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OperationalExpense>
 */
class OperationalExpenseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'category' => 'office_supplies',
            'description' => $this->faker->sentence(5),
            'amount' => $this->faker->randomFloat(2, 10, 500),
            'currency' => 'USD',
            'expense_date' => now()->toDateString(),
            'status' => 'pending',
        ];
    }
}
