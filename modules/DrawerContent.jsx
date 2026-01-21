import { DrawerContentScrollView } from "@react-navigation/drawer";
import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { ExpandableSection } from "./ExpandableSection";
import { useStyles } from "../theme/ThemeContext";
import { useGw2Api } from "./gw2/Gw2ApiContext";
import { ScrollView } from "react-native-gesture-handler";

export function DrawerContent(props) {
  const Styles = useStyles();
  const { apiKey, setApiKey, account, characters, loading, error, refreshAll, clearError, setSelectedCharacter } = useGw2Api();
  const [open, setOpen] = useState("app");

  const navTo = (screen) => {
    props.navigation.closeDrawer();
    props.navigation.navigate("Main", { screen });
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={Styles.drawerContainer}>
      <ScrollView>
        <View style={Styles.drawerHeader}>
          <Text style={Styles.drawerTitle}>GW 2 Display</Text>
        </View>

        <View style={Styles.drawerBody}>
            <Pressable onPress={() => navTo("API")} style={Styles.item}>
              <Text style={Styles.itemText}>API</Text>
            </Pressable>

          <ExpandableSection
            title="Characters"
            isOpen={open === "characters"}
            onToggle={() => setOpen(open === "characters" ? null : "characters")}
          >
            {Array.isArray(characters) && characters.length > 0 ? (
              characters.map((name) => (
                <Pressable
                  key={name}
                  onPress={() => {
                    setSelectedCharacter(name);
                    navTo("Home");
                  }}
                  style={Styles.item}
                >
                  <Text style={Styles.itemText}>{name}</Text>
                </Pressable>
              ))
            ) : (
              <View style={Styles.item}>
                <Text style={Styles.itemText}>No characters</Text>
              </View>
            )}
          </ExpandableSection>

          <Pressable onPress={() => props.navigation.closeDrawer()} style={[Styles.item, { marginTop: 12 }]}>
            <Text style={Styles.itemText}>Close menu</Text>
          </Pressable>
        </View>
      </ScrollView>
    </DrawerContentScrollView >
  );
}
