<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CustomerStatus;
use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Customer lifecycle + optional auth user creation. Used by admin walk-in
 * flow and customer self-registration from mobile/SPA.
 */
class CustomerService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function createWalkIn(array $data): Customer
    {
        return Customer::create($data);
    }

    /**
     * Fields that flow from the registration / customer create payload
     * straight onto the Customer model. Listed here (not just in fillable)
     * so the mass-assignment is explicit and easy to audit.
     */
    private const PROFILE_FIELDS = [
        'id_number',
        'dob',
        'gender',
        'address',
        'province',
        'languages',
        'profile_photo',
        'licence_number',
        'licence_class',
        'licence_issued_date',
        'licence_expiry',
        'licence_front',
        'licence_back',
        'defensive_driving_cert',
        'police_clearance_cert',
        'national_id_front',
        'national_id_back',
        'selfie_holding_id',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
    ];

    /**
     * Customer self-registration: creates a User with the `customer` role
     * and a linked Customer profile in one transaction.
     *
     * @param  array<string, mixed>  $data
     */
    public function registerWithAccount(array $data): Customer
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'email_verified_at' => null,
            ]);

            $user->assignRole(UserRole::Customer->value);

            $payload = [
                'user_id' => $user->id,
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'status' => CustomerStatus::Active,
            ];
            foreach (self::PROFILE_FIELDS as $field) {
                if (array_key_exists($field, $data)) {
                    $payload[$field] = $data[$field];
                }
            }

            return Customer::create($payload);
        });
    }

    /**
     * Lazily link a Customer record to a User that doesn't have one yet.
     * Used by /auth/me so any authenticated user (including staff opening
     * the mobile customer flow) can immediately create bookings without
     * hitting "customer profile missing".
     */
    public function ensureForUser(User $user): Customer
    {
        if ($user->customer) {
            return $user->customer;
        }

        return DB::transaction(function () use ($user) {
            $customer = Customer::create([
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => '',
                'status' => CustomerStatus::Active,
            ]);

            $user->setRelation('customer', $customer);

            return $customer;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Customer $customer, array $data): Customer
    {
        $customer->update($data);

        return $customer->refresh();
    }

    public function blacklist(Customer $customer, string $reason): Customer
    {
        $customer->update([
            'status' => CustomerStatus::Blacklisted,
            'blacklist_reason' => $reason,
        ]);

        return $customer->refresh();
    }

    public function reinstate(Customer $customer): Customer
    {
        $customer->update([
            'status' => CustomerStatus::Active,
            'blacklist_reason' => null,
        ]);

        return $customer->refresh();
    }

    public function creditWallet(Customer $customer, float $amount): Customer
    {
        return DB::transaction(function () use ($customer, $amount) {
            $customer->increment('wallet_balance', $amount);

            return $customer->refresh();
        });
    }

    public function debitWallet(Customer $customer, float $amount): Customer
    {
        return DB::transaction(function () use ($customer, $amount) {
            $customer->decrement('wallet_balance', $amount);

            return $customer->refresh();
        });
    }
}
