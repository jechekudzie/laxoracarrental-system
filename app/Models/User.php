<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable, TwoFactorAuthenticatable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Every user gets the `customer` role on creation. Staff roles (super-admin,
     * fleet-manager, booking-agent, finance) are added on top of customer so
     * staff can still rent cars themselves via the customer flow.
     *
     * Skipped silently if the role hasn't been seeded yet (e.g. in unit tests
     * that don't run RolesAndPermissionsSeeder) — production always seeds it.
     */
    protected static function booted(): void
    {
        static::created(function (User $user): void {
            $roleExists = Role::query()
                ->where('name', UserRole::Customer->value)
                ->where('guard_name', 'web')
                ->exists();

            if ($roleExists && ! $user->hasRole(UserRole::Customer->value)) {
                $user->assignRole(UserRole::Customer->value);
            }
        });
    }

    /**
     * @return HasOne<Customer, $this>
     */
    public function customer(): HasOne
    {
        return $this->hasOne(Customer::class);
    }
}
