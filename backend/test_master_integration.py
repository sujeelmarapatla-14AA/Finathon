"""
SpendIntel Master Integration Test Suite.

Verifies end-to-end functionality across:
1. Live Nova Procurement API integration and SpendIntel analysis.
2. Demo Dataset analysis (40-transaction baseline).
3. Findings and Supplier Intelligence endpoints across sources.
4. Deterministic and AI investigation endpoints.
5. Recovery Simulator.
6. Health and Configuration status.
"""

import os
import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.main import app


def test_master_integration():
    client = TestClient(app)
    print("==================================================")
    print("SPENDINTEL MASTER INTEGRATION TEST SUITE")
    print("==================================================")

    # 1. Health and Config
    print("\n[TEST 1] System Health & Configuration Endpoints...")
    res_health = client.get("/health")
    assert res_health.status_code == 200, f"Health check failed: {res_health.text}"
    print("  [OK] GET /health -> 200 OK:", res_health.json())

    res_config = client.get("/api/config/status")
    assert res_config.status_code == 200, f"Config status failed: {res_config.text}"
    print("  [OK] GET /api/config/status -> 200 OK:", res_config.json())

    # 2. Demo Flow
    print("\n[TEST 2] Demo Dataset Flow...")
    res_demo_dash = client.get("/api/dashboard/demo")
    assert res_demo_dash.status_code == 200, f"Demo dashboard failed: {res_demo_dash.text}"
    demo_dash = res_demo_dash.json()
    assert demo_dash.get("source") == "demo"
    assert "kpis" in demo_dash
    assert "leakage_breakdown" in demo_dash
    assert "priority_findings" in demo_dash
    print(f"  [OK] GET /api/dashboard/demo -> 200 OK | Spend: Rs.{demo_dash['kpis']['total_spend']:,.2f} | Leakage: Rs.{demo_dash['kpis']['potential_leakage']:,.2f} | Tx: {demo_dash['kpis']['transactions']}")

    res_demo_findings = client.get("/api/findings/demo")
    assert res_demo_findings.status_code == 200, f"Demo findings failed: {res_demo_findings.text}"
    demo_findings = res_demo_findings.json()
    assert "findings" in demo_findings
    print(f"  [OK] GET /api/findings/demo -> 200 OK | Count: {demo_findings['count']} findings")

    res_demo_supp = client.get("/api/suppliers/demo")
    assert res_demo_supp.status_code == 200, f"Demo suppliers failed: {res_demo_supp.text}"
    demo_supp = res_demo_supp.json()
    assert "suppliers" in demo_supp
    print(f"  [OK] GET /api/suppliers/demo -> 200 OK | Total Suppliers: {demo_supp['total_suppliers']}")

    res_demo_inv = client.post("/api/investigate/demo/TX10013")
    assert res_demo_inv.status_code == 200, f"Demo investigation failed: {res_demo_inv.text}"
    demo_inv = res_demo_inv.json()
    assert "finding" in demo_inv
    assert "evidence" in demo_inv
    assert "summary" in demo_inv
    print(f"  [OK] POST /api/investigate/demo/TX10013 -> 200 OK | Product: {demo_inv['finding']['product_name']} | Leakage: Rs.{demo_inv['financial_impact']:,.2f}")

    # 3. Live Nova Flow
    print("\n[TEST 3] Live Nova Integration Flow...")
    res_nova_dash = client.get("/api/nova/procurement")
    assert res_nova_dash.status_code == 200, f"Nova dashboard failed: {res_nova_dash.text}"
    nova_dash = res_nova_dash.json()
    assert nova_dash.get("source") == "nova"
    assert "kpis" in nova_dash
    assert "leakage_breakdown" in nova_dash
    assert "priority_findings" in nova_dash
    print(f"  [OK] GET /api/nova/procurement -> 200 OK | Total Spend: Rs.{nova_dash['kpis']['total_spend']:,.2f} | Leakage: Rs.{nova_dash['kpis']['potential_leakage']:,.2f} | Tx: {nova_dash['kpis']['transactions']} | Suppliers: {nova_dash['kpis']['suppliers']}")

    res_nova_findings = client.get("/api/nova/findings")
    assert res_nova_findings.status_code == 200, f"Nova findings failed: {res_nova_findings.text}"
    nova_findings = res_nova_findings.json()
    assert "findings" in nova_findings
    print(f"  [OK] GET /api/nova/findings -> 200 OK | Count: {nova_findings['count']} findings")

    res_nova_supp = client.get("/api/nova/suppliers")
    assert res_nova_supp.status_code == 200, f"Nova suppliers failed: {res_nova_supp.text}"
    nova_supp = res_nova_supp.json()
    assert "suppliers" in nova_supp
    print(f"  [OK] GET /api/nova/suppliers -> 200 OK | Total Suppliers: {nova_supp['total_suppliers']}")

    # Nova investigation on top priority finding
    if nova_dash["priority_findings"]:
        sample_tx = nova_dash["priority_findings"][0]["transaction_id"]
        res_nova_inv = client.post(f"/api/nova/investigate/{sample_tx}")
        assert res_nova_inv.status_code == 200, f"Nova investigation failed: {res_nova_inv.text}"
        nova_inv = res_nova_inv.json()
        assert "finding" in nova_inv
        assert "evidence" in nova_inv
        print(f"  [OK] POST /api/nova/investigate/{sample_tx} -> 200 OK | Product: {nova_inv['finding']['product_name']} | Root Cause: {nova_inv['root_cause'][:50]}...")

    # 4. Recovery Simulator Flow
    print("\n[TEST 4] Recovery Simulator Flow...")
    sim_payload = {
        "current_price": 52000,
        "alternative_price": 47500,
        "quantity": 50,
        "current_supplier": "TechWorld Solutions",
        "alternative_supplier": "Apex Strategic Supplies",
        "expected_demand": 200
    }
    res_sim = client.post("/api/simulate", json=sim_payload)
    assert res_sim.status_code == 200, f"Simulation failed: {res_sim.text}"
    sim_data = res_sim.json()
    assert sim_data["potential_savings"] == 225000.0
    assert sim_data["savings_percent"] == 8.65
    assert sim_data["projected_annual_savings"] == 900000.0
    print(f"  [OK] POST /api/simulate -> 200 OK | Savings: Rs.{sim_data['potential_savings']:,.2f} ({sim_data['savings_percent']}%) | Projected Annual: Rs.{sim_data['projected_annual_savings']:,.2f}")

    print("\n==================================================")
    print("ALL MASTER INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    test_master_integration()
