<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AppointmentStatus as AppointmentStatusEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexAppointmentsRequest;
use App\Http\Requests\Api\V1\UpdateAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\User;
use App\Services\AppointmentStatusService;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use InvalidArgumentException;

class StaffAppointmentController extends Controller
{
    public function __construct(
        protected AppointmentStatusService $statusService,
        protected AvailabilityService $availabilityService,
    ) {}

    public function index(IndexAppointmentsRequest $request): AnonymousResourceCollection|JsonResponse
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

        $query = Appointment::query()
            ->forTenant($tenant)
            ->with(['barber', 'services'])
            ->whereBetween('starts_at', [$dayStart, $dayEnd])
            ->orderBy('starts_at');

        if ($barberFilter !== null) {
            $query->where('barber_id', $barberFilter);
        }

        return AppointmentResource::collection($query->get());
    }

    public function show(Request $request, Appointment $appointment): AppointmentResource|JsonResponse
    {
        if ($response = $this->authorizeAppointmentAccess($request->user(), $appointment)) {
            return $response;
        }

        $appointment->loadMissing(['barber', 'services']);

        return new AppointmentResource($appointment);
    }

    public function update(UpdateAppointmentRequest $request, Appointment $appointment): AppointmentResource|JsonResponse
    {
        if ($response = $this->authorizeAppointmentAccess($request->user(), $appointment)) {
            return $response;
        }

        try {
            // Reschedule
            if ($request->filled('starts_at')) {
                return $this->reschedule($request, $appointment);
            }

            // Status update
            if ($request->filled('status')) {
                $updated = $this->statusService->updateStatus(
                    $appointment,
                    $request->enum('status', AppointmentStatusEnum::class),
                );

                return new AppointmentResource($updated);
            }

            return response()->json(['message' => 'No update provided.'], 422);
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }

    private function reschedule(UpdateAppointmentRequest $request, Appointment $appointment): AppointmentResource|JsonResponse
    {
        if (! in_array($appointment->status, [AppointmentStatusEnum::Pending, AppointmentStatusEnum::Confirmed], true)) {
            return response()->json(['message' => 'Only pending or confirmed appointments can be rescheduled.'], 422);
        }

        $appointment->loadMissing(['services', 'tenant']);

        $tenant = $appointment->tenant;
        $timezone = $tenant->timezone;
        $newStartsAt = Carbon::parse($request->input('starts_at'))->timezone($timezone)->seconds(0);
        $durationMinutes = (int) ($appointment->total_duration_minutes
            ?: $appointment->services->sum('pivot.duration_minutes'));

        if ($durationMinutes <= 0) {
            return response()->json(['message' => 'Appointment duration is invalid.'], 422);
        }

        $availability = $this->availabilityService->getAvailableSlots(
            $tenant,
            $newStartsAt,
            $durationMinutes,
            $appointment->barber_id,
            $appointment->id,
        );

        $barberSlots = collect($availability['barbers'])->firstWhere('id', $appointment->barber_id);
        $requestedKey = $newStartsAt->format('Y-m-d\TH:i');

        $isAvailable = $barberSlots !== null && collect($barberSlots['slots'])
            ->contains(fn (string $slot): bool => Carbon::parse($slot)->timezone($timezone)->format('Y-m-d\TH:i') === $requestedKey);

        if (! $isAvailable) {
            return response()->json(['message' => 'Selected time slot is not available.'], 422);
        }

        // Mantém horário no timezone do tenant. Não usar ->utc() aqui:
        // com APP_TIMEZONE=America/Sao_Paulo o cast datetime grava o relógio
        // UTC como se fosse local (ex.: 18:00-03 vira 21:00 na agenda).
        $appointment->starts_at = $newStartsAt;
        $appointment->ends_at = $newStartsAt->copy()->addMinutes($durationMinutes);
        $appointment->save();

        return new AppointmentResource($appointment->fresh(['barber', 'services']));
    }

    private function resolveBarberFilter(IndexAppointmentsRequest $request, User $user): int|JsonResponse|null
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

    private function authorizeAppointmentAccess(User $user, Appointment $appointment): ?JsonResponse
    {
        if ($appointment->tenant_id !== $user->tenant_id) {
            return response()->json(['message' => 'Appointment not found.'], 404);
        }

        if ($user->isBarber() && $appointment->barber_id !== $user->id) {
            return response()->json(['message' => 'Appointment not found.'], 404);
        }

        return null;
    }
}
