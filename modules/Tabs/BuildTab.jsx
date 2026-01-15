import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useStyles } from "../../theme/ThemeContext";
import { useGw2Api } from "../gw2/Gw2ApiContext";

export function BuildTab() {
  const Styles = useStyles();
  const { selectedCharacter, getCharacterTraitsAndSkills } = useGw2Api();

  const [data, setData] = useState(null);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setData(null);
    setLocalError(null);

    if (!selectedCharacter) return;

    (async () => {
      try {
        const result = await getCharacterTraitsAndSkills(selectedCharacter, { resolve: true });
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setLocalError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCharacter, getCharacterTraitsAndSkills]);

  if (!selectedCharacter) {
    return (
      <View style={Styles.screen}>
        <Text style={Styles.h1}>Build</Text>
        <Text style={Styles.p}>No character selected.</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={Styles.screen}>
        <Text style={Styles.h1}>Build</Text>
        <Text style={Styles.h1}>{selectedCharacter}</Text>

        {localError ? (
          <Text style={Styles.p}>Error: {localError}</Text>
        ) : (
          <Text style={Styles.p}>{data ? JSON.stringify(data, null, 2) : "Loading..."}</Text>
        )}
      </View>
    </ScrollView>
  );
}
