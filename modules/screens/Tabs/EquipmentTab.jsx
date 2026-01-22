import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import FastImage from "@d11/react-native-fast-image";
import { useStyles } from "../../../theme/ThemeContext";
import { useGw2Api } from "../../contexts/Gw2ApiContext";
import { Divider } from "../../Components/Divider";
import { useTitle } from "../../contexts/TitleContext";

const EQUIPMENT_GROUPS = {
  armor: ["Helm", "Shoulders", "Coat", "Gloves", "Leggings", "Boots"],
  weapons: [
    "WeaponA1",
    "WeaponA2",
    "WeaponB1",
    "WeaponB2",
    "WeaponAquaticA",
    "WeaponAquaticB",
  ],
  trinkets: [
    "Backpack",
    "Accessory1",
    "Accessory2",
    "Ring1",
    "Ring2",
    "Amulet",
  ],
  tools: ["Sickle", "Axe", "Pick"],
};

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function EquipmentCell({ slot, item, Styles }) {
  const iconUri = item?.icon;

  return (
    <View
      style={{
        width: 84,
        alignItems: "center",
        margin: 6,
      }}
    >
      {iconUri ? (
        <FastImage
          style={{ width: 48, height: 48 }}
          source={{
            uri: iconUri,
            priority: FastImage.priority.normal,
            cache: FastImage.cacheControl.immutable,
          }}
          resizeMode={FastImage.resizeMode.contain}
          onError={(evt) => {
            console.log("FastImage error", slot, iconUri, evt?.nativeEvent);
          }}
        />
      ) : (
        <View style={{ width: 48, height: 48 }} />
      )}

      <Text style={Styles.p} numberOfLines={2} textAlign="center">
        {item?.name ?? slot}
      </Text>
    </View>
  );
}

export function EquipmentTab() {
  const Styles = useStyles();
  const { setTitle } = useTitle();
  const { selectedCharacter, getCharacterEquipmentResolved } = useGw2Api();

  const [data, setData] = useState(null);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setData(null);
    setLocalError(null);

    if (!selectedCharacter) return;

    (async () => {
      try {
        const eq = await getCharacterEquipmentResolved(selectedCharacter);
        if (!cancelled) setData(eq);
      } catch (e) {
        if (!cancelled) {
          setLocalError(e instanceof Error ? e.message : String(e));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCharacter, getCharacterEquipmentResolved]);

  useEffect(() => {
    setTitle(selectedCharacter ? selectedCharacter : "Build");
  }, [selectedCharacter, setTitle]);

  const equipment = data?.equipment ?? [];
  const itemsById = data?.itemsById ?? {};

  const equipmentBySlot = useMemo(() => {
    return Object.fromEntries(equipment.map((e) => [e.slot, e]));
  }, [equipment]);

  if (!selectedCharacter) {
    return (
      <View style={Styles.screen}>
        <Text style={Styles.h1}>Equipment</Text>
        <Text style={Styles.p}>No character selected.</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={Styles.screen}>
        <Text style={Styles.h1}>Equipment</Text>
        <Divider />

        {localError ? (
          <Text style={Styles.p}>Error: {localError}</Text>
        ) : !data ? (
          <Text style={Styles.p}>Loading...</Text>
        ) : (
          Object.entries(EQUIPMENT_GROUPS).map(([groupName, slots]) => (
            <View key={groupName} style={{ marginBottom: 20 }}>
              <View style={{ backgroundColor: "rgba(255,255,255,.15)" }}>
                <Text style={Styles.h2}>{titleCase(groupName)}</Text>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {slots.map((slot) => {
                  const e = equipmentBySlot[slot];
                  const item = e ? itemsById[e.id] : undefined;

                  return (
                    <EquipmentCell
                      key={slot}
                      slot={slot}
                      item={item}
                      Styles={Styles}
                    />
                  );
                })}
              </View>
              <Divider />
            </View>

          ))
        )}
      </View>
    </ScrollView>
  );
}
