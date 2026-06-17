<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\FuelLevel;
use App\Enums\MileageSource;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\VehicleStatus;
use App\Exceptions\CustomerBlacklistedException;
use App\Exceptions\InvalidBookingException;
use App\Exceptions\VehicleUnavailableException;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\MileageLog;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vehicle;
use App\Notifications\AppNotification;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Booking lifecycle: quote → create → confirm → activate → complete.
 *
 * Shared by:
 *  - Admin dashboard (walk-in + remote confirmations)
 *  - Customer web SPA (self-service booking)
 *  - Mobile app (booking flow)
 */
class BookingService
{
    public function __construct(
        private PricingService $pricing,
        private VehicleAvailabilityService $availability,
    ) {}

    /**
     * Create a booking in pending state. Validates customer standing + vehicle availability.
     *
     * @param  array{
     *   customer_id: int,
     *   vehicle_id: int,
     *   pickup_datetime: string|\DateTimeInterface,
     *   return_datetime: string|\DateTimeInterface,
     *   extras?: array<string, float>,
     *   pickup_location?: string|null,
     *   return_location?: string|null,
     *   fuel_level_pickup?: string|null,
     *   odometer_start?: int|null,
     *   cross_border?: bool,
     *   cross_border_countries?: array<int, string>|null,
     *   notes?: string|null,
     * }  $data
     */
    public function create(array $data, ?User $actor = null): Booking
    {
        $customer = Customer::findOrFail($data['customer_id']);
        $vehicle = Vehicle::with('bookingCategory')->findOrFail($data['vehicle_id']);

        if ($customer->isBlacklisted()) {
            throw CustomerBlacklistedException::make($customer->name);
        }

        $category = $vehicle->bookingCategory;
        if ($category === null) {
            throw InvalidBookingException::missingBookingCategory($vehicle->reg_plate);
        }

        $pickup = $this->toDateTime($data['pickup_datetime']);
        $return = $this->toDateTime($data['return_datetime']);

        if ($return <= $pickup) {
            throw InvalidBookingException::returnBeforePickup();
        }

        if (in_array($vehicle->status, [VehicleStatus::Decommissioned, VehicleStatus::Maintenance], true)) {
            throw VehicleUnavailableException::notRentable($vehicle->reg_plate, $vehicle->status->value);
        }

        if (! $this->availability->isAvailable($vehicle, $pickup, $return)) {
            throw VehicleUnavailableException::forDates(
                $vehicle->reg_plate,
                $pickup->format('Y-m-d H:i'),
                $return->format('Y-m-d H:i'),
            );
        }

        $quote = $this->pricing->quote(
            $vehicle,
            $pickup,
            $return,
            $data['extras'] ?? [],
        );

        $booking = DB::transaction(
            fn () => Booking::create([
                'reference' => $this->generateReference(),
                'customer_id' => $customer->id,
                'vehicle_id' => $vehicle->id,
                'created_by_user_id' => $actor?->id,
                'pickup_datetime' => $pickup,
                'return_datetime' => $return,
                'odometer_start' => isset($data['odometer_start']) ? (int) $data['odometer_start'] : null,
                'rental_days' => $quote->rentalDays,
                'km_allowance' => $quote->kmAllowance,
                'daily_rate' => $quote->dailyRate,
                'excess_km_rate' => $quote->excessKmRate,
                'currency' => $vehicle->currency,
                'base_amount' => $quote->baseAmount,
                'extras_amount' => $quote->extrasAmount,
                'total_amount' => $quote->totalAmount,
                'deposit_amount' => (float) $category->security_deposit,
                'extras' => $data['extras'] ?? null,
                'pickup_location' => $data['pickup_location'] ?? null,
                'return_location' => $data['return_location'] ?? null,
                'fuel_level_pickup' => $data['fuel_level_pickup'] ?? null,
                'cross_border' => $data['cross_border'] ?? false,
                'cross_border_countries' => $data['cross_border_countries'] ?? null,
                'status' => BookingStatus::Pending,
                'notes' => $data['notes'] ?? null,
            ]),
        );

        $this->notifyCustomer($booking, new AppNotification(
            type: 'booking.created',
            title: 'Booking received',
            body: "We've received your booking {$booking->reference} for {$vehicle->make} {$vehicle->model}. The rental team will confirm it shortly.",
            data: ['booking_id' => $booking->id, 'reference' => $booking->reference],
            withEmail: true,
        ));

        return $booking;
    }

    public function confirm(Booking $booking): Booking
    {
        $this->assertTransition($booking->status, BookingStatus::Confirmed, [BookingStatus::Pending]);

        $booking->update(['status' => BookingStatus::Confirmed]);
        $booking->refresh();

        $this->notifyCustomer($booking, new AppNotification(
            type: 'booking.confirmed',
            title: 'Booking confirmed',
            body: "Your booking {$booking->reference} is confirmed. You can now pay the deposit and balance from the app.",
            data: ['booking_id' => $booking->id, 'reference' => $booking->reference],
            withEmail: true,
        ));

        return $booking;
    }

    /**
     * Transition to Active when the customer collects the vehicle. Records the
     * pickup odometer and flips the vehicle to Rented.
     */
    public function activate(Booking $booking, int $odometerStart, ?User $actor = null): Booking
    {
        $this->assertTransition($booking->status, BookingStatus::Active, [
            BookingStatus::Pending,
            BookingStatus::Confirmed,
        ]);

        return DB::transaction(function () use ($booking, $odometerStart, $actor) {
            $booking->update([
                'status' => BookingStatus::Active,
                'actual_pickup_at' => now(),
                'odometer_start' => $odometerStart,
            ]);

            $booking->vehicle->update([
                'status' => VehicleStatus::Rented,
                'current_odometer' => max((int) $booking->vehicle->current_odometer, $odometerStart),
            ]);

            MileageLog::create([
                'vehicle_id' => $booking->vehicle_id,
                'booking_id' => $booking->id,
                'recorded_by_user_id' => $actor?->id,
                'odometer_reading' => $odometerStart,
                'source' => MileageSource::Manual,
                'recorded_at' => now(),
                'notes' => 'Pickup',
            ]);

            return $booking->refresh();
        });
    }

    /**
     * Transition to Completed when the vehicle is returned. Recalculates
     * mileage overage + fuel charge, reconciles them against the deposit, and
     * creates a deposit refund payment for any surplus.
     *
     * @param  string|FuelLevel|null  $fuelLevelReturn  Return-time fuel reading, either the enum
     *                                                  value string (`empty`/`quarter`/…) or the enum
     *                                                  instance. Inspection submissions can pass it
     *                                                  through verbatim.
     */
    public function complete(
        Booking $booking,
        int $odometerEnd,
        ?User $actor = null,
        string|FuelLevel|null $fuelLevelReturn = null,
    ): Booking {
        $this->assertTransition($booking->status, BookingStatus::Completed, [BookingStatus::Active]);

        if ((int) $booking->odometer_start > $odometerEnd) {
            throw InvalidBookingException::odometerRegression((int) $booking->odometer_start, $odometerEnd);
        }

        return DB::transaction(function () use ($booking, $odometerEnd, $actor, $fuelLevelReturn) {
            $booking->loadMissing('vehicle.bookingCategory');
            $category = $booking->vehicle->bookingCategory;
            if ($category === null) {
                throw InvalidBookingException::missingBookingCategory($booking->vehicle->reg_plate);
            }

            $pickupLevel = $this->toFuelLevel($booking->fuel_level_pickup);
            $returnLevel = $this->toFuelLevel($fuelLevelReturn ?? $booking->fuel_level_return);
            $fuelCharge = $this->pricing->calculateFuelCharge($category, $pickupLevel, $returnLevel);

            $quote = $this->pricing->quote(
                $booking->vehicle,
                $booking->pickup_datetime,
                $booking->return_datetime,
                $booking->extras ?? [],
                $fuelCharge,
                (float) $booking->damage_charge,
                (int) $booking->odometer_start,
                $odometerEnd,
            );

            $deductions = $quote->mileageOverageAmount + $fuelCharge + (float) $booking->damage_charge;
            $reconciliation = $this->pricing->reconcileDeposit(
                (float) $booking->deposit_amount,
                $deductions,
            );

            $booking->update([
                'status' => BookingStatus::Completed,
                'actual_return_at' => now(),
                'odometer_end' => $odometerEnd,
                'mileage_overage_amount' => $quote->mileageOverageAmount,
                'fuel_charge' => $fuelCharge,
                'fuel_level_return' => $returnLevel?->value,
                'total_amount' => $quote->totalAmount,
            ]);

            $booking->vehicle->update([
                'status' => VehicleStatus::Available,
                'current_odometer' => $odometerEnd,
            ]);

            MileageLog::create([
                'vehicle_id' => $booking->vehicle_id,
                'booking_id' => $booking->id,
                'recorded_by_user_id' => $actor?->id,
                'odometer_reading' => $odometerEnd,
                'source' => MileageSource::Manual,
                'recorded_at' => now(),
                'notes' => 'Return',
            ]);

            // Cash back to the customer — the slice of deposit not consumed
            // by deductions.
            if ($reconciliation['refund'] > 0) {
                Payment::create([
                    'reference' => 'REF-'.strtoupper(Str::random(8)),
                    'customer_id' => $booking->customer_id,
                    'booking_id' => $booking->id,
                    'amount' => $reconciliation['refund'],
                    'currency' => $booking->currency,
                    'method' => PaymentMethod::Cash,
                    'type' => PaymentType::DepositRefund,
                    'status' => PaymentStatus::Completed,
                    'recorded_by_user_id' => $actor?->id,
                    'paid_at' => now(),
                    'notes' => 'Security deposit refund on return.',
                ]);
            }

            // Retained slice — the portion of the deposit consumed by the
            // overage / fuel / damage deductions. We DO NOT record this as
            // a `deposit_refund` (that would inflate the Refunded tile and
            // lie to the customer about cash received). Instead we record
            // a single `rental` Payment representing the deposit being
            // applied to the new charges, and bump paid_amount so the
            // balance_due settles. The Deducted tile on the client side is
            // derived from the booking's charge fields.
            //
            // Equals min(deposit, deductions); equivalent to deposit - refund
            // since refund = max(0, deposit - deductions).
            $retainedFromDeposit = max(
                0.0,
                (float) $booking->deposit_amount - (float) $reconciliation['refund'],
            );
            if ($retainedFromDeposit > 0) {
                Payment::create([
                    'reference' => 'PAY-'.strtoupper(Str::random(10)),
                    'customer_id' => $booking->customer_id,
                    'booking_id' => $booking->id,
                    'invoice_id' => $booking->invoice?->id,
                    'amount' => round($retainedFromDeposit, 2),
                    'currency' => $booking->currency,
                    'method' => PaymentMethod::Cash,
                    'type' => PaymentType::Rental,
                    'status' => PaymentStatus::Completed,
                    'recorded_by_user_id' => $actor?->id,
                    'paid_at' => now(),
                    'notes' => 'Rental charges settled from deposit.',
                ]);

                $booking->increment('paid_amount', round($retainedFromDeposit, 2));
            }

            $fresh = $booking->refresh();

            $bodyParts = [
                "Your rental {$fresh->reference} is closed.",
            ];
            if ($reconciliation['refund'] > 0) {
                $bodyParts[] = 'Deposit refund of '.number_format($reconciliation['refund'], 2)
                    .' '.$fresh->currency->value.' is on its way.';
            } elseif ($reconciliation['balance_owed'] > 0) {
                $bodyParts[] = 'You owe an additional '.number_format($reconciliation['balance_owed'], 2)
                    .' '.$fresh->currency->value.' for excess km / fuel / damage. Please settle the invoice.';
            }
            $this->notifyCustomer($fresh, new AppNotification(
                type: 'booking.completed',
                title: 'Rental complete',
                body: implode(' ', $bodyParts),
                data: [
                    'booking_id' => $fresh->id,
                    'reference' => $fresh->reference,
                    'refund' => $reconciliation['refund'],
                    'balance_owed' => $reconciliation['balance_owed'],
                ],
                withEmail: true,
            ));

            return $fresh;
        });
    }

    private function toFuelLevel(string|FuelLevel|null $value): ?FuelLevel
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof FuelLevel) {
            return $value;
        }

        return FuelLevel::tryFrom($value);
    }

    /**
     * Cancel a pending/confirmed booking and auto-refund anything the customer
     * has already paid. A cancellation only fires before the vehicle has been
     * handed over (we block the transition out of Active/Completed), so the
     * rental tiers haven't been consumed — a full refund of both the deposit
     * bucket and any rental payments is the correct default.
     */
    public function cancel(
        Booking $booking,
        string $reason,
        ?User $actor = null,
    ): Booking {
        $this->assertTransition($booking->status, BookingStatus::Cancelled, [
            BookingStatus::Pending,
            BookingStatus::Confirmed,
        ]);

        return DB::transaction(function () use ($booking, $reason, $actor) {
            $booking->loadMissing('payments');

            $depositCollected = $booking->payments
                ->where('type', PaymentType::Deposit)
                ->sum(fn ($p) => (float) $p->amount);
            $depositAlreadyRefunded = $booking->payments
                ->where('type', PaymentType::DepositRefund)
                ->sum(fn ($p) => (float) $p->amount);
            $depositOwed = max(0.0, $depositCollected - $depositAlreadyRefunded);

            $rentalCollected = $booking->payments
                ->where('type', PaymentType::Rental)
                ->sum(fn ($p) => (float) $p->amount);
            $rentalAlreadyRefunded = $booking->payments
                ->where('type', PaymentType::Refund)
                ->sum(fn ($p) => (float) $p->amount);
            $rentalOwed = max(0.0, $rentalCollected - $rentalAlreadyRefunded);

            $booking->update([
                'status' => BookingStatus::Cancelled,
                'cancellation_reason' => $reason,
            ]);

            if ($depositOwed > 0) {
                Payment::create([
                    'reference' => 'REF-'.strtoupper(Str::random(8)),
                    'customer_id' => $booking->customer_id,
                    'booking_id' => $booking->id,
                    'amount' => round($depositOwed, 2),
                    'currency' => $booking->currency,
                    'method' => PaymentMethod::Cash,
                    'type' => PaymentType::DepositRefund,
                    'status' => PaymentStatus::Completed,
                    'recorded_by_user_id' => $actor?->id,
                    'paid_at' => now(),
                    'notes' => 'Auto-refund: booking cancelled.',
                ]);
            }

            if ($rentalOwed > 0) {
                Payment::create([
                    'reference' => 'REF-'.strtoupper(Str::random(8)),
                    'customer_id' => $booking->customer_id,
                    'booking_id' => $booking->id,
                    'invoice_id' => $booking->invoice?->id,
                    'amount' => round($rentalOwed, 2),
                    'currency' => $booking->currency,
                    'method' => PaymentMethod::Cash,
                    'type' => PaymentType::Refund,
                    'status' => PaymentStatus::Completed,
                    'recorded_by_user_id' => $actor?->id,
                    'paid_at' => now(),
                    'notes' => 'Auto-refund: booking cancelled.',
                ]);
                // Keep paid_amount in sync with the rental bucket so the
                // booking's balance_due reflects what's actually owed.
                $booking->update([
                    'paid_amount' => max(0, (float) $booking->paid_amount - $rentalOwed),
                ]);
            }

            $fresh = $booking->refresh();
            $totalRefunded = $depositOwed + $rentalOwed;
            $body = "Your booking {$fresh->reference} has been cancelled.";
            if ($totalRefunded > 0) {
                $body .= ' We have refunded '.number_format($totalRefunded, 2)
                    .' '.$fresh->currency->value.' to you.';
            }
            $this->notifyCustomer($fresh, new AppNotification(
                type: 'booking.cancelled',
                title: 'Booking cancelled',
                body: $body,
                data: [
                    'booking_id' => $fresh->id,
                    'reference' => $fresh->reference,
                    'refunded' => $totalRefunded,
                ],
                withEmail: true,
            ));

            return $fresh;
        });
    }

    private function generateReference(): string
    {
        return 'BK-'.strtoupper(Str::random(8));
    }

    /**
     * Send a notification to the booking's owning customer (if their User
     * record exists). Failures are swallowed + logged so a missing mail
     * driver, broken SMTP, etc. doesn't roll back the booking transaction.
     */
    private function notifyCustomer(Booking $booking, AppNotification $notification): void
    {
        try {
            $user = $booking->customer?->user;
            if ($user !== null) {
                $user->notify($notification);
            }
        } catch (\Throwable $e) {
            Log::warning('Notification dispatch failed', [
                'booking_id' => $booking->id,
                'type' => $notification->type,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * @param  array<int, BookingStatus>  $allowedFrom
     */
    private function assertTransition(BookingStatus $current, BookingStatus $target, array $allowedFrom): void
    {
        if (! in_array($current, $allowedFrom, true)) {
            throw InvalidBookingException::invalidTransition($current->value, $target->value);
        }
    }

    private function toDateTime(string|\DateTimeInterface $value): DateTimeImmutable
    {
        if ($value instanceof DateTimeImmutable) {
            return $value;
        }

        if ($value instanceof \DateTimeInterface) {
            return DateTimeImmutable::createFromInterface($value);
        }

        return new DateTimeImmutable($value);
    }
}
