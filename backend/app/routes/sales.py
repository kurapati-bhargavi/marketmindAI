from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.database.database import get_db
from app.models.sale import Sale
from app.models.product import Product
from app.models.customer import Customer
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleResponse
from app.auth.dependencies import require_role
from app.services.sales_service import process_sale

router = APIRouter(
    prefix="/sales",
    tags=["Sales Transactions"]
)


@router.post("/", response_model=SaleResponse)
def create_sale(
    sale_data: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "Sales Executive"))
):
    """
    Create a new sales transaction manually with inventory deduction and invoice generation.
    """
    try:
        new_sale = process_sale(
            db=db,
            customer_id=sale_data.customer_id,
            product_id=sale_data.product_id,
            quantity=sale_data.quantity,
            unit_price=sale_data.unit_price,
            payment_method=sale_data.payment_method or "CARD",
            sale_date=sale_data.sale_date
        )
        db.commit()
        db.refresh(new_sale)

        # Enrich response
        cust = db.query(Customer).filter(Customer.id == new_sale.customer_id).first()
        prod = db.query(Product).filter(Product.id == new_sale.product_id).first()

        res = SaleResponse.model_validate(new_sale)
        res.customer_name = cust.name if cust else None
        res.product_name = prod.name if prod else None
        res.category = prod.category if prod else None
        return res

    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create sale: {str(e)}")


@router.get("/")
def get_sales(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=500),
    search: str | None = None,
    category: str | None = None,
    customer_id: int | None = None,
    product_id: int | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "Sales Executive", "System Administrator"))
):
    """
    Retrieve sales transactions with search, multi-field filtering, sorting and pagination.
    """
    query = (
        db.query(
            Sale.id,
            Sale.customer_id,
            Sale.product_id,
            Sale.quantity,
            Sale.unit_price,
            Sale.total_amount,
            Sale.payment_method,
            Sale.invoice_number,
            Sale.sale_date,
            Customer.name.label("customer_name"),
            Product.name.label("product_name"),
            Product.category.label("category")
        )
        .join(Customer, Customer.id == Sale.customer_id)
        .join(Product, Product.id == Sale.product_id)
    )

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Customer.name.ilike(search_pattern)) |
            (Product.name.ilike(search_pattern)) |
            (Sale.invoice_number.ilike(search_pattern))
        )

    if category:
        query = query.filter(Product.category == category)

    if customer_id:
        query = query.filter(Sale.customer_id == customer_id)

    if product_id:
        query = query.filter(Sale.product_id == product_id)

    if start_date:
        try:
            sd = datetime.fromisoformat(start_date)
            query = query.filter(Sale.sale_date >= sd)
        except Exception:
            pass

    if end_date:
        try:
            ed = datetime.fromisoformat(end_date)
            query = query.filter(Sale.sale_date <= ed)
        except Exception:
            pass

    total_count = query.count()
    offset = (page - 1) * limit
    results = query.order_by(desc(Sale.sale_date)).offset(offset).limit(limit).all()

    items = [
        {
            "id": r.id,
            "customer_id": r.customer_id,
            "customer_name": r.customer_name,
            "product_id": r.product_id,
            "product_name": r.product_name,
            "category": r.category,
            "quantity": r.quantity,
            "unit_price": r.unit_price,
            "total_amount": r.total_amount,
            "payment_method": r.payment_method,
            "invoice_number": r.invoice_number,
            "sale_date": r.sale_date.strftime("%Y-%m-%d %H:%M:%S") if hasattr(r.sale_date, "strftime") else str(r.sale_date)
        }
        for r in results
    ]

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "pages": max(1, (total_count + limit - 1) // limit),
        "items": items
    }