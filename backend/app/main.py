"""
ML Model Registry API

A FastAPI application for managing ML models, versions, and deployments.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.database import init_db
from app.routes.models import router as models_router
from app.routes.models import stats_router
from app.models.schemas import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events.
    Initializes database on startup.
    """
    # Startup
    init_db()
    yield
    # Shutdown (cleanup if needed)


app = FastAPI(
    title=settings.app_name,
    description="API for managing ML models, versions, and deployments",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", response_model=HealthResponse, tags=["health"])
def health_check():
    """Health check endpoint."""
    return HealthResponse(status="healthy", version=settings.app_version)


# Include routers
app.include_router(models_router, prefix=settings.api_v1_prefix)
app.include_router(stats_router, prefix=settings.api_v1_prefix)


# Root endpoint
@app.get("/", tags=["root"])
def root():
    """Root endpoint with API information."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
