<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\CostCenter;
use App\Models\OperationalExpense;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceExpenseTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_guests_are_redirected_from_expenses(): void
    {
        $this->get(route('finance.expenses.index'))->assertRedirect(route('login'));
    }

    public function test_can_view_expenses_index(): void
    {
        $this->actingAs($this->user)
            ->get(route('finance.expenses.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('finance/expenses/index'));
    }

    public function test_can_create_expense(): void
    {
        $center = CostCenter::factory()->create();

        $this->actingAs($this->user)
            ->post(route('finance.expenses.store'), [
                'cost_center_id' => $center->id,
                'category' => 'office_supplies',
                'description' => 'Printer ink cartridges',
                'amount' => 45.00,
                'currency' => 'USD',
                'expense_date' => now()->toDateString(),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('operational_expenses', ['description' => 'Printer ink cartridges', 'amount' => 45.00]);
    }

    public function test_expense_amount_must_be_positive(): void
    {
        $this->actingAs($this->user)
            ->post(route('finance.expenses.store'), [
                'category' => 'office_supplies',
                'description' => 'Test',
                'amount' => -10,
                'expense_date' => now()->toDateString(),
            ])
            ->assertSessionHasErrors('amount');
    }

    public function test_can_approve_expense(): void
    {
        $expense = OperationalExpense::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->post(route('finance.expenses.approve', $expense))
            ->assertRedirect();

        $this->assertDatabaseHas('operational_expenses', ['id' => $expense->id, 'status' => 'approved']);
    }

    public function test_can_delete_expense(): void
    {
        $expense = OperationalExpense::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('finance.expenses.destroy', $expense))
            ->assertRedirect();

        $this->assertSoftDeleted('operational_expenses', ['id' => $expense->id]);
    }
}
