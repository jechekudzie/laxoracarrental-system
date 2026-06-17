<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CostCategory;
use App\Enums\Currency;
use Database\Factories\VehicleCostFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'vehicle_id',
    'booking_id',
    'recorded_by_user_id',
    'category',
    'description',
    'amount',
    'currency',
    'vendor_name',
    'vendor_phone',
    'odometer',
    'incident_date',
    'notes',
])]
class VehicleCost extends Model
{
    /** @use HasFactory<VehicleCostFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'category' => CostCategory::class,
            'currency' => Currency::class,
            'amount' => 'decimal:2',
            'odometer' => 'integer',
            'incident_date' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Vehicle, $this>
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /**
     * @return BelongsTo<Booking, $this>
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by_user_id');
    }
}
