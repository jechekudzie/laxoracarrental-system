<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\PaymentMethod;
use App\Enums\SalaryStatus;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Salary;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SalaryController extends Controller
{
    public function index(Request $request): Response
    {
        $salaries = Salary::with('employee.costCenter:id,name')
            ->when($request->search, fn ($q, $s) => $q->whereHas('employee', fn ($eq) => $eq->where('first_name', 'like', "%{$s}%")->orWhere('last_name', 'like', "%{$s}%")->orWhere('employee_number', 'like', "%{$s}%")))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->employee_id, fn ($q, $id) => $q->where('employee_id', $id))
            ->latest('period_start')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Salary $s) => [
                'id' => $s->id,
                'employee' => [
                    'id' => $s->employee->id,
                    'full_name' => $s->employee->full_name,
                    'employee_number' => $s->employee->employee_number,
                    'position' => $s->employee->position,
                    'cost_center' => $s->employee->costCenter ? $s->employee->costCenter->name : null,
                ],
                'period_start' => $s->period_start->toDateString(),
                'period_end' => $s->period_end->toDateString(),
                'pay_date' => $s->pay_date?->toDateString(),
                'basic_salary' => (float) $s->basic_salary,
                'gross_salary' => (float) $s->gross_salary,
                'net_salary' => (float) $s->net_salary,
                'status' => $s->status->value,
                'status_label' => $s->status->label(),
                'status_color' => $s->status->color(),
            ]);

        $totalPending = Salary::where('status', SalaryStatus::Pending)->sum('net_salary');
        $totalPaid = Salary::where('status', SalaryStatus::Paid)->whereMonth('pay_date', now()->month)->sum('net_salary');

        return Inertia::render('finance/salaries/index', [
            'salaries' => $salaries,
            'filters' => $request->only('search', 'status', 'employee_id'),
            'statuses' => collect(SalaryStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
            'employees' => Employee::where('is_active', true)->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'employee_number']),
            'summary' => [
                'total_pending' => (float) $totalPending,
                'total_paid_this_month' => (float) $totalPaid,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateSalary($request);

        $employee = Employee::findOrFail($data['employee_id']);
        $allowancesTotal = collect($data['allowances'] ?? [])->sum('amount');
        $deductionsTotal = collect($data['deductions'] ?? [])->sum('amount');
        $gross = $data['basic_salary'] + $allowancesTotal;
        $net = $gross - $deductionsTotal;

        Salary::create([
            ...$data,
            'gross_salary' => $gross,
            'net_salary' => $net,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Salary record created.']);

        return back();
    }

    public function markPaid(Request $request, Salary $salary): RedirectResponse
    {
        $data = $request->validate([
            'pay_date' => ['required', 'date'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'payment_reference' => ['nullable', 'string', 'max:100'],
        ]);

        $salary->update([
            ...$data,
            'status' => SalaryStatus::Paid,
            'paid_by' => auth()->id(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Salary marked as paid.']);

        return back();
    }

    public function destroy(Salary $salary): RedirectResponse
    {
        $salary->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Salary record deleted.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validateSalary(Request $request): array
    {
        return $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
            'basic_salary' => ['required', 'numeric', 'min:0'],
            'allowances' => ['nullable', 'array'],
            'allowances.*.label' => ['required', 'string', 'max:100'],
            'allowances.*.amount' => ['required', 'numeric', 'min:0'],
            'deductions' => ['nullable', 'array'],
            'deductions.*.label' => ['required', 'string', 'max:100'],
            'deductions.*.amount' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'payment_reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
