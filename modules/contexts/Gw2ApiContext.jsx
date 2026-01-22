import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Gw2ApiContext = createContext(null);

const BASE_URL = "https://api.guildwars2.com";
const STORAGE_KEYS_V2 = "gw2_api_keys_v2"; // [{id,key,fp}]
const STORAGE_SELECTED_KEY = "gw2_selected_key_id";

// Toggle this if you ever want to silence logs quickly
const DEBUG = false;

function log(...args) {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.log("[GW2]", ...args);
}

function logGroup(title, fn) {
  if (!DEBUG) return fn();
  // eslint-disable-next-line no-console
  console.group(`[GW2] ${title}`);
  try {
    return fn();
  } finally {
    // eslint-disable-next-line no-console
    console.groupEnd();
  }
}

async function readTextSafe(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function buildUrl(path, query) {
  const base = `${BASE_URL}${path}`;

  if (!query || typeof query !== "object") return base;

  const parts = [];
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }

  return parts.length ? `${base}?${parts.join("&")}` : base;
}

function newId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// Non-sensitive fingerprint: last 6 non-dash characters
function fingerprintKey(keyString) {
  const s = String(keyString || "").replace(/-/g, "");
  return s.length >= 6 ? s.slice(-6) : s;
}

// Non-sensitive hash of the exact Authorization token used
function fnv1a32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function safeJsonPreview(value, maxLen = 2000) {
  try {
    const s = JSON.stringify(value);
    if (typeof s !== "string") return String(value);
    return s.length > maxLen ? `${s.slice(0, maxLen)}…(truncated)` : s;
  } catch (e) {
    return `<<unstringifiable: ${String(e)}>>`;
  }
}

function summarizeValue(value) {
  if (value == null) return value;
  if (Array.isArray(value)) return { type: "array", length: value.length };
  if (typeof value === "object") return { type: "object", keys: Object.keys(value).slice(0, 30) };
  return value;
}

function diffKeys(prevKeys, nextKeys) {
  const prevById = new Map((prevKeys || []).map((k) => [k?.id, k]));
  const nextById = new Map((nextKeys || []).map((k) => [k?.id, k]));

  const added = [];
  const removed = [];
  const changed = [];

  for (const [id, nk] of nextById.entries()) {
    if (!prevById.has(id)) {
      added.push({ id, fp: nk?.fp });
      continue;
    }
    const pk = prevById.get(id);
    const pkKey = (pk?.key || "").trim();
    const nkKey = (nk?.key || "").trim();
    if (pkKey !== nkKey || pk?.fp !== nk?.fp) {
      changed.push({ id, fromFp: pk?.fp, toFp: nk?.fp });
    }
  }

  for (const [id, pk] of prevById.entries()) {
    if (!nextById.has(id)) removed.push({ id, fp: pk?.fp });
  }

  return { added, removed, changed };
}

export function Gw2ApiProvider({ children }) {
  const [hydrated, setHydrated] = useState(false);

  const [keys, setKeys] = useState([]); // [{id, key, fp}]
  const [selectedKeyId, setSelectedKeyIdState] = useState(null);

  const [accountsByKeyId, setAccountsByKeyId] = useState({});
  const [charactersByKeyId, setCharactersByKeyId] = useState({});

  const [selectedCharacter, setSelectedCharacterState] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ---- Change tracking (logs whenever something changes) ----
  const prevRef = useRef({
    hydrated: undefined,
    keys: undefined,
    selectedKeyId: undefined,
    accountsByKeyId: undefined,
    charactersByKeyId: undefined,
    selectedCharacter: undefined,
    loading: undefined,
    error: undefined,
  });

  useEffect(() => {
    if (prevRef.current.hydrated !== hydrated) {
      log("STATE change: hydrated", { from: prevRef.current.hydrated, to: hydrated });
      prevRef.current.hydrated = hydrated;
    }
  }, [hydrated]);

  useEffect(() => {
    const prev = prevRef.current.keys;
    if (prev !== keys) {
      const diff = diffKeys(prev || [], keys || []);
      log("STATE change: keys", {
        from: Array.isArray(prev) ? prev.length : prev,
        to: Array.isArray(keys) ? keys.length : keys,
        diff,
        preview: (keys || []).map((k) => ({ id: k.id, fp: k.fp })),
      });
      prevRef.current.keys = keys;
    }
  }, [keys]);

  useEffect(() => {
    if (prevRef.current.selectedKeyId !== selectedKeyId) {
      log("STATE change: selectedKeyId", {
        from: prevRef.current.selectedKeyId,
        to: selectedKeyId,
      });
      prevRef.current.selectedKeyId = selectedKeyId;
    }
  }, [selectedKeyId]);

  useEffect(() => {
    const prev = prevRef.current.accountsByKeyId;
    if (prev !== accountsByKeyId) {
      log("STATE change: accountsByKeyId", {
        from: summarizeValue(prev),
        to: summarizeValue(accountsByKeyId),
        keys: Object.keys(accountsByKeyId || {}),
      });
      prevRef.current.accountsByKeyId = accountsByKeyId;
    }
  }, [accountsByKeyId]);

  useEffect(() => {
    const prev = prevRef.current.charactersByKeyId;
    if (prev !== charactersByKeyId) {
      log("STATE change: charactersByKeyId", {
        from: summarizeValue(prev),
        to: summarizeValue(charactersByKeyId),
        keys: Object.keys(charactersByKeyId || {}),
      });
      prevRef.current.charactersByKeyId = charactersByKeyId;
    }
  }, [charactersByKeyId]);

  useEffect(() => {
    if (prevRef.current.selectedCharacter !== selectedCharacter) {
      log("STATE change: selectedCharacter", {
        from: prevRef.current.selectedCharacter,
        to: selectedCharacter,
      });
      prevRef.current.selectedCharacter = selectedCharacter;
    }
  }, [selectedCharacter]);

  useEffect(() => {
    if (prevRef.current.loading !== loading) {
      log("STATE change: loading", { from: prevRef.current.loading, to: loading });
      prevRef.current.loading = loading;
    }
  }, [loading]);

  useEffect(() => {
    if (prevRef.current.error !== error) {
      log("STATE change: error", { from: prevRef.current.error, to: error });
      prevRef.current.error = error;
    }
  }, [error]);

  // ---- Hydration ----
  useEffect(() => {
    (async () => {
      logGroup("HYDRATE start", () => {
        log("Reading AsyncStorage keys:", STORAGE_KEYS_V2);
        log("Reading AsyncStorage selected key:", STORAGE_SELECTED_KEY);
      });

      const rawKeys = await AsyncStorage.getItem(STORAGE_KEYS_V2);
      const rawSel = await AsyncStorage.getItem(STORAGE_SELECTED_KEY);

      logGroup("HYDRATE raw values", () => {
        log("AsyncStorage rawKeys:", rawKeys);
        log("AsyncStorage rawSel:", rawSel);
      });

      const parsedKeys = rawKeys ? JSON.parse(rawKeys) : [];
      const safeKeysRaw = Array.isArray(parsedKeys) ? parsedKeys : [];

      const safeKeys = safeKeysRaw
        .filter((k) => k && typeof k === "object" && typeof k.id === "string")
        .map((k) => {
          const key = typeof k.key === "string" ? k.key : "";
          const fp = typeof k.fp === "string" && k.fp ? k.fp : fingerprintKey(key);
          return { id: k.id, key, fp };
        });

      logGroup("HYDRATE parsed/normalized", () => {
        log("Parsed keys length:", safeKeysRaw.length);
        log("Safe keys length:", safeKeys.length);
        log("Safe keys preview:", safeKeys.map((k) => ({ id: k.id, fp: k.fp })));
      });

      setKeys(safeKeys);

      if (rawSel && safeKeys.some((k) => k.id === rawSel)) {
        log("Hydration selectedKeyId found in saved selection:", rawSel);
        setSelectedKeyIdState(rawSel);
      } else if (safeKeys.length > 0) {
        log("Hydration selectedKeyId defaulting to first key:", safeKeys[0].id);
        setSelectedKeyIdState(safeKeys[0].id);
      } else {
        log("Hydration selectedKeyId -> null (no keys)");
        setSelectedKeyIdState(null);
      }

      setHydrated(true);
      log("HYDRATE done");
    })().catch((e) => {
      logGroup("HYDRATE error", () => {
        log("Hydration failed:", String(e));
      });
      setKeys([]);
      setSelectedKeyIdState(null);
      setHydrated(true);
    });
  }, []);

  // Persist keys
  useEffect(() => {
    if (!hydrated) return;
    logGroup("PERSIST keys", () => {
      log("Writing keys to AsyncStorage", {
        storageKey: STORAGE_KEYS_V2,
        length: keys.length,
        preview: keys.map((k) => ({ id: k.id, fp: k.fp })),
      });
    });
    AsyncStorage.setItem(STORAGE_KEYS_V2, JSON.stringify(keys)).catch((e) => {
      log("AsyncStorage.setItem(keys) error:", String(e));
    });
  }, [hydrated, keys]);

  // Persist selected key
  useEffect(() => {
    if (!hydrated) return;

    if (selectedKeyId) {
      log("PERSIST selectedKeyId -> setItem", {
        storageKey: STORAGE_SELECTED_KEY,
        value: selectedKeyId,
      });
      AsyncStorage.setItem(STORAGE_SELECTED_KEY, selectedKeyId).catch((e) => {
        log("AsyncStorage.setItem(selectedKeyId) error:", String(e));
      });
    } else {
      log("PERSIST selectedKeyId -> removeItem", { storageKey: STORAGE_SELECTED_KEY });
      AsyncStorage.removeItem(STORAGE_SELECTED_KEY).catch((e) => {
        log("AsyncStorage.removeItem(selectedKeyId) error:", String(e));
      });
    }
  }, [hydrated, selectedKeyId]);

  const clearError = useCallback(() => {
    log("ACTION clearError()");
    setError(null);
  }, []);

  const selectedKeyEntry = useMemo(() => {
    const found = keys.find((k) => k.id === selectedKeyId) ?? null;
    log("DERIVED selectedKeyEntry recompute", {
      selectedKeyId,
      found: found ? { id: found.id, fp: found.fp } : null,
    });
    return found;
  }, [keys, selectedKeyId]);

  const apiKey = selectedKeyEntry?.key ?? null;

  // Request helper (logs everything in and out)
  const requestWithKey = useCallback(
    async (
      keyString,
      path,
      { method = "GET", query = null, body = null, auth = true } = {}
    ) => {
      logGroup("REQUEST in", () => {
        log("Inputs:", {
          hasKey: Boolean(keyString),
          keyHash: auth && keyString ? fnv1a32(String(keyString)) : null,
          path,
          method,
          query,
          hasBody: body != null,
          auth,
          bodyPreview: body != null ? safeJsonPreview(body, 800) : null,
        });
      });

      setError(null);

      // Cache-bust ONLY authenticated requests (prevents /v2/account being reused across tokens)
      const finalQuery = auth ? { ...(query || {}), _: Date.now() } : query;
      const url = buildUrl(path, finalQuery);

      log("GW2 REQUEST URL:", url);

      const headers = { Accept: "application/json" };

      if (auth) {
        if (!keyString) {
          log("REQUEST error: Missing API key");
          throw new Error("Missing API key.");
        }

        // Proof of which exact token is used (non-sensitive)
        log("AUTH KEY HASH:", fnv1a32(String(keyString)));
        headers.Authorization = `Bearer ${keyString}`;

        // Strong “do not cache” signals (helps with buggy intermediaries)
        headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        headers.Pragma = "no-cache";
        headers.Expires = "0";
      }

      if (body != null) headers["Content-Type"] = "application/json";

      let res;
      try {
        res = await fetch(url, {
          method,
          headers,
          body: body != null ? JSON.stringify(body) : undefined,
        });
      } catch (e) {
        logGroup("REQUEST network error", () => {
          log("Fetch threw:", String(e));
        });
        throw e;
      }

      logGroup("RESPONSE headers/status", () => {
        log("Status:", res.status, res.statusText);
        log("ok:", res.ok);

        // Expanded cache-related headers (optional but very helpful)
        log(
          "Response headers (cache hints):",
          (() => {
            try {
              const pick = [
                "content-type",
                "cache-control",
                "pragma",
                "expires",
                "etag",
                "age",
                "vary",
                "via",
                "cf-cache-status",
                "x-cache",
                "x-served-by",
              ];
              const out = {};
              for (const h of pick) out[h] = res.headers.get(h);
              return out;
            } catch {
              return "<<unavailable>>";
            }
          })()
        );
      });

      if (!res.ok) {
        const text = await readTextSafe(res);
        logGroup("RESPONSE error body", () => {
          log("Body text:", text);
        });
        throw new Error(`GW2 API error ${res.status}: ${text || res.statusText}`);
      }

      let json;
      try {
        json = await res.json();
      } catch (e) {
        log("RESPONSE json parse error:", String(e));
        throw e;
      }

      logGroup("REQUEST out (json)", () => {
        log("JSON summary:", summarizeValue(json));
        log("JSON preview:", safeJsonPreview(json, 2000));
      });

      return json;
    },
    []
  );


  // Default request uses currently selected key
  const request = useCallback(
    async (path, opts = {}) => {
      log("ACTION request()", { path, opts });
      return await requestWithKey(apiKey, path, opts);
    },
    [apiKey, requestWithKey]
  );

  const getAccountWithKey = useCallback(
    async (keyString) => {
      log("ACTION getAccountWithKey()", {
        keyHash: keyString ? fnv1a32(String(keyString)) : null,
      });
      return await requestWithKey(keyString, "/v2/account", { auth: true });
    },
    [requestWithKey]
  );

  const getCharactersWithKey = useCallback(
    async (keyString) => {
      log("ACTION getCharactersWithKey()", {
        keyHash: keyString ? fnv1a32(String(keyString)) : null,
      });
      return await requestWithKey(keyString, "/v2/characters", { auth: true });
    },
    [requestWithKey]
  );

  const refreshKey = useCallback(
    async (keyId, keyString, fpForLog) => {
      logGroup("ACTION refreshKey() in", () => {
        log("Args:", {
          keyId,
          fp: fpForLog ?? fingerprintKey(keyString),
          keyHash: keyString ? fnv1a32(String(keyString)) : null,
        });
      });

      const [acct, chars] = await Promise.all([
        getAccountWithKey(keyString),
        getCharactersWithKey(keyString),
      ]);

      logGroup("ACTION refreshKey() out", () => {
        log("Result summary:", {
          acctName: acct?.name,
          acctId: acct?.id,
          charsCount: Array.isArray(chars) ? chars.length : null,
          charsType: Array.isArray(chars) ? "array" : typeof chars,
        });
      });

      setAccountsByKeyId((prev) => {
        const next = { ...prev, [keyId]: acct };
        log("STATE write: accountsByKeyId[keyId]", { keyId, acct: { id: acct?.id, name: acct?.name } });
        return next;
      });
      setCharactersByKeyId((prev) => {
        const next = { ...prev, [keyId]: chars };
        log("STATE write: charactersByKeyId[keyId]", {
          keyId,
          chars: Array.isArray(chars) ? { length: chars.length } : typeof chars,
        });
        return next;
      });

      return { account: acct, characters: chars };
    },
    [getAccountWithKey, getCharactersWithKey]
  );

  const refreshAllKeys = useCallback(async () => {
    log("ACTION refreshAllKeys() in", { keyCount: keys.length, keys: keys.map((k) => ({ id: k.id, fp: k.fp })) });
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(keys.map((k) => refreshKey(k.id, k.key, k.fp)));
      log("ACTION refreshAllKeys() out", { refreshed: results.length });
      return results;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log("ACTION refreshAllKeys() error", msg);
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [keys, refreshKey]);

  const addKey = useCallback(
    async (rawKey) => {
      logGroup("ACTION addKey() in", () => {
        log("rawKey (length only):", (rawKey || "").length);
      });

      const trimmed = (rawKey || "").trim();
      if (!trimmed) {
        log("ACTION addKey() aborted: empty");
        return;
      }

      const fp = fingerprintKey(trimmed);
      const entry = { id: newId(), key: trimmed, fp };

      log("Adding GW2 API key", { fp, id: entry.id });

      // IMPORTANT: didAdd must not rely on synchronous state updates.
      // We'll compute "already" using current keys snapshot as a best-effort fast-path,
      // and still keep the functional setKeys for correctness.
      const alreadyNow = keys.some((k) => (k.key || "").trim() === trimmed);
      log("Pre-check already exists (snapshot):", alreadyNow);

      let didAdd = false;
      setKeys((prev) => {
        const already = prev.some((k) => (k.key || "").trim() === trimmed);
        log("Key already exists (authoritative in setter):", already);
        if (already) return prev;
        didAdd = true;
        return [entry, ...prev];
      });
      
      setSelectedKeyIdState((prev) => {
        const next = entry.id; // always select the newly added key
        log("STATE write: selectedKeyId (addKey)", { from: prev, to: next });
        return next;
      });

      if (alreadyNow) {
        log("ACTION addKey(): skipping refresh because snapshot indicates duplicate");
        return;
      }

      // Best-effort: refresh immediately; if it was a duplicate due to race, refreshKey will just be extra work.
      // If you want strict correctness, move refresh to a useEffect watching keys additions.
      log("ACTION addKey(): refreshing newly added key (best-effort)");
      await refreshKey(entry.id, entry.key, entry.fp);
    },
    [keys, refreshKey]
  );

  const removeKey = useCallback(
    async (id) => {
      log("ACTION removeKey() in", { id });

      setKeys((prev) => {
        const next = prev.filter((k) => k.id !== id);
        log("STATE write: keys (removeKey)", {
          removedId: id,
          before: prev.length,
          after: next.length,
        });
        return next;
      });

      setAccountsByKeyId((prev) => {
        const next = { ...prev };
        delete next[id];
        log("STATE write: accountsByKeyId delete", { id, remaining: Object.keys(next).length });
        return next;
      });

      setCharactersByKeyId((prev) => {
        const next = { ...prev };
        delete next[id];
        log("STATE write: charactersByKeyId delete", { id, remaining: Object.keys(next).length });
        return next;
      });

      // NOTE: The original code relied on the outer `keys` snapshot, which can be stale.
      // Here we select based on the current keys snapshot (still potentially stale), but we log it explicitly.
      setSelectedKeyIdState((prevSel) => {
        if (prevSel !== id) return prevSel;

        const remaining = keys.filter((k) => k.id !== id);
        const nextSel = remaining.length ? remaining[0].id : null;

        log("STATE write: selectedKeyId (removeKey)", {
          removedId: id,
          from: prevSel,
          to: nextSel,
          remainingCountSnapshot: remaining.length,
        });

        return nextSel;
      });

      if (selectedKeyId === id) {
        log("STATE write: selectedCharacter -> null (removed selected key)");
        setSelectedCharacterState(null);
      }

      log("ACTION removeKey() out", { id });
    },
    [keys, selectedKeyId]
  );

  const setSelectedCharacter = useCallback((characterName, keyId) => {
    log("ACTION setSelectedCharacter()", { characterName, keyId });
    if (keyId) setSelectedKeyIdState(keyId);
    setSelectedCharacterState(characterName ?? null);
  }, []);

  // Public endpoints helper
  const bulkGetByIds = useCallback(
    async (endpoint, ids) => {
      logGroup("ACTION bulkGetByIds() in", () => {
        log("Args:", {
          endpoint,
          idsType: Array.isArray(ids) ? "array" : typeof ids,
          idsCount: Array.isArray(ids) ? ids.length : null,
        });
      });

      const unique = Array.from(new Set((ids ?? []).filter((x) => Number.isInteger(x))));
      log("bulkGetByIds unique ids:", { endpoint, count: unique.length });

      if (unique.length === 0) {
        log("bulkGetByIds returning [] (no ids)");
        return [];
      }

      const out = await requestWithKey(null, `/v2/${endpoint}`, {
        auth: false,
        query: { ids: unique.join(",") },
      });

      logGroup("ACTION bulkGetByIds() out", () => {
        log("Result summary:", summarizeValue(out));
      });

      return out;
    },
    [requestWithKey]
  );

  const getActiveBuildTab = useCallback(
    async (characterName) => {
      log("ACTION getActiveBuildTab()", { characterName });
      if (!characterName) throw new Error("Character name is required");
      const out = await request(
        `/v2/characters/${encodeURIComponent(characterName)}/buildtabs/active`,
        { auth: true }
      );
      log("ACTION getActiveBuildTab() out", { characterName, summary: summarizeValue(out) });
      return out;
    },
    [request]
  );

  const getCharacterTraitsAndSkills = useCallback(
    async (characterName, { resolve = true } = {}) => {
      logGroup("ACTION getCharacterTraitsAndSkills() in", () => {
        log("Args:", { characterName, resolve });
      });

      const active = await getActiveBuildTab(characterName);

      const build = active?.build ?? null;
      const specs = Array.isArray(build?.specializations) ? build.specializations : [];
      const specializationIds = specs.map((s) => s?.id).filter(Number.isInteger);

      const landSkills = build?.skills ?? null;
      const aquaticSkills = build?.aquatic_skills ?? null;

      if (!resolve) {
        const out = {
          characterName,
          profession: build?.profession ?? null,
          specializations: specs,
          skills: landSkills,
          aquatic_skills: aquaticSkills,
          raw: active,
        };
        logGroup("ACTION getCharacterTraitsAndSkills() out (unresolved)", () => {
          log("Output summary:", summarizeValue(out));
        });
        return out;
      }

      const traitIds = [];
      for (const line of specs) if (Array.isArray(line?.traits)) traitIds.push(...line.traits);

      const skillIds = [];
      for (const s of [landSkills, aquaticSkills]) {
        if (!s) continue;
        if (Number.isInteger(s?.heal)) skillIds.push(s.heal);
        if (Array.isArray(s?.utilities)) skillIds.push(...s.utilities);
        if (Number.isInteger(s?.elite)) skillIds.push(s.elite);
      }

      log("Resolved ids:", {
        specializationIdsCount: specializationIds.length,
        traitIdsCount: traitIds.length,
        skillIdsCount: skillIds.length,
      });

      const [traits, skills, specializations] = await Promise.all([
        bulkGetByIds("traits", traitIds),
        bulkGetByIds("skills", skillIds),
        bulkGetByIds("specializations", specializationIds),
      ]);

      const out = {
        characterName,
        profession: build?.profession ?? null,
        specializations: specs,
        skills: landSkills,
        aquatic_skills: aquaticSkills,
        resolved: {
          traitsById: Object.fromEntries((traits ?? []).map((t) => [t.id, t])),
          skillsById: Object.fromEntries((skills ?? []).map((s) => [s.id, s])),
          specializationsById: Object.fromEntries((specializations ?? []).map((s) => [s.id, s])),
        },
        raw: active,
      };

      logGroup("ACTION getCharacterTraitsAndSkills() out", () => {
        log("Output summary:", {
          characterName,
          profession: out.profession,
          specLines: Array.isArray(out.specializations) ? out.specializations.length : null,
          skillsSummary: summarizeValue(out.skills),
          aquaticSkillsSummary: summarizeValue(out.aquatic_skills),
          resolvedCounts: {
            traits: Object.keys(out.resolved.traitsById).length,
            skills: Object.keys(out.resolved.skillsById).length,
            specializations: Object.keys(out.resolved.specializationsById).length,
          },
        });
      });

      return out;
    },
    [getActiveBuildTab, bulkGetByIds]
  );

  const getCharacterEquipment = useCallback(
    async (characterName) => {
      log("ACTION getCharacterEquipment()", { characterName });
      if (!characterName) throw new Error("Character name is required");
      const out = await request(
        `/v2/characters/${encodeURIComponent(characterName)}/equipment`,
        { auth: true }
      );
      log("ACTION getCharacterEquipment() out", { characterName, summary: summarizeValue(out) });
      return out;
    },
    [request]
  );

  const getCharacterEquipmentResolved = useCallback(
    async (characterName) => {
      log("ACTION getCharacterEquipmentResolved() in", { characterName });
      if (!characterName) throw new Error("Character name is required");

      const eq = await getCharacterEquipment(characterName);

      const itemIds = Array.from(
        new Set((eq?.equipment ?? []).map((e) => e?.id).filter(Number.isInteger))
      );

      log("Equipment itemIds unique:", { count: itemIds.length });

      const items =
        itemIds.length > 0
          ? await requestWithKey(null, "/v2/items", {
            auth: false,
            query: { ids: itemIds.join(",") },
          })
          : [];

      const itemsById = Object.fromEntries(
        (Array.isArray(items) ? items : []).map((it) => [it.id, it])
      );

      const out = { equipment: eq?.equipment ?? [], items, itemsById, raw: eq };

      log("ACTION getCharacterEquipmentResolved() out", {
        equipmentCount: Array.isArray(out.equipment) ? out.equipment.length : null,
        itemsCount: Array.isArray(out.items) ? out.items.length : null,
        itemsByIdCount: Object.keys(out.itemsById).length,
      });

      return out;
    },
    [getCharacterEquipment, requestWithKey]
  );

  const account = selectedKeyId ? accountsByKeyId[selectedKeyId] ?? null : null;
  const characters = selectedKeyId ? charactersByKeyId[selectedKeyId] ?? null : null;

  const value = useMemo(() => {
    const v = {
      hydrated,

      keys,
      accountsByKeyId,
      charactersByKeyId,

      addKey,
      removeKey,
      refreshAllKeys,

      selectedKeyId,
      apiKey,

      account,
      characters,

      selectedCharacter,
      setSelectedCharacter,

      loading,
      error,
      clearError,

      request,
      getActiveBuildTab,
      getCharacterTraitsAndSkills,
      getCharacterEquipment,
      getCharacterEquipmentResolved,
    };

    log("CONTEXT value recompute", {
      hydrated,
      keyCount: keys.length,
      selectedKeyId,
      hasApiKey: Boolean(apiKey),
      hasAccount: Boolean(account),
      charactersType: Array.isArray(characters) ? "array" : typeof characters,
      charactersCount: Array.isArray(characters) ? characters.length : null,
      selectedCharacter,
      loading,
      hasError: Boolean(error),
    });

    return v;
  }, [
    hydrated,
    keys,
    accountsByKeyId,
    charactersByKeyId,
    addKey,
    removeKey,
    refreshAllKeys,
    selectedKeyId,
    apiKey,
    account,
    characters,
    selectedCharacter,
    setSelectedCharacter,
    loading,
    error,
    clearError,
    request,
    getActiveBuildTab,
    getCharacterTraitsAndSkills,
    getCharacterEquipment,
    getCharacterEquipmentResolved,
  ]);

  return <Gw2ApiContext.Provider value={value}>{children}</Gw2ApiContext.Provider>;
}

export function useGw2Api() {
  const ctx = useContext(Gw2ApiContext);
  if (!ctx) throw new Error("useGw2Api must be used within a Gw2ApiProvider");
  return ctx;
}
