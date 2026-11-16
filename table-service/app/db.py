import os

from pymongo import AsyncMongoClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
# Tests set TABLE_DB_NAME to use a separate database.
DB_NAME = os.getenv("TABLE_DB_NAME", "table_db")

client = AsyncMongoClient(MONGO_URL)
db = client[DB_NAME]
tables = db["tables"]
