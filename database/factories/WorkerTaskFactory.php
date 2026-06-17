<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\User;
use App\Models\WorkerTask;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkerTask>
 */
class WorkerTaskFactory extends Factory
{
    public function definition(): array
    {
        return [
            'assigned_by' => User::factory(),
            'title' => $this->faker->sentence(4),
            'priority' => 'normal',
            'status' => 'pending',
        ];
    }
}
