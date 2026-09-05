import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Body
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
    customer_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "Sales Executive", "System Administrator"))
):
    """
    Get invoice registry with status tracking (PAID, PENDING, OVERDUE).
    """
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

    if customer_id:
        query = query.filter(Invoice.customer_id == customer_id)

    results = query.order_by(desc(Invoice.created_at)).all()

    return [
        {
            "id": r.id,
            "customer_id": r.customer_id,
            "customer_name": r.customer_name,
            "invoice_number": r.invoice_number,
            "total_amount": round(float(r.total_amount), 2),
            "status": r.status,
            "payment_status": r.status,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(r.created_at, "strftime") else str(r.created_at)
        }
        for r in results
    ]


@router.get("/{invoice_id}")
def get_invoice_by_id(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "Sales Executive", "System Administrator"))
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    cust = db.query(Customer).filter(Customer.id == inv.customer_id).first()
    return {
        "id": inv.id,
        "customer_id": inv.customer_id,
        "customer_name": cust.name if cust else "N/A",
        "invoice_number": inv.invoice_number,
        "total_amount": round(float(inv.total_amount), 2),
        "status": inv.status,
        "payment_status": inv.status,
        "created_at": inv.created_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(inv.created_at, "strftime") else str(inv.created_at)
    }


@router.post("/")
def create_invoice(
    invoice_data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "Sales Executive"))
):
    cust = db.query(Customer).filter(Customer.id == invoice_data.customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found.")

    inv_num = invoice_data.invoice_number or f"INV-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    new_inv = Invoice(
        customer_id=invoice_data.customer_id,
        invoice_number=inv_num,
        total_amount=invoice_data.total_amount,
        status=getattr(invoice_data, "status", "PENDING") or "PENDING"
    )
    db.add(new_inv)
    db.commit()
    db.refresh(new_inv)

    return {
        "id": new_inv.id,
        "customer_id": new_inv.customer_id,
        "customer_name": cust.name,
        "invoice_number": new_inv.invoice_number,
        "total_amount": new_inv.total_amount,
        "status": new_inv.status,
        "created_at": new_inv.created_at.strftime("%Y-%m-%d %H:%M:%S")
    }


@router.put("/{invoice_id}")
def update_invoice_status(
    invoice_id: int,
    status: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    valid_statuses = ["PAID", "PENDING", "OVERDUE", "CANCELLED"]
    if status.upper() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid_statuses}")

    inv.status = status.upper()
    db.commit()
    db.refresh(inv)

    return {
        "success": True,
        "message": f"Invoice {inv.invoice_number} status updated to {inv.status}.",
        "invoice_id": inv.id,
        "status": inv.status
    }


@router.delete("/{invoice_id}")
def delete_or_cancel_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "System Administrator"))
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    inv.status = "CANCELLED"
    db.commit()

    return {
        "success": True,
        "message": f"Invoice {inv.invoice_number} has been marked as CANCELLED."
    }