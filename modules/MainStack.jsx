// MainStack.js

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { HomeScreen } from "./HomeScreen";
import { APIScreen } from "./APIScreen";
import { SettingsScreen } from "./SettingsScreen";
import { TopBar } from "./TopBar";
import Orientation from "react-native-orientation-locker";

export function MainStack() {
  const Stack = createNativeStackNavigator();

  const [orientation, setOrientation] = useState("PORTRAIT");

  useEffect(() => {
    Orientation.getOrientation(setOrientation);
    Orientation.addOrientationListener(setOrientation);
    return () => Orientation.removeOrientationListener(setOrientation);
  }, []);

  const isLandscape =
    orientation === "LANDSCAPE-LEFT" || orientation === "LANDSCAPE-RIGHT";

  const sidebarWidth = 72;

  // PORTRAIT: use the navigator header like normal
  if (!isLandscape) {
    return (
      <Stack.Navigator
        screenOptions={{
          header: (props) => <TopBar {...props} isLandscape={false} />,
          contentStyle: { backgroundColor: "#0B0F17" },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "My App" }}
        />
        <Stack.Screen
          name="API"
          component={APIScreen}
          options={{ title: "API Keys" }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: "Settings" }}
        />
      </Stack.Navigator>
    );
  }

  // LANDSCAPE: render TopBar as a real left sidebar (NOT as header)
  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: "#0B0F17" }}>
      <TopBar isLandscape={true} sidebarWidth={sidebarWidth} />

      <View style={{ flex: 1 }}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#0B0F17" },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "My App" }}
          />
          <Stack.Screen
            name="API"
            component={APIScreen}
            options={{ title: "API Keys" }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: "Settings" }}
          />
        </Stack.Navigator>
      </View>
    </View>
  );
}
