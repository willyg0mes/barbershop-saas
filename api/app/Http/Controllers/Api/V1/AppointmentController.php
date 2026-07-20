<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Tenant;
use App\Models\User;
use App\Services\AppointmentBookingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class AppointmentController extends Controller
{
    public function __construct(protected AppointmentBookingService $booking) {}

    public function store(StoreAppointmentRequest $request, Tenant $tenant): JsonResponse|AppointmentResource
    {
        $barber = User::query()
            ->forTenant($tenant)
            ->whereKey($request->integer('barber_id'))
            ->where('is_active', true)
            ->whereIn('role', [UserRole::Barber, UserRole::Owner])
            ->first();

        if ($barber === null) {
            return response()->json(['message' => 'Barber not found.'], 422);
        }

        try {
            $startsAt = Carbon::parse($request->string('starts_at')->toString(), $tenant->timezone);
            $client = $request->user();

            $appointment = $this->booking->book(
                tenant: $tenant,
                barber: $barber,
                serviceIds: array_map('intval', $request->input('service_ids', [])),
                startsAt: $startsAt,
                client: $client?->isClient() ? $client : null,
                clientName: $request->string('client_name')->toString() ?: null,
                clientPhone: $request->string('client_phone')->toString() ?: null,
                clientEmail: $request->string('client_email')->toString() ?: null,
                notes: $request->string('notes')->toString() ?: null,
            );

            return (new AppointmentResource($appointment))
                ->response()
                ->setStatusCode(201);
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }
}
