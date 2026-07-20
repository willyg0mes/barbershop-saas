<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BarberController extends Controller
{
    public function index(Tenant $tenant): AnonymousResourceCollection
    {
        $barbers = User::query()
            ->forTenant($tenant)
            ->where('is_active', true)
            ->whereIn('role', [UserRole::Barber, UserRole::Owner])
            ->orderBy('name')
            ->get(['id', 'tenant_id', 'name', 'email', 'role', 'phone']);

        return UserResource::collection($barbers);
    }
}
