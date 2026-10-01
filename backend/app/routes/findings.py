"""
SpendIntel - Procurement Spend Leakage Findings API Route.

Returns unified, categorized findings across all audit modules:
- PRICE_ANOMALY
- POSSIBLE_DUPLICATE
- SUPPLIER_FRAGMENTATION
- MISSED_DISCOUNT
- CONTRACT_NON_COMPLIANCE
- OFF_CONTRACT_PURCHASE
- PRICE_SPIKE / UNUSUAL_PRICE_PATTERN
- SUDDEN_SUPPLIER_CHANGE
- UNUSUAL_QUANTITY
"""

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


def _standardize_finding(raw: Dict[str, Any], default_type: str) -> Dict[str, Any]:
    """Ensure a consistent finding schema across all detection categories."""
    finding_type = raw.get("type") or raw.get("detection_type") or default_type
    tx_id = str(raw.get("transaction_id", "")).strip()
    pid = str(raw.get("product_id", "")).strip()

    # Generate stable unique ID if not provided
    fid = raw.get("id")
    if not fid:
        if tx_id:
            fid = f"{finding_type[:4]}-{tx_id}"
        elif pid:
            fid = f"{finding_type[:4]}-{pid}"
        else:
            fid = f"{finding_type[:4]}-AUTO"

    actual = raw.get("actual_price", raw.get("unit_price"))
    bench = raw.get("benchmark_price")
    expected = raw.get("expected_price", bench)
    leakage = raw.get("potential_leakage", raw.get("amount", 0.0))
    variance = raw.get("variance_percent", raw.get("variance", 0.0))

    item: Dict[str, Any] = {
        "id": str(fid),
        "type": str(finding_type),
        "detection_type": raw.get("detection_type", str(finding_type)),
        "risk": str(raw.get("risk", "MEDIUM")).upper(),
        "transaction_id": tx_id,
        "product_id": pid,
        "product": str(raw.get("product", raw.get("product_name", f"{raw.get('product_a', '')} vs {raw.get('product_b', '')}".strip(" vs ")))),
        "supplier": str(raw.get("supplier", "")),
        "quantity": raw.get("quantity"),
        "actual_price": round(float(actual), 2) if actual is not None else None,
        "benchmark_price": round(float(bench), 2) if bench is not None else None,
        "expected_price": round(float(expected), 2) if expected is not None else None,
        "variance_percent": round(float(variance), 2) if variance is not None else 0.0,
        "potential_leakage": round(float(leakage), 2) if leakage is not None else 0.0,
        "reason": raw.get("reason", raw.get("explanation", f"{finding_type} detected during procurement audit")),
        "evidence": raw.get("evidence", []),
        "similarity_score": raw.get("similarity_score"),
        "comparability": raw.get("comparability"),
        "product_a": raw.get("product_a"),
        "product_b": raw.get("product_b"),
        "price_a": raw.get("price_a"),
        "price_b": raw.get("price_b"),
        "matching_attributes": raw.get("matching_attributes"),
        "different_attributes": raw.get("different_attributes"),
        "explanation": raw.get("explanation"),
        "confidence": raw.get("confidence"),
    }

    # Clean None values in evidence if string
    if isinstance(item["evidence"], str):
        item["evidence"] = [item["evidence"]]

    return item


@router.get("/api/findings/{file_id}")
@router.get("/findings/{file_id}")
def get_findings(file_id: str) -> Dict[str, Any]:
    """
    Retrieve all detected procurement spend leakage findings for an uploaded file.

    - Searches for {file_id}.csv, {file_id}.xlsx, or {file_id}.xls in backend/app/data/uploads/.
    - Returns HTTP 404 if no matching file exists.
    - Executes analyze_procurement() and aggregates all findings into a unified list.
    - Standardizes schema across all categories.
    - Returns JSON structure: {"count": <number>, "findings": [...]}.
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
        result = analyze_procurement(target_file)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    combined_findings: List[Dict[str, Any]] = []

    # 1. Price anomalies
    for item in result.get("price_anomalies", []):
        combined_findings.append(_standardize_finding(item, "PRICE_ANOMALY"))

    # 2. Missed discounts
    for item in result.get("discount_findings", []):
        combined_findings.append(_standardize_finding(item, "MISSED_DISCOUNT"))

    # 3. Contract compliance
    for item in result.get("contract_findings", []):
        combined_findings.append(_standardize_finding(item, "CONTRACT_NON_COMPLIANCE"))

    # 4. Duplicate transactions
    for item in result.get("duplicates", []):
        combined_findings.append(_standardize_finding(item, "POSSIBLE_DUPLICATE"))

    # 5. Supplier fragmentation
    for item in result.get("fragmentation", []):
        combined_findings.append(_standardize_finding(item, "SUPPLIER_FRAGMENTATION"))

    # 6. Unusual procurement patterns
    for item in result.get("pattern_findings", []):
        combined_findings.append(_standardize_finding(item, "UNUSUAL_PATTERN"))

    # 7. Product similarity & differentiation findings
    for item in result.get("product_similarity_findings", []):
        combined_findings.append(_standardize_finding(item, item.get("type", "PRODUCT_SIMILARITY")))

    is_demo = target_id == "cb8b20d5-2516-47a9-8646-317e9beee50b"
    is_manual = str(target_id).startswith("manual_")
    return {
        "source": "demo" if is_demo else ("manual" if is_manual else "upload"),
        "count": len(combined_findings),
        "findings": combined_findings,
    }
