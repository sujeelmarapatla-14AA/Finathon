from pathlib import Path
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException

try:
    from app.services.analyzer import analyze_procurement
except ImportError:
    from backend.app.services.analyzer import analyze_procurement

router = APIRouter(tags=["findings"])

# Resolve upload storage directory: backend/app/data/uploads
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
SUPPORTED_EXTENSIONS = [".csv", ".xlsx", ".xls"]


@router.get("/api/findings/{file_id}")
@router.get("/findings/{file_id}")
def get_findings(file_id: str) -> Dict[str, Any]:
    """
    Retrieve all detected procurement spend leakage findings for an uploaded file.

    - Searches for {file_id}.csv, {file_id}.xlsx, or {file_id}.xls in backend/app/data/uploads/.
    - Returns HTTP 404 if no matching file exists.
    - Executes analyze_procurement() and aggregates all findings into a unified list.
    - Preserves detection types: PRICE_ANOMALY, POSSIBLE_DUPLICATE, SUPPLIER_FRAGMENTATION.
    - Returns JSON structure: {"count": <number>, "findings": [...]}.
    - Returns HTTP 400 if validation fails or columns are missing.
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
        result = analyze_procurement(target_file)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    combined_findings: List[Dict[str, Any]] = []

    # 1. Price anomalies
    for item in result.get("price_anomalies", []):
        finding = dict(item)
        finding["detection_type"] = "PRICE_ANOMALY"
        if finding.get("type") in [None, "", "Price Anomaly"]:
            finding["type"] = "PRICE_ANOMALY"
        combined_findings.append(finding)

    # 2. Duplicate transactions
    for item in result.get("duplicates", []):
        finding = dict(item)
        finding["detection_type"] = "POSSIBLE_DUPLICATE"
        if finding.get("type") in [None, "", "Duplicate Transaction"]:
            finding["type"] = "POSSIBLE_DUPLICATE"
        combined_findings.append(finding)

    # 3. Supplier fragmentation
    for item in result.get("fragmentation", []):
        finding = dict(item)
        finding["detection_type"] = "SUPPLIER_FRAGMENTATION"
        if finding.get("type") in [None, "", "Supplier Fragmentation"]:
            finding["type"] = "SUPPLIER_FRAGMENTATION"
        combined_findings.append(finding)

    return {
        "count": len(combined_findings),
        "findings": combined_findings,
    }
