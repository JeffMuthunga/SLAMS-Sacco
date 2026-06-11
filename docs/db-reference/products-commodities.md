# products-commodities — legacy `sacco` DB reference

Functional reference only; new schema follows project conventions.
Format: table (~rows): column type [PK] [->fk_table] [? = nullable]

**activity_frequency** (~0 rows): activity_frequency_id int PK, activity_frequency_name vc(50)

**activity_status** (~0 rows): activity_status_id int PK, activity_status_name vc(50)

**activity_types** (~0 rows): activity_type_id int PK, dr_account_id int ->accounts, cr_account_id int ->accounts, use_key_id int ->use_keys, org_id int ->orgs ?, activity_type_name vc(120), is_active bool, activity_type_no int ?, details text ?

**commodity_trades** (~0 rows): commodity_trade_id int PK, deposit_account_id int ->deposit_accounts ?, transfer_account_id int ->deposit_accounts ?, commodity_id int ->commoditys ?, entity_id int ->entitys ?, use_key_id int ->use_keys, org_id int ->orgs ?, transfer_account_no vc(32) ?, link_activity_id int, unit_debit real, unit_credit real, price real, trade_date date, application_date ts ?, approve_status vc(16), workflow_table_id int ?, action_date ts ?, details text ?

**commodity_types** (~0 rows): commodity_type_id int PK, org_id int ->orgs ?, commodity_type_name vc(50), details text ?

**commoditys** (~0 rows): commodity_id int PK, commodity_type_id int ->commodity_types ?, org_id int ->orgs ?, commodity_name vc(50), commodity_account vc(32), current_price real, details text ?

**investment_status** (~0 rows): investment_status_id int PK, org_id int ->orgs ?, investment_status_name vc(120) ?, details text ?

**investment_types** (~0 rows): investment_type_id int PK, org_id int ->orgs ?, investment_type_name vc(120) ?, interest_amount real ?, details text ?

**investments** (~0 rows): investment_id int PK, investment_type_id int ->investment_types ?, investment_status_id int ->investment_status ?, currency_id int ->currency ?, entity_id int ->entitys ?, org_id int ->orgs ?, investment_name vc(120) ?, started_date date ?, expected_maturity date ?, exchange_rate real, proposed_capital real, expected_profit real, initial_payment real, monthly_payments real, monthly_returns real, is_active bool, is_completed bool, application_date ts ?, approve_status vc(16) ?, workflow_table_id int ?, action_date ts ?, details text ?

**products** (~0 rows): product_id int PK, interest_method_id int ->interest_methods ?, penalty_method_id int ->penalty_methods ?, activity_frequency_id int ->activity_frequency ?, currency_id int ->currency ?, entity_id int ->entitys ?, org_id int ->orgs ?, product_name vc(120), description vc(320) ?, loan_account bool, is_active bool, interest_rate real, min_opening_balance real, lockin_period_frequency real ?, minimum_balance real ?, maximum_balance real ?, minimum_day real ?, maximum_day real ?, minimum_trx real ?, maximum_trx real ?, maximum_repayments int, less_initial_fee bool, product_no int ?, application_date ts, approve_status vc(16), workflow_table_id int ?, action_date ts ?, details text ?, align_expiry bool, annual_cost real
