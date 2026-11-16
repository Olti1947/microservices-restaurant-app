from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import ReturnDocument

from app.db import tables
from app.models import Table

NUMBER_OF_TABLES = 10


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Table numbers must be unique, since tables are addressed by number.
    await tables.create_index("number", unique=True)
    # Create tables 1 to 10 the first time the service starts with an empty database.
    if await tables.count_documents({}) == 0:
        await tables.insert_many(
            [{"number": n, "status": "free"} for n in range(1, NUMBER_OF_TABLES + 1)]
        )
    yield


app = FastAPI(title="Table service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_table(doc: dict) -> Table:
    """Turn a Mongo document into the API model (ObjectId -> string id)."""
    return Table(id=str(doc["_id"]), number=doc["number"], status=doc["status"])


async def find_table_or_404(number: int) -> dict:
    doc = await tables.find_one({"number": number})
    if doc is None:
        raise HTTPException(status_code=404, detail=f"Table {number} not found")
    return doc


@app.get("/tables", response_model=list[Table])
async def list_tables():
    docs = await tables.find().sort("number").to_list()
    return [to_table(doc) for doc in docs]


@app.get("/tables/{number}", response_model=Table)
async def get_table(number: int):
    return to_table(await find_table_or_404(number))


@app.post("/tables/{number}/occupy", response_model=Table)
async def occupy_table(number: int):
    # Only matches a free table, so two diners can't take the same table at once.
    doc = await tables.find_one_and_update(
        {"number": number, "status": "free"},
        {"$set": {"status": "occupied"}},
        return_document=ReturnDocument.AFTER,
    )
    if doc is None:
        # Either the table doesn't exist (404) or it's already occupied (409).
        await find_table_or_404(number)
        raise HTTPException(status_code=409, detail=f"Table {number} is already occupied")
    return to_table(doc)


@app.post("/tables/{number}/free", response_model=Table)
async def free_table(number: int):
    # Freeing a table that is already free is fine (idempotent).
    doc = await tables.find_one_and_update(
        {"number": number},
        {"$set": {"status": "free"}},
        return_document=ReturnDocument.AFTER,
    )
    if doc is None:
        raise HTTPException(status_code=404, detail=f"Table {number} not found")
    return to_table(doc)
