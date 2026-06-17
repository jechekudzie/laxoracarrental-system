<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreCustomerRequest;
use App\Http\Requests\Api\V1\UpdateCustomerRequest;
use App\Http\Resources\Api\V1\CustomerResource;
use App\Models\Customer;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerController extends Controller
{
    public function __construct(private CustomerService $customers) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        abort_unless($request->user()?->can('customers.view'), 403);

        $customers = Customer::query()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(function ($q) use ($term) {
                    $q->where('name', 'like', $term)
                        ->orWhere('phone', 'like', $term)
                        ->orWhere('email', 'like', $term)
                        ->orWhere('id_number', 'like', $term);
                });
            })
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20));

        return CustomerResource::collection($customers);
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = $this->customers->createWalkIn($request->validated());

        return CustomerResource::make($customer)->response()->setStatusCode(201);
    }

    public function show(Request $request, Customer $customer): CustomerResource
    {
        abort_unless($request->user()?->can('customers.view'), 403);

        return CustomerResource::make($customer);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): CustomerResource
    {
        $customer = $this->customers->update($customer, $request->validated());

        return CustomerResource::make($customer);
    }

    public function destroy(Request $request, Customer $customer): JsonResponse
    {
        abort_unless($request->user()?->can('customers.delete'), 403);

        $customer->delete();

        return response()->json(null, 204);
    }

    public function blacklist(Request $request, Customer $customer): CustomerResource
    {
        abort_unless($request->user()?->can('customers.blacklist'), 403);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $customer = $this->customers->blacklist($customer, $validated['reason']);

        return CustomerResource::make($customer);
    }

    public function reinstate(Request $request, Customer $customer): CustomerResource
    {
        abort_unless($request->user()?->can('customers.blacklist'), 403);

        $customer = $this->customers->reinstate($customer);

        return CustomerResource::make($customer);
    }
}
