<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\VehicleOwner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin VehicleOwner
 */
class VehicleOwnerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'commission_type' => $this->commission_type,
            'commission_value' => $this->commission_value,
            'agreed_daily_rate' => $this->agreed_daily_rate,
            'created_at' => $this->created_at,
        ];
    }
}
