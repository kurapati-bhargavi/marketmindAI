from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional


class SaleCreate(BaseModel):
    customer_id: int
    product_id: int
    quantity: int
    unit_price: Optional[float] = None
    payment_method: Optional[str] = "CARD"
    sale_date: Optional[datetime] = None


class SaleResponse(BaseModel):
    id: int
    customer_id: int
    product_id: int
    quantity: int
    unit_price: float
    total_amount: float
    payment_method: Optional[str] = "CARD"
    invoice_number: Optional[str] = None
    sale_date: datetime
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
    category: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)