<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('booking_categories.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:255'],
            'security_deposit' => ['required', 'numeric', 'min:0'],
            'km_per_day_limit' => ['required', 'integer', 'min:0'],
            'excess_km_rate' => ['required', 'numeric', 'min:0'],
            'fuel_charge_per_level' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
