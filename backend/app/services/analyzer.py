import os
from typing import Any, Dict, List, Union
import pandas as pd

# Support multiple import contexts (root, package, or relative)
try:
    from backend.app.services.leakage import (
        detect_price_anomalies,
        detect_duplicates,
        detect_supplier_fragmentation,
    )
except ImportError:
    try:
        from app.services.leakage import (
            detect_price_anomalies,
            detect_duplicates,
            detect_supplier_fragmentation,
        )
    except ImportError:
        from .leakage import (
            detect_price_anomalies,
            detect_duplicates,
            detect_supplier_fragmentation,
        )

REQUIRED_COLUMNS: List[str] = [
    "transaction_id",
    "product_id",
    "product_name",
    "supplier",
    "quantity",
    "unit_price",
    "benchmark_unit_price",
]


def analyze_procurement(filepath: Union[str, os.PathLike]) -> Dict[str, Any]:
    """
    Analyze procurement transaction data from a CSV or Excel file.

    1. Reads CSV (.csv) or Excel (.xlsx, .xls) file into a pandas DataFrame.
    2. Strips whitespace from column names.
    3. Validates required columns:
       - transaction_id
       - product_id
       - product_name
       - supplier
       - quantity
       - unit_price
       - benchmark_unit_price
       Raises a ValueError identifying missing columns if validation fails.
    4. Safely converts numeric columns (quantity, unit_price, benchmark_unit_price)
       with invalid values coerced to 0.
    5. Runs all three leakage detection engines:
       - detect_price_anomalies
       - detect_duplicates
       - detect_supplier_fragmentation
    6. Calculates total_spend, total_price_leakage, and leakage_rate
       with division-by-zero protection.
    7. Returns a JSON-serializable dictionary with summary metrics and findings.
    """
    filepath_str = str(filepath)
    lower_path = filepath_str.lower()

    # Read data file based on extension
    if lower_path.endswith((".xlsx", ".xls")):
        df = pd.read_excel(filepath)
    else:
        df = pd.read_csv(filepath)

    # Strip whitespace from column names
    df.columns = df.columns.astype(str).str.strip()

    # Validate required columns
    missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_columns:
        raise ValueError(
            f"Missing required columns: {', '.join(missing_columns)}. "
            f"Expected columns: {', '.join(REQUIRED_COLUMNS)}."
        )

    # Convert numeric columns safely, setting invalid values to 0
    numeric_columns = ["quantity", "unit_price", "benchmark_unit_price"]
    for col in numeric_columns:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    # Run detection engines
    price_anomalies = detect_price_anomalies(df)
    duplicates = detect_duplicates(df)
    fragmentation = detect_supplier_fragmentation(df)

    # Calculate financial aggregations
    total_spend = float((df["quantity"] * df["unit_price"]).sum())
    total_price_leakage = float(
        sum(item.get("potential_leakage", 0.0) for item in price_anomalies)
    )

    # Protect against division by zero
    if total_spend > 0:
        leakage_rate = float((total_price_leakage / total_spend) * 100.0)
    else:
        leakage_rate = 0.0

    # Counts
    transactions_count = int(len(df))
    suppliers_count = int(df["supplier"].nunique())
    products_count = int(df["product_id"].nunique())

    return {
        "transactions": transactions_count,
        "total_spend": round(total_spend, 2),
        "potential_leakage": round(total_price_leakage, 2),
        "leakage_rate": round(leakage_rate, 2),
        "price_anomalies": price_anomalies,
        "duplicates": duplicates,
        "fragmentation": fragmentation,
        "suppliers": suppliers_count,
        "products": products_count,
    }
