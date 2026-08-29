# app/models/__init__.py
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.sale import Sale
from app.models.inventory import Inventory
from app.models.invoice import Invoice
from app.models.ml_models import (
    ForecastResult,
    CustomerSegment,
    ChurnPrediction,
    ProductRecommendation,
    Anomaly,
    Alert,
    Report,
)

__all__ = [
    "User",
    "Customer",
    "Product",
    "Sale",
    "Inventory",
    "Invoice",
    "ForecastResult",
    "CustomerSegment",
    "ChurnPrediction",
    "ProductRecommendation",
    "Anomaly",
    "Alert",
    "Report",
]