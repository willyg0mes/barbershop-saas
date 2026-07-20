<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TenantBrandingResource;
use App\Models\Tenant;

class TenantBrandingController extends Controller
{
    public function show(Tenant $tenant): TenantBrandingResource
    {
        return new TenantBrandingResource($tenant);
    }
}
