<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Customer
 */
class CustomerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'id_number' => $this->id_number,
            'dob' => $this->dob?->toDateString(),
            'gender' => $this->gender,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'province' => $this->province,
            'languages' => $this->languages,
            'profile_photo' => $this->profile_photo,
            'licence_number' => $this->licence_number,
            'licence_class' => $this->licence_class,
            'licence_issued_date' => $this->licence_issued_date?->toDateString(),
            'licence_expiry' => $this->licence_expiry?->toDateString(),
            'licence_front' => $this->licence_front,
            'licence_back' => $this->licence_back,
            'defensive_driving_cert' => $this->defensive_driving_cert,
            'police_clearance_cert' => $this->police_clearance_cert,
            'national_id_front' => $this->national_id_front,
            'national_id_back' => $this->national_id_back,
            'selfie_holding_id' => $this->selfie_holding_id,
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_phone' => $this->emergency_contact_phone,
            'emergency_contact_relationship' => $this->emergency_contact_relationship,
            'wallet_balance' => $this->wallet_balance,
            'wallet_currency' => $this->wallet_currency,
            'status' => $this->status,
            'blacklist_reason' => $this->blacklist_reason,
            'created_at' => $this->created_at,
        ];
    }
}
