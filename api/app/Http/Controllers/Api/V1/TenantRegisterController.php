<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * @deprecated Cadastro público desativado. Use o painel /platform.
 */
class TenantRegisterController extends Controller
{
    public function store(): JsonResponse
    {
        return response()->json([
            'message' => 'Cadastro público desativado. Contate o administrador da plataforma.',
        ], 403);
    }
}
