<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\CreatesSchedulingFixtures;
use Tests\TestCase;

class StaffBarberEndpointTest extends TestCase
{
    use CreatesSchedulingFixtures;
    use RefreshDatabase;

    public function test_owner_can_list_and_create_barbers(): void
    {
        ['tenant' => $tenant, 'barber' => $existing] = $this->createTenantWithSchedule();
        $owner = User::factory()->owner()->create([
            'tenant_id' => $tenant->id,
            'email' => 'owner@testshop.test',
            'password' => Hash::make('password'),
        ]);

        $token = $owner->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson(route('v1.staff.barbers.index'))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $existing->id);

        $this->withToken($token)
            ->postJson(route('v1.staff.barbers.store'), [
                'name' => 'Novo Barbeiro',
                'email' => 'novo@testshop.test',
                'password' => 'password',
                'phone' => '+5511999990010',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Novo Barbeiro')
            ->assertJsonPath('data.role', 'barber');

        $this->assertDatabaseHas('users', [
            'tenant_id' => $tenant->id,
            'email' => 'novo@testshop.test',
            'role' => UserRole::Barber->value,
            'is_active' => true,
        ]);
    }

    public function test_owner_can_deactivate_barber(): void
    {
        ['tenant' => $tenant, 'barber' => $barber] = $this->createTenantWithSchedule();
        $owner = User::factory()->owner()->create([
            'tenant_id' => $tenant->id,
            'email' => 'owner@testshop.test',
            'password' => Hash::make('password'),
        ]);

        $this->withToken($owner->createToken('test')->plainTextToken)
            ->deleteJson(route('v1.staff.barbers.destroy', $barber))
            ->assertOk();

        $this->assertDatabaseHas('users', [
            'id' => $barber->id,
            'is_active' => false,
        ]);
    }

    public function test_barber_cannot_manage_staff(): void
    {
        ['barber' => $barber] = $this->createTenantWithSchedule();

        $this->withToken($barber->createToken('test')->plainTextToken)
            ->getJson(route('v1.staff.barbers.index'))
            ->assertForbidden();
    }

    public function test_owner_cannot_deactivate_owner_user(): void
    {
        ['tenant' => $tenant] = $this->createTenantWithSchedule();
        $owner = User::factory()->owner()->create([
            'tenant_id' => $tenant->id,
            'email' => 'owner@testshop.test',
            'password' => Hash::make('password'),
        ]);

        $otherOwner = User::factory()->owner()->create([
            'tenant_id' => $tenant->id,
            'email' => 'other-owner@testshop.test',
        ]);

        $this->withToken($owner->createToken('test')->plainTextToken)
            ->deleteJson(route('v1.staff.barbers.destroy', $otherOwner))
            ->assertNotFound();
    }
}
