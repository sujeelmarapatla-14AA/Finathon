"""
SpendIntel - Master Procurement Spend Leakage Analyzer.

Orchestrates the complete deterministic leakage audit pipeline:
1. Data Ingestion & Schema Standardization:
   - Validates 4 required input fields: product, supplier, quantity, unit_price.
   - Automatically maps column aliases.
   - Deterministically generates product_id and transaction_id if omitted.
   - Treats benchmark_unit_price as an analytical output (never required as input).
2. Supplier Normalization: Standardizes vendor entity names while preserving original raw values.
3. Product Normalization & Attribute Extraction: Resolves commodity naming, extracts specifications & pack sizes.
4. Product Similarity & Comparability Engine: Calculates multi-factor product similarity (Category, Description, Specs, Pack Size, Brand, Quality, Reviews). Price is NEVER used as a similarity signal.
5. Benchmark Formulation: Groups genuinely comparable products for valid price benchmarking.
6. Price Benchmarking: Actual-vs-benchmark unit rate variance calculations on normalized units.
7. Duplicate Auditing: Duplicate purchase orders matching on SKU, supplier, quantity, and price.
8. Supplier Fragmentation: Multi-vendor product line analysis and vendor concentration.
9. Contract Compliance: Rate card baseline variance and off-contract purchasing.
10. Missed Discount Analysis: Unapplied negotiated contractual volume rebates.
11. Unusual Pattern Detection: Price spikes, sudden vendor switches, and volume outliers.
12. Equal-Price / Different-Spec Detection: Dedicated detection of identical-price items with divergent specifications.

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
    from backend.app.services.normalization import (
        normalize_procurement_dataframe,
        standardize_raw_procurement_dataframe,
    )
    from backend.app.services.contracts import detect_contract_findings
    from backend.app.services.patterns import detect_unusual_patterns
    from backend.app.services.product_similarity import analyze_product_intelligence
except ImportError:
    try:
        from app.services.leakage import (
            detect_price_anomalies,
            detect_duplicates,
            detect_supplier_fragmentation,
            compute_canonical_leakage,
        )
        from app.services.normalization import (
            normalize_procurement_dataframe,
            standardize_raw_procurement_dataframe,
        )
        from app.services.contracts import detect_contract_findings
        from app.services.patterns import detect_unusual_patterns
        from app.services.product_similarity import analyze_product_intelligence
    except ImportError:
        from .leakage import (
            detect_price_anomalies,
            detect_duplicates,
            detect_supplier_fragmentation,
            compute_canonical_leakage,
        )
        from .normalization import (
            normalize_procurement_dataframe,
            standardize_raw_procurement_dataframe,
        )
        from .contracts import detect_contract_findings
        from .patterns import detect_unusual_patterns
        from .product_similarity import analyze_product_intelligence

REQUIRED_COLUMNS: List[str] = [
    "product",
    "supplier",
    "quantity",
    "unit_price",
]


def analyze_procurement_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Execute comprehensive procurement spend leakage & product intelligence analysis.

    Pipeline:
    1. Schema Standardization & Validation: Standardizes aliases, generates missing IDs, computes benchmarks.
    2. Normalization: Canonicalizes suppliers and products.
    3. Product Similarity Engine: Evaluates multi-factor comparability and equal-price/different-spec scenarios.
    4. Detection: Executes price anomaly, duplicate, fragmentation, contract, discount, and pattern audits.
    5. Deduplication: Calculates canonical transaction financial leakage.
    6. Aggregation: Formats backwards-compatible and enriched response.

    Returns:
        JSON-serializable dictionary with summary KPIs, normalized counts, detailed findings, and product intelligence.
    """
    # 1. STANDARDIZE SCHEMA & VALIDATE REQUIRED INPUTS
    df_clean = standardize_raw_procurement_dataframe(df)

    # 2. SUPPLIER & PRODUCT NORMALIZATION
    df_clean = normalize_procurement_dataframe(df_clean)

    # Safe numeric conversion
    df_clean["quantity"] = pd.to_numeric(df_clean["quantity"], errors="coerce").fillna(1.0)
    df_clean["unit_price"] = pd.to_numeric(df_clean["unit_price"], errors="coerce").fillna(0.0)
    if "benchmark_unit_price" in df_clean.columns:
        df_clean["benchmark_unit_price"] = pd.to_numeric(df_clean["benchmark_unit_price"], errors="coerce")

    # 3. PRODUCT SIMILARITY & DIFFERENTIATION INTELLIGENCE
    product_intelligence = analyze_product_intelligence(df_clean)

    # 4. PRICE ANOMALY DETECTION (Actual vs Benchmark Baseline)
    price_anomalies = detect_price_anomalies(df_clean)

    # 5. DUPLICATE TRANSACTION DETECTION
    duplicates = detect_duplicates(df_clean)

    # 6. SUPPLIER FRAGMENTATION ANALYSIS
    fragmentation = detect_supplier_fragmentation(df_clean)

    # 7 & 8. CONTRACT COMPLIANCE & MISSED DISCOUNT ANALYSIS
    contract_audit = detect_contract_findings(df_clean)
    missed_discounts = contract_audit.get("missed_discounts", [])
    contract_findings = contract_audit.get("contract_compliance", [])

    # 9. UNUSUAL PROCUREMENT PATTERN DETECTION
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
    products_count = int(df_clean["product_id"].nunique()) if "product_id" in df_clean.columns else int(df_clean["normalized_product_name"].nunique())
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

        # Product Similarity & Differentiation Intelligence
        "product_intelligence": product_intelligence,
        "product_similarity_findings": product_intelligence.get("findings", []),

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
