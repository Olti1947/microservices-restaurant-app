from typing import Literal

from pydantic import BaseModel

TableStatus = Literal["free", "occupied"]


class Table(BaseModel):
    """A table as returned by the API."""

    id: str
    number: int
    status: TableStatus
