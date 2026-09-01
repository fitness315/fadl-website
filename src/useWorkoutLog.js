import { useState, useEffect, useCallback } from "react";

export const MUSCLES = ["chest", "back", "shoulders", "arms", "legs", "core"];

// How much each training day grows each muscle group when logged, based on
// that day's actual exercise focus in the workout plan.
export const DAY_MUSCLES = {
  "DAY A": { chest: 2, shoulders: 1.5, arms: 1 },
  "DAY B": { back: 2, arms: 1.5, shoulders: 0.5 },
  "DAY C": { legs: 2.5, core: 1 },
  "DAY D": { chest: 0.5, back: 0.5, shoulders: 0.5, arms: 0.5, legs: 1, core: 0.5 },
};

const emptyStats = () => MUSCLES.reduce((a, m) => ({ ...a, [m]: 0 }), {});

const storageKey = (userId) => `fadl_workoutlog_${userId || "guest"}`;

function load(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { stats: emptyStats(), totalWorkouts: 0, loggedSessions: [] };
}

export function useWorkoutLog(userId) {
  const [data, setData] = useState(() => load(userId));

  useEffect(() => { setData(load(userId)); }, [userId]);

  useEffect(() => {
    localStorage.setItem(storageKey(userId), JSON.stringify(data));
  }, [data, userId]);

  const isLogged = useCallback((sessionId) => data.loggedSessions.includes(sessionId), [data]);

  const logWorkout = useCallback((dayLabel, sessionId) => {
    setData((prev) => {
      if (prev.loggedSessions.includes(sessionId)) return prev;
      const gains = DAY_MUSCLES[dayLabel] || {};
      const stats = { ...prev.stats };
      MUSCLES.forEach((m) => { stats[m] = (stats[m] || 0) + (gains[m] || 0); });
      return {
        stats,
        totalWorkouts: prev.totalWorkouts + 1,
        loggedSessions: [...prev.loggedSessions, sessionId],
      };
    });
  }, []);

  return { stats: data.stats, totalWorkouts: data.totalWorkouts, isLogged, logWorkout };
}
