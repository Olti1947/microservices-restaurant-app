import { useEffect, useLayoutEffect, useState } from "react";
import { Pressable, SectionList, Text, View } from "react-native";

import { api, formatPrice } from "../api";
import Button from "../Button";
import { useCart } from "../CartContext";
import { colors, styles } from "../styles";

const CATEGORIES = [
  { key: "starter", title: "Starters" },
  { key: "main", title: "Mains" },
  { key: "dessert", title: "Desserts" },
  { key: "drink", title: "Drinks" },
];

export default function MenuScreen({ navigation }) {
  const { tableNumber, count, total, add, remove, quantityOf } = useCart();
  const [menu, setMenu] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getMenu().then(setMenu).catch((e) => setError(e.message));
  }, []);

  // Header shows the table and a link to the orders already placed.
  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Table ${tableNumber}`,
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate("Orders")}>
          <Text style={{ color: colors.primary, fontSize: 16 }}>My orders</Text>
        </Pressable>
      ),
    });
  }, [navigation, tableNumber]);

  // Group the menu into one section per category.
  const sections = CATEGORIES.map((category) => ({
    title: category.title,
    data: menu.filter((item) => item.category === category.key),
  })).filter((section) => section.data.length > 0);

  return (
    <View style={styles.screen}>
      <SectionList
        contentContainerStyle={styles.content}
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={error && <Text style={styles.error}>{error}</Text>}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.title, { marginTop: 8, marginBottom: 8 }]}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <View style={[styles.card, styles.row]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16 }}>{item.name}</Text>
              <Text style={styles.muted}>{formatPrice(item.price)}</Text>
            </View>
            <View style={[styles.row, { gap: 12 }]}>
              {quantityOf(item) > 0 && (
                <>
                  <QuantityButton label="−" onPress={() => remove(item)} />
                  <Text style={{ fontSize: 16, minWidth: 16, textAlign: "center" }}>{quantityOf(item)}</Text>
                </>
              )}
              <QuantityButton label="+" onPress={() => add(item)} />
            </View>
          </View>
        )}
      />
      {count > 0 && (
        <View style={styles.footer}>
          <Button
            title={`View cart · ${count} item${count === 1 ? "" : "s"} · ${formatPrice(total)}`}
            onPress={() => navigation.navigate("Cart")}
          />
        </View>
      )}
    </View>
  );
}

function QuantityButton({ label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#fff", fontSize: 20, lineHeight: 22 }}>{label}</Text>
    </Pressable>
  );
}
