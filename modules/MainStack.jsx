// MainStack.js

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { HomeScreen } from "./screens/HomeScreen";
import { APIScreen } from "./screens/APIScreen";
import { TopBar } from "./Components/TopBar";
import Orientation from "react-native-orientation-locker";
import { TitleContext } from "./contexts/TitleContext";

export function MainStack() {
  const Stack = createNativeStackNavigator();

  const [orientation, setOrientation] = useState("PORTRAIT");
  const [title, setTitle] = useState("");

  useEffect(() => {
    Orientation.getOrientation(setOrientation);
    Orientation.addOrientationListener(setOrientation);
    return () => Orientation.removeOrientationListener(setOrientation);
  }, []);

  const isLandscape =
    orientation === "LANDSCAPE-LEFT" || orientation === "LANDSCAPE-RIGHT";

  const sidebarWidth = 72;

  return (
    <TitleContext.Provider value={{ title, setTitle }}>
      {/* PORTRAIT */}
      {!isLandscape && (
        <Stack.Navigator
          screenOptions={{
            header: (props) => (
              <TopBar {...props} isLandscape={false} />
            ),
            contentStyle: { backgroundColor: "#0B0F17" },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="API" component={APIScreen} />
        </Stack.Navigator>
      )}

      {/* LANDSCAPE */}
      {isLandscape && (
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            backgroundColor: "#0B0F17",
          }}
        >
          <TopBar isLandscape sidebarWidth={sidebarWidth} />

          <View style={{ flex: 1 }}>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#0B0F17" },
              }}
            >
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="API" component={APIScreen} />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
              />
            </Stack.Navigator>
          </View>
        </View>
      )}
    </TitleContext.Provider>
  );
}
