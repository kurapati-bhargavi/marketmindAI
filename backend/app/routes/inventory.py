from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.user import User
from app.schemas.inventory import InventoryCreate, InventoryResponse, InventoryUpdate
from app.auth.dependencies import require_role

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory Management"]
)


@router.get("/")
def get_inventory_list(
    low_stock_only: bool = False,
    category: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "Sales Executive", "System Administrator"))
):
    """
    Get inventory status with product details, valuation, and low stock indicators.
    """
    query = (
        db.query(
            Inventory.id,
            Inventory.product_id,
            Inventory.quantity,
            Inventory.reorder_level,
            Inventory.location,
            Inventory.updated_at,
            Product.name.label("product_name"),
            Product.category.label("category"),
            Product.sku.label("sku"),
            Product.price.label("unit_price"),
            Product.cost_price.label("cost_price")
        )
        .join(Product, Product.id == Inventory.product_id)
    )

    if category:
        query = query.filter(Product.category == category)

    if low_stock_only:
        query = query.filter(Inventory.quantity <= Inventory.reorder_level)

    results = query.order_by(Inventory.quantity.asc()).all()

    items = []
    total_valuation = 0.0
    low_stock_count = 0

    for r in results:
        status = "OUT_OF_STOCK" if r.quantity == 0 else ("LOW_STOCK" if r.quantity <= r.reorder_level else "IN_STOCK")
        if status in ("OUT_OF_STOCK", "LOW_STOCK"):
            low_stock_count += 1

        val = round(float(r.quantity * (r.unit_price or 0)), 2)
        total_valuation += val

        items.append({
            "id": r.id,
            "product_id": r.product_id,
            "product_name": r.product_name,
            "category": r.category,
            "sku": r.sku,
            "quantity": r.quantity,
            "reorder_level": r.reorder_level,
            "location": r.location,
            "unit_price": r.unit_price,
            "inventory_valuation": val,
            "stock_status": status,
            "updated_at": r.updated_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(r.updated_at, "strftime") else str(r.updated_at)
        })

    return {
        "total_items": len(items),
        "low_stock_count": low_stock_count,
        "total_valuation": round(total_valuation, 2),
        "items": items
    }


@router.post("/", response_model=InventoryResponse)
def create_inventory(
    inventory: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    product = db.query(Product).filter(Product.id == inventory.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    existing = db.query(Inventory).filter(Inventory.product_id == inventory.product_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Inventory tracking already exists for this product.")

    new_inv = Inventory(
        product_id=inventory.product_id,
        quantity=inventory.quantity,
        reorder_level=inventory.reorder_level,
        location=inventory.location or "Main Warehouse"
    )
    db.add(new_inv)
    db.commit()
    db.refresh(new_inv)
    return new_inv


@router.put("/{product_id}/restock")
def restock_inventory(
    product_id: int,
    additional_quantity: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    """
    Add stock units to existing product inventory.
    """
    if additional_quantity <= 0:
        raise HTTPException(status_code=400, detail="Restock quantity must be greater than 0.")

    inv = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if not inv:
        inv = Inventory(product_id=product_id, quantity=additional_quantity, reorder_level=10)
        db.add(inv)
    else:
        inv.quantity += additional_quantity

    db.commit()
    db.refresh(inv)

    return {
        "success": True,
        "message": f"Successfully added {additional_quantity} units. Current stock: {inv.quantity}",
        "product_id": product_id,
        "new_quantity": inv.quantity
    }


@router.put("/{product_id}/reorder-level")
def update_reorder_level(
    product_id: int,
    new_reorder_level: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    """
    Configure minimum reorder threshold for a product.
    """
    if new_reorder_level < 0:
        raise HTTPException(status_code=400, detail="Reorder level cannot be negative.")

    inv = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found for this product.")

    inv.reorder_level = new_reorder_level
    db.commit()
    db.refresh(inv)

    return {
        "success": True,
        "message": f"Reorder threshold updated to {new_reorder_level} units.",
        "product_id": product_id,
        "reorder_level": inv.reorder_level
    }