from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.clients import ServiceUnavailable, free_table, get_unpaid_orders, mark_orders_paid
from app.db import payments
from app.models import Bill, Payment, PaymentCreate

app = FastAPI(title="Payment service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_payment(doc: dict) -> Payment:
    """Turn a Mongo document into the API model (ObjectId -> string id)."""
    return Payment(
        id=str(doc["_id"]),
        table_number=doc["table_number"],
        amount=doc["amount"],
        paid=doc["paid"],
        created_at=doc["created_at"],
    )


async def build_bill(table_number: int) -> Bill:
    try:
        orders = await get_unpaid_orders(table_number)
    except ServiceUnavailable as error:
        raise HTTPException(status_code=503, detail=str(error))
    total = round(sum(order["total"] for order in orders), 2)
    return Bill(table_number=table_number, orders=orders, total=total)


@app.get("/bills/{table_number}", response_model=Bill)
async def get_bill(table_number: int):
    return await build_bill(table_number)


@app.post("/payments", response_model=Payment, status_code=201)
async def create_payment(body: PaymentCreate):
    bill = await build_bill(body.table_number)
    if bill.total == 0:
        raise HTTPException(status_code=400, detail=f"Table {body.table_number} has nothing to pay")

    # 1. Mark exactly the orders on this bill as paid. Doing this first means that
    #    if the Order service is down, nothing is recorded.
    order_ids = [order.id for order in bill.orders]
    try:
        orders_paid = await mark_orders_paid(body.table_number, order_ids)
    except ServiceUnavailable as error:
        raise HTTPException(status_code=503, detail=str(error))
    if orders_paid != len(order_ids):
        # Some of these orders were paid in the meantime (for example from another phone).
        raise HTTPException(status_code=409, detail="The bill changed, please check it again")

    # 2. Record the payment.
    # Mongo stores times in milliseconds, so drop the extra precision up front.
    now = datetime.now(timezone.utc)
    doc = {
        "table_number": body.table_number,
        "amount": bill.total,
        "paid": True,
        "created_at": now.replace(microsecond=now.microsecond // 1000 * 1000),
    }
    result = await payments.insert_one(doc)
    doc["_id"] = result.inserted_id

    # 3. Free the table for the next guests. The payment already went through, so
    #    if the Table service is down we still report success; staff can free the
    #    table later with POST /tables/{number}/free.
    try:
        await free_table(body.table_number)
    except ServiceUnavailable:
        print(f"Warning: table {body.table_number} was paid but could not be freed")

    return to_payment(doc)


@app.get("/payments", response_model=list[Payment])
async def list_payments(table_number: int | None = None):
    query = {"table_number": table_number} if table_number is not None else {}
    docs = await payments.find(query).sort([("created_at", -1), ("_id", -1)]).to_list()
    return [to_payment(doc) for doc in docs]
