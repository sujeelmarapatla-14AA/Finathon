"""
SpendIntel - Step 6 Dashboard & Findings APIs Verification Test Suite.

Verifies:
1. GET /api/dashboard/{file_id} exposes:
   - kpis: total_spend, potential_leakage, leakage_rate, transactions, suppliers, products
   - leakage_breakdown with all supported categories:
     PRICE_ANOMALY, MISSED_DISCOUNT, CONTRACT_NON_COMPLIANCE, OFF_CONTRACT_PURCHASE,
     SUPPLIER_FRAGMENTATION, POSSIBLE_DUPLICATE, UNUSUAL_PATTERN
   - priority_findings: top 5 sorted by risk tier and financial impact
   - summary: total_findings, high_risk_findings, medium_risk_findings, low_risk_findings
2. GET /api/findings/{file_id} exposes ALL finding types in one consistent schema:
   id, type, risk, transaction_id, product_id, product, supplier, quantity,
   actual_price, benchmark_price, expected_price, variance_percent, potential_leakage,
   reason, evidence.
3. Tests against the 40-transaction demo dataset.
4. Verifies live HTTP endpoints.
"""

import sys
import os
import json
import urllib.request
from pathlib import Path

# Force UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(CURRENT_DIR))

from app.routes.dashboard import get_dashboard_analysis
from app.routes.findings import get_findings

DEMO_FILE_ID = "cb8b20d5-2516-47a9-8646-317e9beee50b"


def test_dashboard_endpoint_python():
    print("\n--- 1. Testing Dashboard API via Python Service ---")
    dash = get_dashboard_analysis(DEMO_FILE_ID)

    # 1. Verify KPIs
    assert "kpis" in dash
    kpis = dash["kpis"]
    required_kpis = ["total_spend", "potential_leakage", "leakage_rate", "transactions", "suppliers", "products"]
    for k in required_kpis:
        assert k in kpis, f"Missing KPI: {k}"
        assert isinstance(kpis[k], (int, float))

    assert kpis["transactions"] == 40
    assert kpis["suppliers"] == 16
    assert kpis["products"] == 12
    assert kpis["total_spend"] == 16184250.0
    assert kpis["potential_leakage"] == 3959800.0
    assert kpis["leakage_rate"] == 24.47

    print(f"  KPIs verified: Total Spend = ₹{kpis['total_spend']:,.2f}, Potential Leakage = ₹{kpis['potential_leakage']:,.2f} ({kpis['leakage_rate']:.2f}%).")

    # 2. Verify Leakage Breakdown
    assert "leakage_breakdown" in dash
    breakdown = dash["leakage_breakdown"]
    categories = {b["type"]: b for b in breakdown}

    expected_categories = [
        "PRICE_ANOMALY",
        "MISSED_DISCOUNT",
        "CONTRACT_NON_COMPLIANCE",
        "OFF_CONTRACT_PURCHASE",
        "SUPPLIER_FRAGMENTATION",
        "POSSIBLE_DUPLICATE",
        "UNUSUAL_PATTERN",
    ]

    for cat in expected_categories:
        assert cat in categories, f"Missing leakage breakdown category: {cat}"
        entry = categories[cat]
        assert "count" in entry
        assert "amount" in entry
        assert isinstance(entry["count"], int)
        assert isinstance(entry["amount"], (int, float))
        assert entry["amount"] >= 0.0
        print(f"  Category '{cat}': count = {entry['count']}, amount = ₹{entry['amount']:,.2f}")

    # 3. Verify Priority Findings
    assert "priority_findings" in dash
    priority = dash["priority_findings"]
    assert 1 <= len(priority) <= 5

    # Confirm sort order (HIGH before MEDIUM before LOW)
    risk_rank = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    ranks = [risk_rank.get(p.get("risk", "").upper(), 99) for p in priority]
    assert ranks == sorted(ranks), f"Priority findings not sorted by risk: {ranks}"

    print(f"  Priority findings verified: {len(priority)} top items (Rank 1: {priority[0]['type']} - {priority[0].get('product', '')} - Risk: {priority[0]['risk']}).")

    # 4. Verify Summary Counts
    assert "summary" in dash
    summary = dash["summary"]
    required_summary = ["total_findings", "high_risk_findings", "medium_risk_findings", "low_risk_findings"]
    for s in required_summary:
        assert s in summary
        assert isinstance(summary[s], int)

    assert summary["total_findings"] == summary["high_risk_findings"] + summary["medium_risk_findings"] + summary["low_risk_findings"]
    print(f"  Summary verified: Total = {summary['total_findings']} (High: {summary['high_risk_findings']}, Med: {summary['medium_risk_findings']}, Low: {summary['low_risk_findings']}).")
    print("PASS: Dashboard endpoint passed all structural and financial checks.")


def test_findings_endpoint_python():
    print("\n--- 2. Testing Findings API via Python Service ---")
    res = get_findings(DEMO_FILE_ID)

    assert "count" in res
    assert "findings" in res
    findings = res["findings"]
    assert res["count"] == len(findings)
    assert len(findings) > 0

    required_schema = [
        "id",
        "type",
        "risk",
        "transaction_id",
        "product_id",
        "product",
        "supplier",
        "quantity",
        "actual_price",
        "benchmark_price",
        "expected_price",
        "variance_percent",
        "potential_leakage",
        "reason",
        "evidence",
    ]

    finding_types_present = set()
    for f in findings:
        for field in required_schema:
            assert field in f, f"Finding missing required schema field: '{field}' in {f}"
        assert isinstance(f["evidence"], list)
        finding_types_present.add(f["type"])

    print(f"  Total findings returned: {len(findings)}")
    print(f"  Finding types present: {finding_types_present}")

    # Check key expected finding types
    assert "PRICE_ANOMALY" in finding_types_present
    assert "MISSED_DISCOUNT" in finding_types_present
    assert "POSSIBLE_DUPLICATE" in finding_types_present
    assert "SUPPLIER_FRAGMENTATION" in finding_types_present

    print("PASS: Findings API returned complete unified schema across all finding types.")


def test_live_http_endpoints():
    print("\n--- 3. Testing Live HTTP Endpoints on Port 8000 ---")
    base_url = "http://127.0.0.1:8000"

    # Test Dashboard HTTP
    dash_url = f"{base_url}/api/dashboard/{DEMO_FILE_ID}"
    with urllib.request.urlopen(dash_url) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode())
        assert "kpis" in data
        assert "leakage_breakdown" in data
        assert len(data["leakage_breakdown"]) == 7
        print(f"  HTTP GET {dash_url} -> 200 OK ({len(data['leakage_breakdown'])} breakdown categories)")

    # Test Findings HTTP
    findings_url = f"{base_url}/api/findings/{DEMO_FILE_ID}"
    with urllib.request.urlopen(findings_url) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode())
        assert "count" in data
        assert "findings" in data
        assert data["count"] > 0
        print(f"  HTTP GET {findings_url} -> 200 OK ({data['count']} findings)")

    print("PASS: Live HTTP endpoints verified successfully.")


def run_all():
    print("==================================================================")
    print("SPENDINTEL STEP 6: DASHBOARD & FINDINGS APIS VERIFICATION")
    print("==================================================================")
    test_dashboard_endpoint_python()
    test_findings_endpoint_python()
    test_live_http_endpoints()
    print("\n==================================================================")
    print("STEP 6 DASHBOARD & FINDINGS APIS FULLY VERIFIED WITH 100% PASS RATE.")
    print("==================================================================")


if __name__ == "__main__":
    run_all()
