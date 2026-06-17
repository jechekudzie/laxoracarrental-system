<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\FuelLevel;
use App\Exceptions\InvalidBookingException;
use App\Models\BookingCategory;
use App\Models\Vehicle;
use App\Services\Data\BookingQuote;
use DateTimeInterface;

/**
 * Pure calculation service: no DB writes, no side effects.
 *
 * Commercial terms (security deposit, km allowance, excess km rate, fuel charge
 * per level) live on the vehicle's BookingCategory, not the vehicle itself.
 * Vehicle-level daily_rate is still honored so outsourced vehicles can carry a
 * per-unit markup inside a shared category tier.
 *
 *   base        = rental_days × daily_rate
 *   allowance   = rental_days × category.km_per_day_limit
 *   overage     = max(0, actual_km − allowance) × category.excess_km_rate
 *   fuel_charge = levels_short × category.fuel_charge_per_level  (surplus ignored)
 *   total       = base + overage + extras + fuel + damage + tax
 */
class PricingService
{
    /**
     * Quote a booking before it exists in the DB (customer search → pricing preview).
     *
     * @param  array<string, float>  $extras  optional line items keyed by name
     */
    public function quote(
        Vehicle $vehicle,
        DateTimeInterface $pickup,
        DateTimeInterface $return,
        array $extras = [],
        float $fuelCharge = 0.0,
        float $damageCharge = 0.0,
        ?int $odometerStart = null,
        ?int $odometerEnd = null,
    ): BookingQuote {
        $category = $this->requireCategory($vehicle);

        $rentalDays = $this->calculateRentalDays($pickup, $return);
        $kmAllowance = $rentalDays * (int) $category->km_per_day_limit;
        $dailyRate = (float) $vehicle->daily_rate;
        $excessKmRate = (float) $category->excess_km_rate;
        $securityDeposit = (float) $category->security_deposit;

        $baseAmount = round($rentalDays * $dailyRate, 2);

        [$actualDistance, $excessKm, $overageAmount] = $this->calculateMileageOverage(
            $odometerStart,
            $odometerEnd,
            $kmAllowance,
            $excessKmRate,
        );

        $extrasAmount = round(array_sum($extras), 2);
        $taxAmount = 0.0;

        // Reconciled booking total — base rental + extras today, gets
        // mileage overage / fuel shortfall / damage added on return.
        // Deposit is NOT part of this number (see BookingService::complete).
        $totalAmount = round(
            $baseAmount + $overageAmount + $extrasAmount + $fuelCharge + $damageCharge + $taxAmount,
            2,
        );

        // What the customer pays up-front: reconciled total + refundable
        // deposit. Deposit is a separate line that's refunded on return minus
        // any excess-km / fuel / damage deductions.
        $totalEstimated = round($totalAmount + $securityDeposit, 2);

        return new BookingQuote(
            rentalDays: $rentalDays,
            kmAllowance: $kmAllowance,
            dailyRate: $dailyRate,
            excessKmRate: $excessKmRate,
            baseAmount: $baseAmount,
            securityDeposit: $securityDeposit,
            totalEstimated: $totalEstimated,
            actualDistance: $actualDistance,
            excessKm: $excessKm,
            mileageOverageAmount: $overageAmount,
            extrasAmount: $extrasAmount,
            fuelCharge: $fuelCharge,
            damageCharge: $damageCharge,
            taxAmount: $taxAmount,
            totalAmount: $totalAmount,
            currency: $vehicle->currency?->value ?? $category->currency?->value ?? 'USD',
        );
    }

    /**
     * Round up any partial day to a full rental day. A 26-hour rental = 2 days.
     */
    public function calculateRentalDays(DateTimeInterface $pickup, DateTimeInterface $return): int
    {
        $seconds = $return->getTimestamp() - $pickup->getTimestamp();

        if ($seconds <= 0) {
            return 0;
        }

        return (int) max(1, ceil($seconds / 86400));
    }

    /**
     * @return array{0: int, 1: int, 2: float} [actual_distance, excess_km, overage_amount]
     */
    public function calculateMileageOverage(
        ?int $odometerStart,
        ?int $odometerEnd,
        int $kmAllowance,
        float $excessKmRate,
    ): array {
        if ($odometerStart === null || $odometerEnd === null) {
            return [0, 0, 0.0];
        }

        $actualDistance = max(0, $odometerEnd - $odometerStart);
        $excessKm = max(0, $actualDistance - $kmAllowance);
        $overageAmount = round($excessKm * $excessKmRate, 2);

        return [$actualDistance, $excessKm, $overageAmount];
    }

    /**
     * Charge for fuel returned below pickup level. Surplus is ignored so
     * customers can't turn unused fuel into a refund.
     */
    public function calculateFuelCharge(
        BookingCategory $category,
        ?FuelLevel $pickup,
        ?FuelLevel $return,
    ): float {
        $levelsShort = FuelLevel::levelsShort($pickup, $return);

        return round($levelsShort * (float) $category->fuel_charge_per_level, 2);
    }

    /**
     * Reconcile the security deposit against damage/fuel/mileage deductions.
     *
     * @return array{refund: float, balance_owed: float}
     */
    public function reconcileDeposit(float $deposit, float $deductions): array
    {
        $refund = round(max(0.0, $deposit - $deductions), 2);
        $balanceOwed = round(max(0.0, $deductions - $deposit), 2);

        return ['refund' => $refund, 'balance_owed' => $balanceOwed];
    }

    private function requireCategory(Vehicle $vehicle): BookingCategory
    {
        $category = $vehicle->bookingCategory;

        if ($category === null) {
            throw InvalidBookingException::missingBookingCategory($vehicle->reg_plate);
        }

        return $category;
    }
}
