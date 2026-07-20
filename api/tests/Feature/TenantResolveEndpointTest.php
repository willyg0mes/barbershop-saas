<?php

namespace Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantResolveEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_resolve_tenant_by_subdomain(): void
    {
        Tenant::factory()->create([
            'slug' => 'dom-corte',
            'subdomain' => 'domcorte',
            'custom_domain' => null,
        ]);

        $this->getJson('/api/v1/tenants/resolve?host=domcorte')
            ->assertOk()
            ->assertJsonPath('slug', 'dom-corte');
    }

    public function test_resolve_tenant_by_custom_domain(): void
    {
        Tenant::factory()->create([
            'slug' => 'vip-cut',
            'subdomain' => 'vipcut',
            'custom_domain' => 'agenda.vipcut.test',
        ]);

        $this->getJson('/api/v1/tenants/resolve?host=agenda.vipcut.test')
            ->assertOk()
            ->assertJsonPath('slug', 'vip-cut');
    }
}
