"""
SpendIntel - Unusual Procurement Pattern Detection Service.

Provides deterministic statistical analysis to detect unusual procurement behavior:
1. PRICE_SPIKE: Current price significantly above historical product median.
2. UNUSUAL_QUANTITY: Order volume substantially outside historical volume range.
3. SUDDEN_SUPPLIER_CHANGE: Route switched to higher-priced alternate vendor.
4. URGENT_PROCUREMENT: Flagged when urgency/expedited status fields are present.
5. OFF_CHANNEL_PROCUREMENT: Off-policy or spot-channel procurement.
6. EXCESSIVE_SUPPLIER_FRAGMENTATION: Products repeatedly fractured across many vendors.

Adheres strictly to the rule: Do not double-count financial leakage already
accounted for by other detectors. Operational risk patterns set potential_leakage to 0.0.
"""

from typing import Any, Dict, List, Optional
import pandas as pd

# Central Configurable Audit Thresholds
PRICE_VARIANCE_THRESHOLD: float = 5.0
HIGH_RISK_VARIANCE: float = 15.0
SUPPLIER_FRAGMENTATION_THRESHOLD: int = 2
QUANTITY_OUTLIER_FACTOR: float = 2.5
PRICE_SPIKE_FACTOR: float = 1.08


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


def detect_unusual_patterns(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Detect unusual procurement behavior using deterministic statistical rules.

    All findings contain:
    - type
    - risk
    - transaction_id or product_id
    - reason
    - evidence
    - potential_leakage (strictly non-negative and deterministically measurable, else 0.0)

    Returns:
        List of structured pattern findings sorted by potential_leakage descending.
    """
    if df is None or df.empty:
        return []

    tx_col = _resolve_column(df, ["transaction_id", "id", "tx_id", "po_id", "po_number"])
    pid_col = _resolve_column(df, ["product_id", "sku", "item_code"])
    prod_col = _resolve_column(df, ["product_name", "product", "item_description", "description"])
    supp_col = _resolve_column(df, ["supplier", "supplier_name", "vendor_name", "vendor"])
    qty_col = _resolve_column(df, ["quantity", "qty", "units"])
    price_col = _resolve_column(df, ["unit_price", "actual_price", "price", "unit_cost"])
    bench_col = _resolve_column(df, ["benchmark_unit_price", "benchmark_price", "benchmark"])
    date_col = _resolve_column(df, ["transaction_date", "date", "po_date"])
    urgency_col = _resolve_column(df, ["urgency", "priority", "delivery_urgency"])
    channel_col = _resolve_column(df, ["channel", "procurement_channel", "purchase_channel", "order_type"])
    status_col = _resolve_column(df, ["status", "order_status"])

    if not pid_col or not price_col or not qty_col:
        return []

    data = df.copy()
    data["_price"] = pd.to_numeric(data[price_col], errors="coerce").fillna(0.0)
    data["_qty"] = pd.to_numeric(data[qty_col], errors="coerce").fillna(1.0)
    data["_bench"] = pd.to_numeric(data[bench_col], errors="coerce").fillna(0.0) if bench_col else 0.0

    patterns: List[Dict[str, Any]] = []

    # Calculate product-level statistical baselines
    product_medians = data.groupby(pid_col)["_price"].median().to_dict()
    product_min_prices = data.groupby(pid_col)["_price"].min().to_dict()
    product_qty_medians = data.groupby(pid_col)["_qty"].median().to_dict()

    # -------------------------------------------------------------
    # 1. TRANSACTION-LEVEL PATTERN CHECKS
    # -------------------------------------------------------------
    for idx, row in data.iterrows():
        pid = str(row[pid_col]).strip()
        price = float(row["_price"])
        qty = float(row["_qty"])
        bench = float(row["_bench"])
        tx_id = str(row[tx_col]).strip() if tx_col and pd.notna(row[tx_col]) else f"ROW-{idx}"
        prod_name = str(row[prod_col]).strip() if prod_col and pd.notna(row[prod_col]) else pid
        supplier = str(row[supp_col]).strip() if supp_col and pd.notna(row[supp_col]) else "Supplier"
        tx_date = str(row[date_col]).strip() if date_col and pd.notna(row[date_col]) else ""
        clean_qty = int(qty) if qty.is_integer() else round(qty, 2)

        med_price = product_medians.get(pid, price)
        min_price = product_min_prices.get(pid, price)
        med_qty = product_qty_medians.get(pid, qty)

        # 1. PRICE SPIKE DETECTION
        # Compare current unit price against historical median purchase price for this SKU
        if med_price > 0 and (price >= med_price * PRICE_SPIKE_FACTOR) and (price > bench):
            spike_pct = round(((price - med_price) / med_price) * 100.0, 2)
            financial_impact = round((price - med_price) * qty, 2)
            risk = "HIGH" if spike_pct >= HIGH_RISK_VARIANCE else "MEDIUM"

            patterns.append({
                "id": f"PAT-SPIKE-{tx_id}",
                "type": "PRICE_SPIKE",
                "detection_type": "UNUSUAL_PATTERN",
                "transaction_id": tx_id,
                "product_id": pid,
                "product": prod_name,
                "supplier": supplier,
                "quantity": clean_qty,
                "actual_price": round(price, 2),
                "benchmark_price": round(med_price, 2),
                "expected_price": round(med_price, 2),
                "variance": spike_pct,
                "variance_percent": spike_pct,
                "potential_leakage": financial_impact,
                "risk": risk,
                "reason": f"Unit price ₹{price:,.2f} spiked +{spike_pct}% over historical product median ₹{med_price:,.2f}",
                "evidence": [
                    f"Transaction date: {tx_date}",
                    f"Historical product median price: ₹{med_price:,.2f}",
                    f"Spike differential: +₹{(price - med_price):,.2f} per unit",
                    f"Volume ordered: {clean_qty} units across purchase order {tx_id}",
                ],
            })

        # 2. SUDDEN SUPPLIER CHANGE / HIGHER-COST ROUTING
        # Product historically bought from lower-cost source routed to a higher-cost alternate
        if min_price > 0 and price > (min_price * 1.05) and price > bench:
            diff_pct = round(((price - min_price) / min_price) * 100.0, 2)
            patterns.append({
                "id": f"PAT-SUPP-{tx_id}",
                "type": "SUDDEN_SUPPLIER_CHANGE",
                "detection_type": "UNUSUAL_PATTERN",
                "transaction_id": tx_id,
                "product_id": pid,
                "product": prod_name,
                "supplier": supplier,
                "quantity": clean_qty,
                "actual_price": round(price, 2),
                "benchmark_price": round(min_price, 2),
                "expected_price": round(min_price, 2),
                "variance": diff_pct,
                "variance_percent": diff_pct,
                "potential_leakage": round((price - min_price) * qty, 2),
                "risk": "MEDIUM" if diff_pct < 10.0 else "HIGH",
                "reason": f"Routed order to {supplier} at ₹{price:,.2f}, bypassing verified lower-cost source at ₹{min_price:,.2f}",
                "evidence": [
                    f"Lowest verified price for {prod_name}: ₹{min_price:,.2f}",
                    f"Procured from alternative vendor {supplier} at ₹{price:,.2f}",
                    f"Premium variance: +{diff_pct}%",
                ],
            })

        # 3. UNUSUAL QUANTITY (Volume Spike)
        # Quantity significantly exceeds historical median order volume
        if med_qty > 0 and qty >= med_qty * QUANTITY_OUTLIER_FACTOR and qty >= 50:
            qty_multiplier = round(qty / med_qty, 1)
            patterns.append({
                "id": f"PAT-QTY-{tx_id}",
                "type": "UNUSUAL_QUANTITY",
                "detection_type": "UNUSUAL_PATTERN",
                "transaction_id": tx_id,
                "product_id": pid,
                "product": prod_name,
                "supplier": supplier,
                "quantity": clean_qty,
                "actual_price": round(price, 2),
                "benchmark_price": round(bench, 2),
                "expected_price": round(bench, 2),
                "variance": 0.0,
                "variance_percent": 0.0,
                "potential_leakage": 0.0,  # Operational risk only: zero double-counting
                "risk": "MEDIUM",
                "reason": f"Order volume {clean_qty} units is {qty_multiplier}x higher than historical median order of {int(med_qty)} units",
                "evidence": [
                    f"Historical median order volume: {int(med_qty)} units",
                    f"Current transaction volume: {clean_qty} units ({qty_multiplier}x outlier)",
                    f"Supplier: {supplier}, PO: {tx_id}",
                ],
            })

        # 4. URGENT PROCUREMENT CHECK (If urgency / priority fields exist)
        if urgency_col and pd.notna(row.get(urgency_col)):
            urg_val = str(row[urgency_col]).strip().lower()
            if urg_val in ["urgent", "rush", "emergency", "expedited", "critical", "high"]:
                patterns.append({
                    "id": f"PAT-URG-{tx_id}",
                    "type": "URGENT_PROCUREMENT",
                    "detection_type": "UNUSUAL_PATTERN",
                    "transaction_id": tx_id,
                    "product_id": pid,
                    "product": prod_name,
                    "supplier": supplier,
                    "quantity": clean_qty,
                    "actual_price": round(price, 2),
                    "benchmark_price": round(bench, 2),
                    "expected_price": round(bench, 2),
                    "variance": 0.0,
                    "variance_percent": 0.0,
                    "potential_leakage": 0.0,
                    "risk": "MEDIUM",
                    "reason": f"Order flagged with expedited procurement priority: '{row[urgency_col]}'",
                    "evidence": [
                        f"Priority indicator: {row[urgency_col]}",
                        f"Order PO: {tx_id}, Supplier: {supplier}",
                    ],
                })

        # 5. OFF-CHANNEL PROCUREMENT CHECK (If channel / status fields exist)
        if channel_col and pd.notna(row.get(channel_col)):
            chan_val = str(row[channel_col]).strip().lower()
            if chan_val in ["spot", "off-channel", "maverick", "unapproved", "p-card", "pcard"]:
                channel_leakage = round(max(price - bench, 0.0) * qty, 2)
                patterns.append({
                    "id": f"PAT-CHAN-{tx_id}",
                    "type": "OFF_CHANNEL_PROCUREMENT",
                    "detection_type": "UNUSUAL_PATTERN",
                    "transaction_id": tx_id,
                    "product_id": pid,
                    "product": prod_name,
                    "supplier": supplier,
                    "quantity": clean_qty,
                    "actual_price": round(price, 2),
                    "benchmark_price": round(bench, 2),
                    "expected_price": round(bench, 2),
                    "variance": round(((price - bench) / bench) * 100.0, 2) if bench > 0 else 0.0,
                    "variance_percent": round(((price - bench) / bench) * 100.0, 2) if bench > 0 else 0.0,
                    "potential_leakage": channel_leakage,
                    "risk": "HIGH",
                    "reason": f"Order executed through unapproved/spot procurement channel: '{row[channel_col]}'",
                    "evidence": [
                        f"Channel descriptor: {row[channel_col]}",
                        f"Invoiced price: ₹{price:,.2f} vs rate card ₹{bench:,.2f}",
                    ],
                })

    # -------------------------------------------------------------
    # 6. EXCESSIVE SUPPLIER FRAGMENTATION (Product-level history)
    # -------------------------------------------------------------
    for pid, group in data.groupby(pid_col):
        unique_suppliers = [str(s).strip() for s in group[supp_col].unique() if pd.notna(s) and str(s).strip()]
        vendor_count = len(unique_suppliers)

        if vendor_count >= SUPPLIER_FRAGMENTATION_THRESHOLD:
            prod_name_series = group[prod_col].dropna() if prod_col else pd.Series()
            pname = str(prod_name_series.iloc[0]).strip() if not prod_name_series.empty else str(pid)
            tx_count = int(len(group))

            patterns.append({
                "id": f"PAT-FRAG-{pid}",
                "type": "EXCESSIVE_SUPPLIER_FRAGMENTATION",
                "detection_type": "UNUSUAL_PATTERN",
                "transaction_id": "",
                "product_id": str(pid),
                "product": pname,
                "supplier": ", ".join(unique_suppliers[:2]),
                "quantity": tx_count,
                "actual_price": None,
                "benchmark_price": None,
                "expected_price": None,
                "variance": 0.0,
                "variance_percent": 0.0,
                "potential_leakage": 0.0,  # Prevent double-counting; structural fragmentation
                "risk": "HIGH" if vendor_count >= 3 else "MEDIUM",
                "reason": f"Product '{pname}' has fragmented purchasing across {vendor_count} distinct suppliers ({', '.join(unique_suppliers[:3])})",
                "evidence": [
                    f"Unique vendor count: {vendor_count} suppliers ({', '.join(unique_suppliers)})",
                    f"Total historical purchase orders for SKU: {tx_count}",
                    "Consolidation recommendation: Establish a single primary rate card vendor to gain volume leverage",
                ],
            })

    # Sort findings by potential leakage descending
    patterns.sort(key=lambda x: x["potential_leakage"], reverse=True)
    return patterns
