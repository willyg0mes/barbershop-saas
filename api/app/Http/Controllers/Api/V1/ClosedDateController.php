<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreClosedDateRequest;
use App\Http\Resources\ClosedDateResource;
use App\Models\ClosedDate;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClosedDateController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $tenant = $request->user()->tenant()->firstOrFail();
        $user = $request->user();

        $query = ClosedDate::query()
            ->forTenant($tenant)
            ->orderBy('date');

        if ($request->filled('from')) {
            $query->whereDate('date', '>=', $request->string('from')->toString());
        }

        if ($request->filled('to')) {
            $query->whereDate('date', '<=', $request->string('to')->toString());
        }

        if ($user->isBarber()) {
            $query->where(function ($q) use ($user) {
                $q->whereNull('barber_id')->orWhere('barber_id', $user->id);
            });
        }

        return ClosedDateResource::collection($query->get());
    }

    public function store(StoreClosedDateRequest $request): JsonResponse
    {
        $tenant = $request->user()->tenant()->firstOrFail();
        $data = $request->validated();
        $user = $request->user();

        $barberId = $data['barber_id'] ?? null;

        // Barber só pode criar para si mesmo
        if ($user->isBarber() && ($barberId === null || $barberId !== $user->id)) {
            $barberId = $user->id;
        }

        $closedDate = ClosedDate::query()->create([
            'tenant_id' => $tenant->id,
            'barber_id' => $barberId,
            'date' => Carbon::parse($data['date']),
            'reason' => $data['reason'] ?? null,
        ]);

        return (new ClosedDateResource($closedDate))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Request $request, ClosedDate $closedDate): JsonResponse
    {
        if ($response = $this->authorizeClosedDate($request->user(), $closedDate)) {
            return $response;
        }

        $closedDate->delete();

        return response()->json(['message' => 'Closed date deleted.']);
    }

    private function authorizeClosedDate(\App\Models\User $user, ClosedDate $closedDate): ?JsonResponse
    {
        if ($closedDate->tenant_id !== $user->tenant_id) {
            return response()->json(['message' => 'Closed date not found.'], 404);
        }

        // Barber só pode gerenciar suas próprias datas
        if ($user->isBarber() && $closedDate->barber_id !== $user->id) {
            return response()->json(['message' => 'Closed date not found.'], 404);
        }

        return null;
    }
}
