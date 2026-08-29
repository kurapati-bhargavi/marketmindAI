from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.customer import Customer
from app.models.sale import Sale


def get_customer_segments(db: Session):

    results = (
        db.query(
            Customer.id.label("customer_id"),
            Customer.name.label("customer_name"),
            func.max(Sale.sale_date).label("last_purchase"),
            func.count(Sale.id).label("frequency"),
            func.sum(Sale.total_amount).label("monetary")
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

    segments = []

    now = datetime.now(timezone.utc)

    for row in results:

        last_purchase = row.last_purchase

        # Handle database datetime without timezone
        if last_purchase.tzinfo is None:
            now_naive = now.replace(tzinfo=None)
            recency = (now_naive - last_purchase).days
        else:
            recency = (now - last_purchase).days

        frequency = int(row.frequency or 0)
        monetary = float(row.monetary or 0)

        # Simple business segmentation
        if recency <= 30 and frequency >= 5:
            segment = "High Value Customer"

        elif recency <= 60 and frequency >= 2:
            segment = "Regular Customer"

        elif recency > 90:
            segment = "At Risk Customer"

        else:
            segment = "Occasional Customer"

        segments.append({
            "customer_id": row.customer_id,
            "customer_name": row.customer_name,
            "recency_days": recency,
            "frequency": frequency,
            "monetary": monetary,
            "segment": segment
        })

    return segments