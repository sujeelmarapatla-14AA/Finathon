"""
SpendIntel - Supplier and Product Normalization Service.

Provides deterministic normalization for suppliers and products to resolve:
- Leading and trailing whitespace
- Repeated internal whitespace
- Case differences (ALL CAPS, lowercase, mixed case)
- Safe punctuation differences
- Obvious formatting differences

Preserves:
- original_supplier & normalized_supplier
- original_product_name, normalized_product_name & product_id

Adheres strictly to the rule: Do NOT aggressively fuzzy-merge distinct entities.
"""

import re
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd

# Safe legal and corporate entity suffix patterns to standardize
LEGAL_SUFFIX_REPLACEMENTS = [
    (re.compile(r"\b(pvt\.?\s*ltd\.?|private\s+limited)\b", re.IGNORECASE), "Pvt Ltd"),
    (re.compile(r"\b(ltd\.?|limited)\b", re.IGNORECASE), "Ltd"),
    (re.compile(r"\b(inc\.?|incorporated)\b", re.IGNORECASE), "Inc"),
    (re.compile(r"\b(corp\.?|corporation)\b", re.IGNORECASE), "Corp"),
    (re.compile(r"\b(llc|l\.l\.c\.)\b", re.IGNORECASE), "LLC"),
    (re.compile(r"\b(co\.?|company)\b", re.IGNORECASE), "Co"),
]


def normalize_supplier(supplier_name: Optional[str]) -> Tuple[str, str]:
    """
    Deterministically normalize a supplier entity name while preserving the original.

    Transformations:
    1. Strip leading and trailing whitespace.
    2. Normalize multiple internal whitespaces, tabs, or newlines to a single space.
    3. Normalize punctuation variations (quotes, trailing periods, dashes).
    4. Canonicalize word casing so variations like:
       - "TechWorld Solutions"
       - " TECHWORLD SOLUTIONS "
       - "TechWorld  Solutions"
       resolve to the exact same canonical string: "Techworld Solutions".
    5. Standardize common legal suffix representations safely without merging distinct entities.

    Returns:
        Tuple of (original_supplier, normalized_supplier)
    """
    if supplier_name is None or pd.isna(supplier_name):
        return ("", "Unknown Supplier")

    original = str(supplier_name)
    stripped = original.strip()
    if not stripped:
        return ("", "Unknown Supplier")

    # Step 1: Normalize internal whitespace to single spaces
    cleaned = re.sub(r"\s+", " ", stripped)

    # Step 2: Strip leading/trailing punctuation noise
    cleaned = cleaned.strip(" -_.,'\"")

    # Step 3: Canonicalize word casing
    # Converting each token via .capitalize() guarantees identical canonical form
    # across uppercase, lowercase, and camelCase variants
    tokens = [t for t in cleaned.split(" ") if t]
    capitalized_tokens = []
    for token in tokens:
        # Preserve common acronyms of 2-3 characters (e.g., "ABC", "LED") if already uppercase
        if len(token) <= 4 and token.isupper() and token.isalpha():
            capitalized_tokens.append(token)
        else:
            capitalized_tokens.append(token.capitalize())

    canonical = " ".join(capitalized_tokens)

    # Step 4: Standardize safe punctuation in legal suffixes
    for pattern, replacement in LEGAL_SUFFIX_REPLACEMENTS:
        canonical = pattern.sub(replacement, canonical)

    canonical = re.sub(r"\s+", " ", canonical).strip(" -_.,'\"")
    if not canonical:
        canonical = stripped

    return (original, canonical)


def normalize_product(
    product_name: Optional[str],
    product_id: Optional[str] = None,
    category: Optional[str] = None,
) -> Dict[str, str]:
    """
    Deterministically normalize product information while preserving original values.

    Rules:
    1. Use product_id as the primary identity when available.
    2. Strip leading/trailing and repeated whitespace.
    3. Normalize case and standard formatting differences.
    4. Never merge distinct products that possess different product_id values.

    Returns:
        Dict containing:
        - original_product_name
        - normalized_product_name
        - product_id
        - category
    """
    raw_name = str(product_name) if product_name and pd.notna(product_name) else "Unknown Item"
    original_name = raw_name.strip()
    clean_id = str(product_id).strip().upper() if product_id and pd.notna(product_id) else ""

    # Normalize name: internal multiple spaces, strip quotes
    cleaned = re.sub(r"\s+", " ", original_name).strip(" -_.,'\"")
    tokens = [t for t in cleaned.split(" ") if t]
    capitalized_tokens = []
    for token in tokens:
        # Preserve acronyms like "A4", "LED", "RAM"
        if len(token) <= 4 and (token.isupper() or any(c.isdigit() for c in token)):
            capitalized_tokens.append(token.upper())
        else:
            capitalized_tokens.append(token.capitalize())

    clean_name = " ".join(capitalized_tokens)

    # Category fallback
    clean_category = str(category).strip().title() if category and pd.notna(category) else "General Procurement"

    return {
        "original_product_name": original_name,
        "normalized_product_name": clean_name,
        "product_id": clean_id,
        "category": clean_category,
    }


def normalize_procurement_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add normalized supplier and product columns to the procurement DataFrame
    without modifying or deleting the original columns.

    Added columns:
    - original_supplier
    - normalized_supplier
    - original_product_name
    - normalized_product_name
    - normalized_product_id
    """
    if df is None or df.empty:
        return df

    out = df.copy()

    # Determine supplier column
    supp_col = None
    for cand in ["supplier", "supplier_name", "vendor_name", "vendor"]:
        if cand in out.columns:
            supp_col = cand
            break

    # Determine product columns
    prod_name_col = None
    for cand in ["product_name", "product", "item_description", "description"]:
        if cand in out.columns:
            prod_name_col = cand
            break

    prod_id_col = None
    for cand in ["product_id", "sku", "item_code", "id"]:
        if cand in out.columns and cand != "transaction_id":
            prod_id_col = cand
            break

    # Apply supplier normalization
    if supp_col:
        out["original_supplier"] = out[supp_col].astype(str).str.strip()
        out["normalized_supplier"] = out[supp_col].apply(lambda s: normalize_supplier(s)[1])
    else:
        out["original_supplier"] = "Unknown"
        out["normalized_supplier"] = "Unknown"

    # Apply product normalization
    if prod_name_col:
        out["original_product_name"] = out[prod_name_col].astype(str).str.strip()
        out["normalized_product_name"] = out[prod_name_col].apply(
            lambda p: normalize_product(p)["normalized_product_name"]
        )
    else:
        out["original_product_name"] = "Unknown Product"
        out["normalized_product_name"] = "Unknown Product"

    if prod_id_col:
        out["normalized_product_id"] = out[prod_id_col].astype(str).str.strip().str.upper()
    else:
        out["normalized_product_id"] = out["normalized_product_name"]

    return out
