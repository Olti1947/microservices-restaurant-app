import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

import { colors } from "./styles";

// Rounded button with an optional icon. variant "outline" is the light version.
export default function Button({ title, icon, onPress, disabled, variant = "solid" }) {
  const solid = variant === "solid";
  const textColor = solid ? "#fff" : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        padding: 14,
        borderRadius: 14,
        backgroundColor: solid ? (pressed ? colors.primaryDark : colors.primary) : "#fff",
        borderWidth: solid ? 0 : 2,
        borderColor: colors.primary,
        opacity: disabled ? 0.5 : 1,
      })}
    >
      {icon && <Ionicons name={icon} size={20} color={textColor} />}
      <Text style={{ color: textColor, fontSize: 16, fontWeight: "700" }}>{title}</Text>
    </Pressable>
  );
}
