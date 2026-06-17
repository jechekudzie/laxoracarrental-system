<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Currency;
use App\Enums\PaymentMethod;
use App\Enums\VendorPaymentStatus;
use Database\Factories\ServiceProviderPaymentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'service_provider_id',
    'cost_center_id',
    'reference_number',
    'provider_invoice_number',
    'description',
    'amount',
    'currency',
    'invoice_date',
    'due_date',
    'payment_date',
    'payment_method',
    'status',
    'notes',
])]
class ServiceProviderPayment extends Model
{
    /** @use HasFactory<ServiceProviderPaymentFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'currency' => Currency::class,
            'payment_method' => PaymentMethod::class,
            'status' => VendorPaymentStatus::class,
            'invoice_date' => 'date',
            'due_date' => 'date',
            'payment_date' => 'date',
            'amount' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<ServiceProvider, $this> */
    public function serviceProvider(): BelongsTo
    {
        return $this->belongsTo(ServiceProvider::class);
    }

    /** @return BelongsTo<CostCenter, $this> */
    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }
}
