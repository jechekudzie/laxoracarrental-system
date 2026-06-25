<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LaxoraVehicleLicenceSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('vehicle_licences')->truncate();

        // Data from: public/documents/1. Laxora Vehicle Register.xlsx — Vehicle Licences sheet
        // NOTE: The Excel only contains vehicle licence (CVR) and radio licence expiry dates.
        //       Insurance records are NOT in the Excel — add them separately via the Compliance module.
        // Dates corrected: 31/06 → 30/06 (June has 30 days), 31/11 → 30/11 (November has 30 days)
        $licences = [
            'AHH 3532' => ['2026-06-30', null],         // Toyota Hilux Silver
            'AGX 4277' => ['2026-11-30', null],         // Toyota Hilux Rocco
            'AGT 8832' => ['2026-11-30', '2026-09-30'], // Toyota Fortuner (Black)
            'AGY 1116' => ['2027-01-31', '2027-01-31'], // Toyota Fortuner (White)
            'AGN 6401' => ['2026-05-31', '2026-05-31'], // Toyota Fortuner (Silver)
            'AGL 7016' => ['2026-07-20', '2026-06-30'], // Toyota Coaster
            'AGJ 4541' => ['2026-07-30', null],         // Nissan Bus
            'AGW 5889' => ['2026-07-31', '2026-06-30'], // Honda Hybrid
        ];

        $vehicles = DB::table('vehicles')
            ->whereIn('reg_plate', array_keys($licences))
            ->pluck('id', 'reg_plate');

        $now = now();
        $rows = [];

        foreach ($licences as $plate => [$licenceExpiry, $radioExpiry]) {
            $vehicleId = $vehicles[$plate] ?? null;

            if (! $vehicleId) {
                continue;
            }

            $rows[] = [
                'vehicle_id' => $vehicleId,
                'type' => 'vehicle_licence',
                'label' => 'Vehicle Licence (CVR)',
                'document_number' => null,
                'provider' => 'Zimbabwe Republic Police / CVR',
                'issue_date' => null,
                'expiry_date' => $licenceExpiry,
                'cost' => 0,
                'currency' => 'USD',
                'cover_amount' => null,
                'cover_type' => null,
                'notes' => 'Imported from Laxora Vehicle Register.xlsx',
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if ($radioExpiry) {
                $rows[] = [
                    'vehicle_id' => $vehicleId,
                    'type' => 'radio_licence',
                    'label' => 'Radio Licence',
                    'document_number' => null,
                    'provider' => 'POTRAZ',
                    'issue_date' => null,
                    'expiry_date' => $radioExpiry,
                    'cost' => 0,
                    'currency' => 'USD',
                    'cover_amount' => null,
                    'cover_type' => null,
                    'notes' => 'Imported from Laxora Vehicle Register.xlsx',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        DB::table('vehicle_licences')->insert($rows);

        $this->command->info('Inserted '.count($rows).' vehicle licence records from Vehicle Register.');
    }
}
