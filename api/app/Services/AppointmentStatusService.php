<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use InvalidArgumentException;

class AppointmentStatusService
{
    /**
     * @var array<string, list<AppointmentStatus>>
     */
    private const TRANSITIONS = [
        'pending' => [AppointmentStatus::Confirmed, AppointmentStatus::Cancelled],
        'confirmed' => [AppointmentStatus::InProgress, AppointmentStatus::Cancelled, AppointmentStatus::NoShow],
        'in_progress' => [AppointmentStatus::Completed, AppointmentStatus::Cancelled],
    ];

    public function updateStatus(Appointment $appointment, AppointmentStatus $status): Appointment
    {
        if ($appointment->status === $status) {
            return $appointment;
        }

        if (in_array($appointment->status, [AppointmentStatus::Completed, AppointmentStatus::Cancelled, AppointmentStatus::NoShow], true)) {
            throw new InvalidArgumentException('This appointment can no longer be updated.');
        }

        $allowed = self::TRANSITIONS[$appointment->status->value] ?? [];

        if (! in_array($status, $allowed, true)) {
            throw new InvalidArgumentException(
                sprintf('Cannot change status from %s to %s.', $appointment->status->value, $status->value),
            );
        }

        $appointment->status = $status;

        if ($status === AppointmentStatus::Cancelled) {
            $appointment->cancelled_at = now();
        }

        $appointment->save();

        return $appointment->fresh(['barber', 'services']);
    }
}
