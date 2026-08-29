from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.user import User
from app.models.sale import Sale
from app.models.product import Product
from app.models.customer import Customer
from app.models.inventory import Inventory
from app.models.ml_models import Report
from app.auth.dependencies import require_role
from app.ml.forecasting import generate_sales_forecast
from app.ml.segmentation import calculate_customer_segmentation
from app.ml.churn import predict_customer_churn

router = APIRouter(
    prefix="/reports",
    tags=["Reports & Business Analytics"]
)


@router.get("/generate")
def generate_business_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    """
    Generates a full comprehensive Executive Performance Digest report with snapshot metrics and ML insights.
    """
    total_rev = db.query(func.coalesce(func.sum(Sale.total_amount), 0)).scalar() or 0.0
    total_orders = db.query(func.count(Sale.id)).scalar() or 0
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    total_products = db.query(func.count(Product.id)).scalar() or 0

    # Top products by revenue
    top_prods = (
        db.query(
            Product.name,
            Product.category,
            func.sum(Sale.quantity).label("units_sold"),
            func.sum(Sale.total_amount).label("revenue")
        )
        .join(Sale, Sale.product_id == Product.id)
        .group_by(Product.id, Product.name, Product.category)
        .order_by(func.sum(Sale.total_amount).desc())
        .limit(5)
        .all()
    )

    # Category breakdown
    cat_breakdown = (
        db.query(
            Product.category,
            func.sum(Sale.total_amount).label("revenue"),
            func.count(Sale.id).label("order_count")
        )
        .join(Sale, Sale.product_id == Product.id)
        .group_by(Product.category)
        .order_by(func.sum(Sale.total_amount).desc())
        .all()
    )

    # ML summaries
    forecast_summary = generate_sales_forecast(db, forecast_days=30)
    seg_summary = calculate_customer_segmentation(db)
    churn_summary = predict_customer_churn(db)

    report_title = f"Executive Sales Intelligence Digest — {datetime.now().strftime('%B %Y')}"
    summary_text = (
        f"Platform has processed ₹{total_rev:,.2f} in lifetime gross merchandise value across "
        f"{total_orders:,} transactions. Current customer base stands at {total_customers} clients. "
        f"30-day forecast projects {forecast_summary.get('metrics', {}).get('trend', 'STABLE')} trajectory."
    )

    report_data = {
        "title": report_title,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "generated_by": current_user.name,
        "summary": summary_text,
        "kpis": {
            "total_revenue": round(float(total_rev), 2),
            "total_orders": int(total_orders),
            "average_order_value": round(float(total_rev) / max(1, total_orders), 2),
            "total_customers": int(total_customers),
            "total_products": int(total_products)
        },
        "top_performing_products": [
            {
                "product_name": p.name,
                "category": p.category,
                "units_sold": int(p.units_sold or 0),
                "revenue": round(float(p.revenue or 0), 2)
            }
            for p in top_prods
        ],
        "category_distribution": [
            {
                "category": c.category,
                "revenue": round(float(c.revenue or 0), 2),
                "order_count": int(c.order_count or 0)
            }
            for c in cat_breakdown
        ],
        "forecast_metrics": forecast_summary.get("metrics", {}),
        "customer_segments": seg_summary.get("segment_summaries", []),
        "churn_metrics": churn_summary.get("metrics", {})
    }

    # Save report
    db_report = Report(
        title=report_title,
        report_type="EXECUTIVE_SUMMARY",
        summary=summary_text,
        metrics_snapshot=report_data["kpis"],
        ai_insights={
            "forecast_interpretation": forecast_summary.get("business_interpretation"),
            "churn_insights": churn_summary.get("summary_insights"),
            "segment_interpretation": seg_summary.get("interpretation")
        },
        created_by=current_user.name
    )
    db.add(db_report)
    db.commit()

    return {
        "success": True,
        "report": report_data
    }
