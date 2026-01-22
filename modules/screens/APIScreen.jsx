import React, { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGw2Api } from "../contexts/Gw2ApiContext";
import { useStyles } from "../../theme/ThemeContext";
import { ScrollView } from "react-native-gesture-handler";

export function APIScreen() {
  const Styles = useStyles();
  const {
    keys,
    accountsByKeyId,
    charactersByKeyId,
    addKey,
    removeKey,
    refreshAllKeys,
    loading,
    error,
    clearError,
  } = useGw2Api();

  const [draftKey, setDraftKey] = useState("");

  return (
    <ScrollView>
      <SafeAreaView style={{ padding: 16 }}>
        <Text style={Styles.h1}>API Keys</Text>

        <View style={{ marginTop: 12 }}>
          <Text style={Styles.p}>Add API Key:</Text>
          <TextInput
            value={draftKey}
            onChangeText={setDraftKey}
            placeholder="Paste your GW2 API key"
            autoCapitalize="none"
            autoCorrect={false}
            style={Styles.textInput}
          />

          <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
            <Button
              title="Add key"
              onPress={async () => {
                await addKey(draftKey);
                setDraftKey("");
              }}
            />
            <Button
              title={loading ? "Loading..." : "Refresh all accounts"}
              disabled={loading}
              onPress={async () => {
                clearError();
                await refreshAllKeys();
              }}
            />
          </View>
        </View>

        {error ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: "600" }}>Error</Text>
            <Text style={Styles.p}>{error}</Text>
          </View>
        ) : null}

        <View style={{ marginTop: 16 }}>
          <Text style={Styles.h1}>Saved Keys</Text>

          {keys.length ? (
            keys.map((k) => {
              const acct = accountsByKeyId[k.id] ?? null;
              const chars = charactersByKeyId[k.id] ?? null;

              return (
                <View key={k.id} style={{ marginTop: 12 }}>
                  <Text style={Styles.p}>KeyId: {k.id}</Text>
                  <Text style={Styles.p}>Key FP: {k.fp}</Text>

                  <Text style={Styles.p}>
                    Account:{" "}
                    {acct ? `${acct.name ?? "(no name)"} (id: ${acct.id ?? "?"})` : "(not loaded yet)"}
                  </Text>

                  <Text style={Styles.p}>
                    Characters:{" "}
                    {Array.isArray(chars) ? `${chars.length}` : "(not loaded yet)"}
                  </Text>

                  <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
                    <Button title="Remove" onPress={() => removeKey(k.id)} />
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={Styles.p}>(no keys added)</Text>
          )}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
