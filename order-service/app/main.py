from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
import socketio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import ReturnDocument

from app.clients import MenuUnavailable, get_menu_item
from app.db import orders
from app.models import (
    STATUS_FLOW,
    Order,
    OrderCreate,
    OrderStatus,
    PayRequest,
    PayResult,
    StatusUpdate,
)
from app.sockets import sio

# The REST API. At the bottom of this file it is combined with Socket.IO into `app`.
api = FastAPI(title="Order service")

api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_order(doc: dict) -> Order:
    """Turn a Mongo document into the API model (ObjectId -> string id)."""
    return Order(
        id=str(doc["_id"]),
        table_number=doc["table_number"],
        items=doc["items"],
        total=doc["total"],
        status=doc["status"],
        paid=doc["paid"],
        created_at=doc["created_at"],
    )


def parse_order_id(order_id: str) -> ObjectId:
    try:
        return ObjectId(order_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Order not found")


@api.post("/orders", response_model=Order, status_code=201)
async def create_order(order: OrderCreate):
    # Look up every item in the Menu service. The total is computed here from
    # the menu prices, never from prices sent by the client.
    items = []
    for line in order.items:
        # Menu item ids are Mongo ObjectIds; anything else can't be on the menu.
        if not ObjectId.is_valid(line.item_id):
            raise HTTPException(status_code=400, detail=f"Unknown menu item: {line.item_id}")
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
    new_order = to_order(doc)

    # Tell every kitchen screen about the new order right away.
    await sio.emit("new-order", new_order.model_dump(mode="json"), room="kitchen")
    return new_order


@api.get("/orders", response_model=list[Order])
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


@api.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    doc = await orders.find_one({"_id": parse_order_id(order_id)})
    if doc is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return to_order(doc)


@api.patch("/orders/{order_id}/status", response_model=Order)
async def update_status(order_id: str, update: StatusUpdate):
    object_id = parse_order_id(order_id)

    # Statuses only move forward one step: received -> preparing -> ready -> served.
    position = STATUS_FLOW.index(update.status)
    previous = STATUS_FLOW[position - 1] if position > 0 else None
    doc = await orders.find_one_and_update(
        {"_id": object_id, "status": previous},
        {"$set": {"status": update.status}},
        return_document=ReturnDocument.AFTER,
    )
    if doc is None:
        current = await orders.find_one({"_id": object_id})
        if current is None:
            raise HTTPException(status_code=404, detail="Order not found")
        raise HTTPException(
            status_code=409,
            detail=f"Order is '{current['status']}' and can't move to '{update.status}'",
        )
    order = to_order(doc)

    # The diner's table and the kitchen both see the new status live.
    event = {"id": order.id, "table_number": order.table_number, "status": order.status}
    await sio.emit("order-status", event, room=f"table-{order.table_number}")
    await sio.emit("order-status", event, room="kitchen")
    return order


@api.post("/orders/pay", response_model=PayResult)
async def pay_orders(body: PayRequest):
    """Mark the given unpaid orders of a table as paid. Called by the Payment service.

    Only the orders that were on the bill are marked, so an order placed after the
    bill was built stays unpaid and shows up on the next bill.
    """
    if not all(ObjectId.is_valid(order_id) for order_id in body.order_ids):
        raise HTTPException(status_code=400, detail="Invalid order id")
    result = await orders.update_many(
        {
            "_id": {"$in": [ObjectId(order_id) for order_id in body.order_ids]},
            "table_number": body.table_number,
            "paid": False,
        },
        {"$set": {"paid": True}},
    )
    return PayResult(table_number=body.table_number, orders_paid=result.modified_count)


# Socket.IO and REST share one port: Socket.IO answers /socket.io/ requests
# and passes everything else on to the FastAPI app.
app = socketio.ASGIApp(sio, other_asgi_app=api)
