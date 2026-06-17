<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\Currency;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Enums\VehicleCategory;
use App\Enums\VehicleOwnershipType;
use App\Enums\VehicleStatus;
use App\Models\BookingCategory;
use App\Models\Vehicle;
use App\Models\VehicleOwner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Vehicle>
 */
class VehicleFactory extends Factory
{
    public function definition(): array
    {
        $makes = [
            'Toyota' => ['Fortuner', 'Hilux', 'Corolla', 'Land Cruiser', 'Hiace'],
            'Nissan' => ['Navara', 'X-Trail', 'Patrol'],
            'Ford' => ['Ranger', 'Everest'],
            'Mazda' => ['BT-50', 'CX-5'],
            'Isuzu' => ['D-Max', 'MU-X'],
        ];
        $make = fake()->randomElement(array_keys($makes));
        $model = fake()->randomElement($makes[$make]);

        return [
            'make' => $make,
            'model' => $model,
            'year' => fake()->numberBetween(2015, 2025),
            'colour' => fake()->randomElement(['White', 'Silver', 'Black', 'Grey', 'Blue']),
            'reg_plate' => strtoupper(fake()->unique()->bothify('A??####')),
            'vin' => strtoupper(fake()->unique()->bothify('?#?#?#?#?#?#?#?#?')),
            'category' => fake()->randomElement(VehicleCategory::cases()),
            'booking_category_id' => BookingCategory::factory(),
            'fuel_type' => fake()->randomElement([FuelType::Petrol, FuelType::Diesel]),
            'transmission' => fake()->randomElement(Transmission::cases()),
            'seats' => fake()->randomElement([4, 5, 7]),

            'ownership_type' => VehicleOwnershipType::Owned,
            'vehicle_owner_id' => null,
            'owner_agreed_rate' => null,
            'owner_markup_percent' => null,

            'daily_rate' => fake()->randomFloat(2, 50, 120),
            'weekly_rate' => null,
            'monthly_rate' => null,
            'currency' => Currency::USD,

            'km_per_day_limit' => 200,
            'excess_km_rate' => 0.35,

            'status' => VehicleStatus::Available,
            'current_odometer' => fake()->numberBetween(10_000, 150_000),

            'service_interval_km' => 10000,
            'service_interval_months' => 6,
            'last_service_odometer' => null,
            'last_service_date' => null,

            'photos' => null,
            'notes' => null,
        ];
    }

    public function outsourced(?VehicleOwner $owner = null): static
    {
        return $this->state(fn () => [
            'ownership_type' => VehicleOwnershipType::Outsourced,
            'vehicle_owner_id' => $owner?->id ?? VehicleOwner::factory(),
            'owner_agreed_rate' => fake()->randomFloat(2, 30, 80),
            'owner_markup_percent' => fake()->randomFloat(2, 10, 25),
        ]);
    }

    public function status(VehicleStatus $status): static
    {
        return $this->state(fn () => ['status' => $status]);
    }
}
