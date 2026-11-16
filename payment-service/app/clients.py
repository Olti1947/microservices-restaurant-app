import os

import httpx

ORDER_URL = os.getenv("ORDER_URL", "http://localhost:8003")
TABLE_URL = os.getenv("TABLE_URL", "http://localhost:8001")


class ServiceUnavailable(Exception):
    """Another service could not be reached or answered with an error."""

    def __init__(self, service: str):
        super().__init__(f"{service} service is unavailable")
        self.service = service


async def get_unpaid_orders(table_number: int) -> list[dict]:
    """Ask the Order service for all unpaid orders of a table."""
    try:
        async with httpx.AsyncClient(base_url=ORDER_URL, timeout=5) as client:
            response = await client.get("/orders", params={"table_number": table_number, "paid": "false"})
            response.raise_for_status()
    except httpx.HTTPError as error:
        raise ServiceUnavailable("Order") from error
    return response.json()


async def mark_orders_paid(table_number: int) -> None:
    """Tell the Order service that the table's unpaid orders are now paid."""
    try:
        async with httpx.AsyncClient(base_url=ORDER_URL, timeout=5) as client:
            response = await client.post("/orders/pay", params={"table_number": table_number})
            response.raise_for_status()
    except httpx.HTTPError as error:
        raise ServiceUnavailable("Order") from error


async def free_table(table_number: int) -> None:
    """Tell the Table service that the table is free again."""
    try:
        async with httpx.AsyncClient(base_url=TABLE_URL, timeout=5) as client:
            response = await client.post(f"/tables/{table_number}/free")
            response.raise_for_status()
    except httpx.HTTPError as error:
        raise ServiceUnavailable("Table") from error
