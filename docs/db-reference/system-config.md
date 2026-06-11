# system-config — legacy `sacco` DB reference

Functional reference only; new schema follows project conventions.
Format: table (~rows): column type [PK] [->fk_table] [? = nullable]

**departments** (~0 rows): department_id int PK, ln_department_id int ->departments ?, org_id int ->orgs ?, department_name vc(120) ?, department_account vc(50) ?, function_code vc(50) ?, active bool, petty_cash bool, cost_center bool, revenue_center bool, description text ?, duties text ?, reports text ?, details text ?

**e_fields** (~0 rows): e_field_id int PK, et_field_id int ->et_fields ?, org_id int ->orgs ?, table_code int, table_id int ?, e_field_value vc(320) ?

**entry_forms** (~0 rows): entry_form_id int PK, org_id int ->orgs ?, entity_id int ->entitys ?, form_id int ->forms ?, entered_by_id int ->entitys ?, application_date ts, completion_date ts ?, approve_status vc(16), workflow_table_id int ?, action_date ts ?, narrative vc(240) ?, answer text ?, sub_answer text ?, details text ?

**et_fields** (~0 rows): et_field_id int PK, org_id int ->orgs ?, et_field_name vc(320), table_name vc(64), table_code int, table_link int ?, is_active bool

**fields** (~0 rows): field_id int PK, org_id int ->orgs ?, form_id int ->forms ?, field_name vc(50) ?, question text ?, field_lookup text ?, field_type vc(25), field_class vc(25) ?, field_bold ch, field_italics ch, field_order int, share_line int ?, field_size int, label_position ch ?, field_fnct vc(120) ?, manditory ch, show ch ?, tab vc(25) ?, details text ?

**folders** (~0 rows): folder_id int PK, org_id int ->orgs ?, folder_name vc(25) ?, details text ?

**forms** (~0 rows): form_id int PK, org_id int ->orgs ?, form_name vc(240), form_number vc(50) ?, table_name vc(50) ?, version vc(25) ?, completed ch, is_active ch, use_key int ?, form_header text ?, form_footer text ?, default_values text ?, details text ?

**holidays** (~0 rows): holiday_id int PK, org_id int ->orgs ?, holiday_name vc(50), holiday_date date ?, details text ?

**locations** (~0 rows): location_id int PK, org_id int ->orgs ?, location_name vc(50) ?, details text ?

**sub_fields** (~0 rows): sub_field_id int PK, org_id int ->orgs ?, field_id int ->fields ?, sub_field_order int, sub_title_share vc(120) ?, sub_field_type vc(25) ?, sub_field_lookup text ?, sub_field_size int, sub_col_spans int, manditory ch, show ch ?, question text ?

**sys_access_entitys** (~2 rows): sys_access_entity_id int PK, sys_access_level_id int ->sys_access_levels, entity_id int ->entitys, org_id int ->orgs ?, narrative vc(320) ?

**sys_access_levels** (~0 rows): sys_access_level_id int PK, use_key_id int ->use_keys ?, sys_country_id ch ->sys_countrys ?, org_id int ->orgs ?, sys_access_level_name vc(64), access_tag vc(32), acess_details text ?

**sys_audit_details** (~0 rows): sys_audit_trail_id int PK ->sys_audit_trail, old_value text ?

**sys_audit_trail** (~0 rows): sys_audit_trail_id int PK, user_id vc(50), user_ip vc(50) ?, change_date ts, table_name vc(50), record_id vc(50), change_type vc(50), narrative vc(240) ?

**sys_configs** (~0 rows): sys_config_id int PK, config_type_id int, config_name vc(254), config_value text

**sys_continents** (~0 rows): sys_continent_id ch PK, sys_continent_name vc(120) ?

**sys_countrys** (~0 rows): sys_country_id ch PK, sys_continent_id ch ->sys_continents ?, sys_country_code vc(3) ?, sys_country_name vc(120) ?, sys_country_number vc(3) ?, sys_country_capital vc(64) ?, sys_phone_code vc(7) ?, sys_currency_name vc(50) ?, sys_currency_code vc(3) ?, sys_currency_cents vc(50) ?, sys_currency_exchange real ?

**sys_dashboard** (~0 rows): sys_dashboard_id int PK, entity_id int ->entitys ?, org_id int ->orgs ?, narrative vc(240) ?, details text ?

**sys_errors** (~0 rows): sys_error_id int PK, sys_error vc(240), error_message text

**sys_files** (~0 rows): sys_file_id int PK, org_id int ->orgs ?, table_id int ?, table_name vc(50) ?, file_name vc(320) ?, file_type vc(320) ?, file_size int ?, narrative vc(320) ?, details text ?

**sys_languages** (~0 rows): sys_language_id int PK, sys_language_name vc(50)

**sys_logins** (~19 rows): sys_login_id int PK, entity_id int ->entitys ?, login_time ts ?, login_ip vc(64) ?, narrative vc(240) ?

**sys_menu_msg** (~0 rows): sys_menu_msg_id int PK, menu_id vc(16), menu_name vc(50), xml_file vc(50), msg text ?

**sys_queries** (~0 rows): sys_queries_id int PK, org_id int ->orgs ?, sys_query_name vc(50) ?, query_date ts, query_text text ?, query_params text ?

**sys_reset** (~0 rows): sys_reset_id int PK, entity_id int ->entitys ?, org_id int ->orgs ?, request_email vc(320) ?, request_time ts ?, login_ip vc(64) ?, narrative vc(240) ?

**sys_translations** (~0 rows): sys_translation_id int PK, sys_language_id int ->sys_languages ?, org_id int ->orgs ?, reference vc(64), title vc(320)

**use_keys** (~0 rows): use_key_id int PK, use_key_name vc(32), use_function int ?
