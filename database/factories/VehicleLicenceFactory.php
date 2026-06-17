<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\Currency;
use App\Enums\LicenceType;
use App\Models\Vehicle;
use App\Models\VehicleLicence;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VehicleLicence>
 */
class VehicleLicenceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'vehicle_id' => Vehicle::factory(),
            'type' => LicenceType::Zinara,
            'label' => 'ZINARA Licence',
            'document_number' => strtoupper(fake()->bothify('ZIN-######')),
            'provider' => 'ZINARA',
            'issue_date' => now()->subMonths(fake()->numberBetween(1, 11))->toDateString(),
            'expiry_date' => now()->addMonths(fake()->numberBetween(1, 11))->toDateString(),
            'cost' => fake()->randomFloat(2, 50, 200),
            'currency' => Currency::USD,
            'cover_amount' => null,
            'cover_type' => null,
            'notes' => null,
        ];
    }

    public function type(LicenceType $type): static
    {
        return $this->state(fn () => [
            'type' => $type,
            'label' => ucfirst($type->value),
        ]);
    }

    public function expiringIn(int $days): static
    {
        return $this->state(fn () => [
            'expiry_date' => now()->addDays($days)->toDateString(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'expiry_date' => now()->subDays(fake()->numberBetween(1, 30))->toDateString(),
        ]);
    }
}
