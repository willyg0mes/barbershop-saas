<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpoPushService
{
    /**
     * @param  list<string|null>  $tokens
     * @param  array<string, mixed>  $data
     */
    public function sendToTokens(array $tokens, string $title, string $body, array $data = []): void
    {
        $tokens = array_values(array_unique(array_filter($tokens)));

        if ($tokens === []) {
            return;
        }

        $messages = array_map(
            fn (string $token) => [
                'to' => $token,
                'sound' => 'default',
                'title' => $title,
                'body' => $body,
                'data' => $data,
                'channelId' => 'appointments',
            ],
            $tokens,
        );

        try {
            $response = Http::acceptJson()
                ->timeout(8)
                ->post('https://exp.host/--/api/v2/push/send', $messages);

            if (! $response->successful()) {
                Log::warning('expo_push.failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Throwable $exception) {
            Log::warning('expo_push.exception', [
                'message' => $exception->getMessage(),
            ]);
        }
    }

    public function notifyBarberNewAppointment(User $barber, string $clientName, string $whenLabel, int $appointmentId): void
    {
        $this->sendToTokens(
            [$barber->fcm_token],
            'Novo agendamento',
            "{$clientName} · {$whenLabel}",
            [
                'type' => 'appointment_created',
                'appointment_id' => $appointmentId,
            ],
        );
    }
}
