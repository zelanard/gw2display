// TopBar.js

import "react-native-gesture-handler";
import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStyles } from "../theme/ThemeContext";

export function TopBar({
  navigation,
  route,
  options,
  isLandscape,
  sidebarWidth = 72,
}) {
  const Styles = useStyles();

  // Fallback navigation for landscape (when TopBar is rendered outside header)
  const navFromHook = useNavigation();
  const nav = navigation || navFromHook;

  const title = options?.title ?? route?.name ?? "";

  const edges = useMemo(() => (isLandscape ? ["left"] : ["top"]), [isLandscape]);

  return (
    <SafeAreaView
      edges={edges}
      style={[
        Styles.topBarSafe,
        isLandscape ? { width: sidebarWidth } : null,
      ]}
    >
      <View
        style={[
          Styles.topBar,
          isLandscape
            ? {
                flex: 1,
                flexDirection: "column",
                alignItems: "center",
                paddingVertical: 12,
              }
            : {
                flexDirection: "row",
                alignItems: "center",
              },
        ]}
      >
        {/* LEFT SLOT */}
        <View style={{ width: 56, alignItems: "center", justifyContent: "center" }}>
          <Pressable
            onPress={() => nav.dispatch(DrawerActions.toggleDrawer())}
            style={Styles.iconBtn}
            hitSlop={10}
          >
            <Text style={Styles.iconText}>☰</Text>
          </Pressable>
        </View>

        {/* TITLE (portrait only) */}
        {!isLandscape ? (
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={[Styles.topBarTitle, { textAlign: "center" }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
        ) : null}

        {/* RIGHT SLOT placeholder (portrait only) */}
        {!isLandscape ? <View style={{ width: 56 }} /> : null}
      </View>
    </SafeAreaView>
  );
}
