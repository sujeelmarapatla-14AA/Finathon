from typing import Any, Dict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.routes import dashboard, findings
    from app.routes.upload import router as upload_router
except ImportError:
    from backend.app.routes import dashboard, findings
    from backend.app.routes.upload import router as upload_router

app = FastAPI(
    title="LeakGuard AI",
    description="Procurement Spend Leakage Detection & Intelligence Platform",
    version="1.0.0",
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
    prefix="/api"
)
app.include_router(
    findings.router,
    prefix="/api"
)


@app.get("/")
def root() -> Dict[str, Any]:
    """Root status endpoint."""
    return {
        "name": "LeakGuard AI",
        "status": "online",
        "version": "1.0.0",
    }


@app.get("/health")
def health() -> Dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "healthy",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
