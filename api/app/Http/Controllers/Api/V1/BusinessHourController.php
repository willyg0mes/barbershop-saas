<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdateBusinessHoursRequest;
use App\Http\Resources\BusinessHourResource;
use App\Models\BusinessHour;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class BusinessHourController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $tenant = $request->user()->tenant()->firstOrFail();

        $hours = BusinessHour::query()
            ->forTenant($tenant)
            ->whereNull('barber_id')
            ->orderBy('day_of_week')
            ->get();

        // Garante 7 dias mesmo se o seed estiver incompleto
        $byDay = $hours->keyBy('day_of_week');
        $days = collect(range(0, 6))->map(function (int $day) use ($byDay, $tenant) {
            return $byDay->get($day) ?? new BusinessHour([
                'tenant_id' => $tenant->id,
                'barber_id' => null,
                'day_of_week' => $day,
                'open_time' => '09:00:00',
                'close_time' => '19:00:00',
                'is_closed' => $day === 0,
            ]);
        });

        return BusinessHourResource::collection($days);
    }

    public function update(UpdateBusinessHoursRequest $request): AnonymousResourceCollection
    {
        $tenant = $request->user()->tenant()->firstOrFail();

        $saved = DB::transaction(function () use ($request, $tenant) {
            $result = collect();

            foreach ($request->validated('days') as $day) {
                $isClosed = (bool) $day['is_closed'];
                $dayOfWeek = (int) $day['day_of_week'];

                $hour = BusinessHour::query()
                    ->forTenant($tenant)
                    ->whereNull('barber_id')
                    ->where('day_of_week', $dayOfWeek)
                    ->first();

                $breakStart = $day['break_start'] ?? null;
                $breakEnd = $day['break_end'] ?? null;

                $payload = [
                    'tenant_id' => $tenant->id,
                    'barber_id' => null,
                    'day_of_week' => $dayOfWeek,
                    'is_closed' => $isClosed,
                    'open_time' => $isClosed ? null : $day['open_time'].':00',
                    'close_time' => $isClosed ? null : $day['close_time'].':00',
                    'break_start' => ($isClosed || $breakStart === null) ? null : $breakStart.':00',
                    'break_end' => ($isClosed || $breakEnd === null) ? null : $breakEnd.':00',
                ];

                if ($hour === null) {
                    $hour = BusinessHour::query()->create($payload);
                } else {
                    $hour->update($payload);
                }

                $result->push($hour->fresh());
            }

            return $result->sortBy('day_of_week')->values();
        });

        return BusinessHourResource::collection($saved);
    }
}
