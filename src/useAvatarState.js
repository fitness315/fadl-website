import { useState, useEffect, useCallback, useRef } from "react";
import { SUPABASE_URL, sbHeaders } from "./supabaseClient";
import { playLevelUpSound, playAchievementSound, triggerHaptic } from "./soundEffects";

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
  unlockedAchievements: [],
  updatedAt: new Date(0).toISOString(),
};

const DAY_MS = 86400000;
const weekKey = (isoDate) => Math.floor(new Date(isoDate).getTime() / (7 * DAY_MS));

// Week streak: consecutive weeks (rolling 7-day buckets, not calendar
// weeks) with at least one workout logged. Forgiving of rest days within
// a week, and doesn't reset just because "today" hasn't been trained yet
// if this week isn't over.
export function computeStreaks(loggedSessions) {
  const weeks = new Set(loggedSessions.map((id) => weekKey(id.slice(0, 10))));
  if (weeks.size === 0) return { current: 0, longest: 0 };

  const sorted = [...weeks].sort((a, b) => a - b);
  let longest = 1, run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const thisWeek = weekKey(new Date().toISOString());
  let current = 0;
  if (weeks.has(thisWeek) || weeks.has(thisWeek - 1)) {
    let w = weeks.has(thisWeek) ? thisWeek : thisWeek - 1;
    while (weeks.has(w)) { current += 1; w -= 1; }
  }
  return { current, longest };
}

function hasFullTrainingWeek(loggedSessions) {
  const byWeek = {};
  loggedSessions.forEach((id) => {
    const dayMatch = id.match(/DAY [A-D]/);
    if (!dayMatch) return;
    const wk = weekKey(id.slice(0, 10));
    (byWeek[wk] ||= new Set()).add(dayMatch[0]);
  });
  return Object.values(byWeek).some((set) => set.size >= 4);
}

// Achievements are sticky (once unlocked, always shown as unlocked) - see
// unlockedAchievements below. Checks run against raw (non-decayed) stats
// so decay timing never makes an achievement harder to reach.
export const ACHIEVEMENTS = [
  { id: "first_rep", label: "First Rep", icon: "🔰", desc: "Log your first workout.", check: (c) => c.totalWorkouts >= 1 },
  { id: "habit_formed", label: "Habit Formed", icon: "🔥", desc: "Log 10 workouts.", check: (c) => c.totalWorkouts >= 10 },
  { id: "century_club", label: "Century Club", icon: "💯", desc: "Log 100 workouts.", check: (c) => c.totalWorkouts >= 100 },
  { id: "full_send", label: "Full Send", icon: "⚡", desc: "Complete all 4 training days in one week.", check: (c) => hasFullTrainingWeek(c.loggedSessions) },
  { id: "leg_day_warrior", label: "Leg Day Warrior", icon: "🦵", desc: "Complete Leg Day 10 times.", check: (c) => c.loggedSessions.filter((id) => id.includes("DAY C")).length >= 10 },
  { id: "balanced", label: "Balanced Physique", icon: "⚖️", desc: "Every muscle group trained and within close range of each other.", check: (c) => {
      const vals = MUSCLES.map((m) => c.stats[m] || 0);
      return vals.every((v) => v > 2) && Math.max(...vals) - Math.min(...vals) <= 3;
    } },
  { id: "streak_3", label: "3 Week Streak", icon: "📅", desc: "Train at least once a week for 3 weeks running.", check: (c) => c.streaks.longest >= 3 },
  { id: "streak_12", label: "Full Programme Streak", icon: "🏆", desc: "Train at least once a week for all 12 weeks.", check: (c) => c.streaks.longest >= 12 },
  { id: "level_10", label: "Level 10", icon: "🚀", desc: "Reach Level 10.", check: (c) => 1 + Math.floor(c.totalWorkouts / 4) >= 10 },
];

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
    unlockedAchievements: row.unlocked_achievements || [],
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
    unlocked_achievements: data.unlockedAchievements,
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

// A brand-new account with untouched storage adopts any free-trial
// progress sitting in the guest bucket on this device/browser, so
// "sign up to save your avatar" is actually true rather than a reset.
function migrateGuestProgress(userId) {
  if (!userId) return loadLocal(userId);
  const own = loadLocal(userId);
  const isUntouched = own.totalWorkouts === 0 && own.loggedSessions.length === 0;
  if (!isUntouched) return own;
  const guest = loadLocal(null);
  if (guest.totalWorkouts === 0) return own;
  const migrated = { ...guest, updatedAt: new Date().toISOString() };
  saveLocal(userId, migrated);
  try { localStorage.removeItem(storageKey(null)); } catch {}
  return migrated;
}

export function useAvatarState(session) {
  const userId = session?.user?.id;
  const token = session?.token;
  const [data, setData] = useState(() => migrateGuestProgress(userId));
  const [pendingLevelUp, setPendingLevelUp] = useState(null);
  const syncTimer = useRef(null);

  // Initial load for this user + reconcile against the cloud copy (the
  // more recently updated of the two wins).
  useEffect(() => {
    const local = migrateGuestProgress(userId);
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
      const loggedSessions = [...prev.loggedSessions, sessionId];
      const streaks = computeStreaks(loggedSessions);
      const newlyUnlocked = ACHIEVEMENTS
        .filter((a) => !prev.unlockedAchievements.includes(a.id) && a.check({ stats, totalWorkouts, loggedSessions, streaks }))
        .map((a) => a.id);

      const leveledUp = levelFor(totalWorkouts) > levelFor(prev.totalWorkouts);
      if (leveledUp) {
        playLevelUpSound();
        triggerHaptic();
        setPendingLevelUp(levelFor(totalWorkouts));
      } else if (newlyUnlocked.length > 0) {
        playAchievementSound();
        triggerHaptic();
      }

      return {
        ...prev, stats, lastTrained, totalWorkouts, loggedSessions, updatedAt: today,
        unlockedAchievements: [...prev.unlockedAchievements, ...newlyUnlocked],
      };
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

  const streaks = computeStreaks(data.loggedSessions);
  const achievements = ACHIEVEMENTS.map((a) => ({
    id: a.id, label: a.label, icon: a.icon, desc: a.desc,
    unlocked: data.unlockedAchievements.includes(a.id),
  }));

  return {
    stats,
    rawStats: data.stats,
    lastTrained: data.lastTrained,
    totalWorkouts: data.totalWorkouts,
    history: data.history,
    streaks,
    achievements,
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
