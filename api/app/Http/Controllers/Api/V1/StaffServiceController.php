<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreServiceRequest;
use App\Http\Requests\Api\V1\UpdateServiceRequest;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StaffServiceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $tenant = $request->user()->tenant()->firstOrFail();

        $services = Service::query()
            ->forTenant($tenant)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return ServiceResource::collection($services);
    }

    public function store(StoreServiceRequest $request): JsonResponse
    {
        $tenant = $request->user()->tenant()->firstOrFail();
        $data = $request->validated();

        $maxSortOrder = Service::query()
            ->forTenant($tenant)
            ->max('sort_order') ?? 0;

        $service = Service::query()->create([
            'tenant_id' => $tenant->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'duration_minutes' => $data['duration_minutes'],
            'price_cents' => $data['price_cents'],
            'is_active' => true,
            'sort_order' => $maxSortOrder + 1,
        ]);

        return (new ServiceResource($service))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateServiceRequest $request, Service $service): ServiceResource|JsonResponse
    {
        if ($response = $this->authorizeService($request->user(), $service)) {
            return $response;
        }

        $data = $request->validated();

        if (array_key_exists('name', $data)) {
            $service->name = $data['name'];
        }

        if (array_key_exists('description', $data)) {
            $service->description = $data['description'];
        }

        if (array_key_exists('duration_minutes', $data)) {
            $service->duration_minutes = $data['duration_minutes'];
        }

        if (array_key_exists('price_cents', $data)) {
            $service->price_cents = $data['price_cents'];
        }

        if (array_key_exists('sort_order', $data)) {
            $service->sort_order = $data['sort_order'];
        }

        $service->save();

        return new ServiceResource($service->fresh());
    }

    public function destroy(Request $request, Service $service): JsonResponse
    {
        if ($response = $this->authorizeService($request->user(), $service)) {
            return $response;
        }

        $service->is_active = false;
        $service->save();

        return response()->json(['message' => 'Service deactivated.']);
    }

    private function authorizeService(\App\Models\User $user, Service $service): ?JsonResponse
    {
        if ($service->tenant_id !== $user->tenant_id) {
            return response()->json(['message' => 'Service not found.'], 404);
        }

        return null;
    }
}
