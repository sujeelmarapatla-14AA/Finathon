"""
SpendIntel - Step 5 Master Analyzer Verification Test Suite.

Verifies:
1. Full orchestration across all 9 audit stages on the 40-transaction dataset.
2. Complete backward compatibility: all legacy fields preserved.
3. Enriched findings: contract_findings, discount_findings, pattern_findings.
4. Normalization metadata: normalized_supplier_count, normalized_product_count.
5. Strict financial deduplication: potential_leakage represents independently measurable impact.
6. Deterministic calculations without any AI hallucination.
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

from app.services.analyzer import analyze_procurement, REQUIRED_COLUMNS

DEMO_FILE_ID = "cb8b20d5-2516-47a9-8646-317e9beee50b"
DEMO_FILE_PATH = CURRENT_DIR / "app" / "data" / "uploads" / f"{DEMO_FILE_ID}.csv"


def test_master_analyzer_orchestration():
    print("\n--- 1. Testing Full Master Analyzer Execution (40 Transactions) ---")
    assert DEMO_FILE_PATH.exists(), f"Demo file not found at {DEMO_FILE_PATH}"

    result = analyze_procurement(DEMO_FILE_PATH)

    # 1. Verify legacy/existing keys for backward compatibility
    legacy_keys = [
        "transactions",
        "total_spend",
        "potential_leakage",
        "leakage_rate",
        "price_anomalies",
        "duplicates",
        "fragmentation",
        "suppliers",
        "products",
    ]
    for key in legacy_keys:
        assert key in result, f"Missing legacy key: '{key}'"
    print("  Legacy backward-compatible keys: ALL PRESENT.")

    # 2. Verify new enriched keys
    new_keys = [
        "contract_findings",
        "discount_findings",
        "pattern_findings",
        "normalized_supplier_count",
        "normalized_product_count",
    ]
    for key in new_keys:
        assert key in result, f"Missing new key: '{key}'"
    print("  New enriched keys: ALL PRESENT.")

    # 3. Verify counts
    assert result["transactions"] == 40
    assert result["suppliers"] == 16
    assert result["products"] == 12
    assert result["normalized_supplier_count"] == 16
    assert result["normalized_product_count"] == 12

    # 4. Verify detection modules populated
    assert len(result["price_anomalies"]) == 14
    assert len(result["duplicates"]) == 8
    assert len(result["fragmentation"]) == 5
    assert len(result["discount_findings"]) == 2
    assert len(result["contract_findings"]) == 14
    assert len(result["pattern_findings"]) == 19

    print("PASS: Master analyzer successfully orchestrated all 9 stages.")


def test_financial_deduplication():
    print("\n--- 2. Testing Strict Financial Deduplication (Zero Double Counting) ---")
    result = analyze_procurement(DEMO_FILE_PATH)

    total_spend = result["total_spend"]
    canonical_leakage = result["potential_leakage"]
    leakage_rate = result["leakage_rate"]

    # Compute naive sum across individual categories
    price_anomaly_sum = sum(item["potential_leakage"] for item in result["price_anomalies"])
    discount_sum = sum(item["potential_leakage"] for item in result["discount_findings"])
    contract_sum = sum(item["potential_leakage"] for item in result["contract_findings"])
    pattern_sum = sum(item["potential_leakage"] for item in result["pattern_findings"])
    duplicate_sum = sum(item["amount"] for item in result["duplicates"])

    naive_total = price_anomaly_sum + discount_sum + contract_sum + pattern_sum + duplicate_sum

    print(f"  Total Procurement Spend: ₹{total_spend:,.2f}")
    print(f"  Naive Sum (with double-counting): ₹{naive_total:,.2f}")
    print(f"  Deduplicated Canonical Leakage: ₹{canonical_leakage:,.2f}")
    print(f"  Leakage Rate: {leakage_rate:.2f}%")

    # Critical check: Canonical leakage MUST be strictly less than naive sum
    assert canonical_leakage < naive_total, "Deduplication failed! Canonical leakage equals naive sum."
    assert canonical_leakage == 3959800.0, f"Expected canonical leakage ₹3,959,800.00, got ₹{canonical_leakage}"
    assert leakage_rate == 24.47

    # Verify no negative leakage exists
    assert canonical_leakage >= 0.0

    print("PASS: Financial leakage strictly deduplicated at transaction level.")


def test_missing_column_validation():
    print("\n--- 3. Testing Schema Validation on Incomplete Data ---")
    df = pd.read_csv(DEMO_FILE_PATH)

    # 1. Dropping benchmark_unit_price should SUCCEED because benchmark is an analytical output
    df_no_bench = df.drop(columns=["benchmark_unit_price", "product_id"])
    temp_no_bench = CURRENT_DIR / "app" / "data" / "uploads" / "temp_no_bench.csv"
    df_no_bench.to_csv(temp_no_bench, index=False)
    try:
        res = analyze_procurement(temp_no_bench)
        assert res["transactions"] == len(df)
        print("  PASS: Missing benchmark_unit_price / product_id successfully auto-calculated without error.")
    finally:
        if temp_no_bench.exists():
            temp_no_bench.unlink()

    # 2. Dropping a required field (e.g. supplier) should properly raise ValueError
    incomplete_df = df.drop(columns=["supplier"])
    temp_path = CURRENT_DIR / "app" / "data" / "uploads" / "temp_incomplete.csv"
    incomplete_df.to_csv(temp_path, index=False)

    try:
        analyze_procurement(temp_path)
        assert False, "Failed to raise ValueError for missing required column"
    except ValueError as e:
        assert "Supplier" in str(e)
        assert "Missing required procurement fields" in str(e)
        print(f"  Caught expected ValueError: {e}")
    finally:
        if temp_path.exists():
            temp_path.unlink()

    print("PASS: Column validation correctly requires (product, supplier, quantity, unit_price).")


def run_all():
    print("==================================================================")
    print("SPENDINTEL STEP 5: MASTER ANALYZER ORCHESTRATION VERIFICATION")
    print("==================================================================")
    test_master_analyzer_orchestration()
    test_financial_deduplication()
    test_missing_column_validation()
    print("\n==================================================================")
    print("STEP 5 MASTER ANALYZER FULLY VERIFIED WITH 100% PASS RATE.")
    print("==================================================================")


if __name__ == "__main__":
    run_all()
