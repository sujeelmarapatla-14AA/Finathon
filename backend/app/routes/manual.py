"""
SpendIntel - Manual Procurement Transaction Entry & Analysis Route.

Provides endpoints for ingesting user-entered procurement transactions:
- Validates required fields: transaction_id, product_name, supplier, quantity (>0), unit_price (>=0), benchmark_unit_price (>0).
- Accepts optional fields: transaction_date, product_id, po_number, department, contract_price (>=0), contract_discount (0-100%), procurement_channel, status.
- Writes to backend/app/data/uploads/manual_{uuid}.csv.
- Passes data through the exact SAME SpendIntel analysis pipeline:
  Normalization -> Price Benchmarking -> Duplicate Auditing -> Fragmentation -> Contracts -> Patterns -> Deduplicated Canonical Leakage.
- Returns authoritative dashboard metrics with source="manual" and source_label="MANUAL DATA".
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, HTTPException
import pandas as pd
from pydantic import BaseModel, Field

try:
    from app.routes.dashboard import get_dashboard_analysis
except ImportError:
    from backend.app.routes.dashboard import get_dashboard_analysis

router = APIRouter(tags=["manual"])

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class ManualTransactionItem(BaseModel):
    transaction_id: str = Field(..., description="Unique transaction or invoice identifier")
    product_name: Optional[str] = Field(None, description="Purchased product / commodity name")
    product: Optional[str] = Field(None, description="Alias for product_name")
    supplier: str = Field(..., description="Vendor / supplier name")
    quantity: float = Field(..., description="Units purchased, must be > 0")
    unit_price: Optional[float] = Field(None, description="Actual unit price paid, must be >= 0")
    actual_unit_price: Optional[float] = Field(None, description="Alias for unit_price")
    benchmark_unit_price: float = Field(..., description="Target benchmark unit price, must be > 0")

    # Optional fields
    transaction_date: Optional[str] = Field(None, description="Transaction or PO date (YYYY-MM-DD)")
    product_id: Optional[str] = Field(None, description="Product SKU or Catalog Item Code")
    po_number: Optional[str] = Field(None, description="Purchase Order number")
    po_id: Optional[str] = Field(None, description="Alias for po_number")
    department: Optional[str] = Field(None, description="Cost center / department")
    contract_price: Optional[float] = Field(None, description="Negotiated contract price (>= 0)")
    contract_discount: Optional[float] = Field(None, description="Negotiated discount percentage (0-100%)")
    procurement_channel: Optional[str] = Field(None, description="Channel: Catalog, Contract, Off-Contract")
    status: Optional[str] = Field(None, description="Procurement status")


class ManualAnalysisRequest(BaseModel):
    transactions: List[ManualTransactionItem]


@router.post("/manual-analysis")
@router.post("/api/manual-analysis")
def analyze_manual_transactions(request: ManualAnalysisRequest) -> Dict[str, Any]:
    """
    Ingest, validate, and analyze manually entered procurement transactions.
    """
    if not request.transactions or len(request.transactions) == 0:
        raise HTTPException(
            status_code=400,
            detail="At least one transaction is required for spend analysis.",
        )

    records: List[Dict[str, Any]] = []

    for idx, item in enumerate(request.transactions):
        row_num = idx + 1

        # 1. Transaction ID validation
        tx_id = (item.transaction_id or "").strip()
        if not tx_id:
            raise HTTPException(
                status_code=400,
                detail=f"Row {row_num}: Transaction ID is required.",
            )

        # 2. Product Name validation
        prod_name = (item.product_name or item.product or "").strip()
        if not prod_name:
            raise HTTPException(
                status_code=400,
                detail=f"Row {row_num}: Product name is required.",
            )

        # 3. Supplier validation
        supplier = (item.supplier or "").strip()
        if not supplier:
            raise HTTPException(
                status_code=400,
                detail=f"Row {row_num}: Supplier name is required.",
            )

        # 4. Quantity validation (> 0)
        try:
            qty = float(item.quantity)
            if qty <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail=f"Row {row_num}: Quantity must be greater than 0.",
            )

        # 5. Unit Price validation (>= 0)
        price_val = item.unit_price if item.unit_price is not None else item.actual_unit_price
        if price_val is None:
            raise HTTPException(
                status_code=400,
                detail=f"Row {row_num}: Actual Unit Price is required.",
            )
        try:
            price = float(price_val)
            if price < 0:
                raise ValueError()
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail=f"Row {row_num}: Actual Unit Price must be >= 0.",
            )

        # 6. Benchmark Unit Price validation (> 0)
        try:
            bench_price = float(item.benchmark_unit_price)
            if bench_price <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail=f"Row {row_num}: Benchmark Unit Price must be greater than 0.",
            )

        # 7. Optional Contract Price validation (>= 0)
        contract_price_val = None
        if item.contract_price is not None:
            try:
                contract_price_val = float(item.contract_price)
                if contract_price_val < 0:
                    raise ValueError()
            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=400,
                    detail=f"Row {row_num}: Contract Price if supplied must be >= 0.",
                )

        # 8. Optional Contract Discount validation (0-100%)
        contract_discount_val = None
        if item.contract_discount is not None:
            try:
                disc = float(item.contract_discount)
                if disc < 0 or disc > 100:
                    raise ValueError()
                if disc > 1.0:
                    contract_discount_val = disc / 100.0
                else:
                    contract_discount_val = disc
            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=400,
                    detail=f"Row {row_num}: Contract Discount if supplied must be between 0% and 100%.",
                )

        # Product ID resolution
        prod_id = (item.product_id or "").strip()
        if not prod_id:
            prod_id = prod_name

        po_val = (item.po_number or item.po_id or "").strip() or None

        record: Dict[str, Any] = {
            "transaction_id": tx_id,
            "product_id": prod_id,
            "product_name": prod_name,
            "supplier": supplier,
            "quantity": qty,
            "unit_price": price,
            "benchmark_unit_price": bench_price,
            "contract_price": contract_price_val,
            "contract_discount": contract_discount_val,
            "department": (item.department or "").strip() or None,
            "procurement_channel": (item.procurement_channel or "").strip() or None,
            "transaction_date": (item.transaction_date or "").strip() or None,
            "po_number": po_val,
            "po_id": po_val,
            "status": (item.status or "").strip() or None,
        }
        records.append(record)

    # Construct DataFrame
    df = pd.DataFrame(records)

    # Save to disk as manual dataset in UPLOAD_DIR
    file_id = f"manual_{uuid.uuid4().hex[:12]}"
    file_path = UPLOAD_DIR / f"{file_id}.csv"
    try:
        df.to_csv(file_path, index=False)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to persist manual transactions: {str(e)}",
        )

    # Run complete SpendIntel analysis pipeline via get_dashboard_analysis
    try:
        analysis_data = get_dashboard_analysis(file_id)
    except Exception as e:
        if file_path.exists():
            file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail=f"Analysis pipeline error: {str(e)}",
        )

    return {
        "success": True,
        "file_id": file_id,
        "source": "manual",
        "source_label": "MANUAL DATA",
        "rows": len(records),
        **analysis_data,
    }
