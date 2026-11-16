from datetime import datetime

from pydantic import BaseModel, Field


class BillItem(BaseModel):
    name: str
    price: float
    quantity: int


class BillOrder(BaseModel):
    """One unpaid order, with the fields the bill needs from the Order service."""

    id: str
    items: list[BillItem]
    total: float
    status: str
    created_at: datetime


class Bill(BaseModel):
    """What a table owes: its unpaid orders and their sum."""

    table_number: int
    orders: list[BillOrder]
    total: float


class PaymentCreate(BaseModel):
    """Body of POST /payments."""

    table_number: int = Field(ge=1)


class Payment(BaseModel):
    """A payment as returned by the API."""

    id: str
    table_number: int
    amount: float
    paid: bool
    created_at: datetime
