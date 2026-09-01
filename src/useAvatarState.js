import { useState, useEffect, useCallback, useRef } from "react";
import { SUPABASE_URL, sbHeaders } from "./supabaseClient";
import { playLevelUpSound, triggerHaptic } from "./soundEffects";

export const MUSCLES = ["chest", "back", "shoulders", "arms", "legs", "core"];

// How much each training day grows each muscle group when logged, based
// on that day's actual exercise focus in the workout plan.
export const DAY_MUSCLES = {
  "DAY A": { chest: 2, shoulders: 1.5, arms: 1 },
  "DAY B": { back: 2, arms: 1.5, shoulders: 0.5 },
  "DAY C": { legs: 2.5, core: 1 },
  "DAY D": { chest: 0.5, back: 0.5, shoulders: 0.5, arms: 0.5, legs: 1, core: 0.5 },
};

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

const GRACE_DAYS = 7; // days a muscle can go untrained before it starts decaying
const DECAY_PER_DAY = 0.12;
const HISTORY_LIMIT = 30;

const emptyStats = () => MUSCLES.reduce((a, m) => ({ ...a, [m]: 0 }), {});

const DEFAULT_STATE = {
  stats: emptyStats(),
  totalWorkouts: 0,
  loggedSessions: [],
  lastTrained: {},
  skinTone: SKIN_TONES[2].hex,
  bodyType: "standing",
  hairStyle: "short",
  hairColor: HAIR_COLORS[0].hex,
  facialHair: "none",
  glasses: false,
  history: [],
  updatedAt: new Date(0).toISOString(),
};

const storageKey = (userId) => `fadl_avatar_${userId || "guest"}`;

function loadLocal(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_STATE;
}

function saveLocal(userId, data) {
  try { localStorage.setItem(storageKey(userId), JSON.stringify(data)); } catch {}
}

function rowToState(row) {
  return {
    stats: { ...emptyStats(), ...(row.stats || {}) },
    totalWorkouts: row.total_workouts ?? 0,
    loggedSessions: row.logged_sessions || [],
    lastTrained: row.last_trained || {},
    skinTone: row.skin_tone || DEFAULT_STATE.skinTone,
    bodyType: row.body_type || DEFAULT_STATE.bodyType,
    hairStyle: row.hair_style || DEFAULT_STATE.hairStyle,
    hairColor: row.hair_color || DEFAULT_STATE.hairColor,
    facialHair: row.facial_hair || DEFAULT_STATE.facialHair,
    glasses: !!row.glasses,
    history: row.history || [],
    updatedAt: row.updated_at || DEFAULT_STATE.updatedAt,
  };
}

function stateToRow(userId, data) {
  return {
    user_id: userId,
    stats: data.stats,
    total_workouts: data.totalWorkouts,
    logged_sessions: data.loggedSessions,
    last_trained: data.lastTrained,
    skin_tone: data.skinTone,
    body_type: data.bodyType,
    hair_style: data.hairStyle,
    hair_color: data.hairColor,
    facial_hair: data.facialHair,
    glasses: data.glasses,
    history: data.history,
    updated_at: data.updatedAt,
  };
}

// Cloud sync is best-effort: every call is wrapped so a missing table,
// missing RLS policy, or offline device just falls back to localStorage
// silently instead of breaking the app.
async function fetchCloud(userId, token) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/avatar_progress?user_id=eq.${userId}&select=*`, { headers: sbHeaders(token) });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rowToState(rows[0]) : null;
  } catch { return null; }
}

async function pushCloud(userId, token, data) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/avatar_progress`, {
      method: "POST",
      headers: { ...sbHeaders(token), Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(stateToRow(userId, data)),
    });
  } catch {}
}

const levelFor = (total) => 1 + Math.floor(total / 4);

export function useAvatarState(session) {
  const userId = session?.user?.id;
  const token = session?.token;
  const [data, setData] = useState(() => loadLocal(userId));
  const [pendingLevelUp, setPendingLevelUp] = useState(null);
  const syncTimer = useRef(null);

  // Initial load for this user + reconcile against the cloud copy (the
  // more recently updated of the two wins).
  useEffect(() => {
    const local = loadLocal(userId);
    setData(local);
    if (!userId || !token) return;
    (async () => {
      const cloud = await fetchCloud(userId, token);
      if (cloud) {
        const useCloud = new Date(cloud.updatedAt).getTime() > new Date(local.updatedAt).getTime();
        const winner = useCloud ? cloud : local;
        setData(winner);
        saveLocal(userId, winner);
        if (!useCloud) pushCloud(userId, token, local);
      } else {
        pushCloud(userId, token, local);
      }
    })();
  }, [userId, token]);

  // Persist locally immediately, and debounce a cloud upsert.
  useEffect(() => {
    saveLocal(userId, data);
    if (!userId || !token) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => pushCloud(userId, token, data), 900);
    return () => clearTimeout(syncTimer.current);
  }, [data, userId, token]);

  const isLogged = useCallback((sessionId) => data.loggedSessions.includes(sessionId), [data]);

  const logWorkout = useCallback((dayLabel, sessionId) => {
    setData((prev) => {
      if (prev.loggedSessions.includes(sessionId)) return prev;
      const gains = DAY_MUSCLES[dayLabel] || {};
      const stats = { ...prev.stats };
      const lastTrained = { ...prev.lastTrained };
      const today = new Date().toISOString();
      MUSCLES.forEach((m) => {
        if (gains[m]) {
          stats[m] = (stats[m] || 0) + gains[m];
          lastTrained[m] = today;
        }
      });
      const totalWorkouts = prev.totalWorkouts + 1;
      if (levelFor(totalWorkouts) > levelFor(prev.totalWorkouts)) {
        playLevelUpSound();
        triggerHaptic();
        setPendingLevelUp(levelFor(totalWorkouts));
      }
      return { ...prev, stats, lastTrained, totalWorkouts, loggedSessions: [...prev.loggedSessions, sessionId], updatedAt: today };
    });
  }, []);

  // Called once the caller has rendered the post-level-up avatar and
  // grabbed a thumbnail of it (or null if it couldn't).
  const commitLevelUpSnapshot = useCallback((thumbnail) => {
    setData((prev) => {
      const entry = { date: new Date().toISOString(), level: levelFor(prev.totalWorkouts), stats: prev.stats, thumbnail };
      return { ...prev, history: [...prev.history, entry].slice(-HISTORY_LIMIT), updatedAt: new Date().toISOString() };
    });
    setPendingLevelUp(null);
  }, []);

  const set = useCallback((key) => (value) => setData((p) => ({ ...p, [key]: value, updatedAt: new Date().toISOString() })), []);

  // Effective (displayed) stats apply decay for muscles left untrained
  // past the grace period. The raw accumulated stat is never reduced in
  // storage, so training again immediately restores full size.
  const now = Date.now();
  const stats = { ...data.stats };
  MUSCLES.forEach((m) => {
    const last = data.lastTrained[m];
    if (!last) return;
    const daysSince = (now - new Date(last).getTime()) / 86400000;
    if (daysSince > GRACE_DAYS) {
      stats[m] = Math.max(0, stats[m] - (daysSince - GRACE_DAYS) * DECAY_PER_DAY);
    }
  });

  return {
    stats,
    rawStats: data.stats,
    lastTrained: data.lastTrained,
    totalWorkouts: data.totalWorkouts,
    history: data.history,
    isLogged,
    logWorkout,
    pendingLevelUp,
    commitLevelUpSnapshot,
    skinTone: data.skinTone,
    bodyType: data.bodyType,
    hairStyle: data.hairStyle,
    hairColor: data.hairColor,
    facialHair: data.facialHair,
    glasses: data.glasses,
    setSkinTone: set("skinTone"),
    setBodyType: set("bodyType"),
    setHairStyle: set("hairStyle"),
    setHairColor: set("hairColor"),
    setFacialHair: set("facialHair"),
    setGlasses: set("glasses"),
  };
}
