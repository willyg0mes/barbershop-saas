<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\CreatesSchedulingFixtures;
use Tests\TestCase;

class AuthEndpointTest extends TestCase
{
    use CreatesSchedulingFixtures;
    use RefreshDatabase;

    public function test_login_returns_token_for_valid_credentials(): void
    {
        ['tenant' => $tenant, 'barber' => $barber] = $this->createTenantWithSchedule();

        $response = $this->postJson(route('v1.tenants.auth.login', ['tenant' => $tenant->slug]), [
            'email' => $barber->email,
            'password' => 'password',
            'device_name' => 'phpunit',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'token_type', 'user' => ['id', 'email', 'role']]);

        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        ['tenant' => $tenant, 'barber' => $barber] = $this->createTenantWithSchedule();

        $this->postJson(route('v1.tenants.auth.login', ['tenant' => $tenant->slug]), [
            'email' => $barber->email,
            'password' => 'wrong-password',
        ])->assertUnprocessable();
    }

    public function test_authenticated_user_can_fetch_profile(): void
    {
        ['tenant' => $tenant, 'barber' => $barber] = $this->createTenantWithSchedule();
        $token = $barber->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson(route('v1.auth.me'))
            ->assertOk()
            ->assertJsonPath('data.email', $barber->email);
    }
}
