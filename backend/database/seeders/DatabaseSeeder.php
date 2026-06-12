<?php

namespace Database\Seeders;

use App\Models\Currency;
use App\Models\Org;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $org = Org::create([
            'name'          => 'SLAMS SACCO',
            'full_name'     => 'SLAMS Savings and Credit Cooperative Society',
            'suffix'        => 'SACCO',
            'email'         => 'info@slamssacco.co.ke',
            'country_code'  => 'KEN',
            'currency_code' => 'KES',
            'is_active'     => true,
            'is_default'    => true,
        ]);

        Currency::create([
            'org_id'     => $org->id,
            'code'       => 'KES',
            'name'       => 'Kenyan Shilling',
            'symbol'     => 'KSh',
            'is_default' => true,
        ]);

        $this->call(RbacSeeder::class);

        // Demo logins (password: "password")
        User::factory()->create([
            'name'   => 'SACCO Admin',
            'email'  => 'admin@slamssacco.co.ke',
            'org_id' => $org->id,
        ])->assignRole('admin');

        User::factory()->create([
            'name'   => 'Demo Member',
            'email'  => 'member@slamssacco.co.ke',
            'org_id' => $org->id,
        ])->assignRole('member');
    }
}
