"""
LeakGuard AI - Recovery Simulator Service.

Provides deterministic procurement recovery calculations comparing
current supplier pricing against alternative or negotiated rates.
"""

from typing import Dict


def calculate_recovery(
    current_price: float,
    alternative_price: float,
    quantity: int,
) -> Dict[str, float]:
    """
    Calculate procurement recovery and potential savings deterministically.

    Args:
        current_price: Current unit price (must be >= 0).
        alternative_price: Alternative or negotiated unit price (must be >= 0).
        quantity: Quantity/volume of items (must be > 0).

    Returns:
        Dict with rounded financial calculations:
        - current_cost: current_price * quantity
        - optimized_cost: alternative_price * quantity
        - potential_savings: max(current_cost - optimized_cost, 0)
        - savings_percent: (potential_savings / current_cost * 100) if current_cost > 0 else 0
    """
    if current_price < 0 or alternative_price < 0:
        raise ValueError("Prices must be greater than or equal to 0")
    if quantity <= 0:
        raise ValueError("Quantity must be greater than 0")

    current_cost = float(current_price * quantity)
    optimized_cost = float(alternative_price * quantity)
    potential_savings = max(current_cost - optimized_cost, 0.0)
    savings_percent = (
        (potential_savings / current_cost * 100.0)
        if current_cost > 0
        else 0.0
    )

    return {
        "current_cost": round(current_cost, 2),
        "optimized_cost": round(optimized_cost, 2),
        "potential_savings": round(potential_savings, 2),
        "savings_percent": round(savings_percent, 2),
    }
