import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { io } from "socket.io-client";

import { api } from "../api";
import Button from "../Button";
import { useCart } from "../CartContext";
import { ORDER_URL } from "../config";
import { formatPrice } from "../format";
import { colors, statusColors, styles } from "../styles";

// The steps an order goes through, with an icon for each.
const STEPS = [
  { status: "received", label: "Received", icon: "receipt-outline" },
  { status: "preparing", label: "Cooking", icon: "flame-outline" },
  { status: "ready", label: "Ready", icon: "notifications-outline" },
  { status: "served", label: "Served", icon: "restaurant-outline" },
];

const STATUS_TEXT = {
  received: "The kitchen got your order",
  preparing: "Your food is being prepared",
  ready: "Ready, on its way to you",
  served: "Enjoy your meal!",
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
        <View style={[styles.pill, { flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 12,
          backgroundColor: live ? colors.green + "22" : colors.border }]}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: live ? colors.green : colors.muted }} />
          <Text style={{ color: live ? colors.green : colors.muted, fontWeight: "600" }}>
            {live ? "Live updates on" : "Connecting…"}
          </Text>
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
        {orders.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text style={{ fontSize: 48 }}>🧑‍🍳</Text>
            <Text style={[styles.muted, { marginTop: 8 }]}>No orders yet.</Text>
          </View>
        )}
        {orders.map((order) => (
          <View key={order.id} style={[styles.card, { borderTopWidth: 5, borderTopColor: statusColors[order.status] }]}>
            <View style={[styles.row, { marginBottom: 12 }]}>
              <Text style={[styles.title, { color: statusColors[order.status], flex: 1 }]}>
                {STATUS_TEXT[order.status]}
              </Text>
              <Text style={styles.price}>{formatPrice(order.total)}</Text>
            </View>
            <StatusTracker status={order.status} />
            <View style={{ marginTop: 12, borderTopWidth: 1, borderColor: colors.border, paddingTop: 10 }}>
              {order.items.map((item) => (
                <Text key={item.item_id} style={styles.text}>
                  <Text style={{ fontWeight: "700" }}>{item.quantity} ×</Text> {item.name}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.footer, { gap: 10 }]}>
        <Button icon="add-circle-outline" title="Order more" variant="outline" onPress={() => navigation.navigate("Menu")} />
        <Button
          icon="receipt"
          title="Get the bill"
          onPress={() => navigation.navigate("Bill")}
          disabled={orders.length === 0}
        />
      </View>
    </View>
  );
}

// A row of four icons joined by a line; steps up to the current one are colored.
function StatusTracker({ status }) {
  const current = STEPS.findIndex((step) => step.status === status);
  const color = statusColors[status];
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      {STEPS.map((step, index) => {
        const done = index <= current;
        return (
          <View key={step.status} style={{ flex: 1, alignItems: "center" }}>
            {index > 0 && (
              <View style={{ position: "absolute", top: 17, right: "50%", width: "100%", height: 3,
                backgroundColor: done ? color : colors.border }} />
            )}
            <View style={[styles.avatar, { width: 36, height: 36, backgroundColor: done ? color : colors.border }]}>
              <Ionicons name={step.icon} size={18} color={done ? "#fff" : colors.muted} />
            </View>
            <Text style={{ fontSize: 12, marginTop: 4, color: done ? colors.text : colors.muted,
              fontWeight: index === current ? "700" : "400" }}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
