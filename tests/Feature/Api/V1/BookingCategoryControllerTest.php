<?php

declare(strict_types=1);

namespace Tests\Feature\Api\V1;

use App\Enums\UserRole;
use App\Models\BookingCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class BookingCategoryControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach ([
            'booking_categories.view',
            'booking_categories.create',
            'booking_categories.update',
            'booking_categories.delete',
        ] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
    }

    public function test_admin_can_list_categories(): void
    {
        BookingCategory::factory()->count(3)->create();

        $this->actingAsFleetAdmin();

        $this->getJson('/api/v1/booking-categories')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [
                    ['id', 'slug', 'name', 'security_deposit', 'km_per_day_limit', 'excess_km_rate', 'fuel_charge_per_level'],
                ],
            ]);
    }

    public function test_admin_can_create_a_category(): void
    {
        $this->actingAsFleetAdmin();

        $payload = [
            'name' => 'Economy',
            'description' => 'Small fuel-efficient runabouts.',
            'security_deposit' => 120,
            'km_per_day_limit' => 180,
            'excess_km_rate' => 0.40,
            'fuel_charge_per_level' => 12,
            'currency' => 'USD',
        ];

        $this->postJson('/api/v1/booking-categories', $payload)
            ->assertCreated()
            ->assertJsonPath('data.slug', 'economy')
            ->assertJsonPath('data.security_deposit', '120.00');

        // Slug is auto-generated from name by Spatie\Sluggable\HasSlug.
        $this->assertDatabaseHas('booking_categories', ['slug' => 'economy', 'km_per_day_limit' => 180]);
    }

    public function test_admin_can_update_a_category(): void
    {
        $category = BookingCategory::factory()->create(['security_deposit' => 150]);
        $this->actingAsFleetAdmin();

        $this->patchJson("/api/v1/booking-categories/{$category->id}", ['security_deposit' => 250])
            ->assertOk()
            ->assertJsonPath('data.security_deposit', '250.00');
    }

    public function test_admin_can_delete_a_category(): void
    {
        $category = BookingCategory::factory()->create();
        $this->actingAsFleetAdmin();

        $this->deleteJson("/api/v1/booking-categories/{$category->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('booking_categories', ['id' => $category->id]);
    }

    public function test_unauthenticated_user_cannot_access_endpoints(): void
    {
        $this->getJson('/api/v1/booking-categories')->assertUnauthorized();
    }

    public function test_user_without_permission_gets_403(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/booking-categories')->assertForbidden();
    }

    public function test_create_validates_required_fields(): void
    {
        $this->actingAsFleetAdmin();

        $this->postJson('/api/v1/booking-categories', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'security_deposit', 'km_per_day_limit', 'excess_km_rate']);
    }

    private function actingAsFleetAdmin(): User
    {
        $role = Role::findOrCreate(UserRole::SuperAdmin->value, 'web');
        $role->givePermissionTo([
            'booking_categories.view',
            'booking_categories.create',
            'booking_categories.update',
            'booking_categories.delete',
        ]);

        $user = User::factory()->create();
        $user->assignRole($role);

        Sanctum::actingAs($user);

        return $user;
    }
}
