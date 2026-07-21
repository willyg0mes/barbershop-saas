<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\BusinessHour;
use App\Models\ClosedDate;
use App\Models\ScheduleBreak;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\TimeBlock;
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
     *     barbers: list<array{id: int, name: string, avatar_url: ?string, slots: list<string>}>
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

        $tenantClosed = ClosedDate::query()
            ->forTenant($tenant)
            ->whereNull('barber_id')
            ->whereDate('date', $localDate->toDateString())
            ->exists();

        $barberSlots = [];

        foreach ($barbers as $barber) {
            if ($tenantClosed || $this->isBarberClosedOnDate($tenant, $barber, $localDate)) {
                $barberSlots[] = $this->emptyBarber($barber);

                continue;
            }

            $hours = $this->resolveBusinessHours($tenant, $barber, $localDate);

            if ($hours === null || $hours->is_closed || ! $hours->open_time || ! $hours->close_time) {
                $barberSlots[] = $this->emptyBarber($barber);

                continue;
            }

            $openAt = $localDate->copy()->setTimeFromTimeString((string) $hours->open_time);
            $closeAt = $localDate->copy()->setTimeFromTimeString((string) $hours->close_time);
            $blockedRanges = $this->loadBlockedRanges($tenant, $barber, $localDate, $hours);
            $slots = [];

            for ($cursor = $openAt->copy(); $cursor->copy()->addMinutes($durationMinutes)->lte($closeAt); $cursor->addMinutes($slotInterval)) {
                if ($cursor->lt($earliestBookable)) {
                    continue;
                }

                $slotEnd = $cursor->copy()->addMinutes($durationMinutes);

                if ($this->overlapsAnyRange($cursor, $slotEnd, $blockedRanges)) {
                    continue;
                }

                $slots[] = $cursor->toIso8601String();
            }

            $barberSlots[] = [
                'id' => $barber->id,
                'name' => $barber->name,
                'avatar_url' => $barber->avatar_url,
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

    protected function isBarberClosedOnDate(Tenant $tenant, User $barber, Carbon $localDate): bool
    {
        return ClosedDate::query()
            ->forTenant($tenant)
            ->where('barber_id', $barber->id)
            ->whereDate('date', $localDate->toDateString())
            ->exists();
    }

    /**
     * @return list<array{0: Carbon, 1: Carbon}>
     */
    protected function loadBlockedRanges(
        Tenant $tenant,
        User $barber,
        Carbon $localDate,
        BusinessHour $hours,
    ): array {
        $ranges = [];

        $dayStart = $localDate->copy()->utc();
        $dayEnd = $localDate->copy()->endOfDay()->utc();

        $appointments = Appointment::query()
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

        foreach ($appointments as $appointment) {
            $ranges[] = [
                $appointment->starts_at->copy()->timezone($tenant->timezone),
                $appointment->ends_at->copy()->timezone($tenant->timezone),
            ];
        }

        $blocks = TimeBlock::query()
            ->forTenant($tenant)
            ->where('barber_id', $barber->id)
            ->where('starts_at', '<', $dayEnd)
            ->where('ends_at', '>', $dayStart)
            ->get(['starts_at', 'ends_at']);

        foreach ($blocks as $block) {
            $ranges[] = [
                $block->starts_at->copy()->timezone($tenant->timezone),
                $block->ends_at->copy()->timezone($tenant->timezone),
            ];
        }

        if ($hours->break_start && $hours->break_end) {
            $ranges[] = [
                $localDate->copy()->setTimeFromTimeString((string) $hours->break_start),
                $localDate->copy()->setTimeFromTimeString((string) $hours->break_end),
            ];
        }

        $breaks = ScheduleBreak::query()
            ->forTenant($tenant)
            ->where('is_active', true)
            ->where(function ($query) use ($barber) {
                $query->whereNull('barber_id')->orWhere('barber_id', $barber->id);
            })
            ->get();

        foreach ($breaks as $break) {
            $ranges[] = [
                $localDate->copy()->setTimeFromTimeString((string) $break->start_time),
                $localDate->copy()->setTimeFromTimeString((string) $break->end_time),
            ];
        }

        return $ranges;
    }

    /**
     * @param  list<array{0: Carbon, 1: Carbon}>  $ranges
     */
    protected function overlapsAnyRange(Carbon $start, Carbon $end, array $ranges): bool
    {
        foreach ($ranges as [$rangeStart, $rangeEnd]) {
            if ($start->lt($rangeEnd) && $end->gt($rangeStart)) {
                return true;
            }
        }

        return false;
    }

    protected function emptyBarber(User $barber): array
    {
        return [
            'id' => $barber->id,
            'name' => $barber->name,
            'avatar_url' => $barber->avatar_url,
            'slots' => [],
        ];
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
