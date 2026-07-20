<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('barber_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedTinyInteger('day_of_week'); // 0=Sunday … 6=Saturday
            $table->time('open_time')->nullable();
            $table->time('close_time')->nullable();
            $table->boolean('is_closed')->default(false);
            $table->timestamps();

            $table->unique(['tenant_id', 'barber_id', 'day_of_week'], 'business_hours_unique_day');
            $table->index(['tenant_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_hours');
    }
};
