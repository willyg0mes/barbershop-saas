<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $dbOk = false;

        try {
            DB::connection()->getPdo();
            DB::select('select 1');
            $dbOk = true;
        } catch (Throwable) {
            $dbOk = false;
        }

        $status = $dbOk ? 'ok' : 'degraded';
        $code = $dbOk ? 200 : 503;

        return response()->json([
            'status' => $status,
            'service' => 'barbershop-api',
            'checks' => [
                'database' => $dbOk ? 'up' : 'down',
            ],
            'timestamp' => now()->toIso8601String(),
        ], $code);
    }
}
