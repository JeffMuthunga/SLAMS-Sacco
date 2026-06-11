#!/usr/bin/env python3
"""Generate compact per-domain schema reference docs from the legacy `sacco` PostgreSQL DB.

Usage: python3 scripts/generate-db-reference.py [dbname]
Writes terse markdown files to docs/db-reference/, one per domain.
Format per table:  `table (~rows): col type [PK] [->fk_table] [?=nullable], ...`
"""
import subprocess
import sys
import re
from collections import defaultdict
from pathlib import Path

DB = sys.argv[1] if len(sys.argv) > 1 else "sacco"
OUT_DIR = Path(__file__).resolve().parent.parent / "docs" / "db-reference"

# Domain grouping (tables not listed are bucketed by prefix, else 'other')
DOMAINS = {
    "members-entities": """entitys entity_types entity_subscriptions entity_orgs entity_fields
        entity_values members member_imports sacco_officials kins kin_types applicants
        address address_types position_levels""",
    "loans": """loans loan_configs loan_approval loan_approval_levels loan_notes
        guarantees collaterals collateral_types interest_methods penalty_methods
        vw_member_loan_summary""",
    "accounts-transactions": """accounts deposit_accounts account_activity account_definations
        account_class account_types account_notes transactions transaction_types
        transaction_details transaction_links transaction_status transaction_counters
        transfer_activity transfer_beneficiary gls journals ledger_types ledger_links""",
    "products-commodities": """products commoditys commodity_types commodity_trades
        investments investment_types investment_status activity_frequency activity_status
        activity_types""",
    "finance-accounting": """fiscal_years periods period_tax_types period_tax_rates tax_types
        tax_rates default_tax_types default_accounts currency currency_rates budgets
        budget_lines bank_accounts bank_branch banks reporting""",
    "petty-cash": "pc_allocations pc_banking pc_budget pc_category pc_expenditure pc_items pc_types",
    "operations": """quotations contracts tenders tender_items tender_types bidders leads
        lead_items lead_categorys stocks stock_lines stores store_movement items
        item_category item_units ss_items ss_types""",
    "workflows-approvals": "workflows workflow_phases workflow_logs workflow_sql approvals approval_checklists checklists phases",
    "subscriptions-orgs": "subscriptions orgs industry",
    "communications": """sms sms_configs sms_group sms_group_members group_sms_details
        sys_emails sys_emailed sys_news helpdesk follow_up tasks""",
    "system-config": """sys_configs sys_access_levels sys_access_entitys sys_audit_trail
        sys_audit_details sys_logins sys_reset sys_errors sys_files sys_dashboard
        sys_queries sys_translations sys_languages sys_menu_msg sys_continents
        sys_countrys use_keys locations departments holidays entry_forms forms fields
        e_fields et_fields sub_fields folders""",
    "integrations": "mpesa_api mpesa_trxs block_chains",
}
TABLE_TO_DOMAIN = {t: d for d, ts in DOMAINS.items() for t in ts.split()}

TYPE_ABBR = {
    "character varying": "vc", "timestamp without time zone": "ts",
    "timestamp with time zone": "tstz", "integer": "int", "boolean": "bool",
    "double precision": "float8", "numeric": "num", "bigint": "int8",
    "smallint": "int2", "character": "ch",
}


def psql(query: str) -> list[list[str]]:
    out = subprocess.run(
        ["psql", "-d", DB, "-tA", "-F", "\t", "-c", query],
        capture_output=True, text=True, check=True,
    ).stdout
    return [line.split("\t") for line in out.strip().split("\n") if line]


def main():
    cols = psql("""
        SELECT c.table_name, c.column_name, c.data_type,
               coalesce(c.character_maximum_length::text,''),
               coalesce(c.numeric_precision::text,''), coalesce(c.numeric_scale::text,''),
               c.is_nullable, t.table_type
        FROM information_schema.columns c
        JOIN information_schema.tables t
          ON t.table_name=c.table_name AND t.table_schema=c.table_schema
        WHERE c.table_schema='public'
        ORDER BY c.table_name, c.ordinal_position""")
    pks = {(r[0], r[1]) for r in psql("""
        SELECT tc.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
        WHERE tc.constraint_type='PRIMARY KEY' AND tc.table_schema='public'""")}
    fks = {(r[0], r[1]): r[2] for r in psql("""
        SELECT tc.table_name, kcu.column_name, ccu.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name=ccu.constraint_name
        WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public'""")}
    rowcounts = {r[0]: int(r[1]) for r in psql(
        "SELECT relname, n_live_tup FROM pg_stat_user_tables WHERE schemaname='public'")}

    tables: dict[str, list[str]] = defaultdict(list)
    table_type: dict[str, str] = {}
    all_table_names = {r[0] for r in cols}

    def infer_fk(table: str, col: str) -> str | None:
        if (table, col) in fks:
            return fks[(table, col)]
        m = re.fullmatch(r"(.+)_id", col)
        if not m:
            return None
        base = m.group(1)
        for cand in (base + "s", base, base + "es"):
            if cand in all_table_names and cand != table:
                return cand
        return None

    for tname, cname, dtype, maxlen, prec, scale, nullable, ttype in cols:
        table_type[tname] = ttype
        t = TYPE_ABBR.get(dtype, dtype)
        if t == "vc" and maxlen:
            t += f"({maxlen})"
        elif t == "num" and prec:
            t += f"({prec},{scale})"
        part = f"{cname} {t}"
        if (tname, cname) in pks:
            part += " PK"
        fk = infer_fk(tname, cname)
        if fk:
            part += f" ->{fk}"
        if nullable == "YES":
            part += " ?"
        tables[tname].append(part)

    by_domain: dict[str, list[str]] = defaultdict(list)
    for tname in sorted(tables):
        if tname in TABLE_TO_DOMAIN:
            domain = TABLE_TO_DOMAIN[tname]
        elif tname.startswith("sys_"):
            domain = "system-config"
        elif tname.startswith("pc_"):
            domain = "petty-cash"
        elif tname.startswith("vw_") or table_type[tname] == "VIEW":
            domain = "views"
        else:
            domain = "other"
        n = rowcounts.get(tname)
        rows = f" (~{n} rows)" if n is not None else ""
        view = " [VIEW]" if table_type[tname] == "VIEW" else ""
        by_domain[domain].append(f"**{tname}**{view}{rows}: " + ", ".join(tables[tname]))

    # Views are derived data — a name list is enough; query live DB for definitions.
    view_names = sorted(t for t in tables if table_type[t] == "VIEW")
    by_domain["views"] = [
        "Views in legacy DB (definitions via `psql -d sacco -c '\\d+ <name>'` when needed):\n",
        ", ".join(view_names),
    ]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    index_lines = []
    for domain in sorted(by_domain):
        path = OUT_DIR / f"{domain}.md"
        header = (
            f"# {domain} — legacy `sacco` DB reference\n\n"
            "Functional reference only; new schema follows project conventions.\n"
            "Format: table (~rows): column type [PK] [->fk_table] [? = nullable]\n\n"
        )
        path.write_text(header + "\n\n".join(by_domain[domain]) + "\n")
        index_lines.append(f"- `{domain}.md` — {len(by_domain[domain])} tables")
        print(f"{path.name}: {len(by_domain[domain])} tables, {path.stat().st_size} bytes")
    (OUT_DIR / "INDEX.md").write_text(
        "# Legacy `sacco` DB reference index\n\nRegenerate: `python3 scripts/generate-db-reference.py`\n\n"
        + "\n".join(index_lines) + "\n")


if __name__ == "__main__":
    main()
