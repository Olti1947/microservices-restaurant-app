# Build-It-Yourself Plan (Python backend)

Every line of the Python code is written by hand. Each step has a goal, the concepts it introduces, and a check that tells you it works.

## How each step works

1. **Read the step below.** Each one has a goal, the Python concepts you'll meet, and a "done when" check.
2. **Read up on anything new** before you start (e.g. FastAPI path parameters, with a tiny example outside the project).
3. **Write the code yourself.** When you're stuck, go one level deeper at a time:
   - Level 1: which concept or docs page to look at
   - Level 2: pseudocode / the shape of the solution
   - Level 3: a small code snippet for just the part you're stuck on
4. **Test it** with the "done when" check (Swagger UI at `http://localhost:8000/docs` is your best friend).
5. **Get a review.** Push to GitHub and open a pull request. Reviews cover bugs, Python style ("pythonic" ways), and one thing to learn next.
6. **Commit** and move to the next step.

## Step 0 — Setup (½ day)
- Install Python 3.12, VS Code (+ Python extension), Git, Docker Desktop.
- Create a GitHub repo `restaurant-app` with the folder layout from [architecture.md](architecture.md).
- Learn: virtual environments (`python -m venv .venv`), `pip install`, `requirements.txt`.
- **Done when:** `python --version` works and the empty repo is on GitHub.

## Step 1 — Python warm-up (1–2 days, skip parts you know)
- Write a tiny script `menu.py` that holds a list of menu items as dictionaries, prints them, filters by category, and calculates the total of an order.
- Learn: lists, dicts, loops, functions, f-strings, list comprehensions, type hints.
- **Done when:** `python menu.py` prints the menu and an order total correctly.

## Step 2 — Menu service, in memory (1 day)
- First FastAPI app: `GET /menu`, `GET /menu/{item_id}`, `POST /menu`. Store items in a Python list for now.
- Learn: FastAPI routes, path parameters, Pydantic models (`class MenuItem(BaseModel)`), status codes, `HTTPException`, running with `uvicorn`.
- **Done when:** you can add and fetch items from Swagger at `/docs`, and a missing id returns 404.

## Step 3 — Add MongoDB to Menu (1 day)
- Run MongoDB with Docker (`docker run -p 27017:27017 mongo`) and replace the list with a collection.
- Learn: `pymongo`, environment variables (`os.getenv("MONGO_URL")`), converting Mongo `_id` to strings.
- **Done when:** items survive restarting the service.

## Step 4 — Table service (½–1 day, on your own)
- Same pattern as Menu: `GET /tables`, `POST /tables/{id}/occupy`, `POST /tables/{id}/free`.
- Try this one with as few hints as possible. It's your check that steps 2–3 stuck.
- **Done when:** occupying an already occupied table returns an error.

## Step 5 — Order service, REST part (1–2 days)
- `POST /orders` (tableId + list of itemIds and quantities), `GET /orders?table_id=5`, `PATCH /orders/{id}/status`.
- The order service **calls the Menu service** with `httpx` to get prices and computes the total.
- Learn: calling another service over HTTP, handling errors when Menu is down, query parameters, enums for status (`received`, `preparing`, `ready`, `served`).
- **Done when:** placing an order with an unknown item returns 400, and a valid one stores the correct total.

## Step 6 — Real time with Socket.IO (1–2 days)
- Add `python-socketio` to the Order service. Emit `new-order` when an order is created and `order-status` when its status changes.
- Build a ~30-line HTML kitchen page that connects with the Socket.IO JS client and lists orders live, with buttons to change status.
- Learn: what WebSockets are vs REST, events and rooms (`room="kitchen"`, `room=f"table-{id}"`), async functions (`async def` / `await`).
- **Done when:** two browser tabs open; placing an order in Swagger makes it appear instantly on the kitchen page.

## Step 7 — Payment service (1 day)
- `GET /bills/{table_id}` (calls Order to sum the table's orders), `POST /payments` (marks paid, frees the table by calling Table).
- **Done when:** paying makes the table free again.

## Step 8 — Docker Compose (1 day)
- A `Dockerfile` per service and one `docker-compose.yml` with the 4 services + MongoDB.
- Learn: Dockerfiles, service names as hostnames (`http://menu-service:8000`), ports, volumes.
- **Done when:** `docker compose up` starts everything and the full flow works.

## Step 9 — Mobile app (2–4 days)
- React Native with Expo: screens for choose table → menu → cart → order status (live via Socket.IO) → bill.
- This part is JavaScript. It can be scaffolded to keep the learning time for Python, or written by hand too.
- **Done when:** you order from your phone and the kitchen page updates live.

## Step 10 — Polish for the grade
- A few tests with `pytest` + FastAPI's `TestClient` (at least for Menu and Order).
- README with how to run, the architecture diagram, and the sequence diagram (both are in `docs/` as Mermaid).
- Prepare to explain: why microservices, data per service, REST vs real time.

## Getting a review

When you finish a step, push it to GitHub and open a pull request for review.
