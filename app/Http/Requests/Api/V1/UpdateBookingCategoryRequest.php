<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBookingCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('booking_categories.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:255'],
            'security_deposit' => ['sometimes', 'numeric', 'min:0'],
            'km_per_day_limit' => ['sometimes', 'integer', 'min:0'],
            'excess_km_rate' => ['sometimes', 'numeric', 'min:0'],
            'fuel_charge_per_level' => ['sometimes', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
