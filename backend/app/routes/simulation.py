"""
SpendIntel - Recovery Simulator Route.

Provides endpoints for running deterministic what-if recovery simulations comparing
current spend against alternative supplier pricing and projected demand.
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

try:
    from app.services.simulator import calculate_recovery
except ImportError:
    from backend.app.services.simulator import calculate_recovery

router = APIRouter(tags=["simulation"])


class SimulationRequest(BaseModel):
    """Request model for recovery calculation simulation."""

    current_price: float = Field(
        ...,
        ge=0,
        description="Current unit price (must be >= 0)",
    )
    alternative_price: float = Field(
        ...,
        ge=0,
        description="Alternative unit price (must be >= 0)",
    )
    quantity: int = Field(
        ...,
        gt=0,
        description="Volume/quantity of units (must be > 0)",
    )
    current_supplier: Optional[str] = Field(
        None,
        description="Optional current supplier name",
    )
    alternative_supplier: Optional[str] = Field(
        None,
        description="Optional alternative supplier name",
    )
    expected_demand: Optional[int] = Field(
        None,
        ge=0,
        description="Optional expected demand units",
    )


class SimulationResponse(BaseModel):
    """Response model for recovery calculation simulation."""

    current_cost: float
    optimized_cost: float
    potential_savings: float
    savings_percent: float
    current_supplier: Optional[str] = None
    alternative_supplier: Optional[str] = None
    projected_annual_savings: Optional[float] = None


@router.post("/api/simulate", response_model=SimulationResponse)
@router.post("/simulate", response_model=SimulationResponse)
def run_simulation(request: SimulationRequest) -> Dict[str, Any]:
    """
    Run recovery simulation comparing current vs alternative supplier pricing.

    - current_price: Current price per unit (>= 0)
    - alternative_price: Alternative price per unit (>= 0)
    - quantity: Quantity of items (> 0)
    - Optional supplier names and expected demand volume
    - Returns calculated current_cost, optimized_cost, potential_savings, and savings_percent.
    """
    try:
        base_result = calculate_recovery(
            current_price=request.current_price,
            alternative_price=request.alternative_price,
            quantity=request.quantity,
        )

        response: Dict[str, Any] = dict(base_result)
        response["current_supplier"] = request.current_supplier
        response["alternative_supplier"] = request.alternative_supplier

        if request.expected_demand is not None and request.expected_demand > 0:
            unit_diff = max(request.current_price - request.alternative_price, 0.0)
            response["projected_annual_savings"] = round(unit_diff * float(request.expected_demand), 2)
        else:
            response["projected_annual_savings"] = None

        return response
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=str(e),
        )
