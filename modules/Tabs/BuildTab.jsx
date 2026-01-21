import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import FastImage from "@d11/react-native-fast-image";
import { useStyles } from "../../theme/ThemeContext";
import { useGw2Api } from "../gw2/Gw2ApiContext";
import { Divider } from "../Divider";

function IconCell({ label, iconUri, caption, Styles }) {
  return (
    <View style={{ width: 84, alignItems: "center", margin: 6 }}>
      {iconUri ? (
        <FastImage
          style={{ width: 48, height: 48 }}
          source={{
            uri: iconUri,
            priority: FastImage.priority.normal,
            cache: FastImage.cacheControl.immutable,
          }}
          resizeMode={FastImage.resizeMode.contain}
          onError={(evt) => console.log("FastImage error", label, iconUri, evt?.nativeEvent)}
        />
      ) : (
        <View style={{ width: 48, height: 48 }} />
      )}

      <Text style={Styles.p} numberOfLines={2} textAlign="center">
        {caption ?? label}
      </Text>
    </View>
  );
}

function SkillCell({ id, skillsById, Styles }) {
  const s = skillsById?.[id];
  return (
    <IconCell
      label={`Skill ${id}`}
      iconUri={s?.icon}
      caption={s?.name ?? `Skill ${id}`}
      Styles={Styles}
    />
  );
}

function TraitCell({ id, traitsById, Styles }) {
  const t = traitsById?.[id];
  return (
    <IconCell
      label={`Trait ${id}`}
      iconUri={t?.icon}
      caption={t?.name ?? `Trait ${id}`}
      Styles={Styles}
    />
  );
}

function SkillsBlock({ title, skills, skillsById, Styles }) {
  if (!skills) return null;

  const healId = Number.isInteger(skills?.heal) ? skills.heal : null;
  const utilIds = Array.isArray(skills?.utilities) ? skills.utilities.filter(Number.isInteger) : [];
  const eliteId = Number.isInteger(skills?.elite) ? skills.elite : null;

  return (
    <View>
      <Text style={Styles.h2}>{title}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
      >
        <View style={{ marginBottom: 16, display: "flex", flexDirection: "row" }}>

          <View>
            <Text style={Styles.h3}>Heal</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {healId ? <SkillCell id={healId} skillsById={skillsById} Styles={Styles} /> : <Text style={Styles.p}>None</Text>}
            </View>
          </View>

          <View>
            <Text style={Styles.h3}>Utilities</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {utilIds.length ? utilIds.map((id) => <SkillCell key={id} id={id} skillsById={skillsById} Styles={Styles} />) : <Text style={Styles.p}>None</Text>}
            </View>
          </View>

          <View>
            <Text style={Styles.h3}>Elite</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {eliteId ? <SkillCell id={eliteId} skillsById={skillsById} Styles={Styles} /> : <Text style={Styles.p}>None</Text>}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

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

    return () => { cancelled = true; };
  }, [selectedCharacter, getCharacterTraitsAndSkills]);

  if (!selectedCharacter) {
    return (
      <View style={Styles.screen}>
        <Text style={Styles.h1}>Build</Text>
        <Text style={Styles.p}>No character selected.</Text>
      </View>
    );
  }

  const traitsById = data?.resolved?.traitsById ?? {};
  const skillsById = data?.resolved?.skillsById ?? {};
  const specs = Array.isArray(data?.specializations) ? data.specializations : [];

  return (
    <ScrollView>
      <View style={Styles.screen}>
        <Text style={Styles.h1}>Build</Text>
        <Divider />
        <Text style={Styles.h1}>{selectedCharacter}</Text>
        {data?.profession ? <Text style={Styles.p}>Profession: {data.profession}</Text> : null}
        <Divider />

        {localError ? (
          <Text style={Styles.p}>Error: {localError}</Text>
        ) : !data ? (
          <Text style={Styles.p}>Loading...</Text>
        ) : (
          <>
            <SkillsBlock title="Land Skills" skills={data?.skills} skillsById={skillsById} Styles={Styles} />
            <Divider />
            <SkillsBlock title="Aquatic Skills" skills={data?.aquatic_skills} skillsById={skillsById} Styles={Styles} />
            <Divider />

            <View style={{ marginBottom: 16 }}>
              <Text style={Styles.h2}>Specializations</Text>

              {specs.length ? (
                specs.map((line, idx) => {
                  const traitIds = Array.isArray(line?.traits) ? line.traits.filter(Number.isInteger) : [];
                  const spec = data?.resolved?.specializationsById?.[line.id];
                  return (
                    <View key={`${line?.id ?? "spec"}-${idx}`} style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                        {spec?.icon ? (
                          <FastImage
                            style={{ width: 24, height: 24, marginRight: 8 }}
                            source={{ uri: spec.icon }}
                            resizeMode={FastImage.resizeMode.contain}
                          />
                        ) : null}
                        <Text style={Styles.h3}>{spec?.name ?? `Spec ${line.id}`}</Text>
                      </View>
                      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {traitIds.length ? (
                          traitIds.map((tid) => <TraitCell key={tid} id={tid} traitsById={traitsById} Styles={Styles} />)
                        ) : (
                          <Text style={Styles.p}>No traits selected.</Text>
                        )}
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={Styles.p}>No specializations found.</Text>
              )}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
