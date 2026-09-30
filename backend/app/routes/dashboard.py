"""
SpendIntel - Procurement Spend Leakage Dashboard Route.

Provides endpoints for retrieving high-level executive KPIs, categorized
leakage breakdown, top 5 priority findings, and comprehensive analytics.
"""

from pathlib import Path
from typing import Any, Dict, List
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

RISK_RANKING = {
    "HIGH": 0,
    "MEDIUM": 1,
    "LOW": 2,
}


def _get_financial_impact(finding: Dict[str, Any]) -> float:
    """Extract financial impact value for ranking findings."""
    if "potential_leakage" in finding and finding["potential_leakage"] is not None:
        return float(finding["potential_leakage"])
    if "amount" in finding and finding["amount"] is not None:
        return float(finding["amount"])
    return 0.0


@router.get("/api/dashboard/{file_id}")
@router.get("/dashboard/{file_id}")
def get_dashboard_analysis(file_id: str) -> Dict[str, Any]:
    """
    Retrieve procurement spend leakage dashboard analysis for an uploaded file.

    - Searches for {file_id}.csv, {file_id}.xlsx, or {file_id}.xls in backend/app/data/uploads/.
    - Returns HTTP 404 if no matching file exists.
    - Runs analyze_procurement() and returns metrics, findings, and summaries.
    - Computes dashboard KPIs, leakage breakdown (all supported categories), top 5 priority findings, and summary counts.
    - Preserves all original analysis fields.
    - Returns HTTP 400 if required columns are missing or file content is invalid.
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
        analysis_result = analyze_procurement(target_file)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    price_anomalies = analysis_result.get("price_anomalies", [])
    duplicates = analysis_result.get("duplicates", [])
    fragmentation = analysis_result.get("fragmentation", [])
    contract_findings = analysis_result.get("contract_findings", [])
    discount_findings = analysis_result.get("discount_findings", [])
    pattern_findings = analysis_result.get("pattern_findings", [])

    # 1. KPI Data
    kpis: Dict[str, Any] = {
        "total_spend": analysis_result.get("total_spend", 0.0),
        "potential_leakage": analysis_result.get("potential_leakage", 0.0),
        "leakage_rate": analysis_result.get("leakage_rate", 0.0),
        "transactions": analysis_result.get("transactions", 0),
        "suppliers": analysis_result.get("suppliers", 0),
        "products": analysis_result.get("products", 0),
    }

    # 2. Categorized Leakage Breakdown
    price_anomaly_amount = round(
        float(sum(item.get("potential_leakage", 0.0) for item in price_anomalies)), 2
    )
    missed_discount_amount = round(
        float(sum(item.get("potential_leakage", 0.0) for item in discount_findings)), 2
    )

    # Separate Contract Non-Compliance vs Off-Contract Purchases
    off_contract_items = [c for c in contract_findings if c.get("type") == "OFF_CONTRACT_PURCHASE"]
    off_contract_amount = round(
        float(sum(c.get("potential_leakage", 0.0) for c in off_contract_items)), 2
    )

    contract_non_comp_items = [c for c in contract_findings if c.get("type") != "OFF_CONTRACT_PURCHASE"]
    contract_non_comp_amount = round(
        float(sum(c.get("potential_leakage", 0.0) for c in contract_non_comp_items)), 2
    )

    fragmentation_amount = 0.0  # Do not invent unverified figures
    duplicate_amount = round(
        float(sum(item.get("amount", item.get("potential_leakage", 0.0)) for item in duplicates)), 2
    )
    pattern_amount = round(
        float(sum(item.get("potential_leakage", 0.0) for item in pattern_findings)), 2
    )

    leakage_breakdown: List[Dict[str, Any]] = [
        {
            "type": "PRICE_ANOMALY",
            "count": len(price_anomalies),
            "amount": price_anomaly_amount,
        },
        {
            "type": "MISSED_DISCOUNT",
            "count": len(discount_findings),
            "amount": missed_discount_amount,
        },
        {
            "type": "CONTRACT_NON_COMPLIANCE",
            "count": len(contract_non_comp_items),
            "amount": contract_non_comp_amount,
        },
        {
            "type": "OFF_CONTRACT_PURCHASE",
            "count": len(off_contract_items),
            "amount": off_contract_amount,
        },
        {
            "type": "SUPPLIER_FRAGMENTATION",
            "count": len(fragmentation),
            "amount": fragmentation_amount,
        },
        {
            "type": "POSSIBLE_DUPLICATE",
            "count": len(duplicates),
            "amount": duplicate_amount,
        },
        {
            "type": "UNUSUAL_PATTERN",
            "count": len(pattern_findings),
            "amount": pattern_amount,
        },
    ]

    # 3. Aggregate All Findings for Priority Ranking
    all_findings: List[Dict[str, Any]] = []

    for item in price_anomalies:
        f = dict(item)
        f["detection_type"] = "PRICE_ANOMALY"
        f["type"] = "PRICE_ANOMALY"
        all_findings.append(f)

    for item in discount_findings:
        f = dict(item)
        f["detection_type"] = "MISSED_DISCOUNT"
        f["type"] = "MISSED_DISCOUNT"
        all_findings.append(f)

    for item in contract_findings:
        f = dict(item)
        f["detection_type"] = "CONTRACT_NON_COMPLIANCE"
        f["type"] = item.get("type", "CONTRACT_NON_COMPLIANCE")
        all_findings.append(f)

    for item in duplicates:
        f = dict(item)
        f["detection_type"] = "POSSIBLE_DUPLICATE"
        f["type"] = "POSSIBLE_DUPLICATE"
        all_findings.append(f)

    for item in fragmentation:
        f = dict(item)
        f["detection_type"] = "SUPPLIER_FRAGMENTATION"
        f["type"] = "SUPPLIER_FRAGMENTATION"
        all_findings.append(f)

    for item in pattern_findings:
        f = dict(item)
        f["detection_type"] = "UNUSUAL_PATTERN"
        f["type"] = item.get("type", "UNUSUAL_PATTERN")
        all_findings.append(f)

    # Sort priority findings: HIGH before MEDIUM before LOW, then by financial impact descending
    all_findings.sort(
        key=lambda f: (
            RISK_RANKING.get(str(f.get("risk", "")).upper(), 99),
            -_get_financial_impact(f),
        )
    )
    priority_findings = all_findings[:5]

    # 4. Summary Counts
    total_findings_count = len(all_findings)
    high_risk_count = sum(
        1 for f in all_findings if str(f.get("risk", "")).upper() == "HIGH"
    )
    medium_risk_count = sum(
        1 for f in all_findings if str(f.get("risk", "")).upper() == "MEDIUM"
    )
    low_risk_count = sum(
        1 for f in all_findings if str(f.get("risk", "")).upper() == "LOW"
    )

    summary: Dict[str, int] = {
        "total_findings": total_findings_count,
        "high_risk_findings": high_risk_count,
        "medium_risk_findings": medium_risk_count,
        "low_risk_findings": low_risk_count,
    }

    # 5. Combined Response preserving all existing and new fields
    response: Dict[str, Any] = dict(analysis_result)
    is_demo = target_id == "cb8b20d5-2516-47a9-8646-317e9beee50b"
    is_manual = str(target_id).startswith("manual_")
    if is_demo:
        response["source"] = "demo"
        response["source_label"] = "DEMO DATASET"
    elif is_manual:
        response["source"] = "manual"
        response["source_label"] = "MANUAL DATA"
    else:
        response["source"] = "upload"
        response["source_label"] = "UPLOADED FILE"
    response["kpis"] = kpis
    response["leakage_breakdown"] = leakage_breakdown
    response["priority_findings"] = priority_findings
    response["summary"] = summary
    response["recent_findings"] = all_findings[:10]

    return response
