<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $methods = [
            [
                'code' => 'cash',
                'name' => 'Cash',
                'description' => 'Physical cash payment',
                'is_active' => true,
                'sort_order' => 0,
            ],
            [
                'code' => 'bank_transfer',
                'name' => 'Bank Transfer',
                'description' => 'Direct bank transfer (RTGS, ZIPIT)',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'code' => 'ecocash',
                'name' => 'EcoCash',
                'description' => 'Mobile money via Econet EcoCash',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'code' => 'onemoney',
                'name' => 'OneMoney',
                'description' => 'Mobile money via NetOne OneMoney',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'code' => 'telecash',
                'name' => 'TeleCash',
                'description' => 'Mobile money via Telecel TeleCash',
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'code' => 'mukuru',
                'name' => 'Mukuru',
                'description' => 'Mukuru remittance transfer',
                'is_active' => true,
                'sort_order' => 5,
            ],
            [
                'code' => 'zimswitch',
                'name' => 'ZimSwitch',
                'description' => 'ZimSwitch POS/card payment',
                'is_active' => true,
                'sort_order' => 6,
            ],
            [
                'code' => 'visa',
                'name' => 'Visa/Mastercard',
                'description' => 'International card payment',
                'is_active' => true,
                'sort_order' => 7,
            ],
            [
                'code' => 'cheque',
                'name' => 'Cheque',
                'description' => 'Bank cheque payment',
                'is_active' => true,
                'sort_order' => 8,
            ],
        ];

        foreach ($methods as $data) {
            PaymentMethod::updateOrCreate(
                ['code' => $data['code']],
                $data,
            );
        }
    }
}
