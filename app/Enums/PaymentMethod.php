<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case EcoCash = 'ecocash';
    case OneMoney = 'onemoney';
    case BankTransfer = 'bank_transfer';
    case Card = 'card';
    case Wallet = 'wallet';
}
