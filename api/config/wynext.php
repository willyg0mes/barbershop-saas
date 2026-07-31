<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Domínio base Wynext
    |--------------------------------------------------------------------------
    */
    'base_domain' => env('TENANT_BASE_DOMAIN', 'wynext.online'),

    /*
    |--------------------------------------------------------------------------
    | Control plane (registro transversal de tenants)
    |--------------------------------------------------------------------------
    */
    'platform_url' => env('WYNEXT_PLATFORM_URL'),
    'platform_token' => env('WYNEXT_PLATFORM_TOKEN'),
    'platform_sync' => env('WYNEXT_PLATFORM_SYNC', false),
];
