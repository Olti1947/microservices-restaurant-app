import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { io } from "socket.io-client";

import { api, formatPrice } from "../api";
import Button from "../Button";
import { useCart } from "../CartContext";
import { ORDER_URL } from "../config";
import { colors, styles } from "../styles";

const STATUS_TEXT = {
  received: "Received",
  preparing: "Being prepared",
  ready: "Ready, on its way",
  served: "Served",
};

const STATUS_COLOR = {
  received: "#7f8c8d",
  preparing: "#d68910",
  ready: colors.primary,
  served: "#2c3e50",
};

export default function OrdersScreen({ navigation }) {
  const { tableNumber } = useCart();
  const [orders, setOrders] = useState([]);
  const [live, setLive] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    function loadOrders() {
      api.getOpenOrders(tableNumber).then(setOrders).catch((e) => setError(e.message));
    }

    // Live status updates: join this table's room on the Order service.
    const socket = io(ORDER_URL, { transports: ["websocket"] });
    socket.on("connect", () => {
      setLive(true);
      socket.emit("join", { room: `table-${tableNumber}` });
      loadOrders(); // also after a reconnect, in case we missed an update
    });
    socket.on("disconnect", () => setLive(false));
    socket.on("order-status", ({ id, status }) => {
      setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
    });

    loadOrders();
    return () => socket.disconnect();
  }, [tableNumber]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.muted, { marginBottom: 12 }]}>
          {live ? "● Live updates on" : "○ Connecting…"}
        </Text>
        {error && <Text style={styles.error}>{error}</Text>}
        {orders.length === 0 && <Text style={styles.muted}>No orders yet.</Text>}
        {orders.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={[styles.row, { marginBottom: 6 }]}>
              <Text style={[styles.title, { color: STATUS_COLOR[order.status] }]}>
                {STATUS_TEXT[order.status]}
              </Text>
              <Text style={styles.muted}>{formatPrice(order.total)}</Text>
            </View>
            {order.items.map((item) => (
              <Text key={item.item_id}>
                {item.quantity} × {item.name}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
      <View style={[styles.footer, { gap: 10 }]}>
        <Button title="Order more" onPress={() => navigation.navigate("Menu")} />
        <Button
          title="Get the bill"
          onPress={() => navigation.navigate("Bill")}
          disabled={orders.length === 0}
        />
      </View>
    </View>
  );
}
