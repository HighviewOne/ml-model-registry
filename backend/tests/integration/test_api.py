"""
Integration tests for API endpoints.
Tests the full request/response cycle including database.
"""

import pytest
from fastapi.testclient import TestClient


class TestHealthEndpoint:
    """Tests for health check endpoint."""

    def test_health_check(self, client: TestClient):
        """Test health endpoint returns healthy status."""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data


class TestModelsEndpoints:
    """Tests for model CRUD endpoints."""

    def test_create_model(self, client: TestClient, sample_model_data: dict):
        """Test creating a new model."""
        response = client.post("/api/v1/models", json=sample_model_data)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_model_data["name"]
        assert data["framework"] == sample_model_data["framework"]
        assert data["status"] == "development"
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_create_model_minimal(self, client: TestClient):
        """Test creating a model with minimal required fields."""
        response = client.post(
            "/api/v1/models",
            json={"name": "minimal-model", "framework": "pytorch"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "minimal-model"
        assert data["current_version"] == "1.0.0"

    def test_create_model_duplicate_name(
        self, client: TestClient, sample_model: dict
    ):
        """Test that duplicate names are rejected."""
        response = client.post(
            "/api/v1/models",
            json={"name": sample_model["name"], "framework": "pytorch"},
        )

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]

    def test_create_model_invalid_name(self, client: TestClient):
        """Test that invalid names are rejected."""
        response = client.post(
            "/api/v1/models",
            json={"name": "invalid@name!", "framework": "sklearn"},
        )

        assert response.status_code == 422

    def test_list_models_empty(self, client: TestClient):
        """Test listing models when none exist."""
        response = client.get("/api/v1/models")

        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    def test_list_models(self, client: TestClient, sample_model: dict):
        """Test listing models."""
        response = client.get("/api/v1/models")

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["total"] == 1
        assert data["items"][0]["name"] == sample_model["name"]

    def test_list_models_pagination(self, client: TestClient):
        """Test model list pagination."""
        # Create 5 models
        for i in range(5):
            client.post(
                "/api/v1/models",
                json={"name": f"model-{i}", "framework": "sklearn"},
            )

        # Test pagination
        response = client.get("/api/v1/models?skip=0&limit=2")
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] == 5

        response = client.get("/api/v1/models?skip=4&limit=2")
        data = response.json()
        assert len(data["items"]) == 1

    def test_list_models_filter_by_framework(self, client: TestClient):
        """Test filtering models by framework."""
        client.post(
            "/api/v1/models",
            json={"name": "sklearn-model", "framework": "sklearn"},
        )
        client.post(
            "/api/v1/models",
            json={"name": "pytorch-model", "framework": "pytorch"},
        )

        response = client.get("/api/v1/models?framework=sklearn")
        data = response.json()

        assert data["total"] == 1
        assert data["items"][0]["framework"] == "sklearn"

    def test_list_models_search(self, client: TestClient):
        """Test searching models."""
        client.post(
            "/api/v1/models",
            json={
                "name": "customer-churn",
                "description": "Predicts customer churn",
                "framework": "sklearn",
            },
        )
        client.post(
            "/api/v1/models",
            json={"name": "fraud-detection", "framework": "pytorch"},
        )

        response = client.get("/api/v1/models?search=churn")
        data = response.json()

        assert data["total"] == 1
        assert "churn" in data["items"][0]["name"]

    def test_get_model(self, client: TestClient, sample_model: dict):
        """Test getting a specific model."""
        response = client.get(f"/api/v1/models/{sample_model['id']}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_model["id"]
        assert data["name"] == sample_model["name"]

    def test_get_model_not_found(self, client: TestClient):
        """Test getting a non-existent model."""
        response = client.get("/api/v1/models/non-existent-id")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_update_model(self, client: TestClient, sample_model: dict):
        """Test updating a model."""
        response = client.put(
            f"/api/v1/models/{sample_model['id']}",
            json={
                "name": "updated-model",
                "description": "Updated description",
                "tags": ["updated"],
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "updated-model"
        assert data["description"] == "Updated description"
        assert data["tags"] == ["updated"]

    def test_update_model_partial(self, client: TestClient, sample_model: dict):
        """Test partial model update."""
        original_name = sample_model["name"]
        response = client.put(
            f"/api/v1/models/{sample_model['id']}",
            json={"description": "Only description changed"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == original_name
        assert data["description"] == "Only description changed"

    def test_update_model_not_found(self, client: TestClient):
        """Test updating a non-existent model."""
        response = client.put(
            "/api/v1/models/non-existent-id",
            json={"name": "new-name"},
        )

        assert response.status_code == 404

    def test_delete_model(self, client: TestClient, sample_model: dict):
        """Test deleting a model."""
        response = client.delete(f"/api/v1/models/{sample_model['id']}")

        assert response.status_code == 204

        # Verify deletion
        response = client.get(f"/api/v1/models/{sample_model['id']}")
        assert response.status_code == 404

    def test_delete_model_not_found(self, client: TestClient):
        """Test deleting a non-existent model."""
        response = client.delete("/api/v1/models/non-existent-id")

        assert response.status_code == 404


class TestDeploymentEndpoints:
    """Tests for deployment status endpoints."""

    def test_deploy_model_to_staging(self, client: TestClient, sample_model: dict):
        """Test deploying model to staging."""
        response = client.post(
            f"/api/v1/models/{sample_model['id']}/deploy",
            json={"status": "staging"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "staging"

    def test_deploy_model_full_lifecycle(self, client: TestClient, sample_model: dict):
        """Test full deployment lifecycle."""
        model_id = sample_model["id"]

        # development -> staging
        response = client.post(
            f"/api/v1/models/{model_id}/deploy",
            json={"status": "staging"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "staging"

        # staging -> production
        response = client.post(
            f"/api/v1/models/{model_id}/deploy",
            json={"status": "production"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "production"

        # production -> archived
        response = client.post(
            f"/api/v1/models/{model_id}/deploy",
            json={"status": "archived"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "archived"

    def test_deploy_model_invalid_transition(
        self, client: TestClient, sample_model: dict
    ):
        """Test invalid deployment transition."""
        # Try to go directly from development to production
        response = client.post(
            f"/api/v1/models/{sample_model['id']}/deploy",
            json={"status": "production"},
        )

        assert response.status_code == 400
        assert "Invalid status transition" in response.json()["detail"]


class TestVersionEndpoints:
    """Tests for model version endpoints."""

    def test_list_versions(self, client: TestClient, sample_model: dict):
        """Test listing model versions."""
        response = client.get(f"/api/v1/models/{sample_model['id']}/versions")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1  # Initial version created
        assert data[0]["version"] == "1.0.0"

    def test_create_version(self, client: TestClient, sample_model: dict):
        """Test creating a new version."""
        response = client.post(
            f"/api/v1/models/{sample_model['id']}/versions",
            json={
                "version": "1.1.0",
                "metrics": {"accuracy": 0.97},
                "changelog": "Improved feature engineering",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["version"] == "1.1.0"
        assert data["metrics"] == {"accuracy": 0.97}
        assert data["changelog"] == "Improved feature engineering"

    def test_create_version_updates_model(
        self, client: TestClient, sample_model: dict
    ):
        """Test that creating a version updates the model's current version."""
        client.post(
            f"/api/v1/models/{sample_model['id']}/versions",
            json={"version": "2.0.0", "metrics": {"accuracy": 0.99}},
        )

        # Check model was updated
        response = client.get(f"/api/v1/models/{sample_model['id']}")
        data = response.json()

        assert data["current_version"] == "2.0.0"
        assert data["metrics"] == {"accuracy": 0.99}

    def test_create_duplicate_version(self, client: TestClient, sample_model: dict):
        """Test that duplicate versions are rejected."""
        response = client.post(
            f"/api/v1/models/{sample_model['id']}/versions",
            json={"version": "1.0.0"},  # Already exists
        )

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]

    def test_create_version_model_not_found(self, client: TestClient):
        """Test creating version for non-existent model."""
        response = client.post(
            "/api/v1/models/non-existent-id/versions",
            json={"version": "1.0.0"},
        )

        assert response.status_code == 404


class TestStatsEndpoint:
    """Tests for dashboard statistics endpoint."""

    def test_stats_empty(self, client: TestClient):
        """Test stats when no models exist."""
        response = client.get("/api/v1/stats")

        assert response.status_code == 200
        data = response.json()
        assert data["total_models"] == 0
        assert data["models_by_status"] == {}
        assert data["models_by_framework"] == {}
        assert data["recent_models"] == []

    def test_stats_with_models(self, client: TestClient):
        """Test stats with multiple models."""
        # Create models with different frameworks
        client.post(
            "/api/v1/models",
            json={"name": "sklearn-1", "framework": "sklearn"},
        )
        client.post(
            "/api/v1/models",
            json={"name": "sklearn-2", "framework": "sklearn"},
        )
        pytorch_model = client.post(
            "/api/v1/models",
            json={"name": "pytorch-1", "framework": "pytorch"},
        ).json()

        # Deploy one to staging
        client.post(
            f"/api/v1/models/{pytorch_model['id']}/deploy",
            json={"status": "staging"},
        )

        response = client.get("/api/v1/stats")

        assert response.status_code == 200
        data = response.json()
        assert data["total_models"] == 3
        assert data["models_by_framework"]["sklearn"] == 2
        assert data["models_by_framework"]["pytorch"] == 1
        assert data["models_by_status"]["development"] == 2
        assert data["models_by_status"]["staging"] == 1
        assert len(data["recent_models"]) == 3
