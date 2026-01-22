import React, { useEffect, useMemo } from "react";
import { createBottomTabNavigator, BottomTabBar } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

import { BuildTab } from "./Tabs/BuildTab";
import { EquipmentTab } from "./Tabs/EquipmentTab";
import { useGw2Api } from "../contexts/Gw2ApiContext";
import OrientationTabSync from "../Components/OrientationTabSync";
import { useOrientation } from "../contexts/OrientationContext";

const Tab = createBottomTabNavigator();

export function HomeScreen() {
  const navigation = useNavigation();
  const { hydrated, keys } = useGw2Api();
  const { portrait } = useOrientation();

  useEffect(() => {
    if (!hydrated) return;
    if (!Array.isArray(keys) || keys.length === 0) {
      navigation.replace("API");
    }
  }, [hydrated, keys, navigation]);

  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: "rgba(255,255,255,0.15)",
      paddingBottom: portrait ? 100 : 0,
      paddingTop: 10,
    }),
    [portrait]
  );

  return (
    <Tab.Navigator
      screenOptions={() => ({
        headerShown: false,
        tabBarStyle,
      })}
      tabBar={(props) => (
        <>
          <OrientationTabSync navigation={props.navigation} />
          <BottomTabBar {...props} />
        </>
      )}
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
