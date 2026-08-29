from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional


class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    segment: Optional[str] = None


class CustomerResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    segment: Optional[str] = "New"
    churn_risk: Optional[str] = "Low Risk"
    churn_probability: Optional[float] = 0.0
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)