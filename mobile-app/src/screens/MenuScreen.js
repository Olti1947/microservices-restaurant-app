import { Ionicons } from "@expo/vector-icons";
import { useEffect, useLayoutEffect, useState } from "react";
import { Platform, Pressable, SectionList, Text, View } from "react-native";

import { api } from "../api";
import Button from "../Button";
import { useCart } from "../CartContext";
import { CATEGORIES, categoryOf, emojiFor } from "../food";
import { formatPrice } from "../format";
import { colors, styles } from "../styles";

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
        <Pressable
          onPress={() => navigation.navigate("Orders")}
          // On web the header has no right padding of its own.
          style={{ flexDirection: "row", alignItems: "center", gap: 4, marginRight: Platform.OS === "web" ? 16 : 0 }}
        >
          <Ionicons name="receipt-outline" size={20} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>My orders</Text>
        </Pressable>
      ),
    });
  }, [navigation, tableNumber]);

  // Group the menu into one section per category.
  const sections = CATEGORIES.map((category) => ({
    category,
    data: menu.filter((item) => item.category === category.key),
  })).filter((section) => section.data.length > 0);

  return (
    <View style={styles.screen}>
      <SectionList
        contentContainerStyle={styles.content}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={error && <Text style={styles.error}>{error}</Text>}
        renderSectionHeader={({ section: { category } }) => (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 10 }}>
            <View style={[styles.avatar, { width: 32, height: 32, backgroundColor: category.color }]}>
              <Ionicons name={category.icon} size={18} color="#fff" />
            </View>
            <Text style={[styles.title, { fontSize: 20 }]}>{category.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.card, styles.row, { gap: 12 }]}>
            <View style={[styles.avatar, { backgroundColor: categoryOf(item).color + "1f" }]}>
              <Text style={styles.emoji}>{emojiFor(item)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.text, { fontWeight: "600" }]}>{item.name}</Text>
              <Text style={styles.price}>{formatPrice(item.price)}</Text>
            </View>
            <View style={[styles.row, { gap: 10 }]}>
              {quantityOf(item) > 0 && (
                <>
                  <QuantityButton icon="remove" onPress={() => remove(item)} light />
                  <Text style={[styles.title, { minWidth: 16, textAlign: "center" }]}>{quantityOf(item)}</Text>
                </>
              )}
              <QuantityButton icon="add" onPress={() => add(item)} />
            </View>
          </View>
        )}
      />
      {count > 0 && (
        <View style={styles.footer}>
          <Button
            icon="cart"
            title={`View cart · ${count} item${count === 1 ? "" : "s"} · ${formatPrice(total)}`}
            onPress={() => navigation.navigate("Cart")}
          />
        </View>
      )}
    </View>
  );
}

function QuantityButton({ icon, onPress, light }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: light ? colors.border : colors.primary,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={20} color={light ? colors.primary : "#fff"} />
    </Pressable>
  );
}
