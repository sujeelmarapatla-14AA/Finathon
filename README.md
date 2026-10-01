# SpendIntel — Enterprise Procurement Spend Leakage & Product Intelligence Platform

[![Live Demo](https://img.shields.io/badge/Live_Deployment-Render-blue?style=for-the-badge&logo=render)](https://finathon-1.onrender.com)
[![FastAPI Backend](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi)](https://finathon-1.onrender.com/docs)
[![React + TypeScript](https://img.shields.io/badge/React_19-TypeScript-61DAFB?style=for-the-badge&logo=react)](https://finathon-1.onrender.com)
[![Deterministic Engine](https://img.shields.io/badge/Math_Engine-100%25_Deterministic-gold?style=for-the-badge)](https://finathon-1.onrender.com)

> **Live Application URL:** [https://finathon-1.onrender.com](https://finathon-1.onrender.com)  
> **Interactive API Swagger Docs:** [https://finathon-1.onrender.com/docs](https://finathon-1.onrender.com/docs)

---

## 1. Executive Summary

**SpendIntel** is an enterprise-grade procurement intelligence system built to ingest purchasing data across multiple channels, normalize supplier and product entities, benchmark unit costs, audit contractual compliance, eliminate fragmented vendor spend, and detect anomalous expenditure with **100% deterministic mathematical accuracy** — augmented by verifiable AI forensic explanations and interactive financial recovery simulations.

Global enterprises lose between **2% and 8%** of total procurement expenditure annually due to hidden leakage:
- **Price Creep & Benchmark Deviations:** Invoicing at rates above established market benchmarks or agreed rate cards.
- **Unclaimed Contract Rebates & Missed Discounts:** Negotiated volume tiers and prompt-settlement discounts not applied at invoicing.
- **Supplier Fragmentation:** Identical product lines procured across dozens of uncoordinated vendors at differing rates without volume leverage.
- **Duplicate Procurement Invoicing:** Redundant orders placed within overlapping windows for identical SKUs, quantities, and prices.
- **Unusual Purchasing Patterns:** Sudden spot-market supplier switching, volume spikes, and out-of-policy spot purchases.
- **Product Spec Mismatches:** Purchasing lower-grade or stripped-down variants at the exact same price as premium-grade products.

---

## 2. Core Capabilities & Architecture

```
                                  ┌─────────────────────────────────────────────────────────┐
                                  │                THREE DATA INGESTION CHANNELS            │
                                  │  1. CSV / Excel Uploads   2. Nova API   3. Manual Entry │
                                  └────────────────────────────┬────────────────────────────┘
                                                               │
                                                               ▼
                                              ┌──────────────────────────────────┐
                                              │      Data Normalization Layer    │
                                              │  • Entity canonical grouping     │
                                              │  • Suffix & punctuation stripping│
                                              │  • Raw input preservation (JSON) │
                                              └────────────────┬─────────────────┘
                                                               │
                                                               ▼
                                ┌──────────────────────────────────────────────────────────────┐
                                │              DETERMINISTIC ANALYSIS ENGINES                  │
                                ├──────────────────────────────┬───────────────────────────────┤
                                │ Product Similarity Engine    │ Spend Leakage Analyzer        │
                                │ • Spec attribute extraction  │ • Price anomaly detection     │
                                │ • Multi-factor similarity    │ • Missed rebate audits        │
                                │ • Equal price / diff value   │ • Contract non-compliance     │
                                │ • Comparable group clusters  │ • Duplicate order detection   │
                                └──────────────────────────────┴───────────────────────────────┘
                                                               │
                                                               ▼
                                              ┌──────────────────────────────────┐
                                              │      Unified SQLite Database     │
                                              │  • datasets (Metadata & KPIs)    │
                                              │  • dataset_rows (Complete JSON)  │
                                              │  • dataset_comparisons (Matrix)  │
                                              └────────────────┬─────────────────┘
                                                               │
                                ┌──────────────────────────────┴───────────────────────────────┐
                                ▼                                                              ▼
               ┌──────────────────────────────────┐                           ┌──────────────────────────────────┐
               │    AI Forensic Investigation     │                           │     Executive UI Dashboard       │
               │ • Verifiable evidence points     │                           │ • High-level KPIs & leakage rate │
               │ • Root-cause determination       │                           │ • Multi-chart analytics suite    │
               │ • Vendor remediation notices     │                           │ • Product Intelligence matrix    │
               │ • Zero financial hallucinations  │                           │ • Recovery scenario simulator    │
               └──────────────────────────────────┘                           └──────────────────────────────────┘
```

---

## 3. Key Feature Modules

### A. Unified Ingestion & Dataset History
Every analysis is persisted in the unified SQLite database (`datasets`, `dataset_rows`, `dataset_comparisons`) regardless of where the data originated:
1. **CSV & Excel Uploads:** Drag-and-drop or file selection for `.csv`, `.xlsx`, and `.xls` files.
2. **Nova Live REST API:** Real-time sync with Nova Procurement Cloud, normalizing live Purchase Orders, Items, Contracts, and Vendors.
3. **Manual Entry:** Direct web form entry for ad-hoc transaction batches, immediately processed through the same pipeline.
- **Complete Raw Input Audit:** Table `dataset_rows` preserves the exact original JSON input dictionary for every row to enable reproducibility and retrospective audit.

### B. Product Similarity & Differentiation Engine
- **Attribute Extraction:** Parses brand, model, specifications (RAM, Storage, Screen Size, Processor, Material, Dimensions, Pack Size, Quality Grade) from raw descriptions.
- **Multi-Factor Similarity:** Evaluates Category (25%), Specifications (30%), Brand/Model (20%), Description (15%), and Quality/Packaging (10%).
- **Equal-Price / Different-Specification Detections:** Identifies scenarios where two items have identical prices ($\pm 5\%$) but significantly different specifications (e.g., paying ₹52,000 for 8GB RAM when another vendor offers 16GB RAM at the same price).
- **Comparable Groups:** Automatically clusters items into high-comparability clusters to identify vendor consolidation opportunities.

### C. Deterministic Spend Leakage Analyzer
- **Price Benchmarking:** Flags purchases exceeding baseline market or negotiated rates by $\ge 5\%$.
- **Missed Discounts:** Detects unapplied prompt-pay discounts or contractual volume rebates.
- **Contract Compliance:** Catches rogue, off-contract purchases and off-catalog ordering.
- **Duplicate Purchases:** Audits redundant orders across overlapping time windows.
- **Supplier Fragmentation:** Quantifies spend dilution when identical commodities are split across multiple vendors.
- **Zero Double-Counting:** Employs canonical transaction deduplication so overlapping flags are never aggregated multiple times.

### D. AI Forensic Investigation
- **Evidence-Grounded Explanations:** Explains why a transaction was flagged using verified arithmetic deltas, contractual terms, and benchmark baselines.
- **Remediation Action Items:** Formulates actionable vendor letters and recovery instructions.
- **Zero Hallucination:** All numbers and metrics are calculated mathematically before the LLM generates the narrative.

### E. Interactive Recovery Simulator
- **What-If Scenario Modeling:** Simulates price renegotiations, vendor consolidation, and volume shifts against target rate cards to project immediate and annual savings.

---

## 4. Technology Stack

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Data Processing:** Pandas, NumPy, Scikit-learn
- **Database:** SQLite with PRAGMA foreign keys, index optimization, and JSON serialization
- **Authentication:** JWT (JSON Web Tokens) with Passlib / Bcrypt hashing & RBAC
- **AI Integrations:** Google Gemini / OpenRouter API with deterministic fallback layer

### Frontend
- **Framework:** React 19 + TypeScript
- **Bundler & Tooling:** Vite, PostCSS, TailwindCSS
- **Animations:** Framer Motion (directional slide transitions, layout animations)
- **Icons:** Lucide React
- **Design System:** Custom Luxury Enterprise Fintech Theme (`#151515` Jet Black, `#F3F3F1` Soft Gray, `#B8A47A` Champagne Gold)

---

## 5. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | System status, version, and platform health |
| `GET` | `/health` | Health check probe |
| `POST` | `/api/upload` | Upload `.csv` or `.xlsx` procurement file with automatic schema normalization |
| `POST` | `/api/manual-analysis` | Submit user-entered manual transactions for complete leakage analysis |
| `GET` | `/api/dashboard/{file_id}` | Executive KPIs, 6-category leakage breakdown, and top priority findings |
| `GET` | `/api/findings/{file_id}` | Complete list of detected leakage items across all categories |
| `GET` | `/api/suppliers/{file_id}` | Supplier intelligence metrics (spend, anomalies, leakage, contract status) |
| `GET` | `/api/product-intelligence/{file_id}` | Product similarity matrix, comparability clusters, and spec detections |
| `POST` | `/api/product-similarity/compare` | Pairwise product comparison with custom attribute weights |
| `POST` | `/api/investigate/{file_id}/{tx_id}` | Deep forensic investigation with evidence trace and AI root cause |
| `POST` | `/api/simulate` | Deterministic recovery simulation for renegotiation modeling |
| `GET` | `/api/datasets` | List all persisted historical datasets across CSV, Excel, Nova API, and Manual |
| `GET` | `/api/datasets/{id}/rows` | Inspect preserved raw input JSON records for a dataset |
| `POST` | `/api/datasets/sync-nova` | Trigger live Nova Cloud API sync into persistent history |
| `DELETE` | `/api/datasets/{id}` | Delete dataset and cascade its rows and comparisons |
| `POST` | `/api/auth/login` | User authentication with email and password |
| `POST` | `/api/auth/signup` | Corporate user registration |

---

## 6. Getting Started Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and `npm`

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend will be available at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
```bash
# In the project root
npm install

# Start Vite development server
npm run dev
```
The application will open at `http://127.0.0.1:5173/` or `http://localhost:5173/`.

### 3. Production Build
```bash
# Run TypeScript compilation and Vite build
npm run build
```

---

## 7. Live Production Deployment

- **Application URL:** [https://finathon-1.onrender.com](https://finathon-1.onrender.com)
- **API Swagger Documentation:** [https://finathon-1.onrender.com/docs](https://finathon-1.onrender.com/docs)
- **Repository:** [https://github.com/sujeelmarapatla-14AA/Finathon](https://github.com/sujeelmarapatla-14AA/Finathon)

---

## 8. License

This project is developed for the **Finathon Procurement Intelligence Challenge**. Built with security, mathematical accuracy, and financial compliance at its core.
