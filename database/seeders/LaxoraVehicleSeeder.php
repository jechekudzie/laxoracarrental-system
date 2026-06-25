<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Vehicle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LaxoraVehicleSeeder extends Seeder
{
    public function run(): void
    {
        // Cascade-truncate removes vehicles and all dependent rows (bookings, maintenance, etc.)
        DB::statement('TRUNCATE TABLE vehicles RESTART IDENTITY CASCADE');

        $vehicles = [
            [
                'make' => 'Toyota',
                'model' => 'Hilux Silver',
                'year' => 2022,
                'colour' => 'Silver',
                'reg_plate' => 'AHH 3532',
                'category' => 'bakkie',
                'fuel_type' => 'diesel',
                'transmission' => 'automatic',
                'seats' => 5,
                'daily_rate' => 80.00,
                'status' => 'available',
            ],
            [
                'make' => 'Toyota',
                'model' => 'Hilux Rocco',
                'year' => 2023,
                'colour' => 'Black',
                'reg_plate' => 'AGX 4277',
                'category' => 'bakkie',
                'fuel_type' => 'diesel',
                'transmission' => 'automatic',
                'seats' => 5,
                'daily_rate' => 90.00,
                'status' => 'available',
            ],
            [
                'make' => 'Toyota',
                'model' => 'Fortuner',
                'year' => 2022,
                'colour' => 'Black',
                'reg_plate' => 'AGT 8832',
                'category' => 'suv',
                'fuel_type' => 'diesel',
                'transmission' => 'automatic',
                'seats' => 7,
                'daily_rate' => 100.00,
                'status' => 'available',
            ],
            [
                'make' => 'Toyota',
                'model' => 'Fortuner',
                'year' => 2023,
                'colour' => 'White',
                'reg_plate' => 'AGY 1116',
                'category' => 'suv',
                'fuel_type' => 'diesel',
                'transmission' => 'automatic',
                'seats' => 7,
                'daily_rate' => 100.00,
                'status' => 'available',
            ],
            [
                'make' => 'Toyota',
                'model' => 'Fortuner',
                'year' => 2021,
                'colour' => 'Silver',
                'reg_plate' => 'AGN 6401',
                'category' => 'suv',
                'fuel_type' => 'diesel',
                'transmission' => 'automatic',
                'seats' => 7,
                'daily_rate' => 95.00,
                'status' => 'available',
            ],
            [
                'make' => 'Toyota',
                'model' => 'Coaster',
                'year' => 2020,
                'colour' => 'White',
                'reg_plate' => 'AGL 7016',
                'category' => 'van',
                'fuel_type' => 'diesel',
                'transmission' => 'manual',
                'seats' => 30,
                'daily_rate' => 150.00,
                'status' => 'available',
            ],
            [
                'make' => 'Nissan',
                'model' => 'Bus',
                'year' => 2019,
                'colour' => 'White',
                'reg_plate' => 'AGJ 4541',
                'category' => 'van',
                'fuel_type' => 'diesel',
                'transmission' => 'manual',
                'seats' => 22,
                'daily_rate' => 130.00,
                'status' => 'available',
            ],
            [
                'make' => 'Honda',
                'model' => 'Hybrid',
                'year' => 2022,
                'colour' => 'Silver',
                'reg_plate' => 'AGW 5889',
                'category' => 'sedan',
                'fuel_type' => 'hybrid',
                'transmission' => 'automatic',
                'seats' => 5,
                'daily_rate' => 70.00,
                'status' => 'available',
            ],
        ];

        foreach ($vehicles as $data) {
            Vehicle::create(array_merge($data, [
                'currency' => 'USD',
                'km_per_day_limit' => 200,
                'excess_km_rate' => 0.35,
            ]));
        }

        $this->command->info('Created '.count($vehicles).' vehicles from the Laxora Vehicle Register.');
    }
}
