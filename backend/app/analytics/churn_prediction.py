from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.models.sale import Sale
from app.models.customer import Customer


def get_churn_prediction(db: Session):
    """
    Baseline customer churn prediction.

    Customers are classified using:
    - Recency: how recently they purchased
    - Frequency: number of orders
    - Monetary value: total spending
    """

    results = (
        db.query(
            Customer.id.label("customer_id"),
            Customer.name.label("customer_name"),
            func.max(Sale.sale_date).label("last_purchase"),
            func.count(Sale.id).label("total_orders"),
            func.sum(Sale.total_amount).label("total_revenue")
        )
        .join(
            Sale,
            Sale.customer_id == Customer.id
        )
        .group_by(
            Customer.id,
            Customer.name
        )
        .all()
    )

    predictions = []

    today = datetime.now()

    for row in results:

        total_orders = int(row.total_orders or 0)
        total_revenue = float(row.total_revenue or 0)

        if row.last_purchase:
            days_since_purchase = (
                today.date() - row.last_purchase.date()
            ).days
        else:
            days_since_purchase = 999

        # ------------------------------------------
        # Calculate churn score
        # ------------------------------------------

        score = 0

        # Recency
        if days_since_purchase > 30:
            score += 50
        elif days_since_purchase > 14:
            score += 30
        elif days_since_purchase > 7:
            score += 15

        # Frequency
        if total_orders <= 1:
            score += 30
        elif total_orders <= 3:
            score += 15

        # Monetary value
        if total_revenue < 10000:
            score += 20
        elif total_revenue < 25000:
            score += 10

        # ------------------------------------------
        # Determine risk
        # ------------------------------------------

        if score >= 60:
            risk = "High Risk"

        elif score >= 30:
            risk = "Medium Risk"

        else:
            risk = "Low Risk"

        predictions.append(
            {
                "customer_id": row.customer_id,
                "customer_name": row.customer_name,
                "last_purchase": str(row.last_purchase),
                "days_since_purchase": days_since_purchase,
                "total_orders": total_orders,
                "total_revenue": total_revenue,
                "churn_score": score,
                "churn_risk": risk
            }
        )

    return predictions