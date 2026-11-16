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
        columnWrapperStyle={{ gap: 10 }}
        ListHeaderComponent={
          <>
            {error && <Text style={styles.error}>{error}</Text>}
            <Text style={[styles.muted, { marginBottom: 12 }]}>Where are you sitting?</Text>
          </>
        }
        renderItem={({ item: table }) => {
          const free = table.status === "free";
          return (
            <Pressable
              style={[styles.card, { flex: 1, alignItems: "center", opacity: free ? 1 : 0.6 }]}
              onPress={() => chooseTable(table)}
            >
              <Text style={[styles.title, { fontSize: 22 }]}>{table.number}</Text>
              <Text style={{ color: free ? colors.primary : colors.muted }}>
                {free ? "Free" : "In use · tap to rejoin"}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
