import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { AppState, FlatList, Pressable, Text, View } from "react-native";

import { api } from "../api";
import { useCart } from "../CartContext";
import { colors, styles } from "../styles";

// Other diners take and free tables too, so reload the list regularly.
const REFRESH_EVERY_MS = 2 * 60 * 1000;

export default function TablesScreen({ navigation }) {
  const { setTableNumber, clear } = useCart();
  const [tables, setTables] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadTables = useCallback(async () => {
    try {
      setTables(await api.getTables());
    } catch (e) {
      setError(e.message);
    }
  }, []);

  // Load now, then every 2 minutes, and whenever the app comes back to the foreground.
  // The timer stops when the diner leaves this screen.
  useEffect(() => {
    loadTables();
    const timer = setInterval(loadTables, REFRESH_EVERY_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") loadTables();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [loadTables]);

  // Pull down on the list to reload it by hand.
  async function refresh() {
    setRefreshing(true);
    setError(null);
    await loadTables();
    setRefreshing(false);
  }

  async function chooseTable(table) {
    setError(null);
    try {
      // A free table gets occupied. An occupied table can be re-joined,
      // for example after the app was restarted during the meal.
      if (table.status === "free") await api.occupyTable(table.number);
      setTableNumber(table.number);
      clear();
      navigation.reset({ index: 0, routes: [{ name: "Menu" }] });
    } catch (e) {
      setError(e.message);
      // Most likely someone else just took this table: show the real status.
      loadTables();
    }
  }

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        data={tables}
        keyExtractor={(table) => table.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        refreshing={refreshing}
        onRefresh={refresh}
        ListHeaderComponent={
          <>
            <View style={{ alignItems: "center", marginVertical: 12 }}>
              <Text style={{ fontSize: 56 }}>🍽️</Text>
              <Text style={[styles.title, { fontSize: 22, marginTop: 6 }]}>Good to see you!</Text>
              <Text style={[styles.muted, { marginTop: 4 }]}>Tap the table you're sitting at</Text>
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
          </>
        }
        renderItem={({ item: table }) => {
          const free = table.status === "free";
          const tint = free ? colors.green : colors.muted;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                { flex: 1, alignItems: "center", gap: 6, opacity: pressed ? 0.7 : 1 },
                !free && { backgroundColor: "#f6f1ec" },
              ]}
              onPress={() => chooseTable(table)}
            >
              <View style={[styles.avatar, { backgroundColor: tint + "22" }]}>
                <Ionicons name="restaurant" size={24} color={tint} />
              </View>
              <Text style={[styles.title, { fontSize: 20 }]}>Table {table.number}</Text>
              <View style={[styles.pill, { alignSelf: "center", backgroundColor: tint + "22" }]}>
                <Text style={{ color: tint, fontWeight: "600", fontSize: 13 }}>
                  {free ? "Free" : "In use · rejoin"}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
