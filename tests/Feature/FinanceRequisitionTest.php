<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\CostCenter;
use App\Models\Requisition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceRequisitionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_guests_are_redirected_from_requisitions(): void
    {
        $this->get(route('finance.requisitions.index'))->assertRedirect(route('login'));
    }

    public function test_can_view_requisitions_index(): void
    {
        $this->actingAs($this->user)
            ->get(route('finance.requisitions.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('finance/requisitions/index'));
    }

    public function test_can_create_requisition_with_items(): void
    {
        $center = CostCenter::factory()->create();
        $year = now()->format('Y');

        $this->actingAs($this->user)
            ->post(route('finance.requisitions.store'), [
                'number' => "REQ-{$year}-0001",
                'title' => 'Office Supplies',
                'cost_center_id' => $center->id,
                'priority' => 'normal',
                'items' => [
                    ['description' => 'Printer paper', 'quantity' => 5, 'unit' => 'ream', 'unit_price_estimated' => 10, 'supplier_name' => 'Stationery Co'],
                ],
            ])
            ->assertRedirect(route('finance.requisitions.index'));

        $this->assertDatabaseHas('requisitions', ['number' => "REQ-{$year}-0001", 'title' => 'Office Supplies']);
        $this->assertDatabaseHas('requisition_items', ['description' => 'Printer paper', 'total_estimated' => 50]);
    }

    public function test_can_view_requisition_show_page(): void
    {
        $req = Requisition::factory()->create();

        $this->actingAs($this->user)
            ->get(route('finance.requisitions.show', $req))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('finance/requisitions/show'));
    }

    public function test_can_approve_requisition(): void
    {
        $req = Requisition::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->post(route('finance.requisitions.approve', $req))
            ->assertRedirect();

        $this->assertDatabaseHas('requisitions', ['id' => $req->id, 'status' => 'approved']);
    }

    public function test_can_reject_requisition_with_reason(): void
    {
        $req = Requisition::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->post(route('finance.requisitions.reject', $req), ['rejection_reason' => 'Budget exceeded'])
            ->assertRedirect();

        $this->assertDatabaseHas('requisitions', ['id' => $req->id, 'status' => 'rejected', 'rejection_reason' => 'Budget exceeded']);
    }

    public function test_reject_requires_reason(): void
    {
        $req = Requisition::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->post(route('finance.requisitions.reject', $req), [])
            ->assertSessionHasErrors('rejection_reason');
    }

    public function test_can_fulfill_approved_requisition(): void
    {
        $req = Requisition::factory()->create(['status' => 'approved']);

        $this->actingAs($this->user)
            ->post(route('finance.requisitions.fulfill', $req))
            ->assertRedirect();

        $this->assertDatabaseHas('requisitions', ['id' => $req->id, 'status' => 'fulfilled']);
    }

    public function test_can_delete_requisition(): void
    {
        $req = Requisition::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('finance.requisitions.destroy', $req))
            ->assertRedirect();

        $this->assertSoftDeleted('requisitions', ['id' => $req->id]);
    }
}
