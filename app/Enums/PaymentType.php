<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentType: string
{
    case Rental = 'rental';
    case Deposit = 'deposit';
    case DepositRefund = 'deposit_refund';
    case Refund = 'refund';

    public function label(): string
    {
        return match ($this) {
            self::Rental => 'Rental Payment',
            self::Deposit => 'Deposit',
            self::DepositRefund => 'Deposit Refund',
            self::Refund => 'Refund',
        };
    }
}
