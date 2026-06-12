<?php

namespace Tests\Feature\Api\V1;

use App\Models\Member;
use App\Models\Org;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Org  $org;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeader('Origin', 'http://localhost:3000');

        $this->org = Org::factory()->create();
        $this->admin = User::factory()->create([
            'org_id' => $this->org->id,
            'role'   => 'admin',
        ]);
    }

    private function memberPayload(array $overrides = []): array
    {
        return array_merge([
            'full_name'     => 'Jane Doe',
            'id_number'     => '12345678',
            'id_type'       => 'national',
            'phone'         => '0700000001',
            'date_of_birth' => '1990-01-15',
            'entry_date'    => '2026-01-01',
        ], $overrides);
    }

    public function test_create_member_with_kins(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/members', $this->memberPayload([
                'kins' => [
                    [
                        'full_name'    => 'John Doe',
                        'relationship' => 'spouse',
                        'phone'        => '0711000000',
                        'is_emergency_contact' => true,
                        'is_beneficiary'       => true,
                        'beneficiary_percent'  => 50,
                    ],
                    [
                        'full_name'    => 'Mary Doe',
                        'relationship' => 'child',
                        'is_beneficiary' => false,
                    ],
                ],
            ]));

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.full_name', 'Jane Doe')
            ->assertJsonPath('data.approval_status', 'pending')
            ->assertJsonCount(2, 'data.kins');

        $this->assertDatabaseHas('members', ['full_name' => 'Jane Doe', 'org_id' => $this->org->id]);
        $this->assertDatabaseCount('member_kins', 2);
    }

    public function test_member_number_increments(): void
    {
        $r1 = $this->actingAs($this->admin)->postJson('/api/v1/members', $this->memberPayload());
        $r2 = $this->actingAs($this->admin)->postJson('/api/v1/members', $this->memberPayload(['id_number' => '99999999']));

        $r1->assertCreated();
        $r2->assertCreated();

        $this->assertEquals('MEM-' . now()->year . '-0001', $r1->json('data.member_number'));
        $this->assertEquals('MEM-' . now()->year . '-0002', $r2->json('data.member_number'));
    }

    public function test_create_sets_pending_status(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/members', $this->memberPayload());

        $response->assertCreated()->assertJsonPath('data.approval_status', 'pending');
    }

    public function test_update_syncs_kins(): void
    {
        $member = Member::factory()->create(['org_id' => $this->org->id]);
        $kin = $member->kins()->create([
            'org_id'       => $this->org->id,
            'full_name'    => 'Old Kin',
            'relationship' => 'parent',
        ]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/members/{$member->id}", array_merge(
                $this->memberPayload(['id_number' => $member->id_number]),
                [
                    'kins' => [
                        [
                            'id'           => $kin->id,
                            'full_name'    => 'Updated Kin',
                            'relationship' => 'parent',
                        ],
                        [
                            'full_name'    => 'New Kin',
                            'relationship' => 'sibling',
                        ],
                    ],
                ]
            ));

        $response->assertOk()->assertJsonCount(2, 'data.kins');
        $this->assertDatabaseHas('member_kins', ['id' => $kin->id, 'full_name' => 'Updated Kin']);
        $this->assertDatabaseHas('member_kins', ['full_name' => 'New Kin']);
    }

    public function test_approve_member(): void
    {
        $member = Member::factory()->pending()->create(['org_id' => $this->org->id]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/members/{$member->id}/approve");

        $response->assertOk()->assertJsonPath('data.approval_status', 'approved');

        $this->assertDatabaseHas('members', [
            'id'              => $member->id,
            'approval_status' => 'approved',
            'approved_by'     => $this->admin->id,
        ]);
        $this->assertDatabaseHas('approval_logs', [
            'approvable_id' => $member->id,
            'action'        => 'approved',
        ]);
    }

    public function test_reject_member(): void
    {
        $member = Member::factory()->pending()->create(['org_id' => $this->org->id]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/members/{$member->id}/reject", [
                'reason' => 'Incomplete documents.',
            ]);

        $response->assertOk()->assertJsonPath('data.approval_status', 'rejected');

        $this->assertDatabaseHas('approval_logs', [
            'approvable_id' => $member->id,
            'action'        => 'rejected',
            'notes'         => 'Incomplete documents.',
        ]);
    }

    public function test_archive_and_restore(): void
    {
        $member = Member::factory()->create(['org_id' => $this->org->id]);

        $this->actingAs($this->admin)
            ->deleteJson("/api/v1/members/{$member->id}")
            ->assertOk();

        $this->assertSoftDeleted('members', ['id' => $member->id]);

        $this->actingAs($this->admin)
            ->postJson("/api/v1/members/{$member->id}/restore")
            ->assertOk();

        $this->assertDatabaseHas('members', ['id' => $member->id, 'deleted_at' => null]);
    }

    public function test_archived_list_excludes_active(): void
    {
        Member::factory()->create(['org_id' => $this->org->id]);
        $archived = Member::factory()->create(['org_id' => $this->org->id]);
        $archived->delete();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/members/archived');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($archived->id, $response->json('data.0.id'));
    }

    public function test_search_filter(): void
    {
        Member::factory()->create(['org_id' => $this->org->id, 'full_name' => 'Alice Wanjiku']);
        Member::factory()->create(['org_id' => $this->org->id, 'full_name' => 'Bob Kamau']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/members?search=alice');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Alice Wanjiku', $response->json('data.0.full_name'));
    }

    public function test_status_filter(): void
    {
        Member::factory()->pending()->create(['org_id' => $this->org->id]);
        Member::factory()->approved()->create(['org_id' => $this->org->id]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/members?status=approved');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('approved', $response->json('data.0.approval_status'));
    }

    public function test_org_scoping(): void
    {
        $otherOrg  = Org::factory()->create();
        $otherUser = User::factory()->create(['org_id' => $otherOrg->id, 'role' => 'admin']);
        $member    = Member::factory()->create(['org_id' => $this->org->id]);

        $this->actingAs($otherUser)
            ->getJson("/api/v1/members/{$member->id}")
            ->assertNotFound();
    }

    public function test_beneficiary_percent_sum_validation(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/members', $this->memberPayload([
                'kins' => [
                    ['full_name' => 'Kin A', 'relationship' => 'spouse',  'is_beneficiary' => true, 'beneficiary_percent' => 70],
                    ['full_name' => 'Kin B', 'relationship' => 'sibling', 'is_beneficiary' => true, 'beneficiary_percent' => 50],
                ],
            ]));

        $response->assertUnprocessable();
    }

    public function test_photo_upload(): void
    {
        $member = Member::factory()->create(['org_id' => $this->org->id]);

        $file = \Illuminate\Http\UploadedFile::fake()->image('photo.jpg');

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/members/{$member->id}/photo", ['photo' => $file]);

        $response->assertOk();
        $this->assertNotNull($response->json('data.photo_url'));
        $this->assertDatabaseMissing('members', ['id' => $member->id, 'photo_path' => null]);
    }
}
