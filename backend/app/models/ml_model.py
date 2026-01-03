"""
SQLAlchemy ORM models for the ML Model Registry.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, Column, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.database import Base


class MLModel(Base):
    """
    Represents a registered ML model.
    """

    __tablename__ = "ml_models"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    framework = Column(
        String(20),
        nullable=False,
        default="other",
    )
    status = Column(
        String(20),
        nullable=False,
        default="development",
    )
    current_version = Column(String(20), nullable=True, default="1.0.0")
    metrics = Column(JSON, nullable=True)
    tags = Column(JSON, nullable=True, default=list)
    author = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    versions = relationship(
        "ModelVersion", back_populates="model", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<MLModel(name='{self.name}', version='{self.current_version}', status='{self.status}')>"


class ModelVersion(Base):
    """
    Represents a specific version of an ML model.
    Tracks version history and metrics per version.
    """

    __tablename__ = "model_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(
        String(36), ForeignKey("ml_models.id", ondelete="CASCADE"), nullable=False
    )
    version = Column(String(20), nullable=False)
    metrics = Column(JSON, nullable=True)
    changelog = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    model = relationship("MLModel", back_populates="versions")

    def __repr__(self):
        return f"<ModelVersion(model_id='{self.model_id}', version='{self.version}')>"
