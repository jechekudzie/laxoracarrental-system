<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\EmploymentType;
use App\Enums\SalaryType;
use App\Http\Controllers\Controller;
use App\Models\CostCenter;
use App\Models\Employee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function index(Request $request): Response
    {
        $employees = Employee::with('costCenter:id,name,code')
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%{$s}%")
                    ->orWhere('last_name', 'like', "%{$s}%")
                    ->orWhere('employee_number', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%");
            }))
            ->when($request->cost_center_id, fn ($q, $id) => $q->where('cost_center_id', $id))
            ->when($request->status !== null, fn ($q) => $q->where('is_active', $request->status === 'active'))
            ->orderBy('first_name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Employee $e) => [
                'id' => $e->id,
                'employee_number' => $e->employee_number,
                'full_name' => $e->full_name,
                'first_name' => $e->first_name,
                'last_name' => $e->last_name,
                'email' => $e->email,
                'phone' => $e->phone,
                'position' => $e->position,
                'employment_type' => $e->employment_type->value,
                'employment_type_label' => $e->employment_type->label(),
                'salary_type' => $e->salary_type->value,
                'salary_type_label' => $e->salary_type->label(),
                'base_salary' => (float) $e->base_salary,
                'hire_date' => $e->hire_date?->toDateString(),
                'termination_date' => $e->termination_date?->toDateString(),
                'is_active' => $e->is_active,
                'bank_name' => $e->bank_name,
                'bank_account' => $e->bank_account,
                'cost_center' => $e->costCenter ? ['id' => $e->costCenter->id, 'name' => $e->costCenter->name, 'code' => $e->costCenter->code] : null,
            ]);

        return Inertia::render('finance/employees/index', [
            'employees' => $employees,
            'filters' => $request->only('search', 'cost_center_id', 'status'),
            'cost_centers' => CostCenter::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']),
            'employment_types' => collect(EmploymentType::cases())->map(fn ($e) => ['value' => $e->value, 'label' => $e->label()]),
            'salary_types' => collect(SalaryType::cases())->map(fn ($e) => ['value' => $e->value, 'label' => $e->label()]),
        ]);
    }

    public function show(Employee $employee): Response
    {
        $employee->load('costCenter:id,name,code');
        $recentTasks = $employee->tasks()->with('vehicle:id,make,model,reg_plate')->latest()->limit(5)->get();
        $recentSalaries = $employee->salaries()->latest('period_start')->limit(3)->get();

        return Inertia::render('finance/employees/show', [
            'employee' => [
                'id' => $employee->id,
                'employee_number' => $employee->employee_number,
                'full_name' => $employee->full_name,
                'first_name' => $employee->first_name,
                'last_name' => $employee->last_name,
                'email' => $employee->email,
                'phone' => $employee->phone,
                'position' => $employee->position,
                'employment_type' => $employee->employment_type->value,
                'employment_type_label' => $employee->employment_type->label(),
                'salary_type' => $employee->salary_type->value,
                'salary_type_label' => $employee->salary_type->label(),
                'base_salary' => (float) $employee->base_salary,
                'hire_date' => $employee->hire_date?->toDateString(),
                'termination_date' => $employee->termination_date?->toDateString(),
                'is_active' => $employee->is_active,
                'national_id' => $employee->national_id,
                'bank_name' => $employee->bank_name,
                'bank_account' => $employee->bank_account,
                'notes' => $employee->notes,
                'cost_center' => $employee->costCenter ? ['id' => $employee->costCenter->id, 'name' => $employee->costCenter->name] : null,
            ],
            'recent_tasks' => $recentTasks->map(fn ($t) => [
                'id' => $t->id,
                'title' => $t->title,
                'status' => $t->status->value,
                'status_label' => $t->status->label(),
                'priority' => $t->priority->value,
                'due_date' => $t->due_date?->toDateString(),
                'vehicle' => $t->vehicle ? "{$t->vehicle->make} {$t->vehicle->model} ({$t->vehicle->reg_plate})" : null,
            ]),
            'recent_salaries' => $recentSalaries->map(fn ($s) => [
                'id' => $s->id,
                'period_start' => $s->period_start->toDateString(),
                'period_end' => $s->period_end->toDateString(),
                'net_salary' => (float) $s->net_salary,
                'status' => $s->status->value,
                'status_label' => $s->status->label(),
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateEmployee($request);

        Employee::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Employee added.']);

        return back();
    }

    public function update(Request $request, Employee $employee): RedirectResponse
    {
        $data = $this->validateEmployee($request, $employee);

        $employee->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Employee updated.']);

        return back();
    }

    public function destroy(Employee $employee): RedirectResponse
    {
        $employee->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Employee removed.']);

        return redirect()->route('finance.employees.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateEmployee(Request $request, ?Employee $employee = null): array
    {
        return $request->validate([
            'cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'employee_number' => ['required', 'string', 'max:30', Rule::unique('employees', 'employee_number')->ignore($employee?->id)],
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'email' => ['nullable', 'email', 'max:120', Rule::unique('employees', 'email')->ignore($employee?->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'position' => ['required', 'string', 'max:120'],
            'employment_type' => ['required', Rule::enum(EmploymentType::class)],
            'salary_type' => ['required', Rule::enum(SalaryType::class)],
            'base_salary' => ['required', 'numeric', 'min:0'],
            'hire_date' => ['required', 'date'],
            'termination_date' => ['nullable', 'date', 'after:hire_date'],
            'is_active' => ['nullable', 'boolean'],
            'national_id' => ['nullable', 'string', 'max:50'],
            'bank_account' => ['nullable', 'string', 'max:50'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
