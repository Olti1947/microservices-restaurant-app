import os

from pymongo import AsyncMongoClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
# Tests set MENU_DB_NAME to use a separate database.
DB_NAME = os.getenv("MENU_DB_NAME", "menu_db")

client = AsyncMongoClient(MONGO_URL)
db = client[DB_NAME]
menu_items = db["menu_items"]
