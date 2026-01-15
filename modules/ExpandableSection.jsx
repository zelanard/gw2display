import React from "react";
import { View, Text, Pressable } from "react-native";
import { useStyles } from "../theme/ThemeContext";

export function ExpandableSection({ title, isOpen, onToggle, children }) {
  const Styles = useStyles();
  return (
    <View>
      <Pressable onPress={onToggle} style={Styles.sectionHeader}>
        <Text style={Styles.sectionHeaderText}>{title}</Text>
        <Text style={Styles.sectionHeaderText}>{isOpen ? "-" : "+"}</Text>
      </Pressable>

      {isOpen ? <View>{children}</View> : null}
    </View>
  );
}