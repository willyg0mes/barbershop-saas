<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\FinanceSummaryRequest;
use App\Models\Appointment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class FinanceController extends Controller
{
    public function summary(FinanceSummaryRequest $request): JsonResponse
    {
        $user = $request->user();
        $barberFilter = $this->resolveBarberFilter($request, $user);

        if ($barberFilter instanceof JsonResponse) {
            return $barberFilter;
        }

        $tenant = $user->tenant()->firstOrFail();
        $date = Carbon::parse($request->string('date')->toString(), $tenant->timezone);
        $dayStart = $date->copy()->startOfDay()->utc();
        $dayEnd = $date->copy()->endOfDay()->utc();

        $baseQuery = Appointment::query()
            ->forTenant($tenant)
            ->whereBetween('starts_at', [$dayStart, $dayEnd]);

        if ($barberFilter !== null) {
            $baseQuery->where('barber_id', $barberFilter);
        }

        $completedCount = (clone $baseQuery)->where('status', AppointmentStatus::Completed)->count();
        $totalRevenueCents = (int) (clone $baseQuery)
            ->where('status', AppointmentStatus::Completed)
            ->sum('total_price_cents');

        return response()->json([
            'data' => [
                'date' => $date->toDateString(),
                'completed_count' => $completedCount,
                'total_revenue_cents' => $totalRevenueCents,
                'total_revenue_formatted' => number_format($totalRevenueCents / 100, 2, ',', '.'),
                'pending_count' => (clone $baseQuery)->whereIn('status', [
                    AppointmentStatus::Pending,
                    AppointmentStatus::Confirmed,
                    AppointmentStatus::InProgress,
                ])->count(),
                'cancelled_count' => (clone $baseQuery)->whereIn('status', [
                    AppointmentStatus::Cancelled,
                    AppointmentStatus::NoShow,
                ])->count(),
            ],
        ]);
    }

    private function resolveBarberFilter(FinanceSummaryRequest $request, User $user): int|JsonResponse|null
    {
        if ($user->isOwner()) {
            if (! $request->filled('barber_id')) {
                return null;
            }

            $barber = User::query()
                ->forTenant($user->tenant_id)
                ->whereKey($request->integer('barber_id'))
                ->where('is_active', true)
                ->whereIn('role', [\App\Enums\UserRole::Barber, \App\Enums\UserRole::Owner])
                ->first();

            if ($barber === null) {
                return response()->json(['message' => 'Barber not found.'], 422);
            }

            return $barber->id;
        }

        return $user->id;
    }
}
