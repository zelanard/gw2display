// Gw2ApiContext.js
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Gw2ApiContext = createContext(null);

const BASE_URL = "https://api.guildwars2.com";
const STORAGE_KEY = "gw2_api_key";

async function readTextSafe(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

export function Gw2ApiProvider({ children }) {
  const [apiKey, setApiKeyState] = useState(null);

  const [account, setAccount] = useState(null);
  const [characters, setCharacters] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load saved key on startup
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setApiKeyState(stored);
    })();
  }, []);

  const setApiKey = useCallback(async (key) => {
    const trimmed = (key || "").trim();
    setApiKeyState(trimmed || null);

    if (trimmed) await AsyncStorage.setItem(STORAGE_KEY, trimmed);
    else await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const request = useCallback(
    async (path, { method = "GET", query = null, body = null, auth = true } = {}) => {
      setError(null);

      const url = new URL(`${BASE_URL}${path}`);
      if (query && typeof query === "object") {
        Object.entries(query).forEach(([k, v]) => {
          if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
        });
      }

      const headers = {
        Accept: "application/json",
      };

      // In React Native you can safely send Authorization headers (no browser CORS preflight constraints).
      if (auth) {
        if (!apiKey) throw new Error("Missing API key. Set apiKey before calling authenticated endpoints.");
        headers.Authorization = `Bearer ${apiKey}`;
      }

      if (body != null) {
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(url.toString(), {
        method,
        headers,
        body: body != null ? JSON.stringify(body) : undefined,
      });

      if (!res.ok) {
        const text = await readTextSafe(res);
        // GW2 API often returns JSON, but this keeps error messages useful either way.
        throw new Error(`GW2 API error ${res.status}: ${text || res.statusText}`);
      }

      return await res.json();
    },
    [apiKey]
  );

  const getAccount = useCallback(async () => {
    return await request("/v2/account", { auth: true });
  }, [request]);

  const getCharacters = useCallback(async () => {
    // Without parameters, /v2/characters returns an array of character names (authenticated).
    return await request("/v2/characters", { auth: true });
  }, [request]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [acct, chars] = await Promise.all([getAccount(), getCharacters()]);
      setAccount(acct);
      setCharacters(chars);
      return { account: acct, characters: chars };
    } catch (e) {
      setAccount(null);
      setCharacters(null);
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [getAccount, getCharacters]);

  const getActiveBuildTab = useCallback(
    async (characterName) => {
      if (!characterName) throw new Error("Character name is required");
      return await request(
        `/v2/characters/${encodeURIComponent(characterName)}/buildtabs/active`,
        { auth: true }
      );
    },
    [request]
  );

  // Bulk-resolve helper: /v2/skills?ids=... and /v2/traits?ids=...
  const bulkGetByIds = useCallback(
    async (endpoint, ids) => {
      const unique = Array.from(new Set((ids ?? []).filter((x) => Number.isInteger(x))));
      if (unique.length === 0) return [];
      return await request(`/v2/${endpoint}`, {
        auth: false, // these are public endpoints
        query: { ids: unique.join(",") },
      });
    },
    [request]
  );

  const getCharacterTraitsAndSkills = useCallback(
    async (characterName, { resolve = true } = {}) => {
      const active = await getActiveBuildTab(characterName);

      // active.specializations: { pve, pvp, wvw } each is array of { id, traits: number[] }
      // active.skills: { pve, pvp, wvw } each has heal/utilities/elite (skill ids)
      const specsByMode = active?.specializations ?? null;
      const skillsByMode = active?.skills ?? null;

      if (!resolve) {
        return { characterName, specializations: specsByMode, skills: skillsByMode, raw: active };
      }

      // Collect trait ids across all modes
      const traitIds = [];
      for (const mode of ["pve", "pvp", "wvw"]) {
        const lines = specsByMode?.[mode];
        if (Array.isArray(lines)) {
          for (const line of lines) {
            if (Array.isArray(line?.traits)) traitIds.push(...line.traits);
          }
        }
      }

      // Collect skill ids across all modes
      const skillIds = [];
      for (const mode of ["pve", "pvp", "wvw"]) {
        const s = skillsByMode?.[mode];
        if (!s) continue;
        if (Number.isInteger(s?.heal)) skillIds.push(s.heal);
        if (Array.isArray(s?.utilities)) skillIds.push(...s.utilities);
        if (Number.isInteger(s?.elite)) skillIds.push(s.elite);
      }

      const [traits, skills] = await Promise.all([
        bulkGetByIds("traits", traitIds),
        bulkGetByIds("skills", skillIds),
      ]);

      // Index for convenience
      const traitsById = new Map(traits.map((t) => [t.id, t]));
      const skillsById = new Map(skills.map((s) => [s.id, s]));

      return {
        characterName,
        specializations: specsByMode,
        skills: skillsByMode,
        resolved: {
          traitsById,
          skillsById,
        },
        raw: active,
      };
    },
    [getActiveBuildTab, bulkGetByIds]
  );

  const getCharacterEquipment = useCallback(
    async (characterName) => {
      if (!characterName) throw new Error("Character name is required");
      return await request(
        `/v2/characters/${encodeURIComponent(characterName)}/equipment`,
        { auth: true }
      );
    },
    [request]
  );
  const getCharacterEquipmentResolved = useCallback(
    async (characterName) => {
      const eq = await getCharacterEquipment(characterName);

      const itemIds = Array.from(
        new Set(
          (eq?.equipment ?? [])
            .map((e) => e?.id)
            .filter((id) => Number.isInteger(id))
        )
      );

      // Public endpoint
      const items =
        itemIds.length > 0
          ? await request("/v2/items", {
            auth: false,
            query: { ids: itemIds.join(",") },
          })
          : [];

      const itemsById = new Map(items.map((it) => [it.id, it]));

      return {
        equipment: eq?.equipment ?? [],
        items, // array
        itemsById, // Map for lookup
        raw: eq,
      };
    },
    [getCharacterEquipment, request]
  );

  // If a key exists, you may choose to auto-refresh.
  useEffect(() => {
    if (!apiKey) return;
    refreshAll().catch(() => {
      // Error already stored in state; avoid noisy unhandled promise warnings.
    });
  }, [apiKey, refreshAll]);

  const value = useMemo(
    () => ({
      apiKey,
      setApiKey,
      clearError,

      account,
      characters,

      loading,
      error,

      request,
      getAccount,
      getCharacters,
      refreshAll,
      selectedCharacter,
      setSelectedCharacter,
      getActiveBuildTab,
      getCharacterTraitsAndSkills,
      getCharacterEquipment,
      getCharacterEquipmentResolved,
    }),
    [apiKey, setApiKey, clearError, account, characters, loading, error, request, getAccount, getCharacters, refreshAll, selectedCharacter, setSelectedCharacter, getActiveBuildTab, getCharacterTraitsAndSkills, getCharacterEquipment, getCharacterEquipmentResolved]
  );

  return <Gw2ApiContext.Provider value={value}>{children}</Gw2ApiContext.Provider>;
}

export function useGw2Api() {
  const ctx = useContext(Gw2ApiContext);
  if (!ctx) throw new Error("useGw2Api must be used within a Gw2ApiProvider");
  return ctx;
}