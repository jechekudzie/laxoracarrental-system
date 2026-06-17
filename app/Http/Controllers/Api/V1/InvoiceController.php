<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\InvoiceResource;
use App\Models\Booking;
use App\Models\Invoice;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InvoiceController extends Controller
{
    public function __construct(private InvoiceService $invoices) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        abort_unless($request->user()?->can('invoices.view'), 403);

        $invoices = Invoice::query()
            ->with('customer')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('customer_id'), fn ($q) => $q->where('customer_id', $request->integer('customer_id')))
            ->latest('issued_at')
            ->paginate($request->integer('per_page', 20));

        return InvoiceResource::collection($invoices);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('invoices.create'), 403);

        $validated = $request->validate([
            'booking_id' => ['required', 'exists:bookings,id'],
        ]);

        $booking = Booking::findOrFail($validated['booking_id']);
        $invoice = $this->invoices->generateForBooking($booking);

        return InvoiceResource::make($invoice)->response()->setStatusCode(201);
    }

    public function show(Request $request, Invoice $invoice): InvoiceResource
    {
        abort_unless($request->user()?->can('invoices.view'), 403);

        return InvoiceResource::make($invoice->load('customer', 'payments'));
    }

    public function update(Request $request, Invoice $invoice): InvoiceResource
    {
        abort_unless($request->user()?->can('invoices.update'), 403);

        $validated = $request->validate([
            'notes' => ['nullable', 'string'],
            'due_at' => ['nullable', 'date'],
        ]);

        $invoice->update($validated);

        return InvoiceResource::make($invoice);
    }

    public function destroy(Request $request, Invoice $invoice): JsonResponse
    {
        abort_unless($request->user()?->can('invoices.update'), 403);

        $invoice->delete();

        return response()->json(null, 204);
    }
}
