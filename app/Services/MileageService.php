<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\MileageSource;
use App\Models\Booking;
use App\Models\MileageLog;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Support\Facades\DB;

/**
 * Log odometer readings from admin, customer, or CarTrack GPS webhooks.
 */
class MileageService
{
    public function log(
        Vehicle $vehicle,
        int $reading,
        MileageSource $source = MileageSource::Manual,
        ?Booking $booking = null,
        ?User $actor = null,
        ?string $notes = null,
    ): MileageLog {
        return DB::transaction(function () use ($vehicle, $reading, $source, $booking, $actor, $notes) {
            $log = MileageLog::create([
                'vehicle_id' => $vehicle->id,
                'booking_id' => $booking?->id,
                'recorded_by_user_id' => $actor?->id,
                'odometer_reading' => $reading,
                'source' => $source,
                'recorded_at' => now(),
                'notes' => $notes,
            ]);

            if ($reading > (int) $vehicle->current_odometer) {
                $vehicle->update(['current_odometer' => $reading]);
            }

            return $log;
        });
    }
}
