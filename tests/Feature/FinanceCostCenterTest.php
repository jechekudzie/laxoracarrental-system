<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\CostCenter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceCostCenterTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_guests_are_redirected_from_cost_centers(): void
    {
        $this->get(route('finance.cost-centers.index'))->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_view_cost_centers(): void
    {
        CostCenter::factory()->count(3)->create();

        $this->actingAs($this->user)
            ->get(route('finance.cost-centers.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('finance/cost-centers/index'));
    }

    public function test_can_create_cost_center(): void
    {
        $this->actingAs($this->user)
            ->post(route('finance.cost-centers.store'), [
                'code' => 'OPS-001',
                'name' => 'Operations',
                'budget_amount' => 10000,
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('cost_centers', ['code' => 'OPS-001', 'name' => 'Operations']);
    }

    public function test_cost_center_code_must_be_unique(): void
    {
        CostCenter::factory()->create(['code' => 'OPS-001']);

        $this->actingAs($this->user)
            ->post(route('finance.cost-centers.store'), [
                'code' => 'OPS-001',
                'name' => 'Another',
                'budget_amount' => 5000,
            ])
            ->assertSessionHasErrors('code');
    }

    public function test_can_update_cost_center(): void
    {
        $center = CostCenter::factory()->create(['name' => 'Old Name']);

        $this->actingAs($this->user)
            ->put(route('finance.cost-centers.update', $center), [
                'code' => $center->code,
                'name' => 'New Name',
                'budget_amount' => 20000,
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('cost_centers', ['id' => $center->id, 'name' => 'New Name']);
    }

    public function test_can_delete_cost_center(): void
    {
        $center = CostCenter::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('finance.cost-centers.destroy', $center))
            ->assertRedirect();

        $this->assertSoftDeleted('cost_centers', ['id' => $center->id]);
    }
}
