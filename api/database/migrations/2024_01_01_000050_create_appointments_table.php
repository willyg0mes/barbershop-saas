<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('barber_id')->constrained('users')->cascadeOnDelete();
            $table->string('client_name')->nullable();
            $table->string('client_phone', 30)->nullable();
            $table->string('client_email')->nullable();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->unsignedInteger('total_duration_minutes');
            $table->unsignedInteger('total_price_cents');
            $table->string('status', 20)->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'starts_at']);
            $table->index(['tenant_id', 'barber_id', 'starts_at']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('appointment_service', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('duration_minutes');
            $table->unsignedInteger('price_cents');
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->unique(['appointment_id', 'service_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_service');
        Schema::dropIfExists('appointments');
    }
};
