# other — legacy `sacco` DB reference

Functional reference only; new schema follows project conventions.
Format: table (~rows): column type [PK] [->fk_table] [? = nullable]

**issue_definitions** (~0 rows): issue_definition_id int PK, issue_type_id int ->issue_types ?, org_id int ->orgs ?, issue_definition_name vc(50), description text ?, solution text ?

**issue_levels** (~0 rows): issue_level_id int PK, org_id int ->orgs ?, issue_level_name vc(50), details text ?

**issue_types** (~0 rows): issue_type_id int PK, org_id int ->orgs ?, issue_type_name vc(50), details text ?
