from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.database import get_db
from app.models.invoice import Invoice
from app.models.customer import Customer
from app.models.user import User
from app.schemas.invoice import InvoiceCreate, InvoiceResponse
from app.auth.dependencies import require_role

router = APIRouter(
    prefix="/invoices",
    tags=["Invoices"]
)


@router.get("/")
def get_invoices(
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "Sales Executive", "System Administrator"))
):
    query = (
        db.query(
            Invoice.id,
            Invoice.customer_id,
            Invoice.invoice_number,
            Invoice.total_amount,
            Invoice.status,
            Invoice.created_at,
            Customer.name.label("customer_name")
        )
        .join(Customer, Customer.id == Invoice.customer_id)
    )

    if status:
        query = query.filter(Invoice.status == status.upper())

    results = query.order_by(desc(Invoice.created_at)).all()

    return [
        {
            "id": r.id,
            "customer_id": r.customer_id,
            "customer_name": r.customer_name,
            "invoice_number": r.invoice_number,
            "total_amount": round(float(r.total_amount), 2),
            "status": r.status,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(r.created_at, "strftime") else str(r.created_at)
        }
        for r in results
    ]