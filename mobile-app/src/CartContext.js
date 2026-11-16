import { createContext, useContext, useState } from "react";

// Shared state for the visit: which table the diner sits at, and their cart.
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [tableNumber, setTableNumber] = useState(null);
  // Cart lines by menu item id: { [id]: { item, quantity } }
  const [cart, setCart] = useState({});

  function add(item) {
    setCart((prev) => ({
      ...prev,
      [item.id]: { item, quantity: (prev[item.id]?.quantity ?? 0) + 1 },
    }));
  }

  function remove(item) {
    setCart((prev) => {
      const quantity = (prev[item.id]?.quantity ?? 0) - 1;
      const next = { ...prev };
      if (quantity > 0) next[item.id] = { item, quantity };
      else delete next[item.id];
      return next;
    });
  }

  function clear() {
    setCart({});
  }

  const lines = Object.values(cart);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  // Only shown to the diner; the Order service computes the real total.
  const total = lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const quantityOf = (item) => cart[item.id]?.quantity ?? 0;

  const value = { tableNumber, setTableNumber, lines, count, total, add, remove, clear, quantityOf };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
