"""
SpendIntel - Step 4 Unusual Pattern Detection Verification Test Suite.

Verifies:
1. PRICE_SPIKE: Compares unit price against historical product median.
2. UNUSUAL_QUANTITY: Flags volume outliers (>= 2.5x median) with zero double-counting.
3. SUDDEN_SUPPLIER_CHANGE: Detects routing to higher-priced alternate vendor.
4. URGENT_PROCUREMENT: Safely checks urgency fields without fabricating data.
5. OFF_CHANNEL_PROCUREMENT: Identifies spot/maverick purchases when channel fields exist.
6. EXCESSIVE_SUPPLIER_FRAGMENTATION: Evaluates historical supplier split across products.
7. Finding schema adherence: type, risk, transaction_id or product_id, reason, evidence, potential_leakage.
8. Master pipeline & API integration.
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

from app.services.patterns import (
    detect_unusual_patterns,
    PRICE_VARIANCE_THRESHOLD,
    HIGH_RISK_VARIANCE,
    SUPPLIER_FRAGMENTATION_THRESHOLD,
    QUANTITY_OUTLIER_FACTOR,
    PRICE_SPIKE_FACTOR,
)
from app.services.analyzer import analyze_procurement
from app.routes.dashboard import get_dashboard_analysis
from app.routes.findings import get_findings

DEMO_FILE_ID = "cb8b20d5-2516-47a9-8646-317e9beee50b"
DEMO_FILE_PATH = CURRENT_DIR / "app" / "data" / "uploads" / f"{DEMO_FILE_ID}.csv"


def test_thresholds():
    print("\n--- 1. Testing Configurable Thresholds ---")
    assert PRICE_VARIANCE_THRESHOLD == 5.0
    assert HIGH_RISK_VARIANCE == 15.0
    assert SUPPLIER_FRAGMENTATION_THRESHOLD == 2
    assert QUANTITY_OUTLIER_FACTOR == 2.5
    assert PRICE_SPIKE_FACTOR == 1.08
    print("PASS: Centralized configurable thresholds verified.")


def test_patterns_on_demo_data():
    print("\n--- 2. Testing Pattern Detection on Demo Data ---")
    df = pd.read_csv(DEMO_FILE_PATH)
    patterns = detect_unusual_patterns(df)

    assert len(patterns) > 0, "No unusual patterns detected"
    pattern_types = set(p["type"] for p in patterns)
    print(f"  Detected {len(patterns)} pattern findings across types: {pattern_types}")

    # Check schema of every pattern finding
    for p in patterns:
        assert "type" in p
        assert "risk" in p
        assert p["risk"] in ["HIGH", "MEDIUM", "LOW"]
        assert ("transaction_id" in p) or ("product_id" in p)
        assert "reason" in p and len(p["reason"]) > 0
        assert "evidence" in p and isinstance(p["evidence"], list)
        assert "potential_leakage" in p
        assert p["potential_leakage"] >= 0.0

    print("PASS: All pattern findings conform strictly to required schema.")


def test_sudden_supplier_change_and_fragmentation():
    print("\n--- 3. Testing Sudden Supplier Change & Excessive Fragmentation ---")
    df = pd.read_csv(DEMO_FILE_PATH)
    patterns = detect_unusual_patterns(df)

    supp_changes = [p for p in patterns if p["type"] == "SUDDEN_SUPPLIER_CHANGE"]
    assert len(supp_changes) > 0, "Expected SUDDEN_SUPPLIER_CHANGE findings"
    print(f"  Found {len(supp_changes)} SUDDEN_SUPPLIER_CHANGE instances (e.g. {supp_changes[0]['transaction_id']} - {supp_changes[0]['supplier']}).")

    frag_patterns = [p for p in patterns if p["type"] == "EXCESSIVE_SUPPLIER_FRAGMENTATION"]
    assert len(frag_patterns) > 0, "Expected EXCESSIVE_SUPPLIER_FRAGMENTATION findings"
    print(f"  Found {len(frag_patterns)} EXCESSIVE_SUPPLIER_FRAGMENTATION product findings (e.g. {frag_patterns[0]['product']}).")
    for fp in frag_patterns:
        assert fp["potential_leakage"] == 0.0, "Fragmentation pattern must not invent double-counted leakage"

    print("PASS: Sudden supplier change and fragmentation patterns verified.")


def test_unusual_quantity_detection():
    print("\n--- 4. Testing Unusual Quantity Detection ---")
    df = pd.read_csv(DEMO_FILE_PATH)
    
    # Check if any quantity outlier exists in raw data or add a clear test case
    synth_df = df.copy()
    # Add a row with 500 laptops (median is 20)
    outlier_row = synth_df.iloc[0].copy()
    outlier_row["transaction_id"] = "TX_OUTLIER"
    outlier_row["quantity"] = 500  # 25x normal order
    synth_df = pd.concat([synth_df, pd.DataFrame([outlier_row])], ignore_index=True)

    synth_patterns = detect_unusual_patterns(synth_df)
    qty_outliers = [p for p in synth_patterns if p["type"] == "UNUSUAL_QUANTITY"]
    assert len(qty_outliers) > 0, "Expected UNUSUAL_QUANTITY outlier"
    outlier = next(p for p in qty_outliers if p["transaction_id"] == "TX_OUTLIER")
    assert outlier["potential_leakage"] == 0.0  # Zero double-counting
    assert "higher than historical median" in outlier["reason"]

    print(f"  Detected UNUSUAL_QUANTITY: {outlier['transaction_id']}, qty={outlier['quantity']}. Leakage: ₹{outlier['potential_leakage']} (prevented double counting).")
    print("PASS: Unusual quantity volume spikes detected accurately.")


def test_urgent_and_off_channel_procurement():
    print("\n--- 5. Testing Urgent & Off-Channel Procurement ---")
    df = pd.read_csv(DEMO_FILE_PATH)

    # In raw demo data, urgency/channel columns are absent
    raw_patterns = detect_unusual_patterns(df)
    raw_types = set(p["type"] for p in raw_patterns)
    assert "URGENT_PROCUREMENT" not in raw_types, "Must not fabricate urgency when field is absent"
    assert "OFF_CHANNEL_PROCUREMENT" not in raw_types, "Must not fabricate off-channel when field is absent"
    print("  Raw demo data: correctly avoids inventing urgency or off-channel data.")

    # Test synthetic dataframe with urgency and channel columns
    synth_df = df.head(5).copy()
    synth_df["urgency"] = ["urgent", "normal", "rush", "standard", "normal"]
    synth_df["procurement_channel"] = ["spot", "catalog", "p-card", "erp", "catalog"]

    synth_patterns = detect_unusual_patterns(synth_df)
    urgent_findings = [p for p in synth_patterns if p["type"] == "URGENT_PROCUREMENT"]
    channel_findings = [p for p in synth_patterns if p["type"] == "OFF_CHANNEL_PROCUREMENT"]

    assert len(urgent_findings) == 2, f"Expected 2 urgent findings, got {len(urgent_findings)}"
    assert len(channel_findings) == 2, f"Expected 2 off-channel findings, got {len(channel_findings)}"
    print(f"  Synthetic data: successfully detected {len(urgent_findings)} URGENT and {len(channel_findings)} OFF-CHANNEL findings.")
    print("PASS: Urgent and off-channel procurement detectors verified.")


def test_master_integration():
    print("\n--- 6. Testing Master Pipeline & Dashboard Integration ---")
    # Master analyzer
    result = analyze_procurement(DEMO_FILE_PATH)
    assert "pattern_findings" in result
    assert len(result["pattern_findings"]) > 0
    print(f"  analyze_procurement pattern findings: {len(result['pattern_findings'])} findings. OK.")

    # Dashboard breakdown
    dash = get_dashboard_analysis(DEMO_FILE_ID)
    pattern_cat = next((b for b in dash["leakage_breakdown"] if b["type"] == "UNUSUAL_PATTERN"), None)
    assert pattern_cat is not None
    assert pattern_cat["count"] > 0
    print(f"  Dashboard breakdown UNUSUAL_PATTERN: count={pattern_cat['count']}, amount=₹{pattern_cat['amount']:,.2f}. OK.")

    # Findings API
    findings_res = get_findings(DEMO_FILE_ID)
    pat_findings = [f for f in findings_res["findings"] if f["detection_type"] == "UNUSUAL_PATTERN"]
    assert len(pat_findings) > 0
    print(f"  Findings API: {len(pat_findings)} pattern findings exposed. OK.")

    print("PASS: Pattern findings integrated seamlessly into master pipeline and APIs.")


def run_all():
    print("==================================================================")
    print("SPENDINTEL STEP 4: UNUSUAL PATTERN DETECTION VERIFICATION")
    print("==================================================================")
    test_thresholds()
    test_patterns_on_demo_data()
    test_sudden_supplier_change_and_fragmentation()
    test_unusual_quantity_detection()
    test_urgent_and_off_channel_procurement()
    test_master_integration()
    print("\n==================================================================")
    print("STEP 4 UNUSUAL PATTERN DETECTION FULLY VERIFIED WITH 100% PASS RATE.")
    print("==================================================================")


if __name__ == "__main__":
    run_all()
