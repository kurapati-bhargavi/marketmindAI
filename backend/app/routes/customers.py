from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.customer import Customer
from app.models.sale import Sale
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate
from app.auth.dependencies import require_role

router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)


@router.get("/")
def get_customers_with_metrics(
    search: str | None = None,
    segment: str | None = None,
    churn_risk: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "Sales Executive", "System Administrator"))
):
    """
    Get customer directory with purchase volume, lifetime revenue, segment and churn indicators.
    """
    query = (
        db.query(
            Customer.id,
            Customer.name,
            Customer.email,
            Customer.phone,
            Customer.address,
            Customer.segment,
            Customer.churn_risk,
            Customer.churn_probability,
            Customer.created_at,
            func.count(Sale.id).label("total_orders"),
            func.coalesce(func.sum(Sale.total_amount), 0).label("total_spent"),
            func.max(Sale.sale_date).label("last_purchase_date")
        )
        .outerjoin(Sale, Sale.customer_id == Customer.id)
        .group_by(Customer.id)
    )

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter((Customer.name.ilike(search_pattern)) | (Customer.email.ilike(search_pattern)))

    if segment:
        query = query.filter(Customer.segment == segment)

    if churn_risk:
        query = query.filter(Customer.churn_risk == churn_risk)

    results = query.order_by(func.coalesce(func.sum(Sale.total_amount), 0).desc()).all()

    return [
        {
            "id": r.id,
            "name": r.name,
            "email": r.email,
            "phone": r.phone,
            "address": r.address,
            "segment": r.segment or "New",
            "churn_risk": r.churn_risk or "Low Risk",
            "churn_probability": r.churn_probability or 0.0,
            "total_orders": int(r.total_orders or 0),
            "total_spent": round(float(r.total_spent or 0), 2),
            "last_purchase_date": r.last_purchase_date.strftime("%Y-%m-%d") if r.last_purchase_date else None,
            "created_at": r.created_at.strftime("%Y-%m-%d") if hasattr(r.created_at, "strftime") else str(r.created_at)
        }
        for r in results
    ]


@router.post("/", response_model=CustomerResponse)
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "Sales Executive"))
):
    if customer.email:
        existing = db.query(Customer).filter(Customer.email == customer.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="A customer with this email already exists.")

    new_customer = Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        address=customer.address,
        segment="New",
        churn_risk="Low Risk"
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer


@router.get("/segments")
def get_customer_segments_alias(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    """
    Customer segmentation alias.
    """
    from app.ml.segmentation import calculate_customer_segmentation
    return calculate_customer_segmentation(db)


@router.get("/{customer_id}")
def get_customer_by_id(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "Sales Executive", "System Administrator"))
):
    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail=f"Customer with ID {customer_id} not found.")

    sales = db.query(Sale).filter(Sale.customer_id == customer_id).all()
    total_spent = sum(float(s.total_amount) for s in sales)
    total_orders = len(sales)

    return {
        "id": cust.id,
        "name": cust.name,
        "email": cust.email,
        "phone": cust.phone,
        "address": cust.address,
        "segment": cust.segment or "New",
        "churn_risk": cust.churn_risk or "Low Risk",
        "churn_probability": cust.churn_probability or 0.0,
        "total_orders": total_orders,
        "total_spent": round(total_spent, 2),
        "average_order_value": round(total_spent / max(1, total_orders), 2),
        "created_at": cust.created_at.strftime("%Y-%m-%d %H:%M") if hasattr(cust.created_at, "strftime") else str(cust.created_at)
    }


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    update_data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found.")

    if update_data.name is not None:
        cust.name = update_data.name
    if update_data.email is not None:
        cust.email = update_data.email
    if update_data.phone is not None:
        cust.phone = update_data.phone
    if update_data.address is not None:
        cust.address = update_data.address
    if update_data.segment is not None:
        cust.segment = update_data.segment

    db.commit()
    db.refresh(cust)
    return cust