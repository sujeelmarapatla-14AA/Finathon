# SpendIntel — Procurement Spend Leakage Intelligence Platform

> **SpendIntel** is an enterprise-grade procurement intelligence system designed to ingest historical purchasing data, benchmark prices, audit contractual compliance, eliminate fragmented supplier spend, and detect anomalous expenditure with 100% deterministic accuracy — augmented by verifiable AI forensic explanations and interactive recovery simulations.

---

## 1. The Problem: Hidden Enterprise Spend Leakage

Global enterprises lose between **2% and 8%** of total procurement expenditure annually to undetected leakage:
- **Price Creep & Benchmark Deviations:** Invoicing at rates above established market benchmarks or agreed rate cards.
- **Unclaimed Contract Rebates & Missed Discounts:** Negotiated volume tiers and prompt-settlement discounts not applied at invoicing.
- **Supplier Fragmentation:** Identical product lines procured across dozens of uncoordinated vendors at differing rates without volume leverage.
- **Duplicate Procurement Invoicing:** Redundant orders placed within overlapping windows for identical SKUs, quantities, and prices.
- **Unusual Purchasing Patterns:** Sudden spot-market supplier switching, volume spikes, and out-of-policy spot purchases.

Traditional ERP systems record transactions for accounting compliance but lack the automated forensic intelligence to continuously audit rate cards and flag leakage before disbursement.

---

## 2. The SpendIntel Solution

SpendIntel delivers an end-to-end deterministic audit pipeline paired with an editorial, Moneliq-inspired fintech dashboard:
- **Dual Entity Normalization:** Robust canonical grouping for suppliers and products that strips whitespace, legal suffixes, and punctuation variations while preserving original values for auditability.
- **Deterministic Math Engine:** Pure mathematical analysis for all financial metrics. AI is never allowed to calculate, estimate, or invent financial figures.
- **Forensic Evidence Traceability:** Every flagged transaction links directly to verified source fields, baseline prices, variance percentages, and contractual terms.
- **Zero Double-Counting Architecture:** Canonical transaction-level deduplication prevents identical spend loss from being aggregated multiple times across overlapping rules.
- **AI Investigation Layer:** Generates executive root-cause narratives and recommended vendor remediation notices strictly grounded in verified evidence.
- **Interactive Recovery Simulator:** Models what-if scenarios comparing current suppliers against alternative rate cards and future demand volumes.

---

## 3. High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                   INGESTION & DATA CONSOLIDATION                       │
│      CSV / XLSX / XLS Upload  ──► Schema Validation ──► Clean DF       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     ENTITY NORMALIZATION SERVICE                       │
│    Supplier Normalization (Title Case, Legal Suffix Stripping)         │
│    Product Normalization (SKU Resolution, Canonical Naming)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 DETERMINISTIC LEAKAGE AUDIT PIPELINE                   │
│                                                                        │
│  1. Price Benchmarking Engine (Actual vs Benchmark Baseline)           │
│  2. Duplicate Purchase Detection (SKU, Supplier, Qty, Price Matching)  │
│  3. Supplier Consolidation Engine (Multi-vendor Fragmentation)         │
│  4. Contract & Rebate Compliance (Missed Discounts, Rate Cards)        │
│  5. Statistical Pattern Engine (Price Spikes, Vendor Switch, Outliers) │
│  6. Canonical Deduplication Engine (Strictly Avoids Double-Counting)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│     AI EXPLANATION LAYER          │ │     EXECUTIVE DASHBOARD & UI      │
│  - Verified Deterministic Evidence│ │  - Executive KPI Cards & Trends   │
│  - Root Cause Forensics           │ │  - 6-Category Leakage Breakdown   │
│  - Vendor Remediation Actions     │ │  - Priority Findings (Risk Ranked)│
│  - Zero Invented Numbers          │ │  - Interactive Recovery Simulator │
└───────────────────────────────────┘ └───────────────────────────────────┘
```

---

## 4. Detection Modules

| Module | Finding Type | Description | Risk Criteria |
|---|---|---|---|
| **Price Benchmarking** | `PRICE_ANOMALY` | Invoiced unit price exceeds established benchmark by $\ge 5\%$. | High ($\ge 15\%$ or $\ge ₹50\text{k}$), Medium ($\ge 10\%$), Low ($\ge 5\%$) |
| **Negotiated Rebates** | `MISSED_DISCOUNT` | Contract volume rebate was negotiated but full list price was invoiced. | High ($\ge ₹100\text{k}$ or $\ge 10\%$), Medium ($\ge ₹25\text{k}$) |
| **Contract Compliance** | `CONTRACT_NON_COMPLIANCE` | Purchases deviating from active contracted rate cards. | High ($\ge ₹50\text{k}$ or $\ge 15\%$), Medium ($\ge 8\%$) |
| **Duplicate Auditing** | `POSSIBLE_DUPLICATE` | Identical SKU, vendor, volume, and unit price invoiced across transactions. | High ($\ge ₹100\text{k}$ or $\ge 3$ occurrences), Medium ($\ge ₹20\text{k}$) |
| **Supplier Consolidation** | `SUPPLIER_FRAGMENTATION` | Product volume split across $\ge 2$ vendors; computes vendor concentration. | High ($\ge 4$ vendors or spend $\ge ₹500\text{k}$), Medium ($\ge 3$ vendors) |
| **Unusual Patterns** | `PRICE_SPIKE` / `SUDDEN_SUPPLIER_CHANGE` | Unit price spiked $\ge 8\%$ over historical median or switched to high-cost vendor. | High ($\ge 15\%$ variance), Medium ($\ge 8\%$) |

---

## 5. Leakage Formulas & Deduplication

### A. Price Anomaly Leakage
$$\text{Variance \%} = \frac{\text{Actual Unit Price} - \text{Benchmark Unit Price}}{\text{Benchmark Unit Price}} \times 100$$
$$\text{Price Leakage} = \max(\text{Actual Unit Price} - \text{Benchmark Unit Price}, 0) \times \text{Quantity}$$

### B. Missed Contract Discount Leakage
$$\text{Expected Unit Price} = \text{Actual Unit Price} \times (1 - \text{Contract Discount Rate})$$
$$\text{Discount Leakage} = (\text{Actual Unit Price} \times \text{Contract Discount Rate}) \times \text{Quantity}$$

### C. Avoid Double-Counting Rule
A single transaction can trigger multiple flags (e.g., both a Price Anomaly and an Unusual Price Spike). SpendIntel guarantees financial integrity by calculating the **canonical leakage per transaction**:
$$\text{Canonical Leakage}(T) = \max\Big(\text{Leakage}_{\text{Price}}(T),\, \text{Leakage}_{\text{Discount}}(T),\, \text{Leakage}_{\text{Pattern}}(T)\Big)$$
$$\text{Total Deduplicated Leakage} = \sum_{T \in \text{Transactions}} \text{Canonical Leakage}(T) + \sum_{D \in \text{Duplicates}} \text{Redundant Order Spend}(D)$$

---

## 6. Core REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Root system status and platform metadata |
| `GET` | `/health` | Health check endpoint |
| `POST` | `/api/upload` | Upload `.csv`, `.xlsx`, or `.xls` dataset with schema validation |
| `GET` | `/api/dashboard/{file_id}` | Retrieve executive KPIs, 6-category breakdown, and top 5 priority findings |
| `GET` | `/api/findings/{file_id}` | Retrieve all standardized findings across all 6 detection modules |
| `GET` | `/api/suppliers/{file_id}` | Supplier intelligence (normalized entity, spend, leakage, anomaly count) |
| `POST` | `/api/investigate/{file_id}/{tx_id}` | Deep forensic investigation with traceable field evidence and AI analysis |
| `POST` | `/api/simulate` | Deterministic recovery simulation for what-if supplier price renegotiations |

---

## 7. Procurement Dataset Format

SpendIntel requires the following core tabular fields (CSV or Excel):

| Column Header | Type | Description | Example |
|---|---|---|---|
| `transaction_id` | String | Unique purchase order or transaction reference | `TX10001` |
| `product_id` | String | Unique SKU or commodity code | `P001` |
| `product_name` | String | Item description | `Industrial Laptop` |
| `supplier` | String | Invoicing vendor name | `TechWorld Solutions` |
| `quantity` | Numeric | Units purchased | `20` |
| `unit_price` | Numeric | Actual invoiced unit rate | `52500` |
| `benchmark_unit_price` | Numeric | Contracted rate baseline or target benchmark | `47500` |
| `contract_discount` | Numeric (Opt) | Contractual volume rebate rate | `0.10` (10%) |
| `department` | String (Opt) | Requisitioning department | `IT` |
| `payment_terms` | String (Opt) | Agreed commercial credit terms | `NET30` |

---

## 8. Demo Walkthrough Flow

1. **Launch SpendIntel Dashboard:** Open `http://localhost:5173/` in your browser.
2. **Review Executive KPIs:** Total Spend (₹1.61 Cr), Deduplicated Leakage (₹39.59 L), Leakage Rate (24.47%), Transactions (40), Suppliers (16).
3. **Inspect Leakage Breakdown:** View 6 categorized buckets: Price Anomalies (14), Missed Discounts (2), Duplicates (8), Supplier Fragmentation (5), and Unusual Patterns (14).
4. **Forensic Deep-Dive on Missed Discount:** Navigate to **Leakage Explorer** or **AI Investigation** and select transaction **TX10030** (FastenCo). Observe the verified 10% volume rebate missing on invoice, resulting in ₹1,45,000 recoverable leakage.
5. **Analyze Supplier Consolidation:** Open **Supplier Intelligence** to see multi-vendor fragmentation on Industrial Laptops (P001) split between TechWorld Solutions and Dell Enterprise Partner.
6. **Execute Recovery Simulation:** Launch **Recovery Simulator** on Industrial Laptops to simulate switching volume to ₹47,500 benchmark rate, yielding ₹1,00,000 in immediate savings and ₹5,00,000 in annual projected recovery.

---

## 9. How to Run the Backend

```bash
# 1. Navigate to backend directory
cd backend

# 2. Activate Python virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.

---

## 10. How to Run the Frontend

```bash
# 1. In project root:
npm install

# 2. Start Vite development server
npm run dev

# 3. Build production bundle (verified 0 TypeScript errors)
npm run build
```

The frontend application runs at `http://localhost:5173/`.

---

## 11. AI Configuration

SpendIntel features an isolated AI explanation service (`backend/app/services/ai_investigator.py`). All mathematical and forensic figures are pre-calculated deterministically before the AI is invoked.

Configure your API key in `backend/.env`:
```env
AI_PROVIDER=gemini       # Options: gemini or openrouter
AI_API_KEY=your_key_here
AI_MODEL=gemini-2.0-flash
```

> **Note:** If no AI key is provided, the system gracefully delivers comprehensive, deterministic analyst summaries, root cause deductions, and recommended remediation notices without any degradation in functionality.

---

## 12. Production Integration Path

The current prototype ingests procurement data via CSV and Excel uploads. In an enterprise production deployment, SpendIntel integrates directly with core enterprise systems without modifying the analysis engines:

- **Enterprise ERP Connectors:** Real-time webhook or ETL connectors to SAP S/4HANA, Oracle Fusion Cloud, Workday, and Microsoft Dynamics 365.
- **Enterprise Data Warehouses:** Direct read pipelines via Snowflake, Google BigQuery, Databricks Delta Lake, or Amazon Redshift.
- **Procure-to-Pay (P2P) Suites:** Bi-directional sync with Coupa, SAP Ariba, and Ivalua for pre-payment invoice holds.
- **Audit Logging & Security:** Role-based access control (RBAC), end-to-end data encryption, and tamper-evident audit trails for financial compliance.
