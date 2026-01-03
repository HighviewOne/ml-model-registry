"""
Unit tests for ModelService.
"""

import pytest
from sqlalchemy.orm import Session

from app.models.schemas import (
    DeploymentStatus,
    Framework,
    ModelCreate,
    ModelUpdate,
)
from app.services.model_service import ModelService


class TestModelService:
    """Tests for ModelService class."""

    def test_create_model_success(self, db_session: Session):
        """Test successful model creation."""
        service = ModelService(db_session)
        model_data = ModelCreate(
            name="test-model",
            description="Test description",
            framework=Framework.SKLEARN,
            version="1.0.0",
            metrics={"accuracy": 0.95},
            tags=["test"],
            author="Test Author",
        )

        model = service.create_model(model_data)

        assert model.name == "test-model"
        assert model.description == "Test description"
        assert model.framework == "sklearn"
        assert model.status == "development"
        assert model.current_version == "1.0.0"
        assert model.metrics == {"accuracy": 0.95}
        assert model.tags == ["test"]
        assert model.author == "Test Author"
        assert model.id is not None

    def test_create_model_duplicate_name(self, db_session: Session):
        """Test that duplicate model names are rejected."""
        service = ModelService(db_session)
        model_data = ModelCreate(
            name="duplicate-model",
            framework=Framework.PYTORCH,
        )

        # Create first model
        service.create_model(model_data)

        # Attempt to create duplicate
        with pytest.raises(ValueError, match="already exists"):
            service.create_model(model_data)

    def test_get_model_by_id(self, db_session: Session):
        """Test retrieving model by ID."""
        service = ModelService(db_session)
        model_data = ModelCreate(
            name="find-me",
            framework=Framework.TENSORFLOW,
        )

        created = service.create_model(model_data)
        found = service.get_model_by_id(created.id)

        assert found is not None
        assert found.id == created.id
        assert found.name == "find-me"

    def test_get_model_by_id_not_found(self, db_session: Session):
        """Test that non-existent ID returns None."""
        service = ModelService(db_session)
        result = service.get_model_by_id("non-existent-id")

        assert result is None

    def test_get_models_pagination(self, db_session: Session):
        """Test model list pagination."""
        service = ModelService(db_session)

        # Create 5 models
        for i in range(5):
            service.create_model(
                ModelCreate(name=f"model-{i}", framework=Framework.SKLEARN)
            )

        # Get first page
        models, total = service.get_models(skip=0, limit=2)
        assert len(models) == 2
        assert total == 5

        # Get second page
        models, total = service.get_models(skip=2, limit=2)
        assert len(models) == 2
        assert total == 5

    def test_get_models_filter_by_framework(self, db_session: Session):
        """Test filtering models by framework."""
        service = ModelService(db_session)

        # Create models with different frameworks
        service.create_model(
            ModelCreate(name="sklearn-model", framework=Framework.SKLEARN)
        )
        service.create_model(
            ModelCreate(name="pytorch-model", framework=Framework.PYTORCH)
        )

        models, total = service.get_models(framework="sklearn")

        assert total == 1
        assert models[0].framework == "sklearn"

    def test_get_models_filter_by_status(self, db_session: Session):
        """Test filtering models by status."""
        service = ModelService(db_session)

        # Create and update model status
        model = service.create_model(
            ModelCreate(name="staging-model", framework=Framework.SKLEARN)
        )
        service.update_deployment_status(model.id, DeploymentStatus.STAGING)

        models, total = service.get_models(status="staging")

        assert total == 1
        assert models[0].status == "staging"

    def test_get_models_search(self, db_session: Session):
        """Test searching models by name and description."""
        service = ModelService(db_session)

        service.create_model(
            ModelCreate(
                name="customer-churn",
                description="Predicts customer churn",
                framework=Framework.SKLEARN,
            )
        )
        service.create_model(
            ModelCreate(
                name="fraud-detection",
                description="Detects fraudulent transactions",
                framework=Framework.PYTORCH,
            )
        )

        # Search by name
        models, total = service.get_models(search="churn")
        assert total == 1
        assert "churn" in models[0].name

        # Search by description
        models, total = service.get_models(search="fraudulent")
        assert total == 1
        assert "fraud" in models[0].name

    def test_update_model(self, db_session: Session):
        """Test updating model properties."""
        service = ModelService(db_session)

        model = service.create_model(
            ModelCreate(name="update-me", framework=Framework.SKLEARN)
        )

        update_data = ModelUpdate(
            name="updated-name",
            description="New description",
            tags=["updated", "tags"],
        )

        updated = service.update_model(model.id, update_data)

        assert updated.name == "updated-name"
        assert updated.description == "New description"
        assert updated.tags == ["updated", "tags"]

    def test_update_model_name_conflict(self, db_session: Session):
        """Test that updating to an existing name is rejected."""
        service = ModelService(db_session)

        service.create_model(ModelCreate(name="existing", framework=Framework.SKLEARN))
        model2 = service.create_model(
            ModelCreate(name="rename-me", framework=Framework.SKLEARN)
        )

        with pytest.raises(ValueError, match="already exists"):
            service.update_model(model2.id, ModelUpdate(name="existing"))

    def test_delete_model(self, db_session: Session):
        """Test deleting a model."""
        service = ModelService(db_session)

        model = service.create_model(
            ModelCreate(name="delete-me", framework=Framework.SKLEARN)
        )

        result = service.delete_model(model.id)
        assert result is True

        # Verify deletion
        found = service.get_model_by_id(model.id)
        assert found is None

    def test_delete_model_not_found(self, db_session: Session):
        """Test deleting non-existent model returns False."""
        service = ModelService(db_session)
        result = service.delete_model("non-existent-id")

        assert result is False

    def test_update_deployment_status(self, db_session: Session):
        """Test valid deployment status transitions."""
        service = ModelService(db_session)

        model = service.create_model(
            ModelCreate(name="deploy-me", framework=Framework.SKLEARN)
        )

        # development -> staging
        updated = service.update_deployment_status(model.id, DeploymentStatus.STAGING)
        assert updated.status == "staging"

        # staging -> production
        updated = service.update_deployment_status(
            model.id, DeploymentStatus.PRODUCTION
        )
        assert updated.status == "production"

    def test_update_deployment_status_invalid_transition(self, db_session: Session):
        """Test invalid deployment status transitions are rejected."""
        service = ModelService(db_session)

        model = service.create_model(
            ModelCreate(name="invalid-deploy", framework=Framework.SKLEARN)
        )

        # development -> production (invalid, must go through staging)
        with pytest.raises(ValueError, match="Invalid status transition"):
            service.update_deployment_status(model.id, DeploymentStatus.PRODUCTION)
