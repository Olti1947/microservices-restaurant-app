import os

from pymongo import AsyncMongoClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
# Tests set ORDER_DB_NAME to use a separate database.
DB_NAME = os.getenv("ORDER_DB_NAME", "order_db")

# tz_aware=True so created_at comes back as a UTC datetime.
client = AsyncMongoClient(MONGO_URL, tz_aware=True)
db = client[DB_NAME]
orders = db["orders"]
