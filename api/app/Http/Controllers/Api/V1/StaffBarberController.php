<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreStaffBarberRequest;
use App\Http\Requests\Api\V1\UpdateStaffBarberRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;

class StaffBarberController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $tenant = $request->user()->tenant()->firstOrFail();

        $barbers = User::query()
            ->forTenant($tenant)
            ->where('role', UserRole::Barber)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return UserResource::collection($barbers);
    }

    public function store(StoreStaffBarberRequest $request): JsonResponse
    {
        $tenant = $request->user()->tenant()->firstOrFail();
        $data = $request->validated();

        $barber = User::query()->create([
            'tenant_id' => $tenant->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
            'role' => UserRole::Barber,
            'is_active' => true,
        ]);

        return (new UserResource($barber))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateStaffBarberRequest $request, User $barber): UserResource|JsonResponse
    {
        if ($response = $this->authorizeBarber($request->user(), $barber)) {
            return $response;
        }

        $data = $request->validated();

        if (array_key_exists('name', $data)) {
            $barber->name = $data['name'];
        }

        if (array_key_exists('email', $data)) {
            $barber->email = $data['email'];
        }

        if (array_key_exists('phone', $data)) {
            $barber->phone = $data['phone'];
        }

        if (! empty($data['password'])) {
            $barber->password = Hash::make($data['password']);
        }

        $barber->save();

        return new UserResource($barber->fresh());
    }

    public function destroy(Request $request, User $barber): JsonResponse
    {
        if ($response = $this->authorizeBarber($request->user(), $barber)) {
            return $response;
        }

        $barber->is_active = false;
        $barber->save();

        return response()->json(['message' => 'Barber deactivated.']);
    }

    private function authorizeBarber(User $actor, User $barber): ?JsonResponse
    {
        if ($barber->tenant_id !== $actor->tenant_id || $barber->role !== UserRole::Barber) {
            return response()->json(['message' => 'Barber not found.'], 404);
        }

        return null;
    }
}
