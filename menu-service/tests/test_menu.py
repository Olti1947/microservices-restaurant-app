def test_menu_is_seeded(client):
    response = client.get("/menu")
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 10
    assert {"id", "name", "price", "category"} <= items[0].keys()


def test_filter_by_category(client):
    response = client.get("/menu", params={"category": "drink"})
    assert response.status_code == 200
    items = response.json()
    assert items
    assert all(item["category"] == "drink" for item in items)


def test_get_one_item(client):
    first = client.get("/menu").json()[0]
    response = client.get(f"/menu/{first['id']}")
    assert response.status_code == 200
    assert response.json() == first


def test_unknown_item_returns_404(client):
    assert client.get("/menu/000000000000000000000000").status_code == 404
    assert client.get("/menu/not-an-id").status_code == 404


def test_create_item(client):
    body = {"name": "Lemonade", "price": 3.20, "category": "drink"}
    response = client.post("/menu", json=body)
    assert response.status_code == 201
    created = response.json()
    assert created["name"] == "Lemonade"
    assert client.get(f"/menu/{created['id']}").json() == created


def test_price_must_be_positive(client):
    body = {"name": "Free Water", "price": 0, "category": "drink"}
    assert client.post("/menu", json=body).status_code == 422
