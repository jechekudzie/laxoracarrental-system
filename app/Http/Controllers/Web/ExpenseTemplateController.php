<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\ExpenseCategory;
use App\Http\Controllers\Controller;
use App\Models\CostCenter;
use App\Models\ExpenseTemplate;
use App\Models\ServiceProvider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseTemplateController extends Controller
{
    public function index(Request $request): Response
    {
        $templates = ExpenseTemplate::with('costCenter:id,name', 'serviceProvider:id,name')
            ->when($request->category, fn ($q, $c) => $q->where('category', $c))
            ->orderBy('category')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (ExpenseTemplate $t) => [
                'id' => $t->id,
                'category' => $t->category,
                'description' => $t->description,
                'default_cost_center_id' => $t->default_cost_center_id,
                'cost_center' => $t->costCenter ? ['id' => $t->costCenter->id, 'name' => $t->costCenter->name] : null,
                'default_service_provider_id' => $t->default_service_provider_id,
                'service_provider' => $t->serviceProvider ? ['id' => $t->serviceProvider->id, 'name' => $t->serviceProvider->name] : null,
                'typical_amount' => $t->typical_amount ? (float) $t->typical_amount : null,
                'is_active' => $t->is_active,
                'sort_order' => $t->sort_order,
            ]);

        return Inertia::render('finance/settings/expense-templates', [
            'templates' => $templates,
            'filters' => $request->only('category'),
            'categories' => collect(ExpenseCategory::cases())->map(fn ($c) => ['value' => $c->value, 'label' => $c->label()]),
            'cost_centers' => CostCenter::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'service_providers' => ServiceProvider::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'category' => ['required', Rule::enum(ExpenseCategory::class)],
            'description' => ['required', 'string', 'max:255'],
            'default_cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'default_service_provider_id' => ['nullable', 'exists:service_providers,id'],
            'typical_amount' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        ExpenseTemplate::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Expense template created.']);

        return back();
    }

    public function update(Request $request, ExpenseTemplate $expenseTemplate): RedirectResponse
    {
        $data = $request->validate([
            'category' => ['required', Rule::enum(ExpenseCategory::class)],
            'description' => ['required', 'string', 'max:255'],
            'default_cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'default_service_provider_id' => ['nullable', 'exists:service_providers,id'],
            'typical_amount' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        $expenseTemplate->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Expense template updated.']);

        return back();
    }

    public function destroy(ExpenseTemplate $expenseTemplate): RedirectResponse
    {
        $expenseTemplate->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Expense template deleted.']);

        return back();
    }

    public function byCategory(Request $request): JsonResponse
    {
        $templates = ExpenseTemplate::with('costCenter:id,name', 'serviceProvider:id,name')
            ->where('category', $request->category)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'description' => $t->description,
                'default_cost_center_id' => $t->default_cost_center_id,
                'default_cost_center_name' => $t->costCenter?->name,
                'default_service_provider_id' => $t->default_service_provider_id,
                'default_service_provider_name' => $t->serviceProvider?->name,
                'typical_amount' => $t->typical_amount ? (float) $t->typical_amount : null,
            ]);

        return response()->json($templates);
    }
}
