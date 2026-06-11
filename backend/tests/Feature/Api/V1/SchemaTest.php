<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_foundation_tables_exist(): void
    {
        $this->assertTrue(Schema::hasTable('orgs'));
        $this->assertTrue(Schema::hasColumn('orgs', 'id'));
        $this->assertTrue(Schema::hasColumn('orgs', 'name'));
        $this->assertTrue(Schema::hasColumn('orgs', 'currency_code'));
        $this->assertTrue(Schema::hasColumn('orgs', 'is_active'));
        $this->assertTrue(Schema::hasColumn('orgs', 'deleted_at'));

        $this->assertTrue(Schema::hasColumn('users', 'org_id'));

        $this->assertTrue(Schema::hasTable('approval_logs'));
        $this->assertTrue(Schema::hasColumn('approval_logs', 'approvable_type'));
        $this->assertTrue(Schema::hasColumn('approval_logs', 'approvable_id'));
        $this->assertTrue(Schema::hasColumn('approval_logs', 'action'));
    }
}
