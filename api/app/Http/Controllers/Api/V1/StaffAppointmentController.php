<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexAppointmentsRequest;
use App\Http\Requests\Api\V1\UpdateAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\User;
use App\Services\AppointmentStatusService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use InvalidArgumentException;

class StaffAppointmentController extends Controller
{
    public function __construct(protected AppointmentStatusService $statusService) {}

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
            $updated = $this->statusService->updateStatus(
                $appointment,
                $request->enum('status', \App\Enums\AppointmentStatus::class),
            );

            return new AppointmentResource($updated);
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
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
