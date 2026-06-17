<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Quotation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceQuotationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_guests_are_redirected_from_quotations(): void
    {
        $this->get(route('finance.quotations.index'))->assertRedirect(route('login'));
    }

    public function test_can_view_quotations_index(): void
    {
        $this->actingAs($this->user)
            ->get(route('finance.quotations.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('finance/quotations/index'));
    }

    public function test_can_view_create_quotation_page(): void
    {
        $this->actingAs($this->user)
            ->get(route('finance.quotations.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('finance/quotations/create'));
    }

    public function test_can_create_quotation_with_items(): void
    {
        $year = now()->format('Y');

        $this->actingAs($this->user)
            ->post(route('finance.quotations.store'), [
                'number' => "QT-{$year}-0001",
                'issued_at' => now()->toDateString(),
                'valid_until' => now()->addDays(30)->toDateString(),
                'tax' => 0,
                'discount' => 0,
                'currency' => 'USD',
                'items' => [
                    ['description' => 'Vehicle rental - 3 days', 'quantity' => 3, 'unit' => 'day', 'unit_price' => 100],
                ],
            ])
            ->assertRedirect(route('finance.quotations.index'));

        $this->assertDatabaseHas('quotations', ['number' => "QT-{$year}-0001"]);
        $this->assertDatabaseHas('quotation_items', ['description' => 'Vehicle rental - 3 days', 'total' => 300]);
    }

    public function test_can_view_quotation_show_page(): void
    {
        $quotation = Quotation::factory()->create();

        $this->actingAs($this->user)
            ->get(route('finance.quotations.show', $quotation))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('finance/quotations/show'));
    }

    public function test_can_update_quotation_status(): void
    {
        $quotation = Quotation::factory()->create(['status' => 'draft']);

        $this->actingAs($this->user)
            ->post(route('finance.quotations.status', $quotation), ['status' => 'sent'])
            ->assertRedirect();

        $this->assertDatabaseHas('quotations', ['id' => $quotation->id, 'status' => 'sent']);
    }

    public function test_can_delete_quotation(): void
    {
        $quotation = Quotation::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('finance.quotations.destroy', $quotation))
            ->assertRedirect();

        $this->assertSoftDeleted('quotations', ['id' => $quotation->id]);
    }
}
