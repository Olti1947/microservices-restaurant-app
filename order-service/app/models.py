from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

# The order moves through these statuses in this order.
OrderStatus = Literal["received", "preparing", "ready", "served"]


class OrderItemCreate(BaseModel):
    item_id: str
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    """Body of POST /orders. Prices are not sent; they come from the Menu service."""

    table_number: int = Field(ge=1)
    items: list[OrderItemCreate] = Field(min_length=1)


class OrderItem(BaseModel):
    item_id: str
    name: str
    price: float
    quantity: int


class Order(BaseModel):
    """An order as returned by the API."""

    id: str
    table_number: int
    items: list[OrderItem]
    total: float
    status: OrderStatus
    paid: bool
    created_at: datetime


class StatusUpdate(BaseModel):
    """Body of PATCH /orders/{id}/status."""

    status: OrderStatus


class PayResult(BaseModel):
    table_number: int
    orders_paid: int
