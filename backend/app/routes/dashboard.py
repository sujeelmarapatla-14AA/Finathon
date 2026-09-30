from pathlib import Path
from typing import Any, Dict
from fastapi import APIRouter, HTTPException

try:
    from app.services.analyzer import analyze_procurement
except ImportError:
    from backend.app.services.analyzer import analyze_procurement

router = APIRouter(tags=["dashboard"])

# Resolve upload storage directory: backend/app/data/uploads
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
SUPPORTED_EXTENSIONS = [".csv", ".xlsx", ".xls"]


@router.get("/api/dashboard/{file_id}")
@router.get("/dashboard/{file_id}")
def get_dashboard_analysis(file_id: str) -> Dict[str, Any]:
    """
    Retrieve procurement spend leakage dashboard analysis for an uploaded file.

    - Searches for {file_id}.csv, {file_id}.xlsx, or {file_id}.xls in backend/app/data/uploads/.
    - Returns HTTP 404 if no matching file exists.
    - Runs analyze_procurement() and returns metrics, findings, and summaries.
    - Returns HTTP 400 if required columns are missing or file content is invalid.
    """
    target_file = None
    for ext in SUPPORTED_EXTENSIONS:
        candidate = UPLOAD_DIR / f"{file_id}{ext}"
        if candidate.exists() and candidate.is_file():
            target_file = candidate
            break

    if not target_file:
        raise HTTPException(
            status_code=404,
            detail="File not found",
        )

    try:
        analysis_result = analyze_procurement(target_file)
        return analysis_result
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )
