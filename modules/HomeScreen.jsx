// HomeScreen.jsx

import React, { useEffect, useRef } from "react";
import { createBottomTabNavigator, BottomTabBar } from "@react-navigation/bottom-tabs";
import Orientation from "react-native-orientation-locker";

import { BuildTab } from "./Tabs/BuildTab";
import { EquipmentTab } from "./Tabs/EquipmentTab";

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
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <OrientationAwareTabBar {...props} />}
    >
      <Tab.Screen name="Build" component={BuildTab} />
      <Tab.Screen name="Equipment" component={EquipmentTab} />
    </Tab.Navigator>
  );
}
