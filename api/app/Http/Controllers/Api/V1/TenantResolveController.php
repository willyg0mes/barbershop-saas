<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TenantBrandingResource;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantResolveController extends Controller
{
    public function __invoke(Request $request): JsonResponse|TenantBrandingResource
    {
        $host = strtolower($request->string('host')->toString());

        if ($host === '') {
            return response()->json(['message' => 'Host is required.'], 422);
        }

        $host = explode(':', $host)[0];

        $tenant = Tenant::query()
            ->where('is_active', true)
            ->where(function ($query) use ($host): void {
                $query->where('custom_domain', $host)
                    ->orWhere('subdomain', $host);
            })
            ->first();

        if ($tenant === null && str_contains($host, '.')) {
            $subdomain = explode('.', $host)[0];
            $tenant = Tenant::query()
                ->where('is_active', true)
                ->where('subdomain', $subdomain)
                ->first();
        }

        if ($tenant === null) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }

        if ($request->boolean('branding')) {
            return new TenantBrandingResource($tenant);
        }

        return response()->json([
            'slug' => $tenant->slug,
            'subdomain' => $tenant->subdomain,
        ]);
    }
}
