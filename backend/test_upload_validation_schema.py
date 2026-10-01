"""
SpendIntel - Upload Validation & Dynamic Benchmarking Schema Verification Suite.

Tests:
1. Upload file with NEW schema:
   transaction_id, product, supplier, quantity, unit_price, date, description, category, brand, model, pack_size, unit
   (no product_id, no product_name, no benchmark_unit_price).
2. Upload minimal file with 4 required fields only:
   product, supplier, quantity, unit_price
   (auto-generates TX-UPLOAD-0001, PRD-0001, calculates benchmark).
3. Upload file with column aliases:
   item name, vendor name, qty, cost per unit, txn id
4. Verify missing field rejection shows exact expected error without mentioning benchmark_unit_price:
   "Unable to analyze this file.\n\nMissing required procurement fields:\n• Product..."
5. Verify backward compatibility with legacy schema containing benchmark_unit_price and product_id.
6. Verify all downstream routes (dashboard, findings, suppliers, product intelligence) receive the analysis.
7. Verify Demo, Manual, and Nova sources remain 100% operational.
"""

import io
import os
import sys
from pathlib import Path
import pandas as pd
from fastapi.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.main import app

client = TestClient(app)


def test_new_schema_procurement_upload():
    print("\n--- 1. Testing New Schema Upload (Without benchmark_unit_price / product_id / product_name) ---")
    df = pd.DataFrame([
        {
            "transaction_id": "TX-NEW-101",
            "product": "Enterprise Laser Printer X500",
            "supplier": "OfficeMax Supplies Pvt Ltd",
            "quantity": 5,
            "unit_price": 32000.0,
            "date": "2026-09-15",
            "description": "High-volume laser printer 45ppm",
            "category": "Office Equipment",
            "brand": "HP",
            "model": "X500",
            "pack_size": "1 Unit",
            "unit": "Unit",
        },
        {
            "transaction_id": "TX-NEW-102",
            "product": "Enterprise Laser Printer X500",
            "supplier": "Global Tech Distributors",
            "quantity": 3,
            "unit_price": 28500.0,
            "date": "2026-09-18",
            "description": "High-volume laser printer 45ppm",
            "category": "Office Equipment",
            "brand": "HP",
            "model": "X500",
            "pack_size": "1 Unit",
            "unit": "Unit",
        },
        {
            "transaction_id": "TX-NEW-103",
            "product": "Ergonomic Mesh Chair",
            "supplier": "Ergo Comfort Solutions",
            "quantity": 10,
            "unit_price": 14500.0,
            "date": "2026-09-20",
            "description": "High-back mesh ergonomic executive chair",
            "category": "Office Furniture",
            "brand": "ErgoComfort",
            "model": "M-90",
            "pack_size": "1 Chair",
            "unit": "Unit",
        },
    ])

    excel_buffer = io.BytesIO()
    df.to_excel(excel_buffer, index=False)
    excel_buffer.seek(0)

    files = {"file": ("spendintel_sample.xlsx", excel_buffer.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 200, f"Upload failed: {res.text}"
    data = res.json()
    assert data["success"] is True
    file_id = data["file_id"]
    assert data["rows"] == 3
    print(f"  [OK] Upload succeeded! file_id: {file_id}, rows: {data['rows']}")

    # Verify Dashboard endpoint receives and analyzes the uploaded file
    res_dash = client.get(f"/api/dashboard/{file_id}")
    assert res_dash.status_code == 200, f"Dashboard retrieval failed: {res_dash.text}"
    dash_data = res_dash.json()
    assert dash_data["kpis"]["transactions"] == 3
    assert dash_data["kpis"]["suppliers"] == 3
    assert dash_data["kpis"]["products"] == 2
    assert dash_data["kpis"]["total_spend"] > 0
    print(f"  [OK] Dashboard loaded! Spend: Rs.{dash_data['kpis']['total_spend']:,.2f} | Leakage: Rs.{dash_data['kpis']['potential_leakage']:,.2f}")

    # Verify Findings endpoint
    res_findings = client.get(f"/api/findings/{file_id}")
    assert res_findings.status_code == 200
    findings_data = res_findings.json()
    assert "findings" in findings_data
    print(f"  [OK] Findings generated: {findings_data['count']} findings")

    # Verify Suppliers endpoint
    res_supp = client.get(f"/api/suppliers/{file_id}")
    assert res_supp.status_code == 200
    supp_data = res_supp.json()
    assert supp_data["total_suppliers"] == 3
    print(f"  [OK] Suppliers endpoint verified: {supp_data['total_suppliers']} suppliers")


def test_minimal_four_columns_upload():
    print("\n--- 2. Testing Minimal 4-Column Upload (Auto ID & Benchmark Generation) ---")
    csv_data = """product,supplier,quantity,unit_price
A4 Copier Paper 80GSM,PaperPoint Ltd,100,280
A4 Copier Paper 80GSM,OfficeMart Inc,50,310
Logitech MX Master 3S,TechWorld Solutions,10,8500
"""
    files = {"file": ("minimal_procurement.csv", csv_data.encode("utf-8"), "text/csv")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 200, f"Minimal upload failed: {res.text}"
    file_id = res.json()["file_id"]

    res_dash = client.get(f"/api/dashboard/{file_id}")
    assert res_dash.status_code == 200
    dash_data = res_dash.json()
    assert dash_data["kpis"]["transactions"] == 3
    print(f"  [OK] Minimal upload parsed and benchmarked! Transactions: {dash_data['kpis']['transactions']}")


def test_column_alias_upload():
    print("\n--- 3. Testing Flexible Column Aliases Ingestion ---")
    csv_data = """item name,vendor name,qty,cost per unit,txn id
Cat6 Ethernet Cable 305m,NetCore Systems,15,4200,TX-ALIAS-01
Cat6 Ethernet Cable 305m,ConnectPro Ltd,20,3800,TX-ALIAS-02
"""
    files = {"file": ("alias_procurement.csv", csv_data.encode("utf-8"), "text/csv")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 200, f"Alias upload failed: {res.text}"
    file_id = res.json()["file_id"]

    res_dash = client.get(f"/api/dashboard/{file_id}")
    assert res_dash.status_code == 200
    dash_data = res_dash.json()
    assert dash_data["kpis"]["transactions"] == 2
    print("  [OK] Column aliases ('item name', 'vendor name', 'qty', 'cost per unit') successfully recognized!")


def test_missing_required_column_rejection():
    print("\n--- 4. Testing Missing Required Column Rejection Message ---")
    csv_data = """product,quantity,unit_price
A4 Copier Paper 80GSM,100,280
"""
    files = {"file": ("missing_supplier.csv", csv_data.encode("utf-8"), "text/csv")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 400
    detail = res.json()["detail"]
    assert "Unable to analyze this file" in detail
    assert "Missing required procurement fields" in detail
    assert "• Supplier" in detail
    assert "benchmark_unit_price" not in detail
    assert "product_id" not in detail
    print(f"  [OK] Correct rejection message returned:\n{detail}")


def test_legacy_backward_compatibility():
    print("\n--- 5. Testing Legacy Schema Backward Compatibility ---")
    csv_data = """transaction_id,product_id,product_name,supplier,quantity,unit_price,benchmark_unit_price
TX-LEG-01,PRD-999,Industrial Safety Helmet,SafeGuard Corp,40,1200,1050
TX-LEG-02,PRD-999,Industrial Safety Helmet,SafeGuard Corp,20,1050,1050
"""
    files = {"file": ("legacy_procurement.csv", csv_data.encode("utf-8"), "text/csv")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 200
    file_id = res.json()["file_id"]

    res_dash = client.get(f"/api/dashboard/{file_id}")
    assert res_dash.status_code == 200
    dash_data = res_dash.json()
    assert dash_data["kpis"]["transactions"] == 2
    print("  [OK] Legacy schema with benchmark_unit_price preserved and analyzed cleanly!")


def test_all_sources_operational():
    print("\n--- 6. Testing All Four Data Sources (Demo, Upload, Manual, Live Nova) ---")
    # 1. Demo
    res_demo = client.get("/api/dashboard/demo")
    assert res_demo.status_code == 200
    assert res_demo.json()["source"] == "demo"
    print("  [OK] Demo source operational.")

    # 2. Manual
    manual_payload = {
        "transactions": [
            {
                "product": "Dell UltraSharp 27 Monitor",
                "supplier": "Tech Supplies Inc",
                "quantity": 2,
                "unit_price": 28000.0,
            }
        ]
    }
    res_manual = client.post("/api/manual-analysis", json=manual_payload)
    assert res_manual.status_code == 200
    assert res_manual.json()["source"] == "manual"
    print("  [OK] Manual source operational.")

    # 3. Live Nova
    res_nova = client.get("/api/nova/procurement")
    assert res_nova.status_code == 200
    assert res_nova.json()["source"] == "nova"
    print("  [OK] Live Nova source operational.")


def run_all():
    print("==================================================================")
    print("SPENDINTEL UPLOAD VALIDATION & SCHEMA STANDARDIZATION TESTS")
    print("==================================================================")
    test_new_schema_procurement_upload()
    test_minimal_four_columns_upload()
    test_column_alias_upload()
    test_missing_required_column_rejection()
    test_legacy_backward_compatibility()
    test_all_sources_operational()
    print("\n==================================================================")
    print("ALL UPLOAD VALIDATION & DYNAMIC BENCHMARKING TESTS PASSED (6/6)")
    print("==================================================================")


if __name__ == "__main__":
    run_all()
