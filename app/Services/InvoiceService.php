<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Models\Booking;
use App\Models\Invoice;
use Illuminate\Support\Facades\DB;

/**
 * Generates invoices from completed bookings and tracks invoice status transitions.
 * Reused by the admin invoicing screen and the customer portal "view my invoice" flow.
 */
class InvoiceService
{
    public function generateForBooking(Booking $booking): Invoice
    {
        return DB::transaction(function () use ($booking) {
            $existing = $booking->invoice;

            if ($existing) {
                return $existing;
            }

            $lineItems = $this->buildLineItems($booking);

            return Invoice::create([
                'number' => $this->generateInvoiceNumber(),
                'booking_id' => $booking->id,
                'customer_id' => $booking->customer_id,
                'issued_at' => now()->toDateString(),
                'due_at' => now()->addDays(14)->toDateString(),
                'subtotal' => $booking->base_amount,
                'mileage_overage' => $booking->mileage_overage_amount,
                'fuel_charge' => $booking->fuel_charge,
                'extras' => $booking->extras_amount,
                'damage_charge' => $booking->damage_charge,
                'tax' => $booking->tax_amount,
                'total' => $booking->total_amount,
                'paid_amount' => $booking->paid_amount,
                'currency' => $booking->currency,
                'line_items' => $lineItems,
                'status' => InvoiceStatus::Sent,
            ]);
        });
    }

    public function markPaid(Invoice $invoice, float $amount): Invoice
    {
        return DB::transaction(function () use ($invoice, $amount) {
            $newPaid = min((float) $invoice->total, (float) $invoice->paid_amount + $amount);

            $status = match (true) {
                $newPaid >= (float) $invoice->total => InvoiceStatus::Paid,
                $newPaid > 0 => InvoiceStatus::PartiallyPaid,
                default => $invoice->status,
            };

            $invoice->update([
                'paid_amount' => $newPaid,
                'status' => $status,
            ]);

            return $invoice->refresh();
        });
    }

    /**
     * Canonical line-item shape shared by mobile + web readers:
     *   { description, quantity, unit_amount, total }
     * where `total = quantity * unit_amount` (always). Anything that only
     * has a flat amount (e.g. a fuel charge) is modelled as qty=1.
     *
     * @return array<int, array{description: string, quantity: int, unit_amount: float, total: float}>
     */
    private function buildLineItems(Booking $booking): array
    {
        $days = max(1, (int) $booking->rental_days);
        $dailyRate = (float) $booking->daily_rate;
        $items = [
            [
                'description' => "Base rental ({$days} day".($days === 1 ? '' : 's').' @ '
                    .number_format($dailyRate, 2).'/day)',
                'quantity' => $days,
                'unit_amount' => round($dailyRate, 2),
                'total' => round((float) $booking->base_amount, 2),
            ],
        ];

        $overage = (float) $booking->mileage_overage_amount;
        if ($overage > 0) {
            $rate = (float) $booking->excess_km_rate;
            $excessKm = $rate > 0 ? (int) round($overage / $rate) : 1;
            $items[] = [
                'description' => 'Mileage overage ('.$excessKm.' km @ '
                    .number_format($rate, 2).'/km)',
                'quantity' => $excessKm,
                'unit_amount' => round($rate, 2),
                'total' => round($overage, 2),
            ];
        }

        if ((float) $booking->extras_amount > 0) {
            $items[] = [
                'description' => 'Extras',
                'quantity' => 1,
                'unit_amount' => round((float) $booking->extras_amount, 2),
                'total' => round((float) $booking->extras_amount, 2),
            ];
        }

        if ((float) $booking->fuel_charge > 0) {
            $items[] = [
                'description' => 'Fuel shortfall',
                'quantity' => 1,
                'unit_amount' => round((float) $booking->fuel_charge, 2),
                'total' => round((float) $booking->fuel_charge, 2),
            ];
        }

        if ((float) $booking->damage_charge > 0) {
            $items[] = [
                'description' => 'Damage charge',
                'quantity' => 1,
                'unit_amount' => round((float) $booking->damage_charge, 2),
                'total' => round((float) $booking->damage_charge, 2),
            ];
        }

        return $items;
    }

    private function generateInvoiceNumber(): string
    {
        $next = Invoice::withTrashed()->max('id') + 1;

        return sprintf('INV-%s-%06d', now()->format('Y'), $next);
    }
}
