<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WynextPlatformSyncService
{
    public function enabled(): bool
    {
        return (bool) config('wynext.platform_sync')
            && filled(config('wynext.platform_url'))
            && filled(config('wynext.platform_token'));
    }

    public function sync(Tenant $tenant): bool
    {
        if (! $this->enabled()) {
            return false;
        }

        $payload = [
            'product' => $tenant->product ?: Tenant::PRODUCT,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'subdomain' => $tenant->subdomain,
            'custom_domain' => $tenant->custom_domain,
            'logo_url' => $tenant->logo_url,
            'primary_color' => $tenant->primary_color,
            'secondary_color' => $tenant->secondary_color,
            'accent_color' => $tenant->accent_color,
            'timezone' => $tenant->timezone,
            'settings' => array_merge($tenant->settings ?? [], [
                'source' => 'barbershop-saas',
                'local_tenant_id' => $tenant->id,
            ]),
            'is_active' => (bool) $tenant->is_active,
        ];

        try {
            $existingId = $this->findRemoteIdBySlug($tenant->slug);

            if ($existingId) {
                $this->client()->patch("/api/tenants/{$existingId}", $payload)->throw();
            } else {
                $this->client()->post('/api/tenants', $payload)->throw();
            }

            return true;
        } catch (RequestException|\Throwable $e) {
            Log::warning('Wynext platform sync failed', [
                'tenant' => $tenant->slug,
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }

    public function deleteBySlug(string $slug): bool
    {
        if (! $this->enabled()) {
            return false;
        }

        try {
            $existingId = $this->findRemoteIdBySlug($slug);
            if (! $existingId) {
                return true;
            }

            $this->client()->delete("/api/tenants/{$existingId}")->throw();

            return true;
        } catch (RequestException|\Throwable $e) {
            Log::warning('Wynext platform delete sync failed', [
                'slug' => $slug,
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }

    public function syncAll(): array
    {
        $ok = 0;
        $fail = 0;

        Tenant::query()->orderBy('id')->each(function (Tenant $tenant) use (&$ok, &$fail): void {
            if ($this->sync($tenant)) {
                $ok++;
            } else {
                $fail++;
            }
        });

        return compact('ok', 'fail');
    }

    private function findRemoteIdBySlug(string $slug): ?int
    {
        $response = $this->client()->get('/api/tenants', ['q' => $slug])->throw();
        $rows = $response->json('data') ?? [];

        foreach ($rows as $row) {
            if (($row['slug'] ?? null) === $slug && ($row['product'] ?? null) === Tenant::PRODUCT) {
                return (int) $row['id'];
            }
        }

        return null;
    }

    private function client()
    {
        return Http::baseUrl(rtrim((string) config('wynext.platform_url'), '/'))
            ->withToken((string) config('wynext.platform_token'))
            ->acceptJson()
            ->timeout(15);
    }
}
