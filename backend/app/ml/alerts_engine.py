from sqlalchemy.orm import Session
from app.models.ml_models import Alert
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.customer import Customer
from app.models.sale import Sale


def sync_and_get_alerts(db: Session) -> list[dict]:
    """
    Scans business metrics across inventory, churn, sales anomalies and syncs Alert records.
    """
    # 1. Check Inventory Low Stock Alerts
    inventories = db.query(Inventory).all()
    products = {p.id: p for p in db.query(Product).all()}

    for inv in inventories:
        p = products.get(inv.product_id)
        p_name = p.name if p else f"Product #{inv.product_id}"

        if inv.quantity <= inv.reorder_level:
            existing = db.query(Alert).filter(
                Alert.alert_type == "LOW_STOCK",
                Alert.entity_id == str(inv.product_id),
                Alert.is_resolved == False
            ).first()

            severity = "CRITICAL" if inv.quantity == 0 else ("HIGH" if inv.quantity <= 5 else "MEDIUM")

            if not existing:
                alert = Alert(
                    alert_type="LOW_STOCK",
                    severity=severity,
                    title=f"Low Stock: {p_name}",
                    message=f"Only {inv.quantity} units remaining in stock. Configured reorder threshold is {inv.reorder_level}.",
                    entity_type="PRODUCT",
                    entity_id=str(inv.product_id)
                )
                db.add(alert)

    # 2. Check High Churn Risk Customers
    high_churn_customers = db.query(Customer).filter(
        Customer.churn_risk == "High Risk"
    ).all()

    for cust in high_churn_customers:
        existing = db.query(Alert).filter(
            Alert.alert_type == "CHURN_RISK",
            Alert.entity_id == str(cust.id),
            Alert.is_resolved == False
        ).first()

        if not existing:
            alert = Alert(
                alert_type="CHURN_RISK",
                severity="HIGH",
                title=f"Customer Churn Warning: {cust.name}",
                message=f"Customer '{cust.name}' has been flagged with high churn risk. Consider targeted re-engagement.",
                entity_type="CUSTOMER",
                entity_id=str(cust.id)
            )
            db.add(alert)

    db.commit()

    # Query all active alerts
    all_alerts = db.query(Alert).order_by(
        Alert.is_resolved.asc(),
        Alert.created_at.desc()
    ).all()

    return [
        {
            "id": a.id,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "title": a.title,
            "message": a.message,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "is_read": a.is_read,
            "is_resolved": a.is_resolved,
            "created_at": a.created_at
        }
        for a in all_alerts
    ]


def mark_alert_read(db: Session, alert_id: int) -> bool:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.is_read = True
        db.commit()
        return True
    return False


def resolve_alert(db: Session, alert_id: int) -> bool:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.is_resolved = True
        alert.is_read = True
        db.commit()
        return True
    return False
