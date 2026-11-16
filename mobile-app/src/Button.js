import { Pressable, Text } from "react-native";

import { styles } from "./styles";

export default function Button({ title, onPress, disabled }) {
  return (
    <Pressable
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}
