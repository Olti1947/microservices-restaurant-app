from tests.conftest import PIZZA


def test_new_order_is_sent_to_kitchen(client, menu, emitted):
    body = {"table_number": 5, "items": [{"item_id": PIZZA["id"], "quantity": 1}]}
    order = client.post("/orders", json=body).json()
    assert emitted == [("new-order", order, "kitchen")]


def test_status_change_is_sent_to_table_and_kitchen(client, menu, emitted):
    body = {"table_number": 5, "items": [{"item_id": PIZZA["id"], "quantity": 1}]}
    order = client.post("/orders", json=body).json()
    emitted.clear()

    client.patch(f"/orders/{order['id']}/status", json={"status": "ready"})
    event = {"id": order["id"], "table_number": 5, "status": "ready"}
    assert emitted == [
        ("order-status", event, "table-5"),
        ("order-status", event, "kitchen"),
    ]
