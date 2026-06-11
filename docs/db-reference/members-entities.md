# members-entities — legacy `sacco` DB reference

Functional reference only; new schema follows project conventions.
Format: table (~rows): column type [PK] [->fk_table] [? = nullable]

**address** (~0 rows): address_id int PK, address_type_id int ->address_types ?, sys_country_id ch ->sys_countrys ?, org_id int ->orgs ?, address_name vc(120) ?, table_name vc(32) ?, table_id int ?, post_office_box vc(50) ?, postal_code vc(12) ?, premises vc(120) ?, street vc(120) ?, town vc(50) ?, phone_number vc(150) ?, extension vc(15) ?, mobile vc(150) ?, fax vc(150) ?, email vc(120) ?, website vc(120) ?, is_default bool, first_password vc(32) ?, details text ?

**address_types** (~0 rows): address_type_id int PK, org_id int ->orgs ?, address_type_name vc(50) ?

**applicants** (~0 rows): applicant_id int PK, member_id int ->members ?, org_id int ->orgs ?, business_account int, person_title vc(7) ?, applicant_name vc(150), identification_number vc(50), identification_type vc(50), member_email vc(50), telephone_number vc(20), telephone_number2 vc(20) ?, address vc(50) ?, town vc(50) ?, zip_code vc(50) ?, date_of_birth date, gender vc(1) ?, nationality ch ->sys_countrys ?, marital_status vc(2) ?, picture_file vc(32) ?, employed bool, self_employed bool, employer_name vc(120) ?, monthly_salary real ?, monthly_net_income real ?, annual_turnover real ?, annual_net_income real ?, employer_address text ?, introduced_by vc(100) ?, entity_id int ->entitys ?, application_date ts, approve_status vc(16), workflow_table_id int ?, action_date ts ?, details text ?

**entity_fields** (~0 rows): entity_field_id int PK, org_id int ->orgs, use_type int, is_active bool ?, entity_field_name vc(240) ?, entity_field_source vc(320) ?

**entity_orgs** (~0 rows): entity_org_id int PK, entity_id int ->entitys, org_id int ->orgs ?, details text ?

**entity_subscriptions** (~1 rows): entity_subscription_id int PK, entity_type_id int ->entity_types, entity_id int ->entitys, org_id int ->orgs ?, details text ?

**entity_types** (~0 rows): entity_type_id int PK, use_key_id int ->use_keys, org_id int ->orgs ?, entity_type_name vc(50), entity_role vc(240) ?, start_view vc(120) ?, group_email vc(120) ?, description text ?, details text ?

**entity_values** (~0 rows): entity_value_id int PK, entity_id int ->entitys ?, entity_field_id int ->entity_fields ?, org_id int ->orgs ?, entity_value vc(240) ?

**entitys** (~1 rows): entity_id int PK, entity_type_id int ->entity_types, use_key_id int ->use_keys, sys_language_id int ->sys_languages ?, org_id int ->orgs, entity_name vc(120), user_name vc(120), primary_email vc(120) ?, primary_telephone vc(50) ?, super_user bool, entity_leader bool, no_org bool, function_role vc(240) ?, date_enroled ts, is_active bool ?, entity_password vc(64), first_password vc(64), new_password vc(64) ?, start_url vc(64) ?, is_picked bool, details text ?, attention vc(50) ?, credit_limit real ?, account_id int ->accounts ?, member_id int ->members ?

**kin_types** (~0 rows): kin_type_id int PK, org_id int ->orgs ?, spouse bool, kin_type_name vc(50) ?, details text ?

**kins** (~0 rows): kin_id int PK, member_id int ->members ?, kin_type_id int ->kin_types ?, org_id int ->orgs ?, full_names vc(120) ?, date_of_birth date ?, identification vc(50) ?, identification_type vc(50) ?, emergency_contact bool, beneficiary bool, beneficiary_ps real ?, details text ?

**member_imports** (~0 rows): member_import_id int PK, org_id vc(150) ->orgs ?, entity_id vc(150) ->entitys ?, person_title vc(150) ?, member_name vc(150) ?, identification_number vc(150) ?, identification_type vc(150) ?, member_email vc(150) ?, telephone_number vc(120) ?, date_of_birth vc(150) ?, gender vc(100) ?, marital_status vc(102) ?, entry_date vc(150) ?, address vc(150) ?, zip_code vc(150) ?, town vc(150) ?

**members** (~0 rows): member_id int PK, entity_id int ->entitys ?, org_id int ->orgs ?, business_account int, person_title vc(7) ?, member_name vc(150), identification_number vc(50), identification_type vc(50), member_email vc(50), telephone_number vc(20), telephone_number2 vc(20) ?, address vc(50) ?, town vc(50) ?, zip_code vc(50) ?, date_of_birth date, gender vc(1) ?, nationality ch ->sys_countrys ?, marital_status vc(2) ?, picture_file vc(32) ?, entry_date date ?, employed bool, self_employed bool, employer_name vc(120) ?, monthly_salary real ?, monthly_net_income real ?, annual_turnover real ?, annual_net_income real ?, employer_address text ?, introduced_by vc(100) ?, is_active bool, terminated bool, terminate_date ts ?, terminate_status vc(100), terminate_application_date ts ?, application_date ts, approve_status vc(16), workflow_table_id int ?, action_date ts ?, details text ?

**position_levels** (~0 rows): position_level_id int PK, org_id int ->orgs ?, position_level_name vc(150), narrative vc(225) ?, details text ?

**sacco_officials** (~0 rows): sacco_official_id int PK, position_level_id int ->position_levels ?, org_id int ->orgs ?, member_id int ->members ?, start_date date, end_date date ?, term_limit int ?, is_active bool, narrative vc(225) ?, details text ?
