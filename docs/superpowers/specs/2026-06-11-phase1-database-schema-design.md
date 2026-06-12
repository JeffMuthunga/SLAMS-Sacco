# Phase 1: Database Schema Design

**Date:** 2026-06-11
**Status:** Approved
**Scope:** Full schema — all domain tables created upfront; features built on top per phase.

## Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Schema scope | Full schema now | Design all relationships in one pass; avoid FK retrofits later |
| PKs | UUID on all tables | Consistent with project conventions |
| Soft deletes | All tables except audit/immutable | `deleted_at` via Laravel SoftDeletes |
| Org scoping | `org_id FK → orgs` on every tenant-owned table | Multi-tenancy: one SACCO = one org |
| Monetary values | `decimal(15,2)` | Never floats; matches CLAUDE.md convention |
| Member ↔ User | 1-to-1 optional (`members.user_id` nullable) | Staff can pre-register members before login access |
| Approval workflow | `approval_status` enum + `approved_by/at` per row + shared `approval_logs` | Simple, auditable; no generic workflow engine |
| Migration style | One migration per table, FK dependency order | Laravel standard; maximum rollback granularity |

## Approval Pattern

Every approvable entity carries:
- `approval_status enum(draft, pending, approved, rejected) default 'draft'`
- `approved_by uuid nullable FK → users`
- `approved_at timestamp nullable`

All approval actions are also written to `approval_logs` (polymorphic) for full audit trail.

## Migration Order (27 files)

| # | Migration | Domain |
|---|-----------|--------|
| 1 | `create_orgs_table` | Foundation |
| 2 | `add_org_id_to_users_table` | Foundation |
| 3 | `create_approval_logs_table` | Foundation |
| 4 | `create_currencies_table` | Finance |
| 5 | `create_fiscal_years_table` | Finance |
| 6 | `create_periods_table` | Finance |
| 7 | `create_account_types_table` | Chart of Accounts |
| 8 | `create_chart_of_accounts_table` | Chart of Accounts |
| 9 | `create_members_table` | Members |
| 10 | `create_member_kins_table` | Members |
| 11 | `create_sacco_officials_table` | Members |
| 12 | `create_saving_products_table` | Products |
| 13 | `create_loan_products_table` | Products |
| 14 | `create_deposit_accounts_table` | Accounts |
| 15 | `create_account_transactions_table` | Accounts |
| 16 | `create_loans_table` | Loans |
| 17 | `create_loan_guarantees_table` | Loans |
| 18 | `create_loan_collaterals_table` | Loans |
| 19 | `create_loan_repayments_table` | Loans |
| 20 | `create_loan_notes_table` | Loans |
| 21 | `create_contributions_table` | Contributions |
| 22 | `create_journals_table` | Journals |
| 23 | `create_journal_lines_table` | Journals |
| 24 | `create_petty_cash_categories_table` | Petty Cash |
| 25 | `create_petty_cash_items_table` | Petty Cash |
| 26 | `create_petty_cash_allocations_table` | Petty Cash |
| 27 | `create_petty_cash_requests_table` | Petty Cash |

## Table Schemas

### Foundation

**orgs**
- id uuid PK
- name varchar(100), full_name varchar(200)?, suffix varchar(10)?
- email varchar(120)?, phone varchar(20)?, website varchar(120)?
- logo_path varchar(255)?, address text?, town varchar(100)?
- country_code char(3) default 'KEN', currency_code char(3) default 'KES'
- pin varchar(50)?, reg_number varchar(50)?, member_limit int?
- is_active bool default true, is_default bool default false
- timestamps, softDeletes

**users (alter)** — add org_id uuid nullable FK → orgs

**approval_logs** — immutable audit trail, no soft deletes
- id uuid PK, org_id FK → orgs
- approvable_type varchar(50), approvable_id uuid (polymorphic)
- action enum(submitted, approved, rejected, flagged)
- from_status varchar(20), to_status varchar(20)
- performed_by FK → users, notes text?
- timestamps

### Finance Foundation

**currencies**
- id uuid PK, org_id uuid? FK → orgs (null = system-wide)
- code char(3) unique, name varchar(50), symbol varchar(5)
- is_default bool default false
- timestamps, softDeletes

**fiscal_years**
- id uuid PK, org_id FK → orgs
- name varchar(20) e.g. "2026/2027", start_date date, end_date date
- is_opened bool default false, is_closed bool default false
- closed_at timestamp?, closed_by uuid? FK → users
- timestamps, softDeletes

**periods**
- id uuid PK, org_id FK → orgs, fiscal_year_id FK → fiscal_years
- name varchar(30) e.g. "June 2026", start_date date, end_date date
- is_opened bool default false, is_closed bool default false, is_posted bool default false
- timestamps, softDeletes

### Chart of Accounts

**account_types**
- id uuid PK, org_id FK → orgs
- code tinyint (1=Assets 2=Liabilities 3=Income 4=Expenses 5=Equity)
- name varchar(100)
- timestamps, softDeletes

**chart_of_accounts**
- id uuid PK, org_id FK → orgs, account_type_id FK → account_types
- parent_id uuid? FK → chart_of_accounts (hierarchy)
- code varchar(20), name varchar(150)
- is_header bool default false, is_active bool default true
- timestamps, softDeletes

### Members

**members**
- id uuid PK, org_id FK → orgs, user_id uuid? FK → users
- member_number varchar(20) (unique per org)
- title varchar(10)?, full_name varchar(150)
- id_number varchar(50), id_type enum(national,passport,alien,military) default 'national'
- email varchar(120)?, phone varchar(20), phone2 varchar(20)?
- date_of_birth date, gender char(1)?, nationality char(3) default 'KEN'
- marital_status enum(single,married,divorced,widowed)?
- address text?, town varchar(100)?, postal_code varchar(20)?
- photo_path varchar(255)?
- employed bool default false, self_employed bool default false
- employer_name varchar(120)?, monthly_salary decimal(15,2)?, monthly_net_income decimal(15,2)?
- entry_date date, is_active bool default true
- approval_status enum(draft,pending,approved,rejected) default 'draft'
- approved_by uuid? FK → users, approved_at timestamp?
- terminated_at timestamp?, termination_reason text?
- timestamps, softDeletes

**member_kins**
- id uuid PK, org_id FK → orgs, member_id FK → members
- full_name varchar(150), relationship enum(spouse,child,parent,sibling,other)
- date_of_birth date?, id_number varchar(50)?, id_type varchar(20)?, phone varchar(20)?
- is_emergency_contact bool default false
- is_beneficiary bool default false, beneficiary_percent decimal(5,2)?
- timestamps, softDeletes

**sacco_officials**
- id uuid PK, org_id FK → orgs, member_id FK → members
- position varchar(150), start_date date, end_date date?, is_active bool default true
- notes text?
- timestamps, softDeletes

### Products

**saving_products**
- id uuid PK, org_id FK → orgs
- name varchar(120), description text?
- interest_rate decimal(6,4) default 0
- min_opening_balance decimal(15,2) default 0
- min_balance decimal(15,2) default 0, max_balance decimal(15,2)?
- min_deposit decimal(15,2) default 0, max_deposit decimal(15,2)?
- min_withdrawal decimal(15,2) default 0, max_withdrawal decimal(15,2)?
- lock_in_months int default 0
- withdrawal_frequency enum(any,daily,weekly,monthly) default 'any'
- is_active bool default true
- timestamps, softDeletes

**loan_products**
- id uuid PK, org_id FK → orgs
- name varchar(120), description text?
- interest_rate decimal(6,4), interest_method enum(flat,reducing_balance) default 'reducing_balance'
- repayment_frequency enum(daily,weekly,monthly,quarterly,annually) default 'monthly'
- min_amount decimal(15,2), max_amount decimal(15,2)
- min_period_months int, max_period_months int, max_repayments int?
- requires_guarantor bool default true, requires_collateral bool default false
- min_membership_months int default 0
- processing_fee_amount decimal(15,2) default 0, processing_fee_percent decimal(5,2) default 0
- penalty_rate decimal(6,4) default 0
- is_active bool default true
- timestamps, softDeletes

### Accounts

**deposit_accounts**
- id uuid PK, org_id FK → orgs, member_id FK → members, product_id FK → saving_products
- account_number varchar(32) unique
- balance decimal(15,2) default 0, interest_rate decimal(6,4)
- opening_date date, last_activity_date date?
- is_active bool default true, is_locked bool default false, locked_until_date date?
- approval_status enum(draft,pending,approved,rejected) default 'draft'
- approved_by uuid? FK → users, approved_at timestamp?
- timestamps, softDeletes

**account_transactions**
- id uuid PK, org_id FK → orgs
- deposit_account_id FK → deposit_accounts, period_id uuid? FK → periods
- transaction_type enum(deposit,withdrawal,interest_credit,fee,transfer_in,transfer_out,loan_disbursement,loan_repayment,contribution)
- amount decimal(15,2), balance_after decimal(15,2)
- reference_number varchar(50)?, transaction_date date, value_date date, narration varchar(255)?
- created_by FK → users
- linked_transaction_id uuid? FK → account_transactions (paired transfer legs)
- approval_status enum(draft,pending,approved,rejected) default 'approved'
- approved_by uuid? FK → users, approved_at timestamp?
- timestamps, softDeletes

### Loans

**loans**
- id uuid PK, org_id FK → orgs, member_id FK → members, loan_product_id FK → loan_products
- account_number varchar(32) unique, disburse_account_id uuid? FK → deposit_accounts
- principal_amount decimal(15,2), interest_rate decimal(6,4)
- repayment_period int (months), repayment_frequency enum(daily,weekly,monthly,quarterly,annually)
- repayment_amount decimal(15,2), total_payable decimal(15,2), outstanding_balance decimal(15,2)
- disbursed_date date?, maturity_date date?, expected_maturity_date date?
- loan_status enum(draft,applied,approved,rejected,disbursed,active,repaid,defaulted) default 'draft'
- approval_status enum(draft,pending,approved,rejected) default 'draft'
- approved_by uuid? FK → users, approved_at timestamp?
- disbursed_by uuid? FK → users, applied_at timestamp?
- timestamps, softDeletes

**loan_guarantees**
- id uuid PK, org_id FK → orgs, loan_id FK → loans, member_id FK → members
- guaranteed_amount decimal(15,2), is_accepted bool default false, accepted_at timestamp?
- is_active bool default true
- approval_status enum(draft,pending,approved,rejected) default 'pending'
- timestamps, softDeletes

**loan_collaterals**
- id uuid PK, org_id FK → orgs, loan_id FK → loans
- collateral_type varchar(100), description text?, estimated_value decimal(15,2)
- is_received bool default false, is_released bool default false
- timestamps, softDeletes

**loan_repayments**
- id uuid PK, org_id FK → orgs, loan_id FK → loans, period_id uuid? FK → periods
- due_date date, paid_date date?
- principal_due decimal(15,2), principal_paid decimal(15,2) default 0
- interest_due decimal(15,2), interest_paid decimal(15,2) default 0
- penalty_due decimal(15,2) default 0, penalty_paid decimal(15,2) default 0
- total_due decimal(15,2), total_paid decimal(15,2) default 0, balance decimal(15,2)
- repayment_status enum(pending,partial,paid,overdue) default 'pending'
- created_by FK → users
- timestamps, softDeletes

**loan_notes** — no soft deletes (audit notes)
- id uuid PK, org_id FK → orgs, loan_id FK → loans
- note text, created_by FK → users
- timestamps

### Contributions

**contributions**
- id uuid PK, org_id FK → orgs, member_id FK → members
- deposit_account_id FK → deposit_accounts, period_id FK → periods
- expected_amount decimal(15,2), paid_amount decimal(15,2) default 0
- due_date date, paid_date date?
- status enum(pending,partial,paid,waived) default 'pending'
- timestamps, softDeletes

### Journals

**journals**
- id uuid PK, org_id FK → orgs, fiscal_year_id FK → fiscal_years, period_id FK → periods
- reference_number varchar(50)?, journal_date date, narration varchar(255)?
- is_posted bool default false, posted_at timestamp?, posted_by uuid? FK → users
- is_reversed bool default false, reversed_at timestamp?, reversed_by uuid? FK → users
- created_by FK → users
- timestamps, softDeletes

**journal_lines** — no soft deletes (ledger entries are immutable)
- id uuid PK, org_id FK → orgs, journal_id FK → journals, account_id FK → chart_of_accounts
- debit decimal(15,2) default 0, credit decimal(15,2) default 0
- narration varchar(255)?
- timestamps

### Petty Cash

**petty_cash_categories**
- id uuid PK, org_id FK → orgs, name varchar(100)
- timestamps, softDeletes

**petty_cash_items**
- id uuid PK, org_id FK → orgs, category_id FK → petty_cash_categories
- name varchar(100), default_price decimal(15,2) default 0, default_units int default 1
- timestamps, softDeletes

**petty_cash_allocations**
- id uuid PK, org_id FK → orgs, period_id FK → periods, allocated_to FK → users
- amount decimal(15,2), spent decimal(15,2) default 0, balance decimal(15,2)
- narration varchar(255)?
- approval_status enum(draft,pending,approved,rejected) default 'draft'
- approved_by uuid? FK → users, approved_at timestamp?
- timestamps, softDeletes

**petty_cash_requests**
- id uuid PK, org_id FK → orgs
- allocation_id uuid? FK → petty_cash_allocations, item_id uuid? FK → petty_cash_items
- requested_by FK → users
- units int default 1, unit_price decimal(15,2), amount decimal(15,2)
- receipt_number varchar(50)?, expense_date date, narration varchar(255)?
- approval_status enum(draft,pending,approved,rejected) default 'draft'
- approved_by uuid? FK → users, approved_at timestamp?
- timestamps, softDeletes

## Omitted (intentional)

- Full workflow engine (`workflows`, `workflow_phases`) — replaced by approval_status enum
- Communications/SMS — Phase 14
- Investments, tenders, commodities, stocks — not core SACCO
- System config lookups (`sys_countrys`, `sys_languages`) — seeded as static data
