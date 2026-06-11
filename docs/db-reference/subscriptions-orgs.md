# subscriptions-orgs — legacy `sacco` DB reference

Functional reference only; new schema follows project conventions.
Format: table (~rows): column type [PK] [->fk_table] [? = nullable]

**industry** (~0 rows): industry_id int PK, org_id int ->orgs ?, industry_name vc(50), details text ?

**orgs** (~0 rows): org_id int PK, currency_id int ->currency ?, default_country_id ch ->sys_countrys ?, parent_org_id int ->orgs ?, org_name vc(50), org_full_name vc(120) ?, org_sufix vc(4), is_default bool, is_active bool, pin vc(50) ?, pcc vc(12) ?, logo vc(50) ?, letter_head vc(50) ?, email_from vc(120) ?, web_logos bool, created ts, system_key vc(64) ?, system_identifier vc(64) ?, mac_address vc(64) ?, public_key bytea ?, license bytea ?, details text ?, org_client_id int ->entitys ?, payroll_payable bool, cert_number vc(50) ?, vat_number vc(50) ?, enforce_budget bool, invoice_footer text ?, member_limit int

**subscriptions** (~0 rows): subscription_id int PK, entity_id int ->entitys ?, org_id int ->orgs ?, business_name vc(50) ?, business_address vc(100) ?, city vc(30) ?, number_of_members float8, country_id ch ->sys_countrys ?, telephone vc(50) ?, website vc(120) ?, primary_contact vc(120) ?, job_title vc(120) ?, primary_email vc(120) ?, confirm_email vc(120) ?, system_key vc(64) ?, subscribed bool ?, subscribed_date ts ?, approve_status vc(16), workflow_table_id int ?, application_date ts ?, action_date ts ?, details text ?
