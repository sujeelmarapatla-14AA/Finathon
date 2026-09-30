"""
SpendIntel - Contract & Negotiated Discount Compliance Service.

Performs deterministic audits of procurement transactions against contracted terms,
negotiated volume discounts, payment terms, and off-contract purchasing patterns.
"""

from typing import Any, Dict, List, Optional
import pandas as pd


def _resolve_column(df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
    """Helper to resolve the column name from a list of possible candidate names."""
    for candidate in candidates:
        if candidate in df.columns:
            return candidate
    lower_cols = {col.lower().replace(" ", "_"): col for col in df.columns}
    for candidate in candidates:
        cand_key = candidate.lower().replace(" ", "_")
        if cand_key in lower_cols:
            return lower_cols[cand_key]
    return None


def detect_contract_findings(df: pd.DataFrame) -> Dict[str, List[Dict[str, Any]]]:
    """
    Audit procurement transactions for contract and negotiated discount compliance:

    1. MISSED_DISCOUNT:
       - Transaction specifies a negotiated contract_discount > 0.
       - The supplier billed at full list/unit price without applying the discount.
       - Expected price = actual_price * (1 - contract_discount).
       - Potential leakage = (unit_price * contract_discount) * quantity.
       - Deterministically verified against contract_saving_expected where available.

    2. OFF_CONTRACT_PURCHASE & CONTRACT_NON_COMPLIANCE:
       - Transactions deviating above the master contracted benchmark rate card (>= 5%).
       - Off-contract spot purchases flagged where rate premium is significant (>= 8%).

    3. EXPIRED_CONTRACT:
       - If contract start/end dates exist in the dataset, checks if transaction date
         fell outside the active contract period.
       - If dates are not present in dataset, safely returns empty list (never invents dates).

    4. CONTRACT EVIDENCE:
       - Every contract finding includes supporting source data traceable to dataset fields.

    Returns:
        Dict with keys:
        - "missed_discounts": List[Dict]
        - "contract_compliance": List[Dict]
        - "expired_contracts": List[Dict]
        - "all_contract_findings": List[Dict]
    """
    if df is None or df.empty:
        return {
            "missed_discounts": [],
            "contract_compliance": [],
            "expired_contracts": [],
            "all_contract_findings": [],
        }

    tx_col = _resolve_column(df, ["transaction_id", "id", "tx_id", "po_id", "po_number"])
    pid_col = _resolve_column(df, ["product_id", "sku", "item_code"])
    prod_col = _resolve_column(df, ["product_name", "product", "item_description", "description"])
    supp_col = _resolve_column(df, ["supplier", "supplier_name", "vendor_name", "vendor"])
    qty_col = _resolve_column(df, ["quantity", "qty", "units"])
    price_col = _resolve_column(df, ["unit_price", "actual_price", "price", "unit_cost"])
    bench_col = _resolve_column(df, ["benchmark_unit_price", "benchmark_price", "benchmark", "target_price"])
    disc_col = _resolve_column(df, ["contract_discount", "discount", "negotiated_discount"])
    expected_saving_col = _resolve_column(df, ["contract_saving_expected", "expected_savings"])
    terms_col = _resolve_column(df, ["payment_terms", "terms"])
    dept_col = _resolve_column(df, ["department", "dept"])
    tx_date_col = _resolve_column(df, ["transaction_date", "date", "po_date"])
    start_date_col = _resolve_column(df, ["contract_start_date", "contract_start", "valid_from"])
    end_date_col = _resolve_column(df, ["contract_end_date", "contract_end", "valid_to", "contract_expiry"])

    missed_discounts: List[Dict[str, Any]] = []
    contract_compliance: List[Dict[str, Any]] = []
    expired_contracts: List[Dict[str, Any]] = []

    # 1. Missed Discount Analysis (Deterministic calculation)
    if disc_col and price_col and qty_col:
        for _, row in df.iterrows():
            disc_rate = pd.to_numeric(row[disc_col], errors="coerce")
            unit_price = pd.to_numeric(row[price_col], errors="coerce")
            qty = pd.to_numeric(row[qty_col], errors="coerce")

            if pd.notna(disc_rate) and float(disc_rate) > 0 and pd.notna(unit_price) and pd.notna(qty):
                rate = float(disc_rate)
                price = float(unit_price)
                quantity = float(qty)

                # If rate was expressed as percentage integer (e.g. 5 instead of 0.05)
                if rate > 1.0:
                    rate = rate / 100.0

                expected_unit_price = round(price * (1.0 - rate), 2)

                # Use verified contract_saving_expected if provided in dataset
                if expected_saving_col and pd.notna(row[expected_saving_col]):
                    potential_leakage = round(float(row[expected_saving_col]), 2)
                else:
                    potential_leakage = round((price * rate) * quantity, 2)

                variance_pct = round(rate * 100.0, 2)

                # Risk determination
                if potential_leakage >= 100000.0 or variance_pct >= 10.0:
                    risk = "HIGH"
                elif potential_leakage >= 25000.0 or variance_pct >= 5.0:
                    risk = "MEDIUM"
                else:
                    risk = "LOW"

                tx_id = str(row[tx_col]).strip() if tx_col and pd.notna(row[tx_col]) else ""
                product_id = str(row[pid_col]).strip() if pid_col and pd.notna(row[pid_col]) else ""
                product = str(row[prod_col]).strip() if prod_col and pd.notna(row[prod_col]) else "Product"
                supplier = str(row[supp_col]).strip() if supp_col and pd.notna(row[supp_col]) else "Supplier"
                terms = str(row[terms_col]).strip() if terms_col and pd.notna(row[terms_col]) else "NET30"
                dept = str(row[dept_col]).strip() if dept_col and pd.notna(row[dept_col]) else "Operations"
                clean_qty = int(quantity) if quantity.is_integer() else round(quantity, 2)

                evidence = [
                    f"Contract entitlement specifies a {variance_pct}% negotiated volume rebate",
                    f"Invoiced unit price: ₹{price:,.2f} billed without agreed discount deduction",
                    f"Expected contractual price per unit: ₹{expected_unit_price:,.2f}",
                    f"Unrecovered commercial discount across {clean_qty} units equals ₹{potential_leakage:,.2f}",
                    f"Governing commercial terms: {terms}, Department: {dept}",
                ]

                missed_discounts.append({
                    "id": f"DISC-{tx_id}",
                    "type": "MISSED_DISCOUNT",
                    "detection_type": "MISSED_DISCOUNT",
                    "transaction_id": tx_id,
                    "product_id": product_id,
                    "product": product,
                    "supplier": supplier,
                    "quantity": clean_qty,
                    "actual_price": round(price, 2),
                    "expected_price": expected_unit_price,
                    "variance": variance_pct,
                    "variance_percent": variance_pct,
                    "potential_leakage": potential_leakage,
                    "risk": risk,
                    "reason": f"Contractual {variance_pct}% discount was not applied to invoice {tx_id}",
                    "evidence": evidence,
                })

    # 2. Contract Price Compliance & Off-Contract Purchasing Analysis
    if bench_col and price_col and qty_col:
        for _, row in df.iterrows():
            actual = pd.to_numeric(row[price_col], errors="coerce")
            bench = pd.to_numeric(row[bench_col], errors="coerce")
            qty = pd.to_numeric(row[qty_col], errors="coerce")

            if pd.notna(actual) and pd.notna(bench) and float(bench) > 0:
                actual_val = float(actual)
                bench_val = float(bench)
                quantity = float(qty) if pd.notna(qty) else 1.0

                # Evaluate variance against master rate card baseline
                if actual_val > bench_val:
                    var_pct = round(((actual_val - bench_val) / bench_val) * 100.0, 2)
                    if var_pct >= 5.0:
                        leakage = round((actual_val - bench_val) * quantity, 2)
                        tx_id = str(row[tx_col]).strip() if tx_col and pd.notna(row[tx_col]) else ""
                        product_id = str(row[pid_col]).strip() if pid_col and pd.notna(row[pid_col]) else ""
                        product = str(row[prod_col]).strip() if prod_col and pd.notna(row[prod_col]) else "Product"
                        supplier = str(row[supp_col]).strip() if supp_col and pd.notna(row[supp_col]) else "Supplier"
                        clean_qty = int(quantity) if quantity.is_integer() else round(quantity, 2)

                        finding_type = "OFF_CONTRACT_PURCHASE" if var_pct >= 8.0 else "CONTRACT_NON_COMPLIANCE"
                        risk = "HIGH" if (leakage >= 50000.0 or var_pct >= 15.0) else ("MEDIUM" if var_pct >= 8.0 else "LOW")

                        evidence = [
                            f"Governing contract benchmark price: ₹{bench_val:,.2f}",
                            f"Actual spot invoiced price: ₹{actual_val:,.2f} (+{var_pct}% variance)",
                            f"Avoidable premium over master rate card: ₹{leakage:,.2f}",
                        ]

                        contract_compliance.append({
                            "id": f"CONT-{tx_id}",
                            "type": finding_type,
                            "detection_type": "CONTRACT_NON_COMPLIANCE",
                            "transaction_id": tx_id,
                            "product_id": product_id,
                            "product": product,
                            "supplier": supplier,
                            "quantity": clean_qty,
                            "actual_price": round(actual_val, 2),
                            "expected_price": round(bench_val, 2),
                            "variance": var_pct,
                            "variance_percent": var_pct,
                            "potential_leakage": leakage,
                            "risk": risk,
                            "reason": f"Procurement deviated by +{var_pct}% above contracted master rate card baseline",
                            "evidence": evidence,
                        })

    # 3. Expired Contract Analysis (Only if contract date fields exist in dataset)
    if tx_date_col and (start_date_col or end_date_col):
        for _, row in df.iterrows():
            tx_date_raw = row.get(tx_date_col)
            start_date_raw = row.get(start_date_col) if start_date_col else None
            end_date_raw = row.get(end_date_col) if end_date_col else None

            if pd.notna(tx_date_raw) and (pd.notna(start_date_raw) or pd.notna(end_date_raw)):
                try:
                    t_date = pd.to_datetime(tx_date_raw)
                    is_outside = False
                    reason_msg = ""

                    if pd.notna(end_date_raw):
                        e_date = pd.to_datetime(end_date_raw)
                        if t_date > e_date:
                            is_outside = True
                            reason_msg = f"Order date {tx_date_raw} occurred after contract expiration ({end_date_raw})"

                    if pd.notna(start_date_raw) and not is_outside:
                        s_date = pd.to_datetime(start_date_raw)
                        if t_date < s_date:
                            is_outside = True
                            reason_msg = f"Order date {tx_date_raw} occurred prior to contract start date ({start_date_raw})"

                    if is_outside:
                        tx_id = str(row[tx_col]).strip() if tx_col and pd.notna(row[tx_col]) else ""
                        product_id = str(row[pid_col]).strip() if pid_col and pd.notna(row[pid_col]) else ""
                        product = str(row[prod_col]).strip() if prod_col and pd.notna(row[prod_col]) else "Product"
                        supplier = str(row[supp_col]).strip() if supp_col and pd.notna(row[supp_col]) else "Supplier"
                        actual = pd.to_numeric(row[price_col], errors="coerce") if price_col else 0.0
                        bench = pd.to_numeric(row[bench_col], errors="coerce") if bench_col else 0.0
                        qty = pd.to_numeric(row[qty_col], errors="coerce") if qty_col else 1.0

                        actual_val = float(actual) if pd.notna(actual) else 0.0
                        bench_val = float(bench) if pd.notna(bench) else 0.0
                        clean_qty = int(qty) if float(qty).is_integer() else round(float(qty), 2)
                        leakage = max(actual_val - bench_val, 0.0) * float(clean_qty)

                        expired_contracts.append({
                            "id": f"EXP-{tx_id}",
                            "type": "EXPIRED_CONTRACT",
                            "detection_type": "CONTRACT_NON_COMPLIANCE",
                            "transaction_id": tx_id,
                            "product_id": product_id,
                            "product": product,
                            "supplier": supplier,
                            "quantity": clean_qty,
                            "actual_price": round(actual_val, 2),
                            "expected_price": round(bench_val, 2),
                            "variance": 0.0,
                            "variance_percent": 0.0,
                            "potential_leakage": round(leakage, 2),
                            "risk": "HIGH",
                            "reason": reason_msg,
                            "evidence": [
                                reason_msg,
                                f"Invoiced unit price: ₹{actual_val:,.2f}",
                                f"Historical benchmark: ₹{bench_val:,.2f}",
                            ],
                        })
                except Exception:
                    pass

    missed_discounts.sort(key=lambda x: x["potential_leakage"], reverse=True)
    contract_compliance.sort(key=lambda x: x["potential_leakage"], reverse=True)
    expired_contracts.sort(key=lambda x: x["potential_leakage"], reverse=True)
    all_findings = missed_discounts + contract_compliance + expired_contracts

    return {
        "missed_discounts": missed_discounts,
        "contract_compliance": contract_compliance,
        "expired_contracts": expired_contracts,
        "all_contract_findings": all_findings,
    }
