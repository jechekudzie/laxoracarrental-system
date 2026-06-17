<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Currency;
use App\Models\BookingCategory;
use Illuminate\Database\Seeder;

class BookingCategorySeeder extends Seeder
{
    public function run(): void
    {
        $tiers = [
            [
                'slug' => 'small',
                'name' => 'Small Car',
                'description' => 'Honda Fit, Toyota Vitz, and similar city runabouts.',
                'security_deposit' => 150,
                'km_per_day_limit' => 200,
                'excess_km_rate' => 0.50,
                'fuel_charge_per_level' => 15,
                'sort_order' => 10,
            ],
            [
                'slug' => 'medium',
                'name' => 'Medium Sedan',
                'description' => 'Mid-size sedans like the Toyota Corolla or Mazda 3.',
                'security_deposit' => 300,
                'km_per_day_limit' => 250,
                'excess_km_rate' => 0.65,
                'fuel_charge_per_level' => 20,
                'sort_order' => 20,
            ],
            [
                'slug' => 'large',
                'name' => 'SUV / Bakkie',
                'description' => 'Fortuner, Hilux, Ranger, and similar 4x4s.',
                'security_deposit' => 500,
                'km_per_day_limit' => 250,
                'excess_km_rate' => 0.80,
                'fuel_charge_per_level' => 25,
                'sort_order' => 30,
            ],
            [
                'slug' => 'premium',
                'name' => 'Premium / Luxury',
                'description' => 'Land Cruiser, Prado, and premium sedans.',
                'security_deposit' => 1000,
                'km_per_day_limit' => 300,
                'excess_km_rate' => 1.20,
                'fuel_charge_per_level' => 35,
                'sort_order' => 40,
            ],
        ];

        foreach ($tiers as $tier) {
            BookingCategory::query()->updateOrCreate(
                ['slug' => $tier['slug']],
                [...$tier, 'currency' => Currency::USD, 'is_active' => true],
            );
        }
    }
}
