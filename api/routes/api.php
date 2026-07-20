<?php

use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\V1\AppointmentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AvailabilityController;
use App\Http\Controllers\Api\V1\BarberController;
use App\Http\Controllers\Api\V1\ServiceController;
use App\Http\Controllers\Api\V1\TenantBrandingController;
use App\Http\Middleware\ResolveTenant;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class)->name('health');

Route::prefix('v1')->middleware('throttle:api')->name('v1.')->group(function (): void {
    Route::prefix('tenants/{tenant:slug}')
        ->middleware(ResolveTenant::class)
        ->name('tenants.')
        ->group(function (): void {
            Route::get('/branding', [TenantBrandingController::class, 'show'])->name('branding');
            Route::get('/services', [ServiceController::class, 'index'])->name('services');
            Route::get('/barbers', [BarberController::class, 'index'])->name('barbers');
            Route::get('/availability', [AvailabilityController::class, 'index'])->name('availability');
            Route::post('/appointments', [AppointmentController::class, 'store'])->name('appointments.store');
            Route::post('/auth/login', [AuthController::class, 'login'])->name('auth.login');
        });

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/auth/me', [AuthController::class, 'me'])->name('auth.me');
        Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
    });
});
