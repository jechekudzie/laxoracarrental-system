<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Salary;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceSalaryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_guests_are_redirected_from_salaries(): void
    {
        $this->get(route('finance.salaries.index'))->assertRedirect(route('login'));
    }

    public function test_can_view_salaries_index(): void
    {
        $this->actingAs($this->user)
            ->get(route('finance.salaries.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('finance/salaries/index'));
    }

    public function test_can_create_salary_record(): void
    {
        $employee = Employee::factory()->create(['base_salary' => 2000]);

        $this->actingAs($this->user)
            ->post(route('finance.salaries.store'), [
                'employee_id' => $employee->id,
                'period_start' => now()->startOfMonth()->toDateString(),
                'period_end' => now()->endOfMonth()->toDateString(),
                'basic_salary' => 2000,
                'allowances' => [['label' => 'Transport', 'amount' => 100]],
                'deductions' => [['label' => 'Tax', 'amount' => 200]],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('salaries', [
            'employee_id' => $employee->id,
            'basic_salary' => 2000,
            'gross_salary' => 2100,
            'net_salary' => 1900,
        ]);
    }

    public function test_can_mark_salary_as_paid(): void
    {
        $salary = Salary::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->post(route('finance.salaries.mark-paid', $salary), [
                'pay_date' => now()->toDateString(),
                'payment_method' => 'bank_transfer',
                'payment_reference' => 'TXN-12345',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('salaries', ['id' => $salary->id, 'status' => 'paid', 'payment_reference' => 'TXN-12345']);
    }

    public function test_mark_paid_requires_pay_date(): void
    {
        $salary = Salary::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->post(route('finance.salaries.mark-paid', $salary), [])
            ->assertSessionHasErrors('pay_date');
    }

    public function test_can_delete_salary_record(): void
    {
        $salary = Salary::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('finance.salaries.destroy', $salary))
            ->assertRedirect();

        $this->assertSoftDeleted('salaries', ['id' => $salary->id]);
    }
}
