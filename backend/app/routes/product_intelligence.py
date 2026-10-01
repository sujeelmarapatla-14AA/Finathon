"""
SpendIntel - Product Similarity & Differentiation Intelligence Router.

Provides endpoints for:
- Retrieving dataset-wide product similarity clusters, comparison matrix, and findings.
- On-demand pairwise product comparison and multi-factor similarity scoring.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import pandas as pd

try:
    from app.services.analyzer import analyze_procurement
    from app.services.product_similarity import (
        compute_product_similarity,
        extract_product_attributes,
        analyze_product_intelligence,
    )
except ImportError:
    from backend.app.services.analyzer import analyze_procurement
    from backend.app.services.product_similarity import (
        compute_product_similarity,
        extract_product_attributes,
        analyze_product_intelligence,
    )

router = APIRouter(tags=["product-intelligence"])

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
SUPPORTED_EXTENSIONS = [".csv", ".xlsx", ".xls"]


class PairwiseComparisonRequest(BaseModel):
    product_a: Dict[str, Any]
    product_b: Dict[str, Any]
    custom_weights: Optional[Dict[str, float]] = None


@router.get("/api/product-intelligence/{file_id}")
@router.get("/product-intelligence/{file_id}")
def get_product_intelligence(file_id: str) -> Dict[str, Any]:
    """
    Retrieve product similarity matrix, summary KPIs, equal-price detections,
    and comparability clusters for the given dataset (Demo, Upload, Manual, or Live Nova).
    """
    clean_id = str(file_id).strip().lower()

    if clean_id in ["nova", "live_nova", "live-nova"]:
        try:
            try:
                from app.services.nova_service import fetch_and_normalize_nova_procurement
            except ImportError:
                from backend.app.services.nova_service import fetch_and_normalize_nova_procurement
            
            df = fetch_and_normalize_nova_procurement(force_refresh=False)
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
            raise HTTPException(status_code=502, detail=f"Failed to analyze live Nova product intelligence: {str(e)}")

    target_id = "cb8b20d5-2516-47a9-8646-317e9beee50b" if clean_id == "demo" else file_id
    target_file = None
    for ext in SUPPORTED_EXTENSIONS:
        candidate = UPLOAD_DIR / f"{target_id}{ext}"
        if candidate.exists() and candidate.is_file():
            target_file = candidate
            break

    if not target_file:
        raise HTTPException(
            status_code=404,
            detail=f"Procurement dataset '{file_id}' not found.",
        )

    try:
        lower_path = str(target_file).lower()
        if lower_path.endswith((".xlsx", ".xls")):
            df = pd.read_excel(target_file)
        else:
            df = pd.read_csv(target_file)
        
        product_intel = analyze_product_intelligence(df)
        is_demo = target_id == "cb8b20d5-2516-47a9-8646-317e9beee50b"
        is_manual = str(target_id).startswith("manual_")
        return {
            "source": "demo" if is_demo else ("manual" if is_manual else "upload"),
            "source_label": "DEMO DATASET" if is_demo else ("MANUAL DATA" if is_manual else "UPLOADED FILE"),
            "file_id": file_id,
            "summary_kpis": product_intel["summary_kpis"],
            "comparisons": product_intel["comparisons"],
            "findings": product_intel["findings"],
            "comparable_groups": product_intel["comparable_groups"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze product intelligence: {str(e)}")


@router.post("/api/product-similarity/compare")
@router.post("/product-similarity/compare")
def compare_products_endpoint(payload: PairwiseComparisonRequest) -> Dict[str, Any]:
    """
    Execute real-time multi-factor product similarity comparison between two items.
    """
    try:
        attrs_a = extract_product_attributes(payload.product_a)
        attrs_b = extract_product_attributes(payload.product_b)
        res = compute_product_similarity(attrs_a, attrs_b, payload.custom_weights)
        return {
            "product_a": attrs_a,
            "product_b": attrs_b,
            "comparison": res,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to compare products: {str(e)}")
