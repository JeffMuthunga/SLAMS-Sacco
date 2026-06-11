# finance-accounting — legacy `sacco` DB reference

Functional reference only; new schema follows project conventions.
Format: table (~rows): column type [PK] [->fk_table] [? = nullable]

**bank_accounts** (~0 rows): bank_account_id int PK, org_id int ->orgs ?, bank_branch_id int ->bank_branch ?, account_id int ->accounts ?, currency_id int ->currency ?, bank_account_name vc(120) ?, bank_account_number vc(50) ?, narrative vc(240) ?, is_default bool, is_active bool, details text ?

**bank_branch** (~0 rows): bank_branch_id int PK, bank_id int ->banks ?, org_id int ->orgs ?, bank_branch_name vc(50), bank_branch_code vc(50) ?, narrative vc(240) ?

**banks** (~0 rows): bank_id int PK, sys_country_id ch ->sys_countrys ?, org_id int ->orgs ?, bank_name vc(50), bank_code vc(25) ?, swift_code vc(25) ?, sort_code vc(25) ?, narrative vc(240) ?

**budget_lines** (~0 rows): budget_line_id int PK, budget_id int ->budgets ?, period_id int ->periods ?, account_id int ->accounts ?, item_id int ->items ?, transaction_id int ->transactions ?, org_id int ->orgs ?, spend_type int, quantity int, amount real, tax_amount real, income_budget bool, narrative vc(240) ?, details text ?

**budgets** (~0 rows): budget_id int PK, fiscal_year_id int ->fiscal_years ?, department_id int ->departments ?, link_budget_id int ->budgets ?, entity_id int ->entitys ?, org_id int ->orgs ?, budget_type int, budget_name vc(50) ?, application_date ts ?, approve_status vc(16), workflow_table_id int ?, action_date ts ?, details text ?

**currency** (~0 rows): currency_id int PK, currency_name vc(50) ?, currency_symbol vc(3) ?, org_id int ->orgs ?

**currency_rates** (~0 rows): currency_rate_id int PK, currency_id int ->currency ?, org_id int ->orgs ?, exchange_date date, exchange_rate real

**default_accounts** (~0 rows): default_account_id int PK, account_id int ->accounts ?, use_key_id int ->use_keys, org_id int ->orgs ?, narrative vc(240) ?

**default_tax_types** (~0 rows): default_tax_type_id int PK, entity_id int ->entitys ?, tax_type_id int ->tax_types ?, org_id int ->orgs ?, tax_identification vc(50) ?, narrative vc(240) ?, additional float8, active bool ?

**fiscal_years** (~0 rows): fiscal_year_id int PK, fiscal_year vc(9), org_id int ->orgs ?, fiscal_year_start date, fiscal_year_end date, submission_date date ?, year_opened bool, year_closed bool, details text ?

**period_tax_rates** (~0 rows): period_tax_rate_id int PK, period_tax_type_id int ->period_tax_types ?, tax_rate_id int ->tax_rates ?, org_id int ->orgs ?, tax_range float8, tax_rate float8, employer_rate int, rate_relief real, narrative vc(240) ?

**period_tax_types** (~0 rows): period_tax_type_id int PK, period_id int ->periods ?, tax_type_id int ->tax_types ?, account_id int ->accounts ?, org_id int ->orgs ?, period_tax_type_name vc(50), pay_date date, formural vc(320) ?, tax_relief real, employer_relief real, tax_type_order int, in_tax bool, tax_rate real, tax_inclusive bool, linear bool ?, percentage bool ?, account_number vc(32) ?, limit_employee real ?, employer float8, employer_ps float8, employer_formural vc(320) ?, employer_account vc(32) ?, limit_employer real ?, details text ?

**periods** (~0 rows): period_id int PK, fiscal_year_id int ->fiscal_years ?, org_id int ->orgs ?, start_date date, end_date date, opened bool, activated bool, closed bool, overtime_rate float8, per_diem_tax_limit float8, is_posted bool, loan_approval bool, gl_payroll_account vc(32) ?, gl_advance_account vc(32) ?, entity_id int ->entitys ?, application_date ts ?, approve_status vc(16), workflow_table_id int ?, action_date ts ?, details text ?

**reporting** (~0 rows): reporting_id int PK, entity_id int ->entitys ?, report_to_id int ->entitys ?, org_id int ->orgs ?, date_from date ?, date_to date ?, reporting_level int, primary_report bool, is_active bool, ps_reporting real ?, details text ?

**tax_rates** (~0 rows): tax_rate_id int PK, tax_type_id int ->tax_types ?, org_id int ->orgs ?, tax_range float8, tax_rate float8, employer_rate int, rate_relief real, narrative vc(240) ?

**tax_types** (~0 rows): tax_type_id int PK, account_id int ->accounts ?, currency_id int ->currency ?, use_key_id int ->use_keys, sys_country_id ch ->sys_countrys ?, org_id int ->orgs ?, tax_type_name vc(50), tax_type_number vc(50) ?, formural vc(320) ?, tax_relief real, employer_relief real, tax_type_order int, in_tax bool, tax_rate real, tax_inclusive bool, linear bool ?, percentage bool ?, account_number vc(32) ?, limit_employee real ?, employer float8, employer_ps float8, employer_formural vc(320) ?, employer_account vc(32) ?, limit_employer real ?, active bool, details text ?
