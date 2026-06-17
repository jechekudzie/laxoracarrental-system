<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BookingStatus;
use App\Enums\Currency;
use Database\Factories\BookingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Enums\InspectionType;

#[Fillable([
    'reference',
    'customer_id',
    'vehicle_id',
    'created_by_user_id',
    'pickup_datetime',
    'return_datetime',
    'actual_pickup_at',
    'actual_return_at',
    'odometer_start',
    'odometer_end',
    'rental_days',
    'km_allowance',
    'daily_rate',
    'excess_km_rate',
    'currency',
    'base_amount',
    'mileage_overage_amount',
    'extras_amount',
    'fuel_charge',
    'damage_charge',
    'tax_amount',
    'total_amount',
    'deposit_amount',
    'paid_amount',
    'extras',
    'pickup_location',
    'return_location',
    'fuel_level_pickup',
    'fuel_level_return',
    'cross_border',
    'cross_border_countries',
    'status',
    'cancellation_reason',
    'notes',
])]
class Booking extends Model
{
    /** @use HasFactory<BookingFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'pickup_datetime' => 'datetime',
            'return_datetime' => 'datetime',
            'actual_pickup_at' => 'datetime',
            'actual_return_at' => 'datetime',
            'odometer_start' => 'integer',
            'odometer_end' => 'integer',
            'rental_days' => 'integer',
            'km_allowance' => 'integer',
            'daily_rate' => 'decimal:2',
            'excess_km_rate' => 'decimal:2',
            'currency' => Currency::class,
            'base_amount' => 'decimal:2',
            'mileage_overage_amount' => 'decimal:2',
            'extras_amount' => 'decimal:2',
            'fuel_charge' => 'decimal:2',
            'damage_charge' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'extras' => 'array',
            'cross_border' => 'boolean',
            'cross_border_countries' => 'array',
            'status' => BookingStatus::class,
        ];
    }

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return BelongsTo<Vehicle, $this>
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * @return HasOne<Invoice, $this>
     */
    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * @return HasMany<MileageLog, $this>
     */
    public function mileageLogs(): HasMany
    {
        return $this->hasMany(MileageLog::class);
    }

    /**
     * @return HasMany<BookingInspection, $this>
     */
    public function inspections(): HasMany
    {
        return $this->hasMany(BookingInspection::class);
    }

    /**
     * @return HasOne<BookingInspection, $this>
     */
    public function pickupInspection(): HasOne
    {
        return $this->hasOne(BookingInspection::class)
            ->where('type', InspectionType::Pickup->value);
    }

    /**
     * @return HasOne<BookingInspection, $this>
     */
    public function returnInspection(): HasOne
    {
        return $this->hasOne(BookingInspection::class)
            ->where('type', InspectionType::Return->value);
    }

    /**
     * @return HasOne<CustomerRating, $this>
     */
    public function rating(): HasOne
    {
        return $this->hasOne(CustomerRating::class);
    }

    /**
     * @param  Builder<Booking>  $query
     */
    public function scopeBlocking(Builder $query): void
    {
        $query->whereIn('status', [
            BookingStatus::Confirmed->value,
            BookingStatus::Active->value,
        ]);
    }

    /**
     * @param  Builder<Booking>  $query
     */
    public function scopeOverlapping(Builder $query, string $pickup, string $return): void
    {
        $query->where('pickup_datetime', '<', $return)
            ->where('return_datetime', '>', $pickup);
    }
}
