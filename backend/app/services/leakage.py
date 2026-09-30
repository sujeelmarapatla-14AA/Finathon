from typing import Any, Dict, List, Optional
import pandas as pd


def _resolve_column(df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
    """Helper to resolve the column name from a list of possible candidate names."""
    for candidate in candidates:
        if candidate in df.columns:
            return candidate
    # Case-insensitive search fallback
    lower_cols = {col.lower().replace(" ", "_"): col for col in df.columns}
    for candidate in candidates:
        cand_key = candidate.lower().replace(" ", "_")
        if cand_key in lower_cols:
            return lower_cols[cand_key]
    return None


def detect_price_anomalies(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Detect price anomalies where actual unit price exceeds the benchmark price by >= 5%.

    - Compare unit_price against benchmark_unit_price.
    - Calculate variance percentage: ((actual - benchmark) / benchmark) * 100.
    - Calculate potential leakage: max(actual_price - benchmark_price, 0) * quantity.
    - Flag transactions where variance >= 5%.
    - Risk classification:
        >= 15% -> HIGH
        >= 10% -> MEDIUM
        >= 5%  -> LOW

    Returns:
        List of structured dictionaries containing:
        transaction_id, product_id, product, supplier, quantity,
        actual_price, benchmark_price, variance_percent,
        potential_leakage, risk, type.
    """
    if df is None or df.empty:
        return []

    # Resolve column names with sensible fallbacks
    tx_col = _resolve_column(df, ["transaction_id", "id", "tx_id", "po_number"])
    pid_col = _resolve_column(df, ["product_id", "sku", "item_code"])
    prod_col = _resolve_column(df, ["product", "product_name", "item_description", "description"])
    supp_col = _resolve_column(df, ["supplier", "supplier_name", "vendor_name", "vendor"])
    qty_col = _resolve_column(df, ["quantity", "qty", "units"])
    price_col = _resolve_column(df, ["unit_price", "actual_price", "price", "unit_cost"])
    bench_col = _resolve_column(df, ["benchmark_unit_price", "benchmark_price", "benchmark", "target_price"])

    # Ensure required numeric columns exist
    if not price_col or not bench_col:
        return []

    anomalies: List[Dict[str, Any]] = []

    # Work with numeric series
    data = df.copy()
    data["_actual"] = pd.to_numeric(data[price_col], errors="coerce").fillna(0.0)
    data["_bench"] = pd.to_numeric(data[bench_col], errors="coerce").fillna(0.0)
    data["_qty"] = pd.to_numeric(data[qty_col], errors="coerce").fillna(1.0) if qty_col else 1.0

    # Filter rows where benchmark > 0 and actual > benchmark
    valid_mask = (data["_bench"] > 0) & (data["_actual"] > data["_bench"])
    filtered_df = data[valid_mask].copy()

    if filtered_df.empty:
        return []

    # Calculate variance percent and potential leakage
    filtered_df["_variance"] = ((filtered_df["_actual"] - filtered_df["_bench"]) / filtered_df["_bench"]) * 100.0
    filtered_df["_leakage"] = (filtered_df["_actual"] - filtered_df["_bench"]).clip(lower=0.0) * filtered_df["_qty"]

    # Filter where variance >= 5.0%
    flagged = filtered_df[filtered_df["_variance"] >= 5.0].copy()

    for _, row in flagged.iterrows():
        var_pct = float(row["_variance"])
        leakage = float(row["_leakage"])
        actual_price = float(row["_actual"])
        benchmark_price = float(row["_bench"])
        qty = float(row["_qty"])

        # Determine risk tier:
        # >=15% = HIGH, >=10% = MEDIUM, >=5% = LOW
        if var_pct >= 15.0:
            risk = "HIGH"
        elif var_pct >= 10.0:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        tx_id = str(row[tx_col]) if tx_col and pd.notna(row[tx_col]) else ""
        product_id = str(row[pid_col]) if pid_col and pd.notna(row[pid_col]) else ""
        product = str(row[prod_col]) if prod_col and pd.notna(row[prod_col]) else ""
        supplier = str(row[supp_col]) if supp_col and pd.notna(row[supp_col]) else ""

        anomalies.append({
            "transaction_id": tx_id,
            "product_id": product_id,
            "product": product,
            "supplier": supplier,
            "quantity": int(qty) if qty.is_integer() else round(qty, 2),
            "actual_price": round(actual_price, 2),
            "benchmark_price": round(benchmark_price, 2),
            "variance_percent": round(var_pct, 2),
            "potential_leakage": round(leakage, 2),
            "risk": risk,
            "type": "Price Anomaly",
        })

    # Sort anomalies by potential leakage descending
    anomalies.sort(key=lambda x: x["potential_leakage"], reverse=True)
    return anomalies


def detect_duplicates(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Detect potentially duplicated procurement transactions matching on:
    product_id, supplier, quantity, and unit_price.

    Returns:
        List of structured dictionaries containing:
        transaction_id, product_id, product, supplier, quantity,
        unit_price, amount, risk, type.
    """
    if df is None or df.empty:
        return []

    tx_col = _resolve_column(df, ["transaction_id", "id", "tx_id", "po_number"])
    pid_col = _resolve_column(df, ["product_id", "sku", "item_code"])
    prod_col = _resolve_column(df, ["product", "product_name", "item_description", "description"])
    supp_col = _resolve_column(df, ["supplier", "supplier_name", "vendor_name", "vendor"])
    qty_col = _resolve_column(df, ["quantity", "qty", "units"])
    price_col = _resolve_column(df, ["unit_price", "actual_price", "price", "unit_cost"])

    # Duplication matching subset
    match_subset: List[str] = []
    for col in [pid_col, supp_col, qty_col, price_col]:
        if col:
            match_subset.append(col)

    if len(match_subset) < 2:
        return []

    data = df.copy()
    # Find all duplicates (keep=False marks all occurrences in a duplicate cluster)
    dup_mask = data.duplicated(subset=match_subset, keep=False)
    dup_df = data[dup_mask].copy()

    if dup_df.empty:
        return []

    duplicates: List[Dict[str, Any]] = []

    # Calculate duplicate group sizes
    group_counts = dup_df.groupby(match_subset, dropna=False).size().to_dict()

    for _, row in dup_df.iterrows():
        qty_val = pd.to_numeric(row[qty_col], errors="coerce") if qty_col else 1.0
        price_val = pd.to_numeric(row[price_col], errors="coerce") if price_col else 0.0

        qty = float(qty_val) if pd.notna(qty_val) else 1.0
        unit_price = float(price_val) if pd.notna(price_val) else 0.0
        amount = qty * unit_price

        # Tuple key for group size lookup
        group_key = tuple(row[col] for col in match_subset)
        dup_count = group_counts.get(group_key, 2)

        # Risk assessment:
        # High value (> ₹1,00,000) or high repetition (>= 3 occurrences) -> HIGH
        # Moderate value (> ₹20,000) -> MEDIUM
        # Otherwise -> LOW
        if amount >= 100000.0 or dup_count >= 3:
            risk = "HIGH"
        elif amount >= 20000.0:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        tx_id = str(row[tx_col]) if tx_col and pd.notna(row[tx_col]) else ""
        product_id = str(row[pid_col]) if pid_col and pd.notna(row[pid_col]) else ""
        product = str(row[prod_col]) if prod_col and pd.notna(row[prod_col]) else ""
        supplier = str(row[supp_col]) if supp_col and pd.notna(row[supp_col]) else ""

        duplicates.append({
            "transaction_id": tx_id,
            "product_id": product_id,
            "product": product,
            "supplier": supplier,
            "quantity": int(qty) if qty.is_integer() else round(qty, 2),
            "unit_price": round(unit_price, 2),
            "amount": round(amount, 2),
            "risk": risk,
            "type": "Duplicate Transaction",
        })

    # Sort duplicates by amount descending
    duplicates.sort(key=lambda x: x["amount"], reverse=True)
    return duplicates


def detect_supplier_fragmentation(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Detect supplier fragmentation where a single product is procured from
    3 or more distinct suppliers.

    - Group purchases by product_id.
    - Detect products purchased from 3 or more suppliers.

    Returns:
        List of structured dictionaries containing:
        product_id, product, supplier_count, risk, type.
    """
    if df is None or df.empty:
        return []

    pid_col = _resolve_column(df, ["product_id", "sku", "item_code"])
    prod_col = _resolve_column(df, ["product", "product_name", "item_description", "description"])
    supp_col = _resolve_column(df, ["supplier", "supplier_name", "vendor_name", "vendor"])

    if not pid_col or not supp_col:
        return []

    data = df.dropna(subset=[pid_col, supp_col]).copy()
    if data.empty:
        return []

    # Map product_id to product name for clean output
    name_map: Dict[str, str] = {}
    if prod_col:
        # Pick the most frequent or first non-null product name for each product_id
        for pid, group in data.groupby(pid_col):
            non_null_names = group[prod_col].dropna()
            name_map[str(pid)] = str(non_null_names.iloc[0]) if not non_null_names.empty else str(pid)

    # Group by product_id and count unique suppliers
    grouped = data.groupby(pid_col)[supp_col].unique()

    fragmented: List[Dict[str, Any]] = []

    for pid, unique_suppliers in grouped.items():
        supplier_count = len(unique_suppliers)
        if supplier_count >= 3:
            # Risk: 5+ suppliers = HIGH, 3-4 suppliers = MEDIUM
            if supplier_count >= 5:
                risk = "HIGH"
            else:
                risk = "MEDIUM"

            product_id_str = str(pid)
            product_name = name_map.get(product_id_str, product_id_str)

            fragmented.append({
                "product_id": product_id_str,
                "product": product_name,
                "supplier_count": int(supplier_count),
                "risk": risk,
                "type": "Supplier Fragmentation",
            })

    # Sort by supplier count descending
    fragmented.sort(key=lambda x: x["supplier_count"], reverse=True)
    return fragmented
