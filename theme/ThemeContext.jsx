import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { StyleSheet } from "react-native";

const ThemeContext = createContext(null);

const DarkTheme = {
  mode: "dark",
  colors: {
    bg: "#0B0F17",
    topBar: "#0F1624",
    text: "#EAF0FF",
    textMuted: "rgba(234,240,255,0.75)",
    border: "rgba(255,255,255,0.10)",
    surface: "rgba(255,255,255,0.06)",
    overlay: "rgba(0,0,0,0.35)",
  },
  spacing: {
    screen: 16,
  },
  sizing: {
    topBarHeight: 52,
    drawerWidth: 280,
    iconBtn: 40,
  },
  radius: {
    card: 10,
  },
  typography: {
    h1: { fontSize: 22, fontWeight: "700" },
    title: { fontSize: 18, fontWeight: "700" },
    body: { fontSize: 14, lineHeight: 20 },
    topBarTitle: { fontSize: 16, fontWeight: "600" },
  },
};

const LightTheme = {
  mode: "light",
  colors: {
    bg: "#FFFFFF",
    topBar: "#F3F5F9",
    text: "#0B0F17",
    textMuted: "rgba(11,15,23,0.65)",
    border: "rgba(11,15,23,0.12)",
    surface: "rgba(11,15,23,0.06)",
    overlay: "rgba(0,0,0,0.25)",
  },
  spacing: DarkTheme.spacing,
  sizing: DarkTheme.sizing,
  radius: DarkTheme.radius,
  typography: DarkTheme.typography,
};

function createStyles(theme) {
  const { colors, spacing, sizing, radius, typography } = theme;

  return StyleSheet.create({
    topBarSafe: { backgroundColor: colors.topBar },
    topBar: {
      height: sizing.topBarHeight,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.topBar,
    },
    topBarTitle: {
      color: colors.text,
      ...typography.topBarTitle,
      flex: 1,
      marginLeft: 10,
    },
    iconBtn: {
      width: sizing.iconBtn,
      height: sizing.iconBtn,
      alignItems: "center",
      justifyContent: "center",
    },
    iconText: { color: colors.text, fontSize: 18 },

    screen: { flex: 1, padding: spacing.screen, backgroundColor: colors.bg },
    h1: { color: colors.text, ...typography.h1, marginBottom: 8 },
    h2: { color: colors.text, ...typography.h2, marginBottom: 6 },
    p: { color: colors.textMuted, ...typography.body },

    drawerContainer: { flexGrow: 1 },
    drawerHeader: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.topBar,
    },
    drawerTitle: { color: colors.text, ...typography.title },
    drawerSubtitle: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
    drawerBody: { padding: 12 },

    sectionHeader: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: radius.card,
      backgroundColor: colors.surface,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
    },
    sectionHeaderText: { color: colors.text, fontSize: 14, fontWeight: "600" },

    sectionItems: { paddingLeft: 6, paddingTop: 6, paddingBottom: 6 },
    item: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: radius.card },
    itemText: { color: colors.textMuted, fontSize: 14 },
        textInput: {
      marginTop: 6,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: radius.card,
      backgroundColor: colors.surface,
      color: colors.text, // <-- this is the key
      fontSize: 14,
    },
  });
}

export function ThemeProvider({ children, initialMode = "dark" }) {
  const [mode, setMode] = useState(initialMode);

  const theme = useMemo(() => (mode === "dark" ? DarkTheme : LightTheme), [mode]);

  const toggleTheme = useCallback(() => {
    setMode((m) => (m === "dark" ? "light" : "dark"));
  }, []);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const value = useMemo(
    () => ({ theme, styles, mode, setMode, toggleTheme }),
    [theme, styles, mode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx.theme;
}

export function useStyles() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useStyles must be used inside ThemeProvider");
  return ctx.styles;
}

export function useThemeActions() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeActions must be used inside ThemeProvider");
  return { mode: ctx.mode, setMode: ctx.setMode, toggleTheme: ctx.toggleTheme };
}
