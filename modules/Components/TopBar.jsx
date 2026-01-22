// TopBar.js (or TopBar.jsx)

import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTitle } from "../contexts/TitleContext";

export function TopBar({ isLandscape, sidebarWidth }) {
  const { title } = useTitle();
  const navigation = useNavigation();

  const openMenu = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View
      style={{
        width: isLandscape ? sidebarWidth : "100%",
        height: isLandscape ? "100%" : 56,
        paddingHorizontal: 12,
        paddingTop: isLandscape ? 12 : 25,
        justifyContent: isLandscape ? "flex-start" : "center",
        backgroundColor: "#0B0F17",
      }}
    >

      {!isLandscape ? (
        <View style={{ flexDirection: "row", marginTop:"18", alignItems: "center" }}>
          <Pressable
            onPress={openMenu}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
            hitSlop={8}
          >
            <Ionicons name="menu-outline" size={26} color="white" />
          </Pressable>

          <Text style={{ color: "white", fontSize: 18 }} numberOfLines={1}>
            {title}
          </Text>
        </View>

      ) : (
        <Text
          style={{ color: "white", fontSize: 12, textAlign: "center" }}
          numberOfLines={2}
        >
          {title}
        </Text>
      )}
    </View>
  );
}
