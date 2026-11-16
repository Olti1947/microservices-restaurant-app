# Restaurant Table Ordering App

University microservices project: diners order food from their table, the kitchen sees new orders live, and diners see status updates in real time.

## Services

| Service | Folder | Port | What it does |
|---|---|---|---|
| Table | `table-service/` | 8001 | Lists tables, marks them occupied or free |
| Menu | `menu-service/` | 8002 | Food and drinks with prices |
| Order | `order-service/` | 8003 | Stores orders and status changes, Socket.IO server |
| Payment | `payment-service/` | 8004 | Bill for a table, takes payment |
| Kitchen screen | `kitchen-screen/` | 8080 | Web page showing incoming orders |

Each service has its own MongoDB database and the services talk to each other over REST.

## Running

Instructions will be added once the services are in place (`docker compose up --build`).

## Documentation

- [Architecture](docs/architecture.md)
- [Order flow](docs/order-flow.md)
