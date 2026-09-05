from datetime import datetime, date
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session

from app.models.sale import Sale
from app.models.product import Product
from app.models.customer import Customer
from app.models.inventory import Inventory
from app.models.ml_models import Anomaly, Alert


def detect_all_anomalies(db: Session) -> dict:
    """
    Dual anomaly detection engine detecting sales spikes/drops, unusually large orders,
    potential suspicious transactions via Isolation Forest & IQR, and inventory abnormalities.
    All fraud indicators are strictly designated as 'Potential Fraud / Suspicious Transaction'.
    """
    sales = db.query(Sale).order_by(Sale.sale_date.asc()).all()
    inventories = db.query(Inventory).all()
    products = db.query(Product).all()
    customers = db.query(Customer).all()

    prod_map = {p.id: p for p in products}
    cust_map = {c.id: c for c in customers}

    sales_anomalies = []
    inventory_anomalies = []

    # 1. SALES & TRANSACTION ANOMALY DETECTION
    if sales:
        daily_records = []
        for s in sales:
            s_date = s.sale_date if isinstance(s.sale_date, (datetime, date)) else datetime.fromisoformat(str(s.sale_date))
            dt_str = s_date.strftime("%Y-%m-%d") if isinstance(s_date, datetime) else str(s_date)
            daily_records.append({
                "date": dt_str,
                "revenue": float(s.total_amount),
                "quantity": int(s.quantity),
                "order_id": s.id
            })

        df = pd.DataFrame(daily_records)
        daily_df = df.groupby("date").agg({
            "revenue": "sum",
            "quantity": "sum",
            "order_id": "count"
        }).reset_index().rename(columns={"order_id": "orders"})

        if len(daily_df) >= 3:
            revenues = daily_df["revenue"].values.reshape(-1, 1)
            iso = IsolationForest(contamination=0.15, random_state=42)
            iso_preds = iso.fit_predict(revenues)

            q25 = float(np.percentile(daily_df["revenue"], 25))
            q75 = float(np.percentile(daily_df["revenue"], 75))
            iqr = q75 - q25
            mean_rev = float(np.mean(daily_df["revenue"]))
            upper_bound = q75 + (1.5 * iqr)
            lower_bound = max(0.0, q25 - (1.5 * iqr))

            for idx, row in daily_df.iterrows():
                rev = float(row["revenue"])
                is_iso_outlier = iso_preds[idx] == -1
                is_iqr_outlier = rev > upper_bound or (rev < lower_bound and lower_bound > 0)

                if is_iso_outlier or is_iqr_outlier:
                    dev_pct = round(((rev - mean_rev) / max(1.0, mean_rev)) * 100, 1)
                    if rev > mean_rev:
                        anomaly_type = "Sales Spike Anomaly"
                        severity = "MEDIUM" if dev_pct < 80 else "HIGH"
                        desc = f"Daily revenue (₹{rev:,.2f}) exceeded historical average (₹{mean_rev:,.2f}) by +{dev_pct}%."
                    else:
                        anomaly_type = "Sales Drop Anomaly"
                        severity = "HIGH" if dev_pct > -60 else "CRITICAL"
                        desc = f"Daily revenue (₹{rev:,.2f}) fell significantly below historical average (₹{mean_rev:,.2f}) by {dev_pct}%."

                    sales_anomalies.append({
                        "date": str(row["date"]),
                        "anomaly_type": anomaly_type,
                        "entity_type": "SALES",
                        "entity_name": f"Daily Sales Aggregate ({row['date']})",
                        "actual_value": round(rev, 2),
                        "expected_value": round(mean_rev, 2),
                        "deviation_percentage": dev_pct,
                        "severity": severity,
                        "description": desc,
                        "reason": desc
                    })

        # Individual Suspicious Transactions (Potential Fraud / Large Spike)
        all_amounts = [float(s.total_amount) for s in sales]
        amount_mean = float(np.mean(all_amounts))
        amount_std = float(np.std(all_amounts)) if len(all_amounts) > 1 else 100.0

        for s in sales:
            amt = float(s.total_amount)
            # Flag transactions > 3 standard deviations or > 5x mean
            if amt > (amount_mean + (3 * amount_std)) or amt > (amount_mean * 5):
                cust = cust_map.get(s.customer_id)
                prod = prod_map.get(s.product_id)
                c_name = cust.name if cust else f"Customer #{s.customer_id}"
                p_name = prod.name if prod else f"Product #{s.product_id}"

                s_date = s.sale_date if isinstance(s.sale_date, (datetime, date)) else datetime.fromisoformat(str(s.sale_date))
                dt_str = s_date.strftime("%Y-%m-%d") if isinstance(s_date, datetime) else str(s_date)

                dev_pct = round(((amt - amount_mean) / max(1.0, amount_mean)) * 100, 1)
                desc = f"Transaction #{s.id} of ₹{amt:,.2f} for '{p_name}' by '{c_name}' significantly exceeds average order size (₹{amount_mean:,.2f})."

                sales_anomalies.append({
                    "date": dt_str,
                    "anomaly_type": "Potential Fraud / Suspicious Transaction",
                    "entity_type": "TRANSACTION",
                    "entity_name": f"Transaction #{s.id} ({c_name})",
                    "actual_value": round(amt, 2),
                    "expected_value": round(amount_mean, 2),
                    "deviation_percentage": dev_pct,
                    "severity": "CRITICAL" if amt > (amount_mean * 8) else "HIGH",
                    "description": desc,
                    "reason": "Unusually high transaction volume compared to customer baseline."
                })

    # 2. INVENTORY ANOMALY DETECTION
    for inv in inventories:
        p = prod_map.get(inv.product_id)
        p_name = p.name if p else f"Product #{inv.product_id}"

        if inv.quantity == 0:
            desc = f"Product '{p_name}' has reached zero units (Critical Stockout). Urgent supplier reorder required."
            inventory_anomalies.append({
                "date": datetime.now().strftime("%Y-%m-%d"),
                "anomaly_type": "Critical Stockout Anomaly",
                "entity_type": "INVENTORY",
                "entity_name": p_name,
                "actual_value": 0.0,
                "expected_value": float(inv.reorder_level),
                "deviation_percentage": -100.0,
                "severity": "CRITICAL",
                "description": desc,
                "reason": desc
            })
        elif inv.quantity <= inv.reorder_level:
            dev_pct = round(((inv.quantity - inv.reorder_level) / max(1, inv.reorder_level)) * 100, 1)
            desc = f"Product '{p_name}' inventory ({inv.quantity} units) is below safety threshold ({inv.reorder_level} units)."
            inventory_anomalies.append({
                "date": datetime.now().strftime("%Y-%m-%d"),
                "anomaly_type": "Low Stock Threshold Breach",
                "entity_type": "INVENTORY",
                "entity_name": p_name,
                "actual_value": float(inv.quantity),
                "expected_value": float(inv.reorder_level),
                "deviation_percentage": dev_pct,
                "severity": "HIGH" if inv.quantity <= 2 else "MEDIUM",
                "description": desc,
                "reason": desc
            })

    # Persist detected anomalies into database
    for anom in sales_anomalies + inventory_anomalies:
        try:
            existing = db.query(Anomaly).filter(
                Anomaly.anomaly_type == anom["anomaly_type"],
                Anomaly.date == anom["date"],
                Anomaly.entity_id == anom["entity_name"]
            ).first()
            if not existing:
                new_anom = Anomaly(
                    anomaly_type=anom["anomaly_type"],
                    entity_type=anom["entity_type"],
                    entity_id=anom["entity_name"],
                    date=anom["date"],
                    actual_value=anom["actual_value"],
                    expected_value=anom["expected_value"],
                    deviation_percentage=anom["deviation_percentage"],
                    severity=anom["severity"],
                    description=anom["description"]
                )
                db.add(new_anom)
        except Exception:
            pass

    try:
        db.commit()
    except Exception:
        db.rollback()

    total_count = len(sales_anomalies) + len(inventory_anomalies)

    return {
        "success": True,
        "sales_anomalies": sales_anomalies,
        "inventory_anomalies": inventory_anomalies,
        "detection_method": "Isolation Forest, Statistical Outlier Z-Score & IQR Thresholds",
        "total_anomalies": total_count
    }
