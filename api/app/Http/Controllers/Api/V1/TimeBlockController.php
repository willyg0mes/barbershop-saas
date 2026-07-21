<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreTimeBlockRequest;
use App\Http\Resources\TimeBlockResource;
use App\Models\TimeBlock;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TimeBlockController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $tenant = $request->user()->tenant()->firstOrFail();
        $user = $request->user();

        $query = TimeBlock::query()
            ->forTenant($tenant)
            ->orderBy('starts_at');

        if ($request->filled('date')) {
            $date = Carbon::parse($request->string('date')->toString());
            $dayStart = $date->copy()->startOfDay();
            $dayEnd = $date->copy()->endOfDay();

            // Inclui bloqueios de vários dias que cruzam a data
            $query->where('starts_at', '<=', $dayEnd)
                ->where('ends_at', '>=', $dayStart);
        }

        if ($request->filled('from')) {
            $query->where('ends_at', '>=', Carbon::parse($request->string('from')->toString())->startOfDay());
        }

        if ($request->filled('to')) {
            $query->where('starts_at', '<=', Carbon::parse($request->string('to')->toString())->endOfDay());
        }

        if ($user->isBarber()) {
            $query->where('barber_id', $user->id);
        } elseif ($user->isOwner() && $request->filled('barber_id')) {
            $query->where('barber_id', $request->integer('barber_id'));
        }

        return TimeBlockResource::collection($query->get());
    }

    public function store(StoreTimeBlockRequest $request): JsonResponse
    {
        $tenant = $request->user()->tenant()->firstOrFail();
        $data = $request->validated();
        $user = $request->user();

        $barberId = $data['barber_id'] ?? $user->id;

        // Barber só pode criar para si mesmo
        if ($user->isBarber() && $barberId !== $user->id) {
            return response()->json(['message' => 'Barbers can only create blocks for themselves.'], 403);
        }

        // Owner pode criar para qualquer barber do tenant
        if ($user->isOwner()) {
            $barber = User::query()
                ->forTenant($tenant)
                ->whereKey($barberId)
                ->where('is_active', true)
                ->whereIn('role', [UserRole::Barber, UserRole::Owner])
                ->first();

            if ($barber === null) {
                return response()->json(['message' => 'Barber not found.'], 422);
            }
        }

        $timeBlock = TimeBlock::query()->create([
            'tenant_id' => $tenant->id,
            'barber_id' => $barberId,
            'starts_at' => Carbon::parse($data['starts_at']),
            'ends_at' => Carbon::parse($data['ends_at']),
            'reason' => $data['reason'] ?? null,
            'created_by' => $user->id,
        ]);

        return (new TimeBlockResource($timeBlock))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Request $request, TimeBlock $timeBlock): JsonResponse
    {
        if ($response = $this->authorizeTimeBlock($request->user(), $timeBlock)) {
            return $response;
        }

        $timeBlock->delete();

        return response()->json(['message' => 'Time block deleted.']);
    }

    private function authorizeTimeBlock(\App\Models\User $user, TimeBlock $timeBlock): ?JsonResponse
    {
        if ($timeBlock->tenant_id !== $user->tenant_id) {
            return response()->json(['message' => 'Time block not found.'], 404);
        }

        // Barber só pode gerenciar seus próprios blocos
        if ($user->isBarber() && $timeBlock->barber_id !== $user->id) {
            return response()->json(['message' => 'Time block not found.'], 404);
        }

        return null;
    }
}
