<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Booking
 */
class BookingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'status' => $this->status,

            'customer_id' => $this->customer_id,
            'customer' => CustomerResource::make($this->whenLoaded('customer')),

            'vehicle_id' => $this->vehicle_id,
            'vehicle' => VehicleResource::make($this->whenLoaded('vehicle')),

            'pickup_datetime' => $this->pickup_datetime,
            'return_datetime' => $this->return_datetime,
            'actual_pickup_at' => $this->actual_pickup_at,
            'actual_return_at' => $this->actual_return_at,

            'rental_days' => $this->rental_days,
            'km_allowance' => $this->km_allowance,
            'odometer_start' => $this->odometer_start,
            'odometer_end' => $this->odometer_end,

            'daily_rate' => $this->daily_rate,
            'excess_km_rate' => $this->excess_km_rate,
            'currency' => $this->currency,

            'base_amount' => $this->base_amount,
            'mileage_overage_amount' => $this->mileage_overage_amount,
            'extras_amount' => $this->extras_amount,
            'fuel_charge' => $this->fuel_charge,
            'damage_charge' => $this->damage_charge,
            'tax_amount' => $this->tax_amount,
            'total_amount' => $this->total_amount,
            'deposit_amount' => $this->deposit_amount,
            'paid_amount' => $this->paid_amount,

            'extras' => $this->extras,
            'pickup_location' => $this->pickup_location,
            'return_location' => $this->return_location,
            'cross_border' => $this->cross_border,
            'cross_border_countries' => $this->cross_border_countries,

            'notes' => $this->notes,
            'invoice' => InvoiceResource::make($this->whenLoaded('invoice')),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
