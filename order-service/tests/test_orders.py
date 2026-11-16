import httpx

from tests.conftest import COLA, PIZZA


def place_order(client, table_number=5):
    body = {
        "table_number": table_number,
        "items": [
            {"item_id": PIZZA["id"], "quantity": 2},
            {"item_id": COLA["id"], "quantity": 3},
        ],
    }
    return client.post("/orders", json=body)


def test_create_order_computes_total(client, menu):
    response = place_order(client)
    assert response.status_code == 201
    order = response.json()
    assert order["total"] == 2 * 9.5 + 3 * 2.5
    assert order["status"] == "received"
    assert order["paid"] is False
    assert order["items"][0] == {"item_id": PIZZA["id"], "name": "Pizza", "price": 9.5, "quantity": 2}


def test_client_prices_are_ignored(client, menu):
    body = {"table_number": 1, "items": [{"item_id": PIZZA["id"], "quantity": 1, "price": 0.01}]}
    assert client.post("/orders", json=body).json()["total"] == 9.5


def test_unknown_item_returns_400(client, menu):
    body = {"table_number": 1, "items": [{"item_id": "cccccccccccccccccccccccc", "quantity": 1}]}
    response = client.post("/orders", json=body)
    assert response.status_code == 400
    assert client.get("/orders").json() == []


def test_menu_down_returns_503(client, menu):
    menu.get(f"/menu/{PIZZA['id']}").mock(side_effect=httpx.ConnectError("down"))
    body = {"table_number": 1, "items": [{"item_id": PIZZA["id"], "quantity": 1}]}
    assert client.post("/orders", json=body).status_code == 503


def test_get_order_and_404(client, menu):
    order = place_order(client).json()
    assert client.get(f"/orders/{order['id']}").json() == order
    assert client.get("/orders/000000000000000000000000").status_code == 404
    assert client.get("/orders/not-an-id").status_code == 404


def test_list_orders_with_filters(client, menu):
    first = place_order(client, table_number=5).json()
    second = place_order(client, table_number=5).json()
    place_order(client, table_number=7)

    table_5 = client.get("/orders", params={"table_number": 5}).json()
    # Newest first.
    assert [o["id"] for o in table_5] == [second["id"], first["id"]]
    assert len(client.get("/orders").json()) == 3
    assert len(client.get("/orders", params={"status": "ready"}).json()) == 0


def test_update_status(client, menu):
    order = place_order(client).json()
    response = client.patch(f"/orders/{order['id']}/status", json={"status": "preparing"})
    assert response.status_code == 200
    assert response.json()["status"] == "preparing"
    assert client.patch(f"/orders/{order['id']}/status", json={"status": "eaten"}).status_code == 422


def test_status_only_moves_one_step_forward(client, menu):
    order = place_order(client).json()
    url = f"/orders/{order['id']}/status"
    # Skipping a step is refused.
    assert client.patch(url, json={"status": "ready"}).status_code == 409
    for status in ("preparing", "ready", "served"):
        assert client.patch(url, json={"status": status}).status_code == 200
    # Going back, or repeating the same status, is refused.
    assert client.patch(url, json={"status": "received"}).status_code == 409
    assert client.patch(url, json={"status": "served"}).status_code == 409
    assert client.patch("/orders/000000000000000000000000/status", json={"status": "preparing"}).status_code == 404


def test_malformed_item_id_returns_400(client, menu):
    for item_id in ("", "not-an-id", "?category=main"):
        body = {"table_number": 1, "items": [{"item_id": item_id, "quantity": 1}]}
        assert client.post("/orders", json=body).status_code == 400


def test_pay_marks_only_the_billed_orders(client, menu):
    first = place_order(client, table_number=5).json()
    second = place_order(client, table_number=5).json()
    place_order(client, table_number=7)

    response = client.post("/orders/pay", json={"table_number": 5, "order_ids": [first["id"], second["id"]]})
    assert response.json() == {"table_number": 5, "orders_paid": 2}
    assert client.get("/orders", params={"table_number": 5, "paid": False}).json() == []
    assert len(client.get("/orders", params={"paid": False}).json()) == 1


def test_order_placed_after_the_bill_stays_unpaid(client, menu):
    billed = place_order(client, table_number=5).json()
    late = place_order(client, table_number=5).json()  # placed after the bill was built

    client.post("/orders/pay", json={"table_number": 5, "order_ids": [billed["id"]]})
    unpaid = client.get("/orders", params={"table_number": 5, "paid": False}).json()
    assert [o["id"] for o in unpaid] == [late["id"]]


def test_pay_ignores_other_tables_and_paid_orders(client, menu):
    order = place_order(client, table_number=7).json()
    body = {"table_number": 5, "order_ids": [order["id"]]}
    assert client.post("/orders/pay", json=body).json()["orders_paid"] == 0

    body["table_number"] = 7
    assert client.post("/orders/pay", json=body).json()["orders_paid"] == 1
    assert client.post("/orders/pay", json=body).json()["orders_paid"] == 0
    assert client.post("/orders/pay", json={"table_number": 7, "order_ids": ["bad"]}).status_code == 400
