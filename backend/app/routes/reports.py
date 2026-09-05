import io
import csv
from datetime import datetime
from fastapi import APIRouter, Depends, Query, Response, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import pandas as pd

from app.database.database import get_db
from app.models.user import User
from app.models.sale import Sale
from app.models.product import Product
from app.models.customer import Customer
from app.models.inventory import Inventory
from app.models.ml_models import Report, CustomerSegment, ChurnPrediction, Anomaly
from app.auth.dependencies import require_role
from app.ml.forecasting import generate_sales_forecast
from app.ml.segmentation import calculate_customer_segmentation
from app.ml.churn import predict_customer_churn
from app.ml.anomaly_detection import detect_all_anomalies
from app.analytics.sales_analytics import get_sales_summary

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

    forecast_summary = generate_sales_forecast(db, forecast_days=30)
    seg_summary = calculate_customer_segmentation(db)
    churn_summary = predict_customer_churn(db)

    report_title = f"Executive Sales Intelligence Digest — {datetime.now().strftime('%B %Y')}"
    summary_text = (
        f"Platform has processed ₹{total_rev:,.2f} in lifetime gross merchandise value across "
        f"{total_orders:,} transactions. Current customer base stands at {total_customers} clients. "
        f"30-day forecast projects {forecast_summary.get('metrics', {}).get('trend', 'STABLE')} trajectory."
    )

    total_cat_rev = sum(float(c.revenue or 0) for c in cat_breakdown) or 1.0

    kpi_dict = {
        "total_revenue": round(float(total_rev), 2),
        "total_orders": int(total_orders),
        "average_order_value": round(float(total_rev) / max(1, total_orders), 2),
        "total_customers": int(total_customers),
        "total_products": int(total_products)
    }

    products_list = [
        {
            "product_name": p.name,
            "category": p.category,
            "quantity_sold": int(p.units_sold or 0),
            "units_sold": int(p.units_sold or 0),
            "revenue": round(float(p.revenue or 0), 2)
        }
        for p in top_prods
    ]

    categories_list = [
        {
            "category": c.category,
            "revenue": round(float(c.revenue or 0), 2),
            "order_count": int(c.order_count or 0),
            "percentage": round((float(c.revenue or 0) / total_cat_rev) * 100, 1)
        }
        for c in cat_breakdown
    ]

    action_items_list = [
        f"Capitalize on top revenue product line: '{products_list[0]['product_name'] if products_list else 'Catalog Best-Sellers'}'.",
        f"Sales forecast trajectory: '{forecast_summary.get('metrics', {}).get('trend', 'STEADY')}' with {forecast_summary.get('metrics', {}).get('growth_rate_pct', 0)}% growth variance.",
        "Execute automated retention triggers for customers in Medium and High Churn risk tiers.",
        "Maintain adequate inventory reorder buffers to prevent stockouts."
    ]

    report_data = {
        "title": report_title,
        "period": f"{datetime.now().strftime('%B %Y')} Active Horizon",
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "generated_by": current_user.name,
        "summary": summary_text,
        "summary_narrative": summary_text,
        "kpis": kpi_dict,
        "kpi_summary": kpi_dict,
        "top_products": products_list,
        "top_performing_products": products_list,
        "top_categories": categories_list,
        "category_distribution": categories_list,
        "action_items": action_items_list,
        "forecast_metrics": forecast_summary.get("metrics", {}),
        "customer_segments": seg_summary.get("segment_summaries", []),
        "churn_metrics": churn_summary.get("metrics", {})
    }

    db_report = Report(
        title=report_title,
        report_type="EXECUTIVE_SUMMARY",
        summary=summary_text,
        metrics_snapshot=kpi_dict,
        ai_insights={
            "forecast_interpretation": forecast_summary.get("business_interpretation"),
            "churn_insights": churn_summary.get("summary_insights"),
            "segment_interpretation": seg_summary.get("interpretation"),
            "action_items": action_items_list
        },
        created_by=current_user.name
    )
    db.add(db_report)
    db.commit()

    return {
        "success": True,
        "report": report_data
    }


@router.get("/sales")
def get_sales_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    """
    Detailed Sales Report covering total revenue, transaction counts, product & category breakdowns.
    """
    summary = get_sales_summary(db)
    sales = db.query(Sale).order_by(Sale.sale_date.desc()).limit(100).all()
    customers = {c.id: c.name for c in db.query(Customer).all()}
    products = {p.id: p.name for p in db.query(Product).all()}

    sales_rows = [
        {
            "id": s.id,
            "invoice_number": s.invoice_number,
            "customer_name": customers.get(s.customer_id, f"Customer #{s.customer_id}"),
            "product_name": products.get(s.product_id, f"Product #{s.product_id}"),
            "quantity": s.quantity,
            "unit_price": s.unit_price,
            "total_amount": s.total_amount,
            "payment_method": s.payment_method,
            "date": s.sale_date.strftime("%Y-%m-%d %H:%M") if hasattr(s.sale_date, "strftime") else str(s.sale_date)
        }
        for s in sales
    ]

    return {
        "success": True,
        "summary": summary,
        "recent_transactions": sales_rows
    }


@router.get("/forecast")
def get_forecast_report(
    days: int = Query(default=30, ge=7, le=180),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    """
    Forecast Report with historical data, future projections, and accuracy metrics.
    """
    return generate_sales_forecast(db, forecast_days=days)


@router.get("/customers")
def get_customer_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    """
    Customer Intelligence Report covering RFM Segments, Lifetime Spend, and Churn Risk.
    """
    segments = calculate_customer_segmentation(db)
    churn = predict_customer_churn(db)
    return {
        "success": True,
        "segments": segments,
        "churn": churn
    }


@router.get("/inventory")
def get_inventory_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    """
    Inventory Status Report covering stock levels, low-stock alerts, out-of-stock items, and valuation.
    """
    inventories = db.query(Inventory).all()
    products = {p.id: p for p in db.query(Product).all()}

    items = []
    total_val = 0.0
    low_stock_count = 0
    out_of_stock_count = 0

    for inv in inventories:
        p = products.get(inv.product_id)
        if not p:
            continue
        val = inv.quantity * p.price
        total_val += val

        status = "IN_STOCK"
        if inv.quantity == 0:
            status = "OUT_OF_STOCK"
            out_of_stock_count += 1
        elif inv.quantity <= inv.reorder_level:
            status = "LOW_STOCK"
            low_stock_count += 1

        items.append({
            "product_id": p.id,
            "product_name": p.name,
            "sku": p.sku,
            "category": p.category,
            "current_stock": inv.quantity,
            "reorder_level": inv.reorder_level,
            "unit_price": p.price,
            "inventory_value": round(val, 2),
            "status": status,
            "location": inv.location
        })

    return {
        "success": True,
        "total_inventory_value": round(total_val, 2),
        "total_items_tracked": len(items),
        "low_stock_count": low_stock_count,
        "out_of_stock_count": out_of_stock_count,
        "inventory_items": items
    }


@router.get("/anomalies")
def get_anomaly_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    """
    Anomaly Report covering sales outliers and inventory discrepancies.
    """
    return detect_all_anomalies(db)


@router.get("/export")
def export_report(
    report_type: str = Query(default="sales", description="'sales', 'forecast', 'customers', 'inventory', 'anomalies'"),
    format: str = Query(default="csv", description="'csv', 'excel', 'pdf'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    """
    Export reports directly as CSV, Excel (.xlsx) or formatted printable HTML/PDF.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # 1. Build DataFrame based on report_type
    if report_type == "sales":
        sales = db.query(Sale).all()
        cust_map = {c.id: c.name for c in db.query(Customer).all()}
        prod_map = {p.id: p for p in db.query(Product).all()}
        data = [
            {
                "Transaction ID": s.id,
                "Invoice Number": s.invoice_number,
                "Date": s.sale_date.strftime("%Y-%m-%d") if hasattr(s.sale_date, "strftime") else str(s.sale_date),
                "Customer": cust_map.get(s.customer_id, "N/A"),
                "Product": prod_map[s.product_id].name if s.product_id in prod_map else "N/A",
                "SKU": prod_map[s.product_id].sku if s.product_id in prod_map else "N/A",
                "Category": prod_map[s.product_id].category if s.product_id in prod_map else "N/A",
                "Quantity": s.quantity,
                "Unit Price (INR)": s.unit_price,
                "Total Revenue (INR)": s.total_amount,
                "Payment Method": s.payment_method
            }
            for s in sales
        ]
        df = pd.DataFrame(data)
        title = f"MarketMind_Sales_Report_{timestamp}"

    elif report_type == "inventory":
        invs = db.query(Inventory).all()
        prod_map = {p.id: p for p in db.query(Product).all()}
        data = [
            {
                "Product ID": inv.product_id,
                "Product Name": prod_map[inv.product_id].name if inv.product_id in prod_map else "N/A",
                "SKU": prod_map[inv.product_id].sku if inv.product_id in prod_map else "N/A",
                "Category": prod_map[inv.product_id].category if inv.product_id in prod_map else "N/A",
                "Current Stock": inv.quantity,
                "Reorder Level": inv.reorder_level,
                "Unit Price": prod_map[inv.product_id].price if inv.product_id in prod_map else 0.0,
                "Total Valuation (INR)": round(inv.quantity * (prod_map[inv.product_id].price if inv.product_id in prod_map else 0.0), 2),
                "Location": inv.location,
                "Status": "OUT_OF_STOCK" if inv.quantity == 0 else ("LOW_STOCK" if inv.quantity <= inv.reorder_level else "IN_STOCK")
            }
            for inv in invs
        ]
        df = pd.DataFrame(data)
        title = f"MarketMind_Inventory_Report_{timestamp}"

    elif report_type == "customers":
        custs = db.query(Customer).all()
        segs = {s.customer_id: s.segment_name for s in db.query(CustomerSegment).all()}
        churns = {c.customer_id: c for c in db.query(ChurnPrediction).all()}
        data = [
            {
                "Customer ID": c.id,
                "Name": c.name,
                "Email": c.email,
                "Phone": c.phone,
                "Segment": segs.get(c.id, c.segment or "New"),
                "Churn Risk": churns[c.id].churn_risk if c.id in churns else c.churn_risk,
                "Churn Probability": churns[c.id].churn_probability if c.id in churns else c.churn_probability,
                "Created At": c.created_at.strftime("%Y-%m-%d") if hasattr(c.created_at, "strftime") else str(c.created_at)
            }
            for c in custs
        ]
        df = pd.DataFrame(data)
        title = f"MarketMind_Customer_Intelligence_Report_{timestamp}"

    elif report_type == "forecast":
        fc_res = generate_sales_forecast(db, forecast_days=30)
        df = pd.DataFrame(fc_res.get("forecast", []))
        title = f"MarketMind_Forecast_Report_{timestamp}"

    else:
        # Anomalies
        anom_res = detect_all_anomalies(db)
        all_anoms = anom_res.get("sales_anomalies", []) + anom_res.get("inventory_anomalies", [])
        df = pd.DataFrame(all_anoms)
        title = f"MarketMind_Anomaly_Report_{timestamp}"

    if df.empty:
        df = pd.DataFrame([{"Message": f"No data records found for {report_type} report."}])

    # 2. Export as requested format
    fmt = format.lower()
    if fmt == "csv":
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={title}.csv"}
        )

    elif fmt in ("excel", "xlsx"):
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl" if "openpyxl" in globals() else None) as writer:
            df.to_excel(writer, index=False, sheet_name=report_type.capitalize()[:30])
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={title}.xlsx"}
        )

    elif fmt in ("pdf", "html"):
        # Generate formatted printable HTML-based PDF document
        html_table = df.to_html(classes="styled-table", index=False)
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>{title}</title>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #1e293b; }}
                h1 {{ color: #0284c7; margin-bottom: 4px; }}
                p {{ color: #64748b; font-size: 14px; margin-top: 0; }}
                .styled-table {{ width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 13px; box-shadow: 0 0 20px rgba(0, 0, 0, 0.05); }}
                .styled-table thead tr {{ background-color: #0284c7; color: #ffffff; text-align: left; }}
                .styled-table th, .styled-table td {{ padding: 12px 15px; border-bottom: 1px solid #e2e8f0; }}
                .styled-table tbody tr:nth-of-type(even) {{ background-color: #f8fafc; }}
                .badge {{ display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }}
            </style>
        </head>
        <body>
            <h1>MarketMind AI — {report_type.replace('_', ' ').capitalize()} Report</h1>
            <p>Generated on {datetime.now().strftime('%B %d, %Y at %H:%M:%S')} | Single Source of Truth</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
            {html_table}
            <p style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px;">MarketMind AI • Small Business Sales Intelligence Platform</p>
        </body>
        </html>
        """
        return Response(
            content=html_content,
            media_type="text/html",
            headers={"Content-Disposition": f"attachment; filename={title}.html"}
        )

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{format}'. Use 'csv', 'excel', or 'pdf'.")
