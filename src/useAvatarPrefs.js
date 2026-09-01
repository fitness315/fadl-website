import { useState, useEffect, useCallback } from "react";

export const SKIN_TONES = [
  { name: "Porcelain", hex: "#f2d5b8" },
  { name: "Ivory", hex: "#f0c8a0" },
  { name: "Fair", hex: "#e8b48c" },
  { name: "Beige", hex: "#d9a066" },
  { name: "Tan", hex: "#c68a5f" },
  { name: "Golden", hex: "#b97a4b" },
  { name: "Caramel", hex: "#a5673f" },
  { name: "Chestnut", hex: "#8a5636" },
  { name: "Deep", hex: "#7a4a2b" },
  { name: "Umber", hex: "#5c3a22" },
  { name: "Espresso", hex: "#4a2e1c" },
  { name: "Ebony", hex: "#2e1c11" },
];

export const HAIR_COLORS = [
  { name: "Black", hex: "#1a1a1a" },
  { name: "Brown", hex: "#4a2e1c" },
  { name: "Auburn", hex: "#8a3b23" },
  { name: "Blonde", hex: "#d4a03c" },
  { name: "Grey", hex: "#9a9a9a" },
  { name: "Platinum", hex: "#e8e2d0" },
];

export const HAIR_STYLES = ["none", "short", "mohawk", "long"];

const storageKey = (userId) => `fadl_avatarprefs_${userId || "guest"}`;

const DEFAULT_PREFS = {
  skinTone: SKIN_TONES[2].hex,
  bodyType: "standing",
  hairStyle: "short",
  hairColor: HAIR_COLORS[0].hex,
  facialHair: "none",
  glasses: false,
};

function load(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PREFS;
}

export function useAvatarPrefs(userId) {
  const [prefs, setPrefs] = useState(() => load(userId));

  useEffect(() => { setPrefs(load(userId)); }, [userId]);
  useEffect(() => {
    localStorage.setItem(storageKey(userId), JSON.stringify(prefs));
  }, [prefs, userId]);

  const set = useCallback((key) => (value) => setPrefs((p) => ({ ...p, [key]: value })), []);

  return {
    ...prefs,
    setSkinTone: set("skinTone"),
    setBodyType: set("bodyType"),
    setHairStyle: set("hairStyle"),
    setHairColor: set("hairColor"),
    setFacialHair: set("facialHair"),
    setGlasses: set("glasses"),
  };
}
