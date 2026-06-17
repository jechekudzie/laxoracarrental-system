<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Currency;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Enums\VehicleCategory;
use App\Enums\VehicleStatus;
use App\Models\BookingCategory;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;

class VehicleSeeder extends Seeder
{
    public function run(): void
    {
        $vehicles = [
            // Economy / Small hatchbacks
            [
                'make' => 'Honda',
                'model' => 'Fit',
                'year' => 2019,
                'colour' => 'Silver',
                'reg_plate' => 'ABE 2301',
                'category' => VehicleCategory::Hatchback,
                'fuel_type' => FuelType::Petrol,
                'transmission' => Transmission::Automatic,
                'seats' => 5,
                'daily_rate' => 45.00,
                'km_per_day_limit' => 200,
                'excess_km_rate' => 0.20,
                'current_odometer' => 62400,
            ],
            [
                'make' => 'Honda',
                'model' => 'Fit',
                'year' => 2020,
                'colour' => 'White',
                'reg_plate' => 'ACD 4182',
                'category' => VehicleCategory::Hatchback,
                'fuel_type' => FuelType::Petrol,
                'transmission' => Transmission::Automatic,
                'seats' => 5,
                'daily_rate' => 50.00,
                'km_per_day_limit' => 200,
                'excess_km_rate' => 0.20,
                'current_odometer' => 38900,
            ],
            [
                'make' => 'Toyota',
                'model' => 'Vitz',
                'year' => 2018,
                'colour' => 'Blue',
                'reg_plate' => 'AAR 7754',
                'category' => VehicleCategory::Hatchback,
                'fuel_type' => FuelType::Petrol,
                'transmission' => Transmission::Automatic,
                'seats' => 5,
                'daily_rate' => 40.00,
                'km_per_day_limit' => 200,
                'excess_km_rate' => 0.20,
                'current_odometer' => 84300,
            ],
            // Mid-range sedans
            [
                'make' => 'Toyota',
                'model' => 'Corolla',
                'year' => 2021,
                'colour' => 'Silver',
                'reg_plate' => 'ACM 1205',
                'category' => VehicleCategory::Sedan,
                'fuel_type' => FuelType::Petrol,
                'transmission' => Transmission::Automatic,
                'seats' => 5,
                'daily_rate' => 70.00,
                'km_per_day_limit' => 250,
                'excess_km_rate' => 0.30,
                'current_odometer' => 31800,
            ],
            [
                'make' => 'Honda',
                'model' => 'Civic',
                'year' => 2020,
                'colour' => 'Black',
                'reg_plate' => 'ACP 4488',
                'category' => VehicleCategory::Sedan,
                'fuel_type' => FuelType::Petrol,
                'transmission' => Transmission::Automatic,
                'seats' => 5,
                'daily_rate' => 75.00,
                'km_per_day_limit' => 250,
                'excess_km_rate' => 0.30,
                'current_odometer' => 52400,
            ],
            [
                'make' => 'Toyota',
                'model' => 'Camry',
                'year' => 2022,
                'colour' => 'Pearl White',
                'reg_plate' => 'AEF 2277',
                'category' => VehicleCategory::Sedan,
                'fuel_type' => FuelType::Petrol,
                'transmission' => Transmission::Automatic,
                'seats' => 5,
                'daily_rate' => 95.00,
                'km_per_day_limit' => 250,
                'excess_km_rate' => 0.35,
                'current_odometer' => 18600,
            ],
            [
                'make' => 'Toyota',
                'model' => 'Rush',
                'year' => 2021,
                'colour' => 'White',
                'reg_plate' => 'ADK 9901',
                'category' => VehicleCategory::SUV,
                'fuel_type' => FuelType::Petrol,
                'transmission' => Transmission::Automatic,
                'seats' => 7,
                'daily_rate' => 65.00,
                'km_per_day_limit' => 250,
                'excess_km_rate' => 0.25,
                'current_odometer' => 29100,
            ],
            // Mid-range SUVs
            [
                'make' => 'Toyota',
                'model' => 'RAV4',
                'year' => 2020,
                'colour' => 'Pearl White',
                'reg_plate' => 'ABN 5566',
                'category' => VehicleCategory::SUV,
                'fuel_type' => FuelType::Petrol,
                'transmission' => Transmission::Automatic,
                'seats' => 5,
                'daily_rate' => 85.00,
                'km_per_day_limit' => 300,
                'excess_km_rate' => 0.30,
                'current_odometer' => 44200,
            ],
            [
                'make' => 'Mazda',
                'model' => 'CX-5',
                'year' => 2021,
                'colour' => 'Titanium Flash',
                'reg_plate' => 'ACT 1138',
                'category' => VehicleCategory::SUV,
                'fuel_type' => FuelType::Petrol,
                'transmission' => Transmission::Automatic,
                'seats' => 5,
                'daily_rate' => 90.00,
                'km_per_day_limit' => 300,
                'excess_km_rate' => 0.30,
                'current_odometer' => 31700,
            ],
            // Large SUVs / 4x4s
            [
                'make' => 'Toyota',
                'model' => 'Fortuner',
                'year' => 2022,
                'colour' => 'White',
                'reg_plate' => 'ACG 8823',
                'category' => VehicleCategory::SUV,
                'fuel_type' => FuelType::Diesel,
                'transmission' => Transmission::Automatic,
                'seats' => 7,
                'daily_rate' => 130.00,
                'km_per_day_limit' => 350,
                'excess_km_rate' => 0.40,
                'current_odometer' => 51200,
            ],
            [
                'make' => 'Toyota',
                'model' => 'Fortuner',
                'year' => 2023,
                'colour' => 'Black',
                'reg_plate' => 'ADM 3347',
                'category' => VehicleCategory::SUV,
                'fuel_type' => FuelType::Diesel,
                'transmission' => Transmission::Automatic,
                'seats' => 7,
                'daily_rate' => 150.00,
                'km_per_day_limit' => 350,
                'excess_km_rate' => 0.40,
                'current_odometer' => 18400,
            ],
            [
                'make' => 'Toyota',
                'model' => 'Land Cruiser Prado',
                'year' => 2021,
                'colour' => 'Silver',
                'reg_plate' => 'ACW 6612',
                'category' => VehicleCategory::SUV,
                'fuel_type' => FuelType::Diesel,
                'transmission' => Transmission::Automatic,
                'seats' => 7,
                'daily_rate' => 200.00,
                'km_per_day_limit' => 400,
                'excess_km_rate' => 0.50,
                'current_odometer' => 67800,
            ],
            [
                'make' => 'Nissan',
                'model' => 'Patrol',
                'year' => 2020,
                'colour' => 'White',
                'reg_plate' => 'ABV 4490',
                'category' => VehicleCategory::SUV,
                'fuel_type' => FuelType::Diesel,
                'transmission' => Transmission::Automatic,
                'seats' => 8,
                'daily_rate' => 180.00,
                'km_per_day_limit' => 400,
                'excess_km_rate' => 0.45,
                'current_odometer' => 55600,
            ],
            // Bakkies / Pick-ups
            [
                'make' => 'Toyota',
                'model' => 'Hilux',
                'year' => 2022,
                'colour' => 'White',
                'reg_plate' => 'ACV 7720',
                'category' => VehicleCategory::Bakkie,
                'fuel_type' => FuelType::Diesel,
                'transmission' => Transmission::Manual,
                'seats' => 5,
                'daily_rate' => 110.00,
                'km_per_day_limit' => 350,
                'excess_km_rate' => 0.35,
                'current_odometer' => 42300,
            ],
            [
                'make' => 'Mitsubishi',
                'model' => 'L200 Triton',
                'year' => 2021,
                'colour' => 'Red',
                'reg_plate' => 'ACB 9934',
                'category' => VehicleCategory::Bakkie,
                'fuel_type' => FuelType::Diesel,
                'transmission' => Transmission::Manual,
                'seats' => 5,
                'daily_rate' => 100.00,
                'km_per_day_limit' => 350,
                'excess_km_rate' => 0.35,
                'current_odometer' => 38100,
            ],
            // Vans / People movers
            [
                'make' => 'Toyota',
                'model' => 'Hiace',
                'year' => 2019,
                'colour' => 'White',
                'reg_plate' => 'AAZ 5571',
                'category' => VehicleCategory::Van,
                'fuel_type' => FuelType::Diesel,
                'transmission' => Transmission::Manual,
                'seats' => 14,
                'daily_rate' => 120.00,
                'km_per_day_limit' => 300,
                'excess_km_rate' => 0.35,
                'current_odometer' => 118400,
            ],
            // Premium / Luxury — explicitly overridden to the `premium` tier
            [
                'make' => 'Toyota',
                'model' => 'Land Cruiser Prado',
                'year' => 2022,
                'colour' => 'Pearl White',
                'reg_plate' => 'AEK 8800',
                'category' => VehicleCategory::SUV,
                'fuel_type' => FuelType::Diesel,
                'transmission' => Transmission::Automatic,
                'seats' => 7,
                'daily_rate' => 220.00,
                'km_per_day_limit' => 300,
                'excess_km_rate' => 0.80,
                'current_odometer' => 24500,
                'booking_slug' => 'premium',
            ],
            [
                'make' => 'Toyota',
                'model' => 'Land Cruiser 70',
                'year' => 2023,
                'colour' => 'Sandstone',
                'reg_plate' => 'AEL 3300',
                'category' => VehicleCategory::SUV,
                'fuel_type' => FuelType::Diesel,
                'transmission' => Transmission::Manual,
                'seats' => 5,
                'daily_rate' => 250.00,
                'km_per_day_limit' => 300,
                'excess_km_rate' => 0.90,
                'current_odometer' => 8200,
                'booking_slug' => 'premium',
            ],
        ];

        $categoryMap = [
            VehicleCategory::Hatchback->value => 'small',
            VehicleCategory::Sedan->value => 'medium',
            VehicleCategory::SUV->value => 'large',
            VehicleCategory::Truck->value => 'large',
            VehicleCategory::Bakkie->value => 'large',
            VehicleCategory::Van->value => 'large',
        ];

        $bookingCategories = BookingCategory::query()
            ->whereIn('slug', ['small', 'medium', 'large', 'premium'])
            ->get()
            ->keyBy('slug');

        foreach ($vehicles as $vehicle) {
            // Per-vehicle override (e.g. premium) takes precedence over body-type mapping.
            $slug = $vehicle['booking_slug'] ?? $categoryMap[$vehicle['category']->value] ?? 'medium';
            unset($vehicle['booking_slug']);

            Vehicle::firstOrCreate(
                ['reg_plate' => $vehicle['reg_plate']],
                array_merge($vehicle, [
                    'status' => VehicleStatus::Available,
                    'currency' => Currency::USD,
                    'vin' => null,
                    'notes' => null,
                    'booking_category_id' => $bookingCategories[$slug]?->id,
                ])
            );
        }
    }
}
