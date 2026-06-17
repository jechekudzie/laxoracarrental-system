<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'requisition_id',
    'description',
    'quantity',
    'unit',
    'unit_price_estimated',
    'unit_price_actual',
    'total_estimated',
    'total_actual',
    'supplier_name',
])]
class RequisitionItem extends Model
{
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price_estimated' => 'decimal:2',
            'unit_price_actual' => 'decimal:2',
            'total_estimated' => 'decimal:2',
            'total_actual' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<Requisition, $this> */
    public function requisition(): BelongsTo
    {
        return $this->belongsTo(Requisition::class);
    }
}
