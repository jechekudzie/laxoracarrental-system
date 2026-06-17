<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Enums\VehicleCategory;
use App\Enums\VehicleOwnershipType;
use App\Enums\VehicleStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('vehicles.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $vehicleId = $this->route('vehicle')?->id;

        return [
            'make' => ['sometimes', 'string', 'max:60'],
            'model' => ['sometimes', 'string', 'max:60'],
            'year' => ['sometimes', 'integer', 'between:1980,2100'],
            'colour' => ['nullable', 'string', 'max:30'],
            'reg_plate' => ['sometimes', 'string', 'max:20', Rule::unique('vehicles', 'reg_plate')->ignore($vehicleId)],
            'vin' => ['nullable', 'string', 'max:30', Rule::unique('vehicles', 'vin')->ignore($vehicleId)],
            'category' => ['sometimes', Rule::enum(VehicleCategory::class)],
            'booking_category_id' => ['sometimes', 'integer', 'exists:booking_categories,id'],
            'fuel_type' => ['sometimes', Rule::enum(FuelType::class)],
            'transmission' => ['sometimes', Rule::enum(Transmission::class)],
            'seats' => ['sometimes', 'integer', 'between:1,30'],
            'ownership_type' => ['sometimes', Rule::enum(VehicleOwnershipType::class)],
            'vehicle_owner_id' => ['nullable', 'exists:vehicle_owners,id'],
            'owner_agreed_rate' => ['nullable', 'numeric', 'min:0'],
            'owner_markup_percent' => ['nullable', 'numeric', 'min:0', 'max:500'],
            'daily_rate' => ['sometimes', 'numeric', 'min:0'],
            'weekly_rate' => ['nullable', 'numeric', 'min:0'],
            'monthly_rate' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'km_per_day_limit' => ['nullable', 'integer', 'min:0'],
            'excess_km_rate' => ['nullable', 'numeric', 'min:0'],
            'status' => ['sometimes', Rule::enum(VehicleStatus::class)],
            'current_odometer' => ['nullable', 'integer', 'min:0'],
            'service_interval_km' => ['nullable', 'integer', 'min:0'],
            'service_interval_months' => ['nullable', 'integer', 'min:0'],
            'last_service_odometer' => ['nullable', 'integer', 'min:0'],
            'last_service_date' => ['nullable', 'date'],
            'photos' => ['nullable', 'array', 'max:20'],
            'photos.*' => ['string', 'max:512'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
