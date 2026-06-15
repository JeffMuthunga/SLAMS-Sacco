<?php

namespace Database\Seeders;

use App\Models\Currency;
use App\Models\Member;
use App\Models\Org;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $org = Org::firstOrCreate(
            ['is_default' => true],
            [
                'name'          => 'K2an',
                'full_name'     => 'K2an Savings and Credit Cooperative',
                'suffix'        => 'SACCO',
                'email'         => 'info@k2an.co.ke',
                'country_code'  => 'KEN',
                'currency_code' => 'KES',
                'is_active'     => true,
            ]
        );

        Currency::firstOrCreate(
            ['org_id' => $org->id, 'code' => 'BWP'],
            [
                'name'       => 'Botswana Pula',
                'symbol'     => 'P',
                'is_default' => true,
            ]
        );

        $this->call(RbacSeeder::class);
        $this->call(ConfigurationsSeeder::class);
        $this->call(DemoDataSeeder::class);

        // Demo logins (password: "password")
        $admin = User::firstOrCreate(
            ['email' => 'admin@slamssacco.co.ke'],
            ['name' => 'SACCO Admin', 'org_id' => $org->id, 'password' => bcrypt('password')]
        );
        if (! $admin->hasRole('admin')) {
            $admin->assignRole('admin');
        }

        $memberUser = User::firstOrCreate(
            ['email' => 'member@slamssacco.co.ke'],
            ['name' => 'Demo Member', 'org_id' => $org->id, 'password' => bcrypt('password')]
        );
        if (! $memberUser->hasRole('member')) {
            $memberUser->assignRole('member');
        }

        // Create a demo Member record linked to the member user so the portal works
        if (! Member::where('user_id', $memberUser->id)->exists()) {
            $year   = now()->year;
            $prefix = "JWN-{$year}-";
            $max    = Member::withTrashed()
                ->where('org_id', $org->id)
                ->where('member_number', 'like', $prefix . '%')
                ->max('member_number');
            $next   = $max ? ((int) substr($max, -4)) + 1 : 1;

            Member::create([
                'org_id'          => $org->id,
                'user_id'         => $memberUser->id,
                'member_number'   => $prefix . str_pad($next, 4, '0', STR_PAD_LEFT),
                'full_name'       => 'Demo Member',
                'id_number'       => 'BWA000001',
                'phone'           => '+26771000001',
                'date_of_birth'   => '1990-01-01',
                'gender'          => 'M',
                'approval_status' => 'approved',
                'is_active'       => true,
                'entry_date'      => now()->toDateString(),
            ]);
        }

        // Seed additional approved members for guarantor search testing
        // First 5 get portal accounts (email = id_number@demo.sacco); last 5 remain without.
        $demoMembers = [
            ['full_name' => 'Kagiso Sithole',    'id_number' => 'BWA000002', 'phone' => '+26771000002', 'gender' => 'M', 'dob' => '1985-03-15', 'email' => 'kagiso@demo.sacco'],
            ['full_name' => 'Boitumelo Kgosi',   'id_number' => 'BWA000003', 'phone' => '+26771000003', 'gender' => 'F', 'dob' => '1992-07-22', 'email' => 'boitumelo@demo.sacco'],
            ['full_name' => 'Tebogo Mosweu',     'id_number' => 'BWA000004', 'phone' => '+26771000004', 'gender' => 'M', 'dob' => '1988-11-05', 'email' => 'tebogo@demo.sacco'],
            ['full_name' => 'Mpho Gabaraane',    'id_number' => 'BWA000005', 'phone' => '+26771000005', 'gender' => 'F', 'dob' => '1995-04-30', 'email' => 'mpho@demo.sacco'],
            ['full_name' => 'Onkabetse Motlhabi','id_number' => 'BWA000006', 'phone' => '+26771000006', 'gender' => 'M', 'dob' => '1980-09-12', 'email' => 'onkabetse@demo.sacco'],
            ['full_name' => 'Lorato Segaetsho',  'id_number' => 'BWA000007', 'phone' => '+26771000007', 'gender' => 'F', 'dob' => '1993-01-18', 'email' => null],
            ['full_name' => 'Kabo Setlhare',     'id_number' => 'BWA000008', 'phone' => '+26771000008', 'gender' => 'M', 'dob' => '1987-06-25', 'email' => null],
            ['full_name' => 'Dineo Modise',      'id_number' => 'BWA000009', 'phone' => '+26771000009', 'gender' => 'F', 'dob' => '1991-12-03', 'email' => null],
            ['full_name' => 'Gorata Kebonang',   'id_number' => 'BWA000010', 'phone' => '+26771000010', 'gender' => 'F', 'dob' => '1989-08-14', 'email' => null],
            ['full_name' => 'Thato Morapedi',    'id_number' => 'BWA000011', 'phone' => '+26771000011', 'gender' => 'M', 'dob' => '1994-02-27', 'email' => null],
        ];

        $year   = now()->year;
        $prefix = "JWN-{$year}-";

        foreach ($demoMembers as $m) {
            $existing = Member::where('id_number', $m['id_number'])->where('org_id', $org->id)->first();

            if (! $existing) {
                $max  = Member::withTrashed()
                    ->where('org_id', $org->id)
                    ->where('member_number', 'like', $prefix . '%')
                    ->max('member_number');
                $next = $max ? ((int) substr($max, -4)) + 1 : 1;

                $existing = Member::create([
                    'org_id'          => $org->id,
                    'user_id'         => null,
                    'member_number'   => $prefix . str_pad($next, 4, '0', STR_PAD_LEFT),
                    'full_name'       => $m['full_name'],
                    'id_number'       => $m['id_number'],
                    'email'           => $m['email'],
                    'phone'           => $m['phone'],
                    'date_of_birth'   => $m['dob'],
                    'gender'          => $m['gender'],
                    'approval_status' => 'approved',
                    'is_active'       => true,
                    'entry_date'      => now()->toDateString(),
                ]);
            }

            // Create portal account for members that have an email and no user yet
            if ($m['email'] && ! $existing->user_id) {
                $portalUser = User::firstOrCreate(
                    ['email' => $m['email']],
                    [
                        'name'     => $m['full_name'],
                        'org_id'   => $org->id,
                        'password' => bcrypt('password'),
                    ]
                );
                if (! $portalUser->hasRole('member')) {
                    $portalUser->assignRole('member');
                }
                $existing->update(['user_id' => $portalUser->id, 'email' => $m['email']]);
            }
        }
    }
}
