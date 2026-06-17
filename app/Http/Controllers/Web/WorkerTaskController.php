<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\Priority;
use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Models\CostCenter;
use App\Models\Employee;
use App\Models\Vehicle;
use App\Models\WorkerTask;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WorkerTaskController extends Controller
{
    public function index(Request $request): Response
    {
        $tasks = WorkerTask::with('assignedTo:id,first_name,last_name', 'costCenter:id,name', 'vehicle:id,make,model,reg_plate')
            ->when($request->search, fn ($q, $s) => $q->where('title', 'like', "%{$s}%"))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->priority, fn ($q, $p) => $q->where('priority', $p))
            ->when($request->employee_id, fn ($q, $id) => $q->where('assigned_to', $id))
            ->when($request->cost_center_id, fn ($q, $id) => $q->where('cost_center_id', $id))
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (WorkerTask $t) => [
                'id' => $t->id,
                'title' => $t->title,
                'description' => $t->description,
                'status' => $t->status->value,
                'status_label' => $t->status->label(),
                'status_color' => $t->status->color(),
                'priority' => $t->priority->value,
                'priority_label' => $t->priority->label(),
                'priority_color' => $t->priority->color(),
                'due_date' => $t->due_date?->toDateString(),
                'started_at' => $t->started_at?->toDateTimeString(),
                'completed_at' => $t->completed_at?->toDateTimeString(),
                'assigned_to' => $t->assignedTo ? $t->assignedTo->full_name : null,
                'cost_center' => $t->costCenter ? ['id' => $t->costCenter->id, 'name' => $t->costCenter->name] : null,
                'vehicle' => $t->vehicle ? "{$t->vehicle->make} {$t->vehicle->model} ({$t->vehicle->reg_plate})" : null,
            ]);

        return Inertia::render('finance/tasks/index', [
            'tasks' => $tasks,
            'filters' => $request->only('search', 'status', 'priority', 'employee_id', 'cost_center_id'),
            'statuses' => collect(TaskStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
            'priorities' => collect(Priority::cases())->map(fn ($p) => ['value' => $p->value, 'label' => $p->label()]),
            'employees' => Employee::where('is_active', true)->orderBy('first_name')->get(['id', 'first_name', 'last_name']),
            'cost_centers' => CostCenter::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'vehicles' => Vehicle::orderBy('make')->get(['id', 'make', 'model', 'reg_plate']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'assigned_to' => ['nullable', 'exists:employees,id'],
            'cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'vehicle_id' => ['nullable', 'exists:vehicles,id'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'priority' => ['nullable', Rule::enum(Priority::class)],
            'due_date' => ['nullable', 'date'],
        ]);

        WorkerTask::create([...$data, 'assigned_by' => auth()->id()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Task created.']);

        return back();
    }

    public function update(Request $request, WorkerTask $workerTask): RedirectResponse
    {
        $data = $request->validate([
            'assigned_to' => ['nullable', 'exists:employees,id'],
            'cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'vehicle_id' => ['nullable', 'exists:vehicles,id'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'priority' => ['nullable', Rule::enum(Priority::class)],
            'due_date' => ['nullable', 'date'],
        ]);

        $workerTask->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Task updated.']);

        return back();
    }

    public function updateStatus(Request $request, WorkerTask $workerTask): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::enum(TaskStatus::class)],
            'completion_notes' => ['nullable', 'string'],
        ]);

        $timestamps = [];
        if ($data['status'] === TaskStatus::InProgress->value && ! $workerTask->started_at) {
            $timestamps['started_at'] = now();
        }
        if ($data['status'] === TaskStatus::Completed->value && ! $workerTask->completed_at) {
            $timestamps['completed_at'] = now();
        }

        $workerTask->update([...$data, ...$timestamps]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Task status updated.']);

        return back();
    }

    public function destroy(WorkerTask $workerTask): RedirectResponse
    {
        $workerTask->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Task deleted.']);

        return back();
    }
}
