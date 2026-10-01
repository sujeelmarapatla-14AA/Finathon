"""
SpendIntel - Supplier and Product Normalization & Raw Schema Standardization Service.

Provides deterministic normalization for suppliers and products to resolve:
- Leading and trailing whitespace
- Repeated internal whitespace
- Case differences (ALL CAPS, lowercase, mixed case)
- Safe punctuation differences
- Obvious formatting differences

Provides raw procurement dataset standardization:
- Validates 4 required input fields: product, supplier, quantity, unit_price
- Supports flexible column aliases
- Deterministically generates product_id (PRD-0001...) when omitted
- Deterministically generates transaction_id (TX-UPLOAD-0001...) when omitted
- Treats benchmark_unit_price strictly as an analytical output (never required as input)
- Calculates comparable benchmark prices dynamically when not provided in raw input
- Preserves source_benchmark_unit_price when provided for backward compatibility
- Sets benchmark_status = "INSUFFICIENT_COMPARABLE_DATA" without rejecting transactions
"""

import re
from typing import Any, Dict, List, Optional, Tuple, Set
import numpy as np
import pandas as pd

# Safe legal and corporate entity suffix patterns to standardize
LEGAL_SUFFIX_REPLACEMENTS = [
    (re.compile(r"\b(pvt\.?\s*ltd\.?|private\s+limited)\b", re.IGNORECASE), "Pvt Ltd"),
    (re.compile(r"\b(ltd\.?|limited)\b", re.IGNORECASE), "Ltd"),
    (re.compile(r"\b(inc\.?|incorporated)\b", re.IGNORECASE), "Inc"),
    (re.compile(r"\b(corp\.?|corporation)\b", re.IGNORECASE), "Corp"),
    (re.compile(r"\b(llc|l\.l\.c\.)\b", re.IGNORECASE), "LLC"),
    (re.compile(r"\b(co\.?|company)\b", re.IGNORECASE), "Co"),
]

# Supported column aliases for raw dataset ingestion
COLUMN_ALIASES: Dict[str, List[str]] = {
    "product": [
        "product",
        "product_name",
        "product name",
        "item",
        "item_name",
        "item name",
        "product_description",
        "product description",
        "item_description",
        "item description",
        "material_description",
        "name",
    ],
    "supplier": [
        "supplier",
        "supplier_name",
        "supplier name",
        "vendor",
        "vendor_name",
        "vendor name",
        "vendor_id",
        "seller",
        "provider",
        "distributor",
    ],
    "quantity": [
        "quantity",
        "qty",
        "units",
        "order_quantity",
        "order_qty",
        "volume",
        "count",
        "ordered_qty",
        "invoiced_qty",
    ],
    "unit_price": [
        "unit_price",
        "unit price",
        "price",
        "purchase_price",
        "purchase price",
        "actual_price",
        "actual price",
        "actual_unit_price",
        "rate",
        "cost_per_unit",
        "cost per unit",
        "unit_cost",
        "invoiced_price",
        "invoiced_rate",
    ],
    "transaction_id": [
        "transaction_id",
        "transaction id",
        "txn_id",
        "txn id",
        "tx_id",
        "id",
        "po_number",
        "po id",
        "po_id",
        "invoice_no",
        "invoice_number",
        "order_id",
        "order_number",
    ],
    "product_id": [
        "product_id",
        "product id",
        "sku",
        "item_code",
        "item code",
        "item_id",
        "item id",
        "part_number",
        "part_no",
        "material_number",
        "material_code",
    ],
    "benchmark_unit_price": [
        "benchmark_unit_price",
        "benchmark unit price",
        "benchmark_price",
        "benchmark price",
        "benchmark",
        "target_price",
        "target price",
        "market_benchmark_price",
        "standard_price",
        "reference_price",
    ],
    "date": [
        "date",
        "transaction_date",
        "transaction date",
        "po_date",
        "txn_date",
        "order_date",
        "invoice_date",
    ],
    "description": [
        "description",
        "item_description",
        "product_description",
        "desc",
        "long_description",
        "specification",
        "specifications",
        "specs",
    ],
    "category": [
        "category",
        "commodity",
        "spend_category",
        "department_category",
        "product_category",
    ],
    "brand": [
        "brand",
        "manufacturer",
        "make",
    ],
    "model": [
        "model",
        "model_number",
        "model_no",
    ],
    "pack_size": [
        "pack_size",
        "pack size",
        "pack",
        "package_size",
        "packaging",
        "uom_pack",
    ],
    "unit": [
        "unit",
        "uom",
        "unit_of_measure",
        "unit_measure",
    ],
    "department": [
        "department",
        "dept",
        "cost_center",
        "business_unit",
    ],
    "purchase_order": [
        "purchase_order",
        "purchase order",
        "po",
        "po_number",
        "po_id",
        "order_id",
    ],
    "contract_price": [
        "contract_price",
        "contract price",
        "contract_rate",
        "contract rate",
        "contracted_price",
        "contract_unit_price",
    ],
    "discount": [
        "discount",
        "discount_rate",
        "discount rate",
        "contract_discount",
        "rebate",
    ],
    "channel": [
        "channel",
        "procurement_channel",
        "source_channel",
        "purchasing_channel",
    ],
    "status": [
        "status",
        "po_status",
        "procurement_status",
    ],
}


def normalize_supplier(supplier_name: Optional[str]) -> Tuple[str, str]:
    """
    Deterministically normalize a supplier entity name while preserving the original.

    Transformations:
    1. Strip leading and trailing whitespace.
    2. Normalize multiple internal whitespaces, tabs, or newlines to a single space.
    3. Normalize punctuation variations (quotes, trailing periods, dashes).
    4. Canonicalize word casing so variations resolve to identical canonical form.
    5. Standardize common legal suffix representations safely without merging distinct entities.

    Returns:
        Tuple of (original_supplier, normalized_supplier)
    """
    if supplier_name is None or pd.isna(supplier_name):
        return ("", "Unknown Supplier")

    original = str(supplier_name)
    stripped = original.strip()
    if not stripped:
        return ("", "Unknown Supplier")

    # Step 1: Normalize internal whitespace to single spaces
    cleaned = re.sub(r"\s+", " ", stripped)

    # Step 2: Strip leading/trailing punctuation noise
    cleaned = cleaned.strip(" -_.,'\"")

    # Step 3: Canonicalize word casing
    tokens = [t for t in cleaned.split(" ") if t]
    capitalized_tokens = []
    for token in tokens:
        if len(token) <= 4 and token.isupper() and token.isalpha():
            capitalized_tokens.append(token)
        else:
            capitalized_tokens.append(token.capitalize())

    canonical = " ".join(capitalized_tokens)

    # Step 4: Standardize safe punctuation in legal suffixes
    for pattern, replacement in LEGAL_SUFFIX_REPLACEMENTS:
        canonical = pattern.sub(replacement, canonical)

    canonical = re.sub(r"\s+", " ", canonical).strip(" -_.,'\"")
    if not canonical:
        canonical = stripped

    return (original, canonical)


def normalize_product(
    product_name: Optional[str],
    product_id: Optional[str] = None,
    category: Optional[str] = None,
) -> Dict[str, str]:
    """
    Deterministically normalize product information while preserving original values.

    Rules:
    1. Use product_id as the primary identity when available.
    2. Strip leading/trailing and repeated whitespace.
    3. Normalize case and standard formatting differences.
    4. Never merge distinct products that possess different product_id values.

    Returns:
        Dict containing:
        - original_product_name
        - normalized_product_name
        - product_id
        - category
    """
    raw_name = str(product_name) if product_name and pd.notna(product_name) else "Unknown Item"
    original_name = raw_name.strip()
    clean_id = str(product_id).strip().upper() if product_id and pd.notna(product_id) else ""

    # Normalize name: internal multiple spaces, strip quotes
    cleaned = re.sub(r"\s+", " ", original_name).strip(" -_.,'\"")
    tokens = [t for t in cleaned.split(" ") if t]
    capitalized_tokens = []
    for token in tokens:
        if len(token) <= 4 and (token.isupper() or any(c.isdigit() for c in token)):
            capitalized_tokens.append(token.upper())
        else:
            capitalized_tokens.append(token.capitalize())

    clean_name = " ".join(capitalized_tokens)
    clean_category = str(category).strip().title() if category and pd.notna(category) else "General Procurement"

    return {
        "original_product_name": original_name,
        "normalized_product_name": clean_name,
        "product_id": clean_id,
        "category": clean_category,
    }


def _match_column(df: pd.DataFrame, candidates: List[str], used_cols: Set[str]) -> Optional[str]:
    """
    Find matching column in df given candidate alias names.
    Checks exact matches, normalized matches (lowercase, underscores), and stripped matches.
    """
    existing_cols = [c for c in df.columns if c not in used_cols]
    
    # Pass 1: exact string match
    for cand in candidates:
        if cand in existing_cols:
            return cand

    # Pass 2: case-insensitive & whitespace normalized match
    col_lookup: Dict[str, str] = {}
    for c in existing_cols:
        norm_key = str(c).strip().lower().replace(" ", "_").replace("-", "_")
        if norm_key not in col_lookup:
            col_lookup[norm_key] = c

    for cand in candidates:
        cand_key = str(cand).strip().lower().replace(" ", "_").replace("-", "_")
        if cand_key in col_lookup:
            return col_lookup[cand_key]

    return None


def standardize_raw_procurement_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Standardize and validate a raw procurement DataFrame according to the SpendIntel schema.

    Requirements:
    - Required INPUT columns (4 only): product, supplier, quantity, unit_price
    - Column alias resolution for all standard and optional procurement fields
    - Deterministic PRD-xxxx generation when product_id is omitted
    - Deterministic TX-UPLOAD-xxxx generation when transaction_id is omitted
    - benchmark_unit_price is NOT required as input. It is calculated dynamically from
      comparable product groups or median unit rates when omitted.
    - If benchmark cannot be calculated: benchmark_unit_price = None, benchmark_status = "INSUFFICIENT_COMPARABLE_DATA".
    - Backward compatibility: If benchmark_unit_price was supplied in input, preserve as source_benchmark_unit_price.

    Raises:
        ValueError with formatted missing required fields list if any of (product, supplier, quantity, unit_price) is missing.
    """
    if df is None or df.empty:
        raise ValueError("Unable to analyze this file.\n\nFile is empty or contains no records.")

    raw_df = df.copy()
    used_columns: Set[str] = set()

    # 1. Resolve Required Columns
    matched_product = _match_column(raw_df, COLUMN_ALIASES["product"], used_columns)
    if matched_product:
        used_columns.add(matched_product)

    matched_supplier = _match_column(raw_df, COLUMN_ALIASES["supplier"], used_columns)
    if matched_supplier:
        used_columns.add(matched_supplier)

    matched_quantity = _match_column(raw_df, COLUMN_ALIASES["quantity"], used_columns)
    if matched_quantity:
        used_columns.add(matched_quantity)

    matched_unit_price = _match_column(raw_df, COLUMN_ALIASES["unit_price"], used_columns)
    if matched_unit_price:
        used_columns.add(matched_unit_price)

    # Validate the 4 genuinely required fields
    missing_fields_display: List[str] = []
    if not matched_product:
        missing_fields_display.append("• Product")
    if not matched_supplier:
        missing_fields_display.append("• Supplier")
    if not matched_quantity:
        missing_fields_display.append("• Quantity")
    if not matched_unit_price:
        missing_fields_display.append("• Unit Price")

    if missing_fields_display:
        msg = "Unable to analyze this file.\n\nMissing required procurement fields:\n" + "\n".join(missing_fields_display)
        raise ValueError(msg)

    # 2. Resolve Optional Columns
    matched_tx_id = _match_column(raw_df, COLUMN_ALIASES["transaction_id"], used_columns)
    if matched_tx_id:
        used_columns.add(matched_tx_id)

    matched_prod_id = _match_column(raw_df, COLUMN_ALIASES["product_id"], used_columns)
    if matched_prod_id:
        used_columns.add(matched_prod_id)

    matched_benchmark = _match_column(raw_df, COLUMN_ALIASES["benchmark_unit_price"], used_columns)
    if matched_benchmark:
        used_columns.add(matched_benchmark)

    matched_date = _match_column(raw_df, COLUMN_ALIASES["date"], used_columns)
    if matched_date:
        used_columns.add(matched_date)

    matched_desc = _match_column(raw_df, COLUMN_ALIASES["description"], used_columns)
    if matched_desc:
        used_columns.add(matched_desc)

    matched_category = _match_column(raw_df, COLUMN_ALIASES["category"], used_columns)
    if matched_category:
        used_columns.add(matched_category)

    matched_brand = _match_column(raw_df, COLUMN_ALIASES["brand"], used_columns)
    if matched_brand:
        used_columns.add(matched_brand)

    matched_model = _match_column(raw_df, COLUMN_ALIASES["model"], used_columns)
    if matched_model:
        used_columns.add(matched_model)

    matched_pack = _match_column(raw_df, COLUMN_ALIASES["pack_size"], used_columns)
    if matched_pack:
        used_columns.add(matched_pack)

    matched_unit = _match_column(raw_df, COLUMN_ALIASES["unit"], used_columns)
    if matched_unit:
        used_columns.add(matched_unit)

    matched_dept = _match_column(raw_df, COLUMN_ALIASES["department"], used_columns)
    if matched_dept:
        used_columns.add(matched_dept)

    matched_po = _match_column(raw_df, COLUMN_ALIASES["purchase_order"], used_columns)
    if matched_po:
        used_columns.add(matched_po)

    matched_contract_price = _match_column(raw_df, COLUMN_ALIASES["contract_price"], used_columns)
    if matched_contract_price:
        used_columns.add(matched_contract_price)

    matched_discount = _match_column(raw_df, COLUMN_ALIASES["discount"], used_columns)
    if matched_discount:
        used_columns.add(matched_discount)

    matched_channel = _match_column(raw_df, COLUMN_ALIASES["channel"], used_columns)
    if matched_channel:
        used_columns.add(matched_channel)

    matched_status = _match_column(raw_df, COLUMN_ALIASES["status"], used_columns)
    if matched_status:
        used_columns.add(matched_status)

    # 3. Construct Canonical Standardized DataFrame
    std_df = pd.DataFrame(index=raw_df.index)

    # Supplier normalization
    raw_suppliers = ["" if pd.isna(s) or s is None else str(s).strip() for s in raw_df[matched_supplier]]
    std_df["original_supplier"] = raw_suppliers
    norm_suppliers = [normalize_supplier(s)[1] for s in raw_suppliers]
    std_df["normalized_supplier"] = norm_suppliers
    std_df["supplier"] = raw_suppliers  # canonical supplier

    # Product normalization
    raw_products = ["" if pd.isna(p) or p is None else str(p).strip() for p in raw_df[matched_product]]
    std_df["original_product_name"] = raw_products
    norm_products = [normalize_product(p)["normalized_product_name"] for p in raw_products]
    std_df["normalized_product_name"] = norm_products
    std_df["product_name"] = raw_products  # canonical product_name
    std_df["product"] = raw_products       # canonical product alias

    # Quantity & Unit Price (numeric conversion)
    std_df["quantity"] = pd.to_numeric(raw_df[matched_quantity], errors="coerce").fillna(1.0)
    std_df["unit_price"] = pd.to_numeric(raw_df[matched_unit_price], errors="coerce").fillna(0.0)

    # 4. Generate Deterministic Product IDs if omitted
    unique_norm_names: List[str] = []
    for np_name in norm_products:
        if np_name not in unique_norm_names:
            unique_norm_names.append(np_name)
    prod_id_map = {name: f"PRD-{idx+1:04d}" for idx, name in enumerate(unique_norm_names)}

    if matched_prod_id:
        final_pids = []
        for i, val in enumerate(raw_df[matched_prod_id]):
            clean_val = "" if pd.isna(val) or val is None else str(val).strip()
            if not clean_val or clean_val.lower() in ["nan", "none", "null", ""]:
                final_pids.append(prod_id_map.get(norm_products[i], f"PRD-{i+1:04d}"))
            else:
                final_pids.append(clean_val.upper())
        std_df["product_id"] = final_pids
        std_df["normalized_product_id"] = final_pids
    else:
        # Deterministic generation: PRD-0001, PRD-0002... per unique normalized product
        generated_pids = [prod_id_map.get(np_name, f"PRD-{i+1:04d}") for i, np_name in enumerate(norm_products)]
        std_df["product_id"] = generated_pids
        std_df["normalized_product_id"] = generated_pids

    # 5. Generate Deterministic Transaction IDs if omitted
    if matched_tx_id:
        final_txs = []
        for i, val in enumerate(raw_df[matched_tx_id]):
            clean_val = "" if pd.isna(val) or val is None else str(val).strip()
            if not clean_val or clean_val.lower() in ["nan", "none", "null", ""]:
                final_txs.append(f"TX-UPLOAD-{i+1:04d}")
            else:
                final_txs.append(clean_val)
        std_df["transaction_id"] = final_txs
    else:
        std_df["transaction_id"] = [f"TX-UPLOAD-{i+1:04d}" for i in range(len(std_df))]

    # 6. Benchmark Unit Price Formulation & Calculation
    has_source_benchmark = False
    source_benchmarks: List[Optional[float]] = [None] * len(std_df)

    if matched_benchmark:
        raw_bench_series = pd.to_numeric(raw_df[matched_benchmark], errors="coerce")
        if raw_bench_series.notna().any() and (raw_bench_series > 0).any():
            has_source_benchmark = True
            for i, val in enumerate(raw_bench_series):
                if pd.notna(val) and val > 0:
                    source_benchmarks[i] = round(float(val), 2)

    std_df["source_benchmark_unit_price"] = source_benchmarks

    # Compute benchmarks dynamically where not provided
    calculated_benchmarks: List[Optional[float]] = []
    benchmark_statuses: List[str] = []

    # Build price lookup per normalized product group
    price_by_product: Dict[str, List[float]] = {}
    for i, np_name in enumerate(norm_products):
        uprice = std_df["unit_price"].iloc[i]
        if uprice > 0:
            price_by_product.setdefault(np_name, []).append(uprice)

    for i in range(len(std_df)):
        src_bench = source_benchmarks[i]
        if src_bench is not None and src_bench > 0:
            calculated_benchmarks.append(src_bench)
            benchmark_statuses.append("SOURCE_PROVIDED")
        else:
            np_name = norm_products[i]
            product_prices = price_by_product.get(np_name, [])
            if len(product_prices) >= 2:
                # Benchmark = median positive price for this comparable group
                bench = round(float(np.median(product_prices)), 2)
                calculated_benchmarks.append(bench)
                benchmark_statuses.append("CALCULATED_FROM_COMPARABLE")
            else:
                # Insufficient comparable data: benchmark is None / null, do NOT reject
                calculated_benchmarks.append(None)
                benchmark_statuses.append("INSUFFICIENT_COMPARABLE_DATA")

    std_df["benchmark_unit_price"] = calculated_benchmarks
    std_df["benchmark_status"] = benchmark_statuses

    # 7. Copy Optional Ingested Columns
    if matched_date:
        std_df["date"] = raw_df[matched_date].astype(str).str.strip()
        std_df["transaction_date"] = std_df["date"]
    
    if matched_desc:
        std_df["description"] = raw_df[matched_desc].astype(str).str.strip()
    
    if matched_category:
        std_df["category"] = raw_df[matched_category].astype(str).str.strip()
    else:
        std_df["category"] = "General Procurement"

    if matched_brand:
        std_df["brand"] = raw_df[matched_brand].astype(str).str.strip()

    if matched_model:
        std_df["model"] = raw_df[matched_model].astype(str).str.strip()

    if matched_pack:
        std_df["pack_size"] = raw_df[matched_pack].astype(str).str.strip()

    if matched_unit:
        std_df["unit"] = raw_df[matched_unit].astype(str).str.strip()

    if matched_dept:
        std_df["department"] = raw_df[matched_dept].astype(str).str.strip()

    if matched_po:
        std_df["purchase_order"] = raw_df[matched_po].astype(str).str.strip()
        std_df["po_number"] = std_df["purchase_order"]

    if matched_contract_price:
        std_df["contract_price"] = pd.to_numeric(raw_df[matched_contract_price], errors="coerce")

    if matched_discount:
        std_df["discount"] = pd.to_numeric(raw_df[matched_discount], errors="coerce")
        std_df["contract_discount"] = std_df["discount"]

    if matched_channel:
        std_df["channel"] = raw_df[matched_channel].astype(str).str.strip()
        std_df["procurement_channel"] = std_df["channel"]

    if matched_status:
        std_df["status"] = raw_df[matched_status].astype(str).str.strip()

    # Preserve any unmapped remaining columns
    for col in raw_df.columns:
        if col not in std_df.columns:
            std_df[col] = raw_df[col]

    return std_df


def normalize_procurement_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Standardize and add normalized supplier and product columns to the procurement DataFrame.
    Guarantees that standard columns exist while preserving original columns.
    """
    if df is None or df.empty:
        return df
    
    # If not yet standardized, standardize schema first
    if "normalized_supplier" not in df.columns or "normalized_product_name" not in df.columns:
        try:
            return standardize_raw_procurement_dataframe(df)
        except Exception:
            pass

    out = df.copy()

    # Determine supplier column
    supp_col = None
    for cand in ["supplier", "supplier_name", "vendor_name", "vendor"]:
        if cand in out.columns:
            supp_col = cand
            break

    # Determine product columns
    prod_name_col = None
    for cand in ["product_name", "product", "item_description", "description"]:
        if cand in out.columns:
            prod_name_col = cand
            break

    prod_id_col = None
    for cand in ["product_id", "sku", "item_code", "id"]:
        if cand in out.columns and cand != "transaction_id":
            prod_id_col = cand
            break

    # Apply supplier normalization
    if supp_col:
        out["original_supplier"] = out[supp_col].astype(str).str.strip()
        out["normalized_supplier"] = out[supp_col].apply(lambda s: normalize_supplier(s)[1])
    else:
        out["original_supplier"] = "Unknown"
        out["normalized_supplier"] = "Unknown"

    # Apply product normalization
    if prod_name_col:
        out["original_product_name"] = out[prod_name_col].astype(str).str.strip()
        out["normalized_product_name"] = out[prod_name_col].apply(
            lambda p: normalize_product(p)["normalized_product_name"]
        )
    else:
        out["original_product_name"] = "Unknown Product"
        out["normalized_product_name"] = "Unknown Product"

    if prod_id_col:
        out["normalized_product_id"] = out[prod_id_col].astype(str).str.strip().str.upper()
    else:
        out["normalized_product_id"] = out["normalized_product_name"]

    return out
