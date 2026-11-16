from datetime import datetime

from pydantic import BaseModel, Field


class Bill(BaseModel):
    """What a table owes: its unpaid orders (as returned by the Order service) and the sum."""

    table_number: int
    orders: list[dict]
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
