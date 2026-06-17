<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\CostCenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CostCenterController extends Controller
{
    public function index(Request $request): Response
    {
        $centers = CostCenter::query()
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")->orWhere('code', 'like', "%{$s}%");
            }))
            ->withCount(['employees', 'operationalExpenses', 'requisitions'])
            ->withSum('operationalExpenses as total_spent', 'amount')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (CostCenter $c) => [
                'id' => $c->id,
                'code' => $c->code,
                'name' => $c->name,
                'description' => $c->description,
                'budget_amount' => (float) $c->budget_amount,
                'is_active' => $c->is_active,
                'employees_count' => $c->employees_count,
                'operational_expenses_count' => $c->operational_expenses_count,
                'requisitions_count' => $c->requisitions_count,
                'total_spent' => (float) ($c->total_spent ?? 0),
            ]);

        return Inertia::render('finance/cost-centers/index', [
            'centers' => $centers,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:20', 'unique:cost_centers,code'],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'budget_amount' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        CostCenter::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cost center created.']);

        return back();
    }

    public function update(Request $request, CostCenter $costCenter): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:20', "unique:cost_centers,code,{$costCenter->id}"],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'budget_amount' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $costCenter->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cost center updated.']);

        return back();
    }

    public function destroy(CostCenter $costCenter): RedirectResponse
    {
        $costCenter->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cost center deleted.']);

        return back();
    }
}
