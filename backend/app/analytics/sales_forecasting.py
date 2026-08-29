from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.sale import Sale


def get_sales_forecast(db: Session, days: int = 7):
    """
    Simple sales forecasting based on historical daily revenue.

    This is a baseline forecasting method.
    It can later be replaced with an ML/time-series model
    when sufficient historical data is available.
    """

    # Get daily revenue
    results = (
        db.query(
            func.date(Sale.sale_date).label("date"),
            func.sum(Sale.total_amount).label("revenue")
        )
        .group_by(
            func.date(Sale.sale_date)
        )
        .order_by(
            func.date(Sale.sale_date)
        )
        .all()
    )

    if not results:
        return []

    # Convert database results
    historical = [
        {
            "date": str(row.date),
            "revenue": float(row.revenue or 0)
        }
        for row in results
    ]

    # Calculate average daily revenue
    total_revenue = sum(
        item["revenue"] for item in historical
    )

    average_revenue = (
        total_revenue / len(historical)
    )

    # Generate forecast
    from datetime import date, timedelta

    last_date = date.fromisoformat(
        historical[-1]["date"]
    )

    forecast = []

    for i in range(1, days + 1):

        forecast_date = (
            last_date + timedelta(days=i)
        )

        forecast.append(
            {
                "date": str(forecast_date),
                "predicted_revenue": round(
                    average_revenue,
                    2
                )
            }
        )

    return {
        "historical": historical,
        "forecast": forecast
    }