<?php

namespace App\Services;

use App\Jobs\SendNewAppointmentPush;
use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class AppointmentBookingService
{
    public function __construct(protected AvailabilityService $availability) {}

    /**
     * @param  list<int>  $serviceIds
     */
    public function book(
        Tenant $tenant,
        User $barber,
        array $serviceIds,
        Carbon $startsAt,
        ?User $client = null,
        ?string $clientName = null,
        ?string $clientPhone = null,
        ?string $clientEmail = null,
        ?string $notes = null,
    ): Appointment {
        $services = Service::query()
            ->forTenant($tenant)
            ->whereIn('id', $serviceIds)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        if ($services->count() !== count(array_unique($serviceIds))) {
            throw new InvalidArgumentException('One or more services are invalid or inactive.');
        }

        $duration = (int) $services->sum('duration_minutes');
        $price = (int) $services->sum('price_cents');
        $localStart = $startsAt->copy()->timezone($tenant->timezone);

        $availability = $this->availability->getAvailableSlots(
            $tenant,
            $localStart,
            $duration,
            $barber->id,
        );

        $slotMatches = collect($availability['barbers'])
            ->firstWhere('id', $barber->id)['slots'] ?? [];

        $requestedSlot = $localStart->toIso8601String();

        if (! in_array($requestedSlot, $slotMatches, true)) {
            throw new InvalidArgumentException('Selected time slot is not available.');
        }

        return DB::transaction(function () use (
            $tenant,
            $barber,
            $client,
            $services,
            $localStart,
            $duration,
            $price,
            $clientName,
            $clientPhone,
            $clientEmail,
            $notes,
        ) {
            $endsAt = $localStart->copy()->addMinutes($duration);

            $appointment = Appointment::query()->create([
                'tenant_id' => $tenant->id,
                'client_id' => $client?->id,
                'barber_id' => $barber->id,
                'client_name' => $clientName ?? $client?->name,
                'client_phone' => $clientPhone ?? $client?->phone,
                'client_email' => $clientEmail ?? $client?->email,
                'starts_at' => $localStart,
                'ends_at' => $endsAt,
                'total_duration_minutes' => $duration,
                'total_price_cents' => $price,
                'status' => AppointmentStatus::Pending,
                'notes' => $notes,
            ]);

            $attach = [];
            foreach ($services as $index => $service) {
                $attach[$service->id] = [
                    'duration_minutes' => $service->duration_minutes,
                    'price_cents' => $service->price_cents,
                    'sort_order' => $index + 1,
                ];
            }

            $appointment->services()->attach($attach);
            $appointment->load(['barber', 'services', 'tenant']);

            Log::channel('structured')->info('appointment.created', [
                'tenant_id' => $tenant->id,
                'appointment_id' => $appointment->id,
                'barber_id' => $barber->id,
                'starts_at' => $appointment->starts_at->toIso8601String(),
                'duration_minutes' => $duration,
                'service_ids' => $services->pluck('id')->all(),
            ]);

            DB::afterCommit(function () use ($appointment): void {
                // sync: não depende de worker de fila em produção
                SendNewAppointmentPush::dispatchSync($appointment->id);
            });

            return $appointment;
        });
    }
}
