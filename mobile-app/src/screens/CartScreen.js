import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { api } from "../api";
import Button from "../Button";
import { useCart } from "../CartContext";
import { categoryOf, emojiFor } from "../food";
import { formatPrice } from "../format";
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
        {lines.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text style={{ fontSize: 48 }}>🛒</Text>
            <Text style={[styles.muted, { marginTop: 8 }]}>Your cart is empty.</Text>
          </View>
        )}
        {lines.map(({ item, quantity }) => (
          <View key={item.id} style={[styles.card, styles.row, { gap: 12 }]}>
            <View style={[styles.avatar, { width: 40, height: 40, backgroundColor: categoryOf(item).color + "1f" }]}>
              <Text style={{ fontSize: 22 }}>{emojiFor(item)}</Text>
            </View>
            <Text style={[styles.text, { flex: 1 }]}>
              <Text style={{ fontWeight: "700" }}>{quantity} ×</Text> {item.name}
            </Text>
            <Text style={styles.price}>{formatPrice(item.price * quantity)}</Text>
          </View>
        ))}
        {lines.length > 0 && (
          <View style={[styles.row, { marginTop: 6, paddingHorizontal: 4 }]}>
            <Text style={[styles.title, { fontSize: 20 }]}>Total</Text>
            <Text style={[styles.title, styles.price, { fontSize: 20 }]}>{formatPrice(total)}</Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          icon="checkmark-circle"
          title={sending ? "Sending…" : "Place order"}
          onPress={placeOrder}
          disabled={sending || lines.length === 0}
        />
      </View>
    </View>
  );
}
