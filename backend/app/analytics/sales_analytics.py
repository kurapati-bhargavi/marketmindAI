from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.sale import Sale
from app.models.product import Product
from app.models.customer import Customer
from app.models.inventory import Inventory


def get_sales_summary(db: Session) -> dict:
    total_revenue = db.query(func.coalesce(func.sum(Sale.total_amount), 0)).scalar() or 0.0
    total_orders = db.query(func.count(Sale.id)).scalar() or 0
    total_items_sold = db.query(func.coalesce(func.sum(Sale.quantity), 0)).scalar() or 0
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    total_products = db.query(func.count(Product.id)).filter(Product.is_active == True).scalar() or 0

    low_stock_count = db.query(func.count(Inventory.id)).filter(
        Inventory.quantity <= Inventory.reorder_level
    ).scalar() or 0

    avg_order_val = (total_revenue / total_orders) if total_orders > 0 else 0.0

    return {
        "total_revenue": round(float(total_revenue), 2),
        "total_orders": int(total_orders),
        "total_items_sold": int(total_items_sold),
        "average_order_value": round(float(avg_order_val), 2),
        "total_customers": int(total_customers),
        "total_products": int(total_products),
        "low_stock_products": int(low_stock_count)
    }


def get_monthly_sales(db: Session) -> list[dict]:
    sales = db.query(Sale).all()
    if not sales:
        return []

    monthly = {}
    for s in sales:
        dt = s.sale_date if isinstance(s.sale_date, datetime) else datetime.fromisoformat(str(s.sale_date))
        m_key = dt.strftime("%Y-%m")
        if m_key not in monthly:
            monthly[m_key] = {"revenue": 0.0, "orders": 0, "items_sold": 0}
        monthly[m_key]["revenue"] += float(s.total_amount)
        monthly[m_key]["orders"] += 1
        monthly[m_key]["items_sold"] += int(s.quantity)

    sorted_months = sorted(monthly.keys())
    return [
        {
            "month": m,
            "revenue": round(monthly[m]["revenue"], 2),
            "orders": monthly[m]["orders"],
            "items_sold": monthly[m]["items_sold"]
        }
        for m in sorted_months
    ]


def get_daily_sales_trend(db: Session, days: int = 30) -> list[dict]:
    sales = db.query(Sale).all()
    if not sales:
        return []

    cutoff = datetime.now() - timedelta(days=days)
    daily = {}
    for s in sales:
        dt = s.sale_date if isinstance(s.sale_date, datetime) else datetime.fromisoformat(str(s.sale_date))
        if dt >= cutoff:
            d_key = dt.strftime("%Y-%m-%d")
            if d_key not in daily:
                daily[d_key] = {"revenue": 0.0, "orders": 0, "items": 0}
            daily[d_key]["revenue"] += float(s.total_amount)
            daily[d_key]["orders"] += 1
            daily[d_key]["items"] += int(s.quantity)

    sorted_days = sorted(daily.keys())
    return [
        {
            "date": d,
            "revenue": round(daily[d]["revenue"], 2),
            "orders": daily[d]["orders"],
            "items": daily[d]["items"]
        }
        for d in sorted_days
    ]


def get_product_sales(db: Session, limit: int = 10) -> list[dict]:
    results = (
        db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            Product.category.label("category"),
            func.sum(Sale.quantity).label("quantity_sold"),
            func.sum(Sale.total_amount).label("revenue")
        )
        .join(Sale, Sale.product_id == Product.id)
        .group_by(Product.id, Product.name, Product.category)
        .order_by(desc(func.sum(Sale.total_amount)))
        .limit(limit)
        .all()
    )

    return [
        {
            "product_id": r.product_id,
            "product_name": r.product_name,
            "category": r.category,
            "quantity_sold": int(r.quantity_sold or 0),
            "revenue": round(float(r.revenue or 0), 2)
        }
        for r in results
    ]


def get_category_sales(db: Session) -> list[dict]:
    results = (
        db.query(
            Product.category,
            func.sum(Sale.total_amount).label("revenue"),
            func.sum(Sale.quantity).label("units_sold"),
            func.count(Sale.id).label("order_count")
        )
        .join(Sale, Sale.product_id == Product.id)
        .group_by(Product.category)
        .order_by(desc(func.sum(Sale.total_amount)))
        .all()
    )

    total_revenue = sum(float(r.revenue or 0) for r in results) or 1.0

    return [
        {
            "category": r.category or "Other",
            "revenue": round(float(r.revenue or 0), 2),
            "units_sold": int(r.units_sold or 0),
            "order_count": int(r.order_count or 0),
            "percentage": round((float(r.revenue or 0) / total_revenue) * 100, 1)
        }
        for r in results
    ]


def get_customer_sales(db: Session, limit: int = 15) -> list[dict]:
    results = (
        db.query(
            Customer.id.label("customer_id"),
            Customer.name.label("customer_name"),
            Customer.email.label("email"),
            Customer.segment.label("segment"),
            func.count(Sale.id).label("total_orders"),
            func.sum(Sale.quantity).label("items_purchased"),
            func.sum(Sale.total_amount).label("total_revenue"),
            func.max(Sale.sale_date).label("last_purchase")
        )
        .join(Sale, Sale.customer_id == Customer.id)
        .group_by(Customer.id)
        .order_by(desc(func.sum(Sale.total_amount)))
        .limit(limit)
        .all()
    )

    return [
        {
            "customer_id": r.customer_id,
            "customer_name": r.customer_name,
            "email": r.email,
            "segment": r.segment or "New",
            "total_orders": int(r.total_orders or 0),
            "items_purchased": int(r.items_purchased or 0),
            "total_revenue": round(float(r.total_revenue or 0), 2),
            "last_purchase": r.last_purchase.strftime("%Y-%m-%d") if r.last_purchase else None
        }
        for r in results
    ]