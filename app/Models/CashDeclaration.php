<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'declaration_number',
    'declared_by',
    'amount',
    'currency',
    'source',
    'reference',
    'booking_id',
    'customer_id',
    'description',
    'signature',
    'declared_at',
])]
class CashDeclaration extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'declared_at' => 'datetime',
        ];
    }

    protected function sourceLabel(): Attribute
    {
        return Attribute::make(
            get: fn () => match ($this->source) {
                'customer_payment' => 'Customer Payment',
                'deposit' => 'Security Deposit',
                'petty_cash' => 'Petty Cash',
                default => 'Other',
            },
        );
    }

    /** @return BelongsTo<User, $this> */
    public function declaredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'declared_by');
    }

    /** @return BelongsTo<Booking, $this> */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
