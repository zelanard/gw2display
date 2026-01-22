// TopBar.js (or TopBar.jsx)

import React from "react";
import { View } from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { useTitle } from "../contexts/TitleContext";
import TopPortrait from "./TopPortrait";
import TopLandscape from "./TopLandscape";

export function TopBar({ isLandscape, sidebarWidth }) {
  const { title } = useTitle();
  const navigation = useNavigation();

  const openMenu = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View
      style={{
        width: isLandscape ? 72 : "100%",
        height: isLandscape ? "100%" : 56,
        paddingHorizontal: 12,
        paddingTop: isLandscape ? 12 : 25,
        justifyContent: isLandscape ? "flex-start" : "center",
        backgroundColor: "#0B0F17",
      }}
    >

      {!isLandscape ?
        <TopPortrait openMenu={openMenu} title={title} />
        :
        <TopLandscape openMenu={openMenu} title={title} />
      }
    </View>
  );
}