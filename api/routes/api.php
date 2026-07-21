<?php

use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\V1\AppointmentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AvailabilityController;
use App\Http\Controllers\Api\V1\BarberController;
use App\Http\Controllers\Api\V1\BusinessHourController;
use App\Http\Controllers\Api\V1\ClosedDateController;
use App\Http\Controllers\Api\V1\FinanceController;
use App\Http\Controllers\Api\V1\ScheduleBreakController;
use App\Http\Controllers\Api\V1\ServiceController;
use App\Http\Controllers\Api\V1\StaffAppointmentController;
use App\Http\Controllers\Api\V1\StaffBarberController;
use App\Http\Controllers\Api\V1\StaffServiceController;
use App\Http\Controllers\Api\V1\Platform\PlatformAuthController;
use App\Http\Controllers\Api\V1\Platform\PlatformTenantController;
use App\Http\Controllers\Api\V1\TenantBrandingController;
use App\Http\Controllers\Api\V1\TenantResolveController;
use App\Http\Controllers\Api\V1\TenantSettingsController;
use App\Http\Controllers\Api\V1\TimeBlockController;
use App\Http\Middleware\EnsureOwner;
use App\Http\Middleware\EnsurePlatformAdmin;
use App\Http\Middleware\EnsureStaff;
use App\Http\Middleware\ResolveTenant;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class)->name('health');

Route::prefix('v1')->middleware('throttle:api')->name('v1.')->group(function (): void {
    Route::get('/tenants/resolve', TenantResolveController::class)->name('tenants.resolve');

    Route::prefix('platform')->name('platform.')->group(function (): void {
        Route::post('/auth/login', [PlatformAuthController::class, 'login'])->name('auth.login');

        Route::middleware(['auth:sanctum', EnsurePlatformAdmin::class])->group(function (): void {
            Route::get('/auth/me', [PlatformAuthController::class, 'me'])->name('auth.me');
            Route::post('/auth/logout', [PlatformAuthController::class, 'logout'])->name('auth.logout');
            Route::patch('/auth/profile', [PlatformAuthController::class, 'updateProfile'])->name('auth.profile');

            Route::get('/tenants', [PlatformTenantController::class, 'index'])->name('tenants.index');
            Route::post('/tenants', [PlatformTenantController::class, 'store'])->name('tenants.store');
            Route::get('/tenants/{tenantId}', [PlatformTenantController::class, 'show'])->whereNumber('tenantId')->name('tenants.show');
            Route::patch('/tenants/{tenantId}', [PlatformTenantController::class, 'update'])->whereNumber('tenantId')->name('tenants.update');
            Route::delete('/tenants/{tenantId}', [PlatformTenantController::class, 'destroy'])->whereNumber('tenantId')->name('tenants.destroy');
        });
    });

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
        Route::patch('/auth/fcm-token', [AuthController::class, 'updateFcmToken'])->name('auth.fcm-token');

        Route::middleware(EnsureStaff::class)->group(function (): void {
            Route::get('/appointments', [StaffAppointmentController::class, 'index'])->name('appointments.index');
            Route::get('/appointments/{appointment}', [StaffAppointmentController::class, 'show'])->name('appointments.show');
            Route::patch('/appointments/{appointment}', [StaffAppointmentController::class, 'update'])->name('appointments.update');
            Route::get('/finance/summary', [FinanceController::class, 'summary'])->name('finance.summary');

            Route::get('/schedule-breaks', [ScheduleBreakController::class, 'index'])->name('schedule-breaks.index');
            Route::post('/schedule-breaks', [ScheduleBreakController::class, 'store'])->name('schedule-breaks.store');
            Route::delete('/schedule-breaks/{scheduleBreak}', [ScheduleBreakController::class, 'destroy'])->name('schedule-breaks.destroy');

            Route::get('/closed-dates', [ClosedDateController::class, 'index'])->name('closed-dates.index');
            Route::post('/closed-dates', [ClosedDateController::class, 'store'])->name('closed-dates.store');
            Route::delete('/closed-dates/{closedDate}', [ClosedDateController::class, 'destroy'])->name('closed-dates.destroy');

            Route::get('/time-blocks', [TimeBlockController::class, 'index'])->name('time-blocks.index');
            Route::post('/time-blocks', [TimeBlockController::class, 'store'])->name('time-blocks.store');
            Route::delete('/time-blocks/{timeBlock}', [TimeBlockController::class, 'destroy'])->name('time-blocks.destroy');

            Route::middleware(EnsureOwner::class)->group(function (): void {
                Route::get('/business-hours', [BusinessHourController::class, 'index'])->name('business-hours.index');
                Route::put('/business-hours', [BusinessHourController::class, 'update'])->name('business-hours.update');

                Route::get('/staff/barbers', [StaffBarberController::class, 'index'])->name('staff.barbers.index');
                Route::post('/staff/barbers', [StaffBarberController::class, 'store'])->name('staff.barbers.store');
                Route::patch('/staff/barbers/{barber}', [StaffBarberController::class, 'update'])->name('staff.barbers.update');
                Route::delete('/staff/barbers/{barber}', [StaffBarberController::class, 'destroy'])->name('staff.barbers.destroy');

                Route::get('/staff/services', [StaffServiceController::class, 'index'])->name('staff.services.index');
                Route::post('/staff/services', [StaffServiceController::class, 'store'])->name('staff.services.store');
                Route::patch('/staff/services/{service}', [StaffServiceController::class, 'update'])->name('staff.services.update');
                Route::delete('/staff/services/{service}', [StaffServiceController::class, 'destroy'])->name('staff.services.destroy');

                Route::get('/settings', [TenantSettingsController::class, 'show'])->name('settings.show');
                Route::patch('/settings', [TenantSettingsController::class, 'update'])->name('settings.update');
            });
        });
    });
});
