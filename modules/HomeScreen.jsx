// HomeScreen.jsx

import React, { useEffect, useRef } from "react";
import { createBottomTabNavigator, BottomTabBar } from "@react-navigation/bottom-tabs";
import Orientation from "react-native-orientation-locker";

import { BuildTab } from "./Tabs/BuildTab";
import { EquipmentTab } from "./Tabs/EquipmentTab";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useGw2Api } from "./gw2/Gw2ApiContext";
import { useNavigation } from "@react-navigation/native";

const Tab = createBottomTabNavigator();

function OrientationAwareTabBar(props) {
  const lastOrientationRef = useRef(null);
  const lastTabRef = useRef(null);

  useEffect(() => {
    const handler = (orientation) => {
      if (!orientation || orientation === "UNKNOWN") return;

      // De-spam repeated native events
      if (lastOrientationRef.current === orientation) return;
      lastOrientationRef.current = orientation;

      let target = null;

      if (orientation === "PORTRAIT-UPSIDEDOWN" || orientation === "LANDSCAPE-LEFT") {
        target = "Build";
      } else if (orientation === "PORTRAIT" || orientation === "LANDSCAPE-RIGHT") {
        target = "Equipment";
      }

      if (!target) return;

      // Avoid dispatching the same tab repeatedly
      if (lastTabRef.current === target) return;
      lastTabRef.current = target;

      console.log("Device orientation:", orientation, "=> jumpTo", target);

      // This is the TAB navigator's navigation object (always correct here)
      props.navigation.jumpTo(target);
    };

    // Initialize once (optional but recommended)
    Orientation.getDeviceOrientation((o) => handler(o));

    Orientation.addDeviceOrientationListener(handler);
    return () => Orientation.removeDeviceOrientationListener(handler);
  }, [props.navigation]);

  return <BottomTabBar {...props} />;
}

export function HomeScreen() {
  const { apiKey } = useGw2Api();
  const navigation = useNavigation();

  useEffect(() => {
    if (!apiKey) {
      navigation.replace("API");
    }
  }, [apiKey, navigation]);

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <OrientationAwareTabBar {...props} />}
    >
      <Tab.Screen
        name="Build"
        component={BuildTab}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hammer-outline" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Equipment"
        component={EquipmentTab}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
