<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Enums\FuelLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if ($user === null) {
            return false;
        }

        // Staff with explicit permission can create on anyone's behalf.
        if ($user->can('bookings.create')) {
            return true;
        }

        // Customers can create their own bookings (customer flow on mobile).
        $customer = $user->customer;
        if ($customer === null) {
            return false;
        }

        return (int) $this->input('customer_id') === (int) $customer->id;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'exists:customers,id'],
            'vehicle_id' => ['required', 'exists:vehicles,id'],
            'pickup_datetime' => ['required', 'date', 'after_or_equal:now'],
            'return_datetime' => ['required', 'date', 'after:pickup_datetime'],
            'pickup_location' => ['nullable', 'string', 'max:255'],
            'return_location' => ['nullable', 'string', 'max:255'],
            'fuel_level_pickup' => ['nullable', Rule::enum(FuelLevel::class)],
            'odometer_start' => ['nullable', 'integer', 'min:0'],
            'cross_border' => ['nullable', 'boolean'],
            'cross_border_countries' => ['nullable', 'array'],
            'cross_border_countries.*' => ['string', 'max:60'],
            'extras' => ['nullable', 'array'],
            'extras.*' => ['numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
