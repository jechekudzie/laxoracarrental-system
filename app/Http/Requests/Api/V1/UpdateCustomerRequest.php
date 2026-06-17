<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('customers.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:120'],
            'id_number' => ['nullable', 'string', 'max:30'],
            'dob' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:20'],
            'phone' => ['sometimes', 'string', 'max:20'],
            'email' => ['nullable', 'email'],
            'address' => ['nullable', 'string'],
            'province' => ['nullable', 'string', 'max:60'],
            'languages' => ['nullable', 'array'],
            'languages.*' => ['string', 'max:30'],
            'profile_photo' => ['nullable', 'url'],
            'licence_number' => ['nullable', 'string', 'max:30'],
            'licence_class' => ['nullable', 'string', 'max:20'],
            'licence_issued_date' => ['nullable', 'date'],
            'licence_expiry' => ['nullable', 'date'],
            'licence_front' => ['nullable', 'url'],
            'licence_back' => ['nullable', 'url'],
            'defensive_driving_cert' => ['nullable', 'url'],
            'police_clearance_cert' => ['nullable', 'url'],
            'national_id_front' => ['nullable', 'url'],
            'national_id_back' => ['nullable', 'url'],
            'selfie_holding_id' => ['nullable', 'url'],
            'emergency_contact_name' => ['nullable', 'string', 'max:120'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:60'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
