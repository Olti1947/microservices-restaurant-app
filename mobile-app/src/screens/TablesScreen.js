import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { api } from "../api";
import { useCart } from "../CartContext";
import { colors, styles } from "../styles";

export default function TablesScreen({ navigation }) {
  const { setTableNumber, clear } = useCart();
  const [tables, setTables] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getTables().then(setTables).catch((e) => setError(e.message));
  }, []);

  async function chooseTable(table) {
    try {
      // A free table gets occupied. An occupied table can be re-joined,
      // for example after the app was restarted during the meal.
      if (table.status === "free") await api.occupyTable(table.number);
      setTableNumber(table.number);
      clear();
      navigation.reset({ index: 0, routes: [{ name: "Menu" }] });
    } catch (e) {
      setError(e.message);
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
