<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Currency;
use App\Enums\LicenceType;
use Database\Factories\VehicleLicenceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'vehicle_id',
    'type',
    'label',
    'document_number',
    'provider',
    'issue_date',
    'expiry_date',
    'cost',
    'currency',
    'cover_amount',
    'cover_type',
    'notes',
])]
class VehicleLicence extends Model
{
    /** @use HasFactory<VehicleLicenceFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'type' => LicenceType::class,
            'issue_date' => 'date',
            'expiry_date' => 'date',
            'cost' => 'decimal:2',
            'cover_amount' => 'decimal:2',
            'currency' => Currency::class,
        ];
    }

    /**
     * @return BelongsTo<Vehicle, $this>
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function daysToExpiry(): int
    {
        return (int) now()->startOfDay()->diffInDays($this->expiry_date, false);
    }

    public function isExpired(): bool
    {
        return $this->expiry_date->isPast();
    }
}
