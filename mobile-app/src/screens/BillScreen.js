import { Ionicons } from "@expo/vector-icons";
import { useEffect, useLayoutEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { api } from "../api";
import Button from "../Button";
import { useCart } from "../CartContext";
import { formatPrice } from "../format";
import { colors, styles } from "../styles";

export default function BillScreen({ navigation }) {
  const { tableNumber, setTableNumber } = useCart();
  const [bill, setBill] = useState(null);
  const [payment, setPayment] = useState(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getBill(tableNumber).then(setBill).catch((e) => setError(e.message));
  }, [tableNumber]);

  // After paying there is nothing to go back to, so hide the back button.
  useLayoutEffect(() => {
    if (payment) navigation.setOptions({ title: "Paid", headerBackVisible: false, headerLeft: () => null, gestureEnabled: false });
  }, [navigation, payment]);

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
      <View style={[styles.screen, styles.content, { justifyContent: "center", alignItems: "center", gap: 12 }]}>
        <Ionicons name="checkmark-circle" size={96} color={colors.green} />
        <Text style={[styles.title, { fontSize: 26 }]}>Thank you!</Text>
        <Text style={[styles.text, { textAlign: "center" }]}>
          You paid <Text style={styles.price}>{formatPrice(payment.amount)}</Text> for table {payment.table_number}.
        </Text>
        <Text style={[styles.muted, { marginBottom: 12 }]}>We hope to see you again soon 👋</Text>
        <View style={{ alignSelf: "stretch" }}>
          <Button icon="home" title="Done" onPress={finish} />
        </View>
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
        {bill && (
          // Styled like a paper receipt.
          <View style={[styles.card, { padding: 20 }]}>
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <Ionicons name="receipt" size={36} color={colors.primary} />
              <Text style={[styles.title, { fontSize: 20, marginTop: 4 }]}>Table {bill.table_number}</Text>
              <Text style={styles.muted}>{new Date().toLocaleDateString()}</Text>
            </View>
            <Divider />
            {lines.length === 0 && <Text style={[styles.muted, { textAlign: "center" }]}>Nothing to pay.</Text>}
            {lines.map((item, index) => (
              <View key={index} style={[styles.row, { paddingVertical: 6 }]}>
                <Text style={styles.text}>
                  {item.quantity} × {item.name}
                </Text>
                <Text style={styles.text}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            ))}
            <Divider />
            <View style={styles.row}>
              <Text style={[styles.title, { fontSize: 20 }]}>Total</Text>
              <Text style={[styles.title, styles.price, { fontSize: 22 }]}>{formatPrice(bill.total)}</Text>
            </View>
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          icon="card"
          title={paying ? "Paying…" : bill ? `Pay ${formatPrice(bill.total)}` : "Pay"}
          onPress={pay}
          disabled={paying || !bill || bill.total === 0}
        />
      </View>
    </View>
  );
}

function Divider() {
  return <View style={{ borderTopWidth: 2, borderStyle: "dashed", borderColor: colors.border, marginVertical: 12 }} />;
}
