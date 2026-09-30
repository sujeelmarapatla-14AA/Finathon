"""
SpendIntel - Procurement Spend Leakage Detection Service.

Provides deterministic engines to detect:
1. Price Anomalies (actual unit price exceeding established benchmark).
2. Duplicate Procurement Transactions (matching on SKU, supplier, quantity, and price).
3. Supplier Fragmentation (multi-vendor procurement for identical product lines).
4. Canonical Leakage Computation (strictly avoids double-counting financial leakage).
"""

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
        id, transaction_id, product_id, product, supplier, quantity,
        actual_price, benchmark_price, expected_price, variance_percent,
        variance, potential_leakage, risk, type, detection_type, reason, evidence.
    """
    if df is None or df.empty:
        return []

    # Resolve column names with sensible fallbacks
    tx_col = _resolve_column(df, ["transaction_id", "id", "tx_id", "po_number", "po_id"])
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

    # Calculate variance percent and potential leakage (strictly non-negative)
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
        if var_pct >= 15.0 or leakage >= 50000.0:
            risk = "HIGH"
        elif var_pct >= 10.0 or leakage >= 20000.0:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        tx_id = str(row[tx_col]).strip() if tx_col and pd.notna(row[tx_col]) else ""
        product_id = str(row[pid_col]).strip() if pid_col and pd.notna(row[pid_col]) else ""
        product = str(row[prod_col]).strip() if prod_col and pd.notna(row[prod_col]) else "Product"
        supplier = str(row[supp_col]).strip() if supp_col and pd.notna(row[supp_col]) else "Supplier"
        clean_qty = int(qty) if qty.is_integer() else round(qty, 2)

        evidence = [
            f"Invoiced unit price: ₹{actual_price:,.2f}",
            f"Established benchmark rate: ₹{benchmark_price:,.2f}",
            f"Price variance: +{var_pct:.2f}%",
            f"Calculated potential leakage across {clean_qty} units: ₹{leakage:,.2f}",
        ]

        anomalies.append({
            "id": f"ANO-{tx_id}" if tx_id else f"ANO-{len(anomalies)+1}",
            "transaction_id": tx_id,
            "product_id": product_id,
            "product": product,
            "supplier": supplier,
            "quantity": clean_qty,
            "actual_price": round(actual_price, 2),
            "benchmark_price": round(benchmark_price, 2),
            "expected_price": round(benchmark_price, 2),
            "variance_percent": round(var_pct, 2),
            "variance": round(var_pct, 2),
            "potential_leakage": round(leakage, 2),
            "risk": risk,
            "type": "PRICE_ANOMALY",
            "detection_type": "PRICE_ANOMALY",
            "reason": f"Unit price ₹{actual_price:,.2f} exceeds target benchmark ₹{benchmark_price:,.2f} by +{var_pct:.2f}%",
            "evidence": evidence,
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
        id, transaction_id, product_id, product, supplier, quantity,
        unit_price, actual_price, amount, potential_leakage, risk,
        type, detection_type, reason, evidence.
    """
    if df is None or df.empty:
        return []

    tx_col = _resolve_column(df, ["transaction_id", "id", "tx_id", "po_number", "po_id"])
    pid_col = _resolve_column(df, ["product_id", "sku", "item_code"])
    prod_col = _resolve_column(df, ["product", "product_name", "item_description", "description"])
    supp_col = _resolve_column(df, ["supplier", "supplier_name", "vendor_name", "vendor"])
    qty_col = _resolve_column(df, ["quantity", "qty", "units"])
    price_col = _resolve_column(df, ["unit_price", "actual_price", "price", "unit_cost"])
    bench_col = _resolve_column(df, ["benchmark_unit_price", "benchmark_price", "benchmark"])

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
        bench_val = pd.to_numeric(row[bench_col], errors="coerce") if bench_col and pd.notna(row[bench_col]) else price_val

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

        tx_id = str(row[tx_col]).strip() if tx_col and pd.notna(row[tx_col]) else ""
        product_id = str(row[pid_col]).strip() if pid_col and pd.notna(row[pid_col]) else ""
        product = str(row[prod_col]).strip() if prod_col and pd.notna(row[prod_col]) else "Product"
        supplier = str(row[supp_col]).strip() if supp_col and pd.notna(row[supp_col]) else "Supplier"
        clean_qty = int(qty) if qty.is_integer() else round(qty, 2)

        evidence = [
            f"Duplicate order cluster contains {dup_count} identical purchase instances",
            f"Matching parameters: Product ID '{product_id}', Supplier '{supplier}', Qty {clean_qty}, Price ₹{unit_price:,.2f}",
            f"Potential redundant expenditure: ₹{amount:,.2f}",
        ]

        duplicates.append({
            "id": f"DUP-{tx_id}" if tx_id else f"DUP-{len(duplicates)+1}",
            "transaction_id": tx_id,
            "product_id": product_id,
            "product": product,
            "supplier": supplier,
            "quantity": clean_qty,
            "unit_price": round(unit_price, 2),
            "actual_price": round(unit_price, 2),
            "benchmark_price": round(float(bench_val), 2),
            "expected_price": round(float(bench_val), 2),
            "variance_percent": 0.0,
            "variance": 0.0,
            "amount": round(amount, 2),
            "potential_leakage": round(amount, 2),
            "risk": risk,
            "type": "POSSIBLE_DUPLICATE",
            "detection_type": "POSSIBLE_DUPLICATE",
            "reason": "Identified duplicate procurement transaction matching on SKU, vendor, volume, and unit price",
            "evidence": evidence,
        })

    # Sort duplicates by amount descending
    duplicates.sort(key=lambda x: x["amount"], reverse=True)
    return duplicates


def detect_supplier_fragmentation(df: pd.DataFrame, min_suppliers: int = 2) -> List[Dict[str, Any]]:
    """
    Detect supplier fragmentation where a single product is procured from
    multiple distinct suppliers (>= min_suppliers, default 2).

    - Group purchases by product_id.
    - Detect products purchased from multiple suppliers.
    - Calculate supplier counts, concentration, and purchase history.
    - Do not invent financial savings where evidence does not exist (potential_leakage: 0.0).

    Returns:
        List of structured dictionaries containing:
        product_id, product, supplier_count, suppliers, supplier_concentration,
        transaction_count, total_spend, risk, type, detection_type, reason, evidence.
    """
    if df is None or df.empty:
        return []

    pid_col = _resolve_column(df, ["product_id", "sku", "item_code"])
    prod_col = _resolve_column(df, ["product", "product_name", "item_description", "description"])
    supp_col = _resolve_column(df, ["supplier", "supplier_name", "vendor_name", "vendor"])
    price_col = _resolve_column(df, ["unit_price", "actual_price", "price", "unit_cost"])
    qty_col = _resolve_column(df, ["quantity", "qty", "units"])

    if not pid_col or not supp_col:
        return []

    data = df.dropna(subset=[pid_col, supp_col]).copy()
    if data.empty:
        return []

    # Map product_id to product name for clean output
    name_map: Dict[str, str] = {}
    if prod_col:
        for pid, group in data.groupby(pid_col):
            non_null_names = group[prod_col].dropna()
            name_map[str(pid)] = str(non_null_names.iloc[0]) if not non_null_names.empty else str(pid)

    # Compute spend per row if available
    if price_col and qty_col:
        data["_spend"] = (
            pd.to_numeric(data[price_col], errors="coerce").fillna(0.0)
            * pd.to_numeric(data[qty_col], errors="coerce").fillna(1.0)
        )
    else:
        data["_spend"] = 0.0

    fragmented: List[Dict[str, Any]] = []

    for pid, group in data.groupby(pid_col):
        unique_suppliers = [str(s).strip() for s in group[supp_col].unique() if pd.notna(s) and str(s).strip()]
        supplier_count = len(unique_suppliers)

        if supplier_count >= min_suppliers:
            total_prod_spend = float(group["_spend"].sum())
            tx_count = int(len(group))

            # Calculate supplier concentration (% spend on primary supplier)
            if total_prod_spend > 0:
                top_supp_spend = float(group.groupby(supp_col)["_spend"].sum().max())
                concentration_pct = round((top_supp_spend / total_prod_spend) * 100.0, 1)
            else:
                top_supp_count = int(group.groupby(supp_col).size().max())
                concentration_pct = round((top_supp_count / tx_count) * 100.0, 1) if tx_count > 0 else 0.0

            # Risk tier
            if supplier_count >= 4 or (supplier_count >= 3 and total_prod_spend >= 500000.0):
                risk = "HIGH"
            elif supplier_count >= 3:
                risk = "MEDIUM"
            else:
                risk = "LOW"

            product_id_str = str(pid).strip()
            product_name = name_map.get(product_id_str, product_id_str)

            evidence = [
                f"Item procured across {supplier_count} distinct vendors: {', '.join(unique_suppliers[:4])}",
                f"Primary supplier concentration: {concentration_pct}% of product volume",
                f"Total procurement spend across {tx_count} purchase orders: ₹{total_prod_spend:,.2f}",
                "Consolidation opportunity: Aggregating demand with a single primary vendor yields volume rebate leverage",
            ]

            fragmented.append({
                "id": f"FRAG-{product_id_str}",
                "product_id": product_id_str,
                "product": product_name,
                "supplier_count": int(supplier_count),
                "suppliers": unique_suppliers,
                "supplier_concentration": concentration_pct,
                "transaction_count": tx_count,
                "total_spend": round(total_prod_spend, 2),
                "potential_leakage": 0.0,  # Do not invent unverified financial savings
                "risk": risk,
                "type": "SUPPLIER_FRAGMENTATION",
                "detection_type": "SUPPLIER_FRAGMENTATION",
                "reason": f"Product '{product_name}' purchase volume split across {supplier_count} different suppliers ({', '.join(unique_suppliers[:3])})",
                "evidence": evidence,
            })

    # Sort by supplier count descending, then total spend descending
    fragmented.sort(key=lambda x: (x["supplier_count"], x.get("total_spend", 0.0)), reverse=True)
    return fragmented


def compute_canonical_leakage(
    price_anomalies: List[Dict[str, Any]],
    duplicates: List[Dict[str, Any]],
    missed_discounts: Optional[List[Dict[str, Any]]] = None,
    contract_findings: Optional[List[Dict[str, Any]]] = None,
    pattern_findings: Optional[List[Dict[str, Any]]] = None,
) -> float:
    """
    Compute total potential spend leakage with strictly deterministic deduplication.

    CRITICAL RULE (AVOID DOUBLE COUNTING):
    A single transaction may trigger multiple rules (e.g., Price Anomaly,
    Missed Discount, and Price Spike). The financial leakage for that transaction
    must NOT be the sum of all overlapping rule figures.

    Deduplication Logic:
    1. Group all detected leakage amounts by transaction_id.
    2. For any individual transaction, canonical leakage = max(leakages from all rules).
    3. For duplicate purchases, redundant duplicate transaction expenditure is accounted for.
    4. Total leakage = sum of canonical leakages across unique transactions.

    Returns:
        Deduplicated total financial leakage (float).
    """
    tx_leakage_map: Dict[str, float] = {}

    def _record(tx_id: Optional[str], leakage: float) -> None:
        if not tx_id or not str(tx_id).strip():
            return
        tid = str(tx_id).strip()
        val = max(float(leakage), 0.0)
        # Keep the maximum leakage signal on this specific transaction
        if val > tx_leakage_map.get(tid, 0.0):
            tx_leakage_map[tid] = val

    # 1. Price anomalies
    for item in price_anomalies or []:
        _record(item.get("transaction_id"), float(item.get("potential_leakage", 0.0)))

    # 2. Missed discounts
    for item in missed_discounts or []:
        _record(item.get("transaction_id"), float(item.get("potential_leakage", 0.0)))

    # 3. Contract compliance
    for item in contract_findings or []:
        _record(item.get("transaction_id"), float(item.get("potential_leakage", 0.0)))

    # 4. Pattern findings (only where transaction_id exists and leakage is deterministic)
    for item in pattern_findings or []:
        # Patterns like PRICE_SPIKE or SUDDEN_SUPPLIER_CHANGE can flag an existing transaction
        _record(item.get("transaction_id"), float(item.get("potential_leakage", 0.0)))

    # 5. Duplicates (Operational waste: duplicate purchase amounts)
    for item in duplicates or []:
        _record(item.get("transaction_id"), float(item.get("amount", item.get("potential_leakage", 0.0))))

    total_canonical = sum(tx_leakage_map.values())
    return round(total_canonical, 2)
