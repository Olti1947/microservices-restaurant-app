import os

import pytest
from pymongo import MongoClient

# Must be set before the app is imported so it uses the test database.
os.environ["MENU_DB_NAME"] = "menu_db_test"

from fastapi.testclient import TestClient  # noqa: E402

from app.db import MONGO_URL  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client
    MongoClient(MONGO_URL).drop_database("menu_db_test")
