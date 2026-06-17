<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BookingStatus;
use App\Enums\Currency;
use App\Enums\FuelLevel;
use App\Enums\FuelType;
use App\Enums\LicenceType;
use App\Enums\Transmission;
use App\Enums\VehicleCategory;
use App\Enums\VehicleOwnershipType;
use App\Enums\VehicleStatus;
use Database\Factories\VehicleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'make',
    'model',
    'year',
    'colour',
    'reg_plate',
    'vin',
    'category',
    'booking_category_id',
    'fuel_type',
    'transmission',
    'seats',
    'ownership_type',
    'vehicle_owner_id',
    'owner_agreed_rate',
    'owner_markup_percent',
    'daily_rate',
    'weekly_rate',
    'monthly_rate',
    'currency',
    'km_per_day_limit',
    'excess_km_rate',
    'status',
    'current_odometer',
    'service_interval_km',
    'service_interval_months',
    'last_service_odometer',
    'last_service_date',
    'photos',
    'notes',
])]
class Vehicle extends Model
{
    /** @use HasFactory<VehicleFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'seats' => 'integer',
            'category' => VehicleCategory::class,
            'fuel_type' => FuelType::class,
            'transmission' => Transmission::class,
            'ownership_type' => VehicleOwnershipType::class,
            'status' => VehicleStatus::class,
            'currency' => Currency::class,
            'owner_agreed_rate' => 'decimal:2',
            'owner_markup_percent' => 'decimal:2',
            'daily_rate' => 'decimal:2',
            'weekly_rate' => 'decimal:2',
            'monthly_rate' => 'decimal:2',
            'excess_km_rate' => 'decimal:2',
            'km_per_day_limit' => 'integer',
            'current_odometer' => 'integer',
            'service_interval_km' => 'integer',
            'service_interval_months' => 'integer',
            'last_service_odometer' => 'integer',
            'last_service_date' => 'date',
            'photos' => 'array',
        ];
    }

    /**
     * @return BelongsTo<VehicleOwner, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(VehicleOwner::class, 'vehicle_owner_id');
    }

    /**
     * @return BelongsTo<BookingCategory, $this>
     */
    public function bookingCategory(): BelongsTo
    {
        return $this->belongsTo(BookingCategory::class);
    }

    /**
     * @return HasMany<Booking, $this>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * @return HasMany<VehicleLicence, $this>
     */
    public function licences(): HasMany
    {
        return $this->hasMany(VehicleLicence::class);
    }

    /**
     * @return HasMany<VehicleCost, $this>
     */
    public function costs(): HasMany
    {
        return $this->hasMany(VehicleCost::class);
    }

    /**
     * @return HasMany<MaintenanceRecord, $this>
     */
    public function maintenanceRecords(): HasMany
    {
        return $this->hasMany(MaintenanceRecord::class);
    }

    /**
     * @return HasMany<MileageLog, $this>
     */
    public function mileageLogs(): HasMany
    {
        return $this->hasMany(MileageLog::class);
    }

    public function isOutsourced(): bool
    {
        return $this->ownership_type === VehicleOwnershipType::Outsourced;
    }

    /**
     * Vehicles that are safe to rent out to customers right now — service
     * isn't overdue and statutory insurance + fitness certificates are valid.
     * Used by the customer-facing availability endpoint.
     *
     * @param  Builder<Vehicle>  $query
     * @return Builder<Vehicle>
     */
    public function scopeRoadworthy(Builder $query): Builder
    {
        // Statutory compliance — all must be valid before we rent out the
        // vehicle. Fitness is treated as optional for now; add it here once
        // every vehicle in the fleet has an up-to-date fitness certificate.
        $requiredLicences = [
            LicenceType::Insurance->value,
            LicenceType::Zinara->value,
            LicenceType::ZBC->value,
            LicenceType::Registration->value,
        ];

        return $query
            ->where(function (Builder $q): void {
                // Service OK if: no km interval configured, OR last service
                // odometer is unknown, OR we haven't yet reached the next
                // service interval.
                $q->whereNull('service_interval_km')
                    ->orWhereNull('last_service_odometer')
                    ->orWhereRaw('(last_service_odometer + service_interval_km) > current_odometer');
            })
            ->where(function (Builder $q) use ($requiredLicences): void {
                foreach ($requiredLicences as $type) {
                    $q->whereHas('licences', function (Builder $l) use ($type): void {
                        $l->where('type', $type)
                            ->whereDate('expiry_date', '>=', now());
                    });
                }
            });
    }

    /**
     * Last recorded fuel level for this vehicle, taken from the most recent
     * completed booking's `fuel_level_return`. Returns null if no completed
     * booking exists yet — callers should fall back to "full".
     *
     * @return Attribute<?string, never>
     */
    protected function lastFuelLevel(): Attribute
    {
        return Attribute::make(
            get: function (): ?string {
                $latest = $this->bookings()
                    ->where('status', BookingStatus::Completed)
                    ->whereNotNull('fuel_level_return')
                    ->orderByDesc('actual_return_at')
                    ->orderByDesc('id')
                    ->first();

                $value = $latest?->fuel_level_return;

                return $value instanceof FuelLevel ? $value->value : $value;
            },
        );
    }
}
