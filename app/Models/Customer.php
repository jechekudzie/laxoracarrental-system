<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Currency;
use App\Enums\CustomerStatus;
use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'user_id',
    'name',
    'id_number',
    'dob',
    'gender',
    'phone',
    'email',
    'address',
    'province',
    'languages',
    'profile_photo',
    'licence_number',
    'licence_class',
    'licence_issued_date',
    'licence_expiry',
    'licence_front',
    'licence_back',
    'defensive_driving_cert',
    'police_clearance_cert',
    'national_id_front',
    'national_id_back',
    'selfie_holding_id',
    'emergency_contact_name',
    'emergency_contact_phone',
    'emergency_contact_relationship',
    'wallet_balance',
    'wallet_currency',
    'status',
    'blacklist_reason',
    'average_rating',
    'ratings_count',
    'notes',
])]
class Customer extends Model
{
    /** @use HasFactory<CustomerFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'dob' => 'date',
            'licence_issued_date' => 'date',
            'licence_expiry' => 'date',
            'languages' => 'array',
            'wallet_balance' => 'decimal:2',
            'wallet_currency' => Currency::class,
            'status' => CustomerStatus::class,
            'average_rating' => 'decimal:2',
            'ratings_count' => 'integer',
        ];
    }

    /**
     * @return HasMany<CustomerRating, $this>
     */
    public function ratings(): HasMany
    {
        return $this->hasMany(CustomerRating::class);
    }

    public function isGreylisted(): bool
    {
        return $this->status === CustomerStatus::Greylisted;
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<Booking, $this>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * @return HasMany<Invoice, $this>
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function isBlacklisted(): bool
    {
        return $this->status === CustomerStatus::Blacklisted;
    }
}
