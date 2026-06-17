<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\CostCenter;
use Illuminate\Database\Seeder;

class CostCenterSeeder extends Seeder
{
    public function run(): void
    {
        $costCenters = [
            [
                'code' => 'FLEET-OPS',
                'name' => 'Fleet Operations',
                'description' => 'Manages vehicle acquisition, utilisation tracking, licensing renewals, and overall fleet performance. The beating heart of the rental business.',
                'budget_amount' => 85_000.00,
                'is_active' => true,
            ],
            [
                'code' => 'MAINT-MECH',
                'name' => 'Maintenance & Repairs',
                'description' => 'Covers all mechanical servicing, tyre replacements, oil changes, brake jobs, and major repairs across the fleet. Keeps vehicles roadworthy and legally compliant.',
                'budget_amount' => 60_000.00,
                'is_active' => true,
            ],
            [
                'code' => 'BODYWORK',
                'name' => 'Bodywork & Panel Beating',
                'description' => 'Handles accident damage repairs, panel beating, spray painting, windscreen replacements, and cosmetic restoration. Ensures every vehicle looks presentable for customers.',
                'budget_amount' => 25_000.00,
                'is_active' => true,
            ],
            [
                'code' => 'FUEL-MGMT',
                'name' => 'Fuel Management',
                'description' => 'Tracks fuel purchases, fuel cards, consumption per vehicle, and investigates anomalies. Fuel is one of the highest recurring costs in car rental.',
                'budget_amount' => 45_000.00,
                'is_active' => true,
            ],
            [
                'code' => 'CLEAN-VALET',
                'name' => 'Cleaning & Valeting',
                'description' => 'Covers interior deep cleans, exterior washes, odour treatments, and full valets before and after each rental. Critical for customer satisfaction and asset presentation.',
                'budget_amount' => 12_000.00,
                'is_active' => true,
            ],
            [
                'code' => 'SALES-MKTG',
                'name' => 'Sales & Marketing',
                'description' => 'Online advertising, booking platform listings (Google, TripAdvisor, Expedia), social media, promotional campaigns, and corporate account acquisition.',
                'budget_amount' => 30_000.00,
                'is_active' => true,
            ],
            [
                'code' => 'CUST-SVC',
                'name' => 'Customer Service',
                'description' => 'Call centre operations, complaint handling, airport transfer coordination, roadside assistance call-outs, and loyalty programme administration.',
                'budget_amount' => 18_000.00,
                'is_active' => true,
            ],
            [
                'code' => 'INSUR-LIC',
                'name' => 'Insurance & Licensing',
                'description' => 'Vehicle insurance premiums, third-party liability cover, ZRP licensing fees, ZINARA road levies, and regulatory compliance costs.',
                'budget_amount' => 40_000.00,
                'is_active' => true,
            ],
            [
                'code' => 'HR-STAFF',
                'name' => 'Human Resources',
                'description' => 'Staff recruitment, onboarding, training (defensive driving, customer service), staff welfare, NSSA contributions, uniforms, and HR administration.',
                'budget_amount' => 22_000.00,
                'is_active' => true,
            ],
            [
                'code' => 'FIN-ADMIN',
                'name' => 'Finance & Administration',
                'description' => 'Bookkeeping, external audit fees, banking charges, office stationery, insurance reconciliations, and general accounting operations.',
                'budget_amount' => 20_000.00,
                'is_active' => true,
            ],
            [
                'code' => 'IT-SYSTEMS',
                'name' => 'IT & Technology',
                'description' => 'Fleet management software, GPS tracking subscriptions, booking system hosting, website maintenance, cybersecurity tools, and hardware procurement.',
                'budget_amount' => 15_000.00,
                'is_active' => true,
            ],
            [
                'code' => 'SEC-TRACK',
                'name' => 'Security & Tracking',
                'description' => 'On-site security guards, CCTV monitoring, immobiliser installations, live GPS tracking top-ups, and vehicle recovery coordination after theft incidents.',
                'budget_amount' => 14_000.00,
                'is_active' => true,
            ],
            [
                'code' => 'BRANCH-HRR',
                'name' => 'Harare Branch',
                'description' => 'Operational costs for the Harare branch — rent, utilities, office consumables, and counter staff. Primary revenue-generating location.',
                'budget_amount' => 28_000.00,
                'is_active' => true,
            ],
            [
                'code' => 'BRANCH-BLW',
                'name' => 'Bulawayo Branch',
                'description' => 'Operational costs for the Bulawayo satellite branch — rent, counter staff, and utility bills.',
                'budget_amount' => 16_000.00,
                'is_active' => true,
            ],
            [
                'code' => 'AIRPORT-OPS',
                'name' => 'Airport Operations',
                'description' => 'RGM Airport concession fees, airport counter rental, shuttle vehicle running costs, and meet-and-greet staff. High-value pickup/drop-off point.',
                'budget_amount' => 20_000.00,
                'is_active' => true,
            ],
        ];

        foreach ($costCenters as $data) {
            CostCenter::updateOrCreate(
                ['code' => $data['code']],
                $data,
            );
        }
    }
}
