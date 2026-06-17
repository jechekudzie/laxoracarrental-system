<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\AppNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Records payments against invoices/bookings. Used by the Finance module
 * (admin) and by Paynow webhook handlers from the customer SPA/mobile app.
 */
class PaymentService
{
    public function __construct(private InvoiceService $invoices) {}

    /**
     * Record a completed payment against an invoice or booking.
     *
     * The `type` on the payload controls how the booking buckets are updated:
     *   - `rental`   → counts toward booking.paid_amount (hire fee bucket)
     *   - `deposit`  → NOT added to paid_amount; tracked via the Payment row
     *                  itself so deposit held/refunded stays independent of
     *                  the hire fee tally.
     *   - `deposit_refund` / `refund` → never auto-adjust paid_amount here.
     *
     * @param  array{
     *   amount: float,
     *   method: PaymentMethod|string,
     *   type?: PaymentType|string|null,
     *   gateway?: string|null,
     *   gateway_reference?: string|null,
     *   paynow_poll_url?: string|null,
     *   notes?: string|null,
     * }  $data
     */
    public function record(
        Invoice|Booking $target,
        array $data,
        ?User $actor = null,
    ): Payment {
        return DB::transaction(function () use ($target, $data, $actor) {
            [$invoiceId, $bookingId, $customerId] = $this->resolveTarget($target);

            // Default: invoice targets are rental payments, booking targets
            // without an explicit type default to deposit (that's the only
            // reason the API path would bypass the invoice).
            $type = $this->resolveType($data['type'] ?? null, $target);

            // Idempotency guard — if the same target just received an
            // identical payment (same type + amount + method) in the last
            // 15 seconds by the same actor, return the existing row instead
            // of creating a duplicate. This catches double-taps and retries
            // from stale-UI situations without forcing the client to send a
            // client-generated key.
            $recent = Payment::query()
                ->when($invoiceId, fn ($q) => $q->where('invoice_id', $invoiceId))
                ->when(
                    ! $invoiceId,
                    fn ($q) => $q
                        ->whereNull('invoice_id')
                        ->where('booking_id', $bookingId),
                )
                ->where('type', $type)
                ->where('amount', $data['amount'])
                ->where('customer_id', $customerId)
                ->where('created_at', '>=', now()->subSeconds(15))
                ->latest('id')
                ->first();
            if ($recent !== null) {
                return $recent;
            }

            $payment = Payment::create([
                'reference' => 'PAY-'.strtoupper(Str::random(10)),
                'invoice_id' => $invoiceId,
                'booking_id' => $bookingId,
                'customer_id' => $customerId,
                'recorded_by_user_id' => $actor?->id,
                'amount' => $data['amount'],
                'currency' => $target->currency,
                'method' => $data['method'] instanceof PaymentMethod
                    ? $data['method']
                    : PaymentMethod::from($data['method']),
                'type' => $type,
                'gateway' => $data['gateway'] ?? null,
                'gateway_reference' => $data['gateway_reference'] ?? null,
                'paynow_poll_url' => $data['paynow_poll_url'] ?? null,
                'status' => PaymentStatus::Completed,
                'paid_at' => now(),
                'notes' => $data['notes'] ?? null,
            ]);

            // Only rental payments feed the invoice + booking.paid_amount.
            // Deposits and refunds live on the Payment row exclusively.
            if ($type === PaymentType::Rental) {
                if ($target instanceof Invoice) {
                    $this->invoices->markPaid($target, (float) $data['amount']);
                } else {
                    $target->increment('paid_amount', (float) $data['amount']);
                }
            }

            $this->notifyOnPayment($target, $payment);

            return $payment->refresh();
        });
    }

    /**
     * Tell the owning customer their payment landed. Failures are swallowed
     * so a flaky mail driver can't roll back the payment write.
     */
    private function notifyOnPayment(
        Invoice|Booking $target,
        Payment $payment,
    ): void {
        try {
            $customer = $target instanceof Invoice
                ? $target->customer
                : $target->customer;
            $user = $customer?->user;
            if ($user === null) {
                return;
            }

            $bookingRef = $target instanceof Booking
                ? $target->reference
                : ($target->booking?->reference ?? '');

            $label = match ($payment->type) {
                PaymentType::Deposit => 'Deposit received',
                PaymentType::Rental => 'Payment received',
                PaymentType::DepositRefund => 'Deposit refunded',
                PaymentType::Refund => 'Refund issued',
                default => 'Payment recorded',
            };

            $body = sprintf(
                '%s of %s %s on booking %s.',
                $label,
                number_format((float) $payment->amount, 2),
                $payment->currency?->value ?? '',
                $bookingRef,
            );

            $user->notify(new AppNotification(
                type: 'payment.'.($payment->type?->value ?? 'recorded'),
                title: $label,
                body: trim($body),
                data: [
                    'payment_id' => $payment->id,
                    'booking_id' => $target instanceof Booking
                        ? $target->id
                        : $target->booking_id,
                    'amount' => (float) $payment->amount,
                    'type' => $payment->type?->value,
                ],
                withEmail: in_array(
                    $payment->type,
                    [PaymentType::Rental, PaymentType::Deposit, PaymentType::DepositRefund],
                    true,
                ),
            ));
        } catch (\Throwable $e) {
            Log::warning('Payment notification dispatch failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function resolveType(
        PaymentType|string|null $raw,
        Invoice|Booking $target,
    ): PaymentType {
        if ($raw instanceof PaymentType) {
            return $raw;
        }

        if (is_string($raw) && $raw !== '') {
            return PaymentType::from($raw);
        }

        // No type supplied → default by target.
        return $target instanceof Invoice ? PaymentType::Rental : PaymentType::Deposit;
    }

    /**
     * @return array{0: ?int, 1: ?int, 2: int}
     */
    private function resolveTarget(Invoice|Booking $target): array
    {
        if ($target instanceof Invoice) {
            return [$target->id, $target->booking_id, $target->customer_id];
        }

        return [$target->invoice?->id, $target->id, $target->customer_id];
    }
}
