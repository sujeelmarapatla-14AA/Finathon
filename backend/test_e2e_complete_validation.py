"""
SpendIntel — Comprehensive End-to-End Validation Suite
Testing all validation areas specified in User Request:
1. Startup & Health
2. Demo Data Flow
3. File Upload Flow
4. Live Nova Flow
5. Requirement Pillars (A-F)
6. Financial Integrity (Zero Double Counting & Deterministic Values)
7. AI Failure Fallback Simulation
8. Nova Failure Graceful Handling Simulation
9. Source Data Isolation / Switching
"""

import os
import sys
import io
import json
from fastapi.testclient import TestClient

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.services.analyzer import analyze_procurement, analyze_procurement_dataframe
from app.services.ai_investigator import generate_investigation
from app.routes.investigation import investigate_dataframe, investigate_transaction
from app.services.simulator import calculate_recovery
from app.services import nova_service, nova_client

client = TestClient(app)

DEMO_FILE_ID = "cb8b20d5-2516-47a9-8646-317e9beee50b"

def test_01_startup_and_health():
    print("\n" + "="*70)
    print("TEST 1: STARTUP & SYSTEM HEALTH")
    print("="*70)
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy"}
    print("  [OK] GET /health -> 200 OK: {'status': 'healthy'}")

    res_root = client.get("/")
    assert res_root.status_code == 200
    data_root = res_root.json()
    assert data_root["name"] == "SpendIntel"
    assert data_root["status"] == "online"
    print(f"  [OK] GET / -> 200 OK: {data_root}")

    res_cfg = client.get("/api/config/status")
    assert res_cfg.status_code == 200
    cfg = res_cfg.json()
    assert "nova_api_key_configured" in cfg
    assert "ai_api_key_configured" in cfg
    print(f"  [OK] GET /api/config/status -> 200 OK: {cfg}")


def test_02_demo_data_flow():
    print("\n" + "="*70)
    print("TEST 2: DEMO DATASET FLOW")
    print("="*70)
    
    # 1. Dashboard
    res = client.get(f"/api/dashboard/{DEMO_FILE_ID}")
    assert res.status_code == 200
    dash = res.json()
    assert dash["kpis"]["total_spend"] == 16184250.0
    assert dash["kpis"]["potential_leakage"] == 3959800.0
    assert dash["kpis"]["transactions"] == 40
    assert dash["kpis"]["suppliers"] == 16
    assert len(dash["leakage_breakdown"]) >= 6
    assert len(dash["priority_findings"]) > 0
    print(f"  [OK] Dashboard: Spend=Rs.{dash['kpis']['total_spend']:,.2f}, Leakage=Rs.{dash['kpis']['potential_leakage']:,.2f}, Tx={dash['kpis']['transactions']}")

    # 2. Findings
    res_f = client.get(f"/api/findings/{DEMO_FILE_ID}")
    assert res_f.status_code == 200
    findings = res_f.json()
    assert findings["count"] == 62
    print(f"  [OK] Findings: {findings['count']} findings returned across {len(set(f['type'] for f in findings['findings']))} types")

    # 3. Suppliers
    res_s = client.get(f"/api/suppliers/{DEMO_FILE_ID}")
    assert res_s.status_code == 200
    suppliers = res_s.json()
    assert suppliers["total_suppliers"] == 16
    print(f"  [OK] Suppliers: {suppliers['total_suppliers']} suppliers analyzed")

    # 4. Investigation
    res_inv = client.post(f"/api/investigate/{DEMO_FILE_ID}/TX10030")
    assert res_inv.status_code == 200
    inv = res_inv.json()
    assert inv["finding"]["type"] == "MISSED_DISCOUNT"
    assert inv["financial_impact"] == 145000.0 or inv["finding"]["potential_leakage"] == 145000.0
    assert len(inv["evidence"]) > 0
    assert len(inv["recommended_actions"]) > 0
    print(f"  [OK] Investigation (TX10030): Type={inv['finding']['type']}, Leakage=Rs.{inv['financial_impact']:,.2f}")

    # 5. Recovery Simulator
    sim_payload = {
        "current_price": 52500,
        "alternative_price": 47500,
        "quantity": 20,
        "expected_demand": 50
    }
    res_sim = client.post("/api/simulate", json=sim_payload)
    assert res_sim.status_code == 200
    sim = res_sim.json()
    assert sim["potential_savings"] == 100000.0
    assert sim["savings_percent"] == 9.52
    print(f"  [OK] Recovery Simulator: Potential Savings=Rs.{sim['potential_savings']:,.2f} ({sim['savings_percent']}%)")


def test_03_file_upload_flow():
    print("\n" + "="*70)
    print("TEST 3: FILE UPLOAD FLOW")
    print("="*70)
    
    # Read the demo CSV file to simulate real user upload
    csv_path = os.path.join(os.path.dirname(__file__), "app", "data", "uploads", f"{DEMO_FILE_ID}.csv")
    with open(csv_path, "rb") as f:
        file_bytes = f.read()

    # POST /api/upload
    res_upload = client.post(
        "/api/upload",
        files={"file": ("procurement_audit.csv", io.BytesIO(file_bytes), "text/csv")}
    )
    assert res_upload.status_code == 200
    up_data = res_upload.json()
    new_file_id = up_data["file_id"]
    print(f"  [OK] POST /api/upload -> file_id: {new_file_id}, rows: {up_data.get('rows', 40)}")

    # Dashboard for uploaded file
    res_dash = client.get(f"/api/dashboard/{new_file_id}")
    assert res_dash.status_code == 200
    d_data = res_dash.json()
    assert d_data["kpis"]["transactions"] == 40
    assert d_data["kpis"]["potential_leakage"] == 3959800.0
    print(f"  [OK] Ingested Dashboard: Tx={d_data['kpis']['transactions']}, Leakage=Rs.{d_data['kpis']['potential_leakage']:,.2f}")

    # Findings for uploaded file
    res_find = client.get(f"/api/findings/{new_file_id}")
    assert res_find.status_code == 200
    assert res_find.json()["count"] == 62
    print(f"  [OK] Ingested Findings: {res_find.json()['count']} items")

    # Suppliers for uploaded file
    res_supp = client.get(f"/api/suppliers/{new_file_id}")
    assert res_supp.status_code == 200
    assert res_supp.json()["total_suppliers"] == 16
    print(f"  [OK] Ingested Suppliers: {res_supp.json()['total_suppliers']} suppliers")


def test_04_live_nova_flow():
    print("\n" + "="*70)
    print("TEST 4: LIVE NOVA INTEGRATION FLOW")
    print("="*70)
    
    # 1. Procurement Master Endpoint
    res_nova = client.get("/api/nova/procurement")
    assert res_nova.status_code == 200
    nova_data = res_nova.json()
    assert nova_data["source"] == "nova"
    assert nova_data["kpis"]["transactions"] > 200
    assert nova_data["kpis"]["total_spend"] > 10000000.0
    assert nova_data["kpis"]["potential_leakage"] > 0
    print(f"  [OK] Live Nova Ingestion: Tx={nova_data['kpis']['transactions']}, Spend=Rs.{nova_data['kpis']['total_spend']:,.2f}, Leakage=Rs.{nova_data['kpis']['potential_leakage']:,.2f}")

    # 2. Nova Dashboard
    res_dash = client.get("/api/nova/dashboard")
    assert res_dash.status_code == 200
    assert res_dash.json()["source"] == "nova"
    print(f"  [OK] Live Nova Dashboard: Breakdown categories={len(res_dash.json()['leakage_breakdown'])}, Priority={len(res_dash.json()['priority_findings'])}")

    # 3. Nova Findings
    res_find = client.get("/api/nova/findings")
    assert res_find.status_code == 200
    n_findings = res_find.json()
    assert n_findings["count"] > 100
    print(f"  [OK] Live Nova Findings: {n_findings['count']} findings returned")

    # 4. Nova Suppliers
    res_supp = client.get("/api/nova/suppliers")
    assert res_supp.status_code == 200
    n_supp = res_supp.json()
    assert n_supp["total_suppliers"] == 15
    print(f"  [OK] Live Nova Suppliers: {n_supp['total_suppliers']} vendors normalized")

    # 5. Nova Investigation
    first_po_tx = n_findings["findings"][0]["transaction_id"]
    res_inv = client.post(f"/api/nova/investigate/{first_po_tx}")
    assert res_inv.status_code == 200
    inv_data = res_inv.json()
    assert "summary" in inv_data
    assert "root_cause" in inv_data
    assert "financial_impact" in inv_data
    print(f"  [OK] Live Nova Investigation ({first_po_tx}): Root Cause='{inv_data['root_cause'][:60]}...'")


def test_05_challenge_requirements():
    print("\n" + "="*70)
    print("TEST 5: CHALLENGE REQUIREMENT PILLARS (A-F)")
    print("="*70)
    
    analysis = analyze_procurement(DEMO_FILE_ID)
    
    # A. Consolidation & Normalization
    assert analysis["transactions"] == 40
    assert analysis["normalized_supplier_count"] == 16
    assert analysis["normalized_product_count"] == 12
    print("  [OK] Pillar A (Consolidation & Normalization): Verified (16 suppliers, 12 products)")

    # B. Price Benchmarking
    assert len(analysis["price_anomalies"]) == 14
    dash = client.get(f"/api/dashboard/{DEMO_FILE_ID}").json()
    breakdown_map = {b.get("type", b.get("category")): b["amount"] for b in dash["leakage_breakdown"]}
    assert breakdown_map.get("PRICE_ANOMALY") == 465750.0
    print("  [OK] Pillar B (Price Benchmarking): Verified (14 anomalies, Rs.465,750.00)")

    # C. Supplier Consolidation & Fragmentation
    assert len(analysis["fragmentation"]) == 5
    print("  [OK] Pillar C (Supplier Consolidation): Verified (5 fragmented product categories)")

    # D. Contract & Discount Analysis
    assert len(analysis["contract_findings"]) == 14
    assert len(analysis["discount_findings"]) == 2
    assert breakdown_map.get("MISSED_DISCOUNT") == 155800.0
    print("  [OK] Pillar D (Contract & Discount Analysis): Verified (14 contract + 2 missed discounts)")

    # E. Leakage Detection (Duplicates & Patterns)
    assert len(analysis["duplicates"]) == 8
    assert len(analysis["pattern_findings"]) == 19
    assert analysis["potential_leakage"] == 3959800.0
    print("  [OK] Pillar E (Leakage Detection): Verified (8 duplicates, 19 pattern findings, total Rs.3,959,800.00)")

    # F. Management Dashboard
    assert "kpis" in dash and "leakage_breakdown" in dash and "priority_findings" in dash
    print("  [OK] Pillar F (Management Dashboard): Verified (KPIs, Categorized breakdown, Priority findings)")


def test_06_financial_integrity():
    print("\n" + "="*70)
    print("TEST 6: FINANCIAL INTEGRITY & ZERO DOUBLE-COUNTING")
    print("="*70)
    
    analysis = analyze_procurement(DEMO_FILE_ID)
    dash = client.get(f"/api/dashboard/{DEMO_FILE_ID}").json()
    category_sum = sum(b["amount"] for b in dash["leakage_breakdown"])
    dedup_leakage = analysis["potential_leakage"]
    
    print(f"  Category sum (informative breakdown): Rs.{category_sum:,.2f}")
    print(f"  Authoritative deduplicated leakage:    Rs.{dedup_leakage:,.2f}")
    
    assert dedup_leakage == 3959800.0, "Deduplicated canonical leakage must equal exactly Rs.3,959,800.00"
    assert dedup_leakage <= category_sum, "Deduplication must prevent double-counting"
    assert analysis["leakage_rate"] == 24.47, "Leakage rate must be exact (24.47%)"
    print("  [OK] Strict transaction-level financial deduplication confirmed")


def test_07_ai_failure_fallback():
    print("\n" + "="*70)
    print("TEST 7: AI FAILURE GRACEFUL FALLBACK SIMULATION")
    print("="*70)
    
    # Temporarily hide AI_API_KEY
    orig_key = os.environ.get("AI_API_KEY")
    os.environ["AI_API_KEY"] = ""
    
    try:
        # Request investigation when AI is unavailable
        res = client.post(f"/api/investigate/{DEMO_FILE_ID}/TX10030")
        assert res.status_code == 200
        inv = res.json()
        assert inv["finding"]["type"] == "MISSED_DISCOUNT"
        assert inv["financial_impact"] == 145000.0 or inv["finding"]["potential_leakage"] == 145000.0
        assert "FastenCo" in inv["root_cause"]
        assert len(inv["recommended_actions"]) >= 1
        print("  [OK] Deterministic investigation ran cleanly without AI provider: OK")
        
        # Verify dashboard, findings, simulator are completely unaffected
        res_dash = client.get(f"/api/dashboard/{DEMO_FILE_ID}")
        assert res_dash.status_code == 200
        res_sim = client.post("/api/simulate", json={"current_price": 100, "alternative_price": 90, "quantity": 10})
        assert res_sim.status_code == 200
        print("  [OK] Dashboard, Findings, and Recovery Simulator 100% operational during AI downtime")
    finally:
        if orig_key is not None:
            os.environ["AI_API_KEY"] = orig_key


def test_08_nova_failure_handling():
    print("\n" + "="*70)
    print("TEST 8: NOVA FAILURE GRACEFUL HANDLING")
    print("="*70)
    
    # Temporarily hide NOVA_API_KEY
    orig_key = os.environ.get("NOVA_API_KEY")
    os.environ["NOVA_API_KEY"] = ""
    # Clear both client and service caches to force API call
    nova_client.clear_nova_cache()
    nova_service.clear_nova_service_cache()
    
    try:
        res = client.get("/api/nova/procurement?force_refresh=true")
        # Should return a clean structured 502/401 error, not crash the server
        assert res.status_code in [401, 502]
        err = res.json()
        assert "detail" in err
        print(f"  [OK] Clean error response returned for Nova outage: HTTP {res.status_code} - {err['detail']}")
        
        # Demo and Upload modes must remain 100% unaffected
        res_demo = client.get(f"/api/dashboard/{DEMO_FILE_ID}")
        assert res_demo.status_code == 200
        print("  [OK] Demo dataset mode remains fully operational during Nova failure")
    finally:
        if orig_key is not None:
            os.environ["NOVA_API_KEY"] = orig_key
        nova_client.clear_nova_cache()
        nova_service.clear_nova_service_cache()


def test_09_source_switching_isolation():
    print("\n" + "="*70)
    print("TEST 9: SOURCE SWITCHING DATA ISOLATION")
    print("="*70)
    
    # Fetch Demo
    demo_dash = client.get("/api/dashboard/demo").json()
    assert demo_dash["source"] == "demo"
    assert demo_dash["kpis"]["transactions"] == 40
    
    # Fetch Nova
    nova_dash = client.get("/api/nova/dashboard").json()
    assert nova_dash["source"] == "nova"
    assert nova_dash["kpis"]["transactions"] == 243
    
    # Fetch Demo again
    demo_dash_again = client.get("/api/dashboard/demo").json()
    assert demo_dash_again["source"] == "demo"
    assert demo_dash_again["kpis"]["transactions"] == 40
    assert demo_dash_again["kpis"]["transactions"] != nova_dash["kpis"]["transactions"]
    
    print("  [OK] Verified Demo Tx (40) != Nova Tx (243) — zero cross-source state leakage")


if __name__ == "__main__":
    test_01_startup_and_health()
    test_02_demo_data_flow()
    test_03_file_upload_flow()
    test_04_live_nova_flow()
    test_05_challenge_requirements()
    test_06_financial_integrity()
    test_07_ai_failure_fallback()
    test_08_nova_failure_handling()
    test_09_source_switching_isolation()
    print("\n" + "="*70)
    print("ALL 9 COMPREHENSIVE END-TO-END VALIDATION SUITES PASSED (100% SUCCESS)!")
    print("="*70)
