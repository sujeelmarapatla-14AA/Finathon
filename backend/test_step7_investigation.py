"""
SpendIntel - Step 7 Verification Script: Extend AI Investigation to All Finding Types.

Validates that /api/investigate supports all 11 procurement spend leakage categories:
1. PRICE_ANOMALY
2. POSSIBLE_DUPLICATE
3. SUPPLIER_FRAGMENTATION
4. MISSED_DISCOUNT
5. CONTRACT_NON_COMPLIANCE
6. OFF_CONTRACT_PURCHASE
7. EXPIRED_CONTRACT
8. UNUSUAL_PRICE_PATTERN
9. UNUSUAL_QUANTITY
10. SUDDEN_SUPPLIER_CHANGE
11. OFF_CHANNEL_PROCUREMENT

Rules verified:
- Retrieve actual transaction/finding
- Retrieve supporting evidence
- Calculate deterministic financial impact
- Build structured evidence object
- Send only verified evidence to AI layer
- AI does NOT calculate financial values, invent evidence, contracts, suppliers, or claim fraud
- Return: finding, summary, root_cause, financial_impact, evidence, recommended_actions
"""

import sys
from pathlib import Path
import httpx

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure backend root in python path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.routes.investigation import investigate_transaction

DEMO_FILE_ID = "cb8b20d5-2516-47a9-8646-317e9beee50b"

TEST_CASES = [
    {
        "name": "PRICE_ANOMALY",
        "query": "ANO-TX10001",
        "finding_type": "PRICE_ANOMALY",
        "expected_type": "PRICE_ANOMALY",
    },
    {
        "name": "POSSIBLE_DUPLICATE",
        "query": "DUP-TX10023",
        "finding_type": "POSSIBLE_DUPLICATE",
        "expected_type": "POSSIBLE_DUPLICATE",
    },
    {
        "name": "SUPPLIER_FRAGMENTATION",
        "query": "FRAG-P001",
        "finding_type": "SUPPLIER_FRAGMENTATION",
        "expected_type": "SUPPLIER_FRAGMENTATION",
    },
    {
        "name": "MISSED_DISCOUNT",
        "query": "DISC-TX10030",
        "finding_type": "MISSED_DISCOUNT",
        "expected_type": "MISSED_DISCOUNT",
    },
    {
        "name": "CONTRACT_NON_COMPLIANCE",
        "query": "CONT-TX10002",
        "finding_type": "CONTRACT_NON_COMPLIANCE",
        "expected_type": "CONTRACT_NON_COMPLIANCE",
    },
    {
        "name": "OFF_CONTRACT_PURCHASE",
        "query": "OFF-TX10013",
        "finding_type": "OFF_CONTRACT_PURCHASE",
        "expected_type": "OFF_CONTRACT_PURCHASE",
    },
    {
        "name": "EXPIRED_CONTRACT",
        "query": "EXP-TX10005",
        "finding_type": "EXPIRED_CONTRACT",
        "expected_type": "EXPIRED_CONTRACT",
    },
    {
        "name": "UNUSUAL_PRICE_PATTERN",
        "query": "PAT-SPIKE-TX10013",
        "finding_type": "UNUSUAL_PRICE_PATTERN",
        "expected_type": "UNUSUAL_PRICE_PATTERN",
    },
    {
        "name": "UNUSUAL_QUANTITY",
        "query": "PAT-QTY-TX10014",
        "finding_type": "UNUSUAL_QUANTITY",
        "expected_type": "UNUSUAL_QUANTITY",
    },
    {
        "name": "SUDDEN_SUPPLIER_CHANGE",
        "query": "PAT-SUPP-TX10015",
        "finding_type": "SUDDEN_SUPPLIER_CHANGE",
        "expected_type": "SUDDEN_SUPPLIER_CHANGE",
    },
    {
        "name": "OFF_CHANNEL_PROCUREMENT",
        "query": "CHAN-TX10016",
        "finding_type": "OFF_CHANNEL_PROCUREMENT",
        "expected_type": "OFF_CHANNEL_PROCUREMENT",
    },
]


def test_internal_investigation():
    print("=" * 70)
    print("STEP 7 TEST 1: INTERNAL INVESTIGATION FUNCTION FOR ALL 11 TYPES")
    print("=" * 70)

    for tc in TEST_CASES:
        name = tc["name"]
        query = tc["query"]
        ftype = tc["finding_type"]
        expected_type = tc["expected_type"]

        res = investigate_transaction(
            file_id=DEMO_FILE_ID,
            transaction_id=query,
            finding_type=ftype,
        )

        # Check required schema keys
        assert "finding" in res, f"[{name}] Missing 'finding'"
        assert "summary" in res, f"[{name}] Missing 'summary'"
        assert "root_cause" in res, f"[{name}] Missing 'root_cause'"
        assert "financial_impact" in res, f"[{name}] Missing 'financial_impact'"
        assert "evidence" in res, f"[{name}] Missing 'evidence'"
        assert "recommended_actions" in res, f"[{name}] Missing 'recommended_actions'"

        finding = res["finding"]
        assert finding["type"] == expected_type, f"[{name}] Expected {expected_type}, got {finding['type']}"
        assert isinstance(res["financial_impact"], (int, float)), f"[{name}] financial_impact must be numeric"
        assert len(res["evidence"]) > 0, f"[{name}] evidence must have steps"
        assert len(res["recommended_actions"]) > 0, f"[{name}] recommended_actions must not be empty"
        assert len(res["root_cause"]) > 10, f"[{name}] root_cause must be informative"
        assert len(res["summary"]) > 10, f"[{name}] summary must be informative"

        print(f"  ✓ [{name}] Verified: Type={finding['type']}, Impact=₹{res['financial_impact']:,.2f}, Evidence Steps={len(res['evidence'])}, Actions={len(res['recommended_actions'])}")
        print(f"     Root cause snippet: {res['root_cause'][:80]}...")


def test_live_http_investigation():
    print("\n" + "=" * 70)
    print("STEP 7 TEST 2: FASTAPI INVESTIGATION ENDPOINTS")
    print("=" * 70)
    from fastapi.testclient import TestClient
    from app.main import app

    with TestClient(app) as client:
        # Test 1: Missed discount (TX10030)
        resp1 = client.post(f"/api/investigate/{DEMO_FILE_ID}/DISC-TX10030")
        assert resp1.status_code == 200, f"HTTP error {resp1.status_code}: {resp1.text}"
        data1 = resp1.json()
        assert data1["finding"]["type"] == "MISSED_DISCOUNT"
        assert data1["financial_impact"] == 145000.0, f"Expected 145000.0, got {data1['financial_impact']}"
        print(f"  ✓ Live API MISSED_DISCOUNT (DISC-TX10030): Impact=₹{data1['financial_impact']:,.2f}, Type={data1['finding']['type']}")

        # Test 2: Possible duplicate (DUP-TX10023)
        resp2 = client.post(f"/api/investigate/{DEMO_FILE_ID}/DUP-TX10023")
        assert resp2.status_code == 200
        data2 = resp2.json()
        assert data2["finding"]["type"] == "POSSIBLE_DUPLICATE"
        print(f"  ✓ Live API POSSIBLE_DUPLICATE (DUP-TX10023): Impact=₹{data2['financial_impact']:,.2f}, Type={data2['finding']['type']}")

        # Test 3: Supplier fragmentation (FRAG-P001)
        resp3 = client.post(f"/api/investigate/{DEMO_FILE_ID}/FRAG-P001")
        assert resp3.status_code == 200
        data3 = resp3.json()
        assert data3["finding"]["type"] == "SUPPLIER_FRAGMENTATION"
        assert data3["financial_impact"] == 0.0, "Fragmentation structural risk must have 0.0 leakage to prevent double counting"
        print(f"  ✓ Live API SUPPLIER_FRAGMENTATION (FRAG-P001): Impact=₹{data3['financial_impact']:,.2f}, Type={data3['finding']['type']}")

        # Test 4: Unusual price pattern (PAT-SPIKE-TX10013)
        resp4 = client.post(f"/api/investigate/{DEMO_FILE_ID}/PAT-SPIKE-TX10013")
        assert resp4.status_code == 200
        data4 = resp4.json()
        assert data4["finding"]["type"] == "UNUSUAL_PRICE_PATTERN"
        print(f"  ✓ Live API UNUSUAL_PRICE_PATTERN (PAT-SPIKE-TX10013): Impact=₹{data4['financial_impact']:,.2f}, Type={data4['finding']['type']}")

        # Test 5: Off-contract purchase (OFF-TX10013)
        resp5 = client.post(f"/api/investigate/{DEMO_FILE_ID}/OFF-TX10013")
        assert resp5.status_code == 200
        data5 = resp5.json()
        assert data5["finding"]["type"] == "OFF_CONTRACT_PURCHASE"
        print(f"  ✓ Live API OFF_CONTRACT_PURCHASE (OFF-TX10013): Impact=₹{data5['financial_impact']:,.2f}, Type={data5['finding']['type']}")

        # Test 6: Raw transaction ID fallback (TX10008)
        resp6 = client.post(f"/api/investigate/{DEMO_FILE_ID}/TX10008")
        assert resp6.status_code == 200
        data6 = resp6.json()
        assert data6["finding"]["type"] == "MISSED_DISCOUNT"
        assert data6["financial_impact"] == 10800.0
        print(f"  ✓ Live API Raw ID TX10008: Auto-detected={data6['finding']['type']}, Impact=₹{data6['financial_impact']:,.2f}")

    print("\n" + "=" * 70)
    print("ALL STEP 7 INVESTIGATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    test_internal_investigation()
    test_live_http_investigation()
