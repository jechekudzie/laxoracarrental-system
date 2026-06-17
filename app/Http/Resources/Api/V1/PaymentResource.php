<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Payment
 */
class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'invoice_id' => $this->invoice_id,
            'booking_id' => $this->booking_id,
            'customer_id' => $this->customer_id,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'method' => $this->method,
            'type' => $this->type,
            'gateway' => $this->gateway,
            'gateway_reference' => $this->gateway_reference,
            'status' => $this->status,
            'paid_at' => $this->paid_at,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
