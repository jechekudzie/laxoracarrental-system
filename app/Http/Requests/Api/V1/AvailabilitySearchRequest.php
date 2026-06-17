<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Enums\VehicleCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AvailabilitySearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'pickup_datetime' => ['required', 'date'],
            'return_datetime' => ['required', 'date', 'after:pickup_datetime'],
            'category' => ['nullable', Rule::enum(VehicleCategory::class)],
            'min_rate' => ['nullable', 'numeric', 'min:0'],
            'max_rate' => ['nullable', 'numeric', 'gte:min_rate'],
        ];
    }
}
