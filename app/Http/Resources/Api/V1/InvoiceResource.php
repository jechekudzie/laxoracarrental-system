<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Invoice
 */
class InvoiceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status,
            'booking_id' => $this->booking_id,
            'customer_id' => $this->customer_id,
            'customer' => CustomerResource::make($this->whenLoaded('customer')),
            'issued_at' => $this->issued_at?->toDateString(),
            'due_at' => $this->due_at?->toDateString(),
            'subtotal' => $this->subtotal,
            'mileage_overage' => $this->mileage_overage,
            'fuel_charge' => $this->fuel_charge,
            'extras' => $this->extras,
            'damage_charge' => $this->damage_charge,
            'tax' => $this->tax,
            'total' => $this->total,
            'paid_amount' => $this->paid_amount,
            'balance_due' => $this->balanceDue(),
            'currency' => $this->currency,
            'line_items' => $this->line_items,
            'created_at' => $this->created_at,
        ];
    }
}
