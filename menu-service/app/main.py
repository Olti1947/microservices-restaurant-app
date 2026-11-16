from contextlib import asynccontextmanager

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.db import menu_items
from app.models import Category, MenuItem, MenuItemCreate

SEED_ITEMS = [
    {"name": "Tomato Soup", "price": 4.50, "category": "starter"},
    {"name": "Garlic Bread", "price": 3.90, "category": "starter"},
    {"name": "Caesar Salad", "price": 6.80, "category": "starter"},
    {"name": "Margherita Pizza", "price": 9.50, "category": "main"},
    {"name": "Cheeseburger", "price": 11.00, "category": "main"},
    {"name": "Spaghetti Carbonara", "price": 10.50, "category": "main"},
    {"name": "Tiramisu", "price": 5.50, "category": "dessert"},
    {"name": "Chocolate Cake", "price": 4.90, "category": "dessert"},
    {"name": "Cola", "price": 2.50, "category": "drink"},
    {"name": "Sparkling Water", "price": 2.00, "category": "drink"},
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed the menu the first time the service starts with an empty database.
    if await menu_items.count_documents({}) == 0:
        await menu_items.insert_many([dict(item) for item in SEED_ITEMS])
    yield


app = FastAPI(title="Menu service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_menu_item(doc: dict) -> MenuItem:
    """Turn a Mongo document into the API model (ObjectId -> string id)."""
    return MenuItem(
        id=str(doc["_id"]),
        name=doc["name"],
        price=doc["price"],
        category=doc["category"],
    )


@app.get("/menu", response_model=list[MenuItem])
async def list_menu(category: Category | None = None):
    query = {"category": category} if category else {}
    docs = await menu_items.find(query).to_list()
    return [to_menu_item(doc) for doc in docs]


@app.get("/menu/{item_id}", response_model=MenuItem)
async def get_menu_item(item_id: str):
    try:
        object_id = ObjectId(item_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Menu item not found")

    doc = await menu_items.find_one({"_id": object_id})
    if doc is None:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return to_menu_item(doc)


@app.post("/menu", response_model=MenuItem, status_code=201)
async def create_menu_item(item: MenuItemCreate):
    doc = item.model_dump()
    result = await menu_items.insert_one(doc)
    doc["_id"] = result.inserted_id
    return to_menu_item(doc)
