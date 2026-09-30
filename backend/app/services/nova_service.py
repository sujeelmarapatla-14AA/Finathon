"""
SpendIntel - Nova Procurement Integration Service.

Connects the SpendIntel analytics engine with live Nova Procurement Cloud data.
Fetches purchase orders, bills, vendors, contracts, inventory, and goods receipts,
normalizes them into the canonical SpendIntel procurement model, and feeds them
through the deterministic SpendIntel leakage analyzer.

Features:
- Live data normalization from Nova REST API.
- Reuses the core SpendIntel deterministic analysis engine without code duplication.
- Provides unified data for Dashboard, Findings Explorer, Supplier Intelligence,
  and AI Investigation.
- In-memory session caching for performance.
"""

from typing import Any, Dict, List, Optional
import pandas as pd

try:
    from app.services import nova_client
    from app.services.analyzer import analyze_procurement_dataframe
    from app.services.normalization import normalize_procurement_dataframe
    from app.services.leakage import detect_price_anomalies
    from app.services.contracts import detect_contract_findings
    from app.routes.findings import _standardize_finding
except ImportError:
    from backend.app.services import nova_client
    from backend.app.services.analyzer import analyze_procurement_dataframe
    from backend.app.services.normalization import normalize_procurement_dataframe
    from backend.app.services.leakage import detect_price_anomalies
    from backend.app.services.contracts import detect_contract_findings
    from backend.app.routes.findings import _standardize_finding

# Cached normalized dataframe
_NOVA_DF_CACHE: Optional[pd.DataFrame] = None
_NOVA_ANALYSIS_CACHE: Optional[Dict[str, Any]] = None


def fetch_and_normalize_nova_procurement(force_refresh: bool = False) -> pd.DataFrame:
    """
    Fetch all live procurement entities from Nova API and normalize into canonical SpendIntel DataFrame.
    """
    global _NOVA_DF_CACHE
    if not force_refresh and _NOVA_DF_CACHE is not None:
        return _NOVA_DF_CACHE.copy()

    # Fetch entities from Nova API
    pos = nova_client.get_purchase_orders(use_cache=not force_refresh)
    vendors = nova_client.get_vendors(use_cache=not force_refresh)
    contracts = nova_client.get_vendor_contracts(use_cache=not force_refresh)
    inventory = nova_client.get_inventory(use_cache=not force_refresh)

    # Build lookup dictionaries
    vendor_map: Dict[str, Dict[str, Any]] = {
        str(v.get("id", "")).strip(): v for v in vendors if "id" in v
    }
    item_map: Dict[str, Dict[str, Any]] = {
        str(i.get("id", "")).strip(): i for i in inventory if "id" in i
    }
    contract_map: Dict[tuple, Dict[str, Any]] = {
        (str(c.get("vendor_id", "")).strip(), str(c.get("item_id", "")).strip()): c
        for c in contracts
        if "vendor_id" in c and "item_id" in c
    }

    records: List[Dict[str, Any]] = []

    for po in pos:
        po_id = str(po.get("id", "")).strip()
        po_number = str(po.get("po_number", po_id)).strip()
        vendor_id = str(po.get("vendor_id", "")).strip()
        order_date = str(po.get("order_date", po.get("created_at", "2024-11-15"))).strip()
        dept = str(po.get("department_id", po.get("department", "Procurement"))).strip()
        po_channel = str(po.get("channel", "contract")).strip()

        vendor_info = vendor_map.get(vendor_id, {})
        supplier_name = str(vendor_info.get("name", vendor_id or "Nova Vendor")).strip()
        terms_days = vendor_info.get("payment_terms_days", 30)
        discount_pct = float(vendor_info.get("early_pay_discount_pct", 0.0) or 0.0)

        items_list = po.get("items", [])
        if not items_list and "total_amount" in po:
            # Single item placeholder if line items omitted
            items_list = [{"item_id": "itm_default", "qty": 1, "unit_price": float(po.get("total_amount", 0.0))}]

        for idx, itm in enumerate(items_list):
            item_id = str(itm.get("item_id", "")).strip()
            item_info = item_map.get(item_id, {})
            product_name = str(item_info.get("name", item_id or "Procured Commodity")).strip()
            sku = str(item_info.get("sku", item_id or "SKU-GEN")).strip()

            qty = float(itm.get("qty", itm.get("quantity", 1)) or 1)
            unit_price = float(itm.get("unit_price", itm.get("rate", 0.0)) or 0.0)

            # Contract lookup
            contract_info = contract_map.get((vendor_id, item_id), {})
            contract_price = contract_info.get("contract_price")
            inv_purchase_price = item_info.get("purchase_price")

            if contract_price is not None and float(contract_price) > 0:
                benchmark_unit_price = float(contract_price)
                channel = "contract"
            elif inv_purchase_price is not None and float(inv_purchase_price) > 0:
                benchmark_unit_price = float(inv_purchase_price)
                channel = po_channel
            else:
                benchmark_unit_price = unit_price
                channel = po_channel

            tx_id = f"{po_number}-{idx+1}" if len(items_list) > 1 else po_number

            records.append({
                "transaction_id": tx_id,
                "transaction_date": order_date,
                "po_id": po_number,
                "product_id": sku,
                "product_name": product_name,
                "supplier": supplier_name,
                "quantity": int(qty) if qty.is_integer() else qty,
                "unit_price": round(unit_price, 2),
                "benchmark_unit_price": round(benchmark_unit_price, 2),
                "contract_discount": discount_pct,
                "payment_terms": f"Net {terms_days}",
                "department": dept,
                "channel": channel,
            })

    df = pd.DataFrame(records)
    _NOVA_DF_CACHE = df
    return df.copy()


def get_nova_analysis(force_refresh: bool = False) -> Dict[str, Any]:
    """
    Execute SpendIntel deterministic analysis on live Nova procurement dataset.
    """
    global _NOVA_ANALYSIS_CACHE
    if not force_refresh and _NOVA_ANALYSIS_CACHE is not None:
        return _NOVA_ANALYSIS_CACHE

    df = fetch_and_normalize_nova_procurement(force_refresh=force_refresh)
    if df.empty:
        raise ValueError("No procurement records retrieved from Nova API.")

    analysis = analyze_procurement_dataframe(df)
    _NOVA_ANALYSIS_CACHE = analysis
    return analysis


def get_nova_dashboard(force_refresh: bool = False) -> Dict[str, Any]:
    """
    Return standardized executive dashboard payload for live Nova dataset.
    """
    analysis_result = get_nova_analysis(force_refresh=force_refresh)

    price_anomalies = analysis_result.get("price_anomalies", [])
    duplicates = analysis_result.get("duplicates", [])
    fragmentation = analysis_result.get("fragmentation", [])
    contract_findings = analysis_result.get("contract_findings", [])
    discount_findings = analysis_result.get("discount_findings", [])
    pattern_findings = analysis_result.get("pattern_findings", [])

    kpis = {
        "total_spend": analysis_result.get("total_spend", 0.0),
        "potential_leakage": analysis_result.get("potential_leakage", 0.0),
        "leakage_rate": analysis_result.get("leakage_rate", 0.0),
        "transactions": analysis_result.get("transactions", 0),
        "suppliers": analysis_result.get("suppliers", 0),
        "products": analysis_result.get("products", 0),
    }

    price_anomaly_amount = round(float(sum(item.get("potential_leakage", 0.0) for item in price_anomalies)), 2)
    missed_discount_amount = round(float(sum(item.get("potential_leakage", 0.0) for item in discount_findings)), 2)

    off_contract_items = [c for c in contract_findings if c.get("type") == "OFF_CONTRACT_PURCHASE"]
    off_contract_amount = round(float(sum(c.get("potential_leakage", 0.0) for c in off_contract_items)), 2)

    contract_non_comp_items = [c for c in contract_findings if c.get("type") != "OFF_CONTRACT_PURCHASE"]
    contract_non_comp_amount = round(float(sum(c.get("potential_leakage", 0.0) for c in contract_non_comp_items)), 2)

    duplicate_amount = round(float(sum(item.get("amount", item.get("potential_leakage", 0.0)) for item in duplicates)), 2)
    pattern_amount = round(float(sum(item.get("potential_leakage", 0.0) for item in pattern_findings)), 2)

    leakage_breakdown = [
        {"type": "PRICE_ANOMALY", "count": len(price_anomalies), "amount": price_anomaly_amount},
        {"type": "MISSED_DISCOUNT", "count": len(discount_findings), "amount": missed_discount_amount},
        {"type": "CONTRACT_NON_COMPLIANCE", "count": len(contract_non_comp_items), "amount": contract_non_comp_amount},
        {"type": "OFF_CONTRACT_PURCHASE", "count": len(off_contract_items), "amount": off_contract_amount},
        {"type": "SUPPLIER_FRAGMENTATION", "count": len(fragmentation), "amount": 0.0},
        {"type": "POSSIBLE_DUPLICATE", "count": len(duplicates), "amount": duplicate_amount},
        {"type": "UNUSUAL_PATTERN", "count": len(pattern_findings), "amount": pattern_amount},
    ]

    all_findings: List[Dict[str, Any]] = []
    for item in price_anomalies:
        all_findings.append(_standardize_finding(item, "PRICE_ANOMALY"))
    for item in discount_findings:
        all_findings.append(_standardize_finding(item, "MISSED_DISCOUNT"))
    for item in contract_findings:
        all_findings.append(_standardize_finding(item, "CONTRACT_NON_COMPLIANCE"))
    for item in duplicates:
        all_findings.append(_standardize_finding(item, "POSSIBLE_DUPLICATE"))
    for item in fragmentation:
        all_findings.append(_standardize_finding(item, "SUPPLIER_FRAGMENTATION"))
    for item in pattern_findings:
        all_findings.append(_standardize_finding(item, "UNUSUAL_PATTERN"))

    risk_ranks = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    all_findings.sort(
        key=lambda f: (
            risk_ranks.get(str(f.get("risk", "")).upper(), 99),
            -float(f.get("potential_leakage", 0.0)),
        )
    )

    priority_findings = all_findings[:5]

    total_findings_count = len(all_findings)
    high_risk_count = sum(1 for f in all_findings if str(f.get("risk", "")).upper() == "HIGH")
    medium_risk_count = sum(1 for f in all_findings if str(f.get("risk", "")).upper() == "MEDIUM")
    low_risk_count = sum(1 for f in all_findings if str(f.get("risk", "")).upper() == "LOW")

    summary = {
        "total_findings": total_findings_count,
        "high_risk_findings": high_risk_count,
        "medium_risk_findings": medium_risk_count,
        "low_risk_findings": low_risk_count,
    }

    response = dict(analysis_result)
    response["source"] = "nova"
    response["source_label"] = "LIVE NOVA"
    response["kpis"] = kpis
    response["leakage_breakdown"] = leakage_breakdown
    response["priority_findings"] = priority_findings
    response["summary"] = summary
    response["recent_findings"] = all_findings[:10]

    return response


def get_nova_findings(force_refresh: bool = False) -> Dict[str, Any]:
    """
    Return standardized list of all detected leakage findings in live Nova dataset.
    """
    analysis_result = get_nova_analysis(force_refresh=force_refresh)
    combined: List[Dict[str, Any]] = []

    for item in analysis_result.get("price_anomalies", []):
        combined.append(_standardize_finding(item, "PRICE_ANOMALY"))
    for item in analysis_result.get("discount_findings", []):
        combined.append(_standardize_finding(item, "MISSED_DISCOUNT"))
    for item in analysis_result.get("contract_findings", []):
        combined.append(_standardize_finding(item, "CONTRACT_NON_COMPLIANCE"))
    for item in analysis_result.get("duplicates", []):
        combined.append(_standardize_finding(item, "POSSIBLE_DUPLICATE"))
    for item in analysis_result.get("fragmentation", []):
        combined.append(_standardize_finding(item, "SUPPLIER_FRAGMENTATION"))
    for item in analysis_result.get("pattern_findings", []):
        combined.append(_standardize_finding(item, "UNUSUAL_PATTERN"))

    return {
        "source": "nova",
        "count": len(combined),
        "findings": combined,
    }


def get_nova_suppliers(force_refresh: bool = False) -> Dict[str, Any]:
    """
    Return supplier intelligence metrics calculated across live Nova procurement records.
    """
    df = fetch_and_normalize_nova_procurement(force_refresh=force_refresh)
    df = normalize_procurement_dataframe(df)

    for col in ["quantity", "unit_price", "benchmark_unit_price"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

    anomalies = detect_price_anomalies(df)
    supplier_anomalies_map: Dict[str, List[Dict[str, Any]]] = {}
    for a in anomalies:
        sname = str(a.get("supplier", "")).strip()
        supplier_anomalies_map.setdefault(sname, []).append(a)

    contract_audit = detect_contract_findings(df)
    missed_discounts = contract_audit.get("missed_discounts", [])
    supplier_discounts_map: Dict[str, float] = {}
    for d in missed_discounts:
        sname = str(d.get("supplier", "")).strip()
        supplier_discounts_map[sname] = supplier_discounts_map.get(sname, 0.0) + float(d.get("potential_leakage", 0.0))

    contract_findings = contract_audit.get("contract_compliance", [])
    supplier_off_contract_map: Dict[str, int] = {}
    for c in contract_findings:
        if c.get("type") == "OFF_CONTRACT_PURCHASE":
            sname = str(c.get("supplier", "")).strip()
            supplier_off_contract_map[sname] = supplier_off_contract_map.get(sname, 0) + 1

    suppliers_list: List[Dict[str, Any]] = []

    for supp_key, group in df.groupby("supplier"):
        supplier_name = str(supp_key).strip()
        norm_name = str(group["normalized_supplier"].iloc[0]).strip() if "normalized_supplier" in group.columns else supplier_name
        t_count = int(len(group))
        total_spend = float((group["quantity"] * group["unit_price"]).sum())
        avg_unit_price = float(group["unit_price"].mean()) if t_count > 0 else 0.0
        total_qty = float(group["quantity"].sum())

        anom_list = supplier_anomalies_map.get(supplier_name, [])
        anomaly_count = int(len(anom_list))
        potential_leakage = float(sum(item.get("potential_leakage", 0.0) for item in anom_list))

        products_supplied = sorted(list(set(str(p).strip() for p in group["product_name"].dropna().unique() if str(p).strip())))
        missed_disc_amt = supplier_discounts_map.get(supplier_name, 0.0)
        off_contract_count = supplier_off_contract_map.get(supplier_name, 0)

        has_discount = bool((pd.to_numeric(group["contract_discount"], errors="coerce").fillna(0.0) > 0).any())
        contracted_supplier = has_discount or (anomaly_count == 0 and t_count > 1)

        if potential_leakage >= 100000.0:
            risk = "HIGH"
        elif potential_leakage >= 25000.0:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        total_qty_clean = int(total_qty) if total_qty.is_integer() else round(total_qty, 2)

        suppliers_list.append({
            "supplier": supplier_name,
            "normalized_supplier": norm_name,
            "transaction_count": t_count,
            "total_spend": round(total_spend, 2),
            "average_unit_price": round(avg_unit_price, 2),
            "total_quantity": total_qty_clean,
            "anomaly_count": anomaly_count,
            "potential_leakage": round(potential_leakage, 2),
            "risk": risk,
            "products_supplied": products_supplied,
            "contracted_supplier": contracted_supplier,
            "off_contract_count": off_contract_count,
            "missed_discount_amount": round(missed_disc_amt, 2),
        })

    suppliers_list.sort(key=lambda s: (s["potential_leakage"], s["total_spend"]), reverse=True)

    return {
        "source": "nova",
        "suppliers": suppliers_list,
        "total_suppliers": len(suppliers_list),
    }


def clear_nova_service_cache() -> None:
    """Clear cached Nova procurement dataframe and analysis."""
    global _NOVA_DF_CACHE, _NOVA_ANALYSIS_CACHE
    _NOVA_DF_CACHE = None
    _NOVA_ANALYSIS_CACHE = None

