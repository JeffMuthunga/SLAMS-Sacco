<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateOneByOne extends Command
{
    protected $signature   = 'migrate:one-by-one {--force : Force the operation to run in production}';
    protected $description = 'Run pending migrations one at a time, stopping on first failure.';

    public function handle(): int
    {
        $migrationPath = database_path('migrations');

        // Already-run migrations
        $ran = DB::table('migrations')->pluck('migration')->toArray();

        // All migration files sorted
        $files = collect(glob($migrationPath . '/*.php'))
            ->map(fn ($f) => basename($f, '.php'))
            ->sort()
            ->values();

        $pending = $files->filter(fn ($name) => ! in_array($name, $ran, true));

        if ($pending->isEmpty()) {
            $this->info('Nothing to migrate.');
            return self::SUCCESS;
        }

        foreach ($pending as $migration) {
            $this->info("Migrating: {$migration}");

            $exitCode = $this->call('migrate', [
                '--path'  => "database/migrations/{$migration}.php",
                '--force' => $this->option('force'),
            ]);

            if ($exitCode !== 0) {
                $this->error("Migration failed: {$migration}. Stopping.");
                return self::FAILURE;
            }

            $this->info("Migrated:  {$migration}");
        }

        return self::SUCCESS;
    }
}
