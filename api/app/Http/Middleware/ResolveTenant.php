<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Support\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function __construct(protected TenantManager $tenantManager) {}

    public function handle(Request $request, Closure $next): Response
    {
        $tenant = $request->route('tenant');

        if ($tenant instanceof Tenant) {
            if (! $tenant->is_active) {
                abort(404, 'Tenant not found.');
            }

            $this->tenantManager->set($tenant);
            app()->instance('currentTenant', $tenant);

            return $next($request);
        }

        $slug = $request->header('X-Tenant-Slug') ?? $request->query('tenant');

        if (! $slug) {
            abort(400, 'Tenant slug is required.');
        }

        $tenant = Tenant::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $this->tenantManager->set($tenant);
        app()->instance('currentTenant', $tenant);

        return $next($request);
    }
}
