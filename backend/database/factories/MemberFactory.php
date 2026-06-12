<?php

namespace Database\Factories;

use App\Models\Member;
use App\Models\Org;
use Illuminate\Database\Eloquent\Factories\Factory;

class MemberFactory extends Factory
{
    protected $model = Member::class;

    public function definition(): array
    {
        return [
            'org_id'          => Org::factory(),
            'member_number'   => 'MEM-' . now()->year . '-' . str_pad(fake()->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'full_name'       => fake()->name(),
            'id_number'       => fake()->unique()->numerify('########'),
            'id_type'         => 'national',
            'phone'           => '07' . fake()->numerify('########'),
            'date_of_birth'   => fake()->date('Y-m-d', '-20 years'),
            'entry_date'      => fake()->date('Y-m-d'),
            'approval_status' => 'pending',
            'is_active'       => true,
            'employed'        => false,
            'self_employed'   => false,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attrs) => ['approval_status' => 'approved']);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attrs) => ['approval_status' => 'pending']);
    }
}
