"""
SpendIntel - Step 3 Contract & Discount Analysis Verification Test Suite.

Verifies:
1. Deterministic missed discount detection for actual demo transactions:
   - TX10008: MechaParts, 5% volume discount, leakage = ₹10,800.00
   - TX10030: FastenCo, 10% volume discount, leakage = ₹145,000.00
2. Contract Price Compliance & Off-Contract purchases against master benchmark rate card.
3. Standardized finding schema adherence (type, transaction_id, supplier, product, actual_price, expected_price, variance, potential_leakage, risk, evidence).
4. No invented data: expired contracts safely empty when date columns are absent, but properly triggers when explicit dates are provided.
5. Compatibility with existing analyzer, dashboard, findings, and investigation APIs.
"""

import sys
import os
from pathlib import Path

# Force UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

import pandas as pd

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(CURRENT_DIR))

from app.services.contracts import detect_contract_findings
from app.services.analyzer import analyze_procurement
from app.routes.dashboard import get_dashboard_analysis
from app.routes.findings import get_findings
from app.routes.investigation import investigate_transaction

DEMO_FILE_ID = "cb8b20d5-2516-47a9-8646-317e9beee50b"
DEMO_FILE_PATH = CURRENT_DIR / "app" / "data" / "uploads" / f"{DEMO_FILE_ID}.csv"


def test_missed_discount_detection():
    print("\n--- 1. Testing Deterministic Missed Discount Detection ---")
    df = pd.read_csv(DEMO_FILE_PATH)
    audit = detect_contract_findings(df)
    missed = audit["missed_discounts"]

    assert len(missed) == 2, f"Expected exactly 2 missed discount findings, found {len(missed)}"

    tx_map = {m["transaction_id"]: m for m in missed}
    assert "TX10008" in tx_map, "TX10008 not found in missed discounts"
    assert "TX10030" in tx_map, "TX10030 not found in missed discounts"

    # Verify TX10008 (MechaParts: Industrial Bearing, unit price 7200, 5% discount, qty 30)
    tx8 = tx_map["TX10008"]
    assert tx8["type"] == "MISSED_DISCOUNT"
    assert tx8["supplier"] == "MechaParts"
    assert tx8["product"] == "Industrial Bearing"
    assert tx8["actual_price"] == 7200.0
    assert tx8["expected_price"] == 6840.0  # 7200 * 0.95
    assert tx8["variance"] == 5.0
    assert tx8["potential_leakage"] == 10800.0  # (7200 * 0.05) * 30
    assert len(tx8["evidence"]) >= 4

    print(f"  TX10008 verified: actual=₹{tx8['actual_price']}, expected=₹{tx8['expected_price']}, leakage=₹{tx8['potential_leakage']:,.2f}")

    # Verify TX10030 (FastenCo: Steel Fasteners, unit price 1450, 10% discount, qty 1000)
    tx30 = tx_map["TX10030"]
    assert tx30["type"] == "MISSED_DISCOUNT"
    assert tx30["supplier"] == "FastenCo"
    assert tx30["product"] == "Steel Fasteners"
    assert tx30["actual_price"] == 1450.0
    assert tx30["expected_price"] == 1305.0  # 1450 * 0.90
    assert tx30["variance"] == 10.0
    assert tx30["potential_leakage"] == 145000.0  # (1450 * 0.10) * 1000
    assert tx30["risk"] == "HIGH"
    assert len(tx30["evidence"]) >= 4

    print(f"  TX10030 verified: actual=₹{tx30['actual_price']}, expected=₹{tx30['expected_price']}, leakage=₹{tx30['potential_leakage']:,.2f}")
    print("PASS: Missed discounts verified with exact deterministic calculations.")


def test_contract_finding_schema():
    print("\n--- 2. Testing Finding Schema Compliance ---")
    df = pd.read_csv(DEMO_FILE_PATH)
    audit = detect_contract_findings(df)
    all_findings = audit["all_contract_findings"]

    required_keys = [
        "type",
        "transaction_id",
        "supplier",
        "product",
        "actual_price",
        "expected_price",
        "variance",
        "potential_leakage",
        "risk",
        "evidence",
    ]

    for f in all_findings:
        for k in required_keys:
            assert k in f, f"Finding missing key '{k}': {f}"
        assert isinstance(f["actual_price"], (int, float))
        assert isinstance(f["expected_price"], (int, float))
        assert isinstance(f["potential_leakage"], (int, float))
        assert isinstance(f["evidence"], list)

    print(f"PASS: All {len(all_findings)} contract findings strictly adhere to schema.")


def test_contract_price_compliance():
    print("\n--- 3. Testing Contract Price Compliance & Off-Contract Purchases ---")
    df = pd.read_csv(DEMO_FILE_PATH)
    audit = detect_contract_findings(df)
    compliance = audit["contract_compliance"]

    assert len(compliance) > 0, "No contract price compliance findings detected"
    for c in compliance:
        assert c["type"] in ["OFF_CONTRACT_PURCHASE", "CONTRACT_NON_COMPLIANCE"]
        assert c["actual_price"] > c["expected_price"]
        assert c["potential_leakage"] > 0
        assert c["variance"] >= 5.0

    print(f"PASS: Detected {len(compliance)} rate-card compliance findings.")


def test_expired_contracts_behavior():
    print("\n--- 4. Testing Expired Contracts (Zero Invention Rule) ---")
    df = pd.read_csv(DEMO_FILE_PATH)
    audit = detect_contract_findings(df)

    # In raw demo data, no contract expiration columns exist -> must be safely empty
    assert len(audit["expired_contracts"]) == 0
    print("  Raw demo data: expired_contracts is empty (no fake dates invented). OK.")

    # Synthetic test: add valid contract dates and confirm detection works
    synth_df = df.head(5).copy()
    synth_df["contract_start_date"] = "2025-01-01"
    synth_df["contract_end_date"] = "2025-12-31"  # Transactions are in 2026 -> all expired!
    synth_audit = detect_contract_findings(synth_df)
    assert len(synth_audit["expired_contracts"]) == 5
    assert synth_audit["expired_contracts"][0]["type"] == "EXPIRED_CONTRACT"
    print(f"  Synthetic date data: successfully detected {len(synth_audit['expired_contracts'])} EXPIRED_CONTRACT instances.")
    print("PASS: Expired contract engine tested without inventing data.")


def test_integration_with_analyzer_and_apis():
    print("\n--- 5. Testing Master Pipeline & API Compatibility ---")
    # Master analyzer
    result = analyze_procurement(DEMO_FILE_PATH)
    assert len(result["discount_findings"]) == 2
    assert "contract_findings" in result
    print("  analyze_procurement: OK")

    # Dashboard API
    dash = get_dashboard_analysis(DEMO_FILE_ID)
    discount_category = next((b for b in dash["leakage_breakdown"] if b["type"] == "MISSED_DISCOUNT"), None)
    assert discount_category is not None
    assert discount_category["count"] == 2
    assert discount_category["amount"] == 155800.0
    print(f"  Dashboard API MISSED_DISCOUNT category: count=2, amount=₹{discount_category['amount']:,.2f}. OK.")

    # Findings API
    findings_res = get_findings(DEMO_FILE_ID)
    discount_findings = [f for f in findings_res["findings"] if f["type"] == "MISSED_DISCOUNT"]
    assert len(discount_findings) == 2
    print("  Findings API MISSED_DISCOUNT findings: OK.")

    # Investigation API for TX10030
    inv = investigate_transaction(DEMO_FILE_ID, "TX10030")
    assert inv["finding"]["type"] == "MISSED_DISCOUNT"
    assert inv["financial_impact"] == 145000.0
    assert "rebate" in inv["root_cause"].lower()
    print("  Investigation API for TX10030: OK.")

    print("PASS: Master analyzer and APIs integrate contract findings seamlessly.")


def run_all():
    print("==================================================================")
    print("SPENDINTEL STEP 3: CONTRACT & DISCOUNT AUDIT VERIFICATION")
    print("==================================================================")
    test_missed_discount_detection()
    test_contract_finding_schema()
    test_contract_price_compliance()
    test_expired_contracts_behavior()
    test_integration_with_analyzer_and_apis()
    print("\n==================================================================")
    print("STEP 3 CONTRACT/DISCOUNT AUDIT FULLY VERIFIED WITH 100% PASS RATE.")
    print("==================================================================")


if __name__ == "__main__":
    run_all()
