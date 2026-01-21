import { View } from "react-native";

export function Divider({ height = 1, color = "#e0e0e0", marginVertical = 8 }) {
  return (
    <View
      style={{
        height,
        backgroundColor: color,
        marginVertical,
        alignSelf: "stretch",
      }}
    />
  );
}
