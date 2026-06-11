# integrations — legacy `sacco` DB reference

Functional reference only; new schema follows project conventions.
Format: table (~rows): column type [PK] [->fk_table] [? = nullable]

**block_chains** (~0 rows): block_chain_id int PK, org_id int ->orgs ?, link_activity_id int, block_data text ?, block_hash text ?, previous_hash text ?

**mpesa_api** (~0 rows): mpesa_api_id int PK, org_id int ->orgs ?, transactiontype vc(32) ?, transid vc(32) ?, transtime vc(16) ?, transamount real ?, businessshortcode vc(16) ?, billrefnumber vc(64) ?, invoicenumber vc(64) ?, orgaccountbalance real ?, thirdpartytransid vc(64) ?, msisdn vc(16) ?, firstname vc(64) ?, middlename vc(64) ?, lastname vc(64) ?, transactiontime ts ?, created ts, narrative vc(240) ?, in_words vc(320) ?, is_picked bool ?, picked_account vc(64) ?

**mpesa_trxs** (~0 rows): mpesa_trx_id int PK, org_id int ->orgs ?, mpesa_id int ?, mpesa_orig vc(50) ?, mpesa_dest vc(50) ?, mpesa_tstamp ts ?, mpesa_text vc(320) ?, mpesa_code vc(50) ?, mpesa_acc vc(50) ?, mpesa_msisdn vc(50) ?, mpesa_trx_date date ?, mpesa_trx_time time without time zone ?, mpesa_amt real ?, mpesa_sender vc(50) ?, mpesa_pick_time ts ?
