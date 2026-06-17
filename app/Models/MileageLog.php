<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\MileageSource;
use Database\Factories\MileageLogFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'vehicle_id',
    'booking_id',
    'recorded_by_user_id',
    'odometer_reading',
    'source',
    'recorded_at',
    'notes',
])]
class MileageLog extends Model
{
    /** @use HasFactory<MileageLogFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'odometer_reading' => 'integer',
            'source' => MileageSource::class,
            'recorded_at' => 'datetime',
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
