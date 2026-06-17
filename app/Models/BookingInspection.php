<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\InspectionType;
use Database\Factories\BookingInspectionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'booking_id',
    'inspector_user_id',
    'type',
    'odometer',
    'fuel_level',
    'items',
    'photos',
    'exterior_notes',
    'interior_notes',
    'damage_summary',
    'signed_by_customer',
    'customer_signature_name',
    'signed_at',
])]
class BookingInspection extends Model
{
    /** @use HasFactory<BookingInspectionFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'type' => InspectionType::class,
            'odometer' => 'integer',
            'items' => 'array',
            'photos' => 'array',
            'signed_by_customer' => 'boolean',
            'signed_at' => 'datetime',
        ];
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
    public function inspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspector_user_id');
    }
}
