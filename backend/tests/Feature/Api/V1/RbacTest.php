<?php

namespace Tests\Feature\Api\V1;

use App\Models\Member;
use App\Models\Org;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RbacTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $member;
    private Org  $org;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeader('Origin', 'http://localhost:3000');

        $this->seed(RbacSeeder::class);
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        $this->org = Org::factory()->create();

        $this->admin = User::factory()->create(['org_id' => $this->org->id]);
        $this->admin->assignRole('admin');

        $this->member = User::factory()->create(['org_id' => $this->org->id]);
        $this->member->assignRole('member');
    }

    public function test_admin_can_list_members(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/v1/members')
            ->assertOk();
    }

    public function test_member_cannot_list_members(): void
    {
        $this->actingAs($this->member)
            ->getJson('/api/v1/members')
            ->assertForbidden();
    }

    public function test_admin_can_approve_member(): void
    {
        $target = Member::factory()->create([
            'org_id'          => $this->org->id,
            'approval_status' => 'pending',
        ]);

        $this->actingAs($this->admin)
            ->postJson("/api/v1/members/{$target->id}/approve")
            ->assertOk();
    }

    public function test_member_cannot_approve_member(): void
    {
        $target = Member::factory()->create([
            'org_id'          => $this->org->id,
            'approval_status' => 'pending',
        ]);

        $this->actingAs($this->member)
            ->postJson("/api/v1/members/{$target->id}/approve")
            ->assertForbidden();
    }
}
