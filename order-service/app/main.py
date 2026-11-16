from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import ReturnDocument

from app.clients import MenuUnavailable, get_menu_item
from app.db import orders
from app.models import Order, OrderCreate, OrderStatus, PayResult, StatusUpdate

app = FastAPI(title="Order service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_order(doc: dict) -> Order:
    """Turn a Mongo document into the API model (ObjectId -> string id)."""
    return Order(id=str(doc["_id"]), **{k: v for k, v in doc.items() if k != "_id"})


def parse_order_id(order_id: str) -> ObjectId:
    try:
        return ObjectId(order_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Order not found")


@app.post("/orders", response_model=Order, status_code=201)
async def create_order(order: OrderCreate):
    # Look up every item in the Menu service. The total is computed here from
    # the menu prices, never from prices sent by the client.
    items = []
    for line in order.items:
        try:
            menu_item = await get_menu_item(line.item_id)
        except MenuUnavailable:
            raise HTTPException(status_code=503, detail="Menu service is unavailable")
        if menu_item is None:
            raise HTTPException(status_code=400, detail=f"Unknown menu item: {line.item_id}")
        items.append(
            {
                "item_id": line.item_id,
                "name": menu_item["name"],
                "price": menu_item["price"],
                "quantity": line.quantity,
            }
        )

    total = round(sum(item["price"] * item["quantity"] for item in items), 2)
    # Mongo stores times in milliseconds, so drop the extra precision up front
    # to return the same created_at here as GET /orders/{id} does later.
    now = datetime.now(timezone.utc)
    created_at = now.replace(microsecond=now.microsecond // 1000 * 1000)
    doc = {
        "table_number": order.table_number,
        "items": items,
        "total": total,
        "status": "received",
        "paid": False,
        "created_at": created_at,
    }
    result = await orders.insert_one(doc)
    doc["_id"] = result.inserted_id
    return to_order(doc)


@app.get("/orders", response_model=list[Order])
async def list_orders(
    table_number: int | None = None,
    paid: bool | None = None,
    status: OrderStatus | None = None,
):
    # Only filter on the query parameters that were given.
    query = {}
    if table_number is not None:
        query["table_number"] = table_number
    if paid is not None:
        query["paid"] = paid
    if status is not None:
        query["status"] = status

    docs = await orders.find(query).sort([("created_at", -1), ("_id", -1)]).to_list()
    return [to_order(doc) for doc in docs]


@app.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    doc = await orders.find_one({"_id": parse_order_id(order_id)})
    if doc is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return to_order(doc)


@app.patch("/orders/{order_id}/status", response_model=Order)
async def update_status(order_id: str, update: StatusUpdate):
    doc = await orders.find_one_and_update(
        {"_id": parse_order_id(order_id)},
        {"$set": {"status": update.status}},
        return_document=ReturnDocument.AFTER,
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return to_order(doc)


@app.post("/orders/pay", response_model=PayResult)
async def pay_orders(table_number: int):
    """Mark all unpaid orders of a table as paid. Called by the Payment service."""
    result = await orders.update_many(
        {"table_number": table_number, "paid": False},
        {"$set": {"paid": True}},
    )
    return PayResult(table_number=table_number, orders_paid=result.modified_count)
