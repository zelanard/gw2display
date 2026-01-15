import React, { useEffect, useRef } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import Orientation from "react-native-orientation-locker";

import { BuildTab } from "./Tabs/BuildTab";
import { EquipmentTab } from "./Tabs/EquipmentTab";

const Tab = createBottomTabNavigator();


function OrientationToggleController() {
  const navigation = useNavigation();

  useEffect(() => {
    const orientationHandler = (orientation) => {
      console.log("Device orientation:", orientation);

      if (orientation === "PORTRAIT-UPSIDEDOWN") {
        navigation.jumpTo("Build");
      } else if (orientation === "PORTRAIT") {
        navigation.jumpTo("Equipment");
      }
    }

    const handler = (orientation) => {
      orientationHandler(orientation);
    };

    Orientation.addDeviceOrientationListener(handler);
    return () => Orientation.removeDeviceOrientationListener(handler);
  }, [navigation]);

  return null;
}

export function HomeScreen() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Build">
        {() => (
          <>
            <OrientationToggleController />
            <BuildTab />
          </>
        )}
      </Tab.Screen>

      <Tab.Screen name="Equipment" component={EquipmentTab} />
    </Tab.Navigator>
  );
}
