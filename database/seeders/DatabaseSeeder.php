<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            AdminUserSeeder::class,
            BookingCategorySeeder::class,
            VehicleSeeder::class,
            CostCenterSeeder::class,
            PaymentMethodSeeder::class,
            ExpenseTemplateSeeder::class,
            DemoDataSeeder::class,
        ]);
    }
}
