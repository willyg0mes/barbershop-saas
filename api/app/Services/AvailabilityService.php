<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\BusinessHour;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use InvalidArgumentException;

class AvailabilityService
{
    /**
     * @return array{
     *     date: string,
     *     duration_minutes: int,
     *     timezone: string,
     *     barbers: list<array{id: int, name: string, slots: list<string>}>
     * }
     */
    public function getAvailableSlots(
        Tenant $tenant,
        CarbonInterface $date,
        int $durationMinutes,
        ?int $barberId = null,
    ): array {
        if ($durationMinutes <= 0) {
            throw new InvalidArgumentException('Duration must be greater than zero.');
        }

        $timezone = $tenant->timezone;
        $localDate = Carbon::parse($date->toDateString(), $timezone)->startOfDay();
        $now = Carbon::now($timezone);

        if ($localDate->lt($now->copy()->startOfDay())) {
            return $this->emptyResponse($localDate, $durationMinutes, $timezone);
        }

        $barbers = $this->resolveBarbers($tenant, $barberId);
        $slotInterval = (int) ($tenant->settings['slot_interval_minutes'] ?? 15);
        $leadMinutes = (int) ($tenant->settings['booking_lead_minutes'] ?? 30);
        $earliestBookable = $now->copy()->addMinutes($leadMinutes);

        $barberSlots = [];

        foreach ($barbers as $barber) {
            $hours = $this->resolveBusinessHours($tenant, $barber, $localDate);

            if ($hours === null || $hours->is_closed || ! $hours->open_time || ! $hours->close_time) {
                $barberSlots[] = [
                    'id' => $barber->id,
                    'name' => $barber->name,
                    'slots' => [],
                ];

                continue;
            }

            $openAt = $localDate->copy()->setTimeFromTimeString($hours->open_time);
            $closeAt = $localDate->copy()->setTimeFromTimeString($hours->close_time);

            $appointments = $this->loadBlockingAppointments($tenant, $barber, $localDate, $timezone);
            $slots = [];

            for ($cursor = $openAt->copy(); $cursor->copy()->addMinutes($durationMinutes)->lte($closeAt); $cursor->addMinutes($slotInterval)) {
                if ($cursor->lt($earliestBookable)) {
                    continue;
                }

                $slotEnd = $cursor->copy()->addMinutes($durationMinutes);

                if ($this->overlapsAny($cursor, $slotEnd, $appointments)) {
                    continue;
                }

                $slots[] = $cursor->toIso8601String();
            }

            $barberSlots[] = [
                'id' => $barber->id,
                'name' => $barber->name,
                'slots' => $slots,
            ];
        }

        return [
            'date' => $localDate->toDateString(),
            'duration_minutes' => $durationMinutes,
            'timezone' => $timezone,
            'barbers' => $barberSlots,
        ];
    }

    public function resolveDurationFromServices(Tenant $tenant, array $serviceIds): int
    {
        if ($serviceIds === []) {
            throw new InvalidArgumentException('At least one service is required.');
        }

        $services = Service::query()
            ->forTenant($tenant)
            ->whereIn('id', $serviceIds)
            ->where('is_active', true)
            ->get();

        if ($services->count() !== count(array_unique($serviceIds))) {
            throw new InvalidArgumentException('One or more services are invalid or inactive.');
        }

        return (int) $services->sum('duration_minutes');
    }

    /**
     * @return Collection<int, User>
     */
    protected function resolveBarbers(Tenant $tenant, ?int $barberId): Collection
    {
        $query = User::query()
            ->forTenant($tenant)
            ->where('is_active', true)
            ->whereIn('role', [UserRole::Barber, UserRole::Owner]);

        if ($barberId !== null) {
            $barber = $query->whereKey($barberId)->first();

            if ($barber === null) {
                throw new InvalidArgumentException('Barber not found for this tenant.');
            }

            return collect([$barber]);
        }

        $barbers = $query->where('role', UserRole::Barber)->orderBy('name')->get();

        return $barbers->isNotEmpty() ? $barbers : $query->where('role', UserRole::Owner)->get();
    }

    protected function resolveBusinessHours(Tenant $tenant, User $barber, Carbon $localDate): ?BusinessHour
    {
        $dayOfWeek = $localDate->dayOfWeek;

        $barberHours = BusinessHour::query()
            ->forTenant($tenant)
            ->where('barber_id', $barber->id)
            ->where('day_of_week', $dayOfWeek)
            ->first();

        if ($barberHours !== null) {
            return $barberHours;
        }

        return BusinessHour::query()
            ->forTenant($tenant)
            ->whereNull('barber_id')
            ->where('day_of_week', $dayOfWeek)
            ->first();
    }

    /**
     * @return Collection<int, Appointment>
     */
    protected function loadBlockingAppointments(
        Tenant $tenant,
        User $barber,
        Carbon $localDate,
        string $timezone,
    ): Collection {
        $dayStart = $localDate->copy()->utc();
        $dayEnd = $localDate->copy()->endOfDay()->utc();

        return Appointment::query()
            ->forTenant($tenant)
            ->where('barber_id', $barber->id)
            ->whereIn('status', [
                AppointmentStatus::Pending,
                AppointmentStatus::Confirmed,
                AppointmentStatus::InProgress,
            ])
            ->where('starts_at', '<', $dayEnd)
            ->where('ends_at', '>', $dayStart)
            ->get(['starts_at', 'ends_at']);
    }

    /**
     * @param  Collection<int, Appointment>  $appointments
     */
    protected function overlapsAny(Carbon $start, Carbon $end, Collection $appointments): bool
    {
        $startUtc = $start->copy()->utc();
        $endUtc = $end->copy()->utc();

        foreach ($appointments as $appointment) {
            $appointmentStart = $appointment->starts_at->copy()->utc();
            $appointmentEnd = $appointment->ends_at->copy()->utc();

            if ($startUtc->lt($appointmentEnd) && $endUtc->gt($appointmentStart)) {
                return true;
            }
        }

        return false;
    }

    protected function emptyResponse(Carbon $localDate, int $durationMinutes, string $timezone): array
    {
        return [
            'date' => $localDate->toDateString(),
            'duration_minutes' => $durationMinutes,
            'timezone' => $timezone,
            'barbers' => [],
        ];
    }
}
