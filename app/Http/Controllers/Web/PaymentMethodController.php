<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PaymentMethodController extends Controller
{
    public function index(Request $request): Response
    {
        $paymentMethods = PaymentMethod::orderBy('sort_order')
            ->paginate(50)
            ->withQueryString()
            ->through(fn (PaymentMethod $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'code' => $m->code,
                'description' => $m->description,
                'is_active' => $m->is_active,
                'sort_order' => $m->sort_order,
            ]);

        return Inertia::render('finance/settings/payment-methods', [
            'payment_methods' => $paymentMethods,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'code' => ['required', 'string', 'max:40', 'unique:payment_methods,code'],
            'description' => ['nullable', 'string', 'max:200'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        PaymentMethod::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Payment method created.']);

        return back();
    }

    public function update(Request $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'code' => ['required', 'string', 'max:40', Rule::unique('payment_methods', 'code')->ignore($paymentMethod->id)],
            'description' => ['nullable', 'string', 'max:200'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        $paymentMethod->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Payment method updated.']);

        return back();
    }

    public function destroy(PaymentMethod $paymentMethod): RedirectResponse
    {
        $paymentMethod->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Payment method deleted.']);

        return back();
    }
}
