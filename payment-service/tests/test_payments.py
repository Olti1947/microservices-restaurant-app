import httpx

from app.clients import ORDER_URL, TABLE_URL


def test_bill_sums_unpaid_orders(client, services):
    response = client.get("/bills/5")
    assert response.status_code == 200
    bill = response.json()
    assert bill["table_number"] == 5
    assert bill["total"] == 26.5
    assert len(bill["orders"]) == 2


def test_empty_bill(client, services):
    assert client.get("/bills/3").json() == {"table_number": 3, "orders": [], "total": 0}


def test_pay_records_payment_and_calls_services(client, services):
    response = client.post("/payments", json={"table_number": 5})
    assert response.status_code == 201
    payment = response.json()
    assert payment["amount"] == 26.5
    assert payment["paid"] is True

    assert services.calls.call_count == 3  # bill, mark paid, free table
    paid_call, free_call = services.calls[1].request, services.calls[2].request
    assert str(paid_call.url) == f"{ORDER_URL}/orders/pay?table_number=5"
    assert str(free_call.url) == f"{TABLE_URL}/tables/5/free"

    assert client.get("/payments", params={"table_number": 5}).json() == [payment]


def test_nothing_to_pay_returns_400(client, services):
    assert client.post("/payments", json={"table_number": 3}).status_code == 400
    assert client.get("/payments").json() == []


def test_order_service_down_returns_503(client, services):
    services.get(f"{ORDER_URL}/orders").mock(side_effect=httpx.ConnectError("down"))
    services.get(f"{ORDER_URL}/orders", params={"table_number": "5"}).mock(side_effect=httpx.ConnectError("down"))
    assert client.get("/bills/5").status_code == 503
    assert client.post("/payments", json={"table_number": 5}).status_code == 503
    assert client.get("/payments").json() == []
