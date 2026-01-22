import React from "react";
import { View, Text } from "react-native";
import { useStyles } from "../theme/ThemeContext";

export function SettingsScreen() {
const Styles = useStyles();

  return (
    <View style={Styles.screen}>
      <Text style={Styles.h1}>Settings</Text>
      <Text style={Styles.p}>Put your settings UI here.</Text>
    </View>
  );
}
