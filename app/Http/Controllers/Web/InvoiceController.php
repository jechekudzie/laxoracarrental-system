<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function index(Request $request): Response
    {
        $invoices = Invoice::with(['customer', 'booking'])
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('number', 'like', "%{$s}%")
                    ->orWhereHas('customer', fn ($q) => $q->where('name', 'like', "%{$s}%"));
            }))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Invoice $inv) => [
                'id' => $inv->id,
                'number' => $inv->number,
                'customer_name' => $inv->customer->name,
                'booking_id' => $inv->booking?->id,
                'booking_reference' => $inv->booking?->reference,
                'status' => $inv->status->value,
                'total_amount' => (float) $inv->total,
                'paid_amount' => (float) $inv->paid_amount,
                'currency' => $inv->currency->value,
                'due_date' => $inv->due_at,
                'issued_at' => $inv->issued_at,
            ]);

        return Inertia::render('invoices/index', [
            'invoices' => $invoices,
            'filters' => $request->only('search', 'status'),
            'statuses' => collect(InvoiceStatus::cases())->map(fn ($e) => ['value' => $e->value, 'label' => ucfirst(str_replace('_', ' ', $e->value))]),
            'summary' => [
                'total' => Invoice::count(),
                'outstanding' => (float) Invoice::whereNotIn('status', ['paid', 'cancelled'])->sum('total'),
                'paid_this_month' => (float) Invoice::where('status', 'paid')->whereMonth('updated_at', now()->month)->sum('total'),
                'overdue' => Invoice::where('status', 'overdue')->count(),
            ],
        ]);
    }

    public function show(Invoice $invoice): Response
    {
        $invoice->load(['customer', 'booking.vehicle', 'payments']);

        return Inertia::render('invoices/show', [
            'invoice' => [
                'id' => $invoice->id,
                'number' => $invoice->number,
                'status' => $invoice->status->value,
                'customer' => [
                    'id' => $invoice->customer->id,
                    'name' => $invoice->customer->name,
                    'phone' => $invoice->customer->phone,
                    'email' => $invoice->customer->email,
                ],
                'booking' => $invoice->booking ? [
                    'id' => $invoice->booking->id,
                    'reference' => $invoice->booking->reference,
                    'vehicle' => $invoice->booking->vehicle->make.' '.$invoice->booking->vehicle->model,
                    'reg_plate' => $invoice->booking->vehicle->reg_plate,
                    'pickup_datetime' => $invoice->booking->pickup_datetime,
                    'return_datetime' => $invoice->booking->return_datetime,
                ] : null,
                'line_items' => $invoice->line_items,
                'subtotal' => (float) $invoice->subtotal,
                'tax_amount' => (float) $invoice->tax,
                'total_amount' => (float) $invoice->total,
                'paid_amount' => (float) $invoice->paid_amount,
                'currency' => $invoice->currency->value,
                'notes' => $invoice->notes,
                'due_date' => $invoice->due_at,
                'issued_at' => $invoice->issued_at,
                'created_at' => $invoice->created_at,
                'payments' => $invoice->payments->map(fn ($p) => [
                    'id' => $p->id,
                    'amount' => (float) $p->amount,
                    'method' => $p->method->value,
                    'status' => $p->status->value,
                    'reference' => $p->reference,
                    'paid_at' => $p->paid_at,
                ]),
            ],
        ]);
    }

    public function downloadPdf(Invoice $invoice): HttpResponse
    {
        $invoice->load([
            'customer',
            'booking.vehicle',
            'payments' => fn ($q) => $q->orderBy('paid_at'),
        ]);

        $methodLabels = [
            'cash' => 'Cash',
            'ecocash' => 'EcoCash',
            'onemoney' => 'OneMoney',
            'bank_transfer' => 'Bank Transfer',
            'card' => 'Card',
            'wallet' => 'Customer Wallet',
        ];

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'methodLabels' => $methodLabels,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream("invoice-{$invoice->number}.pdf");
    }
}
