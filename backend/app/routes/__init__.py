"""Routes package."""

from app.routes.models import router as models_router
from app.routes.models import stats_router

__all__ = ["models_router", "stats_router"]
