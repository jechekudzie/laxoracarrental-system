<?php

declare(strict_types=1);

namespace App\Enums;

enum ChecklistCondition: string
{
    case OK = 'ok';
    case Fair = 'fair';
    case Poor = 'poor';
    case Damaged = 'damaged';
    case Missing = 'missing';
}
