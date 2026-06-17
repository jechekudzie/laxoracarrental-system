<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Vehicle;
use App\Models\VehicleLicence;
use Illuminate\Database\Eloquent\Collection;

/**
 * Compliance dashboard queries: licence expiry buckets, per-vehicle compliance
 * status. Shared by admin dashboard widgets and the compliance API endpoints.
 */
class ComplianceService
{
    /**
     * Licences expiring within `$days` (inclusive). Default 30 matches the
     * proposal's amber-bucket alert threshold.
     *
     * @return Collection<int, VehicleLicence>
     */
    public function expiringSoon(int $days = 30): Collection
    {
        return VehicleLicence::query()
            ->with('vehicle:id,make,model,reg_plate')
            ->whereDate('expiry_date', '>=', now()->toDateString())
            ->whereDate('expiry_date', '<=', now()->addDays($days)->toDateString())
            ->orderBy('expiry_date')
            ->get();
    }

    /**
     * @return Collection<int, VehicleLicence>
     */
    public function expired(): Collection
    {
        return VehicleLicence::query()
            ->with('vehicle:id,make,model,reg_plate')
            ->whereDate('expiry_date', '<', now()->toDateString())
            ->orderBy('expiry_date', 'desc')
            ->get();
    }

    /**
     * Per-vehicle compliance bucket: green (>30d), amber (0-30d), red (expired).
     *
     * @return array{green: int, amber: int, red: int}
     */
    public function vehicleBucket(Vehicle $vehicle): array
    {
        $buckets = ['green' => 0, 'amber' => 0, 'red' => 0];

        foreach ($vehicle->licences as $licence) {
            $days = $licence->daysToExpiry();

            if ($days < 0) {
                $buckets['red']++;
            } elseif ($days <= 30) {
                $buckets['amber']++;
            } else {
                $buckets['green']++;
            }
        }

        return $buckets;
    }
}
