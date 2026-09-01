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

const storageKey = (userId) => `fadl_avatarprefs_${userId || "guest"}`;

function load(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { skinTone: SKIN_TONES[2].hex, bodyType: "standing" };
}

export function useAvatarPrefs(userId) {
  const [prefs, setPrefs] = useState(() => load(userId));

  useEffect(() => { setPrefs(load(userId)); }, [userId]);
  useEffect(() => {
    localStorage.setItem(storageKey(userId), JSON.stringify(prefs));
  }, [prefs, userId]);

  const setSkinTone = useCallback((skinTone) => setPrefs((p) => ({ ...p, skinTone })), []);
  const setBodyType = useCallback((bodyType) => setPrefs((p) => ({ ...p, bodyType })), []);

  return { skinTone: prefs.skinTone, bodyType: prefs.bodyType, setSkinTone, setBodyType };
}
