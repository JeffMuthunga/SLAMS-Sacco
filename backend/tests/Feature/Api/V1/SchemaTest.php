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

    public function test_members_tables_exist(): void
    {
        $this->assertTrue(Schema::hasTable('members'));
        $this->assertTrue(Schema::hasColumn('members', 'user_id'));
        $this->assertTrue(Schema::hasColumn('members', 'member_number'));
        $this->assertTrue(Schema::hasColumn('members', 'approval_status'));
        $this->assertTrue(Schema::hasColumn('members', 'deleted_at'));

        $this->assertTrue(Schema::hasTable('member_kins'));
        $this->assertTrue(Schema::hasColumn('member_kins', 'relationship'));
        $this->assertTrue(Schema::hasColumn('member_kins', 'beneficiary_percent'));

        $this->assertTrue(Schema::hasTable('sacco_officials'));
        $this->assertTrue(Schema::hasColumn('sacco_officials', 'position'));
    }

    public function test_products_tables_exist(): void
    {
        $this->assertTrue(Schema::hasTable('saving_products'));
        $this->assertTrue(Schema::hasColumn('saving_products', 'interest_rate'));
        $this->assertTrue(Schema::hasColumn('saving_products', 'withdrawal_frequency'));

        $this->assertTrue(Schema::hasTable('loan_products'));
        $this->assertTrue(Schema::hasColumn('loan_products', 'interest_method'));
        $this->assertTrue(Schema::hasColumn('loan_products', 'requires_guarantor'));
        $this->assertTrue(Schema::hasColumn('loan_products', 'penalty_rate'));
    }
}
