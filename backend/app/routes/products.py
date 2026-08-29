from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.user import User
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.auth.dependencies import require_role

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


@router.get("/", response_model=list[ProductResponse])
def get_products(
    category: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.is_active == True)

    if category:
        query = query.filter(Product.category == category)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter((Product.name.ilike(search_pattern)) | (Product.sku.ilike(search_pattern)))

    return query.order_by(Product.name.asc()).all()


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Product.category).distinct().filter(Product.category != None).all()
    return [c[0] for c in categories if c[0]]


@router.post("/", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    existing = db.query(Product).filter(Product.sku == product.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="A product with this SKU already exists.")

    new_product = Product(
        name=product.name,
        category=product.category or "General Retail",
        price=product.price,
        cost_price=product.cost_price or round(product.price * 0.65, 2),
        sku=product.sku,
        is_active=product.is_active if product.is_active is not None else True
    )

    db.add(new_product)
    db.flush()

    # Automatically initialize inventory tracking
    inv = Inventory(
        product_id=new_product.id,
        quantity=50,
        reorder_level=10
    )
    db.add(inv)
    db.commit()
    db.refresh(new_product)

    return new_product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    update_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")

    if update_data.name is not None:
        prod.name = update_data.name
    if update_data.category is not None:
        prod.category = update_data.category
    if update_data.price is not None:
        prod.price = update_data.price
    if update_data.cost_price is not None:
        prod.cost_price = update_data.cost_price
    if update_data.sku is not None:
        prod.sku = update_data.sku
    if update_data.is_active is not None:
        prod.is_active = update_data.is_active

    db.commit()
    db.refresh(prod)
    return prod