import os

import pytest
import respx
from pymongo import MongoClient

# Must be set before the app is imported so it uses the test database.
os.environ["ORDER_DB_NAME"] = "order_db_test"

from fastapi.testclient import TestClient  # noqa: E402

from app.clients import MENU_URL  # noqa: E402
from app.db import MONGO_URL  # noqa: E402
from app.main import app  # noqa: E402
from app.sockets import sio  # noqa: E402

PIZZA = {"id": "aaaaaaaaaaaaaaaaaaaaaaaa", "name": "Pizza", "price": 9.5, "category": "main"}
COLA = {"id": "bbbbbbbbbbbbbbbbbbbbbbbb", "name": "Cola", "price": 2.5, "category": "drink"}


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client
    MongoClient(MONGO_URL).drop_database("order_db_test")


@pytest.fixture(autouse=True)
def clean_orders():
    MongoClient(MONGO_URL)["order_db_test"]["orders"].delete_many({})


@pytest.fixture
def menu():
    """Fake Menu service: knows PIZZA and COLA, returns 404 for anything else."""
    with respx.mock(base_url=MENU_URL, assert_all_called=False) as mock:
        mock.get(f"/menu/{PIZZA['id']}").respond(200, json=PIZZA)
        mock.get(f"/menu/{COLA['id']}").respond(200, json=COLA)
        mock.get(path__startswith="/menu/").respond(404, json={"detail": "Menu item not found"})
        yield mock


@pytest.fixture
def emitted(monkeypatch):
    """Record Socket.IO events instead of sending them: list of (event, data, room)."""
    events = []

    async def fake_emit(event, data, room=None):
        events.append((event, data, room))

    monkeypatch.setattr(sio, "emit", fake_emit)
    return events
