<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Employee;
use App\Models\Salary;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Salary>
 */
class SalaryFactory extends Factory
{
    public function definition(): array
    {
        $basic = $this->faker->randomFloat(2, 500, 3000);

        return [
            'employee_id' => Employee::factory(),
            'period_start' => now()->startOfMonth()->toDateString(),
            'period_end' => now()->endOfMonth()->toDateString(),
            'basic_salary' => $basic,
            'gross_salary' => $basic,
            'net_salary' => $basic,
            'status' => 'pending',
        ];
    }
}
