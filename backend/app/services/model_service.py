"""
Service layer for ML Model business logic.
Handles CRUD operations and business rules.
"""

from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.ml_model import MLModel, ModelVersion
from app.models.schemas import (
    DeploymentStatus,
    Framework,
    ModelCreate,
    ModelUpdate,
    ModelVersionCreate,
)


class ModelService:
    """Service class for ML Model operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_models(
        self,
        skip: int = 0,
        limit: int = 20,
        framework: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> tuple[list[MLModel], int]:
        """
        Get paginated list of models with optional filtering.

        Returns:
            Tuple of (models list, total count)
        """
        query = self.db.query(MLModel)

        # Apply filters
        if framework:
            query = query.filter(MLModel.framework == framework)
        if status:
            query = query.filter(MLModel.status == status)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (MLModel.name.ilike(search_term))
                | (MLModel.description.ilike(search_term))
            )

        # Get total count before pagination
        total = query.count()

        # Apply pagination and ordering
        models = (
            query.order_by(MLModel.updated_at.desc()).offset(skip).limit(limit).all()
        )

        return models, total

    def get_model_by_id(self, model_id: str) -> Optional[MLModel]:
        """Get a single model by ID."""
        return self.db.query(MLModel).filter(MLModel.id == model_id).first()

    def get_model_by_name(self, name: str) -> Optional[MLModel]:
        """Get a single model by name."""
        return self.db.query(MLModel).filter(MLModel.name == name).first()

    def create_model(self, model_data: ModelCreate) -> MLModel:
        """
        Create a new ML model.

        Raises:
            ValueError: If model with same name already exists
        """
        # Check for duplicate name
        existing = self.get_model_by_name(model_data.name)
        if existing:
            raise ValueError(f"Model with name '{model_data.name}' already exists")

        # Create model
        db_model = MLModel(
            name=model_data.name,
            description=model_data.description,
            framework=model_data.framework.value,
            status=DeploymentStatus.DEVELOPMENT.value,
            current_version=model_data.version,
            metrics=model_data.metrics,
            tags=model_data.tags or [],
            author=model_data.author,
        )

        self.db.add(db_model)
        self.db.commit()
        self.db.refresh(db_model)

        # Create initial version
        if model_data.version:
            initial_version = ModelVersion(
                model_id=db_model.id,
                version=model_data.version,
                metrics=model_data.metrics,
                changelog="Initial version",
            )
            self.db.add(initial_version)
            self.db.commit()

        return db_model

    def update_model(self, model_id: str, model_data: ModelUpdate) -> Optional[MLModel]:
        """
        Update an existing model.

        Returns:
            Updated model or None if not found

        Raises:
            ValueError: If new name conflicts with existing model
        """
        db_model = self.get_model_by_id(model_id)
        if not db_model:
            return None

        # Check for name conflict
        if model_data.name and model_data.name != db_model.name:
            existing = self.get_model_by_name(model_data.name)
            if existing:
                raise ValueError(f"Model with name '{model_data.name}' already exists")

        # Update fields
        update_data = model_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_model, field, value)

        self.db.commit()
        self.db.refresh(db_model)

        return db_model

    def delete_model(self, model_id: str) -> bool:
        """
        Delete a model and all its versions.

        Returns:
            True if deleted, False if not found
        """
        db_model = self.get_model_by_id(model_id)
        if not db_model:
            return False

        self.db.delete(db_model)
        self.db.commit()

        return True

    def update_deployment_status(
        self, model_id: str, new_status: DeploymentStatus
    ) -> Optional[MLModel]:
        """
        Update the deployment status of a model.

        Returns:
            Updated model or None if not found

        Raises:
            ValueError: If status transition is invalid
        """
        db_model = self.get_model_by_id(model_id)
        if not db_model:
            return None

        # Validate status transition (optional business rule)
        current_status = DeploymentStatus(db_model.status)
        if not self._is_valid_status_transition(current_status, new_status):
            raise ValueError(
                f"Invalid status transition from {current_status.value} to {new_status.value}"
            )

        db_model.status = new_status.value
        self.db.commit()
        self.db.refresh(db_model)

        return db_model

    def _is_valid_status_transition(
        self, current: DeploymentStatus, new: DeploymentStatus
    ) -> bool:
        """
        Validate deployment status transitions.
        
        Valid transitions:
        - development -> staging
        - staging -> production
        - any -> archived
        - archived -> development (reactivation)
        """
        valid_transitions = {
            DeploymentStatus.DEVELOPMENT: [
                DeploymentStatus.STAGING,
                DeploymentStatus.ARCHIVED,
            ],
            DeploymentStatus.STAGING: [
                DeploymentStatus.PRODUCTION,
                DeploymentStatus.DEVELOPMENT,
                DeploymentStatus.ARCHIVED,
            ],
            DeploymentStatus.PRODUCTION: [
                DeploymentStatus.STAGING,
                DeploymentStatus.ARCHIVED,
            ],
            DeploymentStatus.ARCHIVED: [
                DeploymentStatus.DEVELOPMENT,
            ],
        }

        return new in valid_transitions.get(current, [])


class VersionService:
    """Service class for Model Version operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_versions(self, model_id: str) -> list[ModelVersion]:
        """Get all versions for a model."""
        return (
            self.db.query(ModelVersion)
            .filter(ModelVersion.model_id == model_id)
            .order_by(ModelVersion.created_at.desc())
            .all()
        )

    def create_version(
        self, model_id: str, version_data: ModelVersionCreate
    ) -> ModelVersion:
        """
        Create a new version for a model.

        Raises:
            ValueError: If version already exists for this model
        """
        # Check if version already exists
        existing = (
            self.db.query(ModelVersion)
            .filter(
                ModelVersion.model_id == model_id,
                ModelVersion.version == version_data.version,
            )
            .first()
        )

        if existing:
            raise ValueError(
                f"Version {version_data.version} already exists for this model"
            )

        # Create version
        db_version = ModelVersion(
            model_id=model_id,
            version=version_data.version,
            metrics=version_data.metrics,
            changelog=version_data.changelog,
        )

        self.db.add(db_version)

        # Update model's current version
        model = self.db.query(MLModel).filter(MLModel.id == model_id).first()
        if model:
            model.current_version = version_data.version
            if version_data.metrics:
                model.metrics = version_data.metrics

        self.db.commit()
        self.db.refresh(db_version)

        return db_version


class StatsService:
    """Service class for dashboard statistics."""

    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_stats(self) -> dict:
        """Calculate dashboard statistics."""
        # Total models
        total_models = self.db.query(func.count(MLModel.id)).scalar()

        # Models by status
        status_counts = (
            self.db.query(MLModel.status, func.count(MLModel.id))
            .group_by(MLModel.status)
            .all()
        )
        models_by_status = {status: count for status, count in status_counts}

        # Models by framework
        framework_counts = (
            self.db.query(MLModel.framework, func.count(MLModel.id))
            .group_by(MLModel.framework)
            .all()
        )
        models_by_framework = {framework: count for framework, count in framework_counts}

        # Recent models (last 5)
        recent_models = (
            self.db.query(MLModel)
            .order_by(MLModel.updated_at.desc())
            .limit(5)
            .all()
        )

        return {
            "total_models": total_models or 0,
            "models_by_status": models_by_status,
            "models_by_framework": models_by_framework,
            "recent_models": recent_models,
        }
