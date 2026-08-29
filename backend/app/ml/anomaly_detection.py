from datetime import datetime, date
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session

from app.models.sale import Sale
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.ml_models import Anomaly, Alert


def detect_all_anomalies(db: Session) -> dict:
    """
    Dual anomaly detection engine detecting sales spikes/drops via Isolation Forest & IQR,
    and inventory stock abnormalities (depletions, stockouts).
    """
    sales = db.query(Sale).order_by(Sale.sale_date.asc()).all()
    inventories = db.query(Inventory).all()
    products = db.query(Product).all()

    prod_map = {p.id: p for p in products}

    sales_anomalies = []
    inventory_anomalies = []

    # 1. SALES ANOMALY DETECTION
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

        if len(daily_df) >= 5:
            revenues = daily_df["revenue"].values.reshape(-1, 1)
            # Isolation Forest
            iso = IsolationForest(contamination=0.10, random_state=42)
            iso_preds = iso.fit_predict(revenues)

            # Statistical IQR & Z-score
            q25 = float(np.percentile(daily_df["revenue"], 25))
            q75 = float(np.percentile(daily_df["revenue"], 75))
            iqr = q75 - q25
            median_rev = float(np.median(daily_df["revenue"]))
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
                        anomaly_type = "Unusually High Sales Spike"
                        severity = "INFO" if dev_pct < 80 else "WARNING"
                        desc = f"Daily revenue (₹{rev:,.2f}) exceeded expected average (₹{mean_rev:,.2f}) by +{dev_pct}%."
                    else:
                        anomaly_type = "Unusually Low Sales Drop"
                        severity = "WARNING" if dev_pct > -60 else "CRITICAL"
                        desc = f"Daily revenue (₹{rev:,.2f}) dropped significantly below expected average (₹{mean_rev:,.2f}) by {dev_pct}%."

                    sales_anomalies.append({
                        "date": str(row["date"]),
                        "anomaly_type": anomaly_type,
                        "entity_type": "SALES",
                        "entity_name": f"Daily Sales ({row['date']})",
                        "actual_value": round(rev, 2),
                        "expected_value": round(mean_rev, 2),
                        "deviation_percentage": dev_pct,
                        "severity": severity,
                        "description": desc
                    })

    # 2. INVENTORY ANOMALY DETECTION
    for inv in inventories:
        p = prod_map.get(inv.product_id)
        p_name = p.name if p else f"Product #{inv.product_id}"

        # Critical stockout
        if inv.quantity == 0:
            inventory_anomalies.append({
                "date": datetime.now().strftime("%Y-%m-%d"),
                "anomaly_type": "Critical Stockout Anomaly",
                "entity_type": "INVENTORY",
                "entity_name": p_name,
                "actual_value": 0.0,
                "expected_value": float(inv.reorder_level),
                "deviation_percentage": -100.0,
                "severity": "CRITICAL",
                "description": f"Product '{p_name}' has reached zero inventory. Immediate supplier restocking required."
            })
        elif inv.quantity <= inv.reorder_level:
            dev_pct = round(((inv.quantity - inv.reorder_level) / max(1, inv.reorder_level)) * 100, 1)
            inventory_anomalies.append({
                "date": datetime.now().strftime("%Y-%m-%d"),
                "anomaly_type": "Low Stock Threshold Breach",
                "entity_type": "INVENTORY",
                "entity_name": p_name,
                "actual_value": float(inv.quantity),
                "expected_value": float(inv.reorder_level),
                "deviation_percentage": dev_pct,
                "severity": "WARNING",
                "description": f"Product '{p_name}' inventory ({inv.quantity} units) is below reorder threshold ({inv.reorder_level} units)."
            })

    # Persist anomalies into database
    for anom in sales_anomalies + inventory_anomalies:
        existing = db.query(Anomaly).filter(
            Anomaly.anomaly_type == anom["anomaly_type"],
            Anomaly.date == anom["date"],
            Anomaly.entity_name == anom["entity_name"]
        ).first() if hasattr(Anomaly, "entity_name") else None

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

    db.commit()

    total_count = len(sales_anomalies) + len(inventory_anomalies)

    return {
        "success": True,
        "sales_anomalies": sales_anomalies,
        "inventory_anomalies": inventory_anomalies,
        "detection_method": "Isolation Forest & Rolling Interquartile Range (IQR) Thresholds",
        "total_anomalies": total_count
    }
