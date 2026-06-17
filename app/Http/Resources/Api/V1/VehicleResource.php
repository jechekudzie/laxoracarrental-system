<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Vehicle
 */
class VehicleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'make' => $this->make,
            'model' => $this->model,
            'year' => $this->year,
            'colour' => $this->colour,
            'reg_plate' => $this->reg_plate,
            'vin' => $this->vin,
            'category' => $this->category,
            'fuel_type' => $this->fuel_type,
            'transmission' => $this->transmission,
            'seats' => $this->seats,
            'ownership_type' => $this->ownership_type,
            'owner' => VehicleOwnerResource::make($this->whenLoaded('owner')),
            'booking_category' => BookingCategoryResource::make($this->whenLoaded('bookingCategory')),
            'booking_category_id' => $this->booking_category_id,
            'daily_rate' => $this->daily_rate,
            'weekly_rate' => $this->weekly_rate,
            'monthly_rate' => $this->monthly_rate,
            'currency' => $this->currency,
            'km_per_day_limit' => $this->km_per_day_limit,
            'excess_km_rate' => $this->excess_km_rate,
            'status' => $this->status,
            'current_odometer' => $this->current_odometer,
            'last_fuel_level' => $this->last_fuel_level,
            'photos' => $this->photos,
            'service_interval_km' => $this->service_interval_km,
            'service_interval_months' => $this->service_interval_months,
            'last_service_odometer' => $this->last_service_odometer,
            'last_service_date' => $this->last_service_date?->toDateString(),
            // `quote` is set as a runtime attribute by VehicleAvailabilityController
            // when the vehicle is returned from an availability search. It carries
            // the per-window price: daily_rate × days + deposit + included km.
            'quote' => $this->resource->quote ?? null,
            'licences' => $this->whenLoaded(
                'licences',
                fn () => $this->licences->map(fn ($l) => [
                    'id' => $l->id,
                    'type' => $l->type?->value,
                    'label' => $l->label,
                    'document_number' => $l->document_number,
                    'provider' => $l->provider,
                    'issue_date' => $l->issue_date?->toDateString(),
                    'expiry_date' => $l->expiry_date?->toDateString(),
                    'days_to_expiry' => $l->daysToExpiry(),
                    'is_expired' => $l->isExpired(),
                    'cost' => $l->cost,
                    'currency' => $l->currency?->value,
                ]),
            ),
            'maintenance_records' => $this->whenLoaded(
                'maintenanceRecords',
                fn () => $this->maintenanceRecords->map(fn ($m) => [
                    'id' => $m->id,
                    'type' => $m->type?->value,
                    'service_type' => $m->service_type,
                    'description' => $m->description,
                    'odometer' => $m->odometer,
                    'service_provider' => $m->service_provider,
                    'total_cost' => $m->total_cost,
                    'currency' => $m->currency?->value,
                    'downtime_days' => $m->downtime_days,
                    'started_at' => $m->started_at?->toIso8601String(),
                    'completed_at' => $m->completed_at?->toIso8601String(),
                    'customer_liable' => $m->customer_liable,
                    'notes' => $m->notes,
                ]),
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
