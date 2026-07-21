<?php

namespace App\Http\Controllers\Api\V1\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Platform\StorePlatformTenantRequest;
use App\Http\Requests\Api\V1\Platform\UpdatePlatformTenantRequest;
use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantProvisioningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PlatformTenantController extends Controller
{
    public function __construct(
        private readonly TenantProvisioningService $provisioning,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Tenant::query()->withCount(['users', 'appointments'])->orderByDesc('id');

        if ($search = trim((string) $request->query('q', ''))) {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $tenants = $query->get()->map(fn (Tenant $tenant) => $this->serialize($tenant));

        return response()->json(['data' => $tenants]);
    }

    public function show(int $tenant): JsonResponse
    {
        $model = Tenant::query()->withCount(['users', 'appointments'])->findOrFail($tenant);

        $owner = User::query()
            ->where('tenant_id', $model->id)
            ->where('role', UserRole::Owner)
            ->first();

        return response()->json([
            'data' => [
                ...$this->serialize($model),
                'owner' => $owner ? [
                    'id' => $owner->id,
                    'name' => $owner->name,
                    'email' => $owner->email,
                ] : null,
            ],
        ]);
    }

    public function store(StorePlatformTenantRequest $request): JsonResponse
    {
        $result = $this->provisioning->create($request->validated());

        return response()->json([
            'data' => [
                ...$this->serialize($result['tenant']->loadCount(['users', 'appointments'])),
                'owner' => [
                    'id' => $result['owner']->id,
                    'name' => $result['owner']->name,
                    'email' => $result['owner']->email,
                ],
            ],
        ], 201);
    }

    public function update(UpdatePlatformTenantRequest $request, int $tenant): JsonResponse
    {
        $model = Tenant::query()->findOrFail($tenant);
        $data = $request->validated();

        if (isset($data['name'])) {
            $model->name = $data['name'];
        }
        if (isset($data['slug'])) {
            $model->slug = $data['slug'];
            $model->subdomain = str_replace('-', '', $data['slug']);
        }
        if (array_key_exists('primary_color', $data)) {
            $model->primary_color = $data['primary_color'] ?? $model->primary_color;
        }
        if (array_key_exists('secondary_color', $data)) {
            $model->secondary_color = $data['secondary_color'] ?? $model->secondary_color;
        }
        if (array_key_exists('accent_color', $data)) {
            $model->accent_color = $data['accent_color'] ?? $model->accent_color;
        }
        if (array_key_exists('is_active', $data)) {
            $model->is_active = (bool) $data['is_active'];
        }

        $model->save();

        if (isset($data['owner_name']) || isset($data['owner_email']) || isset($data['owner_password'])) {
            $owner = User::query()
                ->where('tenant_id', $model->id)
                ->where('role', UserRole::Owner)
                ->first();

            if ($owner) {
                if (isset($data['owner_name'])) {
                    $owner->name = $data['owner_name'];
                }
                if (isset($data['owner_email'])) {
                    $owner->email = $data['owner_email'];
                }
                if (isset($data['owner_password'])) {
                    $owner->password = $data['owner_password'];
                }
                $owner->save();
            }
        }

        return response()->json([
            'data' => $this->serialize($model->fresh()->loadCount(['users', 'appointments'])),
        ]);
    }

    public function destroy(int $tenant): JsonResponse
    {
        $model = Tenant::query()->findOrFail($tenant);
        $this->provisioning->delete($model);

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Tenant $tenant): array
    {
        return [
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'subdomain' => $tenant->subdomain,
            'primary_color' => $tenant->primary_color,
            'secondary_color' => $tenant->secondary_color,
            'accent_color' => $tenant->accent_color,
            'is_active' => $tenant->is_active,
            'users_count' => $tenant->users_count ?? null,
            'appointments_count' => $tenant->appointments_count ?? null,
            'created_at' => $tenant->created_at?->toIso8601String(),
        ];
    }
}
