<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\Currency;
use App\Http\Controllers\Controller;
use App\Models\BookingCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookingCategoryController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('booking_categories.view'), 403);

        $categories = BookingCategory::query()
            ->withCount('vehicles')
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('slug', 'like', "%{$s}%");
            }))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (BookingCategory $c) => [
                'id' => $c->id,
                'slug' => $c->slug,
                'name' => $c->name,
                'description' => $c->description,
                'security_deposit' => (float) $c->security_deposit,
                'km_per_day_limit' => $c->km_per_day_limit,
                'excess_km_rate' => (float) $c->excess_km_rate,
                'fuel_charge_per_level' => (float) $c->fuel_charge_per_level,
                'currency' => $c->currency?->value ?? 'USD',
                'is_active' => $c->is_active,
                'sort_order' => $c->sort_order,
                'vehicles_count' => $c->vehicles_count,
            ]);

        return Inertia::render('booking-categories/index', [
            'categories' => $categories,
            'filters' => $request->only('search'),
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()?->can('booking_categories.create'), 403);

        return Inertia::render('booking-categories/form', [
            'category' => null,
            ...$this->formOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('booking_categories.create'), 403);

        $data = $this->validateCategory($request);

        BookingCategory::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Booking category created successfully.']);

        return to_route('booking-categories.index');
    }

    public function show(Request $request, BookingCategory $bookingCategory): Response
    {
        abort_unless($request->user()?->can('booking_categories.view'), 403);

        $bookingCategory->load(['vehicles' => fn ($q) => $q->orderBy('reg_plate')]);

        return Inertia::render('booking-categories/show', [
            'category' => [
                'id' => $bookingCategory->id,
                'slug' => $bookingCategory->slug,
                'name' => $bookingCategory->name,
                'description' => $bookingCategory->description,
                'security_deposit' => (float) $bookingCategory->security_deposit,
                'km_per_day_limit' => $bookingCategory->km_per_day_limit,
                'excess_km_rate' => (float) $bookingCategory->excess_km_rate,
                'fuel_charge_per_level' => (float) $bookingCategory->fuel_charge_per_level,
                'currency' => $bookingCategory->currency?->value ?? 'USD',
                'is_active' => $bookingCategory->is_active,
                'sort_order' => $bookingCategory->sort_order,
                'created_at' => $bookingCategory->created_at,
                'vehicles' => $bookingCategory->vehicles->map(fn ($v) => [
                    'id' => $v->id,
                    'label' => trim("{$v->make} {$v->model}"),
                    'reg_plate' => $v->reg_plate,
                    'daily_rate' => (float) $v->daily_rate,
                    'currency' => $v->currency?->value ?? 'USD',
                    'status' => $v->status->value,
                ])->values(),
            ],
        ]);
    }

    public function edit(Request $request, BookingCategory $bookingCategory): Response
    {
        abort_unless($request->user()?->can('booking_categories.update'), 403);

        return Inertia::render('booking-categories/form', [
            'category' => [
                'id' => $bookingCategory->id,
                'slug' => $bookingCategory->slug,
                'name' => $bookingCategory->name,
                'description' => $bookingCategory->description,
                'security_deposit' => (float) $bookingCategory->security_deposit,
                'km_per_day_limit' => $bookingCategory->km_per_day_limit,
                'excess_km_rate' => (float) $bookingCategory->excess_km_rate,
                'fuel_charge_per_level' => (float) $bookingCategory->fuel_charge_per_level,
                'currency' => $bookingCategory->currency?->value ?? 'USD',
                'is_active' => $bookingCategory->is_active,
                'sort_order' => $bookingCategory->sort_order,
            ],
            ...$this->formOptions(),
        ]);
    }

    public function update(Request $request, BookingCategory $bookingCategory): RedirectResponse
    {
        abort_unless($request->user()?->can('booking_categories.update'), 403);

        $data = $this->validateCategory($request, $bookingCategory->id);

        $bookingCategory->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Booking category updated successfully.']);

        return to_route('booking-categories.show', $bookingCategory);
    }

    public function destroy(Request $request, BookingCategory $bookingCategory): RedirectResponse
    {
        abort_unless($request->user()?->can('booking_categories.delete'), 403);

        if ($bookingCategory->vehicles()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Cannot delete: this category is still assigned to one or more vehicles.',
            ]);

            return back();
        }

        $bookingCategory->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Booking category removed.']);

        return to_route('booking-categories.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'currencies' => collect(Currency::cases())->map(fn ($e) => ['value' => $e->value, 'label' => $e->value]),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function validateCategory(Request $request, ?int $categoryId = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:255'],
            'security_deposit' => ['required', 'numeric', 'min:0'],
            'km_per_day_limit' => ['required', 'integer', 'min:0'],
            'excess_km_rate' => ['required', 'numeric', 'min:0'],
            'fuel_charge_per_level' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $data['fuel_charge_per_level'] = $data['fuel_charge_per_level'] ?? 0;
        $data['is_active'] = $data['is_active'] ?? true;
        $data['sort_order'] = $data['sort_order'] ?? 0;
        $data['currency'] = $data['currency'] ?? Currency::USD->value;

        return $data;
    }
}
