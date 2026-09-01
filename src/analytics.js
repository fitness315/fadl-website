import { SUPABASE_URL, sbHeaders } from "./supabaseClient";

function getAnonId() {
  try {
    let id = localStorage.getItem("fadl_anon_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("fadl_anon_id", id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

// Fire-and-forget funnel logging. Never throws, never blocks the UI -
// if the analytics_events table isn't set up yet (see supabase/schema.sql)
// or the request fails, this just silently no-ops.
export function track(event, meta = {}) {
  try {
    fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
      method: "POST",
      headers: { ...sbHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify({
        event,
        session_id: getAnonId(),
        user_id: meta.userId || null,
        meta,
      }),
    }).catch(() => {});
  } catch {}
}
