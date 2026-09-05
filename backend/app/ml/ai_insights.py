from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.sale import Sale
from app.models.product import Product
from app.models.customer import Customer
from app.models.inventory import Inventory
from app.ml.forecasting import generate_sales_forecast
from app.ml.churn import predict_customer_churn
from app.ml.segmentation import calculate_customer_segmentation


def generate_executive_ai_insights(db: Session) -> dict:
    """
    Synthesizes overall business intelligence across revenue, customer health,
    inventory risks, and future trajectory into actionable executive AI insights.
    """
    total_revenue = db.query(func.coalesce(func.sum(Sale.total_amount), 0)).scalar() or 0.0
    total_orders = db.query(func.count(Sale.id)).scalar() or 0
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    total_products = db.query(func.count(Product.id)).scalar() or 0

    # Low stock items
    low_stock_count = db.query(func.count(Inventory.id)).filter(
        Inventory.quantity <= Inventory.reorder_level
    ).scalar() or 0

    insights = []
    health_score = 85

    # 1. Sales & Growth Insight
    if total_orders > 0:
        forecast_data = generate_sales_forecast(db, forecast_days=30)
        growth_pct = forecast_data.get("metrics", {}).get("growth_rate_pct", 0.0)
        trend = forecast_data.get("metrics", {}).get("trend", "STABLE")

        if growth_pct >= 5.0:
            insights.append({
                "category": "GROWTH",
                "title": "Positive Revenue Trajectory Projected",
                "summary": f"Sales forecasting indicates a +{growth_pct}% revenue surge over the next 30 days.",
                "impact": "POSITIVE",
                "action_items": [
                    "Ensure adequate supplier inventory to fulfill anticipated demand surge.",
                    "Boost ad spend across top-performing product categories."
                ],
                "data_source": "Sales Forecasting Model (Autoregressive Ridge Regression)"
            })
            health_score += 5
        elif growth_pct <= -5.0:
            insights.append({
                "category": "SALES",
                "title": "Projected Demand Softening",
                "summary": f"Revenue is forecasted to dip by {growth_pct}% over the next 30 days based on recent velocity.",
                "impact": "NEGATIVE",
                "action_items": [
                    "Launch mid-season promotional bundles and flash discounts.",
                    "Engage recent regular buyers with targeted incentives."
                ],
                "data_source": "Sales Forecasting Model (Autoregressive Ridge Regression)"
            })
            health_score -= 10
        else:
            insights.append({
                "category": "SALES",
                "title": "Stable Revenue Momentum",
                "summary": f"Consistent sales flow observed with steady volume across catalog items.",
                "impact": "NEUTRAL",
                "action_items": [
                    "Maintain standard inventory replenishment schedule.",
                    "Test cross-sell bundles on checkout."
                ],
                "data_source": "Sales Analytics Engine"
            })

    # 2. Customer Health & Churn Insight
    if total_customers > 0:
        churn_data = predict_customer_churn(db)
        high_risk_count = churn_data.get("metrics", {}).get("high_risk_count", 0)

        if high_risk_count > 0:
            pct_churn = round((high_risk_count / max(1, total_customers)) * 100, 1)
            insights.append({
                "category": "CHURN",
                "title": f"{high_risk_count} High-Value Customers at Risk of Churning",
                "summary": f"{pct_churn}% of your customer base has shown prolonged purchase dormancy exceeding 40+ days.",
                "impact": "CRITICAL" if pct_churn > 20 else "NEGATIVE",
                "action_items": [
                    "Trigger automated win-back SMS/Email sequence with 15% discount code.",
                    "Conduct qualitative customer satisfaction follow-up."
                ],
                "data_source": "Customer Churn Prediction Classifier"
            })
            health_score -= min(15, high_risk_count * 2)

    # 3. Inventory Stock Health Insight
    if low_stock_count > 0:
        insights.append({
            "category": "INVENTORY",
            "title": f"{low_stock_count} Products Breaching Minimum Stock Thresholds",
            "summary": f"Critical stock levels detected which may lead to lost revenue if unaddressed.",
            "impact": "CRITICAL",
            "action_items": [
                "Issue urgent purchase orders for low-stock SKUs immediately.",
                "Adjust safety stock levels for seasonal fast movers."
            ],
            "data_source": "Inventory Monitoring Service"
        })
        health_score -= min(15, low_stock_count * 3)
    else:
        insights.append({
            "category": "INVENTORY",
            "title": "Healthy Warehouse Stock Levels",
            "summary": "All active products meet or exceed configured reorder thresholds.",
            "impact": "POSITIVE",
            "action_items": [
                "Continue standard inventory audit cycle."
            ],
            "data_source": "Inventory Monitoring Service"
        })
        health_score += 5

    # 4. Top Category Performance Insight
    top_categories = (
        db.query(
            Product.category,
            func.sum(Sale.total_amount).label("cat_revenue")
        )
        .join(Sale, Sale.product_id == Product.id)
        .group_by(Product.category)
        .order_by(func.sum(Sale.total_amount).desc())
        .limit(2)
        .all()
    )

    if top_categories:
        leader = top_categories[0]
        insights.append({
            "category": "GROWTH",
            "title": f"'{leader.category}' is Your Strongest Revenue Driver",
            "summary": f"Generated ₹{float(leader.cat_revenue or 0):,.2f} in total sales.",
            "impact": "POSITIVE",
            "action_items": [
                "Expand product variety within this top-performing department.",
                "Feature hero items prominently on sales channels."
            ],
            "data_source": "Product Revenue Analysis"
        })

    # Flatten all action items into strategic next steps
    strategic_next_steps = []
    for ins in insights:
        for action in ins.get("action_items", []):
            if action not in strategic_next_steps:
                strategic_next_steps.append(action)

    if not strategic_next_steps:
        strategic_next_steps = [
            "Maintain current operational momentum across core sales channels.",
            "Schedule weekly inventory audit to prevent stockout bottlenecks."
        ]

    final_health_score = max(35, min(98, health_score))
    if final_health_score >= 80:
        status = "EXCELLENT PERFORMANCE"
    elif final_health_score >= 65:
        status = "GOOD — MINOR ATTENTION NEEDED"
    else:
        status = "ATTENTION REQUIRED"

    return {
        "success": True,
        "overall_health_score": final_health_score,
        "business_status": status,
        "insights": insights,
        "strategic_next_steps": strategic_next_steps,
        "key_metrics": {
            "total_revenue": round(float(total_revenue), 2),
            "total_orders": int(total_orders),
            "total_customers": int(total_customers),
            "total_products": int(total_products),
            "low_stock_count": int(low_stock_count)
        },
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

