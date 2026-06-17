<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Currency;
use App\Enums\MaintenanceType;
use Database\Factories\MaintenanceRecordFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'vehicle_id',
    'recorded_by_user_id',
    'type',
    'service_type',
    'description',
    'odometer',
    'service_provider',
    'labour_cost',
    'parts_cost',
    'tow_cost',
    'total_cost',
    'currency',
    'downtime_days',
    'insurance_claim_ref',
    'police_report_ref',
    'customer_liable',
    'started_at',
    'completed_at',
    'notes',
])]
class MaintenanceRecord extends Model
{
    /** @use HasFactory<MaintenanceRecordFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'type' => MaintenanceType::class,
            'odometer' => 'integer',
            'labour_cost' => 'decimal:2',
            'parts_cost' => 'decimal:2',
            'tow_cost' => 'decimal:2',
            'total_cost' => 'decimal:2',
            'currency' => Currency::class,
            'downtime_days' => 'integer',
            'customer_liable' => 'boolean',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
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
     * @return BelongsTo<User, $this>
     */
    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by_user_id');
    }
}
