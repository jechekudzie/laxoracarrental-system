<?php

namespace Database\Factories;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employee>
 */
class EmployeeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'employee_number' => 'EMP-' . $this->faker->unique()->numerify('####'),
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'position' => $this->faker->jobTitle(),
            'employment_type' => 'full_time',
            'salary_type' => 'monthly',
            'base_salary' => $this->faker->randomFloat(2, 500, 5000),
            'hire_date' => $this->faker->dateTimeBetween('-3 years', '-1 month')->format('Y-m-d'),
            'is_active' => true,
        ];
    }
}
