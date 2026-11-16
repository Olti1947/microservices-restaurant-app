import os

import pytest
import respx
from pymongo import MongoClient

# Must be set before the app is imported so it uses the test database.
os.environ["PAYMENT_DB_NAME"] = "payment_db_test"

from fastapi.testclient import TestClient  # noqa: E402

from app.clients import ORDER_URL, TABLE_URL  # noqa: E402
from app.db import MONGO_URL  # noqa: E402
from app.main import app  # noqa: E402

mongo = MongoClient(MONGO_URL)

# Two unpaid orders for table 5, as the Order service would return them.
PIZZA = {"item_id": "a1", "name": "Pizza", "price": 9.5, "quantity": 2}
COLA = {"item_id": "b2", "name": "Cola", "price": 2.5, "quantity": 3}
TABLE_5_ORDERS = [
    {"id": "o1", "table_number": 5, "items": [PIZZA], "total": 19.0, "status": "served",
     "paid": False, "created_at": "2026-11-16T12:00:00Z"},
    {"id": "o2", "table_number": 5, "items": [COLA], "total": 7.5, "status": "served",
     "paid": False, "created_at": "2026-11-16T12:05:00Z"},
]


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client
    mongo.drop_database("payment_db_test")


@pytest.fixture(autouse=True)
def clean_payments():
    mongo["payment_db_test"]["payments"].delete_many({})


@pytest.fixture
def services():
    """Fake Order and Table services. Table 5 owes 26.5, every other table owes nothing."""
    with respx.mock(assert_all_called=False) as mock:
        mock.get(f"{ORDER_URL}/orders", params={"table_number": "5"}).respond(200, json=TABLE_5_ORDERS)
        mock.get(f"{ORDER_URL}/orders").respond(200, json=[])
        mock.post(f"{ORDER_URL}/orders/pay").respond(200, json={"table_number": 5, "orders_paid": 2})
        mock.post(url__regex=rf"{TABLE_URL}/tables/\d+/free").respond(200, json={})
        yield mock
