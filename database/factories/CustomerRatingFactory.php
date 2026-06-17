<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\CustomerRating;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CustomerRating>
 */
class CustomerRatingFactory extends Factory
{
    public function definition(): array
    {
        $scores = [
            'score_condition' => fake()->numberBetween(1, 5),
            'score_timeliness' => fake()->numberBetween(1, 5),
            'score_payment' => fake()->numberBetween(1, 5),
            'score_communication' => fake()->numberBetween(1, 5),
            'score_care' => fake()->numberBetween(1, 5),
        ];

        return [
            'customer_id' => Customer::factory(),
            'booking_id' => Booking::factory(),
            'rated_by_user_id' => null,
            ...$scores,
            'average' => CustomerRating::computeAverage(...array_values($scores)),
            'comment' => fake()->optional()->sentence(),
        ];
    }
}
