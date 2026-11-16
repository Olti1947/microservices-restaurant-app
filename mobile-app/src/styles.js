import { StyleSheet } from "react-native";

export const colors = {
  primary: "#2a7d4f",
  background: "#f4f4f4",
  card: "#ffffff",
  text: "#222222",
  muted: "#777777",
  error: "#c0392b",
};

// Styles shared by several screens.
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 17, fontWeight: "600", color: colors.text },
  muted: { color: colors.muted },
  error: { color: colors.error, marginBottom: 10 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  footer: { padding: 16, backgroundColor: colors.card, borderTopWidth: 1, borderColor: "#e5e5e5" },
});
