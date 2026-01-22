// Components/OrientationTabSync.js
import React, { useEffect, useRef } from "react";
import { useOrientation } from "../contexts/OrientationContext";

export default function OrientationTabSync({ navigation }) {
  const { targetTab, orientation } = useOrientation();
  const lastTabRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!targetTab) return;

    // If we already jumped to this, ignore.
    if (lastTabRef.current === targetTab) return;

    // Defer until after layout/nav settles
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      try {
        console.log("[OrientationTabSync] orientation =", orientation, "=> jumpTo", targetTab);
        navigation.jumpTo(targetTab);
        lastTabRef.current = targetTab;
      } catch (e) {
        console.log("[OrientationTabSync] jumpTo failed:", e?.message ?? e);
        // Do NOT set lastTabRef; allow retry on next event
      }
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [targetTab, orientation, navigation]);

  return null;
}
