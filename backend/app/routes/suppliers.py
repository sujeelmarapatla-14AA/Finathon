"""
SpendIntel - Supplier Intelligence Route.

Provides endpoints for analyzing supplier performance, aggregated spend,
price anomaly counts, contract adherence, and risk profiles across procurement datasets.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
import pandas as pd

try:
    from app.services.leakage import detect_price_anomalies
    from app.services.normalization import normalize_procurement_dataframe
    from app.services.contracts import detect_contract_findings
except ImportError:
    from backend.app.services.leakage import detect_price_anomalies
    from backend.app.services.normalization import normalize_procurement_dataframe
    from backend.app.services.contracts import detect_contract_findings

router = APIRouter(tags=["suppliers"])

# Resolve upload storage directory: backend/app/data/uploads
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
SUPPORTED_EXTENSIONS = [".csv", ".xlsx", ".xls"]

REQUIRED_COLUMNS: List[str] = [
    "transaction_id",
    "product_id",
    "product_name",
    "supplier",
    "quantity",
    "unit_price",
    "benchmark_unit_price",
]


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


@router.get("/api/suppliers/{file_id}")
@router.get("/suppliers/{file_id}")
def get_supplier_intelligence(file_id: str) -> Dict[str, Any]:
    """
    Retrieve supplier intelligence metrics for an uploaded procurement dataset.

    - Locates {file_id}.csv, {file_id}.xlsx, or {file_id}.xls in backend/app/data/uploads/.
    - Returns HTTP 404 if file does not exist.
    - Validates required columns.
    - Normalizes supplier and product names.
    - Groups transactions by supplier.
    - Computes:
      - supplier & normalized_supplier
      - transaction_count & total_spend
      - average_unit_price & total_quantity
      - anomaly_count & potential_leakage
      - risk tier (HIGH, MEDIUM, LOW)
      - products_supplied
      - contracted_supplier indicator
      - off_contract_count
      - missed_discount_amount
    - Returns structured list sorted by potential_leakage descending, then total_spend.
    """
    target_id = "cb8b20d5-2516-47a9-8646-317e9beee50b" if file_id.lower() == "demo" else file_id
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

    # Clean whitespace in column names
    df.columns = df.columns.astype(str).str.strip()

    # Validate required columns
    missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Missing required columns: {', '.join(missing_columns)}. "
                f"Expected columns: {', '.join(REQUIRED_COLUMNS)}."
            ),
        )

    # Apply supplier & product normalization
    df = normalize_procurement_dataframe(df)

    # Safe numeric conversion
    for col in ["quantity", "unit_price", "benchmark_unit_price"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

    supp_col = _resolve_column(df, ["supplier", "supplier_name", "vendor_name", "vendor"]) or "supplier"
    norm_supp_col = "normalized_supplier"
    prod_col = _resolve_column(df, ["product_name", "product", "item_description"]) or "product_name"
    disc_col = _resolve_column(df, ["contract_discount", "discount"])

    # Compute price anomalies deterministically
    anomalies = detect_price_anomalies(df)
    supplier_anomalies_map: Dict[str, List[Dict[str, Any]]] = {}
    for a in anomalies:
        supp_name = str(a.get("supplier", "")).strip()
        supplier_anomalies_map.setdefault(supp_name, []).append(a)

    # Compute contract audit deterministically
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

    # Group by supplier
    for supp_key, group in df.groupby(supp_col):
        supplier_name = str(supp_key).strip()
        norm_name = str(group[norm_supp_col].iloc[0]).strip() if norm_supp_col in group.columns else supplier_name
        t_count = int(len(group))
        total_spend = float((group["quantity"] * group["unit_price"]).sum())
        avg_unit_price = float(group["unit_price"].mean()) if t_count > 0 else 0.0
        total_qty = float(group["quantity"].sum())

        anom_list = supplier_anomalies_map.get(supplier_name, [])
        anomaly_count = int(len(anom_list))
        potential_leakage = float(sum(item.get("potential_leakage", 0.0) for item in anom_list))

        # Products supplied
        products_supplied = sorted(list(set(str(p).strip() for p in group[prod_col].dropna().unique() if str(p).strip())))

        # Missed discount amount
        missed_disc_amt = supplier_discounts_map.get(supplier_name, 0.0)

        # Off-contract count
        off_contract_count = supplier_off_contract_map.get(supplier_name, 0)

        # Contracted supplier status: true if discounts exist or contracted pricing found
        has_discount = bool(disc_col and (pd.to_numeric(group[disc_col], errors="coerce").fillna(0.0) > 0).any())
        contracted_supplier = has_discount or (anomaly_count == 0 and t_count > 1)

        # Risk tier rules:
        # HIGH: potential_leakage >= 100000
        # MEDIUM: potential_leakage >= 25000
        # LOW: otherwise
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

    # Sort suppliers by potential_leakage descending, then total_spend descending
    suppliers_list.sort(key=lambda s: (s["potential_leakage"], s["total_spend"]), reverse=True)

    is_demo = target_id == "cb8b20d5-2516-47a9-8646-317e9beee50b"
    is_manual = str(target_id).startswith("manual_")
    return {
        "source": "demo" if is_demo else ("manual" if is_manual else "upload"),
        "suppliers": suppliers_list,
        "total_suppliers": len(suppliers_list),
    }
