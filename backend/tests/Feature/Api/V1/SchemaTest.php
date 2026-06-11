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

    public function test_finance_foundation_tables_exist(): void
    {
        $this->assertTrue(Schema::hasTable('currencies'));
        $this->assertTrue(Schema::hasColumn('currencies', 'code'));
        $this->assertTrue(Schema::hasColumn('currencies', 'is_default'));

        $this->assertTrue(Schema::hasTable('fiscal_years'));
        $this->assertTrue(Schema::hasColumn('fiscal_years', 'start_date'));
        $this->assertTrue(Schema::hasColumn('fiscal_years', 'is_closed'));

        $this->assertTrue(Schema::hasTable('periods'));
        $this->assertTrue(Schema::hasColumn('periods', 'fiscal_year_id'));
        $this->assertTrue(Schema::hasColumn('periods', 'is_posted'));
    }

    public function test_chart_of_accounts_tables_exist(): void
    {
        $this->assertTrue(Schema::hasTable('account_types'));
        $this->assertTrue(Schema::hasColumn('account_types', 'code'));

        $this->assertTrue(Schema::hasTable('chart_of_accounts'));
        $this->assertTrue(Schema::hasColumn('chart_of_accounts', 'account_type_id'));
        $this->assertTrue(Schema::hasColumn('chart_of_accounts', 'parent_id'));
        $this->assertTrue(Schema::hasColumn('chart_of_accounts', 'is_header'));
    }
}
