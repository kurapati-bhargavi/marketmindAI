from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional


class InventoryCreate(BaseModel):
    product_id: int
    quantity: int
    reorder_level: int = 10
    location: Optional[str] = "Main Warehouse"


class InventoryUpdate(BaseModel):
    quantity: Optional[int] = None
    reorder_level: Optional[int] = None
    location: Optional[str] = None


class InventoryResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    reorder_level: int
    location: Optional[str] = "Main Warehouse"
    updated_at: datetime
    product_name: Optional[str] = None
    category: Optional[str] = None
    sku: Optional[str] = None
    unit_price: Optional[float] = None
    stock_status: Optional[str] = "IN_STOCK"

    model_config = ConfigDict(from_attributes=True)