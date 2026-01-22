import { DrawerContentScrollView } from "@react-navigation/drawer";
import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { ExpandableSection } from "./ExpandableSection";
import { useStyles } from "../contexts/ThemeContext";
import { useGw2Api } from "../contexts/Gw2ApiContext";
import { ScrollView } from "react-native-gesture-handler";

export function DrawerContent(props) {
  const Styles = useStyles();
  const { keys, accountsByKeyId, charactersByKeyId, setSelectedCharacter } = useGw2Api();
  const [open, setOpen] = useState(null);

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

          {keys.map((k) => {
            const acct = accountsByKeyId[k.id] ?? null;
            const chars = charactersByKeyId[k.id] ?? null;

            const acctName = acct?.name ?? null; // GW2 /v2/account uses `name`
            const shortId = k.id.slice(-6);
            const title = acctName ? `${acctName} (${shortId})` : `Account (${shortId})`;

            const isOpen = open === k.id;

            return (
              <ExpandableSection
                key={k.id}
                title={title}
                isOpen={isOpen}
                onToggle={() => setOpen(isOpen ? null : k.id)}
              >
                {Array.isArray(chars) && chars.length > 0 ? (
                  chars.map((name) => (
                    <Pressable
                      key={`${k.id}:${name}`}
                      onPress={() => {
                        // This also selects the appropriate key behind the scenes.
                        setSelectedCharacter(name, k.id);
                        navTo("Home");
                      }}
                      style={Styles.item}
                    >
                      <Text style={Styles.itemText}>{name}</Text>
                    </Pressable>
                  ))
                ) : (
                  <View style={Styles.item}>
                    <Text style={Styles.itemText}>No characters (or not loaded yet)</Text>
                  </View>
                )}
              </ExpandableSection>
            );
          })}

          <Pressable onPress={() => props.navigation.closeDrawer()} style={[Styles.item, { marginTop: 12 }]}>
            <Text style={Styles.itemText}>Close menu</Text>
          </Pressable>
        </View>
      </ScrollView>
    </DrawerContentScrollView>
  );
}
