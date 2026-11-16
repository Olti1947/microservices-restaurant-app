from typing import Literal

from pydantic import BaseModel, Field

Category = Literal["starter", "main", "dessert", "drink"]


class MenuItemCreate(BaseModel):
    """Body of POST /menu."""

    name: str = Field(min_length=1)
    price: float = Field(gt=0, description="Price in euros")
    category: Category


class MenuItem(MenuItemCreate):
    """A menu item as returned by the API."""

    id: str
