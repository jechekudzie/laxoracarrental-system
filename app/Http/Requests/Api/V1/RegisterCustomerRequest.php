<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterCustomerRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20'],
            'password' => ['required', 'confirmed', Password::defaults()],

            // Personal
            'id_number' => ['nullable', 'string', 'max:30'],
            'dob' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string'],
            'province' => ['nullable', 'string', 'max:60'],
            'languages' => ['nullable', 'array'],
            'languages.*' => ['string', 'max:30'],
            'profile_photo' => ['nullable', 'url'],

            // Licence — issued_date enforces the 3-month eligibility rule
            // at registration so customers know up-front whether they qualify.
            'licence_number' => ['nullable', 'string', 'max:30'],
            'licence_class' => ['nullable', 'string', 'max:20'],
            'licence_issued_date' => [
                'required',
                'date',
                'before_or_equal:'.now()->subMonths(3)->toDateString(),
            ],
            'licence_expiry' => ['nullable', 'date'],
            'licence_front' => ['nullable', 'url'],
            'licence_back' => ['nullable', 'url'],
            'defensive_driving_cert' => ['nullable', 'url'],
            'police_clearance_cert' => ['nullable', 'url'],

            // Identity docs
            'national_id_front' => ['nullable', 'url'],
            'national_id_back' => ['nullable', 'url'],
            'selfie_holding_id' => ['nullable', 'url'],

            // Emergency contact
            'emergency_contact_name' => ['nullable', 'string', 'max:120'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:60'],

            'device_name' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'licence_issued_date.before_or_equal' =>
                'Your licence must be issued at least 3 months ago to be eligible to register.',
        ];
    }
}
