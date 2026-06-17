<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\BookingCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BookingCategory
 */
class BookingCategoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'description' => $this->description,
            'security_deposit' => $this->security_deposit,
            'km_per_day_limit' => $this->km_per_day_limit,
            'excess_km_rate' => $this->excess_km_rate,
            'fuel_charge_per_level' => $this->fuel_charge_per_level,
            'currency' => $this->currency,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
