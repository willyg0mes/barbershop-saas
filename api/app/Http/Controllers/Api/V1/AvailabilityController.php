<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\AvailabilityRequest;
use App\Models\Tenant;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class AvailabilityController extends Controller
{
    public function __construct(protected AvailabilityService $availability) {}

    public function index(AvailabilityRequest $request, Tenant $tenant): JsonResponse
    {
        try {
            $duration = $request->filled('duration_minutes')
                ? (int) $request->integer('duration_minutes')
                : $this->availability->resolveDurationFromServices(
                    $tenant,
                    $request->input('service_ids', []),
                );

            $date = Carbon::createFromFormat('Y-m-d', $request->string('date')->toString(), $tenant->timezone);
            $barberId = $request->filled('barber_id') ? (int) $request->integer('barber_id') : null;

            $payload = $this->availability->getAvailableSlots($tenant, $date, $duration, $barberId);

            if ($request->filled('service_ids')) {
                $payload['service_ids'] = array_map('intval', $request->input('service_ids', []));
            }

            return response()->json(['data' => $payload]);
        } catch (InvalidArgumentException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }
    }
}
