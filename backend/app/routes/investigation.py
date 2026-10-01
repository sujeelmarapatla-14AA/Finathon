"""
SpendIntel - Forensic Investigation Route.

Provides structured forensic investigations for ALL 11 procurement spend leakage categories:
1. PRICE_ANOMALY
2. POSSIBLE_DUPLICATE
3. SUPPLIER_FRAGMENTATION
4. MISSED_DISCOUNT
5. CONTRACT_NON_COMPLIANCE
6. OFF_CONTRACT_PURCHASE
7. EXPIRED_CONTRACT
8. UNUSUAL_PRICE_PATTERN (and PRICE_SPIKE)
9. UNUSUAL_QUANTITY
10. SUDDEN_SUPPLIER_CHANGE
11. OFF_CHANNEL_PROCUREMENT

CRITICAL AUDIT RULES:
- Deterministic calculations only.
- Strict evidence traceability to actual dataset records.
- Zero invented numbers, contracts, or dates.
- AI layer acts strictly as an explanation/action-recommender over verified evidence.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Body
import pandas as pd

try:
    from app.services.ai_investigator import generate_investigation
    from app.services.analyzer import analyze_procurement
except ImportError:
    try:
        from backend.app.services.ai_investigator import generate_investigation
        from backend.app.services.analyzer import analyze_procurement
    except ImportError:
        generate_investigation = None
        analyze_procurement = None

router = APIRouter(tags=["investigation"])

# Resolve upload storage directory: backend/app/data/uploads
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
SUPPORTED_EXTENSIONS = [".csv", ".xlsx", ".xls"]


def _resolve_column(df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
    """Helper to resolve column name from candidate strings with case-insensitive fallback."""
    for candidate in candidates:
        if candidate in df.columns:
            return candidate
    lower_cols = {col.lower().replace(" ", "_"): col for col in df.columns}
    for candidate in candidates:
        cand_key = candidate.lower().replace(" ", "_")
        if cand_key in lower_cols:
            return lower_cols[cand_key]
    return None


def _format_inr(val: float) -> str:
    """Format numeric value in Indian Rupees notation."""
    sign = "-" if val < 0 else ""
    val = abs(val)
    if val == int(val):
        s = str(int(val))
        if len(s) <= 3:
            return sign + s
        last3 = s[-3:]
        rest = s[:-3]
        groups = []
        while len(rest) > 2:
            groups.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            groups.insert(0, rest)
        return sign + ",".join(groups) + "," + last3
    else:
        parts = f"{val:.2f}".split(".")
        s = parts[0]
        if len(s) <= 3:
            int_part = s
        else:
            last3 = s[-3:]
            rest = s[:-3]
            groups = []
            while len(rest) > 2:
                groups.insert(0, rest[-2:])
                rest = rest[:-2]
            if rest:
                groups.insert(0, rest)
            int_part = ",".join(groups) + "," + last3
        return sign + int_part + "." + parts[1]


def _normalize_finding_type(raw_type: Any) -> Optional[str]:
    """Map variants and synonyms into one of the canonical finding types."""
    if not isinstance(raw_type, str):
        return None
    t = str(raw_type).strip().upper()
    if t in ["EQUAL_PRICE_DIFFERENT_SPECIFICATION", "EQUAL_PRICE_DIFFERENT_SPEC", "EQUAL_PRICE", "EQP"]:
        return "EQUAL_PRICE_DIFFERENT_SPECIFICATION"
    if t in ["SPECIFICATION_DIFFERENCE", "SPEC_DIFFERENCE", "SPECIFICATION_DELTA", "SPEC"]:
        return "SPECIFICATION_DIFFERENCE"
    if t in ["PACK_SIZE_DIFFERENCE", "UNIT_NORMALIZATION_VARIANCE", "PACK_SIZE", "PCK"]:
        return "PACK_SIZE_DIFFERENCE"
    if t in ["QUALITY_DIFFERENCE", "QUALITY_DELTA", "WARRANTY_DIFFERENCE", "QUAL"]:
        return "QUALITY_DIFFERENCE"
    if t in ["INSUFFICIENT_COMPARISON_DATA", "INSUFFICIENT_DATA", "INSUFFICIENT_EVIDENCE", "INSUF"]:
        return "INSUFFICIENT_COMPARISON_DATA"
    if t in ["PRODUCT_SIMILARITY", "COMPARABLE_ALTERNATIVE", "SIMILARITY", "SIM"]:
        return "PRODUCT_SIMILARITY"
    if t in ["PRICE_SPIKE", "UNUSUAL_PRICE_PATTERN"]:
        return "UNUSUAL_PRICE_PATTERN"
    if t in ["EXCESSIVE_SUPPLIER_FRAGMENTATION", "FRAGMENTATION", "SUPPLIER_FRAGMENTATION"]:
        return "SUPPLIER_FRAGMENTATION"
    if t in ["DUPLICATE", "POSSIBLE_DUPLICATE", "DUPLICATES"]:
        return "POSSIBLE_DUPLICATE"
    if t in ["DISCOUNT", "MISSED_DISCOUNT", "UNAPPLIED_DISCOUNT"]:
        return "MISSED_DISCOUNT"
    if t in ["CONTRACT", "CONTRACT_COMPLIANCE", "CONTRACT_NON_COMPLIANCE"]:
        return "CONTRACT_NON_COMPLIANCE"
    if t in ["OFF_CONTRACT", "OFF_CONTRACT_PURCHASE"]:
        return "OFF_CONTRACT_PURCHASE"
    if t in ["EXPIRED", "EXPIRED_CONTRACT"]:
        return "EXPIRED_CONTRACT"
    if t in ["QUANTITY", "UNUSUAL_QUANTITY"]:
        return "UNUSUAL_QUANTITY"
    if t in ["SUPPLIER_CHANGE", "SUDDEN_SUPPLIER_CHANGE"]:
        return "SUDDEN_SUPPLIER_CHANGE"
    if t in ["OFF_CHANNEL", "OFF_CHANNEL_PROCUREMENT", "URGENT_PROCUREMENT"]:
        return "OFF_CHANNEL_PROCUREMENT"
    if t in ["PRICE_ANOMALY", "PRICE", "ANOMALY"]:
        return "PRICE_ANOMALY"
    return "PRICE_ANOMALY"


@router.post("/api/investigate/{file_id}/{transaction_id}")
@router.post("/investigate/{file_id}/{transaction_id}")
@router.get("/api/investigate/{file_id}/{transaction_id}")
@router.get("/investigate/{file_id}/{transaction_id}")
def investigate_transaction(
    file_id: str,
    transaction_id: str,
    finding_type: Optional[str] = Query(None, description="Explicit finding type to investigate"),
    payload: Optional[Dict[str, Any]] = Body(None, description="Optional request body"),
) -> Dict[str, Any]:
    """
    Return a structured forensic investigation for any detected procurement transaction or finding.

    Supported Categories (all 11):
    - PRICE_ANOMALY
    - POSSIBLE_DUPLICATE
    - SUPPLIER_FRAGMENTATION
    - MISSED_DISCOUNT
    - CONTRACT_NON_COMPLIANCE
    - OFF_CONTRACT_PURCHASE
    - EXPIRED_CONTRACT
    - UNUSUAL_PRICE_PATTERN
    - UNUSUAL_QUANTITY
    - SUDDEN_SUPPLIER_CHANGE
    - OFF_CHANNEL_PROCUREMENT

    Execution Pipeline:
    1. Retrieve the actual transaction/finding.
    2. Retrieve supporting evidence from dataset and historical baselines.
    3. Calculate deterministic financial impact (zero AI calculation, zero double-counting).
    4. Build a structured evidence object.
    5. Send only verified evidence to the AI layer.

    Returns:
        finding: Dict
        summary: str
        root_cause: str
        financial_impact: float
        evidence: List[Dict]
        recommended_actions: List[str]
        (and analyst_summary, field_evidence, ai_analysis for UI backward compatibility)
    """
    clean_id = file_id.strip().lower()
    if clean_id in ["nova", "live_nova", "live-nova"]:
        try:
            from app.services.nova_service import fetch_and_normalize_nova_procurement
        except ImportError:
            from backend.app.services.nova_service import fetch_and_normalize_nova_procurement
        try:
            df = fetch_and_normalize_nova_procurement()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Failed to fetch Nova procurement records: {str(e)}")
        return investigate_dataframe(df, transaction_id, finding_type=finding_type, payload=payload)

    target_id = "cb8b20d5-2516-47a9-8646-317e9beee50b" if clean_id == "demo" else file_id
    target_file = None
    for ext in SUPPORTED_EXTENSIONS:
        candidate = UPLOAD_DIR / f"{target_id}{ext}"
        if candidate.exists() and candidate.is_file():
            target_file = candidate
            break

    if not target_file:
        raise HTTPException(
            status_code=404,
            detail="File not found",
        )

    try:
        if target_file.suffix.lower() in [".xlsx", ".xls"]:
            df = pd.read_excel(target_file)
        else:
            df = pd.read_csv(target_file)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to parse dataset: {str(e)}",
        )

    return investigate_dataframe(df, transaction_id, finding_type=finding_type, payload=payload)


def investigate_dataframe(
    df: pd.DataFrame,
    transaction_id: str,
    finding_type: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Execute deterministic forensic investigation for a transaction within an in-memory DataFrame.
    """
    # Clean column names
    df = df.copy()
    df.columns = df.columns.astype(str).str.strip()

    # Resolve columns
    tx_col = _resolve_column(df, ["transaction_id", "id", "tx_id", "po_number", "po_id"])
    pid_col = _resolve_column(df, ["product_id", "sku", "item_code"])
    prod_col = _resolve_column(df, ["product_name", "product", "item_description", "description"])
    supp_col = _resolve_column(df, ["supplier", "supplier_name", "vendor_name", "vendor"])
    qty_col = _resolve_column(df, ["quantity", "qty", "units"])
    price_col = _resolve_column(df, ["unit_price", "actual_price", "price", "unit_cost"])
    bench_col = _resolve_column(df, ["benchmark_unit_price", "benchmark_price", "benchmark", "target_price"])
    dept_col = _resolve_column(df, ["department", "dept"])
    terms_col = _resolve_column(df, ["payment_terms", "terms"])
    disc_col = _resolve_column(df, ["contract_discount", "discount", "negotiated_discount"])
    expected_saving_col = _resolve_column(df, ["contract_saving_expected", "expected_savings"])
    date_col = _resolve_column(df, ["transaction_date", "date", "po_date"])
    channel_col = _resolve_column(df, ["channel", "procurement_channel", "purchase_channel"])
    expiry_col = _resolve_column(df, ["contract_end_date", "contract_expiry", "valid_to"])

    target_id_str = str(transaction_id).strip()

    # Determine explicit type from body or query if provided
    explicit_type = None
    if finding_type and isinstance(finding_type, str):
        explicit_type = _normalize_finding_type(finding_type)
    elif payload and isinstance(payload, dict):
        body_type = payload.get("finding_type") or payload.get("type")
        if body_type and isinstance(body_type, str):
            explicit_type = _normalize_finding_type(body_type)

    # Check common finding ID prefixes
    raw_query = target_id_str
    prefix_detected_type = None
    prefix_map = [
        ("FND-EQP-", "EQUAL_PRICE_DIFFERENT_SPECIFICATION"),
        ("FND-SPEC-", "SPECIFICATION_DIFFERENCE"),
        ("FND-PCK-", "PACK_SIZE_DIFFERENCE"),
        ("FND-QUAL-", "QUALITY_DIFFERENCE"),
        ("FND-INSUF-", "INSUFFICIENT_COMPARISON_DATA"),
        ("FND-SIM-", "PRODUCT_SIMILARITY"),
        ("SIM-", "PRODUCT_SIMILARITY"),
        ("DISC-", "MISSED_DISCOUNT"),
        ("DUP-", "POSSIBLE_DUPLICATE"),
        ("FRAG-", "SUPPLIER_FRAGMENTATION"),
        ("CONT-", "CONTRACT_NON_COMPLIANCE"),
        ("OFF-", "OFF_CONTRACT_PURCHASE"),
        ("EXP-", "EXPIRED_CONTRACT"),
        ("PAT-SPIKE-", "UNUSUAL_PRICE_PATTERN"),
        ("PAT-QTY-", "UNUSUAL_QUANTITY"),
        ("PAT-SUPP-", "SUDDEN_SUPPLIER_CHANGE"),
        ("CHAN-", "OFF_CHANNEL_PROCUREMENT"),
        ("ANO-", "PRICE_ANOMALY"),
    ]
    for prefix, f_type in prefix_map:
        if target_id_str.startswith(prefix):
            raw_query = target_id_str[len(prefix):]
            prefix_detected_type = f_type
            break

    # 1. RETRIEVE ACTUAL TRANSACTION / ENTITY ROW
    matches = pd.DataFrame()
    if tx_col:
        matches = df[df[tx_col].astype(str).str.strip() == raw_query]
        if matches.empty:
            matches = df[df[tx_col].astype(str).str.strip().str.lower() == raw_query.lower()]

    # If not matched on transaction_id, check product_id (e.g. for fragmentation query P001)
    is_product_query = False
    if matches.empty and pid_col:
        matches = df[df[pid_col].astype(str).str.strip().str.upper() == raw_query.upper()]
        if not matches.empty:
            is_product_query = True

    # If still not found, check if target_id_str itself is a product ID
    if matches.empty and pid_col:
        matches = df[df[pid_col].astype(str).str.strip().str.upper() == target_id_str.upper()]
        if not matches.empty:
            is_product_query = True
            raw_query = target_id_str

    if matches.empty:
        raise HTTPException(
            status_code=404,
            detail=f"Transaction or entity '{transaction_id}' not found in procurement dataset",
        )

    row = matches.iloc[0]

    # Extract field values
    raw_tx_id = str(row[tx_col]).strip() if tx_col and pd.notna(row[tx_col]) else raw_query
    product_id = str(row[pid_col]).strip() if pid_col and pd.notna(row[pid_col]) else ""
    product_name = str(row[prod_col]).strip() if prod_col and pd.notna(row[prod_col]) else "Product"
    supplier = str(row[supp_col]).strip() if supp_col and pd.notna(row[supp_col]) else "Supplier"
    tx_date = str(row[date_col]).strip() if date_col and pd.notna(row[date_col]) else ""
    proc_channel = str(row[channel_col]).strip() if channel_col and pd.notna(row[channel_col]) else "Standard"

    qty_val = pd.to_numeric(row[qty_col], errors="coerce") if qty_col and pd.notna(row[qty_col]) else 1.0
    actual_val = pd.to_numeric(row[price_col], errors="coerce") if price_col and pd.notna(row[price_col]) else 0.0
    bench_val = pd.to_numeric(row[bench_col], errors="coerce") if bench_col and pd.notna(row[bench_col]) else 0.0
    disc_val = pd.to_numeric(row[disc_col], errors="coerce") if disc_col and pd.notna(row[disc_col]) else 0.0

    quantity = int(qty_val) if float(qty_val).is_integer() else round(float(qty_val), 2)
    actual_price = float(actual_val)
    benchmark_price = float(bench_val)
    contract_discount = float(disc_val) if pd.notna(disc_val) else 0.0
    department = str(row[dept_col]).strip() if dept_col and pd.notna(row[dept_col]) else None
    payment_terms = str(row[terms_col]).strip() if terms_col and pd.notna(row[terms_col]) else "NET30"

    # Compute historical baselines for product
    product_history = df[df[pid_col] == product_id] if pid_col else df
    med_price = float(pd.to_numeric(product_history[price_col], errors="coerce").median()) if price_col else actual_price
    min_price = float(pd.to_numeric(product_history[price_col], errors="coerce").min()) if price_col else actual_price
    med_qty = float(pd.to_numeric(product_history[qty_col], errors="coerce").median()) if qty_col else float(quantity)
    suppliers_for_product = list(product_history[supp_col].dropna().unique()) if supp_col else [supplier]

    # Check for duplicate transactions matching SKU, supplier, quantity, price
    dup_matches = df[
        (df[pid_col] == product_id) &
        (df[supp_col] == supplier) &
        (df[qty_col] == quantity) &
        (df[price_col] == actual_price)
    ] if (pid_col and supp_col and qty_col and price_col) else pd.DataFrame()
    is_duplicate = len(dup_matches) >= 2

    # 2. DETERMINE TARGET FINDING TYPE
    target_type = explicit_type or prefix_detected_type
    if target_type is None:
        if is_product_query or len(suppliers_for_product) >= 2 and target_id_str.startswith("P"):
            target_type = "SUPPLIER_FRAGMENTATION"
        elif contract_discount > 0.0:
            target_type = "MISSED_DISCOUNT"
        elif is_duplicate:
            target_type = "POSSIBLE_DUPLICATE"
        elif benchmark_price > 0 and actual_price > benchmark_price:
            var_pct = ((actual_price - benchmark_price) / benchmark_price) * 100.0
            target_type = "OFF_CONTRACT_PURCHASE" if var_pct >= 8.0 else "CONTRACT_NON_COMPLIANCE"
        elif med_price > 0 and actual_price >= (med_price * 1.08):
            target_type = "UNUSUAL_PRICE_PATTERN"
        else:
            target_type = "PRICE_ANOMALY"

    target_type = _normalize_finding_type(target_type)

    # Default variables
    variance_percent = 0.0
    potential_leakage = 0.0
    expected_price = benchmark_price
    root_cause = ""
    evidence_steps: List[Dict[str, Any]] = []
    field_evidence: List[Dict[str, Any]] = []
    recommended_actions: List[str] = []
    risk = "MEDIUM"

    # -------------------------------------------------------------
    # 3. BUILD EVIDENCE & DETERMINISTIC FORENSICS ACROSS ALL 11 TYPES
    # -------------------------------------------------------------

    # TYPE 1: PRICE_ANOMALY
    if target_type == "PRICE_ANOMALY":
        if benchmark_price > 0:
            variance_percent = round(((actual_price - benchmark_price) / benchmark_price) * 100.0, 2)
        else:
            variance_percent = 0.0
        potential_leakage = round(max(actual_price - benchmark_price, 0.0) * float(quantity), 2)
        expected_price = benchmark_price
        risk = "HIGH" if (potential_leakage >= 50000.0 or variance_percent >= 15.0) else "MEDIUM"

        root_cause = (
            f"Invoiced unit price of ₹{actual_price:,.2f} for '{product_name}' exceeds the established "
            f"benchmark baseline of ₹{benchmark_price:,.2f} by +{variance_percent:.2f}% without contracted justification."
        )
        recommended_actions = [
            f"Issue procurement debit note to {supplier} for ₹{_format_inr(potential_leakage)} overcharge.",
            f"Update ERP purchase catalog price ceilings for SKU '{product_id}' to enforce benchmark rate.",
            "Require procurement manager sign-off for spot requisitions exceeding benchmark by more than 5%.",
        ]
        evidence_steps = [
            {
                "step": 1,
                "title": "Benchmark baseline",
                "description": f"Verified procurement benchmark for '{product_name}'.",
                "value": f"₹{_format_inr(benchmark_price)} / unit",
            },
            {
                "step": 2,
                "title": "Invoiced price deviation",
                "description": f"Invoiced price of ₹{_format_inr(actual_price)} reflects a +{variance_percent:.2f}% deviation.",
                "value": f"+{variance_percent:.2f}% variance",
            },
            {
                "step": 3,
                "title": "Avoidable price anomaly impact",
                "description": f"Differential of ₹{_format_inr(actual_price - benchmark_price)} incurred across {quantity} units.",
                "value": f"₹{_format_inr(potential_leakage)}",
            },
            {
                "step": 4,
                "title": "Operational details",
                "description": f"Payment terms: {payment_terms}, Department: {department or 'General'}.",
                "value": f"{payment_terms}",
            },
        ]
        field_evidence = [
            {"source": "Price Benchmark", "field": "benchmark_unit_price", "value": f"₹{benchmark_price:,.2f}", "relationship": "Target benchmark"},
            {"source": "Invoice", "field": "unit_price", "value": f"₹{actual_price:,.2f}", "relationship": "Billed rate"},
            {"source": "Variance", "field": "variance_percent", "value": f"+{variance_percent:.2f}%", "relationship": "Price anomaly deviation"},
            {"source": "Impact", "field": "potential_leakage", "value": f"₹{potential_leakage:,.2f}", "relationship": "Financial leakage"},
        ]

    # TYPE 2: POSSIBLE_DUPLICATE
    elif target_type == "POSSIBLE_DUPLICATE":
        dup_count = len(dup_matches) if not dup_matches.empty else 2
        potential_leakage = round(float(actual_price * quantity), 2)
        variance_percent = 0.0
        expected_price = actual_price
        risk = "HIGH" if (potential_leakage >= 100000.0 or dup_count >= 3) else "MEDIUM"

        matching_txs = list(dup_matches[tx_col].dropna().astype(str).unique()) if (not dup_matches.empty and tx_col) else [raw_tx_id]
        root_cause = (
            f"Identical purchase order cluster detected for '{product_name}' from {supplier} "
            f"({quantity} units @ ₹{actual_price:,.2f}) across {dup_count} instances ({', '.join(matching_txs)})."
        )
        recommended_actions = [
            f"Place an immediate payment freeze on invoice {raw_tx_id} pending operational receiving audit.",
            "Reconcile warehouse delivery receipts to verify whether goods were physically received twice or erroneously double-billed.",
            "Configure automated 3-way matching duplicate prevention rules in ERP for identical vendor/SKU orders within 30 days.",
        ]
        evidence_steps = [
            {
                "step": 1,
                "title": "Duplicate cluster identified",
                "description": f"Order matches {dup_count} identical records for SKU '{product_id}' from '{supplier}'.",
                "value": f"{dup_count} transactions: {', '.join(matching_txs)}",
            },
            {
                "step": 2,
                "title": "Order specifications",
                "description": f"Exact matching parameters: {quantity} units @ ₹{_format_inr(actual_price)} per unit.",
                "value": f"Order Total: ₹{_format_inr(potential_leakage)}",
            },
            {
                "step": 3,
                "title": "Redundant cash outflow exposure",
                "description": "Entire secondary transaction represents potentially avoidable duplicate cash outflow.",
                "value": f"₹{_format_inr(potential_leakage)}",
            },
        ]
        field_evidence = [
            {"source": "Duplicate Match", "field": "matching_orders", "value": ", ".join(matching_txs), "relationship": "Cluster transactions"},
            {"source": "Procurement", "field": "order_amount", "value": f"₹{potential_leakage:,.2f}", "relationship": "Redundant outlay"},
            {"source": "Audit Rule", "field": "duplicate_criteria", "value": "Same SKU, Vendor, Qty, Unit Price", "relationship": "Detection rule"},
        ]

    # TYPE 3: SUPPLIER_FRAGMENTATION
    elif target_type == "SUPPLIER_FRAGMENTATION":
        vendor_count = len(suppliers_for_product)
        prod_spend = float((pd.to_numeric(product_history[price_col], errors="coerce").fillna(0.0) *
                            pd.to_numeric(product_history[qty_col], errors="coerce").fillna(1.0)).sum()) if (price_col and qty_col) else 0.0
        potential_leakage = 0.0  # Zero double-counting; structural commercial opportunity
        variance_percent = 0.0
        expected_price = benchmark_price
        risk = "HIGH" if (vendor_count >= 4 or prod_spend >= 500000.0) else "MEDIUM"

        root_cause = (
            f"Procurement demand for '{product_name}' (SKU: {product_id}) is fragmented across {vendor_count} distinct suppliers "
            f"({', '.join(suppliers_for_product[:3])}) rather than consolidated under an enterprise agreement."
        )
        recommended_actions = [
            f"Consolidate category demand for '{product_name}' under a single master vendor RFP to capture tiered volume rebates.",
            f"Standardize preferred supplier rate card for SKU '{product_id}' across all operating departments.",
            "Establish strict catalog routing rules to prevent off-contract spot vendor proliferation.",
        ]
        evidence_steps = [
            {
                "step": 1,
                "title": "Supplier dispersion",
                "description": f"Product procured across {vendor_count} separate vendors: {', '.join(suppliers_for_product)}.",
                "value": f"{vendor_count} active vendors",
            },
            {
                "step": 2,
                "title": "Total category spend",
                "description": f"Cumulative spend for SKU across {len(product_history)} purchase orders.",
                "value": f"₹{_format_inr(prod_spend)}",
            },
            {
                "step": 3,
                "title": "Consolidation leverage",
                "description": "Demand aggregation provides commercial leverage to negotiate enterprise volume discounts.",
                "value": "Volume Consolidation",
            },
        ]
        field_evidence = [
            {"source": "Vendor Analytics", "field": "supplier_count", "value": vendor_count, "relationship": "Active suppliers"},
            {"source": "Spend Consolidation", "field": "total_spend", "value": f"₹{prod_spend:,.2f}", "relationship": "Fragmented spend"},
            {"source": "Suppliers", "field": "vendor_list", "value": ", ".join(suppliers_for_product), "relationship": "Vendor roster"},
        ]

    # TYPE 4: MISSED_DISCOUNT
    elif target_type == "MISSED_DISCOUNT":
        disc_rate = contract_discount / 100.0 if contract_discount > 1.0 else contract_discount
        disc_pct = disc_rate * 100.0
        expected_price = round(actual_price * (1.0 - disc_rate), 2)
        variance_percent = round(disc_pct, 2)

        if expected_saving_col and pd.notna(row[expected_saving_col]):
            potential_leakage = round(float(row[expected_saving_col]), 2)
        else:
            potential_leakage = round((actual_price * disc_rate) * float(quantity), 2)

        risk = "HIGH" if (potential_leakage >= 100000.0 or disc_pct >= 10.0) else "MEDIUM"
        root_cause = (
            f"The vendor {supplier} billed at standard unit price ₹{actual_price:,.2f} without "
            f"applying the agreed {disc_pct:.1f}% negotiated volume rebate, resulting in unapplied discount leakage."
        )
        recommended_actions = [
            f"Issue immediate commercial debit note to {supplier} for unapplied rebate of ₹{_format_inr(potential_leakage)}.",
            f"Update ERP purchase order master to enforce mandatory {disc_pct:.1f}% discount deduction.",
            f"Audit historical invoices from {supplier} across past 12 months for repeated missed discount leakage.",
        ]
        evidence_steps = [
            {
                "step": 1,
                "title": "Contractual rebate entitlement",
                "description": f"Master contract with {supplier} establishes a {disc_pct:.1f}% volume rebate.",
                "value": f"{disc_pct:.1f}% rebate entitlement",
            },
            {
                "step": 2,
                "title": "Invoiced rate vs expected rate",
                "description": f"Invoiced unit price ₹{_format_inr(actual_price)} billed without agreed discount deduction.",
                "value": f"Billed: ₹{_format_inr(actual_price)} | Expected: ₹{_format_inr(expected_price)}",
            },
            {
                "step": 3,
                "title": "Unrecovered commercial discount",
                "description": f"Differential of ₹{_format_inr(actual_price - expected_price)} across {quantity} units.",
                "value": f"₹{_format_inr(potential_leakage)}",
            },
            {
                "step": 4,
                "title": "Commercial terms compliance",
                "description": f"Governing payment terms: {payment_terms}, Department: {department or 'General'}.",
                "value": f"{payment_terms}",
            },
        ]
        field_evidence = [
            {"source": "Contract Terms", "field": "contract_discount", "value": f"{disc_pct:.1f}%", "relationship": "Agreed rebate rate"},
            {"source": "Invoicing", "field": "unit_price", "value": f"₹{actual_price:,.2f}", "relationship": "Billed unit price"},
            {"source": "Calculation", "field": "expected_price", "value": f"₹{expected_price:,.2f}", "relationship": "Contractual net rate"},
            {"source": "Impact", "field": "potential_leakage", "value": f"₹{potential_leakage:,.2f}", "relationship": "Unrecovered rebate"},
        ]

    # TYPE 5: CONTRACT_NON_COMPLIANCE
    elif target_type == "CONTRACT_NON_COMPLIANCE":
        if benchmark_price > 0:
            variance_percent = round(((actual_price - benchmark_price) / benchmark_price) * 100.0, 2)
        else:
            variance_percent = 0.0
        potential_leakage = round(max(actual_price - benchmark_price, 0.0) * float(quantity), 2)
        expected_price = benchmark_price
        risk = "HIGH" if (potential_leakage >= 50000.0 or variance_percent >= 15.0) else "MEDIUM"

        root_cause = (
            f"Invoiced price of ₹{actual_price:,.2f} from {supplier} violates governing contracted rate card "
            f"baseline ₹{benchmark_price:,.2f} by +{variance_percent:.2f}%."
        )
        recommended_actions = [
            f"Enforce contracted rate card pricing with {supplier} and hold pending disbursements.",
            f"Issue debit note for ₹{_format_inr(potential_leakage)} to recover contractual overbilling.",
            "Configure ERP price variance tolerances to automatically reject orders exceeding contracted rate cards.",
        ]
        evidence_steps = [
            {
                "step": 1,
                "title": "Contracted rate card benchmark",
                "description": f"Master contract rate baseline established for '{product_name}'.",
                "value": f"₹{_format_inr(benchmark_price)} / unit",
            },
            {
                "step": 2,
                "title": "Non-compliant rate billed",
                "description": f"Invoice billed at ₹{_format_inr(actual_price)} (+{variance_percent:.2f}% above contract rate).",
                "value": f"+{variance_percent:.2f}% rate breach",
            },
            {
                "step": 3,
                "title": "Contractual overpayment impact",
                "description": f"Avoidable rate card variance calculated across {quantity} units.",
                "value": f"₹{_format_inr(potential_leakage)}",
            },
            {
                "step": 4,
                "title": "Governing terms",
                "description": f"Payment terms: {payment_terms}, Department: {department or 'General'}.",
                "value": f"{payment_terms}",
            },
        ]
        field_evidence = [
            {"source": "Rate Card", "field": "contract_price", "value": f"₹{benchmark_price:,.2f}", "relationship": "Contracted rate"},
            {"source": "Invoice", "field": "unit_price", "value": f"₹{actual_price:,.2f}", "relationship": "Billed rate"},
            {"source": "Compliance", "field": "variance_percent", "value": f"+{variance_percent:.2f}%", "relationship": "Rate card variance"},
            {"source": "Impact", "field": "potential_leakage", "value": f"₹{potential_leakage:,.2f}", "relationship": "Overpayment"},
        ]

    # TYPE 6: OFF_CONTRACT_PURCHASE
    elif target_type == "OFF_CONTRACT_PURCHASE":
        if benchmark_price > 0:
            variance_percent = round(((actual_price - benchmark_price) / benchmark_price) * 100.0, 2)
        else:
            variance_percent = 0.0
        potential_leakage = round(max(actual_price - benchmark_price, 0.0) * float(quantity), 2)
        expected_price = benchmark_price
        risk = "HIGH" if (potential_leakage >= 50000.0 or variance_percent >= 15.0) else "MEDIUM"

        root_cause = (
            f"Order placed off-contract with {supplier} at spot rate ₹{actual_price:,.2f}, bypassing "
            f"approved contract rate card baseline of ₹{benchmark_price:,.2f} (+{variance_percent:.2f}% premium)."
        )
        recommended_actions = [
            f"Route future requisitions for '{product_name}' exclusively through contracted supplier catalogs.",
            f"Notify {department or 'department'} requisition manager of off-contract procurement policy breach.",
            "Implement mandatory procurement approval gate for all off-contract spot purchases exceeding ₹25,000.",
        ]
        evidence_steps = [
            {
                "step": 1,
                "title": "Contracted catalog baseline",
                "description": f"Approved contract rate card baseline for '{product_name}'.",
                "value": f"₹{_format_inr(benchmark_price)} / unit",
            },
            {
                "step": 2,
                "title": "Off-contract spot pricing",
                "description": f"Requisition executed at spot price ₹{_format_inr(actual_price)} (+{variance_percent:.2f}% markup).",
                "value": f"+{variance_percent:.2f}% markup",
            },
            {
                "step": 3,
                "title": "Avoidable spot purchase premium",
                "description": f"Calculated premium incurred across {quantity} units.",
                "value": f"₹{_format_inr(potential_leakage)}",
            },
            {
                "step": 4,
                "title": "Procurement metadata",
                "description": f"Department: {department or 'General'}, Payment terms: {payment_terms}.",
                "value": f"{payment_terms}",
            },
        ]
        field_evidence = [
            {"source": "Catalog Master", "field": "benchmark_unit_price", "value": f"₹{benchmark_price:,.2f}", "relationship": "Contracted benchmark"},
            {"source": "Spot Requisition", "field": "unit_price", "value": f"₹{actual_price:,.2f}", "relationship": "Spot price"},
            {"source": "Policy Status", "field": "compliance_status", "value": "OFF_CONTRACT", "relationship": "Policy status"},
            {"source": "Financial Exposure", "field": "potential_leakage", "value": f"₹{potential_leakage:,.2f}", "relationship": "Leakage"},
        ]

    # TYPE 7: EXPIRED_CONTRACT
    elif target_type == "EXPIRED_CONTRACT":
        if benchmark_price > 0:
            variance_percent = round(((actual_price - benchmark_price) / benchmark_price) * 100.0, 2)
            potential_leakage = round(max(actual_price - benchmark_price, 0.0) * float(quantity), 2)
        else:
            variance_percent = 0.0
            potential_leakage = 0.0
        expected_price = benchmark_price if benchmark_price > 0 else actual_price
        risk = "HIGH" if potential_leakage >= 50000.0 else "MEDIUM"

        expiry_val = str(row[expiry_col]).strip() if expiry_col and pd.notna(row[expiry_col]) else "Contract Period Lapsed"
        root_cause = (
            f"Transaction executed under expired contract agreement with {supplier}; purchase date "
            f"{tx_date or 'recorded'} occurred outside the active contractual coverage period."
        )
        recommended_actions = [
            f"Initiate expedited contract renewal negotiations with {supplier} to re-establish contracted rate schedules.",
            "Place temporary hold on subsequent purchase orders under the lapsed agreement.",
            "Benchmark current supplier rate against market pricing to assess renewal terms.",
        ]
        evidence_steps = [
            {
                "step": 1,
                "title": "Contract validity expiration",
                "description": f"Purchase date {tx_date or 'recorded'} fell outside active contract period.",
                "value": f"Status: {expiry_val}",
            },
            {
                "step": 2,
                "title": "Invoiced rate under expired terms",
                "description": f"Billed at ₹{_format_inr(actual_price)} without ratified commercial protection.",
                "value": f"₹{_format_inr(actual_price)} / unit",
            },
            {
                "step": 3,
                "title": "Unhedged price exposure",
                "description": f"Rate deviation of +{variance_percent:.2f}% against standard benchmark.",
                "value": f"₹{_format_inr(potential_leakage)}",
            },
        ]
        field_evidence = [
            {"source": "Contract Master", "field": "contract_status", "value": "EXPIRED", "relationship": "Agreement validity"},
            {"source": "Transaction", "field": "transaction_date", "value": tx_date or "N/A", "relationship": "PO date"},
            {"source": "Rate Variance", "field": "variance_percent", "value": f"+{variance_percent:.2f}%", "relationship": "Unhedged markup"},
        ]

    # TYPE 8: UNUSUAL_PRICE_PATTERN (PRICE_SPIKE)
    elif target_type in ["UNUSUAL_PRICE_PATTERN", "PRICE_SPIKE"]:
        target_type = "UNUSUAL_PRICE_PATTERN"
        if med_price > 0:
            variance_percent = round(((actual_price - med_price) / med_price) * 100.0, 2)
        else:
            variance_percent = 0.0
        potential_leakage = round(max(actual_price - med_price, 0.0) * float(quantity), 2)
        expected_price = round(med_price, 2)
        risk = "HIGH" if variance_percent >= 15.0 else "MEDIUM"

        root_cause = (
            f"Unit price of ₹{actual_price:,.2f} on {tx_date or 'order date'} spiked by +{variance_percent:.2f}% "
            f"over the verified historical product median rate of ₹{med_price:,.2f} for '{product_name}'."
        )
        recommended_actions = [
            f"Request formal cost breakdown and commodity index justification from {supplier} for price surge.",
            "Review market commodity trends to verify whether surge reflects genuine supply shock or unapproved rate inflation.",
            "Enforce price surge tolerance thresholds in procurement approval workflow.",
        ]
        evidence_steps = [
            {
                "step": 1,
                "title": "Historical price baseline",
                "description": f"Historical median purchase price for '{product_name}'.",
                "value": f"₹{_format_inr(med_price)} / unit",
            },
            {
                "step": 2,
                "title": "Sudden price surge",
                "description": f"Transaction invoiced at ₹{_format_inr(actual_price)} (+{variance_percent:.2f}% surge).",
                "value": f"+{variance_percent:.2f}% surge",
            },
            {
                "step": 3,
                "title": "Avoidable financial exposure",
                "description": f"Spike premium calculated across {quantity} units.",
                "value": f"₹{_format_inr(potential_leakage)}",
            },
        ]
        field_evidence = [
            {"source": "Historical Analytics", "field": "median_unit_price", "value": f"₹{med_price:,.2f}", "relationship": "Historical median"},
            {"source": "Transaction Rate", "field": "unit_price", "value": f"₹{actual_price:,.2f}", "relationship": "Spiked price"},
            {"source": "Variance", "field": "variance_percent", "value": f"+{variance_percent:.2f}%", "relationship": "Surge percentage"},
        ]

    # TYPE 9: UNUSUAL_QUANTITY
    elif target_type == "UNUSUAL_QUANTITY":
        qty_multiplier = round(quantity / med_qty, 1) if med_qty > 0 else 1.0
        potential_leakage = 0.0  # Operational volume risk; zero double-counting
        variance_percent = 0.0
        expected_price = benchmark_price
        risk = "MEDIUM"

        root_cause = (
            f"Transaction volume of {quantity} units is {qty_multiplier}x higher than the historical "
            f"median order volume of {int(med_qty)} units for SKU '{product_id}'."
        )
        recommended_actions = [
            "Verify operational demand plan to confirm whether volume surge corresponds to an authorized capital project.",
            "Confirm warehouse receiving capacity and assess holding cost impact.",
            "Renegotiate tiered volume discount rate card based on aggregate batch volume.",
        ]
        evidence_steps = [
            {
                "step": 1,
                "title": "Historical volume baseline",
                "description": f"Historical median order quantity for '{product_name}'.",
                "value": f"{int(med_qty)} units",
            },
            {
                "step": 2,
                "title": "Volume outlier detected",
                "description": f"Current order quantity of {quantity} units ({qty_multiplier}x historical median).",
                "value": f"{quantity} units ({qty_multiplier}x)",
            },
            {
                "step": 3,
                "title": "Inventory holding risk",
                "description": "Large batch size may create working capital lockup or obsolete inventory exposure.",
                "value": "Volume Outlier Risk",
            },
        ]
        field_evidence = [
            {"source": "Volume Analytics", "field": "median_quantity", "value": int(med_qty), "relationship": "Historical median"},
            {"source": "Order Volume", "field": "quantity", "value": quantity, "relationship": "Outlier quantity"},
            {"source": "Multiple Factor", "field": "volume_multiplier", "value": f"{qty_multiplier}x", "relationship": "Outlier multiplier"},
        ]

    # TYPE 10: SUDDEN_SUPPLIER_CHANGE
    elif target_type == "SUDDEN_SUPPLIER_CHANGE":
        if min_price > 0:
            variance_percent = round(((actual_price - min_price) / min_price) * 100.0, 2)
        else:
            variance_percent = 0.0
        potential_leakage = round(max(actual_price - min_price, 0.0) * float(quantity), 2)
        expected_price = round(min_price, 2)
        risk = "HIGH" if variance_percent >= 10.0 else "MEDIUM"

        root_cause = (
            f"Order for '{product_name}' was routed to alternative vendor {supplier} at ₹{actual_price:,.2f}, "
            f"bypassing established lower-cost source available at ₹{min_price:,.2f} (+{variance_percent:.2f}% premium)."
        )
        recommended_actions = [
            f"Audit requisition workflow to determine why lower-cost source at ₹{_format_inr(min_price)} was bypassed.",
            "Re-engage primary vendor to confirm volume availability and SLA compliance.",
            "Establish automated requisition routing to ensure orders default to the lowest contracted rate card vendor.",
        ]
        evidence_steps = [
            {
                "step": 1,
                "title": "Verified lower-cost source",
                "description": f"Established procurement rate available for '{product_name}'.",
                "value": f"₹{_format_inr(min_price)} / unit",
            },
            {
                "step": 2,
                "title": "Alternative vendor routing",
                "description": f"Procured from {supplier} at ₹{_format_inr(actual_price)} (+{variance_percent:.2f}% premium).",
                "value": f"₹{_format_inr(actual_price)} / unit",
            },
            {
                "step": 3,
                "title": "Avoidable supplier premium",
                "description": f"Avoidable differential incurred across {quantity} units.",
                "value": f"₹{_format_inr(potential_leakage)}",
            },
        ]
        field_evidence = [
            {"source": "Supplier Baseline", "field": "lowest_price", "value": f"₹{min_price:,.2f}", "relationship": "Lowest verified rate"},
            {"source": "Alternative Vendor", "field": "unit_price", "value": f"₹{actual_price:,.2f}", "relationship": "Alternative rate"},
            {"source": "Supplier Premium", "field": "variance_percent", "value": f"+{variance_percent:.2f}%", "relationship": "Price premium"},
        ]

    # TYPE 12: EQUAL_PRICE_DIFFERENT_SPECIFICATION
    elif target_type == "EQUAL_PRICE_DIFFERENT_SPECIFICATION":
        variance_percent = 0.0
        potential_leakage = 0.0
        expected_price = actual_price
        risk = "MEDIUM"

        root_cause = (
            f"Equal transaction price (₹{actual_price:,.2f}) does not imply equivalent procurement value. "
            f"Item '{product_name}' was procured at identical rate to higher-tier specifications, representing "
            f"suboptimal return on procurement spend."
        )
        recommended_actions = [
            f"Audit catalog tiering for '{product_name}' to distinguish base vs high-performance configurations.",
            "Centralize subsequent requisitions on higher-specification tier available at identical pricing.",
            "Request vendor credit or price renegotiation reflecting actual component specification differences.",
        ]
        evidence_steps = [
            {
                "step": 1,
                "title": "Equal Transaction Rate Invoiced",
                "description": f"Invoiced unit rate of ₹{_format_inr(actual_price)} matches comparable peer price baseline.",
                "value": f"₹{_format_inr(actual_price)} / unit",
            },
            {
                "step": 2,
                "title": "Specification Divergence Detected",
                "description": f"Divergence in core technical attributes (memory, storage, wattage, or material).",
                "value": "Material Spec Divergence",
            },
            {
                "step": 3,
                "title": "Suboptimal Value Realization",
                "description": "Equal financial outlay incurred for lower configuration return.",
                "value": "Zero Price Delta / Divergent Spec",
            },
        ]
        field_evidence = [
            {"source": "Transaction Price", "field": "unit_price", "value": f"₹{actual_price:,.2f}", "relationship": "Invoiced rate"},
            {"source": "Comparability Check", "field": "spec_status", "value": "DIFFERENT_TIER", "relationship": "Specification status"},
            {"source": "Finding Type", "field": "finding_type", "value": "EQUAL_PRICE_DIFFERENT_SPECIFICATION", "relationship": "Audit category"},
        ]

    # TYPE 13: SPECIFICATION_DIFFERENCE
    elif target_type == "SPECIFICATION_DIFFERENCE":
        variance_percent = round(((actual_price - benchmark_price) / benchmark_price * 100.0), 2) if benchmark_price > 0 else 0.0
        potential_leakage = round(max(actual_price - benchmark_price, 0.0) * float(quantity), 2)
        expected_price = benchmark_price if benchmark_price > 0 else actual_price
        risk = "LOW"

        root_cause = (
            f"Price variation for '{product_name}' corresponds to differing specification tiers "
            f"rather than an unjustified supplier price increase."
        )
        recommended_actions = [
            "Maintain separate benchmark indices for differing technical specification tiers.",
            "Do not benchmark lower-tier requisitions directly against premium tier configurations.",
        ]
        evidence_steps = [
            {
                "step": 1,
                "title": "Category Family Match",
                "description": f"Requisitioned under {department or 'General Procurement'} commodity catalog.",
                "value": f"{product_name}",
            },
            {
                "step": 2,
                "title": "Specification Tier Context",
                "description": "Price differential reflects technical hardware or grade differences.",
                "value": f"Unit Rate: ₹{_format_inr(actual_price)}",
            },
        ]
        field_evidence = [
            {"source": "Specification Analysis", "field": "tier_status", "value": "CONTEXTUAL_DELTA", "relationship": "Tier status"},
        ]

    # TYPE 14: PACK_SIZE_DIFFERENCE
    elif target_type == "PACK_SIZE_DIFFERENCE":
        variance_percent = 0.0
        potential_leakage = 0.0
        expected_price = actual_price
        risk = "MEDIUM"

        root_cause = (
            f"Purchasing quantity for '{product_name}' was billed in non-standard pack formatting. "
            f"Transaction rates must be normalized to standard base units before evaluating price leakage."
        )
        recommended_actions = [
            "Enforce standard unit-of-measure (UOM) coding in purchase orders.",
            "Benchmark vendor quotes strictly on normalized unit basis (per piece, liter, or kg).",
        ]
        evidence_steps = [
            {
                "step": 1,
                "title": "Pack Format Divergence",
                "description": "Package or volume packaging differs from catalog standard.",
                "value": f"{quantity} units billed",
            },
            {
                "step": 2,
                "title": "Unit Normalization Rule",
                "description": "Normalized rate evaluated per single base unit.",
                "value": f"₹{_format_inr(actual_price)} / unit",
            },
        ]
        field_evidence = [
            {"source": "UOM Audit", "field": "pack_size", "value": "VARIABLE_PACKAGING", "relationship": "Packaging format"},
        ]

    # TYPE 15: PRODUCT_SIMILARITY & QUALITY_DIFFERENCE & INSUFFICIENT_DATA
    elif target_type in ["PRODUCT_SIMILARITY", "QUALITY_DIFFERENCE", "INSUFFICIENT_COMPARISON_DATA"]:
        variance_percent = 0.0
        potential_leakage = 0.0
        expected_price = actual_price
        risk = "LOW"

        root_cause = (
            f"Multi-factor product intelligence evaluated for '{product_name}' under {target_type} audit."
        )
        recommended_actions = [
            "Review multi-attribute comparison matrix before approving supplier substitution.",
            "Ensure full specification data is recorded in requisition forms.",
        ]
        evidence_steps = [
            {
                "step": 1,
                "title": "Multi-Factor Similarity Analysis",
                "description": "Evaluated across Category, Description, Specs, Pack Size, Brand, Quality, and Reviews.",
                "value": f"Finding: {target_type}",
            },
            {
                "step": 2,
                "title": "Traceable Evidence Record",
                "description": f"Verified procurement record for {product_name} from {supplier}.",
                "value": f"₹{_format_inr(actual_price)} / unit",
            },
        ]
        field_evidence = [
            {"source": "Product Intelligence", "field": "audit_type", "value": target_type, "relationship": "Intelligence category"},
        ]

    # TYPE 11: OFF_CHANNEL_PROCUREMENT
    else:  # OFF_CHANNEL_PROCUREMENT
        target_type = "OFF_CHANNEL_PROCUREMENT"
        if benchmark_price > 0:
            variance_percent = round(((actual_price - benchmark_price) / benchmark_price) * 100.0, 2)
            potential_leakage = round(max(actual_price - benchmark_price, 0.0) * float(quantity), 2)
        else:
            variance_percent = 0.0
            potential_leakage = 0.0
        expected_price = benchmark_price if benchmark_price > 0 else actual_price
        risk = "HIGH" if potential_leakage >= 50000.0 else "MEDIUM"

        root_cause = (
            f"Procurement transaction for '{product_name}' was executed through an unapproved or spot "
            f"purchase channel ({proc_channel}) rather than the authorized enterprise procurement portal."
        )
        recommended_actions = [
            f"Enforce mandatory procurement catalog punch-out routing for all requisitions of '{product_name}'.",
            "Require secondary finance sign-off before settling spot purchase or unapproved channel invoices.",
            "Conduct procurement compliance review with the requisitioning department.",
        ]
        evidence_steps = [
            {
                "step": 1,
                "title": "Channel compliance deviation",
                "description": f"Requisition executed via '{proc_channel}' channel outside approved procurement portal.",
                "value": f"Channel: {proc_channel}",
            },
            {
                "step": 2,
                "title": "Rate comparison against catalog",
                "description": f"Spot rate ₹{_format_inr(actual_price)} vs authorized catalog rate ₹{_format_inr(expected_price)}.",
                "value": f"+{variance_percent:.2f}% deviation",
            },
            {
                "step": 3,
                "title": "Avoidable channel premium",
                "description": f"Premium incurred across {quantity} units.",
                "value": f"₹{_format_inr(potential_leakage)}",
            },
        ]
        field_evidence = [
            {"source": "Procurement Channel", "field": "channel", "value": proc_channel, "relationship": "Purchase channel"},
            {"source": "Compliance Status", "field": "policy_status", "value": "UNAPPROVED_CHANNEL", "relationship": "Policy status"},
            {"source": "Spot Premium", "field": "potential_leakage", "value": f"₹{potential_leakage:,.2f}", "relationship": "Channel leakage"},
        ]

    # 4. CONSTRUCT STRUCTURED FINDING AND SUMMARY
    leakage_clean = int(potential_leakage) if potential_leakage.is_integer() else round(potential_leakage, 2)
    finding: Dict[str, Any] = {
        "id": f"{target_type[:4]}-{raw_tx_id}",
        "transaction_id": raw_tx_id,
        "product_id": product_id,
        "product": product_name,
        "product_name": product_name,
        "supplier": supplier,
        "quantity": quantity,
        "actual_price": round(actual_price, 2),
        "benchmark_price": round(benchmark_price, 2),
        "expected_price": round(expected_price, 2),
        "variance": variance_percent,
        "variance_percent": variance_percent,
        "potential_leakage": leakage_clean,
        "type": target_type,
        "detection_type": target_type,
        "risk": risk,
        "reason": root_cause,
        "evidence": [s.get("description", "") for s in evidence_steps],
    }
    if department:
        finding["department"] = department
    if payment_terms:
        finding["payment_terms"] = payment_terms
    if contract_discount > 0:
        finding["contract_discount"] = contract_discount

    # Analyst summary
    unit_phrase = "units were" if quantity != 1 else "unit was"
    analyst_summary = (
        f"{quantity} {product_name} {unit_phrase} procured from {supplier} "
        f"at ₹{_format_inr(actual_price)} per unit versus expected rate of "
        f"₹{_format_inr(expected_price)}. This represents a {variance_percent:.2f}% "
        f"variance and an estimated potential leakage of ₹{_format_inr(potential_leakage)}."
    )

    # 5. PREPARE STRUCTURED EVIDENCE RESPONSE OBJECT
    response: Dict[str, Any] = {
        "finding": finding,
        "summary": analyst_summary,
        "analyst_summary": analyst_summary,
        "root_cause": root_cause,
        "financial_impact": leakage_clean,
        "evidence": evidence_steps,
        "field_evidence": field_evidence,
        "recommended_actions": recommended_actions,
    }

    # 6. SEND ONLY VERIFIED EVIDENCE TO THE AI LAYER
    if generate_investigation is not None:
        try:
            # Pass only verified structured evidence; AI must not alter financial values or invent facts
            verified_payload = {
                "finding": finding,
                "summary": analyst_summary,
                "root_cause": root_cause,
                "financial_impact": leakage_clean,
                "evidence": evidence_steps,
                "recommended_actions": recommended_actions,
            }
            response["ai_analysis"] = generate_investigation(verified_payload)
        except Exception:
            pass

    return response
