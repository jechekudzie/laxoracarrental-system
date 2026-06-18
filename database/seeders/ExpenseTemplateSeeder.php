<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\CostCenter;
use App\Models\ExpenseTemplate;
use Illuminate\Database\Seeder;

class ExpenseTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $cc = fn (string $code): ?int => CostCenter::where('code', $code)->first()?->id;

        $templates = [
            // utilities
            ['category' => 'utilities', 'description' => 'Water Bill', 'cost_center_code' => 'FIN-ADMIN', 'sort_order' => 0],
            ['category' => 'utilities', 'description' => 'Electricity', 'cost_center_code' => 'FIN-ADMIN', 'sort_order' => 1],
            ['category' => 'utilities', 'description' => 'Municipal Rates', 'cost_center_code' => 'FIN-ADMIN', 'sort_order' => 2],

            // it
            ['category' => 'it', 'description' => 'Internet Subscription', 'cost_center_code' => 'IT-SYSTEMS', 'sort_order' => 0],
            ['category' => 'it', 'description' => 'GPS Tracking Subscription', 'cost_center_code' => 'IT-SYSTEMS', 'sort_order' => 1],
            ['category' => 'it', 'description' => 'Domain & Hosting', 'cost_center_code' => 'IT-SYSTEMS', 'sort_order' => 2],
            ['category' => 'it', 'description' => 'Fleet Management Software', 'cost_center_code' => 'IT-SYSTEMS', 'sort_order' => 3],

            // transport
            ['category' => 'transport', 'description' => 'Fuel Purchase', 'cost_center_code' => 'FUEL-MGMT', 'sort_order' => 0],
            ['category' => 'transport', 'description' => 'Vehicle Licensing Fees', 'cost_center_code' => 'INSUR-LIC', 'sort_order' => 1],

            // repairs
            ['category' => 'repairs', 'description' => 'Engine Service', 'cost_center_code' => 'MAINT-MECH', 'sort_order' => 0],
            ['category' => 'repairs', 'description' => 'Tyre Replacement', 'cost_center_code' => 'MAINT-MECH', 'sort_order' => 1],
            ['category' => 'repairs', 'description' => 'Brake Pads & Discs', 'cost_center_code' => 'MAINT-MECH', 'sort_order' => 2],
            ['category' => 'repairs', 'description' => 'Suspension Repair', 'cost_center_code' => 'MAINT-MECH', 'sort_order' => 3],
            ['category' => 'repairs', 'description' => 'Windscreen Replacement', 'cost_center_code' => 'BODYWORK', 'sort_order' => 4],
            ['category' => 'repairs', 'description' => 'Panel Beating & Respray', 'cost_center_code' => 'BODYWORK', 'sort_order' => 5],

            // security
            ['category' => 'security', 'description' => 'Security Guard Services', 'cost_center_code' => 'SEC-TRACK', 'sort_order' => 0],
            ['category' => 'security', 'description' => 'CCTV Monitoring', 'cost_center_code' => 'SEC-TRACK', 'sort_order' => 1],

            // cleaning
            ['category' => 'cleaning', 'description' => 'Car Wash & Valet', 'cost_center_code' => 'CLEAN-VALET', 'sort_order' => 0],
            ['category' => 'cleaning', 'description' => 'Interior Cleaning Supplies', 'cost_center_code' => 'CLEAN-VALET', 'sort_order' => 1],

            // marketing
            ['category' => 'marketing', 'description' => 'Online Advertising', 'cost_center_code' => 'SALES-MKTG', 'sort_order' => 0],
            ['category' => 'marketing', 'description' => 'Platform Listing Fees', 'cost_center_code' => 'SALES-MKTG', 'sort_order' => 1],

            // office_supplies
            ['category' => 'office_supplies', 'description' => 'Stationery & Printing', 'cost_center_code' => 'FIN-ADMIN', 'sort_order' => 0],
            ['category' => 'office_supplies', 'description' => 'Office Equipment', 'cost_center_code' => 'FIN-ADMIN', 'sort_order' => 1],

            // accommodation
            ['category' => 'accommodation', 'description' => 'Airport Concession Fees', 'cost_center_code' => 'AIRPORT-OPS', 'sort_order' => 0],
        ];

        foreach ($templates as $data) {
            ExpenseTemplate::updateOrCreate(
                [
                    'category' => $data['category'],
                    'description' => $data['description'],
                ],
                [
                    'default_cost_center_id' => $cc($data['cost_center_code']),
                    'default_service_provider_id' => null,
                    'typical_amount' => null,
                    'is_active' => true,
                    'sort_order' => $data['sort_order'],
                ],
            );
        }
    }
}
