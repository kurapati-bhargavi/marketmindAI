from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.sale import Sale


def get_sales_anomalies(db: Session):

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

    revenues = [
        float(row.revenue or 0)
        for row in results
    ]

    average_revenue = sum(revenues) / len(revenues)

    anomalies = []

    for row in results:

        revenue = float(row.revenue or 0)

        # Avoid division by zero
        if average_revenue == 0:
            deviation = 0
        else:
            deviation = (
                abs(revenue - average_revenue)
                / average_revenue
            ) * 100

        # Flag values that differ significantly
        if deviation >= 50:

            if revenue > average_revenue:
                anomaly_type = "Unusually High Sales"
            else:
                anomaly_type = "Unusually Low Sales"

            anomalies.append(
                {
                    "date": str(row.date),
                    "revenue": revenue,
                    "average_revenue": round(
                        average_revenue, 2
                    ),
                    "deviation_percentage": round(
                        deviation, 2
                    ),
                    "anomaly_type": anomaly_type
                }
            )

    return anomalies