<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\PaymentType;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function showReceipt(Payment $payment): Response
    {
        $payment->load(['customer', 'booking.vehicle', 'invoice']);

        return Inertia::render('receipts/show', [
            'payment' => [
                'id' => $payment->id,
                'reference' => $payment->reference,
                'type' => $payment->type?->value ?? 'rental',
                'type_label' => $payment->type?->label() ?? 'Payment',
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency->value,
                'method' => $payment->method->value,
                'gateway_reference' => $payment->gateway_reference,
                'status' => $payment->status->value,
                'paid_at' => $payment->paid_at,
                'notes' => $payment->notes,
                'customer' => [
                    'id' => $payment->customer->id,
                    'name' => $payment->customer->name,
                    'phone' => $payment->customer->phone,
                    'email' => $payment->customer->email,
                ],
                'booking' => $payment->booking ? [
                    'id' => $payment->booking->id,
                    'reference' => $payment->booking->reference,
                    'vehicle_label' => $payment->booking->vehicle
                        ? "{$payment->booking->vehicle->make} {$payment->booking->vehicle->model}"
                        : null,
                    'reg_plate' => $payment->booking->vehicle?->reg_plate,
                ] : null,
                'invoice' => $payment->invoice ? [
                    'id' => $payment->invoice->id,
                    'number' => $payment->invoice->number,
                ] : null,
            ],
        ]);
    }

    public function downloadReceipt(Payment $payment): HttpResponse
    {
        $payment->load(['customer', 'booking.vehicle', 'invoice']);

        $isRefund = in_array($payment->type, [PaymentType::DepositRefund, PaymentType::Refund], true);

        $methodLabels = [
            'cash' => 'Cash',
            'ecocash' => 'EcoCash',
            'onemoney' => 'OneMoney',
            'bank_transfer' => 'Bank Transfer',
            'card' => 'Card',
            'wallet' => 'Customer Wallet',
        ];

        $pdf = Pdf::loadView('pdf.receipt', [
            'payment' => $payment,
            'isRefund' => $isRefund,
            'methodLabels' => $methodLabels,
        ])->setPaper('a5', 'portrait');

        return $pdf->stream("receipt-{$payment->reference}.pdf");
    }
}
