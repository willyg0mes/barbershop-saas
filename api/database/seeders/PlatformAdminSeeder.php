<?php

namespace Database\Seeders;

use App\Models\PlatformAdmin;
use Illuminate\Database\Seeder;

class PlatformAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('PLATFORM_ADMIN_EMAIL', 'admin@wynext.online');
        $password = env('PLATFORM_ADMIN_PASSWORD', 'TempAdmin2026!');
        $name = env('PLATFORM_ADMIN_NAME', 'Willy');

        PlatformAdmin::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => $password,
                'is_active' => true,
            ],
        );
    }
}
