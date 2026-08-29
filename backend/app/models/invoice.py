from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(
        Integer,
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    invoice_number = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    total_amount = Column(Float, nullable=False)

    status = Column(
        String(30),
        nullable=False,
        default="PAID"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    customer = relationship("Customer", back_populates="invoices")