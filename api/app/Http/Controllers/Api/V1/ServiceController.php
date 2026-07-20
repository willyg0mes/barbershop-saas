<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use App\Models\Tenant;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ServiceController extends Controller
{
    public function index(Tenant $tenant): AnonymousResourceCollection
    {
        $services = Service::query()
            ->forTenant($tenant)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return ServiceResource::collection($services);
    }
}
