import os
import shutil
import uuid
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, File, HTTPException, UploadFile
import pandas as pd

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
    Handle procurement dataset upload.

    - Accepts only .csv, .xlsx, and .xls files (rejects others with HTTP 400).
    - Generates a unique UUID while preserving the file extension.
    - Saves the uploaded file into backend/app/data/uploads/.
    - Validates that the file can be parsed with pandas.read_csv() or pandas.read_excel().
    - Deletes invalid files and returns HTTP 400 if parsing fails.
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
            df = pd.read_excel(file_path)
        else:
            df = pd.read_csv(file_path)
    except Exception as e:
        # Delete corrupted/unreadable file on failure
        if file_path.exists():
            file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail=f"Uploaded file could not be parsed: {str(e)}",
        )

    # Extract row count and cleaned column names
    rows_count = int(len(df))
    columns_list = [str(col).strip() for col in df.columns.tolist()]

    return {
        "success": True,
        "file_id": file_id,
        "filename": original_filename,
        "rows": rows_count,
        "columns": columns_list,
    }
