<?php

namespace App\Console\Commands;

use App\Services\WynextPlatformSyncService;
use Illuminate\Console\Command;

class SyncTenantsToWynext extends Command
{
    protected $signature = 'wynext:sync-tenants';

    protected $description = 'Sincroniza tenants locais com o Wynext control-plane';

    public function handle(WynextPlatformSyncService $sync): int
    {
        if (! $sync->enabled()) {
            $this->error('Sync desabilitado. Configure WYNEXT_PLATFORM_URL, WYNEXT_PLATFORM_TOKEN e WYNEXT_PLATFORM_SYNC=true.');

            return self::FAILURE;
        }

        $result = $sync->syncAll();
        $this->info("Sincronizados: {$result['ok']} ok, {$result['fail']} falha(s).");

        return $result['fail'] > 0 ? self::FAILURE : self::SUCCESS;
    }
}
