"""
LeakGuard AI - End-to-End Backend Verification Script.

Tests the complete flow across all four core endpoints:
1. POST /api/upload
2. GET /api/dashboard/{file_id}
3. GET /api/findings/{file_id}
4. POST /api/simulate

Also verifies error handling for missing/invalid files and inputs.
"""

import io
import json
import sys
import uuid
from typing import Any, Dict

# Reconfigure stdout for Unicode / currency symbols on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient

# Ensure backend package can be imported
sys.path.insert(0, ".")
try:
    from app.main import app
except ImportError:
    from backend.app.main import app


DEMO_PROCUREMENT_CSV = """transaction_id,product_id,product_name,supplier,quantity,unit_price,benchmark_unit_price
TX-001,P-100,Industrial Laptop,TechWorld,100,52000,47500
TX-002,P-101,Toner Cartridge,ABC Traders,10,7000,6450
TX-003,P-200,Hydraulic Seal,Delta Ind,12,15800,15800
TX-004,P-200,Hydraulic Seal,Delta Ind,12,15800,15800
TX-005,P-300,Fasteners M12,Vendor A,100,50,50
TX-006,P-300,Fasteners M12,Vendor B,100,52,50
TX-007,P-300,Fasteners M12,Vendor C,100,49,50
TX-008,P-400,Safety Helmet,SafeCo,10,1000,1000
"""


def run_verification() -> Dict[str, Any]:
    client = TestClient(app)

    print("=" * 60)
    print("LEAKGUARD AI - BACKEND END-TO-END VERIFICATION")
    print("=" * 60)

    # 1. Endpoint Registration Check
    print("\n[STEP 1] Verifying Endpoint Registrations...")
    registered_routes = list(app.openapi()["paths"].keys())
    required_routes = [
        "/api/upload",
        "/api/dashboard/{file_id}",
        "/api/findings/{file_id}",
        "/api/simulate",
        "/api/investigate/{file_id}/{transaction_id}",
        "/api/suppliers/{file_id}",
    ]
    for r in required_routes:
        assert r in registered_routes, f"Missing route: {r}"
        print(f"  [OK] Endpoint registered: {r}")

    # 2. Upload Procurement CSV
    print("\n[STEP 2] Testing POST /api/upload with valid procurement CSV...")
    csv_bytes = DEMO_PROCUREMENT_CSV.encode("utf-8")
    upload_resp = client.post(
        "/api/upload",
        files={"file": ("demo_procurement.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    print(f"  Upload response status: {upload_resp.status_code}")
    assert upload_resp.status_code == 200, f"Upload failed: {upload_resp.text}"
    upload_data = upload_resp.json()
    assert upload_data.get("success") is True
    file_id = upload_data.get("file_id")
    print(f"  [OK] Upload Success: True")
    print(f"  [OK] Received file_id: {file_id}")
    print(f"  [OK] Parsed rows: {upload_data.get('rows')}")
    print(f"  [OK] Extracted columns: {upload_data.get('columns')}")

    # 3. Request /api/dashboard/{file_id}
    print(f"\n[STEP 3] Requesting GET /api/dashboard/{file_id}...")
    dashboard_resp = client.get(f"/api/dashboard/{file_id}")
    print(f"  Dashboard response status: {dashboard_resp.status_code}")
    assert dashboard_resp.status_code == 200, f"Dashboard failed: {dashboard_resp.text}"
    dashboard_data = dashboard_resp.json()

    transactions_count = dashboard_data.get("transactions", 0)
    total_spend = dashboard_data.get("total_spend", 0.0)
    potential_leakage = dashboard_data.get("potential_leakage", 0.0)
    leakage_rate = dashboard_data.get("leakage_rate", 0.0)
    price_anomalies = dashboard_data.get("price_anomalies", [])
    duplicates = dashboard_data.get("duplicates", [])
    fragmentation = dashboard_data.get("fragmentation", [])

    print(f"  [OK] Transactions analyzed: {transactions_count}")
    print(f"  [OK] Total spend: {total_spend}")
    print(f"  [OK] Potential leakage: {potential_leakage}")
    print(f"  [OK] Leakage rate: {leakage_rate}%")
    print(f"  [OK] Price anomalies count: {len(price_anomalies)}")
    print(f"  [OK] Duplicates count: {len(duplicates)}")
    print(f"  [OK] Fragmented suppliers count: {len(fragmentation)}")

    # 4. Request /api/findings/{file_id}
    print(f"\n[STEP 4] Requesting GET /api/findings/{file_id}...")
    findings_resp = client.get(f"/api/findings/{file_id}")
    print(f"  Findings response status: {findings_resp.status_code}")
    assert findings_resp.status_code == 200, f"Findings failed: {findings_resp.text}"
    findings_data = findings_resp.json()
    findings_list = findings_data.get("findings", [])
    findings_count = findings_data.get("count", 0)

    print(f"  [OK] Total findings count: {findings_count}")
    detection_types = {f.get("detection_type") for f in findings_list}
    print(f"  [OK] Detection types found: {detection_types}")

    assert "PRICE_ANOMALY" in detection_types, "Missing PRICE_ANOMALY detection type"
    assert "POSSIBLE_DUPLICATE" in detection_types, "Missing POSSIBLE_DUPLICATE detection type"
    assert "SUPPLIER_FRAGMENTATION" in detection_types, "Missing SUPPLIER_FRAGMENTATION detection type"

    # 5. Confirm analyzer detects price anomalies & calculates potential leakage
    print("\n[STEP 5] Validating Price Anomalies & Leakage Computations...")
    assert len(price_anomalies) > 0, "No price anomalies detected!"
    assert potential_leakage > 0.0, "Potential leakage calculation returned 0!"
    print(f"  [OK] Price anomalies detected: {len(price_anomalies)} transactions")
    for pa in price_anomalies:
        print(f"       - {pa['transaction_id']} ({pa['product']}): variance={pa['variance_percent']}%, leakage={pa['potential_leakage']}")

    # 6. Test POST /api/simulate
    print("\n[STEP 6] Testing POST /api/simulate...")
    sim_resp = client.post(
        "/api/simulate",
        json={"current_price": 52000.0, "alternative_price": 47500.0, "quantity": 50},
    )
    print(f"  Simulation response status: {sim_resp.status_code}")
    assert sim_resp.status_code == 200, f"Simulation failed: {sim_resp.text}"
    sim_data = sim_resp.json()
    print(f"  [OK] Simulation result: {sim_data}")
    assert sim_data["potential_savings"] == 225000.0
    assert sim_data["savings_percent"] == 8.65

    # 7. Test POST /api/investigate/{file_id}/{transaction_id}
    print(f"\n[STEP 7] Testing POST /api/investigate/{file_id}/TX-001...")
    inv_resp = client.post(f"/api/investigate/{file_id}/TX-001")
    print(f"  Investigation response status: {inv_resp.status_code}")
    assert inv_resp.status_code == 200, f"Investigation failed: {inv_resp.text}"
    inv_data = inv_resp.json()
    assert "finding" in inv_data and "evidence" in inv_data and "analyst_summary" in inv_data
    assert len(inv_data["evidence"]) == 4
    print(f"  [OK] Finding: {inv_data['finding']['transaction_id']} ({inv_data['finding']['risk']} risk)")
    print(f"  [OK] Evidence steps: {len(inv_data['evidence'])}")
    print(f"  [OK] Analyst summary: {inv_data['analyst_summary']}")

    # 8. Test GET /api/suppliers/{file_id}
    print(f"\n[STEP 8] Testing GET /api/suppliers/{file_id}...")
    supp_resp = client.get(f"/api/suppliers/{file_id}")
    print(f"  Suppliers response status: {supp_resp.status_code}")
    assert supp_resp.status_code == 200, f"Suppliers failed: {supp_resp.text}"
    supp_data = supp_resp.json()
    assert "suppliers" in supp_data and "total_suppliers" in supp_data
    print(f"  [OK] Total suppliers: {supp_data['total_suppliers']}")
    for s in supp_data["suppliers"][:3]:
        print(f"       - {s['supplier']}: spend=₹{s['total_spend']:,.2f}, leakage=₹{s['potential_leakage']:,.2f}, risk={s['risk']}")

    # 9. Test Error Handling
    print("\n[STEP 9] Testing Error Handling for invalid/missing files...")
    dummy_uuid = str(uuid.uuid4())

    # 404 for missing dashboard file
    d_404 = client.get(f"/api/dashboard/{dummy_uuid}")
    print(f"  Missing dashboard file status: {d_404.status_code}")
    assert d_404.status_code == 404

    # 404 for missing findings file
    f_404 = client.get(f"/api/findings/{dummy_uuid}")
    print(f"  Missing findings file status: {f_404.status_code}")
    assert f_404.status_code == 404

    # 400 for unsupported upload extension
    bad_upload = client.post(
        "/api/upload",
        files={"file": ("unsupported.txt", io.BytesIO(b"hello world"), "text/plain")},
    )
    print(f"  Unsupported file upload status: {bad_upload.status_code}")
    assert bad_upload.status_code == 400

    # 400 for malformed CSV missing required columns
    bad_csv_bytes = b"col_a,col_b\nval1,val2\n"
    bad_csv_upload = client.post(
        "/api/upload",
        files={"file": ("bad_schema.csv", io.BytesIO(bad_csv_bytes), "text/csv")},
    )
    assert bad_csv_upload.status_code == 200
    bad_file_id = bad_csv_upload.json().get("file_id")
    bad_dash = client.get(f"/api/dashboard/{bad_file_id}")
    print(f"  Missing columns dashboard status: {bad_dash.status_code} ({bad_dash.json().get('detail')})")
    assert bad_dash.status_code == 400

    # 422 for invalid simulation inputs
    sim_422 = client.post(
        "/api/simulate",
        json={"current_price": -50.0, "alternative_price": 40.0, "quantity": 0},
    )
    print(f"  Invalid simulation inputs status: {sim_422.status_code}")
    assert sim_422.status_code == 422

    print("\n" + "=" * 60)
    print("ALL BACKEND VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    print("=" * 60)

    report = {
        "upload_status": "Success (200 OK)",
        "file_id": file_id,
        "transaction_count": transactions_count,
        "total_spend": total_spend,
        "potential_leakage": potential_leakage,
        "leakage_rate": f"{leakage_rate}%",
        "number_of_findings": findings_count,
        "number_of_price_anomalies": len(price_anomalies),
        "number_of_duplicates": len(duplicates),
        "number_of_fragmented_suppliers": len(fragmentation),
    }

    return report


if __name__ == "__main__":
    report = run_verification()
    print("\n--- FINAL REPORT SUMMARY ---")
    print(json.dumps(report, indent=2))
