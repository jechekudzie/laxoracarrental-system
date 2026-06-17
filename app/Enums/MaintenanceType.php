<?php

declare(strict_types=1);

namespace App\Enums;

enum MaintenanceType: string
{
    case Scheduled = 'scheduled';
    case Breakdown = 'breakdown';
    case Accident = 'accident';
}
