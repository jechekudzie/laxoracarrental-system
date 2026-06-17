<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Currency;
use App\Enums\CustomerStatus;
use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'sibs@laxora.co.zw'],
            [
                'name' => 'Sibs',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        // Sibs is a super-admin AND a customer so he can rent vehicles to himself.
        $admin->syncRoles([UserRole::SuperAdmin->value, UserRole::Customer->value]);

        // Sibs is the super-admin AND a real customer — he can rent vehicles to
        // himself, test the booking flow end-to-end, and the mobile customer app
        // works for his account too.
        Customer::updateOrCreate(
            ['user_id' => $admin->id],
            [
                'name' => 'Sibs',
                'email' => 'sibs@laxora.co.zw',
                'phone' => '+263 77 000 0001',
                'id_number' => '63-1000001-A-07',
                'address' => 'Laxora HQ, Harare',
                'licence_number' => 'DL000001',
                'licence_class' => 'Class 4',
                'licence_expiry' => now()->addYears(5)->toDateString(),
                'wallet_balance' => 0,
                'wallet_currency' => Currency::USD,
                'status' => CustomerStatus::Active,
            ],
        );

        // ZUURA Miles platform admin — super-admin + customer for the SaaS identity.
        $zuuraAdmin = User::updateOrCreate(
            ['email' => 'admin@zuuramiles.com'],
            [
                'name' => 'ZUURA Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        $zuuraAdmin->syncRoles([UserRole::SuperAdmin->value, UserRole::Customer->value]);

        Customer::updateOrCreate(
            ['user_id' => $zuuraAdmin->id],
            [
                'name' => 'ZUURA Admin',
                'email' => 'admin@zuuramiles.com',
                'phone' => '+263 77 000 0002',
                'id_number' => '63-1000002-Z-07',
                'address' => 'ZUURA HQ, Harare',
                'licence_number' => 'DL000002',
                'licence_class' => 'Class 4',
                'licence_expiry' => now()->addYears(5)->toDateString(),
                'wallet_balance' => 0,
                'wallet_currency' => Currency::USD,
                'status' => CustomerStatus::Active,
            ],
        );
    }
}
