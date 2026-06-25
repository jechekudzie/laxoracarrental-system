<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'agreement_number',
    'booking_id',
    'customer_id',
    'template_id',
    'renter_name',
    'renter_id_number',
    'renter_address',
    'renter_phone',
    'renter_email',
    'vehicle_make_model',
    'vehicle_registration',
    'mileage_out',
    'fuel_level_out',
    'rental_start',
    'rental_end',
    'collection_location',
    'return_location',
    'rental_rate',
    'rental_days',
    'total_amount',
    'deposit_amount',
    'mileage_allowance',
    'excess_mileage_fee',
    'template_content',
    'renter_signature',
    'renter_representative_name',
    'renter_signed_at',
    'company_signature',
    'company_representative_name',
    'company_signed_at',
    'status',
    'notes',
])]
class RentalAgreement extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'rental_start' => 'datetime',
            'rental_end' => 'datetime',
            'renter_signed_at' => 'datetime',
            'company_signed_at' => 'datetime',
            'rental_rate' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'excess_mileage_fee' => 'decimal:2',
            'rental_days' => 'integer',
            'mileage_allowance' => 'integer',
        ];
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

    /** @return BelongsTo<AgreementTemplate, $this> */
    public function template(): BelongsTo
    {
        return $this->belongsTo(AgreementTemplate::class, 'template_id');
    }

    public function isFullySigned(): bool
    {
        return $this->renter_signed_at !== null && $this->company_signed_at !== null;
    }
}
