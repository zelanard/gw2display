import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Orientation from "react-native-orientation-locker";

const OrientationContext = createContext(null);

function mapOrientationToTab(o) {
  if (!o || o === "UNKNOWN") return null;
  if (o === "PORTRAIT-UPSIDEDOWN" || o === "LANDSCAPE-LEFT") return "Build";
  if (o === "PORTRAIT" || o === "LANDSCAPE-RIGHT") return "Equipment";
  return null;
}

function isPortrait(o) {
  // Default to portrait until we know
  if (!o || o === "UNKNOWN") return true;
  return o === "PORTRAIT" || o === "PORTRAIT-UPSIDEDOWN";
}

export function OrientationProvider({ children }) {
  const [orientation, setOrientation] = useState(null);
  const lastOrientationRef = useRef(null);

  const handler = useCallback((o) => {
    if (!o || o === "UNKNOWN") return;
    if (lastOrientationRef.current === o) return;

    lastOrientationRef.current = o;
    setOrientation(o);
    console.log("[OrientationContext] orientation =", o);
  }, []);

  useEffect(() => {
    Orientation.getDeviceOrientation((o) => handler(o));
    Orientation.addDeviceOrientationListener(handler);
    return () => Orientation.removeDeviceOrientationListener(handler);
  }, [handler]);

  const portrait = useMemo(() => isPortrait(orientation), [orientation]);
  const targetTab = useMemo(() => mapOrientationToTab(orientation), [orientation]);

  const value = useMemo(
    () => ({ orientation, portrait, targetTab }),
    [orientation, portrait, targetTab]
  );

  return <OrientationContext.Provider value={value}>{children}</OrientationContext.Provider>;
}

export function useOrientation() {
  const ctx = useContext(OrientationContext);
  if (!ctx) throw new Error("useOrientation must be used within an OrientationProvider");
  return ctx;
}
