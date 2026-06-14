<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        $admin  = Role::firstOrCreate(['name' => 'admin',  'guard_name' => 'web']);
        $member = Role::firstOrCreate(['name' => 'member', 'guard_name' => 'web']);

        $manageMembers        = Permission::firstOrCreate(['name' => 'manage_members',        'guard_name' => 'web']);
        $manageConfigurations = Permission::firstOrCreate(['name' => 'manage_configurations', 'guard_name' => 'web']);
        $manageAccounts       = Permission::firstOrCreate(['name' => 'manage_accounts',       'guard_name' => 'web']);
        $manageLoans          = Permission::firstOrCreate(['name' => 'manage_loans',          'guard_name' => 'web']);
        $manageContributions  = Permission::firstOrCreate(['name' => 'manage_contributions',  'guard_name' => 'web']);
        $manageJournals       = Permission::firstOrCreate(['name' => 'manage_journals',       'guard_name' => 'web']);
        $managePettyCash      = Permission::firstOrCreate(['name' => 'manage_petty_cash',     'guard_name' => 'web']);
        $manageIssues         = Permission::firstOrCreate(['name' => 'manage_issues',         'guard_name' => 'web']);
        $manageCommodities    = Permission::firstOrCreate(['name' => 'manage_commodities',    'guard_name' => 'web']);
        $manageShares         = Permission::firstOrCreate(['name' => 'manage_shares',         'guard_name' => 'web']);
        $manageDividends      = Permission::firstOrCreate(['name' => 'manage_dividends',      'guard_name' => 'web']);
        $manageImports        = Permission::firstOrCreate(['name' => 'manage_imports',         'guard_name' => 'web']);
        $viewOwn              = Permission::firstOrCreate(['name' => 'view_own_data',         'guard_name' => 'web']);

        $admin->syncPermissions([$manageMembers, $manageConfigurations, $manageAccounts, $manageLoans, $manageContributions, $manageJournals, $managePettyCash, $manageIssues, $manageCommodities, $manageShares, $manageDividends, $manageImports]);
        $member->syncPermissions([$viewOwn]);
    }
}
