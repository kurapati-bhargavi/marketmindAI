from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user, require_role
from app.ml.segmentation import calculate_customer_segmentation
from app.ml.forecasting import generate_sales_forecast
from app.ml.churn import predict_customer_churn
from app.ml.recommendations import generate_product_recommendations
from app.ml.anomaly_detection import detect_all_anomalies
from app.ml.alerts_engine import sync_and_get_alerts, mark_alert_read, resolve_alert
from app.ml.ai_insights import generate_executive_ai_insights

router = APIRouter(
    prefix="/ml",
    tags=["Machine Learning & AI Intelligence"]
)


@router.get("/segmentation")
def get_segmentation(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    """
    Get RFM Customer Segmentation with K-Means clustering and Silhouette Score.
    """
    return calculate_customer_segmentation(db)


@router.get("/forecast")
def get_forecast(
    days: int = Query(default=30, ge=7, le=180, description="Forecast horizon in days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    """
    Get time-series sales and revenue forecast with 95% confidence intervals and MAE/RMSE/R2 metrics.
    """
    return generate_sales_forecast(db, forecast_days=days)


@router.get("/churn")
def get_churn_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    """
    Get customer churn predictions with risk levels, probability gauges, and precision/recall/F1 metrics.
    """
    return predict_customer_churn(db)


@router.get("/recommendations")
def get_recommendations(
    top_k: int = Query(default=4, ge=1, le=10),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "Sales Executive", "System Administrator"))
):
    """
    Get item-based collaborative product recommendations and cross-sell affinities with Precision@K/Recall@K.
    """
    return generate_product_recommendations(db, top_k=top_k)


@router.get("/anomalies")
def get_anomalies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    """
    Get sales and inventory anomalies detected via Isolation Forest & IQR thresholds.
    """
    return detect_all_anomalies(db)


@router.get("/alerts")
def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all active business alerts across inventory, churn, and sales anomalies.
    """
    return sync_and_get_alerts(db)


@router.put("/alerts/{alert_id}/read")
def read_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = mark_alert_read(db, alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found.")
    return {"success": True, "message": "Alert marked as read."}


@router.put("/alerts/{alert_id}/resolve")
def close_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = resolve_alert(db, alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found.")
    return {"success": True, "message": "Alert resolved."}


@router.get("/insights")
def get_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    """
    Get executive AI insights with overall business health score and actionable recommendations.
    """
    return generate_executive_ai_insights(db)
