<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_breaks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('barber_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('label')->default('Almoço');
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'barber_id']);
        });

        Schema::create('closed_dates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('barber_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('date');
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'barber_id', 'date'], 'closed_dates_unique_day');
            $table->index(['tenant_id', 'date']);
        });

        Schema::create('time_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('barber_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->string('reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'barber_id', 'starts_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar_url')->nullable()->after('phone');
        });

        Schema::table('business_hours', function (Blueprint $table) {
            $table->time('break_start')->nullable()->after('close_time');
            $table->time('break_end')->nullable()->after('break_start');
        });
    }

    public function down(): void
    {
        Schema::table('business_hours', function (Blueprint $table) {
            $table->dropColumn(['break_start', 'break_end']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('avatar_url');
        });

        Schema::dropIfExists('time_blocks');
        Schema::dropIfExists('closed_dates');
        Schema::dropIfExists('schedule_breaks');
    }
};
