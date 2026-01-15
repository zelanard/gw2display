import { useEffect, useState } from "react";
import { useStyles } from "../../theme/ThemeContext";
import { ScrollView, Text, View } from "react-native";
import { useGw2Api } from "../gw2/Gw2ApiContext";

export function EquipmentTab() {
  const Styles = useStyles();
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
        if (!cancelled) setLocalError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCharacter, getCharacterEquipmentResolved]);

  if (!selectedCharacter) {
    return (
      <View style={Styles.screen}>
        <Text style={Styles.h1}>Equipment</Text>
        <Text style={Styles.p}>No character selected.</Text>
      </View>
    );
  }

  const equipment = data?.equipment ?? [];
  const itemsById = data?.itemsById ?? {}; // see Fix 2 below (plain object)

  return (
    <ScrollView>
      <View style={Styles.screen}>
        <Text style={Styles.h1}>Equipment</Text>
        <Text style={Styles.h1}>{selectedCharacter}</Text>

        {localError ? (
          <Text style={Styles.p}>Error: {localError}</Text>
        ) : !data ? (
          <Text style={Styles.p}>Loading...</Text>
        ) : (
          equipment.map((e) => {
            const item = itemsById[e.id];
            return (
              <View key={`${e.slot}-${e.id}`} style={{ marginBottom: 8 }}>
                <Text style={Styles.p}>
                  {e.slot}: {item?.name ?? `Item ${e.id}`}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
