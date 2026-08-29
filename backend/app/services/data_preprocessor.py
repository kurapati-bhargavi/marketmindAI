import csv
import io
import hashlib
from datetime import datetime
from typing import Any
import pandas as pd


COLUMN_SYNONYMS = {
    "customer_name": ["customer_name", "customer", "client_name", "buyer_name", "customer_full_name", "name"],
    "customer_email": ["customer_email", "email", "client_email", "buyer_email"],
    "customer_phone": ["customer_phone", "phone", "phone_number", "contact", "mobile"],
    "product_name": ["product_name", "product", "item_name", "item", "product_title", "title"],
    "category": ["category", "product_category", "item_category", "department"],
    "quantity": ["quantity", "qty", "units", "items_count", "volume"],
    "unit_price": ["unit_price", "price", "rate", "cost_per_unit", "selling_price"],
    "total_amount": ["total_amount", "total", "amount", "revenue", "net_amount", "subtotal"],
    "sale_date": ["sale_date", "date", "transaction_date", "order_date", "invoice_date", "timestamp"],
    "payment_method": ["payment_method", "payment_type", "payment", "mode_of_payment"],
}


def normalize_column_name(col: str) -> str:
    cleaned = col.strip().lower().replace("-", "_").replace(" ", "_")
    for standard_col, synonyms in COLUMN_SYNONYMS.items():
        if cleaned in synonyms:
            return standard_col
    return cleaned


def parse_date_safely(val: Any) -> datetime:
    if not val:
        return datetime.now()
    val_str = str(val).strip()
    # Try ISO format
    try:
        return datetime.fromisoformat(val_str)
    except Exception:
        pass
    # Common date formats
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d", "%Y-%m-%d %H:%M:%S", "%d-%m-%Y"):
        try:
            return datetime.strptime(val_str, fmt)
        except Exception:
            continue
    return datetime.now()


def validate_and_preprocess_csv(contents: bytes, filename: str) -> dict[str, Any]:
    """
    Validates and preprocesses raw CSV bytes.
    Returns preview metadata, parsed rows, and detected validation errors.
    """
    file_hash = hashlib.sha256(contents).hexdigest()

    try:
        text = contents.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            text = contents.decode("latin-1")
        except Exception:
            return {
                "valid": False,
                "message": "File encoding not supported. Please use UTF-8 encoded CSV.",
                "file_hash": file_hash
            }

    try:
        df = pd.read_csv(io.StringIO(text))
    except Exception as e:
        return {
            "valid": False,
            "message": f"Could not parse CSV: {str(e)}",
            "file_hash": file_hash
        }

    if df.empty:
        return {
            "valid": False,
            "message": "The uploaded CSV file is empty.",
            "file_hash": file_hash
        }

    # Normalize column names
    col_mapping = {col: normalize_column_name(col) for col in df.columns}
    df = df.rename(columns=col_mapping)

    # Check required fields
    required_fields = ["customer_name", "product_name", "quantity", "unit_price"]
    missing = [rf for rf in required_fields if rf not in df.columns]
    if missing:
        return {
            "valid": False,
            "message": f"Missing required columns: {', '.join(missing)}",
            "detected_columns": list(df.columns),
            "missing_columns": missing,
            "file_hash": file_hash
        }

    valid_rows = []
    invalid_rows = []

    for idx, row in df.iterrows():
        row_num = idx + 2  # 1-indexed header + 1
        errors = []

        # Customer name
        cust_name = str(row.get("customer_name", "")).strip()
        if not cust_name or cust_name.lower() in ("nan", "none", "null", ""):
            errors.append("customer_name cannot be empty")

        # Product name
        prod_name = str(row.get("product_name", "")).strip()
        if not prod_name or prod_name.lower() in ("nan", "none", "null", ""):
            errors.append("product_name cannot be empty")

        # Quantity
        try:
            qty_raw = row.get("quantity")
            qty = int(float(qty_raw))
            if qty <= 0:
                errors.append("quantity must be greater than 0")
        except Exception:
            errors.append(f"invalid quantity value: {row.get('quantity')}")
            qty = 0

        # Unit price
        try:
            price_raw = row.get("unit_price")
            unit_price = float(price_raw)
            if unit_price < 0:
                errors.append("unit_price cannot be negative")
        except Exception:
            errors.append(f"invalid unit_price value: {row.get('unit_price')}")
            unit_price = 0.0

        # Category
        category = str(row.get("category", "")).strip()
        if category.lower() in ("nan", "none", "null", ""):
            category = "General Retail"

        # Email & Phone
        cust_email = str(row.get("customer_email", "")).strip()
        if cust_email.lower() in ("nan", "none", "null", ""):
            # Generate deterministic fallback email if not present
            clean_cust = "".join(c for c in cust_name.lower() if c.isalnum())
            cust_email = f"{clean_cust}@customer.marketmind.ai"

        cust_phone = str(row.get("customer_phone", "")).strip()
        if cust_phone.lower() in ("nan", "none", "null", ""):
            cust_phone = None

        # Payment method
        payment_method = str(row.get("payment_method", "CARD")).strip().upper()
        if payment_method.lower() in ("nan", "none", "null", ""):
            payment_method = "CARD"

        # Sale date
        sale_date = parse_date_safely(row.get("sale_date"))

        # Total amount
        total_amount = round(qty * unit_price, 2)

        if errors:
            invalid_rows.append({
                "row_number": row_num,
                "data": row.to_dict(),
                "errors": errors
            })
        else:
            valid_rows.append({
                "customer_name": cust_name,
                "customer_email": cust_email,
                "customer_phone": cust_phone,
                "product_name": prod_name,
                "category": category,
                "quantity": qty,
                "unit_price": unit_price,
                "total_amount": total_amount,
                "payment_method": payment_method,
                "sale_date": sale_date,
            })

    total_rows = len(df)
    valid_count = len(valid_rows)
    invalid_count = len(invalid_rows)

    return {
        "valid": valid_count > 0,
        "message": f"Processed {total_rows} rows: {valid_count} valid, {invalid_count} invalid.",
        "filename": filename,
        "file_hash": file_hash,
        "total_rows": total_rows,
        "valid_rows_count": valid_count,
        "invalid_rows_count": invalid_count,
        "valid_rows": valid_rows,
        "invalid_rows": invalid_rows[:50],  # cap preview of errors
        "sample_preview": [
            {
                "customer_name": r["customer_name"],
                "product_name": r["product_name"],
                "category": r["category"],
                "quantity": r["quantity"],
                "unit_price": r["unit_price"],
                "total_amount": r["total_amount"],
                "sale_date": r["sale_date"].strftime("%Y-%m-%d"),
            }
            for r in valid_rows[:10]
        ]
    }
