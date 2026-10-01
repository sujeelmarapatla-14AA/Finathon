"""
SpendIntel - Unified Datasets & History Management Router.

Exposes REST endpoints for:
- Listing historical analyses across all sources (CSV, EXCEL, NOVA_API, MANUAL).
- Retrieving dataset metadata, summary KPIs, and leakage metrics.
- Inspecting preserved raw input rows.
- Accessing persisted product comparison matrices.
- Deleting datasets.
- On-demand Nova API synchronization into persistent history.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

try:
    from app.services.dataset_service import (
        get_all_datasets,
        get_dataset_by_id,
        get_dataset_rows,
        get_dataset_comparisons,
        delete_dataset,
        process_and_persist_dataset_pipeline,
    )
    from app.services.nova_service import fetch_and_normalize_nova_procurement
except ImportError:
    from backend.app.services.dataset_service import (
        get_all_datasets,
        get_dataset_by_id,
        get_dataset_rows,
        get_dataset_comparisons,
        delete_dataset,
        process_and_persist_dataset_pipeline,
    )
    from backend.app.services.nova_service import fetch_and_normalize_nova_procurement

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get("")
@router.get("/")
def list_datasets(
    source_type: Optional[str] = Query(None, description="Filter by source type: ALL, CSV, EXCEL, NOVA_API, MANUAL"),
    limit: int = Query(100, ge=1, le=500, description="Max datasets to return"),
) -> Dict[str, Any]:
    """
    Retrieve all historical procurement datasets across all 3 data sources
    (CSV/Excel Uploads, Nova Live API, and Manual Entry).
    """
    try:
        datasets = get_all_datasets(limit=limit, source_type=source_type)
        return {
            "success": True,
            "count": len(datasets),
            "source_filter": source_type or "ALL",
            "datasets": datasets,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve historical datasets: {str(e)}",
        )


@router.get("/{dataset_id}")
def get_dataset_details(dataset_id: str) -> Dict[str, Any]:
    """
    Retrieve metadata, executive KPIs, and analysis summary for a specific dataset.
    """
    dataset = get_dataset_by_id(dataset_id)
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset with ID '{dataset_id}' not found.",
        )
    return {
        "success": True,
        "dataset": dataset,
    }


@router.get("/{dataset_id}/rows")
def get_raw_dataset_rows(
    dataset_id: str,
    limit: int = Query(200, ge=1, le=1000, description="Max rows to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
) -> Dict[str, Any]:
    """
    Retrieve preserved raw input records for a dataset to inspect original values.
    """
    dataset = get_dataset_by_id(dataset_id)
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset with ID '{dataset_id}' not found.",
        )

    rows = get_dataset_rows(dataset_id, limit=limit, offset=offset)
    return {
        "success": True,
        "dataset_id": dataset_id,
        "dataset_name": dataset.get("name"),
        "source_type": dataset.get("source_type"),
        "total_rows": dataset.get("total_rows", 0),
        "limit": limit,
        "offset": offset,
        "rows": rows,
    }


@router.get("/{dataset_id}/comparisons")
def get_dataset_comparison_matrix(dataset_id: str) -> Dict[str, Any]:
    """
    Retrieve stored product comparison matrix and similarity scores for a dataset.
    """
    dataset = get_dataset_by_id(dataset_id)
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset with ID '{dataset_id}' not found.",
        )

    comparisons = get_dataset_comparisons(dataset_id)
    return {
        "success": True,
        "dataset_id": dataset_id,
        "dataset_name": dataset.get("name"),
        "total_comparisons": len(comparisons),
        "comparisons": comparisons,
    }


@router.delete("/{dataset_id}")
def delete_historical_dataset(dataset_id: str) -> Dict[str, Any]:
    """
    Delete a dataset and its raw rows and comparison matrix from history.
    """
    success = delete_dataset(dataset_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset '{dataset_id}' not found or already deleted.",
        )
    return {
        "success": True,
        "message": f"Dataset '{dataset_id}' and all associated records deleted successfully.",
        "dataset_id": dataset_id,
    }


@router.post("/sync-nova")
def sync_nova_dataset() -> Dict[str, Any]:
    """
    Fetch live data from Nova Procurement API, normalize, run analysis,
    and persist as a unified NOVA_API dataset in SQLite history.
    """
    try:
        df = fetch_and_normalize_nova_procurement(force_refresh=True)
        if df.empty:
            raise ValueError("No records returned by Nova Procurement API.")

        dataset_id = "nova-live"
        dataset_record = process_and_persist_dataset_pipeline(
            dataset_id=dataset_id,
            name="Nova Live Procurement Cloud Sync",
            source_type="NOVA_API",
            raw_df=df,
            original_filename="nova_cloud_sync.json",
            file_type="api",
            source_reference="nova_cloud_rest_api",
            file_size=len(df) * 150,
        )

        return {
            "success": True,
            "message": "Live Nova procurement data synced and persisted to database.",
            "dataset": dataset_record,
        }
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to sync and persist Nova dataset: {str(e)}",
        )
