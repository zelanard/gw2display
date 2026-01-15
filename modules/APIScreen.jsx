import React, { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGw2Api } from "./gw2/Gw2ApiContext";
import { useStyles } from "../theme/ThemeContext";
import { ScrollView } from "react-native-gesture-handler";

export function APIScreen() {
  const Styles = useStyles();
  const { apiKey, setApiKey, account, characters, loading, error, refreshAll, clearError } = useGw2Api();
  const [draftKey, setDraftKey] = useState(apiKey || "");

  return (
    <ScrollView>
      <SafeAreaView style={{ padding: 16 }}>
        <Text style={Styles.h1}>API Keys</Text>

        <View style={{ marginTop: 12 }}>
          <Text style={Styles.p}>API Key:</Text>
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
              title="Save key"
              onPress={async () => {
                await setApiKey(draftKey);
              }}
            />
            <Button
              title="Clear key"
              onPress={async () => {
                setDraftKey("");
                await setApiKey("");
              }}
            />
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <Button
            title={loading ? "Loading..." : "Refresh account + characters"}
            disabled={loading}
            onPress={async () => {
              clearError();
              await refreshAll();
            }}
          />
        </View>

        {error ? (
          <View style={Styles.h1}>
            <Text style={{ fontWeight: "600" }}>Error</Text>
            <Text style={Styles.p}>{error}</Text>
          </View>
        ) : null}

        <View style={Styles.h1}>
          <Text style={Styles.h1}>Account</Text>
          <Text style={Styles.p}>{account ? JSON.stringify(account, null, 2) : "(none yet)"}</Text>
        </View>

        <View style={Styles.h1}>
          <Text style={Styles.h1}>Characters</Text>
          <Text style={Styles.p}>{characters ? JSON.stringify(characters, null, 2) : "(none yet)"}</Text>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
