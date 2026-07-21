<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreScheduleBreakRequest;
use App\Http\Resources\ScheduleBreakResource;
use App\Models\ScheduleBreak;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ScheduleBreakController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $tenant = $request->user()->tenant()->firstOrFail();
        $user = $request->user();

        $query = ScheduleBreak::query()
            ->forTenant($tenant)
            ->where('is_active', true)
            ->orderBy('start_time');

        if ($user->isBarber()) {
            $query->where(function ($q) use ($user) {
                $q->whereNull('barber_id')->orWhere('barber_id', $user->id);
            });
        } elseif ($user->isOwner()) {
            // Owner vê todos
        }

        return ScheduleBreakResource::collection($query->get());
    }

    public function store(StoreScheduleBreakRequest $request): JsonResponse
    {
        $tenant = $request->user()->tenant()->firstOrFail();
        $data = $request->validated();
        $user = $request->user();

        $barberId = $data['barber_id'] ?? null;

        // Barber só pode criar breaks para si mesmo
        if ($user->isBarber() && ($barberId === null || $barberId !== $user->id)) {
            $barberId = $user->id;
        }

        $break = ScheduleBreak::query()->create([
            'tenant_id' => $tenant->id,
            'barber_id' => $barberId,
            'label' => $data['label'],
            'start_time' => $data['start_time'].':00',
            'end_time' => $data['end_time'].':00',
            'is_active' => true,
        ]);

        return (new ScheduleBreakResource($break))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Request $request, ScheduleBreak $scheduleBreak): JsonResponse
    {
        if ($response = $this->authorizeBreak($request->user(), $scheduleBreak)) {
            return $response;
        }

        $scheduleBreak->is_active = false;
        $scheduleBreak->save();

        return response()->json(['message' => 'Schedule break deactivated.']);
    }

    private function authorizeBreak(\App\Models\User $user, ScheduleBreak $break): ?JsonResponse
    {
        if ($break->tenant_id !== $user->tenant_id) {
            return response()->json(['message' => 'Schedule break not found.'], 404);
        }

        // Barber só pode gerenciar seus próprios breaks
        if ($user->isBarber() && $break->barber_id !== $user->id) {
            return response()->json(['message' => 'Schedule break not found.'], 404);
        }

        return null;
    }
}
