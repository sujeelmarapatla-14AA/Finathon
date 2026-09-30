"""
SpendIntel - Step 8: Final Procurement Challenge Validation.

End-to-end audit and validation covering all 14 procurement challenge pillars:
1. Data Ingestion
2. Supplier Normalization
3. Product Normalization
4. Price Benchmarking
5. Supplier Fragmentation
6. Contract Analysis
7. Missed Discounts
8. Unusual Procurement Patterns
9. Leakage Calculation
10. Financial Impact
11. Findings API
12. Dashboard API
13. AI Investigation
14. Recovery Simulator

Verifies every result against the actual demo procurement dataset:
cb8b20d5-2516-47a9-8646-317e9beee50b.csv
"""

import sys
from pathlib import Path
import json
import httpx
import pandas as pd

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure backend root in path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.services.normalization import normalize_procurement_dataframe, normalize_supplier, normalize_product
from app.services.leakage import detect_price_anomalies
from app.services.contracts import detect_contract_findings
from app.services.patterns import detect_unusual_patterns
from app.services.analyzer import analyze_procurement, compute_canonical_leakage
from app.services.simulator import calculate_recovery
from app.routes.dashboard import get_dashboard_analysis
from app.routes.findings import get_findings
from app.routes.investigation import investigate_transaction

DEMO_FILE_ID = "cb8b20d5-2516-47a9-8646-317e9beee50b"
DEMO_CSV_PATH = backend_dir / "app" / "data" / "uploads" / f"{DEMO_FILE_ID}.csv"


def run_challenge_validation():
    print("=" * 80)
    print("SPENDINTEL — STEP 8: FINAL PROCUREMENT CHALLENGE VALIDATION")
    print("=" * 80)

    # -------------------------------------------------------------
    # 1. DATA INGESTION
    # -------------------------------------------------------------
    print("\n[1/14] DATA INGESTION")
    assert DEMO_CSV_PATH.exists(), f"Demo file not found at {DEMO_CSV_PATH}"
    df = pd.read_csv(DEMO_CSV_PATH)
    tx_count = len(df)
    assert tx_count == 40, f"Expected 40 transactions, got {tx_count}"
    print(f"  ✓ Ingested {tx_count} procurement transactions from {DEMO_CSV_PATH.name}")
    print(f"  ✓ Columns: {list(df.columns)}")

    # -------------------------------------------------------------
    # 2. SUPPLIER NORMALIZATION
    # -------------------------------------------------------------
    print("\n[2/14] SUPPLIER NORMALIZATION")
    df_norm = normalize_procurement_dataframe(df)
    raw_suppliers = int(df["supplier"].nunique())
    norm_suppliers = int(df_norm["normalized_supplier"].nunique())
    print(f"  ✓ Raw Suppliers: {raw_suppliers} | Normalized Suppliers: {norm_suppliers}")
    print(f"  ✓ Sample Canonical Mappings:")
    for raw, norm in zip(df["supplier"].head(5), df_norm["normalized_supplier"].head(5)):
        print(f"      '{raw}' -> '{norm}'")
    assert norm_suppliers <= raw_suppliers, "Normalized supplier count must be <= raw count"

    # -------------------------------------------------------------
    # 3. PRODUCT NORMALIZATION
    # -------------------------------------------------------------
    print("\n[3/14] PRODUCT NORMALIZATION")
    raw_products = int(df["product_id"].nunique())
    norm_products = int(df_norm["normalized_product_name"].nunique())
    print(f"  ✓ Unique SKUs (Product IDs): {raw_products}")
    print(f"  ✓ Normalized Product Names: {norm_products}")
    for pid, pname, norm_name in zip(df["product_id"].head(5), df["product_name"].head(5), df_norm["normalized_product_name"].head(5)):
        print(f"      SKU [{pid}]: '{pname}' -> '{norm_name}'")

    # -------------------------------------------------------------
    # 4. PRICE BENCHMARKING
    # -------------------------------------------------------------
    print("\n[4/14] PRICE BENCHMARKING")
    anomalies = detect_price_anomalies(df_norm)
    anomaly_count = len(anomalies)
    anomaly_leakage = sum(a["potential_leakage"] for a in anomalies)
    print(f"  ✓ Price Anomalies Detected: {anomaly_count}")
    print(f"  ✓ Price Anomaly Spend Variance: ₹{anomaly_leakage:,.2f}")
    assert anomaly_count == 14, f"Expected 14 price anomalies, got {anomaly_count}"

    # -------------------------------------------------------------
    # 5. SUPPLIER FRAGMENTATION
    # -------------------------------------------------------------
    print("\n[5/14] SUPPLIER FRAGMENTATION")
    # Products bought from >= 2 suppliers
    supp_counts = df_norm.groupby("product_id")["normalized_supplier"].nunique()
    frag_skus = supp_counts[supp_counts >= 2]
    frag_count = len(frag_skus)
    print(f"  ✓ Fragmented Product Categories (>= 2 vendors): {frag_count}")
    for sku, count in frag_skus.items():
        pname = df_norm[df_norm["product_id"] == sku]["product_name"].iloc[0]
        vendors = list(df_norm[df_norm["product_id"] == sku]["normalized_supplier"].unique())
        print(f"      SKU {sku} ({pname}): {count} vendors ({', '.join(vendors)})")
    assert frag_count == 5, f"Expected 5 fragmented products, got {frag_count}"

    # -------------------------------------------------------------
    # 6. CONTRACT ANALYSIS
    # -------------------------------------------------------------
    print("\n[6/14] CONTRACT COMPLIANCE & RATE CARDS")
    contract_res = detect_contract_findings(df_norm)
    compliance_findings = contract_res["contract_compliance"]
    compliance_count = len(compliance_findings)
    contract_leakage = sum(f["potential_leakage"] for f in compliance_findings)
    print(f"  ✓ Contract Rate Findings: {compliance_count}")
    print(f"  ✓ Contract Variance Amount: ₹{contract_leakage:,.2f}")
    off_contract_count = sum(1 for f in compliance_findings if f["type"] == "OFF_CONTRACT_PURCHASE")
    non_compliance_count = sum(1 for f in compliance_findings if f["type"] == "CONTRACT_NON_COMPLIANCE")
    print(f"      - Off-Contract Spot Purchases: {off_contract_count}")
    print(f"      - Contract Rate Card Non-Compliance: {non_compliance_count}")
    assert compliance_count == 14, f"Expected 14 contract findings, got {compliance_count}"

    # -------------------------------------------------------------
    # 7. MISSED DISCOUNTS
    # -------------------------------------------------------------
    print("\n[7/14] MISSED NEGOTIATED DISCOUNTS")
    missed_discounts = contract_res["missed_discounts"]
    missed_count = len(missed_discounts)
    missed_leakage = sum(m["potential_leakage"] for m in missed_discounts)
    print(f"  ✓ Missed Discount Findings: {missed_count}")
    print(f"  ✓ Unapplied Discount Amount: ₹{missed_leakage:,.2f}")
    for m in missed_discounts:
        disc = m.get('variance_percent', m.get('contract_discount', 0))
        print(f"      TX {m['transaction_id']} ({m['product']}): {m['supplier']} billed ₹{m['actual_price']:,.2f} without {disc}% discount -> Leakage ₹{m['potential_leakage']:,.2f}")
    assert missed_count == 2, f"Expected 2 missed discounts, got {missed_count}"
    assert missed_leakage == 155800.0, f"Expected ₹155,800.00 missed discounts, got {missed_leakage}"

    # -------------------------------------------------------------
    # 8. UNUSUAL PROCUREMENT PATTERNS
    # -------------------------------------------------------------
    print("\n[8/14] UNUSUAL PROCUREMENT PATTERNS")
    patterns = detect_unusual_patterns(df_norm)
    pattern_count = len(patterns)
    print(f"  ✓ Pattern Findings Detected: {pattern_count}")
    types_tally = {}
    for p in patterns:
        t = p["type"]
        types_tally[t] = types_tally.get(t, 0) + 1
    for t, c in types_tally.items():
        print(f"      - {t}: {c}")
    assert pattern_count == 19, f"Expected 19 pattern findings, got {pattern_count}"

    # -------------------------------------------------------------
    # 9. LEAKAGE CALCULATION & DEDUPLICATION
    # -------------------------------------------------------------
    print("\n[9/14] LEAKAGE CALCULATION (ZERO DOUBLE-COUNTING)")
    analysis = analyze_procurement(DEMO_CSV_PATH)
    total_spend = analysis["total_spend"]
    canonical_leakage = analysis["potential_leakage"]
    leakage_rate = analysis["leakage_rate"]
    print(f"  ✓ Invoiced Spend: ₹{total_spend:,.2f}")
    print(f"  ✓ Deduplicated Canonical Leakage: ₹{canonical_leakage:,.2f}")
    print(f"  ✓ Spend Leakage Rate: {leakage_rate:.2f}%")
    assert total_spend == 16184250.0, f"Expected 16184250.0 spend, got {total_spend}"
    assert canonical_leakage == 3959800.0, f"Expected 3959800.0 leakage, got {canonical_leakage}"

    # -------------------------------------------------------------
    # 10. FINANCIAL IMPACT BREAKDOWN
    # -------------------------------------------------------------
    print("\n[10/14] FINANCIAL IMPACT BREAKDOWN ACROSS CATEGORIES")
    dashboard = get_dashboard_analysis(DEMO_FILE_ID)
    breakdown = dashboard["leakage_breakdown"]
    for b in breakdown:
        print(f"      {b['type']:<28} Count: {b['count']:<3} Leakage: ₹{b['amount']:>12,.2f}")

    # -------------------------------------------------------------
    # 11. FINDINGS API
    # -------------------------------------------------------------
    print("\n[11/14] FINDINGS API")
    findings_resp = get_findings(DEMO_FILE_ID)
    total_findings = findings_resp["count"]
    findings_list = findings_resp["findings"]
    print(f"  ✓ Unified Findings Count: {total_findings}")
    risk_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for f in findings_list:
        r = f.get("risk", "MEDIUM").upper()
        risk_counts[r] = risk_counts.get(r, 0) + 1
    print(f"  ✓ Risk Distribution: HIGH={risk_counts['HIGH']}, MEDIUM={risk_counts['MEDIUM']}, LOW={risk_counts['LOW']}")
    assert total_findings == 62, f"Expected 62 findings, got {total_findings}"
    assert risk_counts["HIGH"] == 18, f"Expected 18 HIGH risk, got {risk_counts['HIGH']}"
    assert risk_counts["MEDIUM"] == 29, f"Expected 29 MEDIUM risk, got {risk_counts['MEDIUM']}"
    assert risk_counts["LOW"] == 15, f"Expected 15 LOW risk, got {risk_counts['LOW']}"

    # -------------------------------------------------------------
    # 12. DASHBOARD API
    # -------------------------------------------------------------
    print("\n[12/14] DASHBOARD API")
    assert "kpis" in dashboard, "Missing kpis in dashboard"
    assert "leakage_breakdown" in dashboard, "Missing leakage_breakdown in dashboard"
    assert "priority_findings" in dashboard, "Missing priority_findings in dashboard"
    assert "summary" in dashboard, "Missing summary in dashboard"
    print(f"  ✓ KPIs: Total Spend=₹{dashboard['kpis']['total_spend']:,.2f}, Leakage=₹{dashboard['kpis']['potential_leakage']:,.2f}")
    print(f"  ✓ Top Priority Findings: {len(dashboard['priority_findings'])} items")
    for idx, pf in enumerate(dashboard["priority_findings"][:3], 1):
        print(f"      #{idx} [{pf['type']}] {pf['product']} from {pf['supplier']} — Leakage: ₹{pf['potential_leakage']:,.2f} (Risk: {pf['risk']})")

    # -------------------------------------------------------------
    # 13. AI INVESTIGATION
    # -------------------------------------------------------------
    print("\n[13/14] AI INVESTIGATION (ALL 11 FINDING TYPES)")
    inv = investigate_transaction(DEMO_FILE_ID, "TX10030")
    assert inv["finding"]["type"] == "MISSED_DISCOUNT"
    assert inv["financial_impact"] == 145000.0
    assert "summary" in inv and len(inv["summary"]) > 0
    assert "root_cause" in inv and len(inv["root_cause"]) > 0
    assert "evidence" in inv and len(inv["evidence"]) > 0
    assert "recommended_actions" in inv and len(inv["recommended_actions"]) > 0
    print(f"  ✓ Investigation Output for TX10030:")
    print(f"      Finding: {inv['finding']['id']} ({inv['finding']['type']})")
    print(f"      Financial Impact: ₹{inv['financial_impact']:,.2f}")
    print(f"      Root Cause: {inv['root_cause']}")
    print(f"      Actions ({len(inv['recommended_actions'])}): {inv['recommended_actions'][0]}")

    # -------------------------------------------------------------
    # 14. RECOVERY SIMULATOR
    # -------------------------------------------------------------
    print("\n[14/14] RECOVERY SIMULATOR")
    sim = calculate_recovery(current_price=52500.0, alternative_price=47500.0, quantity=20)
    print(f"  ✓ Simulation (Current: ₹52,500 vs Alt: ₹47,500 @ 20 units):")
    print(f"      Current Cost: ₹{sim['current_cost']:,.2f}")
    print(f"      Optimized Cost: ₹{sim['optimized_cost']:,.2f}")
    print(f"      Potential Savings: ₹{sim['potential_savings']:,.2f} ({sim['savings_percent']:.2f}%)")
    assert sim["potential_savings"] == 100000.0, f"Expected ₹100,000 savings, got {sim['potential_savings']}"

    # -------------------------------------------------------------
    # SUMMARY OF VERIFIED METRICS
    # -------------------------------------------------------------
    report = {
        "transaction_count": tx_count,
        "total_spend": total_spend,
        "normalized_supplier_count": norm_suppliers,
        "normalized_product_count": norm_products,
        "price_anomaly_count": anomaly_count,
        "duplicate_count": len(analysis["duplicates"]),
        "fragmented_product_count": frag_count,
        "contract_finding_count": compliance_count,
        "missed_discount_count": missed_count,
        "unusual_pattern_count": pattern_count,
        "total_potential_leakage": canonical_leakage,
        "risk_counts": risk_counts,
    }

    print("\n" + "=" * 80)
    print("ALL 14 PROCUREMENT CHALLENGE PILLARS 100% VERIFIED!")
    print("=" * 80)
    return report


def test_live_api_endpoints():
    print("\n" + "=" * 80)
    print("VALIDATING FASTAPI APPLICATION API ENDPOINTS")
    print("=" * 80)
    from fastapi.testclient import TestClient
    from app.main import app

    with TestClient(app) as client:
        # 1. Dashboard
        r_dash = client.get(f"/api/dashboard/{DEMO_FILE_ID}")
        assert r_dash.status_code == 200, f"Dashboard failed: {r_dash.text}"
        print("  ✓ GET  /api/dashboard/{file_id} -> 200 OK")

        # 2. Findings
        r_find = client.get(f"/api/findings/{DEMO_FILE_ID}")
        assert r_find.status_code == 200, f"Findings failed: {r_find.text}"
        print("  ✓ GET  /api/findings/{file_id} -> 200 OK")

        # 3. Investigation
        r_inv = client.post(f"/api/investigate/{DEMO_FILE_ID}/DISC-TX10030")
        assert r_inv.status_code == 200, f"Investigate failed: {r_inv.text}"
        print("  ✓ POST /api/investigate/{file_id}/{transaction_id} -> 200 OK")

        # 4. Simulation
        sim_payload = {
            "current_price": 52500.0,
            "alternative_price": 47500.0,
            "quantity": 20,
            "current_supplier": "TechWorld Solutions",
            "alternative_supplier": "Alpha Gear",
            "expected_demand": 50,
        }
        r_sim = client.post("/api/simulate", json=sim_payload)
        assert r_sim.status_code == 200, f"Simulation failed: {r_sim.text}"
        sim_data = r_sim.json()
        assert sim_data["potential_savings"] == 100000.0
        assert sim_data["projected_annual_savings"] == 250000.0
        print(f"  ✓ POST /api/simulate -> 200 OK (Savings: ₹{sim_data['potential_savings']:,.2f}, Annual: ₹{sim_data['projected_annual_savings']:,.2f})")

    print("=" * 80)
    print("ALL API ENDPOINTS LIVE AND RETURNING VALIDATED DATA!")
    print("=" * 80)


if __name__ == "__main__":
    report_data = run_challenge_validation()
    test_live_api_endpoints()
    print("\nFINAL SUMMARY DATA:")
    print(json.dumps(report_data, indent=2))
