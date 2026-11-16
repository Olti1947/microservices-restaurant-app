def test_tables_are_seeded(client):
    response = client.get("/tables")
    assert response.status_code == 200
    tables = response.json()
    assert [t["number"] for t in tables] == list(range(1, 11))
    assert {"id", "number", "status"} <= tables[0].keys()


def test_get_one_table(client):
    response = client.get("/tables/3")
    assert response.status_code == 200
    assert response.json()["number"] == 3


def test_unknown_table_returns_404(client):
    assert client.get("/tables/99").status_code == 404
    assert client.post("/tables/99/occupy").status_code == 404
    assert client.post("/tables/99/free").status_code == 404


def test_occupy_then_free(client):
    response = client.post("/tables/5/occupy")
    assert response.status_code == 200
    assert response.json()["status"] == "occupied"

    # Occupying it again is a conflict.
    response = client.post("/tables/5/occupy")
    assert response.status_code == 409

    response = client.post("/tables/5/free")
    assert response.status_code == 200
    assert response.json()["status"] == "free"


def test_free_is_idempotent(client):
    assert client.post("/tables/6/free").status_code == 200
    assert client.post("/tables/6/free").status_code == 200
    assert client.get("/tables/6").json()["status"] == "free"
