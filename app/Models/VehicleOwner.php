<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CommissionType;
use Database\Factories\VehicleOwnerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'name',
    'phone',
    'email',
    'national_id',
    'address',
    'bank_details',
    'agreed_daily_rate',
    'commission_type',
    'commission_value',
    'notes',
])]
class VehicleOwner extends Model
{
    /** @use HasFactory<VehicleOwnerFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'agreed_daily_rate' => 'decimal:2',
            'commission_type' => CommissionType::class,
            'commission_value' => 'decimal:2',
        ];
    }

    /**
     * @return HasMany<Vehicle, $this>
     */
    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }
}
