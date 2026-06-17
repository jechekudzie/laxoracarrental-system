<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\BookingInspection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BookingInspection
 */
class BookingInspectionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'booking_id' => $this->booking_id,
            'type' => $this->type,
            'odometer' => $this->odometer,
            'fuel_level' => $this->fuel_level,
            'items' => $this->items,
            'photos' => $this->photos,
            'exterior_notes' => $this->exterior_notes,
            'interior_notes' => $this->interior_notes,
            'damage_summary' => $this->damage_summary,
            'signed_by_customer' => $this->signed_by_customer,
            'customer_signature_name' => $this->customer_signature_name,
            'signed_at' => $this->signed_at,
            'inspector_user_id' => $this->inspector_user_id,
            'created_at' => $this->created_at,
        ];
    }
}
