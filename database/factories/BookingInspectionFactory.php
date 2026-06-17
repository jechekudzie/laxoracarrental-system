<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\InspectionType;
use App\Models\Booking;
use App\Models\BookingInspection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BookingInspection>
 */
class BookingInspectionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'booking_id' => Booking::factory(),
            'inspector_user_id' => null,
            'type' => InspectionType::Pickup,
            'odometer' => fake()->numberBetween(10_000, 200_000),
            'fuel_level' => fake()->randomElement(['empty', 'quarter', 'half', 'three_quarter', 'full']),
            'items' => collect(config('inspections.items'))
                ->map(fn ($i) => [
                    'key' => $i['key'],
                    'label' => $i['label'],
                    'condition' => 'ok',
                    'notes' => null,
                ])->all(),
            'photos' => null,
            'exterior_notes' => null,
            'interior_notes' => null,
            'damage_summary' => null,
            'signed_by_customer' => true,
            'customer_signature_name' => fake()->name(),
            'signed_at' => now(),
        ];
    }

    public function type(InspectionType $type): static
    {
        return $this->state(fn () => ['type' => $type]);
    }
}
