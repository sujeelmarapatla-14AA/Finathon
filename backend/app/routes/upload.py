import os
import shutil
import uuid
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, File, HTTPException, UploadFile
import pandas as pd

try:
    from app.services.normalization import standardize_raw_procurement_dataframe
    from app.services.dataset_service import process_and_persist_dataset_pipeline
except ImportError:
    from backend.app.services.normalization import standardize_raw_procurement_dataframe
    from backend.app.services.dataset_service import process_and_persist_dataset_pipeline

router = APIRouter(tags=["upload"])

# Resolve target upload directory: backend/app/data/uploads
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


@router.post("/api/upload")
@router.post("/upload")
async def upload_procurement_file(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Handle procurement dataset upload with SpendIntel schema standardization and database persistence.

    - Accepts only .csv, .xlsx, and .xls files (rejects others with HTTP 400).
    - Generates a unique UUID while preserving the file extension.
    - Saves the uploaded file into backend/app/data/uploads/.
    - Validates that the file can be parsed with pandas.read_csv() or pandas.read_excel().
    - Validates required procurement input schema (Product, Supplier, Quantity, Unit Price).
    - Normalizes product names, generates stable product & transaction IDs.
    - Persists raw input data and product similarity comparisons in unified database (datasets & dataset_rows).
    - Returns JSON metadata with file_id, filename, row count, and column headers.
    """
    original_filename = file.filename or ""
    _, ext = os.path.splitext(original_filename)
    ext_lower = ext.lower()

    # Validate file extension
    if ext_lower not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file format '{ext}'. "
                f"Only {', '.join(sorted(ALLOWED_EXTENSIONS))} files are accepted."
            ),
        )

    # Generate unique UUID and construct destination file path
    file_id = str(uuid.uuid4())
    saved_filename = f"{file_id}{ext_lower}"
    file_path = UPLOAD_DIR / saved_filename

    # Save uploaded file to disk
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        if file_path.exists():
            file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save uploaded file: {str(e)}",
        )
    finally:
        await file.close()

    # Validate that the file can actually be parsed by pandas
    try:
        if ext_lower in {".xlsx", ".xls"}:
            df_raw = pd.read_excel(file_path)
        else:
            df_raw = pd.read_csv(file_path)
    except Exception as e:
        # Delete corrupted/unreadable file on failure
        if file_path.exists():
            file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail=f"Uploaded file could not be parsed: {str(e)}",
        )

    # Extract row count and raw column names
    rows_count = int(len(df_raw))
    columns_list = [str(col).strip() for col in df_raw.columns.tolist()]
    file_size_bytes = os.path.getsize(file_path) if file_path.exists() else 0

    # Validate core procurement schema and standardize dataframe
    try:
        df_standard = standardize_raw_procurement_dataframe(df_raw)
    except ValueError as e:
        if file_path.exists():
            file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    # Save standardized dataframe to disk so downstream services read clean canonical columns
    try:
        if ext_lower in {".xlsx", ".xls"}:
            df_standard.to_excel(file_path, index=False)
        else:
            df_standard.to_csv(file_path, index=False)
    except Exception:
        # If saving standardized fails, preserve raw file
        pass

    # Determine source_type
    source_type = "EXCEL" if ext_lower in {".xlsx", ".xls"} else "CSV"

    # Persist in Unified Database
    try:
        dataset_name = original_filename if original_filename else f"Procurement Upload ({file_id[:8]})"
        raw_records = df_raw.to_dict(orient="records")
        process_and_persist_dataset_pipeline(
            dataset_id=file_id,
            name=dataset_name,
            source_type=source_type,
            raw_df=df_standard,
            raw_records_list=raw_records,
            original_filename=original_filename,
            file_type=ext_lower.replace(".", ""),
            source_reference="uploaded_file",
            file_size=file_size_bytes,
        )
    except Exception as db_err:
        # Log error but don't fail upload if DB persistence encountered non-fatal issue
        print(f"[Upload DB Warning] Could not persist dataset: {db_err}")

    return {
        "success": True,
        "file_id": file_id,
        "filename": original_filename,
        "source_type": source_type,
        "rows": rows_count,
        "columns": columns_list,
    }
