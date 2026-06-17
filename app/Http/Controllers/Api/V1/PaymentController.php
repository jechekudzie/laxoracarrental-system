<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\RecordPaymentRequest;
use App\Http\Resources\Api\V1\PaymentResource;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $payments) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        abort_unless($request->user()?->can('payments.view'), 403);

        $payments = Payment::query()
            ->when($request->filled('customer_id'), fn ($q) => $q->where('customer_id', $request->integer('customer_id')))
            ->when($request->filled('invoice_id'), fn ($q) => $q->where('invoice_id', $request->integer('invoice_id')))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return PaymentResource::collection($payments);
    }

    public function store(RecordPaymentRequest $request): JsonResponse
    {
        $data = $request->validated();

        $target = isset($data['invoice_id'])
            ? Invoice::findOrFail($data['invoice_id'])
            : Booking::findOrFail($data['booking_id']);

        $payment = $this->payments->record($target, $data, $request->user());

        return PaymentResource::make($payment)->response()->setStatusCode(201);
    }

    public function show(Request $request, Payment $payment): PaymentResource
    {
        abort_unless($request->user()?->can('payments.view'), 403);

        return PaymentResource::make($payment);
    }
}
