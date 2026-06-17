<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Enums\ChecklistCondition;
use App\Enums\InspectionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInspectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('bookings.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(InspectionType::class)],
            'odometer' => ['nullable', 'integer', 'min:0'],
            'fuel_level' => ['nullable', 'string', Rule::in(['empty', 'quarter', 'half', 'three_quarter', 'full'])],
            'items' => ['nullable', 'array'],
            'items.*.key' => ['required_with:items.*.condition', 'string', 'max:80'],
            'items.*.label' => ['nullable', 'string', 'max:120'],
            'items.*.condition' => ['required_with:items.*.key', Rule::enum(ChecklistCondition::class)],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
            'photos' => ['nullable', 'array'],
            'photos.*' => ['string'],
            'exterior_notes' => ['nullable', 'string'],
            'interior_notes' => ['nullable', 'string'],
            'damage_summary' => ['nullable', 'string'],
            'signed_by_customer' => ['nullable', 'boolean'],
            'customer_signature_name' => ['nullable', 'string', 'max:120'],
        ];
    }
}
