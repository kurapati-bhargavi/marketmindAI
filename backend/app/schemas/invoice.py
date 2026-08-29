from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional


class InvoiceCreate(BaseModel):
    customer_id: int
    invoice_number: str
    total_amount: float
    status: Optional[str] = "PAID"


class InvoiceResponse(BaseModel):
    id: int
    customer_id: int
    invoice_number: str
    total_amount: float
    status: str
    created_at: datetime
    customer_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)