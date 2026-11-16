import os

import httpx

MENU_URL = os.getenv("MENU_URL", "http://localhost:8002")


class MenuUnavailable(Exception):
    """The Menu service could not be reached or answered with an error."""


async def get_menu_item(item_id: str) -> dict | None:
    """Fetch one item from the Menu service. Returns None if it doesn't exist."""
    try:
        async with httpx.AsyncClient(base_url=MENU_URL, timeout=5) as client:
            response = await client.get(f"/menu/{item_id}")
    except httpx.RequestError as error:
        raise MenuUnavailable() from error

    if response.status_code == 404:
        return None
    if response.status_code != 200:
        raise MenuUnavailable()
    return response.json()
