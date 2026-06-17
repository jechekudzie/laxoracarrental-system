<?php

declare(strict_types=1);

namespace App\Services\Data;

/**
 * Immutable value object returned by the PricingService.
 *
 * Two "totals" are carried:
 *   - `totalEstimated` = rental fee (base) + security deposit. This is what
 *      the customer pays up-front when the booking is confirmed. Excess km,
 *      fuel shortfall and damage are *not* included — they're deducted from
 *      the deposit on return.
 *   - `totalAmount` = the reconciled booking total after return, covering
 *      rental + any mileage overage + extras + fuel/damage charges. Used by
 *      the booking completion flow.
 */
final readonly class BookingQuote
{
    public function __construct(
        public int $rentalDays,
        public int $kmAllowance,
        public float $dailyRate,
        public float $excessKmRate,
        public float $baseAmount,
        public float $securityDeposit,
        public float $totalEstimated,
        public int $actualDistance,
        public int $excessKm,
        public float $mileageOverageAmount,
        public float $extrasAmount,
        public float $fuelCharge,
        public float $damageCharge,
        public float $taxAmount,
        public float $totalAmount,
        public string $currency,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'rental_days' => $this->rentalDays,
            'km_allowance' => $this->kmAllowance,
            'daily_rate' => $this->dailyRate,
            'excess_km_rate' => $this->excessKmRate,
            'base_amount' => $this->baseAmount,
            'security_deposit' => $this->securityDeposit,
            'total_estimated' => $this->totalEstimated,
            'actual_distance' => $this->actualDistance,
            'excess_km' => $this->excessKm,
            'mileage_overage_amount' => $this->mileageOverageAmount,
            'extras_amount' => $this->extrasAmount,
            'fuel_charge' => $this->fuelCharge,
            'damage_charge' => $this->damageCharge,
            'tax_amount' => $this->taxAmount,
            'total_amount' => $this->totalAmount,
            'currency' => $this->currency,
        ];
    }
}
