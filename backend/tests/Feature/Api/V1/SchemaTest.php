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

    public function test_accounts_tables_exist(): void
    {
        $this->assertTrue(Schema::hasTable('deposit_accounts'));
        $this->assertTrue(Schema::hasColumn('deposit_accounts', 'account_number'));
        $this->assertTrue(Schema::hasColumn('deposit_accounts', 'balance'));
        $this->assertTrue(Schema::hasColumn('deposit_accounts', 'approval_status'));

        $this->assertTrue(Schema::hasTable('account_transactions'));
        $this->assertTrue(Schema::hasColumn('account_transactions', 'transaction_type'));
        $this->assertTrue(Schema::hasColumn('account_transactions', 'balance_after'));
        $this->assertTrue(Schema::hasColumn('account_transactions', 'linked_transaction_id'));
    }

    public function test_loans_tables_exist(): void
    {
        $this->assertTrue(Schema::hasTable('loans'));
        $this->assertTrue(Schema::hasColumn('loans', 'loan_status'));
        $this->assertTrue(Schema::hasColumn('loans', 'outstanding_balance'));
        $this->assertTrue(Schema::hasColumn('loans', 'disburse_account_id'));

        $this->assertTrue(Schema::hasTable('loan_guarantees'));
        $this->assertTrue(Schema::hasColumn('loan_guarantees', 'guaranteed_amount'));

        $this->assertTrue(Schema::hasTable('loan_collaterals'));
        $this->assertTrue(Schema::hasColumn('loan_collaterals', 'estimated_value'));

        $this->assertTrue(Schema::hasTable('loan_repayments'));
        $this->assertTrue(Schema::hasColumn('loan_repayments', 'principal_due'));
        $this->assertTrue(Schema::hasColumn('loan_repayments', 'repayment_status'));

        $this->assertTrue(Schema::hasTable('loan_notes'));
        $this->assertTrue(Schema::hasColumn('loan_notes', 'note'));
    }

    public function test_contributions_and_journals_tables_exist(): void
    {
        $this->assertTrue(Schema::hasTable('contributions'));
        $this->assertTrue(Schema::hasColumn('contributions', 'expected_amount'));
        $this->assertTrue(Schema::hasColumn('contributions', 'status'));

        $this->assertTrue(Schema::hasTable('journals'));
        $this->assertTrue(Schema::hasColumn('journals', 'is_posted'));
        $this->assertTrue(Schema::hasColumn('journals', 'is_reversed'));

        $this->assertTrue(Schema::hasTable('journal_lines'));
        $this->assertTrue(Schema::hasColumn('journal_lines', 'debit'));
        $this->assertTrue(Schema::hasColumn('journal_lines', 'credit'));
    }
}
