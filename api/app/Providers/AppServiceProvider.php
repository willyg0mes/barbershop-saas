<?php

namespace App\Providers;

use App\Models\Tenant;
use App\Support\TenantManager;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TenantManager::class);
    }

    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        Route::bind('tenant', function (string $value): Tenant {
            return Tenant::query()
                ->where('slug', $value)
                ->where('is_active', true)
                ->firstOrFail();
        });
    }
}
