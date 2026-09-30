"""
SpendIntel - Step 2 Normalization Verification Test Suite.

Verifies:
1. Supplier normalization handles exact variations:
   - "TechWorld Solutions"
   - " TECHWORLD SOLUTIONS "
   - "TechWorld  Solutions"
   all resolving to "Techworld Solutions".
2. Preservation of original_supplier and normalized_supplier.
3. Product normalization uses product_id as primary identity and does not merge distinct products.
4. Normalization of the 40-transaction demo dataset.
5. Ingestion and aggregation by analyzer.py.
6. Existing backend API functionality.
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

from app.services.normalization import (
    normalize_supplier,
    normalize_product,
    normalize_procurement_dataframe,
)
from app.services.analyzer import analyze_procurement
from app.routes.dashboard import get_dashboard_analysis
from app.routes.findings import get_findings
from app.routes.suppliers import get_supplier_intelligence
from app.routes.investigation import investigate_transaction
from app.routes.simulation import run_simulation, SimulationRequest

DEMO_FILE_ID = "cb8b20d5-2516-47a9-8646-317e9beee50b"
DEMO_FILE_PATH = CURRENT_DIR / "app" / "data" / "uploads" / f"{DEMO_FILE_ID}.csv"


def test_supplier_normalization_variations():
    print("\n--- 1. Testing Supplier Normalization Variations ---")
    variations = [
        "TechWorld Solutions",
        " TECHWORLD SOLUTIONS ",
        "TechWorld  Solutions",
    ]

    results = [normalize_supplier(v) for v in variations]
    canonical_forms = [res[1] for res in results]

    print(f"Input variations: {variations}")
    for orig, norm in results:
        print(f"  original: {repr(orig)} -> normalized: {repr(norm)}")

    # All variations MUST resolve to the exact same canonical string
    assert len(set(canonical_forms)) == 1, f"Variations resolved to different canonical forms: {canonical_forms}"
    assert canonical_forms[0] == "Techworld Solutions"

    # Original values MUST be preserved
    assert results[0][0] == "TechWorld Solutions"
    assert results[1][0] == " TECHWORLD SOLUTIONS "
    assert results[2][0] == "TechWorld  Solutions"

    print("PASS: Exact supplier variations resolved to 'Techworld Solutions' with originals preserved.")


def test_supplier_safe_legal_suffixes():
    print("\n--- 2. Testing Supplier Legal Suffix Standardizing ---")
    cases = [
        ("ABC Traders Pvt. Ltd.", "ABC Traders Pvt Ltd"),
        ("ABC Traders Pvt Ltd", "ABC Traders Pvt Ltd"),
        ("SafePro Industries LLC", "Safepro Industries LLC"),
        ("Dell Enterprise Partner", "Dell Enterprise Partner"),
    ]
    for raw, expected in cases:
        orig, norm = normalize_supplier(raw)
        assert norm == expected, f"Expected {expected}, got {norm}"
        print(f"  {repr(raw)} -> {repr(norm)}")
    print("PASS: Legal suffixes standardized safely without unsafe merging.")


def test_product_normalization():
    print("\n--- 3. Testing Product Normalization ---")
    p1 = normalize_product("  INDUSTRIAL LAPTOP  ", product_id="P001", category="IT Hardware")
    p2 = normalize_product("Industrial  Laptop", product_id="P001")
    p3 = normalize_product("Industrial Laptop", product_id="P002")  # Distinct product ID

    print(f"  p1 (P001): {p1}")
    print(f"  p2 (P001): {p2}")
    print(f"  p3 (P002): {p3}")

    assert p1["normalized_product_name"] == "Industrial Laptop"
    assert p1["product_id"] == "P001"
    assert p2["normalized_product_name"] == "Industrial Laptop"
    assert p2["product_id"] == "P001"

    # Distinct product IDs must be preserved separately
    assert p1["product_id"] != p3["product_id"]
    print("PASS: Product normalization correctly standardizes names while strictly preserving product_id.")


def test_dataframe_normalization_on_demo_data():
    print("\n--- 4. Testing DataFrame Normalization on Demo Data (40 rows) ---")
    assert DEMO_FILE_PATH.exists(), f"Demo file not found at {DEMO_FILE_PATH}"
    df = pd.read_csv(DEMO_FILE_PATH)
    assert len(df) == 40

    norm_df = normalize_procurement_dataframe(df)

    # Check added columns
    expected_cols = [
        "original_supplier",
        "normalized_supplier",
        "original_product_name",
        "normalized_product_name",
        "normalized_product_id",
    ]
    for col in expected_cols:
        assert col in norm_df.columns, f"Missing normalized column: {col}"

    # Row count must be unchanged
    assert len(norm_df) == 40

    # Original columns must be unchanged
    assert (norm_df["original_supplier"] == df["supplier"]).all()
    assert (norm_df["original_product_name"] == df["product_name"]).all()

    print(f"PASS: DataFrame normalized. Unique suppliers: raw={df['supplier'].nunique()}, normalized={norm_df['normalized_supplier'].nunique()}.")


def test_integration_with_analyzer():
    print("\n--- 5. Testing Integration with Analyzer Service ---")
    result = analyze_procurement(DEMO_FILE_PATH)

    assert "normalized_supplier_count" in result
    assert "normalized_product_count" in result
    assert result["transactions"] == 40
    assert result["potential_leakage"] > 0

    print(f"PASS: Analyzer integrated seamlessly. Normalized suppliers: {result['normalized_supplier_count']}, Normalized products: {result['normalized_product_count']}.")


def test_existing_backend_apis():
    print("\n--- 6. Testing Existing Backend APIs ---")
    # Dashboard API
    dash = get_dashboard_analysis(DEMO_FILE_ID)
    assert dash["kpis"]["transactions"] == 40
    assert len(dash["leakage_breakdown"]) >= 6
    print("  Dashboard API: OK")

    # Findings API
    findings = get_findings(DEMO_FILE_ID)
    assert findings["count"] > 0
    print("  Findings API: OK")

    # Suppliers API
    suppliers = get_supplier_intelligence(DEMO_FILE_ID)
    assert suppliers["total_suppliers"] > 0
    assert "normalized_supplier" in suppliers["suppliers"][0]
    print("  Suppliers API: OK")

    # Investigation API
    inv = investigate_transaction(DEMO_FILE_ID, "TX10030")
    assert inv["finding"]["type"] == "MISSED_DISCOUNT"
    print("  Investigation API: OK")

    # Simulation API
    sim = run_simulation(SimulationRequest(current_price=52500, alternative_price=47500, quantity=20))
    assert sim["potential_savings"] == 100000.0
    print("  Simulation API: OK")

    print("PASS: All existing backend APIs remain completely operational.")


def run_all():
    print("==================================================================")
    print("SPENDINTEL STEP 2: SUPPLIER & PRODUCT NORMALIZATION VERIFICATION")
    print("==================================================================")
    test_supplier_normalization_variations()
    test_supplier_safe_legal_suffixes()
    test_product_normalization()
    test_dataframe_normalization_on_demo_data()
    test_integration_with_analyzer()
    test_existing_backend_apis()
    print("\n==================================================================")
    print("STEP 2 NORMALIZATION FULLY VERIFIED WITH 100% PASS RATE.")
    print("==================================================================")


if __name__ == "__main__":
    run_all()
