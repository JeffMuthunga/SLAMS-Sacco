# workflows-approvals — legacy `sacco` DB reference

Functional reference only; new schema follows project conventions.
Format: table (~rows): column type [PK] [->fk_table] [? = nullable]

**approval_checklists** (~0 rows): approval_checklist_id int PK, approval_id int ->approvals, checklist_id int ->checklists, org_id int ->orgs ?, requirement text ?, manditory bool, done bool, narrative vc(320) ?

**approvals** (~0 rows): approval_id int PK, workflow_phase_id int ->workflow_phases, org_entity_id int ->entitys, app_entity_id int ->entitys ?, org_id int ->orgs ?, approval_level int, escalation_days int, escalation_hours int, escalation_time ts, forward_id int ?, table_name vc(64) ?, table_id int ?, application_date ts, completion_date ts ?, action_date ts ?, approve_status vc(16), approval_narrative vc(240) ?, to_be_done text ?, what_is_done text ?, review_advice text ?, details text ?

**checklists** (~0 rows): checklist_id int PK, workflow_phase_id int ->workflow_phases, org_id int ->orgs ?, checklist_number int ?, manditory bool, requirement text ?, details text ?

**phases** (~0 rows): phase_id int PK, investment_id int ->investments ?, org_id int ->orgs ?, phase_name vc(240), start_date date, end_date date ?, completed bool, phase_cost real, details text ?

**workflow_logs** (~0 rows): workflow_log_id int PK, org_id int ->orgs ?, table_name vc(64) ?, table_id int ?, table_old_id int ?

**workflow_phases** (~0 rows): workflow_phase_id int PK, workflow_id int ->workflows, approval_entity_id int ->entity_types, org_id int ->orgs ?, approval_level int, return_level int, escalation_days int, escalation_hours int, required_approvals int, reporting_level int, use_reporting bool, advice bool, notice bool, phase_narrative vc(240), advice_email text ?, notice_email text ?, advice_file vc(320) ?, notice_file vc(320) ?, details text ?

**workflow_sql** (~0 rows): workflow_sql_id int PK, workflow_phase_id int ->workflow_phases, org_id int ->orgs ?, workflow_sql_name vc(50) ?, is_condition bool ?, is_action bool ?, message text, sql text

**workflows** (~0 rows): workflow_id int PK, source_entity_id int ->entity_types, org_id int ->orgs ?, workflow_name vc(240), table_name vc(64) ?, table_link_field vc(64) ?, table_link_id int ?, approve_email text, reject_email text, approve_file vc(320) ?, reject_file vc(320) ?, link_copy int ?, details text ?
