# communications — legacy `sacco` DB reference

Functional reference only; new schema follows project conventions.
Format: table (~rows): column type [PK] [->fk_table] [? = nullable]

**follow_up** (~0 rows): follow_up_id int PK, lead_item_id int ->lead_items ?, entity_id int ->entitys ?, org_id int ->orgs ?, create_time ts, follow_date date, follow_time time without time zone, done bool, narrative vc(240) ?, details text ?

**group_sms_details** (~0 rows): group_sms_detail_id int PK, sms_group_id int ->sms_group ?, sms_group_member_id int ->sms_group_members ?, org_id int ->orgs ?, message text ?

**helpdesk** (~0 rows): helpdesk_id int PK, org_id int ->orgs ?, issue_definition_id int ->issue_definitions ?, issue_level_id int ->issue_levels ?, member_id int ->members ?, description text ?, recorded_by int ->entitys ?, recoded_time ts, solved_time ts ?, is_solved bool, closed_by int ->entitys ?, is_escalated bool, escalated_to int ->entitys ?, escalated_by int ->entitys ?, escalated_time ts ?, curr_action vc(50) ?, curr_status vc(50) ?, problem text ?, solution text ?

**sms** (~0 rows): sms_id int PK, entity_id int ->entitys ?, member_id int ->members ?, folder_id int ->folders ?, org_id int ->orgs ?, sms_number vc(25) ?, sms_time ts ?, sent bool, is_groupsms bool, message text ?, details text ?, sms_group_id int ->sms_group ?

**sms_configs** (~0 rows): sms_config_id int PK, org_id int ->orgs ?, use_key_id int ->use_keys ?, sms_config_name vc(120) ?, is_active bool, sms_template text ?, details text ?

**sms_group** (~0 rows): sms_group_id int PK, org_id int ->orgs ?, sms_group_name vc(120) ?, details text ?

**sms_group_members** (~0 rows): sms_group_member_id int PK, sms_group_id int ->sms_group ?, org_id int ->orgs ?, member_id int ->members ?, narrative vc(120) ?, details text ?

**sys_emailed** (~0 rows): sys_emailed_id int PK, sys_email_id int ->sys_emails ?, org_id int ->orgs ?, table_id int ?, table_name vc(50) ?, email_type int, emailed bool, created ts, narrative vc(240) ?, mail_body text ?

**sys_emails** (~0 rows): sys_email_id int PK, org_id int ->orgs ?, use_type int, sys_email_name vc(50) ?, default_email vc(320) ?, title vc(240), details text ?

**sys_news** (~0 rows): sys_news_id int PK, org_id int ->orgs ?, sys_news_group int ?, sys_news_title vc(240), publish bool, details text ?

**tasks** (~0 rows): task_id int PK, phase_id int ->phases ?, member_id int ->members ?, org_id int ->orgs ?, task_name vc(320), task_start date, task_deadline date ?, task_end date ?, task_cost real, task_completed bool, details text ?
