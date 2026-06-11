# accounts-transactions — legacy `sacco` DB reference

Functional reference only; new schema follows project conventions.
Format: table (~rows): column type [PK] [->fk_table] [? = nullable]

**account_activity** (~0 rows): account_activity_id int PK, deposit_account_id int ->deposit_accounts ?, transfer_account_id int ->deposit_accounts ?, activity_type_id int ->activity_types ?, activity_frequency_id int ->activity_frequency ?, activity_status_id int ->activity_status ?, commodity_trade_id int ->commodity_trades ?, period_id int ->periods ?, entity_id int ->entitys ?, org_id int ->orgs ?, link_activity_id int, transfer_link_id int ?, deposit_account_no vc(32) ?, transfer_account_no vc(32) ?, activity_date date, value_date date, account_credit real, account_debit real, balance real, exchange_rate real, invert_rate bool, trading_rate real, mean_rate real, application_date ts ?, approve_status vc(16), workflow_table_id int ?, action_date ts ?, details text ?, loan_id int ->loans ?, transfer_loan_id int ->loans ?

**account_class** (~0 rows): account_class_id int PK, account_class_no int, org_id int ->orgs ?, chat_type_id int, chat_type_name vc(50), account_class_name vc(120), details text ?

**account_definations** (~0 rows): account_defination_id int PK, product_id int ->products, activity_type_id int ->activity_types, charge_activity_id int ->activity_types, activity_frequency_id int ->activity_frequency, org_id int ->orgs ?, account_defination_name vc(50), start_date date, end_date date ?, fee_amount real, fee_ps real, has_charge bool, is_active bool, account_number vc(32), details text ?

**account_notes** (~0 rows): account_note_id int PK, deposit_account_id int ->deposit_accounts ?, org_id int ->orgs ?, comment_date ts, narrative vc(320), note text

**account_types** (~0 rows): account_type_id int PK, account_type_no int, account_class_id int ->account_class ?, org_id int ->orgs ?, account_type_name vc(120), details text ?

**accounts** (~0 rows): account_id int PK, account_no int, account_type_id int ->account_types ?, org_id int ->orgs ?, account_name vc(120), is_header bool, is_active bool, details text ?

**deposit_accounts** (~0 rows): deposit_account_id int PK, member_id int ->members ?, product_id int ->products ?, activity_frequency_id int ->activity_frequency ?, entity_id int ->entitys ?, org_id int ->orgs ?, is_active bool, account_number vc(32), narrative vc(120) ?, opening_date date, last_closing_date date ?, credit_limit real ?, minimum_balance real ?, maximum_balance real ?, interest_rate real, lockin_period_frequency real ?, lockedin_until_date date ?, application_date ts, approve_status vc(16), workflow_table_id int ?, action_date ts ?, details text ?

**gls** (~0 rows): gl_id int PK, journal_id int ->journals, account_id int ->accounts, org_id int ->orgs ?, debit real, credit real, gl_narrative vc(240) ?, account_activity_id int ->account_activity ?

**journals** (~0 rows): journal_id int PK, period_id int ->periods, currency_id int ->currency ?, department_id int ->departments ?, org_id int ->orgs ?, exchange_rate real, journal_date date, posted bool, year_closing bool, narrative vc(240) ?, details text ?

**ledger_links** (~0 rows): ledger_link_id int PK, ledger_type_id int ->ledger_types ?, org_id int ->orgs ?, link_type int ?, link_id int ?

**ledger_types** (~0 rows): ledger_type_id int PK, account_id int ->accounts ?, tax_account_id int ->accounts ?, org_id int ->orgs ?, ledger_type_name vc(120), ledger_posting bool, income_ledger bool, expense_ledger bool, details text ?

**transaction_counters** (~0 rows): transaction_counter_id int PK, transaction_type_id int ->transaction_types ?, org_id int ->orgs ?, document_number int

**transaction_details** (~0 rows): transaction_detail_id int PK, transaction_id int ->transactions ?, account_id int ->accounts ?, item_id int ->items ?, store_id int ->stores ?, org_id int ->orgs ?, quantity int, amount real, tax_amount real, discount real, narrative vc(240) ?, purpose vc(320) ?, details text ?

**transaction_links** (~0 rows): transaction_link_id int PK, org_id int ->orgs ?, transaction_id int ->transactions ?, transaction_to int ->transactions ?, transaction_detail_id int ->transaction_details ?, transaction_detail_to int ->transaction_details ?, amount real, quantity int, narrative vc(240) ?

**transaction_status** (~0 rows): transaction_status_id int PK, transaction_status_name vc(50)

**transaction_types** (~0 rows): transaction_type_id int PK, transaction_type_name vc(50), document_prefix vc(16), for_sales bool, for_posting bool

**transactions** (~0 rows): transaction_id int PK, entity_id int ->entitys ?, transaction_type_id int ->transaction_types ?, ledger_type_id int ->ledger_types ?, transaction_status_id int ->transaction_status ?, bank_account_id int ->bank_accounts ?, journal_id int ->journals ?, currency_id int ->currency ?, department_id int ->departments ?, entered_by int ->entitys ?, org_id int ->orgs ?, exchange_rate real, transaction_date date, payment_date date, transaction_amount real, transaction_tax_amount real, document_number int, tx_type int ?, for_processing bool, is_cleared bool, completed bool, reference_number vc(50) ?, payment_number vc(50) ?, order_number vc(50) ?, payment_terms vc(50) ?, job vc(240) ?, point_of_use vc(240) ?, application_date ts ?, approve_status vc(16), workflow_table_id int ?, action_date ts ?, narrative vc(120) ?, notes text ?, details text ?, investment_id int ->investments ?

**transfer_activity** (~0 rows): transfer_activity_id int PK, transfer_beneficiary_id int ->transfer_beneficiary ?, deposit_account_id int ->deposit_accounts ?, activity_type_id int ->activity_types ?, activity_frequency_id int ->activity_frequency ?, entity_id int ->entitys ?, account_activity_id int ->account_activity ?, org_id int ->orgs ?, transfer_amount real, application_date ts ?, approve_status vc(16), workflow_table_id int ?, action_date ts ?, details text ?

**transfer_beneficiary** (~0 rows): transfer_beneficiary_id int PK, member_id int ->members ?, deposit_account_id int ->deposit_accounts ?, entity_id int ->entitys ?, org_id int ->orgs ?, beneficiary_name vc(150), account_number vc(32), allow_transfer bool, application_date ts ?, approve_status vc(16), workflow_table_id int ?, action_date ts ?, details text ?
