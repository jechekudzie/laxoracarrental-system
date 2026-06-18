<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\ServiceProviderCategory;
use App\Http\Controllers\Controller;
use App\Models\ServiceProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceProviderController extends Controller
{
    public function index(Request $request): Response
    {
        $providers = ServiceProvider::query()
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%")
                    ->orWhere('contact_person', 'like', "%{$s}%");
            }))
            ->when($request->category, fn ($q, $c) => $q->where('category', $c))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (ServiceProvider $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'category' => $p->category->value,
                'category_label' => $p->category->label(),
                'phone' => $p->phone,
                'email' => $p->email,
                'address' => $p->address,
                'contact_person' => $p->contact_person,
                'services_offered' => $p->services_offered,
                'rating' => $p->rating ? (float) $p->rating : null,
                'is_active' => $p->is_active,
            ]);

        return Inertia::render('service-providers/index', [
            'providers' => $providers,
            'filters' => $request->only('search', 'category'),
            'categories' => collect(ServiceProviderCategory::cases())->map(fn ($e) => ['value' => $e->value, 'label' => $e->label()]),
            'summary' => [
                'total' => ServiceProvider::count(),
                'active' => ServiceProvider::where('is_active', true)->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateProvider($request);

        ServiceProvider::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Service provider added.']);

        return back();
    }

    public function update(Request $request, ServiceProvider $serviceProvider): RedirectResponse
    {
        $data = $this->validateProvider($request);

        $serviceProvider->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Service provider updated.']);

        return back();
    }

    public function destroy(ServiceProvider $serviceProvider): RedirectResponse
    {
        $serviceProvider->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Service provider removed.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validateProvider(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'category' => ['required', 'string', 'in:mechanic,tow,car_wash,parts,insurance,tyres,panelbeater,other'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:120'],
            'address' => ['nullable', 'string', 'max:200'],
            'contact_person' => ['nullable', 'string', 'max:120'],
            'services_offered' => ['nullable', 'string'],
            'rating' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
