<?php

namespace App\Http\Middleware;

use App\Models\PlatformAdmin;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlatformAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof PlatformAdmin || ! $user->is_active) {
            abort(Response::HTTP_FORBIDDEN, 'Platform admin access required.');
        }

        return $next($request);
    }
}
