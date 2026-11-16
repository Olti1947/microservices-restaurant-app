# Restaurant Table Ordering App

University microservices project: diners order food from their table, the kitchen sees new orders live, and diners see status updates in real time.

A diner picks a table in the mobile app, chooses food from the menu and places an order. The order appears instantly on the kitchen screen, where the cook moves it from `received` to `preparing`, `ready` and `served`. The diner's phone shows each change live. At the end the diner asks for the bill and pays.

## Services

| Service | Folder | Port | What it does |
|---|---|---|---|
| Table | `table-service/` | 8001 | Lists tables, marks them occupied or free |
| Menu | `menu-service/` | 8002 | Food and drinks with prices |
| Order | `order-service/` | 8003 | Stores orders and status changes, Socket.IO server |
| Payment | `payment-service/` | 8004 | Bill for a table, takes payment |
| Kitchen screen | `kitchen-screen/` | 8080 | Web page showing incoming orders |
| MongoDB | (container) | 27017 | One database per service |

Each service is a small FastAPI app with its own MongoDB database. The services talk to each other over REST, and the Order service pushes live updates over Socket.IO. Every service has interactive API docs (Swagger) at `http://localhost:<port>/docs`.

## Running

You need [Docker](https://docs.docker.com/get-docker/) and, for the mobile app, [Node.js](https://nodejs.org/) 22 or newer and the Expo Go app on your phone.

### 1. Start the backend

```bash
docker compose up --build
```

This starts MongoDB, the four services and the kitchen screen. The menu and tables 1–10 are created on first start. Open the kitchen screen at http://localhost:8080.

### 2. Start the mobile app

A phone can't reach `localhost` on your computer, so tell the app your computer's IP address on the local network (on macOS: `ipconfig getifaddr en0`):

```bash
cd mobile-app
npm install
echo "EXPO_PUBLIC_API_HOST=192.168.1.50" > .env   # your computer's IP
npx expo start
```

Scan the QR code with Expo Go (the phone must be on the same Wi-Fi). Press `w` to open the web version in a browser instead; that works with `localhost`.

### 3. Try it

1. In the app, choose a table, add some food and place the order.
2. The order appears on the kitchen screen. Click **Start preparing**, **Mark ready** and **Mark served**.
3. The app's order status updates live with each click.
4. Tap **Get the bill**, then **Pay**. The table is free again.

## Tests

Each service has its own tests. They need MongoDB on `localhost:27017` (for example from `docker compose up`) and use a separate test database that is dropped afterwards. Calls to other services are faked with `respx`, so each service is tested on its own.

```bash
cd order-service          # or menu-service, table-service, payment-service
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest
```

## Running a service without Docker

Start MongoDB (`docker run -p 27017:27017 mongo:7`), then in a service folder:

```bash
.venv/bin/uvicorn app.main:app --reload --port 8002   # use the service's port
```

Services read their settings from environment variables, with defaults for running locally:

| Variable | Used by | Default |
|---|---|---|
| `MONGO_URL` | all | `mongodb://localhost:27017` |
| `MENU_URL` | Order | `http://localhost:8002` |
| `ORDER_URL` | Payment | `http://localhost:8003` |
| `TABLE_URL` | Payment | `http://localhost:8001` |

## Documentation

- [Architecture](docs/architecture.md): the services, how they talk, and the API
- [Order flow](docs/order-flow.md): sequence diagram of one full visit
