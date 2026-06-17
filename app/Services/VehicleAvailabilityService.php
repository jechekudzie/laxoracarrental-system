<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\VehicleStatus;
use App\Models\Booking;
use App\Models\Vehicle;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Collection;

/**
 * Availability checks across bookings + vehicle status. Shared between admin
 * booking form, customer SPA search, and mobile vehicle browse.
 */
class VehicleAvailabilityService
{
    /**
     * True if the vehicle can be booked for the given window.
     */
    public function isAvailable(
        Vehicle $vehicle,
        DateTimeInterface $pickup,
        DateTimeInterface $return,
        ?int $excludeBookingId = null,
    ): bool {
        if ($vehicle->status === VehicleStatus::Decommissioned
            || $vehicle->status === VehicleStatus::Maintenance) {
            return false;
        }

        return ! $this->hasConflictingBooking($vehicle, $pickup, $return, $excludeBookingId);
    }

    public function hasConflictingBooking(
        Vehicle $vehicle,
        DateTimeInterface $pickup,
        DateTimeInterface $return,
        ?int $excludeBookingId = null,
    ): bool {
        return $vehicle->bookings()
            ->blocking()
            ->overlapping($pickup->format('Y-m-d H:i:s'), $return->format('Y-m-d H:i:s'))
            ->when($excludeBookingId, fn ($q) => $q->where('id', '!=', $excludeBookingId))
            ->exists();
    }

    /**
     * Filter a vehicle collection to only those available in the window.
     *
     * @param  Collection<int, Vehicle>  $vehicles
     * @return Collection<int, Vehicle>
     */
    public function filterAvailable(
        Collection $vehicles,
        DateTimeInterface $pickup,
        DateTimeInterface $return,
    ): Collection {
        return $vehicles->filter(
            fn (Vehicle $vehicle) => $this->isAvailable($vehicle, $pickup, $return),
        )->values();
    }

    /**
     * Find all vehicles (optionally filtered) that are free in the window.
     *
     * @param  array<string, mixed>  $filters  supported keys: category, min_rate, max_rate
     * @return Collection<int, Vehicle>
     */
    public function searchAvailable(
        DateTimeInterface $pickup,
        DateTimeInterface $return,
        array $filters = [],
    ): Collection {
        $query = Vehicle::query()
            ->roadworthy()
            ->whereNotIn('status', [
                VehicleStatus::Decommissioned->value,
                VehicleStatus::Maintenance->value,
            ])
            ->whereDoesntHave(
                'bookings',
                fn ($q) => $q->blocking()->overlapping(
                    $pickup->format('Y-m-d H:i:s'),
                    $return->format('Y-m-d H:i:s'),
                ),
            );

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['min_rate'])) {
            $query->where('daily_rate', '>=', (float) $filters['min_rate']);
        }

        if (! empty($filters['max_rate'])) {
            $query->where('daily_rate', '<=', (float) $filters['max_rate']);
        }

        return $query->orderBy('daily_rate')->get();
    }

    /**
     * Bookings blocking this vehicle's calendar, for UI display.
     *
     * @return Collection<int, Booking>
     */
    public function blockingBookings(Vehicle $vehicle): Collection
    {
        return $vehicle->bookings()
            ->blocking()
            ->where('return_datetime', '>=', now())
            ->orderBy('pickup_datetime')
            ->get();
    }
}
