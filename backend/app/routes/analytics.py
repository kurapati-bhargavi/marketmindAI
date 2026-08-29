from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.auth.dependencies import require_role
from app.analytics.sales_analytics import (
    get_sales_summary,
    get_product_sales,
    get_monthly_sales,
    get_daily_sales_trend,
    get_category_sales,
    get_customer_sales,
)
from app.ml.forecasting import generate_sales_forecast
from app.ml.churn import predict_customer_churn
from app.ml.segmentation import calculate_customer_segmentation
from app.ml.anomaly_detection import detect_all_anomalies

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get("/sales-summary")
def sales_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "Sales Executive", "System Administrator"))
):
    """
    Get top-level KPI cards: Total Revenue, Orders, Items Sold, AOV, Total Customers, Low Stock items.
    """
    return get_sales_summary(db)


@router.get("/monthly-sales")
def monthly_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "Sales Executive", "System Administrator"))
):
    return get_monthly_sales(db)


@router.get("/daily-trend")
def daily_trend(
    days: int = Query(default=30, ge=7, le=180),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "Sales Executive", "System Administrator"))
):
    return get_daily_sales_trend(db, days=days)


@router.get("/product-sales")
def product_sales(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "Sales Executive", "System Administrator"))
):
    return get_product_sales(db, limit=limit)


@router.get("/category-sales")
def category_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "Sales Executive", "System Administrator"))
):
    return get_category_sales(db)


@router.get("/customer-sales")
def customer_sales(
    limit: int = Query(default=15, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "Sales Executive", "System Administrator"))
):
    return get_customer_sales(db, limit=limit)


# Forwarding ML endpoints for backward compatibility
@router.get("/sales-forecast")
def sales_forecast(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    return generate_sales_forecast(db, forecast_days=days)


@router.get("/customer-segments")
def customer_segments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    return calculate_customer_segmentation(db)


@router.get("/churn-prediction")
def churn_prediction(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    return predict_customer_churn(db)


@router.get("/sales-anomalies")
def sales_anomalies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    return detect_all_anomalies(db)