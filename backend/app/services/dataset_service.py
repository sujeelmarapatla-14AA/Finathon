"""
SpendIntel - Unified Dataset & History Database Service.

Persists and manages all procurement datasets regardless of ingestion source:
1. CSV / EXCEL Uploads ("CSV" / "EXCEL")
2. Nova Live REST API ("NOVA_API")
3. Manually Entered Data ("MANUAL")

Architecture:
- Table `datasets`: Metadata, source type, row counts, and executive KPIs.
- Table `dataset_rows`: Complete raw JSON input records and structured fields.
- Table `dataset_comparisons`: Forensic product comparison pairs & similarity scores.
"""

from datetime import datetime, timezone
import json
import logging
from pathlib import Path
import sqlite3
from typing import Any, Dict, List, Optional, Tuple
import uuid
import pandas as pd

logger = logging.getLogger("spendintel.dataset_db")

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "datasets.db"


def get_db() -> sqlite3.Connection:
    """Create a thread-safe connection to the SQLite datasets database."""
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_dataset_db() -> None:
    """Initialize database tables for unified dataset persistence & history tracking."""
    conn = get_db()
    try:
        with conn:
            # 1. Unified Datasets Table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS datasets (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    source_type TEXT NOT NULL, -- 'CSV', 'EXCEL', 'NOVA_API', 'MANUAL'
                    original_filename TEXT,
                    file_type TEXT,
                    source_reference TEXT,
                    file_size INTEGER DEFAULT 0,
                    uploaded_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'completed',
                    total_rows INTEGER NOT NULL DEFAULT 0,
                    unique_products INTEGER NOT NULL DEFAULT 0,
                    total_comparisons INTEGER NOT NULL DEFAULT 0,
                    analysis_version TEXT NOT NULL DEFAULT 'v1.0',
                    total_spend REAL DEFAULT 0.0,
                    potential_leakage REAL DEFAULT 0.0,
                    leakage_rate REAL DEFAULT 0.0,
                    suppliers_count INTEGER DEFAULT 0,
                    summary_kpis TEXT
                );
            """)

            # 2. Raw Preserved Input Rows Table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS dataset_rows (
                    id TEXT PRIMARY KEY,
                    dataset_id TEXT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
                    row_number INTEGER NOT NULL,
                    raw_data TEXT NOT NULL,
                    product_name TEXT,
                    sku TEXT,
                    category TEXT,
                    brand TEXT,
                    model TEXT,
                    supplier TEXT,
                    price REAL,
                    quantity REAL,
                    normalized_product TEXT,
                    created_at TEXT NOT NULL
                );
            """)

            # 3. Product Comparisons Table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS dataset_comparisons (
                    id TEXT PRIMARY KEY,
                    dataset_id TEXT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
                    product_a_name TEXT NOT NULL,
                    product_b_name TEXT NOT NULL,
                    similarity_score REAL NOT NULL,
                    classification TEXT NOT NULL,
                    is_equal_price_different_spec INTEGER NOT NULL DEFAULT 0,
                    price_a REAL NOT NULL,
                    price_b REAL NOT NULL,
                    price_difference REAL NOT NULL,
                    procurement_case TEXT,
                    explanation TEXT,
                    matching_attributes TEXT,
                    different_attributes TEXT,
                    unavailable_attributes TEXT,
                    comparison_data TEXT
                );
            """)

            # Indexes for high-performance history querying
            conn.execute("CREATE INDEX IF NOT EXISTS idx_datasets_uploaded_at ON datasets(uploaded_at DESC);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_datasets_source_type ON datasets(source_type);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_dataset_rows_dataset_id ON dataset_rows(dataset_id);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_dataset_comps_dataset_id ON dataset_comparisons(dataset_id);")
    finally:
        conn.close()


def save_unified_dataset(
    dataset_id: str,
    name: str,
    source_type: str,
    original_filename: Optional[str] = None,
    file_type: Optional[str] = None,
    source_reference: Optional[str] = None,
    file_size: int = 0,
    total_rows: int = 0,
    unique_products: int = 0,
    total_comparisons: int = 0,
    total_spend: float = 0.0,
    potential_leakage: float = 0.0,
    leakage_rate: float = 0.0,
    suppliers_count: int = 0,
    summary_kpis: Optional[Dict[str, Any]] = None,
    raw_rows: Optional[List[Dict[str, Any]]] = None,
    comparisons: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Persist or update a unified dataset record along with its raw rows and comparison matrix.
    Validates source_type in ("CSV", "EXCEL", "NOVA_API", "MANUAL").
    """
    valid_source_types = {"CSV", "EXCEL", "NOVA_API", "MANUAL"}
    clean_source = source_type.upper().strip()
    if clean_source not in valid_source_types:
        if "NOVA" in clean_source or "API" in clean_source:
            clean_source = "NOVA_API"
        elif "MANUAL" in clean_source:
            clean_source = "MANUAL"
        elif "XLS" in clean_source or "EXCEL" in clean_source:
            clean_source = "EXCEL"
        else:
            clean_source = "CSV"

    now = datetime.now(timezone.utc).isoformat()
    conn = get_db()
    try:
        with conn:
            cur = conn.cursor()
            cur.execute("SELECT id, uploaded_at FROM datasets WHERE id = ?", (dataset_id,))
            existing = cur.fetchone()

            kpi_json = json.dumps(summary_kpis or {}, ensure_ascii=False)

            if existing:
                uploaded_at = existing["uploaded_at"]
                conn.execute("""
                    UPDATE datasets SET
                        name = ?,
                        source_type = ?,
                        original_filename = ?,
                        file_type = ?,
                        source_reference = ?,
                        file_size = ?,
                        updated_at = ?,
                        total_rows = ?,
                        unique_products = ?,
                        total_comparisons = ?,
                        total_spend = ?,
                        potential_leakage = ?,
                        leakage_rate = ?,
                        suppliers_count = ?,
                        summary_kpis = ?
                    WHERE id = ?
                """, (
                    name, clean_source, original_filename, file_type, source_reference,
                    file_size, now, total_rows, unique_products, total_comparisons,
                    total_spend, potential_leakage, leakage_rate, suppliers_count, kpi_json, dataset_id
                ))
            else:
                conn.execute("""
                    INSERT INTO datasets (
                        id, name, source_type, original_filename, file_type, source_reference,
                        file_size, uploaded_at, updated_at, status, total_rows, unique_products,
                        total_comparisons, analysis_version, total_spend, potential_leakage,
                        leakage_rate, suppliers_count, summary_kpis
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, 'v1.0', ?, ?, ?, ?, ?)
                """, (
                    dataset_id, name, clean_source, original_filename, file_type, source_reference,
                    file_size, now, now, total_rows, unique_products, total_comparisons,
                    total_spend, potential_leakage, leakage_rate, suppliers_count, kpi_json
                ))

            # Insert raw preserved rows if provided
            if raw_rows is not None:
                conn.execute("DELETE FROM dataset_rows WHERE dataset_id = ?", (dataset_id,))
                row_tuples = []
                for idx, r in enumerate(raw_rows):
                    row_id = str(uuid.uuid4())
                    raw_json = json.dumps(r, ensure_ascii=False, default=str)
                    p_name = r.get("product_name") or r.get("product") or r.get("item_name") or r.get("item") or ""
                    sku = r.get("product_id") or r.get("sku") or r.get("item_code") or ""
                    cat = r.get("category") or r.get("commodity") or ""
                    brand = r.get("brand") or r.get("manufacturer") or ""
                    model = r.get("model") or ""
                    supplier = r.get("supplier") or r.get("vendor") or ""
                    try:
                        price = float(r.get("unit_price") or r.get("price") or r.get("actual_unit_price") or 0.0)
                    except (ValueError, TypeError):
                        price = 0.0
                    try:
                        qty = float(r.get("quantity") or r.get("qty") or 1.0)
                    except (ValueError, TypeError):
                        qty = 1.0
                    norm_prod = r.get("normalized_product_name") or p_name

                    row_tuples.append((
                        row_id, dataset_id, idx + 1, raw_json, str(p_name), str(sku),
                        str(cat), str(brand), str(model), str(supplier), price, qty,
                        str(norm_prod), now
                    ))

                conn.executemany("""
                    INSERT INTO dataset_rows (
                        id, dataset_id, row_number, raw_data, product_name, sku,
                        category, brand, model, supplier, price, quantity,
                        normalized_product, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, row_tuples)

            # Insert comparisons if provided
            if comparisons is not None:
                conn.execute("DELETE FROM dataset_comparisons WHERE dataset_id = ?", (dataset_id,))
                comp_tuples = []
                for comp in comparisons:
                    comp_id = str(uuid.uuid4())
                    pa = comp.get("productA") or (comp.get("product_a") or {}).get("product_name") or "Product A"
                    pb = comp.get("productB") or (comp.get("product_b") or {}).get("product_name") or "Product B"
                    sim = float(comp.get("similarityScore") or comp.get("similarity_score") or 0.0)
                    cls = str(comp.get("comparability") or comp.get("classification") or "DIFFERENT_SPECS")
                    eq = 1 if (comp.get("equalPriceDifferentSpec") or comp.get("is_equal_price_different_spec")) else 0
                    p1 = float(comp.get("priceA") or comp.get("price_a") or 0.0)
                    p2 = float(comp.get("priceB") or comp.get("price_b") or 0.0)
                    pdiff = float(comp.get("priceDifference") or comp.get("price_difference") or abs(p1 - p2))
                    pcase = str(comp.get("procurement_case") or "")
                    exp = str(comp.get("explanation") or "")
                    matches = json.dumps(comp.get("matchingAttributes") or comp.get("matching_attributes") or [])
                    diffs = json.dumps(comp.get("differentAttributes") or comp.get("different_attributes") or [])
                    unavails = json.dumps(comp.get("unavailableAttributes") or comp.get("unavailable_attributes") or [])
                    full_data = json.dumps(comp, ensure_ascii=False)

                    comp_tuples.append((
                        comp_id, dataset_id, str(pa), str(pb), sim, cls, eq, p1, p2, pdiff,
                        pcase, exp, matches, diffs, unavails, full_data
                    ))

                conn.executemany("""
                    INSERT INTO dataset_comparisons (
                        id, dataset_id, product_a_name, product_b_name, similarity_score,
                        classification, is_equal_price_different_spec, price_a, price_b,
                        price_difference, procurement_case, explanation, matching_attributes,
                        different_attributes, unavailable_attributes, comparison_data
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, comp_tuples)

        logger.info(f"[DATASET DB] Successfully persisted dataset {dataset_id} ({name}) with {total_rows} rows.")
        return get_dataset_by_id(dataset_id) or {}
    finally:
        conn.close()


def process_and_persist_dataset_pipeline(
    dataset_id: str,
    name: str,
    source_type: str,
    raw_df: pd.DataFrame,
    raw_records_list: Optional[List[Dict[str, Any]]] = None,
    original_filename: Optional[str] = None,
    file_type: Optional[str] = None,
    source_reference: Optional[str] = None,
    file_size: int = 0,
) -> Dict[str, Any]:
    """
    Unified SpendIntel Processing Pipeline:
    1. Normalizes raw dataframe into canonical procurement model.
    2. Runs deterministic leakage & spend analysis.
    3. Runs deterministic product similarity & comparison engine.
    4. Preserves raw records and persists dataset, rows, and comparisons to SQLite.
    5. Returns unified metadata and KPIs.
    """
    try:
        from app.services.normalization import standardize_raw_procurement_dataframe
        from app.services.analyzer import analyze_procurement_dataframe
        from app.services.product_similarity import analyze_product_intelligence
    except ImportError:
        from backend.app.services.normalization import standardize_raw_procurement_dataframe
        from backend.app.services.analyzer import analyze_procurement_dataframe
        from backend.app.services.product_similarity import analyze_product_intelligence

    # Preserve exact raw input records
    if raw_records_list is None:
        raw_records = raw_df.to_dict(orient="records")
    else:
        raw_records = raw_records_list

    # Step 1: Normalize into canonical procurement DataFrame
    std_df = standardize_raw_procurement_dataframe(raw_df)

    # Step 2: Run Leakage & Spend Analysis
    analysis_res = analyze_procurement_dataframe(std_df)

    # Step 3: Run Product Similarity Analysis
    product_intel = analyze_product_intelligence(std_df)

    # Step 4: Extract summary metrics
    total_rows = len(raw_records)
    kpis = product_intel.get("summary_kpis", {})
    unique_prods = int(kpis.get("total_products", analysis_res.get("products", 0)))
    total_comps = int(kpis.get("total_comparisons", 0))

    total_spend = float(analysis_res.get("total_spend", 0.0))
    potential_leakage = float(analysis_res.get("potential_leakage", 0.0))
    leakage_rate = float(analysis_res.get("leakage_rate", 0.0))
    suppliers_count = int(analysis_res.get("suppliers", 0))

    # Step 5: Persist to unified database
    dataset_record = save_unified_dataset(
        dataset_id=dataset_id,
        name=name,
        source_type=source_type,
        original_filename=original_filename,
        file_type=file_type or ("csv" if source_type == "CSV" else ("xlsx" if source_type == "EXCEL" else "api")),
        source_reference=source_reference or ("uploaded_file" if source_type in ("CSV", "EXCEL") else ("manual_entry" if source_type == "MANUAL" else "nova_cloud_api")),
        file_size=file_size or (total_rows * 128),
        total_rows=total_rows,
        unique_products=unique_prods,
        total_comparisons=total_comps,
        total_spend=total_spend,
        potential_leakage=potential_leakage,
        leakage_rate=leakage_rate,
        suppliers_count=suppliers_count,
        summary_kpis=kpis,
        raw_rows=raw_records,
        comparisons=product_intel.get("comparisons", []),
    )

    return dataset_record


def get_all_datasets(limit: int = 100, source_type: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve all historical datasets ordered by most recent first."""
    conn = get_db()
    try:
        cur = conn.cursor()
        if source_type and source_type.upper() not in ("ALL", ""):
            cur.execute("""
                SELECT * FROM datasets
                WHERE source_type = ?
                ORDER BY uploaded_at DESC
                LIMIT ?
            """, (source_type.upper().strip(), limit))
        else:
            cur.execute("""
                SELECT * FROM datasets
                ORDER BY uploaded_at DESC
                LIMIT ?
            """, (limit,))

        rows = cur.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            if d.get("summary_kpis"):
                try:
                    d["summary_kpis"] = json.loads(d["summary_kpis"])
                except Exception:
                    pass
            result.append(d)
        return result
    finally:
        conn.close()


def get_dataset_by_id(dataset_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a single dataset record by UUID / identifier."""
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,))
        row = cur.fetchone()
        if not row:
            return None
        d = dict(row)
        if d.get("summary_kpis"):
            try:
                d["summary_kpis"] = json.loads(d["summary_kpis"])
            except Exception:
                pass
        return d
    finally:
        conn.close()


def get_dataset_rows(dataset_id: str, limit: int = 500, offset: int = 0) -> List[Dict[str, Any]]:
    """Retrieve preserved raw rows for a dataset with pagination."""
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM dataset_rows
            WHERE dataset_id = ?
            ORDER BY row_number ASC
            LIMIT ? OFFSET ?
        """, (dataset_id, limit, offset))
        rows = cur.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            if d.get("raw_data"):
                try:
                    d["raw_data"] = json.loads(d["raw_data"])
                except Exception:
                    pass
            result.append(d)
        return result
    finally:
        conn.close()


def get_dataset_comparisons(dataset_id: str) -> List[Dict[str, Any]]:
    """Retrieve stored product comparisons for a dataset."""
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM dataset_comparisons
            WHERE dataset_id = ?
            ORDER BY similarity_score DESC
        """, (dataset_id,))
        rows = cur.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            if d.get("comparison_data"):
                try:
                    full_c = json.loads(d["comparison_data"])
                    result.append(full_c)
                    continue
                except Exception:
                    pass
            result.append(d)
        return result
    finally:
        conn.close()


def delete_dataset(dataset_id: str) -> bool:
    """Delete a dataset and cascade its rows and comparisons."""
    conn = get_db()
    try:
        with conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))
            return cur.rowcount > 0
    finally:
        conn.close()


def seed_baseline_demo_dataset() -> None:
    """Ensure the baseline demo dataset is seeded into the database if not present."""
    demo_id = "cb8b20d5-2516-47a9-8646-317e9beee50b"
    existing = get_dataset_by_id(demo_id)
    if existing:
        return

    demo_csv = BASE_DIR / "data" / "uploads" / f"{demo_id}.csv"
    if not demo_csv.exists():
        return

    try:
        df = pd.read_csv(demo_csv)
        process_and_persist_dataset_pipeline(
            dataset_id=demo_id,
            name="SpendIntel Enterprise Baseline (40 Items)",
            source_type="CSV",
            raw_df=df,
            original_filename="spendintel_baseline_demo.csv",
            file_type="csv",
            source_reference="uploaded_file",
            file_size=int(demo_csv.stat().st_size),
        )
        logger.info("[DATASET DB] Baseline demo dataset seeded successfully.")
    except Exception as e:
        logger.warning(f"[DATASET DB] Could not seed demo dataset: {e}")
