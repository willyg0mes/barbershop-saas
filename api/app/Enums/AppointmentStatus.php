<?php

namespace App\Enums;

enum AppointmentStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case NoShow = 'no_show';

    public function isActive(): bool
    {
        return in_array($this, [
            self::Pending,
            self::Confirmed,
            self::InProgress,
        ], true);
    }
}
