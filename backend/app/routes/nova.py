"""
SpendIntel - Nova Live Procurement API Routes.

Exposes endpoints for retrieving normalized intelligence from the Nova Procurement REST API:
- GET /api/nova/procurement (Unified dashboard & analysis model)
- GET /api/nova/dashboard
- GET /api/nova/findings
- GET /api/nova/suppliers
- POST /api/nova/investigate/{transaction_id}
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Query, Body

try:
    from app.services.nova_service import (
        get_nova_dashboard,
        get_nova_findings,
        get_nova_suppliers,
        fetch_and_normalize_nova_procurement,
    )
    from app.routes.investigation import investigate_dataframe
except ImportError:
    from backend.app.services.nova_service import (
        get_nova_dashboard,
        get_nova_findings,
        get_nova_suppliers,
        fetch_and_normalize_nova_procurement,
    )
    from backend.app.routes.investigation import investigate_dataframe

router = APIRouter(prefix="/nova", tags=["nova"])


@router.get("/procurement")
@router.get("/dashboard")
def get_nova_procurement_dashboard(force_refresh: bool = Query(False, description="Force fresh fetch from Nova API")) -> Dict[str, Any]:
    """
    Retrieve unified executive spend leakage dashboard for live Nova procurement data.

    Flow:
    1. Fetches purchase orders, bills, vendors, contracts, and inventory from Nova REST API.
    2. Normalizes records into the canonical SpendIntel model.
    3. Feeds records through SpendIntel deterministic detection engines.
    4. Returns standardized dashboard shape with KPIs, leakage breakdown, priority findings, and summary.
    """
    try:
        return get_nova_dashboard(force_refresh=force_refresh)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"SpendIntel couldn't retrieve live procurement data: {str(e)}",
        )


@router.get("/findings")
def get_nova_procurement_findings(force_refresh: bool = Query(False, description="Force fresh fetch from Nova API")) -> Dict[str, Any]:
    """
    Retrieve all detected procurement leakage findings across live Nova procurement records.
    """
    try:
        return get_nova_findings(force_refresh=force_refresh)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"SpendIntel couldn't retrieve live procurement findings: {str(e)}",
        )


@router.get("/suppliers")
def get_nova_procurement_suppliers(force_refresh: bool = Query(False, description="Force fresh fetch from Nova API")) -> Dict[str, Any]:
    """
    Retrieve supplier intelligence metrics for all vendors active in Nova procurement records.
    """
    try:
        return get_nova_suppliers(force_refresh=force_refresh)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"SpendIntel couldn't retrieve live supplier intelligence: {str(e)}",
        )


@router.get("/product-intelligence")
def get_nova_product_intelligence(force_refresh: bool = Query(False, description="Force fresh fetch from Nova API")) -> Dict[str, Any]:
    """
    Retrieve product similarity & differentiation intelligence for live Nova procurement records.
    """
    try:
        try:
            from app.services.product_similarity import analyze_product_intelligence
        except ImportError:
            from backend.app.services.product_similarity import analyze_product_intelligence

        df = fetch_and_normalize_nova_procurement(force_refresh=force_refresh)
        product_intel = analyze_product_intelligence(df)
        return {
            "source": "nova",
            "source_label": "LIVE NOVA",
            "file_id": "nova",
            "summary_kpis": product_intel["summary_kpis"],
            "comparisons": product_intel["comparisons"],
            "findings": product_intel["findings"],
            "comparable_groups": product_intel["comparable_groups"],
        }
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"SpendIntel couldn't retrieve live Nova product intelligence: {str(e)}",
        )


@router.post("/investigate/{transaction_id}")
@router.get("/investigate/{transaction_id}")
def investigate_nova_procurement_transaction(
    transaction_id: str,
    finding_type: Optional[str] = Query(None, description="Explicit finding type to investigate"),
    payload: Optional[Dict[str, Any]] = Body(None, description="Optional request body"),
) -> Dict[str, Any]:
    """
    Execute deterministic forensic investigation and AI explanation for a transaction in live Nova data.
    """
    try:
        df = fetch_and_normalize_nova_procurement(force_refresh=False)
        return investigate_dataframe(df, transaction_id, finding_type=finding_type, payload=payload)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to investigate Nova transaction '{transaction_id}': {str(e)}",
        )
