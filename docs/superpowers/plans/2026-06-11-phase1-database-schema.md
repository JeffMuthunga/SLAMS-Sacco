# Phase 1: Database Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create all 27 Laravel migrations and 26 Eloquent models for the full SLAMS SACCO database schema, then verify with a schema feature test.

**Architecture:** One migration per table in FK dependency order; all tables use UUID PKs, soft deletes (except audit/immutable tables), and `org_id` scoping. Eloquent models use `HasUuids`, `SoftDeletes`, typed `$casts`, and declare all relationships.

**Tech Stack:** Laravel 12, PostgreSQL, PHP 8.2+, PHPUnit

---

## File Map

### Migrations (`backend/database/migrations/`)
```
2026_06_11_140000_create_orgs_table.php
2026_06_11_141000_add_org_id_to_users_table.php
2026_06_11_142000_create_approval_logs_table.php
2026_06_11_143000_create_currencies_table.php
2026_06_11_144000_create_fiscal_years_table.php
2026_06_11_145000_create_periods_table.php
2026_06_11_146000_create_account_types_table.php
2026_06_11_147000_create_chart_of_accounts_table.php
2026_06_11_148000_create_members_table.php
2026_06_11_149000_create_member_kins_table.php
2026_06_11_150000_create_sacco_officials_table.php
2026_06_11_151000_create_saving_products_table.php
2026_06_11_152000_create_loan_products_table.php
2026_06_11_153000_create_deposit_accounts_table.php
2026_06_11_154000_create_account_transactions_table.php
2026_06_11_155000_create_loans_table.php
2026_06_11_156000_create_loan_guarantees_table.php
2026_06_11_157000_create_loan_collaterals_table.php
2026_06_11_158000_create_loan_repayments_table.php
2026_06_11_159000_create_loan_notes_table.php
2026_06_11_160000_create_contributions_table.php
2026_06_11_161000_create_journals_table.php
2026_06_11_162000_create_journal_lines_table.php
2026_06_11_163000_create_petty_cash_categories_table.php
2026_06_11_164000_create_petty_cash_items_table.php
2026_06_11_165000_create_petty_cash_allocations_table.php
2026_06_11_166000_create_petty_cash_requests_table.php
```

### Models (`backend/app/Models/`)
```
Org.php
ApprovalLog.php
Currency.php
FiscalYear.php
Period.php
AccountType.php
ChartOfAccount.php
Member.php
MemberKin.php
SaccoOfficial.php
SavingProduct.php
LoanProduct.php
DepositAccount.php
AccountTransaction.php
Loan.php
LoanGuarantee.php
LoanCollateral.php
LoanRepayment.php
LoanNote.php
Contribution.php
Journal.php
JournalLine.php
PettyCashCategory.php
PettyCashItem.php
PettyCashAllocation.php
PettyCashRequest.php
```

### Tests
```
backend/tests/Feature/Api/V1/SchemaTest.php
```

---

## Task 1: Foundation migrations (orgs, users update, approval_logs)

**Files:**
- Create: `backend/database/migrations/2026_06_11_140000_create_orgs_table.php`
- Create: `backend/database/migrations/2026_06_11_141000_add_org_id_to_users_table.php`
- Create: `backend/database/migrations/2026_06_11_142000_create_approval_logs_table.php`
- Create: `backend/tests/Feature/Api/V1/SchemaTest.php`

- [ ] **Step 1: Write the failing schema test**

Create `backend/tests/Feature/Api/V1/SchemaTest.php`:

```php
<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SchemaTest extends TestCase
{
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
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_foundation_tables_exist
```

Expected: FAIL — `orgs` table does not exist.

- [ ] **Step 3: Create `2026_06_11_140000_create_orgs_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orgs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);
            $table->string('full_name', 200)->nullable();
            $table->string('suffix', 10)->nullable();
            $table->string('email', 120)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('website', 120)->nullable();
            $table->string('logo_path', 255)->nullable();
            $table->text('address')->nullable();
            $table->string('town', 100)->nullable();
            $table->char('country_code', 3)->default('KEN');
            $table->char('currency_code', 3)->default('KES');
            $table->string('pin', 50)->nullable();
            $table->string('reg_number', 50)->nullable();
            $table->integer('member_limit')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orgs');
    }
};
```

- [ ] **Step 4: Create `2026_06_11_141000_add_org_id_to_users_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignUuid('org_id')->nullable()->after('role')
                ->constrained('orgs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['org_id']);
            $table->dropColumn('org_id');
        });
    }
};
```

- [ ] **Step 5: Create `2026_06_11_142000_create_approval_logs_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->string('approvable_type', 50);
            $table->uuid('approvable_id');
            $table->enum('action', ['submitted', 'approved', 'rejected', 'flagged']);
            $table->string('from_status', 20);
            $table->string('to_status', 20);
            $table->foreignUuid('performed_by')->constrained('users')->cascadeOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['approvable_type', 'approvable_id']);
        });
        // No softDeletes — audit log is immutable
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_logs');
    }
};
```

- [ ] **Step 6: Run migrations**

```bash
cd backend && php artisan migrate
```

Expected: `Migrating: 2026_06_11_140000_create_orgs_table` ... `Migrated` (3 migrations).

- [ ] **Step 7: Run the test — verify it passes**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_foundation_tables_exist
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/database/migrations/2026_06_11_140000_create_orgs_table.php \
        backend/database/migrations/2026_06_11_141000_add_org_id_to_users_table.php \
        backend/database/migrations/2026_06_11_142000_create_approval_logs_table.php \
        backend/tests/Feature/Api/V1/SchemaTest.php
git commit -m "feat(schema): foundation tables — orgs, approval_logs, users.org_id"
```

---

## Task 2: Finance foundation migrations (currencies, fiscal_years, periods)

**Files:**
- Create: `backend/database/migrations/2026_06_11_143000_create_currencies_table.php`
- Create: `backend/database/migrations/2026_06_11_144000_create_fiscal_years_table.php`
- Create: `backend/database/migrations/2026_06_11_145000_create_periods_table.php`
- Modify: `backend/tests/Feature/Api/V1/SchemaTest.php`

- [ ] **Step 1: Add failing test**

Append to `SchemaTest.php`:

```php
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
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_finance_foundation_tables_exist
```

Expected: FAIL.

- [ ] **Step 3: Create `2026_06_11_143000_create_currencies_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('currencies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->nullable()->constrained('orgs')->nullOnDelete();
            $table->char('code', 3)->unique();
            $table->string('name', 50);
            $table->string('symbol', 5);
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('currencies');
    }
};
```

- [ ] **Step 4: Create `2026_06_11_144000_create_fiscal_years_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fiscal_years', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->string('name', 20);
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_opened')->default(false);
            $table->boolean('is_closed')->default(false);
            $table->timestamp('closed_at')->nullable();
            $table->foreignUuid('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fiscal_years');
    }
};
```

- [ ] **Step 5: Create `2026_06_11_145000_create_periods_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('periods', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('fiscal_year_id')->constrained('fiscal_years')->cascadeOnDelete();
            $table->string('name', 30);
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_opened')->default(false);
            $table->boolean('is_closed')->default(false);
            $table->boolean('is_posted')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('periods');
    }
};
```

- [ ] **Step 6: Run migrations**

```bash
cd backend && php artisan migrate
```

Expected: 3 new migrations run successfully.

- [ ] **Step 7: Run the test — verify it passes**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_finance_foundation_tables_exist
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/database/migrations/2026_06_11_143000_create_currencies_table.php \
        backend/database/migrations/2026_06_11_144000_create_fiscal_years_table.php \
        backend/database/migrations/2026_06_11_145000_create_periods_table.php \
        backend/tests/Feature/Api/V1/SchemaTest.php
git commit -m "feat(schema): finance foundation — currencies, fiscal_years, periods"
```

---

## Task 3: Chart of Accounts migrations

**Files:**
- Create: `backend/database/migrations/2026_06_11_146000_create_account_types_table.php`
- Create: `backend/database/migrations/2026_06_11_147000_create_chart_of_accounts_table.php`
- Modify: `backend/tests/Feature/Api/V1/SchemaTest.php`

- [ ] **Step 1: Add failing test**

```php
public function test_chart_of_accounts_tables_exist(): void
{
    $this->assertTrue(Schema::hasTable('account_types'));
    $this->assertTrue(Schema::hasColumn('account_types', 'code'));

    $this->assertTrue(Schema::hasTable('chart_of_accounts'));
    $this->assertTrue(Schema::hasColumn('chart_of_accounts', 'account_type_id'));
    $this->assertTrue(Schema::hasColumn('chart_of_accounts', 'parent_id'));
    $this->assertTrue(Schema::hasColumn('chart_of_accounts', 'is_header'));
}
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_chart_of_accounts_tables_exist
```

Expected: FAIL.

- [ ] **Step 3: Create `2026_06_11_146000_create_account_types_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->tinyInteger('code'); // 1=Assets 2=Liabilities 3=Income 4=Expenses 5=Equity
            $table->string('name', 100);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_types');
    }
};
```

- [ ] **Step 4: Create `2026_06_11_147000_create_chart_of_accounts_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chart_of_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('account_type_id')->constrained('account_types')->restrictOnDelete();
            $table->uuid('parent_id')->nullable();
            $table->string('code', 20);
            $table->string('name', 150);
            $table->boolean('is_header')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('parent_id')->references('id')->on('chart_of_accounts')->nullOnDelete();
            $table->unique(['org_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chart_of_accounts');
    }
};
```

- [ ] **Step 5: Run migrations**

```bash
cd backend && php artisan migrate
```

Expected: 2 new migrations run successfully.

- [ ] **Step 6: Run the test — verify it passes**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_chart_of_accounts_tables_exist
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/database/migrations/2026_06_11_146000_create_account_types_table.php \
        backend/database/migrations/2026_06_11_147000_create_chart_of_accounts_table.php \
        backend/tests/Feature/Api/V1/SchemaTest.php
git commit -m "feat(schema): chart of accounts — account_types, chart_of_accounts"
```

---

## Task 4: Members domain migrations

**Files:**
- Create: `backend/database/migrations/2026_06_11_148000_create_members_table.php`
- Create: `backend/database/migrations/2026_06_11_149000_create_member_kins_table.php`
- Create: `backend/database/migrations/2026_06_11_150000_create_sacco_officials_table.php`
- Modify: `backend/tests/Feature/Api/V1/SchemaTest.php`

- [ ] **Step 1: Add failing test**

```php
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
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_members_tables_exist
```

Expected: FAIL.

- [ ] **Step 3: Create `2026_06_11_148000_create_members_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('member_number', 20);
            $table->string('title', 10)->nullable();
            $table->string('full_name', 150);
            $table->string('id_number', 50);
            $table->enum('id_type', ['national', 'passport', 'alien', 'military'])->default('national');
            $table->string('email', 120)->nullable();
            $table->string('phone', 20);
            $table->string('phone2', 20)->nullable();
            $table->date('date_of_birth');
            $table->char('gender', 1)->nullable();
            $table->char('nationality', 3)->default('KEN');
            $table->enum('marital_status', ['single', 'married', 'divorced', 'widowed'])->nullable();
            $table->text('address')->nullable();
            $table->string('town', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('photo_path', 255)->nullable();
            $table->boolean('employed')->default(false);
            $table->boolean('self_employed')->default(false);
            $table->string('employer_name', 120)->nullable();
            $table->decimal('monthly_salary', 15, 2)->nullable();
            $table->decimal('monthly_net_income', 15, 2)->nullable();
            $table->date('entry_date');
            $table->boolean('is_active')->default(true);
            $table->enum('approval_status', ['draft', 'pending', 'approved', 'rejected'])->default('draft');
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('terminated_at')->nullable();
            $table->text('termination_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['org_id', 'member_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
```

- [ ] **Step 4: Create `2026_06_11_149000_create_member_kins_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_kins', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('member_id')->constrained('members')->cascadeOnDelete();
            $table->string('full_name', 150);
            $table->enum('relationship', ['spouse', 'child', 'parent', 'sibling', 'other']);
            $table->date('date_of_birth')->nullable();
            $table->string('id_number', 50)->nullable();
            $table->string('id_type', 20)->nullable();
            $table->string('phone', 20)->nullable();
            $table->boolean('is_emergency_contact')->default(false);
            $table->boolean('is_beneficiary')->default(false);
            $table->decimal('beneficiary_percent', 5, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_kins');
    }
};
```

- [ ] **Step 5: Create `2026_06_11_150000_create_sacco_officials_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sacco_officials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('member_id')->constrained('members')->cascadeOnDelete();
            $table->string('position', 150);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sacco_officials');
    }
};
```

- [ ] **Step 6: Run migrations**

```bash
cd backend && php artisan migrate
```

Expected: 3 new migrations run successfully.

- [ ] **Step 7: Run the test — verify it passes**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_members_tables_exist
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/database/migrations/2026_06_11_148000_create_members_table.php \
        backend/database/migrations/2026_06_11_149000_create_member_kins_table.php \
        backend/database/migrations/2026_06_11_150000_create_sacco_officials_table.php \
        backend/tests/Feature/Api/V1/SchemaTest.php
git commit -m "feat(schema): members domain — members, member_kins, sacco_officials"
```

---

## Task 5: Products migrations

**Files:**
- Create: `backend/database/migrations/2026_06_11_151000_create_saving_products_table.php`
- Create: `backend/database/migrations/2026_06_11_152000_create_loan_products_table.php`
- Modify: `backend/tests/Feature/Api/V1/SchemaTest.php`

- [ ] **Step 1: Add failing test**

```php
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
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_products_tables_exist
```

Expected: FAIL.

- [ ] **Step 3: Create `2026_06_11_151000_create_saving_products_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saving_products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->decimal('interest_rate', 6, 4)->default(0);
            $table->decimal('min_opening_balance', 15, 2)->default(0);
            $table->decimal('min_balance', 15, 2)->default(0);
            $table->decimal('max_balance', 15, 2)->nullable();
            $table->decimal('min_deposit', 15, 2)->default(0);
            $table->decimal('max_deposit', 15, 2)->nullable();
            $table->decimal('min_withdrawal', 15, 2)->default(0);
            $table->decimal('max_withdrawal', 15, 2)->nullable();
            $table->integer('lock_in_months')->default(0);
            $table->enum('withdrawal_frequency', ['any', 'daily', 'weekly', 'monthly'])->default('any');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saving_products');
    }
};
```

- [ ] **Step 4: Create `2026_06_11_152000_create_loan_products_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->decimal('interest_rate', 6, 4);
            $table->enum('interest_method', ['flat', 'reducing_balance'])->default('reducing_balance');
            $table->enum('repayment_frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'annually'])->default('monthly');
            $table->decimal('min_amount', 15, 2);
            $table->decimal('max_amount', 15, 2);
            $table->integer('min_period_months');
            $table->integer('max_period_months');
            $table->integer('max_repayments')->nullable();
            $table->boolean('requires_guarantor')->default(true);
            $table->boolean('requires_collateral')->default(false);
            $table->integer('min_membership_months')->default(0);
            $table->decimal('processing_fee_amount', 15, 2)->default(0);
            $table->decimal('processing_fee_percent', 5, 2)->default(0);
            $table->decimal('penalty_rate', 6, 4)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_products');
    }
};
```

- [ ] **Step 5: Run migrations**

```bash
cd backend && php artisan migrate
```

Expected: 2 new migrations run successfully.

- [ ] **Step 6: Run the test — verify it passes**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_products_tables_exist
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/database/migrations/2026_06_11_151000_create_saving_products_table.php \
        backend/database/migrations/2026_06_11_152000_create_loan_products_table.php \
        backend/tests/Feature/Api/V1/SchemaTest.php
git commit -m "feat(schema): products — saving_products, loan_products"
```

---

## Task 6: Accounts migrations

**Files:**
- Create: `backend/database/migrations/2026_06_11_153000_create_deposit_accounts_table.php`
- Create: `backend/database/migrations/2026_06_11_154000_create_account_transactions_table.php`
- Modify: `backend/tests/Feature/Api/V1/SchemaTest.php`

- [ ] **Step 1: Add failing test**

```php
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
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_accounts_tables_exist
```

Expected: FAIL.

- [ ] **Step 3: Create `2026_06_11_153000_create_deposit_accounts_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deposit_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('saving_products')->restrictOnDelete();
            $table->string('account_number', 32)->unique();
            $table->decimal('balance', 15, 2)->default(0);
            $table->decimal('interest_rate', 6, 4)->default(0);
            $table->date('opening_date');
            $table->date('last_activity_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_locked')->default(false);
            $table->date('locked_until_date')->nullable();
            $table->enum('approval_status', ['draft', 'pending', 'approved', 'rejected'])->default('draft');
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deposit_accounts');
    }
};
```

- [ ] **Step 4: Create `2026_06_11_154000_create_account_transactions_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('deposit_account_id')->constrained('deposit_accounts')->cascadeOnDelete();
            $table->foreignUuid('period_id')->nullable()->constrained('periods')->nullOnDelete();
            $table->enum('transaction_type', [
                'deposit', 'withdrawal', 'interest_credit', 'fee',
                'transfer_in', 'transfer_out',
                'loan_disbursement', 'loan_repayment', 'contribution',
            ]);
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_after', 15, 2);
            $table->string('reference_number', 50)->nullable();
            $table->date('transaction_date');
            $table->date('value_date');
            $table->string('narration', 255)->nullable();
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->uuid('linked_transaction_id')->nullable();
            $table->enum('approval_status', ['draft', 'pending', 'approved', 'rejected'])->default('approved');
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('linked_transaction_id')
                ->references('id')->on('account_transactions')->nullOnDelete();
            $table->index(['deposit_account_id', 'transaction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_transactions');
    }
};
```

- [ ] **Step 5: Run migrations**

```bash
cd backend && php artisan migrate
```

Expected: 2 new migrations run successfully.

- [ ] **Step 6: Run the test — verify it passes**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_accounts_tables_exist
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/database/migrations/2026_06_11_153000_create_deposit_accounts_table.php \
        backend/database/migrations/2026_06_11_154000_create_account_transactions_table.php \
        backend/tests/Feature/Api/V1/SchemaTest.php
git commit -m "feat(schema): accounts — deposit_accounts, account_transactions"
```

---

## Task 7: Loans migrations

**Files:**
- Create: `backend/database/migrations/2026_06_11_155000_create_loans_table.php`
- Create: `backend/database/migrations/2026_06_11_156000_create_loan_guarantees_table.php`
- Create: `backend/database/migrations/2026_06_11_157000_create_loan_collaterals_table.php`
- Create: `backend/database/migrations/2026_06_11_158000_create_loan_repayments_table.php`
- Create: `backend/database/migrations/2026_06_11_159000_create_loan_notes_table.php`
- Modify: `backend/tests/Feature/Api/V1/SchemaTest.php`

- [ ] **Step 1: Add failing test**

```php
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
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_loans_tables_exist
```

Expected: FAIL.

- [ ] **Step 3: Create `2026_06_11_155000_create_loans_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignUuid('loan_product_id')->constrained('loan_products')->restrictOnDelete();
            $table->string('account_number', 32)->unique();
            $table->foreignUuid('disburse_account_id')->nullable()->constrained('deposit_accounts')->nullOnDelete();
            $table->decimal('principal_amount', 15, 2);
            $table->decimal('interest_rate', 6, 4);
            $table->integer('repayment_period');
            $table->enum('repayment_frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'annually'])->default('monthly');
            $table->decimal('repayment_amount', 15, 2);
            $table->decimal('total_payable', 15, 2);
            $table->decimal('outstanding_balance', 15, 2);
            $table->date('disbursed_date')->nullable();
            $table->date('maturity_date')->nullable();
            $table->date('expected_maturity_date')->nullable();
            $table->enum('loan_status', [
                'draft', 'applied', 'approved', 'rejected',
                'disbursed', 'active', 'repaid', 'defaulted',
            ])->default('draft');
            $table->enum('approval_status', ['draft', 'pending', 'approved', 'rejected'])->default('draft');
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignUuid('disbursed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('applied_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['member_id', 'loan_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
```

- [ ] **Step 4: Create `2026_06_11_156000_create_loan_guarantees_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_guarantees', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('loan_id')->constrained('loans')->cascadeOnDelete();
            $table->foreignUuid('member_id')->constrained('members')->cascadeOnDelete();
            $table->decimal('guaranteed_amount', 15, 2);
            $table->boolean('is_accepted')->default(false);
            $table->timestamp('accepted_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->enum('approval_status', ['draft', 'pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_guarantees');
    }
};
```

- [ ] **Step 5: Create `2026_06_11_157000_create_loan_collaterals_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_collaterals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('loan_id')->constrained('loans')->cascadeOnDelete();
            $table->string('collateral_type', 100);
            $table->text('description')->nullable();
            $table->decimal('estimated_value', 15, 2);
            $table->boolean('is_received')->default(false);
            $table->boolean('is_released')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_collaterals');
    }
};
```

- [ ] **Step 6: Create `2026_06_11_158000_create_loan_repayments_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_repayments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('loan_id')->constrained('loans')->cascadeOnDelete();
            $table->foreignUuid('period_id')->nullable()->constrained('periods')->nullOnDelete();
            $table->date('due_date');
            $table->date('paid_date')->nullable();
            $table->decimal('principal_due', 15, 2);
            $table->decimal('principal_paid', 15, 2)->default(0);
            $table->decimal('interest_due', 15, 2);
            $table->decimal('interest_paid', 15, 2)->default(0);
            $table->decimal('penalty_due', 15, 2)->default(0);
            $table->decimal('penalty_paid', 15, 2)->default(0);
            $table->decimal('total_due', 15, 2);
            $table->decimal('total_paid', 15, 2)->default(0);
            $table->decimal('balance', 15, 2);
            $table->enum('repayment_status', ['pending', 'partial', 'paid', 'overdue'])->default('pending');
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['loan_id', 'due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_repayments');
    }
};
```

- [ ] **Step 7: Create `2026_06_11_159000_create_loan_notes_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('loan_id')->constrained('loans')->cascadeOnDelete();
            $table->text('note');
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            // No softDeletes — audit notes are immutable
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_notes');
    }
};
```

- [ ] **Step 8: Run migrations**

```bash
cd backend && php artisan migrate
```

Expected: 5 new migrations run successfully.

- [ ] **Step 9: Run the test — verify it passes**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_loans_tables_exist
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add backend/database/migrations/2026_06_11_155000_create_loans_table.php \
        backend/database/migrations/2026_06_11_156000_create_loan_guarantees_table.php \
        backend/database/migrations/2026_06_11_157000_create_loan_collaterals_table.php \
        backend/database/migrations/2026_06_11_158000_create_loan_repayments_table.php \
        backend/database/migrations/2026_06_11_159000_create_loan_notes_table.php \
        backend/tests/Feature/Api/V1/SchemaTest.php
git commit -m "feat(schema): loans domain — loans, guarantees, collaterals, repayments, notes"
```

---

## Task 8: Contributions and Journals migrations

**Files:**
- Create: `backend/database/migrations/2026_06_11_160000_create_contributions_table.php`
- Create: `backend/database/migrations/2026_06_11_161000_create_journals_table.php`
- Create: `backend/database/migrations/2026_06_11_162000_create_journal_lines_table.php`
- Modify: `backend/tests/Feature/Api/V1/SchemaTest.php`

- [ ] **Step 1: Add failing test**

```php
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
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_contributions_and_journals_tables_exist
```

Expected: FAIL.

- [ ] **Step 3: Create `2026_06_11_160000_create_contributions_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contributions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignUuid('deposit_account_id')->constrained('deposit_accounts')->cascadeOnDelete();
            $table->foreignUuid('period_id')->constrained('periods')->restrictOnDelete();
            $table->decimal('expected_amount', 15, 2);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->date('due_date');
            $table->date('paid_date')->nullable();
            $table->enum('status', ['pending', 'partial', 'paid', 'waived'])->default('pending');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['member_id', 'period_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contributions');
    }
};
```

- [ ] **Step 4: Create `2026_06_11_161000_create_journals_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('fiscal_year_id')->constrained('fiscal_years')->restrictOnDelete();
            $table->foreignUuid('period_id')->constrained('periods')->restrictOnDelete();
            $table->string('reference_number', 50)->nullable();
            $table->date('journal_date');
            $table->string('narration', 255)->nullable();
            $table->boolean('is_posted')->default(false);
            $table->timestamp('posted_at')->nullable();
            $table->foreignUuid('posted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_reversed')->default(false);
            $table->timestamp('reversed_at')->nullable();
            $table->foreignUuid('reversed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journals');
    }
};
```

- [ ] **Step 5: Create `2026_06_11_162000_create_journal_lines_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journal_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('journal_id')->constrained('journals')->cascadeOnDelete();
            $table->foreignUuid('account_id')->constrained('chart_of_accounts')->restrictOnDelete();
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->string('narration', 255)->nullable();
            $table->timestamps();
            // No softDeletes — ledger entries are immutable
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_lines');
    }
};
```

- [ ] **Step 6: Run migrations**

```bash
cd backend && php artisan migrate
```

Expected: 3 new migrations run successfully.

- [ ] **Step 7: Run the test — verify it passes**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_contributions_and_journals_tables_exist
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/database/migrations/2026_06_11_160000_create_contributions_table.php \
        backend/database/migrations/2026_06_11_161000_create_journals_table.php \
        backend/database/migrations/2026_06_11_162000_create_journal_lines_table.php \
        backend/tests/Feature/Api/V1/SchemaTest.php
git commit -m "feat(schema): contributions, journals, journal_lines"
```

---

## Task 9: Petty Cash migrations

**Files:**
- Create: `backend/database/migrations/2026_06_11_163000_create_petty_cash_categories_table.php`
- Create: `backend/database/migrations/2026_06_11_164000_create_petty_cash_items_table.php`
- Create: `backend/database/migrations/2026_06_11_165000_create_petty_cash_allocations_table.php`
- Create: `backend/database/migrations/2026_06_11_166000_create_petty_cash_requests_table.php`
- Modify: `backend/tests/Feature/Api/V1/SchemaTest.php`

- [ ] **Step 1: Add failing test**

```php
public function test_petty_cash_tables_exist(): void
{
    $this->assertTrue(Schema::hasTable('petty_cash_categories'));
    $this->assertTrue(Schema::hasTable('petty_cash_items'));
    $this->assertTrue(Schema::hasColumn('petty_cash_items', 'default_price'));

    $this->assertTrue(Schema::hasTable('petty_cash_allocations'));
    $this->assertTrue(Schema::hasColumn('petty_cash_allocations', 'spent'));
    $this->assertTrue(Schema::hasColumn('petty_cash_allocations', 'approval_status'));

    $this->assertTrue(Schema::hasTable('petty_cash_requests'));
    $this->assertTrue(Schema::hasColumn('petty_cash_requests', 'unit_price'));
    $this->assertTrue(Schema::hasColumn('petty_cash_requests', 'receipt_number'));
}
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_petty_cash_tables_exist
```

Expected: FAIL.

- [ ] **Step 3: Create `2026_06_11_163000_create_petty_cash_categories_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('petty_cash_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->string('name', 100);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('petty_cash_categories');
    }
};
```

- [ ] **Step 4: Create `2026_06_11_164000_create_petty_cash_items_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('petty_cash_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('category_id')->constrained('petty_cash_categories')->cascadeOnDelete();
            $table->string('name', 100);
            $table->decimal('default_price', 15, 2)->default(0);
            $table->integer('default_units')->default(1);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('petty_cash_items');
    }
};
```

- [ ] **Step 5: Create `2026_06_11_165000_create_petty_cash_allocations_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('petty_cash_allocations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('period_id')->constrained('periods')->restrictOnDelete();
            $table->foreignUuid('allocated_to')->constrained('users')->restrictOnDelete();
            $table->decimal('amount', 15, 2);
            $table->decimal('spent', 15, 2)->default(0);
            $table->decimal('balance', 15, 2);
            $table->string('narration', 255)->nullable();
            $table->enum('approval_status', ['draft', 'pending', 'approved', 'rejected'])->default('draft');
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('petty_cash_allocations');
    }
};
```

- [ ] **Step 6: Create `2026_06_11_166000_create_petty_cash_requests_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('petty_cash_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('allocation_id')->nullable()->constrained('petty_cash_allocations')->nullOnDelete();
            $table->foreignUuid('item_id')->nullable()->constrained('petty_cash_items')->nullOnDelete();
            $table->foreignUuid('requested_by')->constrained('users')->restrictOnDelete();
            $table->integer('units')->default(1);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('amount', 15, 2);
            $table->string('receipt_number', 50)->nullable();
            $table->date('expense_date');
            $table->string('narration', 255)->nullable();
            $table->enum('approval_status', ['draft', 'pending', 'approved', 'rejected'])->default('draft');
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('petty_cash_requests');
    }
};
```

- [ ] **Step 7: Run migrations**

```bash
cd backend && php artisan migrate
```

Expected: 4 new migrations run successfully.

- [ ] **Step 8: Run the test — verify it passes**

```bash
cd backend && php artisan test tests/Feature/Api/V1/SchemaTest.php --filter=test_petty_cash_tables_exist
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/database/migrations/2026_06_11_163000_create_petty_cash_categories_table.php \
        backend/database/migrations/2026_06_11_164000_create_petty_cash_items_table.php \
        backend/database/migrations/2026_06_11_165000_create_petty_cash_allocations_table.php \
        backend/database/migrations/2026_06_11_166000_create_petty_cash_requests_table.php \
        backend/tests/Feature/Api/V1/SchemaTest.php
git commit -m "feat(schema): petty cash — categories, items, allocations, requests"
```

---

## Task 10: Eloquent Models

**Files:** Create all files listed in the File Map under Models.

- [ ] **Step 1: Create `app/Models/Org.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Org extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'name', 'full_name', 'suffix', 'email', 'phone', 'website',
        'logo_path', 'address', 'town', 'country_code', 'currency_code',
        'pin', 'reg_number', 'member_limit', 'is_active', 'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'member_limit' => 'integer',
        ];
    }

    public function members(): HasMany
    {
        return $this->hasMany(Member::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function fiscalYears(): HasMany
    {
        return $this->hasMany(FiscalYear::class);
    }

    public function periods(): HasMany
    {
        return $this->hasMany(Period::class);
    }
}
```

- [ ] **Step 2: Update `app/Models/User.php`** — add org relationship

Replace the entire file with:

```php
<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'org_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }
}
```

- [ ] **Step 3: Create `app/Models/ApprovalLog.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ApprovalLog extends Model
{
    use HasUuids;

    protected $fillable = [
        'org_id', 'approvable_type', 'approvable_id',
        'action', 'from_status', 'to_status', 'performed_by', 'notes',
    ];

    public function approvable(): MorphTo
    {
        return $this->morphTo();
    }

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }
}
```

- [ ] **Step 4: Create `app/Models/Currency.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Currency extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = ['org_id', 'code', 'name', 'symbol', 'is_default'];

    protected function casts(): array
    {
        return ['is_default' => 'boolean'];
    }
}
```

- [ ] **Step 5: Create `app/Models/FiscalYear.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FiscalYear extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'name', 'start_date', 'end_date',
        'is_opened', 'is_closed', 'closed_at', 'closed_by',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'closed_at' => 'datetime',
            'is_opened' => 'boolean',
            'is_closed' => 'boolean',
        ];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function periods(): HasMany
    {
        return $this->hasMany(Period::class);
    }
}
```

- [ ] **Step 6: Create `app/Models/Period.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Period extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'fiscal_year_id', 'name', 'start_date', 'end_date',
        'is_opened', 'is_closed', 'is_posted',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'is_opened' => 'boolean',
            'is_closed' => 'boolean',
            'is_posted' => 'boolean',
        ];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }
}
```

- [ ] **Step 7: Create `app/Models/AccountType.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccountType extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = ['org_id', 'code', 'name'];

    protected function casts(): array
    {
        return ['code' => 'integer'];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(ChartOfAccount::class);
    }
}
```

- [ ] **Step 8: Create `app/Models/ChartOfAccount.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChartOfAccount extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'account_type_id', 'parent_id',
        'code', 'name', 'is_header', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_header' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function accountType(): BelongsTo
    {
        return $this->belongsTo(AccountType::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(ChartOfAccount::class, 'parent_id');
    }
}
```

- [ ] **Step 9: Create `app/Models/Member.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Member extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'user_id', 'member_number', 'title', 'full_name',
        'id_number', 'id_type', 'email', 'phone', 'phone2',
        'date_of_birth', 'gender', 'nationality', 'marital_status',
        'address', 'town', 'postal_code', 'photo_path',
        'employed', 'self_employed', 'employer_name',
        'monthly_salary', 'monthly_net_income', 'entry_date', 'is_active',
        'approval_status', 'approved_by', 'approved_at',
        'terminated_at', 'termination_reason',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'entry_date' => 'date',
            'approved_at' => 'datetime',
            'terminated_at' => 'datetime',
            'employed' => 'boolean',
            'self_employed' => 'boolean',
            'is_active' => 'boolean',
            'monthly_salary' => 'decimal:2',
            'monthly_net_income' => 'decimal:2',
        ];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function kins(): HasMany
    {
        return $this->hasMany(MemberKin::class);
    }

    public function depositAccounts(): HasMany
    {
        return $this->hasMany(DepositAccount::class);
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(Contribution::class);
    }
}
```

- [ ] **Step 10: Create `app/Models/MemberKin.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MemberKin extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'member_id', 'full_name', 'relationship',
        'date_of_birth', 'id_number', 'id_type', 'phone',
        'is_emergency_contact', 'is_beneficiary', 'beneficiary_percent',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'is_emergency_contact' => 'boolean',
            'is_beneficiary' => 'boolean',
            'beneficiary_percent' => 'decimal:2',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}
```

- [ ] **Step 11: Create `app/Models/SaccoOfficial.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SaccoOfficial extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'member_id', 'position',
        'start_date', 'end_date', 'is_active', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}
```

- [ ] **Step 12: Create `app/Models/SavingProduct.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SavingProduct extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'name', 'description', 'interest_rate',
        'min_opening_balance', 'min_balance', 'max_balance',
        'min_deposit', 'max_deposit', 'min_withdrawal', 'max_withdrawal',
        'lock_in_months', 'withdrawal_frequency', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'interest_rate' => 'decimal:4',
            'min_opening_balance' => 'decimal:2',
            'min_balance' => 'decimal:2',
            'max_balance' => 'decimal:2',
            'min_deposit' => 'decimal:2',
            'max_deposit' => 'decimal:2',
            'min_withdrawal' => 'decimal:2',
            'max_withdrawal' => 'decimal:2',
            'lock_in_months' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function depositAccounts(): HasMany
    {
        return $this->hasMany(DepositAccount::class, 'product_id');
    }
}
```

- [ ] **Step 13: Create `app/Models/LoanProduct.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class LoanProduct extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'name', 'description', 'interest_rate', 'interest_method',
        'repayment_frequency', 'min_amount', 'max_amount',
        'min_period_months', 'max_period_months', 'max_repayments',
        'requires_guarantor', 'requires_collateral', 'min_membership_months',
        'processing_fee_amount', 'processing_fee_percent', 'penalty_rate', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'interest_rate' => 'decimal:4',
            'min_amount' => 'decimal:2',
            'max_amount' => 'decimal:2',
            'processing_fee_amount' => 'decimal:2',
            'processing_fee_percent' => 'decimal:2',
            'penalty_rate' => 'decimal:4',
            'requires_guarantor' => 'boolean',
            'requires_collateral' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }
}
```

- [ ] **Step 14: Create `app/Models/DepositAccount.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DepositAccount extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'member_id', 'product_id', 'account_number',
        'balance', 'interest_rate', 'opening_date', 'last_activity_date',
        'is_active', 'is_locked', 'locked_until_date',
        'approval_status', 'approved_by', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
            'interest_rate' => 'decimal:4',
            'opening_date' => 'date',
            'last_activity_date' => 'date',
            'locked_until_date' => 'date',
            'approved_at' => 'datetime',
            'is_active' => 'boolean',
            'is_locked' => 'boolean',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(SavingProduct::class, 'product_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(AccountTransaction::class);
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(Contribution::class);
    }
}
```

- [ ] **Step 15: Create `app/Models/AccountTransaction.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccountTransaction extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'deposit_account_id', 'period_id', 'transaction_type',
        'amount', 'balance_after', 'reference_number',
        'transaction_date', 'value_date', 'narration', 'created_by',
        'linked_transaction_id', 'approval_status', 'approved_by', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'balance_after' => 'decimal:2',
            'transaction_date' => 'date',
            'value_date' => 'date',
            'approved_at' => 'datetime',
        ];
    }

    public function depositAccount(): BelongsTo
    {
        return $this->belongsTo(DepositAccount::class);
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class);
    }

    public function linkedTransaction(): BelongsTo
    {
        return $this->belongsTo(AccountTransaction::class, 'linked_transaction_id');
    }
}
```

- [ ] **Step 16: Create `app/Models/Loan.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Loan extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'member_id', 'loan_product_id', 'account_number',
        'disburse_account_id', 'principal_amount', 'interest_rate',
        'repayment_period', 'repayment_frequency', 'repayment_amount',
        'total_payable', 'outstanding_balance',
        'disbursed_date', 'maturity_date', 'expected_maturity_date',
        'loan_status', 'approval_status',
        'approved_by', 'approved_at', 'disbursed_by', 'applied_at',
    ];

    protected function casts(): array
    {
        return [
            'principal_amount' => 'decimal:2',
            'interest_rate' => 'decimal:4',
            'repayment_amount' => 'decimal:2',
            'total_payable' => 'decimal:2',
            'outstanding_balance' => 'decimal:2',
            'disbursed_date' => 'date',
            'maturity_date' => 'date',
            'expected_maturity_date' => 'date',
            'approved_at' => 'datetime',
            'applied_at' => 'datetime',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function loanProduct(): BelongsTo
    {
        return $this->belongsTo(LoanProduct::class);
    }

    public function disburseAccount(): BelongsTo
    {
        return $this->belongsTo(DepositAccount::class, 'disburse_account_id');
    }

    public function repayments(): HasMany
    {
        return $this->hasMany(LoanRepayment::class);
    }

    public function guarantees(): HasMany
    {
        return $this->hasMany(LoanGuarantee::class);
    }

    public function collaterals(): HasMany
    {
        return $this->hasMany(LoanCollateral::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(LoanNote::class);
    }
}
```

- [ ] **Step 17: Create `app/Models/LoanGuarantee.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LoanGuarantee extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'loan_id', 'member_id', 'guaranteed_amount',
        'is_accepted', 'accepted_at', 'is_active', 'approval_status',
    ];

    protected function casts(): array
    {
        return [
            'guaranteed_amount' => 'decimal:2',
            'is_accepted' => 'boolean',
            'is_active' => 'boolean',
            'accepted_at' => 'datetime',
        ];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}
```

- [ ] **Step 18: Create `app/Models/LoanCollateral.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LoanCollateral extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'loan_id', 'collateral_type', 'description',
        'estimated_value', 'is_received', 'is_released',
    ];

    protected function casts(): array
    {
        return [
            'estimated_value' => 'decimal:2',
            'is_received' => 'boolean',
            'is_released' => 'boolean',
        ];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }
}
```

- [ ] **Step 19: Create `app/Models/LoanRepayment.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LoanRepayment extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'loan_id', 'period_id', 'due_date', 'paid_date',
        'principal_due', 'principal_paid', 'interest_due', 'interest_paid',
        'penalty_due', 'penalty_paid', 'total_due', 'total_paid', 'balance',
        'repayment_status', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'paid_date' => 'date',
            'principal_due' => 'decimal:2',
            'principal_paid' => 'decimal:2',
            'interest_due' => 'decimal:2',
            'interest_paid' => 'decimal:2',
            'penalty_due' => 'decimal:2',
            'penalty_paid' => 'decimal:2',
            'total_due' => 'decimal:2',
            'total_paid' => 'decimal:2',
            'balance' => 'decimal:2',
        ];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class);
    }
}
```

- [ ] **Step 20: Create `app/Models/LoanNote.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanNote extends Model
{
    use HasUuids;

    protected $fillable = ['org_id', 'loan_id', 'note', 'created_by'];

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }
}
```

- [ ] **Step 21: Create `app/Models/Contribution.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contribution extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'member_id', 'deposit_account_id', 'period_id',
        'expected_amount', 'paid_amount', 'due_date', 'paid_date', 'status',
    ];

    protected function casts(): array
    {
        return [
            'expected_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'due_date' => 'date',
            'paid_date' => 'date',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function depositAccount(): BelongsTo
    {
        return $this->belongsTo(DepositAccount::class);
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class);
    }
}
```

- [ ] **Step 22: Create `app/Models/Journal.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Journal extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'fiscal_year_id', 'period_id', 'reference_number',
        'journal_date', 'narration',
        'is_posted', 'posted_at', 'posted_by',
        'is_reversed', 'reversed_at', 'reversed_by', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'journal_date' => 'date',
            'posted_at' => 'datetime',
            'reversed_at' => 'datetime',
            'is_posted' => 'boolean',
            'is_reversed' => 'boolean',
        ];
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(JournalLine::class);
    }
}
```

- [ ] **Step 23: Create `app/Models/JournalLine.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalLine extends Model
{
    use HasUuids;

    protected $fillable = [
        'org_id', 'journal_id', 'account_id', 'debit', 'credit', 'narration',
    ];

    protected function casts(): array
    {
        return [
            'debit' => 'decimal:2',
            'credit' => 'decimal:2',
        ];
    }

    public function journal(): BelongsTo
    {
        return $this->belongsTo(Journal::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'account_id');
    }
}
```

- [ ] **Step 24: Create `app/Models/PettyCashCategory.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PettyCashCategory extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = ['org_id', 'name'];

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PettyCashItem::class, 'category_id');
    }
}
```

- [ ] **Step 25: Create `app/Models/PettyCashItem.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PettyCashItem extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = ['org_id', 'category_id', 'name', 'default_price', 'default_units'];

    protected function casts(): array
    {
        return [
            'default_price' => 'decimal:2',
            'default_units' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(PettyCashCategory::class, 'category_id');
    }
}
```

- [ ] **Step 26: Create `app/Models/PettyCashAllocation.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PettyCashAllocation extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'period_id', 'allocated_to', 'amount', 'spent', 'balance',
        'narration', 'approval_status', 'approved_by', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'spent' => 'decimal:2',
            'balance' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class);
    }

    public function allocatedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'allocated_to');
    }

    public function requests(): HasMany
    {
        return $this->hasMany(PettyCashRequest::class, 'allocation_id');
    }
}
```

- [ ] **Step 27: Create `app/Models/PettyCashRequest.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PettyCashRequest extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'allocation_id', 'item_id', 'requested_by',
        'units', 'unit_price', 'amount', 'receipt_number',
        'expense_date', 'narration', 'approval_status', 'approved_by', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'amount' => 'decimal:2',
            'expense_date' => 'date',
            'approved_at' => 'datetime',
            'units' => 'integer',
        ];
    }

    public function allocation(): BelongsTo
    {
        return $this->belongsTo(PettyCashAllocation::class, 'allocation_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(PettyCashItem::class, 'item_id');
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
```

- [ ] **Step 28: Run the full test suite to verify no regressions**

```bash
cd backend && php artisan test
```

Expected: All existing tests still pass (9 auth tests + schema tests).

- [ ] **Step 29: Commit all models**

```bash
git add backend/app/Models/
git commit -m "feat(schema): Eloquent models for all 26 domain tables"
```

---

## Task 11: Default seeders

**Files:**
- Modify: `backend/database/seeders/DatabaseSeeder.php`

- [ ] **Step 1: Update `DatabaseSeeder.php`** to seed a default org and KES currency

```php
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
            'name' => 'SLAMS SACCO',
            'full_name' => 'SLAMS Savings and Credit Cooperative Society',
            'suffix' => 'SACCO',
            'email' => 'info@slamssacco.co.ke',
            'country_code' => 'KEN',
            'currency_code' => 'KES',
            'is_active' => true,
            'is_default' => true,
        ]);

        Currency::create([
            'org_id' => $org->id,
            'code' => 'KES',
            'name' => 'Kenyan Shilling',
            'symbol' => 'KSh',
            'is_default' => true,
        ]);

        // Demo logins (password: "password")
        User::factory()->create([
            'name' => 'SACCO Admin',
            'email' => 'admin@slamssacco.co.ke',
            'role' => 'admin',
            'org_id' => $org->id,
        ]);

        User::factory()->create([
            'name' => 'Demo Member',
            'email' => 'member@slamssacco.co.ke',
            'role' => 'member',
            'org_id' => $org->id,
        ]);
    }
}
```

- [ ] **Step 2: Run the seeder against a fresh database**

```bash
cd backend && php artisan migrate:fresh --seed
```

Expected: All 27 new migrations run, seeder creates 1 org + 1 currency + 2 users with no errors.

- [ ] **Step 3: Run the full test suite**

```bash
cd backend && php artisan test
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add backend/database/seeders/DatabaseSeeder.php
git commit -m "feat(schema): seed default org (SLAMS SACCO) and KES currency"
```

---

## Task 12: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Mark Phase 1 as complete in CLAUDE.md**

In the Task Breakdown & Progress section, replace:
```
- [ ] Phase 1: Database schema & migrations (UUID PKs, soft deletes, org scoping)
```
with:
```
- [x] Phase 1: Database schema & migrations — 27 migrations, 26 models, UUID PKs,
      soft deletes, org scoping, approval_logs audit table (2026-06-11)
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: mark Phase 1 database schema complete"
```
