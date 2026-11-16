import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { api, formatPrice } from "../api";
import Button from "../Button";
import { useCart } from "../CartContext";
import { styles } from "../styles";

export default function CartScreen({ navigation }) {
  const { tableNumber, lines, total, clear } = useCart();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  async function placeOrder() {
    setSending(true);
    setError(null);
    try {
      const items = lines.map((line) => ({ item_id: line.item.id, quantity: line.quantity }));
      await api.placeOrder(tableNumber, items);
      clear();
      // Show the order status; "back" from there goes to the menu to order more.
      navigation.reset({ index: 1, routes: [{ name: "Menu" }, { name: "Orders" }] });
    } catch (e) {
      setError(e.message);
      setSending(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {error && <Text style={styles.error}>{error}</Text>}
        {lines.length === 0 && <Text style={styles.muted}>Your cart is empty.</Text>}
        {lines.map(({ item, quantity }) => (
          <View key={item.id} style={[styles.card, styles.row]}>
            <Text style={{ fontSize: 16 }}>
              {quantity} × {item.name}
            </Text>
            <Text>{formatPrice(item.price * quantity)}</Text>
          </View>
        ))}
        <View style={[styles.row, { marginTop: 6 }]}>
          <Text style={styles.title}>Total</Text>
          <Text style={styles.title}>{formatPrice(total)}</Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={sending ? "Sending…" : "Place order"}
          onPress={placeOrder}
          disabled={sending || lines.length === 0}
        />
      </View>
    </View>
  );
}
