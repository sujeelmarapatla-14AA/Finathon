"""
SpendIntel - FastAPI Backend Application Entry Point.

Features:
- Loads environment variables from backend/.env on startup.
- Never hardcodes or logs AI_API_KEY or NOVA_API_KEY.
- Startup configuration validation reporting only:
    "Nova API key configured: yes/no"
    "AI API key configured: yes/no"
- Registers procurement intelligence routes:
    * Upload & Ingestion
    * Executive Dashboard
    * Forensic Findings
    * AI Investigation
    * Recovery Simulator
    * Supplier Intelligence
"""

from contextlib import asynccontextmanager
import os
from pathlib import Path
from typing import Any, Dict
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Resolve backend directory and load backend/.env
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()

try:
    from app.routes import dashboard, findings, investigation, simulation, suppliers, nova, manual, auth, product_intelligence, datasets
    from app.routes.upload import router as upload_router
    from app.services.dataset_service import init_dataset_db, seed_baseline_demo_dataset
except ImportError:
    from backend.app.routes import dashboard, findings, investigation, simulation, suppliers, nova, manual, auth, product_intelligence, datasets
    from backend.app.routes.upload import router as upload_router
    from backend.app.services.dataset_service import init_dataset_db, seed_baseline_demo_dataset


def validate_config(log_output: bool = True) -> Dict[str, str]:
    """
    Validate environment configuration for external integrations.
    Reports strictly whether keys are configured ('yes' / 'no') without exposing or printing secrets.
    """
    nova_key = os.getenv("NOVA_API_KEY", "").strip()
    ai_key = (
        os.getenv("AI_API_KEY", "").strip()
        or os.getenv("GEMINI_API_KEY", "").strip()
        or os.getenv("OPENROUTER_API_KEY", "").strip()
    )

    nova_configured = "yes" if bool(nova_key) else "no"
    ai_configured = "yes" if bool(ai_key) else "no"

    if log_output:
        print(f"Nova API key configured: {nova_configured}")
        print(f"AI API key configured: {ai_configured}")

    return {
        "nova_api_key_configured": nova_configured,
        "ai_api_key_configured": ai_configured,
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager handling startup & shutdown lifecycle."""
    # Ensure .env is loaded on startup
    if ENV_PATH.exists():
        load_dotenv(dotenv_path=ENV_PATH)

    # Initialize unified dataset database & seed baseline demo
    try:
        init_dataset_db()
        seed_baseline_demo_dataset()
    except Exception as e:
        print(f"[Startup Database Error] {e}")

    # Startup validation reporting configuration status
    validate_config(log_output=True)
    yield


app = FastAPI(
    title="SpendIntel",
    description="Procurement Spend Leakage Detection & Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for development frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(upload_router, prefix="/api")
app.include_router(
    dashboard.router,
    prefix="/api",
)
app.include_router(
    findings.router,
    prefix="/api",
)
app.include_router(
    simulation.router,
    prefix="/api",
)
app.include_router(
    investigation.router,
    prefix="/api",
)
app.include_router(
    suppliers.router,
    prefix="/api",
)
app.include_router(
    nova.router,
    prefix="/api",
)
app.include_router(
    manual.router,
    prefix="/api",
)
app.include_router(
    auth.router,
    prefix="/api",
)
app.include_router(
    auth.router,
)
app.include_router(
    product_intelligence.router,
    prefix="/api",
)
app.include_router(
    product_intelligence.router,
)
app.include_router(
    datasets.router,
    prefix="/api",
)
app.include_router(
    datasets.router,
)



@app.get("/")
def root() -> Dict[str, Any]:
    """Root status endpoint."""
    return {
        "name": "SpendIntel",
        "status": "online",
        "version": "1.0.0",
    }


@app.get("/health")
@app.get("/api/health")
def health() -> Dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "healthy",
    }



@app.get("/config/status")
@app.get("/api/config/status")
def config_status() -> Dict[str, str]:
    """
    Diagnostic endpoint reporting integration configuration status.
    Returns 'yes' / 'no' without exposing secret keys.
    """
    return validate_config(log_output=False)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
