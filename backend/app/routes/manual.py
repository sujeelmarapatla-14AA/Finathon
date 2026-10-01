"""
SpendIntel - Manual Procurement Transaction Entry & Analysis Route.

Provides endpoints for ingesting user-entered procurement transactions:
- Validates required fields: product_name/product, supplier, quantity (>0), unit_price (>=0).
- Accepts optional fields: transaction_id, benchmark_unit_price, transaction_date, product_id, po_number, department, contract_price (>=0), contract_discount (0-100%), procurement_channel, status.
- Writes to backend/app/data/uploads/manual_{uuid}.csv.
- Passes data through the exact SAME SpendIntel analysis pipeline:
  Normalization -> Price Benchmarking -> Duplicate Auditing -> Fragmentation -> Contracts -> Patterns -> Product Similarity.
- Persists to unified SQLite database (`datasets` & `dataset_rows`).
- Returns authoritative dashboard metrics with source="manual" and source_label="MANUAL DATA".
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, HTTPException
import pandas as pd
from pydantic import BaseModel, Field

try:
    from app.routes.dashboard import get_dashboard_analysis
    from app.services.normalization import standardize_raw_procurement_dataframe
    from app.services.dataset_service import process_and_persist_dataset_pipeline
except ImportError:
    from backend.app.routes.dashboard import get_dashboard_analysis
    from backend.app.services.normalization import standardize_raw_procurement_dataframe
    from backend.app.services.dataset_service import process_and_persist_dataset_pipeline

router = APIRouter(tags=["manual"])

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class ManualTransactionItem(BaseModel):
    transaction_id: Optional[str] = Field(None, description="Unique transaction or invoice identifier (optional)")
    product_name: Optional[str] = Field(None, description="Purchased product / commodity name")
    product: Optional[str] = Field(None, description="Alias for product_name")
    supplier: str = Field(..., description="Vendor / supplier name")
    quantity: float = Field(..., description="Units purchased, must be > 0")
    unit_price: Optional[float] = Field(None, description="Actual unit price paid, must be >= 0")
    actual_unit_price: Optional[float] = Field(None, description="Alias for unit_price")
    benchmark_unit_price: Optional[float] = Field(None, description="Target benchmark unit price (optional)")

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
    Ingest, validate, analyze, and persist manually entered procurement transactions.
    """
    if not request.transactions or len(request.transactions) == 0:
        raise HTTPException(
            status_code=400,
            detail="At least one transaction is required for spend analysis.",
        )

    records: List[Dict[str, Any]] = []

    for idx, item in enumerate(request.transactions):
        row_num = idx + 1

        # 1. Product Name validation
        prod_name = (item.product_name or item.product or "").strip()
        if not prod_name:
            raise HTTPException(
                status_code=400,
                detail=f"Row {row_num}: Product name is required.",
            )

        # 2. Supplier validation
        supplier = (item.supplier or "").strip()
        if not supplier:
            raise HTTPException(
                status_code=400,
                detail=f"Row {row_num}: Supplier name is required.",
            )

        # 3. Quantity validation (> 0)
        try:
            qty = float(item.quantity)
            if qty <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail=f"Row {row_num}: Quantity must be greater than 0.",
            )

        # 4. Unit Price validation (>= 0)
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

        # 5. Optional Benchmark Unit Price (> 0 if provided)
        bench_price = None
        if item.benchmark_unit_price is not None:
            try:
                bp = float(item.benchmark_unit_price)
                if bp > 0:
                    bench_price = bp
            except (ValueError, TypeError):
                bench_price = None

        # 6. Optional Contract Price validation (>= 0)
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

        # 7. Optional Contract Discount validation (0-100%)
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

        tx_id = (item.transaction_id or "").strip() or f"TX-MANUAL-{row_num:04d}"
        prod_id = (item.product_id or "").strip() or None
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

    # Construct DataFrame and standardize
    raw_df = pd.DataFrame(records)
    df = standardize_raw_procurement_dataframe(raw_df)

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

    # Persist in Unified Database with exact raw records preserved
    try:
        timestamp_label = datetime.now().strftime("%b %d, %H:%M")
        dataset_name = f"Manual Procurement Entry ({len(records)} Items - {timestamp_label})"
        process_and_persist_dataset_pipeline(
            dataset_id=file_id,
            name=dataset_name,
            source_type="MANUAL",
            raw_df=df,
            raw_records_list=records,
            original_filename="manual_entry.csv",
            file_type="manual",
            source_reference="manual_entry",
            file_size=len(records) * 120,
        )
    except Exception as db_err:
        print(f"[Manual DB Warning] Could not persist dataset: {db_err}")

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
        "source_type": "MANUAL",
        "rows": len(records),
        **analysis_data,
    }
