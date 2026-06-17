<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\VehicleOwnershipType;
use App\Enums\VehicleStatus;
use App\Models\Vehicle;
use App\Models\VehicleOwner;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Vehicle lifecycle operations. Called from both API (mobile/SPA) and Inertia admin.
 */
class VehicleService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Vehicle
    {
        $this->assertOwnershipConsistency($data);

        return Vehicle::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Vehicle $vehicle, array $data): Vehicle
    {
        $this->assertOwnershipConsistency(array_merge($vehicle->toArray(), $data));

        $vehicle->update($data);

        return $vehicle->refresh();
    }

    public function changeStatus(Vehicle $vehicle, VehicleStatus $status): Vehicle
    {
        $vehicle->update(['status' => $status]);

        return $vehicle->refresh();
    }

    public function updateOdometer(Vehicle $vehicle, int $reading): Vehicle
    {
        return DB::transaction(function () use ($vehicle, $reading) {
            if ($reading > (int) $vehicle->current_odometer) {
                $vehicle->update(['current_odometer' => $reading]);
            }

            return $vehicle->refresh();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function attachOwner(VehicleOwner $owner, array $data): VehicleOwner
    {
        $owner->update($data);

        return $owner->refresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function assertOwnershipConsistency(array $data): void
    {
        $ownership = $data['ownership_type'] ?? null;

        if ($ownership instanceof VehicleOwnershipType) {
            $ownership = $ownership->value;
        }

        if ($ownership === VehicleOwnershipType::Outsourced->value
            && empty($data['vehicle_owner_id'])) {
            throw new InvalidArgumentException(
                'Outsourced vehicles must be linked to a vehicle_owner_id.',
            );
        }
    }
}
