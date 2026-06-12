<?php

namespace Database\Factories;

use App\Models\Org;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrgFactory extends Factory
{
    protected $model = Org::class;

    public function definition(): array
    {
        return [
            'name'         => fake()->company(),
            'full_name'    => fake()->company() . ' Cooperative Society',
            'country_code' => 'KEN',
            'currency_code'=> 'KES',
            'is_active'    => true,
            'is_default'   => false,
        ];
    }
}
