import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { HomeScreen } from "./HomeScreen";
import { APIScreen } from "./APIScreen";
import { SettingsScreen } from "./SettingsScreen";
import { TopBar } from "./TopBar";
import { useStyles } from "../theme/ThemeContext";

export function MainStack() {
  const Stack = createNativeStackNavigator();
  const Styles = useStyles();

  return (
    <Stack.Navigator
      screenOptions={{
        header: (props) => <TopBar {...props} styles={Styles} />,
        contentStyle: { backgroundColor: "#0B0F17" },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "My App" }} />
      <Stack.Screen name="API" component={APIScreen} options={{ title: "API Keys" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
    </Stack.Navigator>
  );
}
