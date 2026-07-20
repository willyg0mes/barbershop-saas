<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->string('role', 20)->default('client')->after('email');
            $table->string('phone', 30)->nullable()->after('role');
            $table->string('fcm_token')->nullable()->after('remember_token');
            $table->boolean('is_active')->default(true)->after('fcm_token');

            $table->dropUnique(['email']);
            $table->unique(['tenant_id', 'email']);
            $table->index(['tenant_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'email']);
            $table->dropIndex(['tenant_id', 'role']);
            $table->dropConstrainedForeignId('tenant_id');
            $table->dropColumn(['role', 'phone', 'fcm_token', 'is_active']);
            $table->unique('email');
        });
    }
};
