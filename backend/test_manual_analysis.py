import sys
from fastapi.testclient import TestClient
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.main import app

client = TestClient(app)

def test_manual_analysis_single_transaction():
    payload = {
        "transactions": [
            {
                "transaction_id": "TX-10025",
                "product_name": "Industrial Laptop",
                "supplier": "TechWorld Solutions",
                "quantity": 20,
                "unit_price": 52500,
                "benchmark_unit_price": 47500,
                "product_id": "LAPTOP-IND-01",
                "transaction_date": "2026-03-15",
                "po_number": "PO-8821",
                "department": "IT & Infrastructure",
                "procurement_channel": "Off-Contract",
                "contract_price": 48000,
                "contract_discount": 5,
            }
        ]
    }
    res = client.post("/api/manual-analysis", json=payload)
    print("Status code:", res.status_code)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["success"] is True
    assert data["source"] == "manual"
    assert data["source_label"] == "MANUAL DATA"
    assert data["rows"] == 1
    assert data["transactions"] == 1
    assert data["total_spend"] == 20 * 52500
    file_id = data["file_id"]
    print(f"Manual file_id: {file_id}")
    print(f"Total spend: {data['total_spend']}")
    print(f"Potential leakage: {data['potential_leakage']}")

    # Test dashboard endpoint retrieval with the manual file_id
    dash_res = client.get(f"/api/dashboard/{file_id}")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["source"] == "manual"
    assert dash_data["source_label"] == "MANUAL DATA"

    # Test findings endpoint retrieval with manual file_id
    find_res = client.get(f"/api/findings/{file_id}")
    assert find_res.status_code == 200
    find_data = find_res.json()
    assert find_data["source"] == "manual"

    # Test suppliers endpoint retrieval with manual file_id
    supp_res = client.get(f"/api/suppliers/{file_id}")
    assert supp_res.status_code == 200
    supp_data = supp_res.json()
    assert supp_data["source"] == "manual"

    print("ALL MANUAL ANALYSIS CHECKS PASSED FOR SINGLE TRANSACTION!")

def test_manual_analysis_validation_errors():
    # Missing required supplier
    bad_payload_1 = {
        "transactions": [
            {
                "transaction_id": "TX-1",
                "product_name": "Paper",
                "supplier": "",
                "quantity": 10,
                "unit_price": 100,
                "benchmark_unit_price": 80,
            }
        ]
    }
    res1 = client.post("/api/manual-analysis", json=bad_payload_1)
    assert res1.status_code == 400
    print("Empty supplier validation check passed:", res1.json()["detail"])

    # Zero quantity
    bad_payload_2 = {
        "transactions": [
            {
                "transaction_id": "TX-1",
                "product_name": "Paper",
                "supplier": "Vendor A",
                "quantity": 0,
                "unit_price": 100,
                "benchmark_unit_price": 80,
            }
        ]
    }
    res2 = client.post("/api/manual-analysis", json=bad_payload_2)
    assert res2.status_code == 400
    print("Zero quantity validation check passed:", res2.json()["detail"])

    # Negative price
    bad_payload_3 = {
        "transactions": [
            {
                "transaction_id": "TX-1",
                "product_name": "Paper",
                "supplier": "Vendor A",
                "quantity": 10,
                "unit_price": -50,
                "benchmark_unit_price": 80,
            }
        ]
    }
    res3 = client.post("/api/manual-analysis", json=bad_payload_3)
    assert res3.status_code == 400
    print("Negative price validation check passed:", res3.json()["detail"])

    print("ALL VALIDATION ERROR CHECKS PASSED!")

def test_manual_analysis_multiple_transactions():
    payload = {
        "transactions": [
            {
                "transaction_id": "TX-01",
                "product_name": "Industrial Laptop",
                "supplier": "TechWorld Solutions",
                "quantity": 20,
                "unit_price": 52500,
                "benchmark_unit_price": 47500,
            },
            {
                "transaction_id": "TX-02",
                "product_name": "A4 Copy Paper",
                "supplier": "OfficeMart",
                "quantity": 1000,
                "unit_price": 315,
                "benchmark_unit_price": 285,
            },
            {
                "transaction_id": "TX-03",
                "product_name": "Ergonomic Office Chair",
                "supplier": "FurniCorp",
                "quantity": 50,
                "unit_price": 14200,
                "benchmark_unit_price": 12500,
            }
        ]
    }
    res = client.post("/api/manual-analysis", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["rows"] == 3
    assert data["transactions"] == 3
    expected_spend = (20 * 52500) + (1000 * 315) + (50 * 14200)
    assert data["total_spend"] == expected_spend
def test_manual_analysis_10_transactions():
    txs = []
    for i in range(1, 11):
        txs.append({
            "transaction_id": f"TX-M-{i:03d}",
            "product_name": f"Commodity Item {i}",
            "supplier": f"Supplier {((i % 3) + 1)}",
            "quantity": 10 * i,
            "unit_price": 1000 + (i * 100),
            "benchmark_unit_price": 950 + (i * 80),
        })
    res = client.post("/api/manual-analysis", json={"transactions": txs})
    assert res.status_code == 200
    data = res.json()
    assert data["rows"] == 10
    assert data["transactions"] == 10
    print("10-transaction manual analysis passed successfully!")

def test_source_switching_cleanliness():
    # Demo
    demo_dash = client.get("/api/dashboard/demo").json()
    assert demo_dash["source"] == "demo"
    assert demo_dash["source_label"] == "DEMO DATASET"

    # Manual
    manual_res = client.post("/api/manual-analysis", json={
        "transactions": [{
            "transaction_id": "TX-S1",
            "product_name": "Test Item",
            "supplier": "Test Vendor",
            "quantity": 5,
            "unit_price": 200,
            "benchmark_unit_price": 150,
        }]
    }).json()
    manual_id = manual_res["file_id"]
    manual_dash = client.get(f"/api/dashboard/{manual_id}").json()
    assert manual_dash["source"] == "manual"
    assert manual_dash["source_label"] == "MANUAL DATA"
    assert manual_dash["total_spend"] == 1000.0

    # Nova
    nova_res = client.get("/api/nova/procurement").json()
    assert nova_res["source"] == "nova"
    assert nova_res["source_label"] == "LIVE NOVA"

    # Back to Manual
    manual_dash2 = client.get(f"/api/dashboard/{manual_id}").json()
    assert manual_dash2["source"] == "manual"
    assert manual_dash2["total_spend"] == 1000.0
    print("Source switching cleanliness test passed!")

if __name__ == "__main__":
    test_manual_analysis_single_transaction()
    test_manual_analysis_validation_errors()
    test_manual_analysis_multiple_transactions()
    test_manual_analysis_10_transactions()
    test_source_switching_cleanliness()
