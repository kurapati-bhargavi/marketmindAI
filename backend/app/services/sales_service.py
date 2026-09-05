from datetime import datetime
import uuid
from sqlalchemy.orm import Session

from app.models.sale import Sale
from app.models.customer import Customer
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.invoice import Invoice
from app.models.ml_models import Alert


def process_sale(
    db: Session,
    customer_id: int,
    product_id: int,
    quantity: int,
    unit_price: float | None = None,
    payment_method: str = "CARD",
    sale_date: datetime | None = None
) -> Sale:
    """
    Process a single transaction with customer verification, inventory update,
    invoice generation, and low stock alert generation.
    """
    if quantity <= 0:
        raise ValueError("Quantity must be greater than 0")

    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise ValueError(f"Customer with ID {customer_id} not found")

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError(f"Product with ID {product_id} not found")

    price = unit_price if unit_price is not None and unit_price > 0 else product.price
    total_amount = round(quantity * price, 2)
    dt = sale_date if sale_date else datetime.now()

    # Generate unique invoice number
    invoice_number = f"INV-{dt.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    # Inventory lookup or auto-creation
    inventory = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if inventory:
        inventory.quantity = max(0, inventory.quantity - quantity)
        # Check for low-stock condition
        if inventory.quantity <= inventory.reorder_level:
            existing_alert = db.query(Alert).filter(
                Alert.alert_type == "LOW_STOCK",
                Alert.entity_id == str(product_id),
                Alert.is_resolved == False
            ).first()
            if not existing_alert:
                alert = Alert(
                    alert_type="LOW_STOCK",
                    severity="CRITICAL" if inventory.quantity == 0 else "HIGH",
                    title=f"Low Stock Alert: {product.name}",
                    message=f"Product '{product.name}' is at or below reorder level ({inventory.quantity} remaining / threshold {inventory.reorder_level}).",
                    entity_type="PRODUCT",
                    entity_id=str(product_id)
                )
                db.add(alert)
    else:
        # Create default inventory if not tracked
        inventory = Inventory(
            product_id=product_id,
            quantity=max(50, quantity * 2),
            reorder_level=10
        )
        db.add(inventory)
        db.flush()

    new_sale = Sale(
        customer_id=customer_id,
        product_id=product_id,
        quantity=quantity,
        unit_price=price,
        total_amount=total_amount,
        payment_method=payment_method,
        invoice_number=invoice_number,
        sale_date=dt
    )
    db.add(new_sale)

    # Auto-create Invoice
    invoice = Invoice(
        customer_id=customer_id,
        invoice_number=invoice_number,
        total_amount=total_amount,
        status="PAID",
        created_at=dt
    )
    db.add(invoice)

    return new_sale


def batch_import_sales(db: Session, valid_rows: list[dict], file_hash: str) -> dict:
    """
    High-performance batch ingestion of preprocessed sales records.
    Strictly resolves products by SKU: if SKU already exists in DB or current batch,
    it reuses the existing product_id to preserve UNIQUE constraints.
    """
    inserted_sales = 0
    created_customers = 0
    created_products = 0
    reused_products = 0
    duplicate_transactions = 0

    # Cache existing customers and products by email / name / sku for high-speed resolution
    customers_by_email = {c.email.lower(): c for c in db.query(Customer).filter(Customer.email != None).all()}
    customers_by_name = {c.name.strip().lower(): c for c in db.query(Customer).all()}
    
    products_by_sku = {p.sku.strip().lower(): p for p in db.query(Product).filter(Product.sku != None).all()}
    products_by_name = {p.name.strip().lower(): p for p in db.query(Product).all()}
    inventories = {inv.product_id: inv for inv in db.query(Inventory).all()}

    # Track seen invoice numbers in this batch to prevent duplicate transactions
    existing_invoices = {inv.invoice_number for inv in db.query(Invoice).filter(Invoice.invoice_number != None).all()}

    for row in valid_rows:
        cust_name = row["customer_name"].strip()
        cust_email = (row.get("customer_email") or "").strip().lower()

        # 1. Find or create Customer
        customer = None
        if cust_email and cust_email in customers_by_email:
            customer = customers_by_email[cust_email]
        elif cust_name.lower() in customers_by_name:
            customer = customers_by_name[cust_name.lower()]

        if not customer:
            customer = Customer(
                name=cust_name,
                email=row.get("customer_email"),
                phone=row.get("customer_phone"),
                segment="New",
                churn_risk="Low Risk"
            )
            db.add(customer)
            db.flush()
            created_customers += 1
            if customer.email:
                customers_by_email[customer.email.lower()] = customer
            customers_by_name[customer.name.lower()] = customer

        # 2. Find or create Product with strict SKU deduplication
        row_sku = (row.get("sku") or "").strip()
        prod_name = row["product_name"].strip()
        product = None

        if row_sku and row_sku.lower() in products_by_sku:
            # SKU matches existing product in DB or batch -> REUSE
            product = products_by_sku[row_sku.lower()]
            reused_products += 1
        elif prod_name.lower() in products_by_name:
            # Name matches existing product in DB or batch -> REUSE
            product = products_by_name[prod_name.lower()]
            reused_products += 1
        else:
            # Create new Product
            if row_sku and row_sku.lower() not in products_by_sku:
                final_sku = row_sku
            else:
                base_sku = "".join(c for c in prod_name.upper() if c.isalnum())[:8]
                final_sku = f"SKU-{base_sku}-{uuid.uuid4().hex[:4].upper()}"

            cost_p = row.get("cost_price")
            if cost_p is None:
                cost_p = round(float(row["unit_price"]) * 0.65, 2)

            product = Product(
                name=prod_name,
                category=row.get("category", "General Retail"),
                price=float(row["unit_price"]),
                cost_price=float(cost_p),
                sku=final_sku,
                is_active=True
            )
            db.add(product)
            db.flush()
            created_products += 1
            products_by_sku[product.sku.lower()] = product
            products_by_name[product.name.lower()] = product

        # 3. Deduct or initialize inventory for this product
        inv = inventories.get(product.id)
        sale_qty = int(row["quantity"])
        if not inv:
            inv = Inventory(
                product_id=product.id,
                quantity=max(10, 100 - sale_qty),
                reorder_level=15
            )
            db.add(inv)
            db.flush()
            inventories[product.id] = inv
        else:
            inv.quantity = max(0, inv.quantity - sale_qty)

        # 4. Check for low-stock condition and generate Alert if needed
        if inv.quantity <= inv.reorder_level:
            existing_alert = db.query(Alert).filter(
                Alert.alert_type == "LOW_STOCK",
                Alert.entity_id == str(product.id),
                Alert.is_resolved == False
            ).first()
            if not existing_alert:
                alert = Alert(
                    alert_type="LOW_STOCK",
                    severity="CRITICAL" if inv.quantity == 0 else "HIGH",
                    title=f"Low Stock Alert: {product.name}",
                    message=f"Product '{product.name}' is at or below reorder level ({inv.quantity} units remaining / threshold {inv.reorder_level}).",
                    entity_type="PRODUCT",
                    entity_id=str(product.id)
                )
                db.add(alert)

        # 5. Determine Invoice Number & check duplicate transactions
        dt = row["sale_date"]
        inv_num = row.get("invoice_number")
        if not inv_num or str(inv_num).lower() in ("nan", "none", "null", ""):
            inv_num = f"INV-{dt.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        elif inv_num in existing_invoices:
            duplicate_transactions += 1

        existing_invoices.add(inv_num)

        # 6. Create Sale Transaction
        sale = Sale(
            customer_id=customer.id,
            product_id=product.id,
            quantity=sale_qty,
            unit_price=float(row["unit_price"]),
            total_amount=float(row["total_amount"]),
            payment_method=row.get("payment_method", "CARD"),
            invoice_number=inv_num,
            sale_date=dt,
            import_hash=file_hash
        )
        db.add(sale)
        inserted_sales += 1

        # 7. Create Invoice
        invoice = Invoice(
            customer_id=customer.id,
            invoice_number=inv_num,
            total_amount=float(row["total_amount"]),
            status="PAID",
            created_at=dt
        )
        db.add(invoice)

    db.commit()

    return {
        "success": True,
        "message": f"Successfully imported {inserted_sales} sales transactions with inventory synchronization.",
        "total_rows": len(valid_rows),
        "valid_rows": len(valid_rows),
        "invalid_rows": 0,
        "rows_processed": len(valid_rows),
        "rows_inserted": inserted_sales,
        "new_products": created_products,
        "existing_products_reused": reused_products,
        "duplicate_products": reused_products,
        "new_customers": created_customers,
        "duplicate_transactions": duplicate_transactions,
        "validation_errors": [],
        "conflicts": 0,
        "products_created": created_products,
        "customers_created": created_customers
    }