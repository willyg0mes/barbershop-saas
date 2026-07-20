<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('subdomain')->unique();
            $table->string('custom_domain')->nullable()->unique();
            $table->string('logo_url')->nullable();
            $table->string('primary_color', 7)->default('#1A1A1A');
            $table->string('secondary_color', 7)->default('#C4A35A');
            $table->string('accent_color', 7)->default('#F5F5F5');
            $table->string('timezone')->default('America/Sao_Paulo');
            $table->json('settings')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
