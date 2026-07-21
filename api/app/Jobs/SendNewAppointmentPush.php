<?php

namespace App\Jobs;

use App\Models\Appointment;
use App\Services\ExpoPushService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendNewAppointmentPush implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $appointmentId) {}

    public function handle(ExpoPushService $push): void
    {
        $appointment = Appointment::query()
            ->with('barber')
            ->find($this->appointmentId);

        if ($appointment === null || $appointment->barber === null) {
            return;
        }

        $whenLabel = $appointment->starts_at
            ->timezone($appointment->tenant?->timezone ?? 'America/Sao_Paulo')
            ->format('d/m H:i');

        $push->notifyBarberNewAppointment(
            $appointment->barber,
            $appointment->client_name ?: 'Cliente',
            $whenLabel,
            $appointment->id,
        );
    }
}
