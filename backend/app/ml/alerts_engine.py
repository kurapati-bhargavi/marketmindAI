from sqlalchemy.orm import Session
from app.models.ml_models import Alert, Anomaly
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.customer import Customer
from app.models.sale import Sale


def sync_and_get_alerts(db: Session) -> list[dict]:
    """
    Centralized Alert System syncing across Inventory (low stock/out-of-stock),
    Churn Risk, Sales Anomalies, and Potential Fraud alerts.
    """
    # 1. Inventory Alerts
    inventories = db.query(Inventory).all()
    products = {p.id: p for p in db.query(Product).all()}

    for inv in inventories:
        p = products.get(inv.product_id)
        p_name = p.name if p else f"Product #{inv.product_id}"

        if inv.quantity == 0:
            existing = db.query(Alert).filter(
                Alert.alert_type.in_(["LOW_STOCK", "OUT_OF_STOCK"]),
                Alert.entity_id == str(inv.product_id),
                Alert.is_resolved == False
            ).first()
            if not existing:
                alert = Alert(
                    alert_type="OUT_OF_STOCK",
                    severity="CRITICAL",
                    title=f"Critical Out of Stock: {p_name}",
                    message=f"Product '{p_name}' has 0 units remaining. Reorder threshold is {inv.reorder_level}.",
                    entity_type="PRODUCT",
                    entity_id=str(inv.product_id)
                )
                db.add(alert)
        elif inv.quantity <= inv.reorder_level:
            existing = db.query(Alert).filter(
                Alert.alert_type.in_(["LOW_STOCK", "OUT_OF_STOCK"]),
                Alert.entity_id == str(inv.product_id),
                Alert.is_resolved == False
            ).first()
            if not existing:
                alert = Alert(
                    alert_type="LOW_STOCK",
                    severity="HIGH" if inv.quantity <= 3 else "MEDIUM",
                    title=f"Low Stock Alert: {p_name}",
                    message=f"Product '{p_name}' is at {inv.quantity} units (Threshold: {inv.reorder_level}).",
                    entity_type="PRODUCT",
                    entity_id=str(inv.product_id)
                )
                db.add(alert)

    # 2. High Churn Risk Customers
    high_churn_customers = db.query(Customer).filter(
        Customer.churn_risk.in_(["High Risk", "HIGH"])
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
                title=f"High Churn Risk: {cust.name}",
                message=f"Customer '{cust.name}' has high churn probability. Trigger personalized retention discount.",
                entity_type="CUSTOMER",
                entity_id=str(cust.id)
            )
            db.add(alert)

    try:
        db.commit()
    except Exception:
        db.rollback()

    # Query all active alerts
    all_alerts = db.query(Alert).order_by(
        Alert.is_resolved.asc(),
        Alert.created_at.desc()
    ).all()

    output = []
    for a in all_alerts:
        # Generate recommended action
        if a.alert_type in ("LOW_STOCK", "OUT_OF_STOCK"):
            action = "Dispatch purchase order to replenish inventory."
        elif a.alert_type == "CHURN_RISK":
            action = "Trigger automated VIP re-engagement email with 20% discount coupon."
        elif "ANOMALY" in a.alert_type:
            action = "Review transaction audit log and verify order authenticity."
        else:
            action = "Acknowledge alert and monitor sales trajectory."

        output.append({
            "id": a.id,
            "alert_type": a.alert_type,
            "type": a.alert_type,
            "severity": a.severity,
            "title": a.title,
            "message": a.message,
            "description": a.message,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "entity": f"{a.entity_type}: {a.entity_id}" if a.entity_type else "System",
            "is_read": a.is_read,
            "is_resolved": a.is_resolved,
            "status": "RESOLVED" if a.is_resolved else "ACTIVE",
            "created_at": a.created_at,
            "timestamp": a.created_at,
            "recommended_action": action
        })

    return output


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
