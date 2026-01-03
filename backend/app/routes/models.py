"""
API routes for ML Model operations.
Follows the OpenAPI specification.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.schemas import (
    DeploymentRequest,
    DeploymentStatus,
    Framework,
    ModelCreate,
    ModelListResponse,
    ModelResponse,
    ModelUpdate,
    ModelVersionCreate,
    ModelVersionResponse,
    DashboardStats,
)
from app.services.model_service import ModelService, VersionService, StatsService

router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=ModelListResponse)
def list_models(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    framework: Optional[Framework] = None,
    status: Optional[DeploymentStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    List all models with optional filtering and pagination.
    """
    service = ModelService(db)
    
    framework_value = framework.value if framework else None
    status_value = status.value if status else None
    
    models, total = service.get_models(
        skip=skip,
        limit=limit,
        framework=framework_value,
        status=status_value,
        search=search,
    )

    return ModelListResponse(
        items=[ModelResponse.model_validate(m) for m in models],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post("", response_model=ModelResponse, status_code=status.HTTP_201_CREATED)
def create_model(model_data: ModelCreate, db: Session = Depends(get_db)):
    """
    Register a new ML model.
    """
    service = ModelService(db)

    try:
        model = service.create_model(model_data)
        return ModelResponse.model_validate(model)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.get("/{model_id}", response_model=ModelResponse)
def get_model(model_id: str, db: Session = Depends(get_db)):
    """
    Get a specific model by ID.
    """
    service = ModelService(db)
    model = service.get_model_by_id(model_id)

    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Model not found"
        )

    return ModelResponse.model_validate(model)


@router.put("/{model_id}", response_model=ModelResponse)
def update_model(
    model_id: str, model_data: ModelUpdate, db: Session = Depends(get_db)
):
    """
    Update an existing model.
    """
    service = ModelService(db)

    try:
        model = service.update_model(model_id, model_data)
        if not model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Model not found"
            )
        return ModelResponse.model_validate(model)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.delete("/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_model(model_id: str, db: Session = Depends(get_db)):
    """
    Delete a model and all its versions.
    """
    service = ModelService(db)
    deleted = service.delete_model(model_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Model not found"
        )


@router.post("/{model_id}/deploy", response_model=ModelResponse)
def deploy_model(
    model_id: str, deployment: DeploymentRequest, db: Session = Depends(get_db)
):
    """
    Update the deployment status of a model.
    """
    service = ModelService(db)

    try:
        model = service.update_deployment_status(model_id, deployment.status)
        if not model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Model not found"
            )
        return ModelResponse.model_validate(model)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============== Version Routes ==============


@router.get("/{model_id}/versions", response_model=list[ModelVersionResponse])
def list_model_versions(model_id: str, db: Session = Depends(get_db)):
    """
    Get all versions of a specific model.
    """
    # First check if model exists
    model_service = ModelService(db)
    model = model_service.get_model_by_id(model_id)

    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Model not found"
        )

    version_service = VersionService(db)
    versions = version_service.get_versions(model_id)

    return [ModelVersionResponse.model_validate(v) for v in versions]


@router.post(
    "/{model_id}/versions",
    response_model=ModelVersionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_model_version(
    model_id: str, version_data: ModelVersionCreate, db: Session = Depends(get_db)
):
    """
    Create a new version for a model.
    """
    # First check if model exists
    model_service = ModelService(db)
    model = model_service.get_model_by_id(model_id)

    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Model not found"
        )

    version_service = VersionService(db)

    try:
        version = version_service.create_version(model_id, version_data)
        return ModelVersionResponse.model_validate(version)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


# ============== Stats Router ==============

stats_router = APIRouter(prefix="/stats", tags=["stats"])


@stats_router.get("", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get aggregated statistics for the dashboard.
    """
    service = StatsService(db)
    stats = service.get_dashboard_stats()

    return DashboardStats(
        total_models=stats["total_models"],
        models_by_status=stats["models_by_status"],
        models_by_framework=stats["models_by_framework"],
        recent_models=[ModelResponse.model_validate(m) for m in stats["recent_models"]],
    )
