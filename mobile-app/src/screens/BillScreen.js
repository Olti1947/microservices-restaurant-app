import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { api, formatPrice } from "../api";
import Button from "../Button";
import { useCart } from "../CartContext";
import { styles } from "../styles";

export default function BillScreen({ navigation }) {
  const { tableNumber, setTableNumber } = useCart();
  const [bill, setBill] = useState(null);
  const [payment, setPayment] = useState(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getBill(tableNumber).then(setBill).catch((e) => setError(e.message));
  }, [tableNumber]);

  async function pay() {
    setPaying(true);
    setError(null);
    try {
      setPayment(await api.pay(tableNumber));
    } catch (e) {
      setError(e.message);
      setPaying(false);
    }
  }

  function finish() {
    // The visit is over: start again from the table list.
    setTableNumber(null);
    navigation.reset({ index: 0, routes: [{ name: "Tables" }] });
  }

  if (payment) {
    return (
      <View style={[styles.screen, styles.content, { justifyContent: "center", gap: 16 }]}>
        <Text style={[styles.title, { fontSize: 24, textAlign: "center" }]}>Thank you!</Text>
        <Text style={{ textAlign: "center" }}>
          You paid {formatPrice(payment.amount)} for table {payment.table_number}.
        </Text>
        <Button title="Done" onPress={finish} />
      </View>
    );
  }

  // All items from every unpaid order, one line each.
  const lines = bill ? bill.orders.flatMap((order) => order.items) : [];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {error && <Text style={styles.error}>{error}</Text>}
        {!bill && !error && <Text style={styles.muted}>Loading bill…</Text>}
        {lines.map((item, index) => (
          <View key={index} style={[styles.card, styles.row]}>
            <Text style={{ fontSize: 16 }}>
              {item.quantity} × {item.name}
            </Text>
            <Text>{formatPrice(item.price * item.quantity)}</Text>
          </View>
        ))}
        {bill && (
          <View style={[styles.row, { marginTop: 6 }]}>
            <Text style={styles.title}>Total</Text>
            <Text style={styles.title}>{formatPrice(bill.total)}</Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={paying ? "Paying…" : bill ? `Pay ${formatPrice(bill.total)}` : "Pay"}
          onPress={pay}
          disabled={paying || !bill || bill.total === 0}
        />
      </View>
    </View>
  );
}
