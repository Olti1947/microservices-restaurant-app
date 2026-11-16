import asyncio

from app.sockets import join, sio
from tests.conftest import PIZZA


def test_new_order_is_sent_to_kitchen(client, menu, emitted):
    body = {"table_number": 5, "items": [{"item_id": PIZZA["id"], "quantity": 1}]}
    order = client.post("/orders", json=body).json()
    assert emitted == [("new-order", order, "kitchen")]


def test_status_change_is_sent_to_table_and_kitchen(client, menu, emitted):
    body = {"table_number": 5, "items": [{"item_id": PIZZA["id"], "quantity": 1}]}
    order = client.post("/orders", json=body).json()
    emitted.clear()

    client.patch(f"/orders/{order['id']}/status", json={"status": "preparing"})
    event = {"id": order["id"], "table_number": 5, "status": "preparing"}
    assert emitted == [
        ("order-status", event, "table-5"),
        ("order-status", event, "kitchen"),
    ]


def test_join_only_accepts_known_rooms(monkeypatch):
    entered = []

    async def fake_enter_room(sid, room):
        entered.append(room)

    monkeypatch.setattr(sio, "enter_room", fake_enter_room)
    assert asyncio.run(join("sid", {"room": "kitchen"}))["ok"] is True
    assert asyncio.run(join("sid", {"room": "table-12"}))["ok"] is True
    assert asyncio.run(join("sid", {"room": "table-abc"}))["ok"] is False
    assert asyncio.run(join("sid", {"room": "admin"}))["ok"] is False
    assert asyncio.run(join("sid", "kitchen"))["ok"] is False
    assert entered == ["kitchen", "table-12"]
