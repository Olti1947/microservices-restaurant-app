import { StyleSheet } from "react-native";

// Warm restaurant colors used across the app.
export const colors = {
  primary: "#e4572e", // tomato
  primaryDark: "#b8401f",
  accent: "#f3a712", // saffron
  green: "#2e8b57",
  background: "#fff8f0", // cream
  card: "#ffffff",
  text: "#2d2a26",
  muted: "#8a817c",
  border: "#f0e4d7",
  error: "#c0392b",
};

// One color per order status, shared with the kitchen screen.
export const statusColors = {
  received: "#3d7dd8",
  preparing: "#f3a712",
  ready: "#2e8b57",
  served: "#6c5b7b",
};

const shadow = {
  shadowColor: "#7a4a2a",
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

// Styles shared by several screens.
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    ...shadow,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 17, fontWeight: "700", color: colors.text },
  text: { fontSize: 16, color: colors.text },
  muted: { color: colors.muted },
  price: { color: colors.primary, fontWeight: "600" },
  error: { color: colors.error, marginBottom: 10 },
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...shadow,
  },
  // Round colored circle with an emoji or icon in the middle.
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 26 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
});
