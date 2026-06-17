<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\CostCenter;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceEmployeeTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_guests_are_redirected_from_employees(): void
    {
        $this->get(route('finance.employees.index'))->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_view_employees(): void
    {
        Employee::factory()->count(2)->create();

        $this->actingAs($this->user)
            ->get(route('finance.employees.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('finance/employees/index'));
    }

    public function test_can_create_employee(): void
    {
        $center = CostCenter::factory()->create();

        $this->actingAs($this->user)
            ->post(route('finance.employees.store'), [
                'employee_number' => 'EMP-0001',
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'john@example.com',
                'phone' => '0771234567',
                'position' => 'Driver',
                'employment_type' => 'full_time',
                'salary_type' => 'monthly',
                'base_salary' => 1500,
                'hire_date' => now()->toDateString(),
                'cost_center_id' => $center->id,
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('employees', ['employee_number' => 'EMP-0001', 'first_name' => 'John']);
    }

    public function test_employee_number_must_be_unique(): void
    {
        Employee::factory()->create(['employee_number' => 'EMP-0001']);

        $this->actingAs($this->user)
            ->post(route('finance.employees.store'), [
                'employee_number' => 'EMP-0001',
                'first_name' => 'Jane',
                'last_name' => 'Doe',
                'position' => 'Manager',
                'employment_type' => 'full_time',
                'salary_type' => 'monthly',
                'base_salary' => 2000,
                'hire_date' => now()->toDateString(),
            ])
            ->assertSessionHasErrors('employee_number');
    }

    public function test_can_view_employee_show_page(): void
    {
        $employee = Employee::factory()->create();

        $this->actingAs($this->user)
            ->get(route('finance.employees.show', $employee))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('finance/employees/show'));
    }

    public function test_can_update_employee(): void
    {
        $employee = Employee::factory()->create();

        $this->actingAs($this->user)
            ->put(route('finance.employees.update', $employee), [
                'employee_number' => $employee->employee_number,
                'first_name' => 'Updated',
                'last_name' => $employee->last_name,
                'position' => 'Senior Driver',
                'employment_type' => 'full_time',
                'salary_type' => 'monthly',
                'base_salary' => 1800,
                'hire_date' => $employee->hire_date->toDateString(),
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('employees', ['id' => $employee->id, 'first_name' => 'Updated']);
    }

    public function test_can_delete_employee(): void
    {
        $employee = Employee::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('finance.employees.destroy', $employee))
            ->assertRedirect();

        $this->assertSoftDeleted('employees', ['id' => $employee->id]);
    }
}
