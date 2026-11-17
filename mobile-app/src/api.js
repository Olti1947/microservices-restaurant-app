import { MENU_URL, ORDER_URL, PAYMENT_URL, TABLE_URL } from "./config";

// Small wrapper around fetch: sends/receives JSON and turns API errors into
// exceptions with the server's "detail" message.
async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : `Request failed (${response.status})`;
    throw new Error(detail);
  }
  return data;
}

export const api = {
  getTables: () => request(`${TABLE_URL}/tables`),
  occupyTable: (number) => request(`${TABLE_URL}/tables/${number}/occupy`, { method: "POST" }),
  freeTable: (number) => request(`${TABLE_URL}/tables/${number}/free`, { method: "POST" }),

  getMenu: () => request(`${MENU_URL}/menu`),

  // items: [{ item_id, quantity }]. Prices are worked out by the server.
  placeOrder: (tableNumber, items) =>
    request(`${ORDER_URL}/orders`, {
      method: "POST",
      body: JSON.stringify({ table_number: tableNumber, items }),
    }),
  getOpenOrders: (tableNumber) => request(`${ORDER_URL}/orders?table_number=${tableNumber}&paid=false`),

  getBill: (tableNumber) => request(`${PAYMENT_URL}/bills/${tableNumber}`),
  pay: (tableNumber) =>
    request(`${PAYMENT_URL}/payments`, {
      method: "POST",
      body: JSON.stringify({ table_number: tableNumber }),
    }),
};
