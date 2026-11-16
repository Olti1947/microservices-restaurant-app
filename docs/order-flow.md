# Order Flow

One full visit: the diner picks a table, orders, follows the order live while the kitchen works on it, and pays.

Solid arrows are REST requests and responses. Open arrowheads from the Order service are Socket.IO events pushed in real time.

```mermaid
sequenceDiagram
    autonumber
    actor Diner as Diner App
    participant Table as Table Service
    participant Menu as Menu Service
    participant Order as Order Service
    participant Payment as Payment Service
    actor Kitchen as Kitchen Screen

    Diner->>Table: Choose table 5
    Table-->>Diner: Table 5 is now occupied
    Diner->>Menu: Get menu
    Menu-->>Diner: Items and prices
    Diner->>Order: Place order (table 5, items)
    Order->>Menu: Get prices for items
    Menu-->>Order: Prices
    Order-->>Diner: Order received
    Order--)Kitchen: Socket.IO "new-order"
    Kitchen->>Order: Set status to preparing
    Order--)Diner: Socket.IO "order-status: preparing"
    Kitchen->>Order: Set status to ready
    Order--)Diner: Socket.IO "order-status: ready"
    Diner->>Payment: Get bill for table 5
    Payment->>Order: Get orders for table 5
    Order-->>Payment: Orders and totals
    Payment-->>Diner: Bill total
    Diner->>Payment: Pay
    Payment-->>Diner: Paid, thank you
```

## What happens at each stage

1. **Choose a table (1–2).** The Table service marks the table as occupied.
2. **Browse the menu (3–4).** The Menu service returns items and prices.
3. **Place the order (5–8).** The Order service asks Menu for current prices, computes the total, saves the order, and answers the diner.
4. **Kitchen is notified (9).** The Order service emits `new-order` to the kitchen over Socket.IO.
5. **Kitchen updates status (10–13).** Each status change is a REST call from the kitchen; the Order service pushes `order-status` to the diner.
6. **Bill and payment (14–19).** The Payment service asks Order for the table's orders to build the bill, then records the payment.
