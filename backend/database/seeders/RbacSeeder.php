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

        // ── Roles ───────────────────────────────────────────────────────
        $admin        = Role::firstOrCreate(['name' => 'admin',         'guard_name' => 'web']);
        $manager      = Role::firstOrCreate(['name' => 'manager',       'guard_name' => 'web']);
        $loansOfficer = Role::firstOrCreate(['name' => 'loans_officer', 'guard_name' => 'web']);
        $teller       = Role::firstOrCreate(['name' => 'teller',        'guard_name' => 'web']);
        $auditor      = Role::firstOrCreate(['name' => 'auditor',       'guard_name' => 'web']);
        $member       = Role::firstOrCreate(['name' => 'member',        'guard_name' => 'web']);

        // ── Permissions ─────────────────────────────────────────────────
        $perms = [];
        $names = [
            'manage_members',
            'manage_configurations',
            'manage_accounts',
            'manage_loans',
            'manage_contributions',
            'manage_journals',
            'manage_petty_cash',
            'manage_issues',
            'manage_shares',
            'manage_dividends',
            'manage_commodities',
            'manage_imports',
            'manage_reports',
            'view_own_data',
        ];

        foreach ($names as $name) {
            $perms[$name] = Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        // ── Role ↔ Permission assignments ───────────────────────────────
        $admin->syncPermissions(array_values($perms)); // all permissions

        $manager->syncPermissions([
            $perms['manage_members'],
            $perms['manage_accounts'],
            $perms['manage_loans'],
            $perms['manage_contributions'],
            $perms['manage_journals'],
            $perms['manage_petty_cash'],
            $perms['manage_issues'],
            $perms['manage_shares'],
            $perms['manage_dividends'],
            $perms['manage_commodities'],
            $perms['manage_imports'],
            $perms['manage_reports'],
        ]);

        $loansOfficer->syncPermissions([
            $perms['manage_loans'],
            $perms['manage_members'],
            $perms['manage_reports'],
        ]);

        $teller->syncPermissions([
            $perms['manage_accounts'],
            $perms['manage_contributions'],
            $perms['manage_reports'],
        ]);

        $auditor->syncPermissions([
            $perms['manage_journals'],
            $perms['manage_reports'],
        ]);

        $member->syncPermissions([$perms['view_own_data']]);
    }
}
