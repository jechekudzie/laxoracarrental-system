<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Enums\PaymentMethod;
use App\Models\Booking;
use App\Models\Invoice;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class RecordPaymentRequest extends FormRequest
{
    /**
     * Two allowed callers:
     *   1. Staff with the `payments.record` permission — can record on
     *      anyone's behalf (walk-in customer, over-the-phone, etc).
     *   2. The authenticated customer paying their own booking or invoice.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        if ($user === null) {
            return false;
        }

        if ($user->can('payments.record')) {
            return true;
        }

        $customer = $user->customer;
        if ($customer === null) {
            return false;
        }

        if ($this->filled('invoice_id')) {
            $invoice = Invoice::find($this->input('invoice_id'));

            return $invoice !== null && (int) $invoice->customer_id === (int) $customer->id;
        }

        if ($this->filled('booking_id')) {
            $booking = Booking::find($this->input('booking_id'));

            return $booking !== null && (int) $booking->customer_id === (int) $customer->id;
        }

        return false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', Rule::enum(PaymentMethod::class)],
            'type' => [
                'nullable',
                Rule::enum(\App\Enums\PaymentType::class),
            ],
            'invoice_id' => ['nullable', 'exists:invoices,id'],
            'booking_id' => ['nullable', 'exists:bookings,id'],
            'gateway' => ['nullable', 'string', 'max:60'],
            'gateway_reference' => ['nullable', 'string', 'max:120'],
            'paynow_poll_url' => ['nullable', 'string', 'url'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if (! $this->filled('invoice_id') && ! $this->filled('booking_id')) {
                $v->errors()->add('invoice_id', 'Either invoice_id or booking_id is required.');
            }
        });
    }
}
