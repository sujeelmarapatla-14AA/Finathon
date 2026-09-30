"""
SpendIntel - Master Procurement Spend Leakage Analyzer.

Orchestrates the complete deterministic leakage audit pipeline:
1. Data Ingestion: Validates CSV/Excel formats, header whitespace, and required schemas.
2. Supplier Normalization: Standardizes vendor entity names while preserving original raw values.
3. Product Normalization: Resolves commodity naming while maintaining SKU identity (product_id).
4. Price Benchmarking: Actual-vs-benchmark unit rate variance calculations.
5. Duplicate Auditing: Duplicate purchase orders matching on SKU, supplier, quantity, and price.
6. Supplier Fragmentation: Multi-vendor product line analysis and vendor concentration.
7. Contract Compliance: Rate card baseline variance and off-contract purchasing.
8. Missed Discount Analysis: Unapplied negotiated contractual volume rebates.
9. Unusual Pattern Detection: Price spikes, sudden vendor switches, and volume outliers.

CRITICAL FINANCIAL INTEGRITY:
Strictly separates:
- Total Findings Count: The raw number of audit flags raised across all rules.
- Evidence Signals: Traceable forensic observations (rate differentials, terms, dates).
- Financial Leakage Amount: Deduplicated canonical leakage per transaction (max rule impact)
  to ensure independently measurable financial impact without double-counting.
"""

import os
from typing import Any, Dict, List, Union
import pandas as pd

# Support multiple import contexts (root, package, or relative)
try:
    from backend.app.services.leakage import (
        detect_price_anomalies,
        detect_duplicates,
        detect_supplier_fragmentation,
        compute_canonical_leakage,
    )
    from backend.app.services.normalization import normalize_procurement_dataframe
    from backend.app.services.contracts import detect_contract_findings
    from backend.app.services.patterns import detect_unusual_patterns
except ImportError:
    try:
        from app.services.leakage import (
            detect_price_anomalies,
            detect_duplicates,
            detect_supplier_fragmentation,
            compute_canonical_leakage,
        )
        from app.services.normalization import normalize_procurement_dataframe
        from app.services.contracts import detect_contract_findings
        from app.services.patterns import detect_unusual_patterns
    except ImportError:
        from .leakage import (
            detect_price_anomalies,
            detect_duplicates,
            detect_supplier_fragmentation,
            compute_canonical_leakage,
        )
        from .normalization import normalize_procurement_dataframe
        from .contracts import detect_contract_findings
        from .patterns import detect_unusual_patterns

REQUIRED_COLUMNS: List[str] = [
    "transaction_id",
    "product_id",
    "product_name",
    "supplier",
    "quantity",
    "unit_price",
    "benchmark_unit_price",
]


def analyze_procurement_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Execute comprehensive procurement spend leakage analysis on an in-memory DataFrame.

    Pipeline:
    1. Normalization: Canonicalizes suppliers and products.
    2. Detection: Executes all 6 audit engines independently.
    3. Deduplication: Calculates canonical transaction financial leakage.
    4. Aggregation: Formats backwards-compatible and enriched response.

    Returns:
        JSON-serializable dictionary with summary KPIs, normalized counts, and detailed findings.
    """
    df_clean = df.copy()
    df_clean.columns = df_clean.columns.astype(str).str.strip()

    # Validate required columns
    missing_columns = [col for col in REQUIRED_COLUMNS if col not in df_clean.columns]
    if missing_columns:
        raise ValueError(
            f"Missing required columns: {', '.join(missing_columns)}. "
            f"Expected columns: {', '.join(REQUIRED_COLUMNS)}."
        )

    # 1 & 2. SUPPLIER & PRODUCT NORMALIZATION
    df_clean = normalize_procurement_dataframe(df_clean)

    # Safe numeric conversion
    numeric_columns = ["quantity", "unit_price", "benchmark_unit_price"]
    for col in numeric_columns:
        df_clean[col] = pd.to_numeric(df_clean[col], errors="coerce").fillna(0.0)

    # 3. PRICE ANOMALY DETECTION (Actual vs Benchmark Baseline)
    price_anomalies = detect_price_anomalies(df_clean)

    # 4. DUPLICATE TRANSACTION DETECTION
    duplicates = detect_duplicates(df_clean)

    # 5. SUPPLIER FRAGMENTATION ANALYSIS
    fragmentation = detect_supplier_fragmentation(df_clean)

    # 6 & 7. CONTRACT COMPLIANCE & MISSED DISCOUNT ANALYSIS
    contract_audit = detect_contract_findings(df_clean)
    missed_discounts = contract_audit.get("missed_discounts", [])
    contract_findings = contract_audit.get("contract_compliance", [])

    # 8. UNUSUAL PROCUREMENT PATTERN DETECTION
    pattern_findings = detect_unusual_patterns(df_clean)

    # -------------------------------------------------------------------------
    # CRITICAL FINANCIAL RULE: DEDUPLICATED CANONICAL LEAKAGE
    # -------------------------------------------------------------------------
    canonical_leakage = compute_canonical_leakage(
        price_anomalies=price_anomalies,
        duplicates=duplicates,
        missed_discounts=missed_discounts,
        contract_findings=contract_findings,
        pattern_findings=pattern_findings,
    )

    # Financial aggregations
    total_spend = float((df_clean["quantity"] * df_clean["unit_price"]).sum())

    # Protect against division by zero
    if total_spend > 0:
        leakage_rate = float((canonical_leakage / total_spend) * 100.0)
    else:
        leakage_rate = 0.0

    # Counts & normalization metadata
    transactions_count = int(len(df_clean))
    suppliers_count = int(df_clean["supplier"].nunique())
    products_count = int(df_clean["product_id"].nunique())
    norm_suppliers_count = int(df_clean["normalized_supplier"].nunique())
    norm_products_count = int(df_clean["normalized_product_name"].nunique())

    return {
        # Preserved existing fields for API/frontend backward compatibility
        "transactions": transactions_count,
        "total_spend": round(total_spend, 2),
        "potential_leakage": round(canonical_leakage, 2),
        "leakage_rate": round(leakage_rate, 2),
        "price_anomalies": price_anomalies,
        "duplicates": duplicates,
        "fragmentation": fragmentation,
        "suppliers": suppliers_count,
        "products": products_count,

        # Enriched audit findings
        "contract_findings": contract_findings,
        "discount_findings": missed_discounts,
        "pattern_findings": pattern_findings,

        # Normalization metadata
        "normalized_supplier_count": norm_suppliers_count,
        "normalized_product_count": norm_products_count,
    }


def analyze_procurement(filepath: Union[str, os.PathLike]) -> Dict[str, Any]:
    """
    Execute comprehensive procurement spend leakage analysis on a file path or file_id.

    Pipeline:
    1. Ingestion: Reads CSV/Excel, validates required columns.
    2. Invokes analyze_procurement_dataframe().
    """
    from pathlib import Path
    filepath_obj = Path(filepath)

    # Check if direct file exists
    if not filepath_obj.exists():
        # Try resolving relative to uploads folder
        uploads_dir = Path(__file__).resolve().parent.parent / "data" / "uploads"
        
        # Handle demo alias
        target_name = "cb8b20d5-2516-47a9-8646-317e9beee50b" if str(filepath).lower() == "demo" else str(filepath)
        
        candidates = [
            uploads_dir / target_name,
            uploads_dir / f"{target_name}.csv",
            uploads_dir / f"{target_name}.xlsx",
            uploads_dir / f"{target_name}.xls",
        ]
        resolved = None
        for cand in candidates:
            if cand.exists():
                resolved = cand
                break
        if resolved:
            filepath_obj = resolved
        else:
            raise FileNotFoundError(f"Procurement file '{filepath}' not found.")

    lower_path = str(filepath_obj).lower()

    # 1. DATA INGESTION
    if lower_path.endswith((".xlsx", ".xls")):
        df = pd.read_excel(filepath_obj)
    else:
        df = pd.read_csv(filepath_obj)

    return analyze_procurement_dataframe(df)

