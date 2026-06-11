# operations — legacy `sacco` DB reference

Functional reference only; new schema follows project conventions.
Format: table (~rows): column type [PK] [->fk_table] [? = nullable]

**bidders** (~0 rows): bidder_id int PK, tender_id int ->tenders ?, entity_id int ->entitys ?, org_id int ->orgs ?, tender_amount real ?, bind_bond vc(120) ?, bind_bond_amount real ?, return_date date ?, points real ?, is_awarded bool, award_reference vc(32) ?, details text ?

**contracts** (~0 rows): contract_id int PK, bidder_id int ->bidders ?, org_id int ->orgs ?, contract_name vc(320), contract_date date ?, contract_end date ?, contract_amount real ?, contract_tax real ?, details text ?

**item_category** (~0 rows): item_category_id int PK, org_id int ->orgs ?, item_category_name vc(120), details text ?

**item_units** (~0 rows): item_unit_id int PK, org_id int ->orgs ?, item_unit_name vc(50), details text ?

**items** (~0 rows): item_id int PK, org_id int ->orgs ?, item_category_id int ->item_category ?, tax_type_id int ->tax_types ?, item_unit_id int ->item_units ?, sales_account_id int ->accounts ?, purchase_account_id int ->accounts ?, item_name vc(120), bar_code vc(32) ?, inventory bool, for_sale bool, for_purchase bool, for_stock bool, sales_price real ?, purchase_price real ?, reorder_level int ?, lead_time int ?, is_active bool, details text ?

**lead_categorys** (~0 rows): lead_category_id int PK, use_key_id int ->use_keys ?, org_id int ->orgs ?, lead_category_name vc(120), details text ?

**lead_items** (~0 rows): lead_item_id int PK, lead_id int ->leads ?, entity_id int ->entitys ?, item_id int ->items ?, org_id int ->orgs ?, pitch_date date, units int, price real, lead_level int, narrative vc(320) ?, details text ?

**leads** (~0 rows): lead_id int PK, lead_category_id int ->lead_categorys, industry_id int ->industry, entity_id int ->entitys, org_id int ->orgs ?, business_id int ?, business_name vc(50), business_address vc(100) ?, city vc(30) ?, state vc(50) ?, country_id ch ->sys_countrys ?, number_of_employees int ?, telephone vc(50) ?, website vc(120) ?, primary_contact vc(120) ?, job_title vc(120) ?, primary_email vc(120) ?, prospect_level int, contact_date date, details text ?

**quotations** (~0 rows): quotation_id int PK, org_id int ->orgs ?, item_id int ->items ?, entity_id int ->entitys ?, active bool, amount real ?, valid_from date ?, valid_to date ?, lead_time int ?, details text ?

**ss_items** (~0 rows): ss_item_id int PK, ss_type_id int ->ss_types ?, org_id int ->orgs ?, ss_item_name vc(120) ?, picture vc(120) ?, description text ?, purchase_date date, purchase_price real, sale_date date ?, sale_price real, sold bool, details text ?

**ss_types** (~0 rows): ss_type_id int PK, org_id int ->orgs ?, ss_type_name vc(120) ?, details text ?

**stock_lines** (~0 rows): stock_line_id int PK, org_id int ->orgs ?, stock_id int ->stocks ?, item_id int ->items ?, quantity int ?, narrative vc(240) ?

**stocks** (~0 rows): stock_id int PK, org_id int ->orgs ?, store_id int ->stores ?, stock_name vc(50) ?, stock_take_date date ?, details text ?

**store_movement** (~0 rows): store_movement_id int PK, store_id int ->stores ?, store_to_id int ->stores ?, item_id int ->items ?, org_id int ->orgs ?, movement_date date, quantity int, narrative vc(240) ?

**stores** (~0 rows): store_id int PK, org_id int ->orgs ?, store_name vc(120) ?, details text ?

**tender_items** (~0 rows): tender_item_id int PK, bidder_id int ->bidders ?, org_id int ->orgs ?, tender_item_name vc(320), quantity int ?, item_amount real ?, item_tax real ?, details text ?

**tender_types** (~0 rows): tender_type_id int PK, org_id int ->orgs ?, tender_type_name vc(50), details text ?

**tenders** (~0 rows): tender_id int PK, tender_type_id int ->tender_types ?, currency_id int ->currency ?, org_id int ->orgs ?, tender_name vc(320), tender_number vc(64) ?, tender_date date, tender_end_date date ?, is_completed bool, details text ?
