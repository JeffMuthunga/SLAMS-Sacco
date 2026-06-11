# loans — legacy `sacco` DB reference

Functional reference only; new schema follows project conventions.
Format: table (~rows): column type [PK] [->fk_table] [? = nullable]

**collateral_types** (~0 rows): collateral_type_id int PK, org_id int ->orgs ?, collateral_type_name vc(50), details text ?

**collaterals** (~0 rows): collateral_id int PK, loan_id int ->loans ?, collateral_type_id int ->collateral_types ?, entity_id int ->entitys ?, org_id int ->orgs ?, collateral_amount real, collateral_received bool, collateral_released bool, application_date ts ?, approve_status vc(16), workflow_table_id int ?, action_date ts ?, details text ?

**guarantees** (~0 rows): guarantee_id int PK, loan_id int ->loans ?, member_id int ->members ?, entity_id int ->entitys ?, org_id int ->orgs ?, guarantee_amount real, guarantee_accepted bool, accepted_date ts ?, is_active bool, application_date ts ?, approve_status vc(16), workflow_table_id int ?, action_date ts ?, details text ?

**interest_methods** (~0 rows): interest_method_id int PK, activity_type_id int ->activity_types, org_id int ->orgs ?, interest_method_name vc(120), reducing_balance bool, reducing_payments bool, formural vc(320) ?, account_number vc(32) ?, interest_method_no int ?, details text ?

**loan_approval** (~0 rows): loan_approval_id int PK, sacco_official_id int ->sacco_officials ?, org_id int ->orgs ?, processing_approval bool, final_approval bool, is_active bool, narrative vc(120) ?, details text ?

**loan_approval_levels** (~0 rows): loan_approval_level_id int PK, org_id int ->orgs ?, loan_approval_id int ->loan_approval ?, loan_id int ->loans ?, is_approved bool, approved_time ts ?, status vc(50), entity_id int ->entitys ?, narrative vc(120) ?, details text ?

**loan_configs** (~0 rows): loan_config_id int PK, org_id int ->orgs ?, product_id int ->products ?, is_guaranteed bool, is_collateral bool, membership_period int, less_guaranteed bool, is_active bool, narrative vc(120) ?, details text ?

**loan_notes** (~0 rows): loan_note_id int PK, loan_id int ->loans ?, org_id int ->orgs ?, comment_date ts, narrative vc(320), note text

**loans** (~0 rows): loan_id int PK, member_id int ->members ?, product_id int ->products ?, activity_frequency_id int ->activity_frequency ?, entity_id int ->entitys ?, org_id int ->orgs ?, account_number vc(32), disburse_account vc(32), principal_amount real, interest_rate real, repayment_amount real, repayment_period int, disbursed_date date ?, matured_date date ?, expected_matured_date date ?, expected_repayment real ?, loan_status vc(50), is_active bool, application_date ts ?, approve_status vc(16), workflow_table_id int ?, action_date ts ?, is_guaranteed bool, is_collateral bool, details text ?

**penalty_methods** (~0 rows): penalty_method_id int PK, activity_type_id int ->activity_types, org_id int ->orgs ?, penalty_method_name vc(120), formural vc(320) ?, account_number vc(32) ?, penalty_method_no int ?, details text ?

**vw_member_loan_summary** (~0 rows): member_id int ->members ?, member_name vc(150) ?, business_account int ?, identification_number vc(50) ?, identification_type vc(50) ?, member_email vc(50) ?, telephone_number vc(20) ?, entry_date date ?, applied_loans int ?, approved_loans int ?, fully_paid_loans int ?, total_applied_loan_amount int ?, approved_amount int ?, repaid_amount int ?, balance_amount int ?, org_id int ->orgs ?
