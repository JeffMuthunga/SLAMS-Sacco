# petty-cash — legacy `sacco` DB reference

Functional reference only; new schema follows project conventions.
Format: table (~rows): column type [PK] [->fk_table] [? = nullable]

**pc_allocations** (~0 rows): pc_allocation_id int PK, period_id int ->periods ?, department_id int ->departments ?, entity_id int ->entitys ?, org_id int ->orgs ?, narrative vc(320) ?, application_date ts ?, approve_status vc(16), workflow_table_id int ?, action_date ts ?, details text ?

**pc_banking** (~0 rows): pc_banking_id int PK, pc_allocation_id int ->pc_allocations ?, org_id int ->orgs ?, banking_date date, amount float8, narrative vc(320), details text ?

**pc_budget** (~0 rows): pc_budget_id int PK, pc_allocation_id int ->pc_allocations ?, pc_item_id int ->pc_items ?, org_id int ->orgs ?, budget_units int, budget_price float8, details text ?

**pc_category** (~0 rows): pc_category_id int PK, org_id int ->orgs ?, pc_category_name vc(50), details text ?

**pc_expenditure** (~0 rows): pc_expenditure_id int PK, pc_allocation_id int ->pc_allocations ?, pc_item_id int ->pc_items ?, pc_type_id int ->pc_types ?, entity_id int ->entitys ?, org_id int ->orgs ?, is_request bool, request_date ts ?, application_date ts ?, approve_status vc(16), workflow_table_id int ?, action_date ts ?, units int, unit_price float8, receipt_number vc(50) ?, exp_date date ?, details text ?

**pc_items** (~0 rows): pc_item_id int PK, pc_category_id int ->pc_category ?, org_id int ->orgs ?, pc_item_name vc(50), default_price float8, default_units int, details text ?

**pc_types** (~0 rows): pc_type_id int PK, org_id int ->orgs ?, pc_type_name vc(50), details text ?
