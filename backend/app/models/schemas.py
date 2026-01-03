"""
Pydantic schemas for API request/response validation.
These match the OpenAPI specification.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


class DeploymentStatus(str, Enum):
    """Deployment status options."""

    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    ARCHIVED = "archived"


class Framework(str, Enum):
    """Supported ML frameworks."""

    SKLEARN = "sklearn"
    TENSORFLOW = "tensorflow"
    PYTORCH = "pytorch"
    XGBOOST = "xgboost"
    LIGHTGBM = "lightgbm"
    ONNX = "onnx"
    OTHER = "other"


# ============== Model Schemas ==============


class ModelBase(BaseModel):
    """Base schema for model data."""

    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    framework: Framework
    tags: Optional[list[str]] = Field(default_factory=list)


class ModelCreate(ModelBase):
    """Schema for creating a new model."""

    version: Optional[str] = Field(default="1.0.0", pattern=r"^\d+\.\d+\.\d+$")
    metrics: Optional[dict[str, float]] = None
    author: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_must_be_valid(cls, v: str) -> str:
        """Validate model name format."""
        if not v.replace("-", "").replace("_", "").replace(" ", "").isalnum():
            raise ValueError(
                "Name must contain only alphanumeric characters, hyphens, underscores, or spaces"
            )
        return v.strip()


class ModelUpdate(BaseModel):
    """Schema for updating a model (all fields optional)."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    tags: Optional[list[str]] = None

    @field_validator("name")
    @classmethod
    def name_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        """Validate model name format if provided."""
        if v is None:
            return v
        if not v.replace("-", "").replace("_", "").replace(" ", "").isalnum():
            raise ValueError(
                "Name must contain only alphanumeric characters, hyphens, underscores, or spaces"
            )
        return v.strip()


class ModelResponse(ModelBase):
    """Schema for model response."""

    id: str
    status: DeploymentStatus
    current_version: Optional[str] = None
    metrics: Optional[dict[str, float]] = None
    author: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ModelListResponse(BaseModel):
    """Paginated list of models."""

    items: list[ModelResponse]
    total: int
    skip: int
    limit: int


# ============== Version Schemas ==============


class ModelVersionCreate(BaseModel):
    """Schema for creating a new model version."""

    version: str = Field(..., pattern=r"^\d+\.\d+\.\d+$")
    metrics: Optional[dict[str, float]] = None
    changelog: Optional[str] = None


class ModelVersionResponse(BaseModel):
    """Schema for version response."""

    id: str
    model_id: str
    version: str
    metrics: Optional[dict[str, float]] = None
    changelog: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============== Deployment Schemas ==============


class DeploymentRequest(BaseModel):
    """Schema for deployment status update."""

    status: DeploymentStatus


# ============== Stats Schemas ==============


class DashboardStats(BaseModel):
    """Dashboard statistics response."""

    total_models: int
    models_by_status: dict[str, int]
    models_by_framework: dict[str, int]
    recent_models: list[ModelResponse]


# ============== Health Check ==============


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "healthy"
    version: str
