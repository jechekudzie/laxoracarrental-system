<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Priority;
use App\Enums\RequisitionStatus;
use Database\Factories\RequisitionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'number',
    'cost_center_id',
    'requested_by',
    'approved_by',
    'title',
    'description',
    'required_by',
    'status',
    'priority',
    'total_estimated',
    'total_actual',
    'approved_at',
    'fulfilled_at',
    'rejection_reason',
    'notes',
])]
class Requisition extends Model
{
    /** @use HasFactory<RequisitionFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'status' => RequisitionStatus::class,
            'priority' => Priority::class,
            'required_by' => 'date',
            'approved_at' => 'datetime',
            'fulfilled_at' => 'datetime',
            'total_estimated' => 'decimal:2',
            'total_actual' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<CostCenter, $this> */
    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }

    /** @return BelongsTo<User, $this> */
    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /** @return BelongsTo<User, $this> */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /** @return HasMany<RequisitionItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(RequisitionItem::class);
    }
}
