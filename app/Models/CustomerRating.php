<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\CustomerRatingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'customer_id',
    'booking_id',
    'rated_by_user_id',
    'score_condition',
    'score_timeliness',
    'score_payment',
    'score_communication',
    'score_care',
    'average',
    'comment',
])]
class CustomerRating extends Model
{
    /** @use HasFactory<CustomerRatingFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'score_condition' => 'integer',
            'score_timeliness' => 'integer',
            'score_payment' => 'integer',
            'score_communication' => 'integer',
            'score_care' => 'integer',
            'average' => 'decimal:2',
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
     * @return BelongsTo<Booking, $this>
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function ratedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rated_by_user_id');
    }

    public static function computeAverage(int $condition, int $timeliness, int $payment, int $communication, int $care): float
    {
        return round(($condition + $timeliness + $payment + $communication + $care) / 5, 2);
    }
}
