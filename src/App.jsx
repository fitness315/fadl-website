import { useState, useEffect } from "react";
import { useWorkoutLog } from "./useWorkoutLog";
import { AvatarPanel } from "./Avatar";

// ── CONFIG ────────────────────────────────────────────────────
const SUPABASE_URL  = "https://nrtovlmelrwvezwhkdoh.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydG92bG1lbHJ3dmV6d2hrZG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDU5NzEsImV4cCI6MjA5MzkyMTk3MX0.NpqNxYAdNZbI0L4EhluXnyAmUjlP5YECUZaK-2MQGvQ";
const STRIPE_KEY    = "pk_live_51TVHmMHDFLyj04Bgdv5g36QLUXQqYcEdZoNfQpFjoSfXtH0U4b3VemVnK4Q1gXcz8zKcg8PqfrQKO2klURiGgoek00SyLbEmNT";
const STRIPE_PRICE  = "price_1TVHxvHDFLyj04Bg8iHxhgW1";

// ── SUPABASE ──────────────────────────────────────────────────
const H = (token) => ({
  "apikey": SUPABASE_ANON,
  "Authorization": `Bearer ${token || SUPABASE_ANON}`,
  "Content-Type": "application/json",
});

const supa = {
  async signUp(email, password, name) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST", headers: H(),
      body: JSON.stringify({ email, password, data: { name } }),
    });
    return r.json();
  },
  async signIn(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: H(),
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  },
  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST", headers: H(token),
    });
  },
  async getUser(token) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: H(token) });
    return r.json();
  },
  async getPaid(userId, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/purchases?user_id=eq.${userId}&select=*`, { headers: H(token) });
    const d = await r.json();
    return Array.isArray(d) && d.length > 0;
  },
  async setPaid(userId, token) {
    await fetch(`${SUPABASE_URL}/rest/v1/purchases`, {
      method: "POST",
      headers: { ...H(token), "Prefer": "return=minimal" },
      body: JSON.stringify({ user_id: userId, product: "12_week_plan", purchased_at: new Date().toISOString() }),
    });
  },
};

// ── STRIPE CHECKOUT ───────────────────────────────────────────
async function redirectToStripe(userEmail) {
  // Load Stripe.js
  if (!window.Stripe) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://js.stripe.com/v3/";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const stripe = window.Stripe(STRIPE_KEY);
  await stripe.redirectToCheckout({
    lineItems: [{ price: STRIPE_PRICE, quantity: 1 }],
    mode: "payment",
    customerEmail: userEmail,
    successUrl: window.location.href + "?payment=success",
    cancelUrl: window.location.href + "?payment=cancelled",
  });
}

// ── BRAND ─────────────────────────────────────────────────────
const BG = "#080808", AC = "#F0FF00", TX = "#fff", MU = "#666", CA = "#111", BO = "#1e1e1e", B2 = "#2a2a2a";

function FInput({ label, type = "text", value, onChange, placeholder, error }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, color: MU, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{ width: "100%", padding: "14px 16px", background: "#161616", color: TX, border: `1px solid ${error ? "#ff4444" : f ? AC : B2}`, borderRadius: 4, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
      {error && <div style={{ fontSize: 12, color: "#ff4444", marginTop: 6 }}>{error}</div>}
    </div>
  );
}

function Logo() {
  return (
    <div style={{ fontFamily: "Arial Black, Arial", fontSize: 22, fontWeight: 900, letterSpacing: "0.04em" }}>
      <span style={{ color: AC }}>#</span><span style={{ color: TX }}>FADL</span>
    </div>
  );
}

function Btn({ children, onClick, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: "100%", padding: "16px", background: AC, color: BG, fontSize: 16, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", border: "none", borderRadius: 4, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: disabled ? 0.6 : 1, ...style }}>
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }) {
  return (
    <button onClick={onClick}
      style={{ width: "100%", padding: "16px", background: "transparent", color: TX, fontSize: 15, fontWeight: 700, border: `1px solid ${B2}`, borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>
      {children}
    </button>
  );
}

// ── WORKOUT DATA ──────────────────────────────────────────────
const phases = [
  {
    phase: "PHASE 01", title: "Foundation", weeks: "Weeks 1–4", sets: 3, rpe: "6–7/10",
    desc: "Master the movements. Build the habit. Focus on perfect form over maximum weight. Add small amounts of weight each week.",
    days: [
      { label: "DAY A", focus: "Chest · Shoulders · Triceps", exercises: [
        { name: "Barbell Bench Press", reps: "6–8", rest: "90s", tip: "Full range of motion. Bar to mid chest." },
        { name: "Incline DB Press", reps: "8–10", rest: "75s", tip: "15–30° angle only. Not 45°." },
        { name: "Cable Fly", reps: "12–15", rest: "60s", tip: "Squeeze hard at the top." },
        { name: "Overhead Press", reps: "8–10", rest: "90s", tip: "Brace core. Rib cage down." },
        { name: "Lateral Raises", reps: "12–15", rest: "60s", tip: "Lead with elbows not hands." },
        { name: "Tricep Pushdown", reps: "12–15", rest: "60s", tip: "Full extension every rep." },
      ]},
      { label: "DAY B", focus: "Back · Biceps · Rear Delts", exercises: [
        { name: "Deadlift", reps: "4–6", rest: "120s", tip: "Hip hinge. Bar stays close to body." },
        { name: "Barbell Row", reps: "8–10", rest: "90s", tip: "Pull to lower chest. Chest up." },
        { name: "Lat Pulldown", reps: "10–12", rest: "75s", tip: "Pull elbows down. Think chest to bar." },
        { name: "Seated Cable Row", reps: "10–12", rest: "75s", tip: "Full stretch at the front." },
        { name: "Face Pulls", reps: "15–20", rest: "45s", tip: "Light weight. High reps. Always." },
        { name: "Barbell Curl", reps: "10–12", rest: "60s", tip: "No swinging. Controlled tempo." },
      ]},
      { label: "DAY C", focus: "Legs · Glutes · Core", exercises: [
        { name: "Barbell Squat", reps: "6–8", rest: "120s", tip: "Depth below parallel. Drive through heels." },
        { name: "Romanian Deadlift", reps: "8–10", rest: "90s", tip: "3 second descent. Feel the stretch." },
        { name: "Leg Press", reps: "10–12", rest: "90s", tip: "Full range. Knees tracking out." },
        { name: "Leg Curl", reps: "12–15", rest: "60s", tip: "Slow on the way up." },
        { name: "Calf Raise", reps: "15–20", rest: "45s", tip: "Full stretch at the bottom." },
        { name: "Cable Crunch", reps: "12–15", rest: "45s", tip: "Exhale hard at the bottom." },
      ]},
      { label: "DAY D", focus: "Full Body · Weak Points", exercises: [
        { name: "Pull Ups", reps: "6–10", rest: "90s", tip: "Full hang to chin over bar." },
        { name: "DB Shoulder Press", reps: "10–12", rest: "75s", tip: "Seated. Controlled throughout." },
        { name: "Bulgarian Split Squat", reps: "8–10 each", rest: "90s", tip: "Rear foot elevated. Knee off floor." },
        { name: "DB Incline Row", reps: "12–15", rest: "60s", tip: "Chest on bench. Full stretch." },
        { name: "Leg Extension", reps: "15–20", rest: "45s", tip: "Squeeze hard at the top." },
        { name: "Ab Wheel Rollout", reps: "8–12", rest: "45s", tip: "Keep hips low. Don't collapse." },
      ]},
    ],
  },
  {
    phase: "PHASE 02", title: "Build", weeks: "Weeks 5–8", sets: 4, rpe: "7–8/10",
    desc: "Increase to 4 sets per exercise. You should now be confident with movements. Push harder. Add weight weekly without compromising form.",
    days: [
      { label: "DAY A", focus: "Chest · Shoulders · Triceps", exercises: [
        { name: "Barbell Bench Press", reps: "6–8", rest: "90s", tip: "Push the ceiling away. Leg drive." },
        { name: "Incline DB Press", reps: "8–10", rest: "75s", tip: "Heavier than phase 1. Controlled." },
        { name: "Cable Fly", reps: "12–15", rest: "60s", tip: "Pause 1 second at peak contraction." },
        { name: "Overhead Press", reps: "8–10", rest: "90s", tip: "Press explosively. Lower controlled." },
        { name: "Cable Lateral Raise", reps: "12–15", rest: "60s", tip: "Constant tension beats heavy weight." },
        { name: "Skull Crushers", reps: "10–12", rest: "60s", tip: "Keep elbows in. Lower to forehead." },
      ]},
      { label: "DAY B", focus: "Back · Biceps · Rear Delts", exercises: [
        { name: "Deadlift", reps: "4–6", rest: "120s", tip: "Heavier than phase 1. Brace hard." },
        { name: "Weighted Pull Up", reps: "6–8", rest: "90s", tip: "Add a plate or use a band." },
        { name: "Lat Pulldown", reps: "10–12", rest: "75s", tip: "Add weight. Same form." },
        { name: "Seated Cable Row", reps: "10–12", rest: "75s", tip: "Retract scapula fully." },
        { name: "Face Pulls", reps: "15–20", rest: "45s", tip: "External rotation at the end." },
        { name: "Incline DB Curl", reps: "10–12", rest: "60s", tip: "Full stretch at the bottom." },
      ]},
      { label: "DAY C", focus: "Legs · Glutes · Core", exercises: [
        { name: "Barbell Squat", reps: "6–8", rest: "120s", tip: "Heavier. Brace and breathe." },
        { name: "Romanian Deadlift", reps: "8–10", rest: "90s", tip: "Feel every inch of the stretch." },
        { name: "Hack Squat", reps: "10–12", rest: "90s", tip: "Feet high for more glute activation." },
        { name: "Leg Curl", reps: "12–15", rest: "60s", tip: "Squeeze glutes at top." },
        { name: "Calf Raise", reps: "15–20", rest: "45s", tip: "Add weight. Still full stretch." },
        { name: "Hanging Leg Raise", reps: "12–15", rest: "45s", tip: "Control the descent." },
      ]},
      { label: "DAY D", focus: "Full Body · Weak Points", exercises: [
        { name: "Weighted Pull Up", reps: "6–8", rest: "90s", tip: "Small plate. Big difference." },
        { name: "Arnold Press", reps: "10–12", rest: "75s", tip: "Rotate fully on the way up." },
        { name: "Bulgarian Split Squat", reps: "8–10 each", rest: "90s", tip: "Add dumbbells this phase." },
        { name: "Chest Supported Row", reps: "12–15", rest: "60s", tip: "Remove momentum completely." },
        { name: "Leg Extension", reps: "15–20", rest: "45s", tip: "Drop set on last set." },
        { name: "Ab Wheel Rollout", reps: "10–15", rest: "45s", tip: "Further range than phase 1." },
      ]},
    ],
  },
  {
    phase: "PHASE 03", title: "Peak", weeks: "Weeks 9–12", sets: 5, rpe: "8–9/10",
    desc: "Maximum intensity. Push close to failure on final sets. This is where the real transformation happens. Do not skip sessions.",
    days: [
      { label: "DAY A", focus: "Chest · Shoulders · Triceps", exercises: [
        { name: "Barbell Bench Press", reps: "4–6", rest: "120s", tip: "Last set — push to near failure." },
        { name: "Incline DB Press", reps: "6–8", rest: "90s", tip: "Heaviest weight of the programme." },
        { name: "Cable Fly", reps: "10–12", rest: "60s", tip: "Drop set on final set." },
        { name: "Overhead Press", reps: "6–8", rest: "90s", tip: "Max effort. Spot if possible." },
        { name: "Cable Lateral Raise", reps: "15–20", rest: "45s", tip: "5 sets burns. Push through it." },
        { name: "Dip (weighted)", reps: "8–10", rest: "75s", tip: "Add weight. Lean forward for chest." },
      ]},
      { label: "DAY B", focus: "Back · Biceps · Rear Delts", exercises: [
        { name: "Deadlift", reps: "3–5", rest: "120s", tip: "This is your peak. New PR attempt." },
        { name: "Weighted Pull Up", reps: "4–6", rest: "90s", tip: "Heaviest weight of the programme." },
        { name: "Barbell Row", reps: "6–8", rest: "90s", tip: "Explosive up. Slow down." },
        { name: "Seated Cable Row", reps: "8–10", rest: "75s", tip: "Full contraction every rep." },
        { name: "Face Pulls", reps: "20–25", rest: "45s", tip: "Protect the shoulders at all costs." },
        { name: "Hammer Curl", reps: "10–12", rest: "60s", tip: "Superset with barbell curl if possible." },
      ]},
      { label: "DAY C", focus: "Legs · Glutes · Core", exercises: [
        { name: "Barbell Squat", reps: "4–6", rest: "120s", tip: "PR attempt this phase. Go for it." },
        { name: "Romanian Deadlift", reps: "6–8", rest: "90s", tip: "Heaviest of the programme." },
        { name: "Hack Squat", reps: "8–10", rest: "90s", tip: "5 sets is brutal. Embrace it." },
        { name: "Leg Curl", reps: "10–12", rest: "60s", tip: "Drop set on final set." },
        { name: "Seated Calf Raise", reps: "15–20", rest: "45s", tip: "Slow and controlled. Full range." },
        { name: "Cable Crunch", reps: "15–20", rest: "45s", tip: "5 sets. Abs on fire." },
      ]},
      { label: "DAY D", focus: "Full Body · Weak Points", exercises: [
        { name: "Weighted Pull Up", reps: "4–6", rest: "90s", tip: "Heaviest of the programme." },
        { name: "Overhead Press", reps: "6–8", rest: "90s", tip: "PR attempt. Push hard." },
        { name: "Front Squat", reps: "6–8", rest: "90s", tip: "Core must be locked in." },
        { name: "Pendlay Row", reps: "6–8", rest: "90s", tip: "From the floor every rep." },
        { name: "Nordic Curl", reps: "6–8", rest: "90s", tip: "Hardest hamstring exercise. Worth it." },
        { name: "L-Sit Hold", reps: "20–30s", rest: "60s", tip: "5 rounds. Core of steel." },
      ]},
    ],
  },
];

// ── SCREENS ───────────────────────────────────────────────────
function Landing({ onSignup, onLogin }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: `1px solid ${BO}`, position: "sticky", top: 0, background: "rgba(8,8,8,0.97)", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <Logo />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onLogin} style={{ padding: "10px 20px", background: "transparent", color: TX, border: `1px solid ${B2}`, borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>Log In</button>
          <button onClick={onSignup} style={{ padding: "10px 20px", background: AC, color: BG, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 900, fontFamily: "inherit" }}>Get Started</button>
        </div>
      </nav>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" }}>
        <svg width="110" height="44" viewBox="0 0 110 44" style={{ marginBottom: 28 }}>
          <rect x="32" y="18" width="46" height="8" rx="3" fill={AC}/>
          <rect x="16" y="10" width="16" height="24" rx="4" fill={AC}/>
          <rect x="78" y="10" width="16" height="24" rx="4" fill={AC}/>
          <rect x="6" y="15" width="10" height="14" rx="3" fill={AC}/>
          <rect x="94" y="15" width="10" height="14" rx="3" fill={AC}/>
          <rect x="17.5" y="11.5" width="13" height="21" rx="3" fill={BG} opacity="0.45"/>
          <rect x="79.5" y="11.5" width="13" height="21" rx="3" fill={BG} opacity="0.45"/>
        </svg>

        <div style={{ fontSize: 11, fontWeight: 700, color: AC, letterSpacing: "0.25em", marginBottom: 16 }}>12 WEEK WORKOUT PLAN</div>
        <h1 style={{ fontFamily: "Arial Black, Arial", fontSize: "clamp(52px, 14vw, 100px)", fontWeight: 900, lineHeight: 0.88, letterSpacing: "-0.02em", marginBottom: 24 }}>
          BUILD<br /><span style={{ color: AC }}>THE BODY.</span>
        </h1>
        <p style={{ fontSize: 16, color: MU, maxWidth: 480, lineHeight: 1.75, marginBottom: 40 }}>
          A complete 12 week progressive programme. 3 phases. 4 training days per week. Full nutrition guide included. No fluff. Just results.
        </p>

        <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn onClick={onSignup}>Get Started — £9.99</Btn>
          <GhostBtn onClick={onLogin}>Already have an account? Log in</GhostBtn>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 40 }}>
          {["12 Weeks", "3 Phases", "4 Days/Week", "Nutrition Guide", "Progress Tracker", "Grows With You", "Lifetime Access"].map(f => (
            <div key={f} style={{ padding: "6px 14px", background: CA, border: `1px solid ${B2}`, borderRadius: 100, fontSize: 12, color: MU }}>✓ {f}</div>
          ))}
        </div>
      </div>

      <div style={{ background: AC, padding: "16px 24px", textAlign: "center" }}>
        <span style={{ fontFamily: "Arial Black, Arial", fontSize: 14, fontWeight: 900, color: BG, letterSpacing: "0.06em" }}>
          ONE PAYMENT · £9.99 · LIFETIME ACCESS · NO SUBSCRIPTIONS
        </span>
      </div>
    </div>
  );
}

function AuthForm({ mode, onSuccess, onSwitch, onBack }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const isSignup = mode === "signup";

  const submit = async () => {
    const e = {};
    if (isSignup && !name.trim()) e.name = "Name is required";
    if (!email.includes("@")) e.email = "Enter a valid email";
    if (pass.length < 6) e.password = "Password must be at least 6 characters";
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setErrors({});

    try {
      if (isSignup) {
        const res = await supa.signUp(email, pass, name);
        if (res.error) { setErrors({ email: res.error.message }); setLoading(false); return; }
        if (res.access_token) {
          const paid = await supa.getPaid(res.user.id, res.access_token);
          onSuccess({ token: res.access_token, user: res.user, name, paid });
        } else {
          setMsg("Check your email to confirm your account, then log in.");
        }
      } else {
        const res = await supa.signIn(email, pass);
        if (res.error) { setErrors({ email: res.error.message }); setLoading(false); return; }
        const u = await supa.getUser(res.access_token);
        const paid = await supa.getPaid(u.id, res.access_token);
        onSuccess({ token: res.access_token, user: u, name: u.user_metadata?.name || email, paid });
      }
    } catch (err) {
      setErrors({ email: "Something went wrong. Please try again." });
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: `1px solid ${BO}` }}>
        <Logo />
        <button onClick={onBack} style={{ background: "none", border: "none", color: MU, fontSize: 13, cursor: "pointer" }}>← Back</button>
      </nav>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {isSignup && <div style={{ fontSize: 11, fontWeight: 700, color: AC, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>Step 1 of 2</div>}
          <h2 style={{ fontFamily: "Arial Black, Arial", fontSize: 36, fontWeight: 900, marginBottom: 6 }}>{isSignup ? "Create Account" : "Welcome Back"}</h2>
          <p style={{ fontSize: 14, color: MU, marginBottom: 28, lineHeight: 1.6 }}>{isSignup ? "Create your account then complete payment to unlock the full plan." : "Log in to access your workout plan."}</p>

          {isSignup && (
            <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
              {[["1", "Account", true], ["2", "Payment", false]].map(([n, l, active]) => (
                <div key={n} style={{ flex: 1, padding: "10px", background: active ? AC : CA, border: `1px solid ${active ? AC : B2}`, borderRadius: 4, textAlign: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: active ? BG : MU, letterSpacing: "0.08em" }}>{n}. {l}</div>
                </div>
              ))}
            </div>
          )}

          {msg
            ? <div style={{ padding: "16px", background: "#1a1a00", border: `1px solid ${AC}44`, borderRadius: 4, fontSize: 14, color: AC, lineHeight: 1.6 }}>{msg}</div>
            : <>
                {isSignup && <FInput label="Full Name" value={name} onChange={setName} placeholder="Your name" error={errors.name} />}
                <FInput label="Email Address" type="email" value={email} onChange={setEmail} placeholder="your@email.com" error={errors.email} />
                <FInput label="Password" type="password" value={pass} onChange={setPass} placeholder="Min. 6 characters" error={errors.password} />
                <Btn onClick={submit} disabled={loading}>{loading ? "Please wait..." : isSignup ? "Continue to Payment →" : "Log In →"}</Btn>
                <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: MU }}>
                  {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                  <span onClick={onSwitch} style={{ color: AC, cursor: "pointer", fontWeight: 700 }}>{isSignup ? "Log in" : "Sign up"}</span>
                </div>
              </>
          }
        </div>
      </div>
    </div>
  );
}

function PaymentScreen({ session, onPaid }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Check if returning from successful Stripe payment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      (async () => {
        await supa.setPaid(session.user.id, session.token);
        window.history.replaceState({}, "", window.location.pathname);
        onPaid();
      })();
    }
  }, []);

  const pay = async () => {
    setLoading(true); setErr("");
    try {
      await redirectToStripe(session.user.email);
    } catch (e) {
      setErr("Payment failed to load. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: `1px solid ${BO}` }}>
        <Logo />
        <div style={{ fontSize: 12, color: MU }}>Logged in as {session.user.email}</div>
      </nav>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: AC, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>Step 2 of 2</div>
          <h2 style={{ fontFamily: "Arial Black, Arial", fontSize: 36, fontWeight: 900, marginBottom: 6 }}>Complete Payment</h2>
          <p style={{ fontSize: 14, color: MU, marginBottom: 24, lineHeight: 1.6 }}>You'll be taken to Stripe's secure checkout. Your account will unlock immediately after payment.</p>

          <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
            {[["1", "Account ✓", false], ["2", "Payment", true]].map(([n, l, active]) => (
              <div key={n} style={{ flex: 1, padding: "10px", background: active ? AC : "#1a3300", border: `1px solid ${active ? AC : "#2a5500"}`, borderRadius: 4, textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: active ? BG : "#7fff00", letterSpacing: "0.08em" }}>{n}. {l}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: "20px", background: CA, borderRadius: 6, border: `1px solid ${B2}`, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>12 Week Workout Plan</div>
                <div style={{ fontSize: 12, color: MU, marginTop: 2 }}>Lifetime access · 3 phases · Full nutrition guide</div>
              </div>
              <div style={{ fontFamily: "Arial Black, Arial", fontSize: 26, fontWeight: 900, color: AC }}>£9.99</div>
            </div>
            <div style={{ borderTop: `1px solid ${B2}`, paddingTop: 12 }}>
              {["Full 12 week progressive programme", "4 training days per week", "Nutrition & supplement guide", "Progress tracker", "Avatar that grows as you train", "Lifetime access — no subscription"].map(f => (
                <div key={f} style={{ fontSize: 13, color: MU, marginBottom: 4 }}>✓ {f}</div>
              ))}
            </div>
          </div>

          {err && <div style={{ fontSize: 13, color: "#ff4444", marginBottom: 12 }}>{err}</div>}

          <Btn onClick={pay} disabled={loading}>{loading ? "Redirecting to Checkout..." : "Pay £9.99 Securely with Stripe →"}</Btn>

          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16 }}>
            {["🔒 SSL Encrypted", "✓ Powered by Stripe", "✓ No subscription"].map(t => (
              <div key={t} style={{ fontSize: 11, color: MU }}>{t}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ session, name, onLogout }) {
  const [phase, setPhase] = useState(0);
  const [day, setDay]   = useState(0);
  const [tab, setTab]   = useState("plan");
  const p = phases[phase];
  const d = p.days[day];

  const { stats, totalWorkouts, isLogged, logWorkout } = useWorkoutLog(session?.user?.id);
  const sessionId = `${new Date().toISOString().slice(0, 10)}_P${phase}_${d.label}`;
  const done = isLogged(sessionId);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${BO}`, position: "sticky", top: 0, background: "rgba(8,8,8,0.97)", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <Logo />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 12, color: MU }}>Hi, {name?.split(" ")[0]}</div>
          <button onClick={onLogout} style={{ background: "none", border: `1px solid ${B2}`, color: MU, fontSize: 11, padding: "6px 14px", borderRadius: 4, cursor: "pointer", fontWeight: 700, letterSpacing: "0.1em" }}>LOG OUT</button>
        </div>
      </nav>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BO}`, padding: "0 20px", overflowX: "auto" }}>
        {[["plan", "💪 Workout Plan"], ["avatar", "🧍 Avatar"], ["nutrition", "🥗 Nutrition"], ["tracker", "📈 Progress"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: "14px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", color: tab === key ? AC : MU, borderBottom: `2px solid ${tab === key ? AC : "transparent"}`, marginBottom: -1, whiteSpace: "nowrap", fontFamily: "inherit" }}>{label}</button>
        ))}
      </div>

      <div style={{ flex: 1, padding: "24px 20px", maxWidth: 800, margin: "0 auto", width: "100%" }}>

        {tab === "plan" && (
          <>
            {/* Phase selector */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: MU, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>Select Phase</div>
              <div style={{ display: "flex", gap: 8 }}>
                {phases.map((ph, i) => (
                  <button key={i} onClick={() => { setPhase(i); setDay(0); }} style={{ flex: 1, padding: "12px 6px", borderRadius: 4, cursor: "pointer", background: phase === i ? AC : CA, color: phase === i ? BG : MU, border: `1px solid ${phase === i ? AC : B2}`, fontSize: 11, fontWeight: 900, textAlign: "center", fontFamily: "inherit" }}>
                    <div>{ph.phase}</div>
                    <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>{ph.weeks}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Phase info */}
            <div style={{ padding: "18px", background: CA, borderRadius: 6, border: `1px solid ${B2}`, borderLeft: `3px solid ${AC}`, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontFamily: "Arial Black, Arial", fontSize: 20, fontWeight: 900 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: AC, letterSpacing: "0.1em", marginTop: 2 }}>{p.weeks}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[`${p.sets} SETS`, `RPE ${p.rpe}`].map(badge => (
                    <div key={badge} style={{ padding: "6px 12px", background: "#1a1a00", border: `1px solid ${AC}44`, borderRadius: 4, fontSize: 11, color: AC, fontWeight: 700 }}>{badge}</div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 13, color: MU, lineHeight: 1.6 }}>{p.desc}</div>
            </div>

            {/* Day selector */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {p.days.map((dd, i) => (
                <button key={i} onClick={() => setDay(i)} style={{ flex: 1, padding: "10px 4px", borderRadius: 4, cursor: "pointer", background: day === i ? TX : CA, color: day === i ? BG : MU, border: `1px solid ${day === i ? TX : B2}`, fontSize: 11, fontWeight: 900, fontFamily: "inherit" }}>{dd.label}</button>
              ))}
            </div>

            {/* Day header */}
            <div style={{ padding: "16px", background: CA, borderRadius: "6px 6px 0 0", border: `1px solid ${B2}`, borderBottom: "none", marginBottom: 0 }}>
              <div style={{ fontFamily: "Arial Black, Arial", fontSize: 18, fontWeight: 900 }}>{d.label}</div>
              <div style={{ fontSize: 12, color: AC, letterSpacing: "0.08em", fontWeight: 700, marginTop: 2 }}>{d.focus}</div>
            </div>

            {/* Exercise table header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 80px 55px", padding: "10px 16px", background: BG, borderLeft: `1px solid ${B2}`, borderRight: `1px solid ${B2}` }}>
              {["EXERCISE", "SETS", "REPS", "REST"].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: AC, letterSpacing: "0.15em" }}>{h}</div>
              ))}
            </div>

            {/* Exercises */}
            {d.exercises.map((ex, i) => (
              <div key={i} style={{ background: i % 2 === 0 ? CA : "#161616", borderLeft: `1px solid ${B2}`, borderRight: `1px solid ${B2}`, borderBottom: i === d.exercises.length - 1 ? `1px solid ${B2}` : `1px solid #222`, borderRadius: i === d.exercises.length - 1 ? "0 0 6px 6px" : 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 80px 55px", padding: "12px 16px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TX }}>{ex.name}</div>
                  <div style={{ fontSize: 14, color: AC, fontWeight: 700, textAlign: "center" }}>{p.sets}</div>
                  <div style={{ fontSize: 13, color: "#ccc", textAlign: "center" }}>{ex.reps}</div>
                  <div style={{ fontSize: 13, color: MU, textAlign: "center" }}>{ex.rest}</div>
                </div>
                <div style={{ padding: "0 16px 10px", fontSize: 12, color: "#555", fontStyle: "italic" }}>💡 {ex.tip}</div>
              </div>
            ))}

            <button
              onClick={() => logWorkout(d.label, sessionId)}
              disabled={done}
              style={{ width: "100%", marginTop: 16, padding: "16px", background: done ? "#1a3300" : AC, color: done ? "#7fff00" : BG, fontSize: 14, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", border: done ? "1px solid #2a5500" : "none", borderRadius: 4, cursor: done ? "default" : "pointer", fontFamily: "inherit" }}>
              {done ? "✓ Logged — Avatar Growing" : "Mark Workout Complete →"}
            </button>

            <div style={{ marginTop: 16, padding: "12px 16px", background: "#1a1a00", borderRadius: 4, border: `1px solid ${AC}33`, fontSize: 13, color: MU, lineHeight: 1.6 }}>
              <strong style={{ color: TX }}>Progressive overload:</strong> Add weight or reps to every exercise every single week. This is the only way to keep growing.
            </div>
          </>
        )}

        {tab === "avatar" && <AvatarPanel stats={stats} totalWorkouts={totalWorkouts} userId={session?.user?.id} />}

        {tab === "nutrition" && (
          <div>
            <h2 style={{ fontFamily: "Arial Black, Arial", fontSize: 28, fontWeight: 900, marginBottom: 6 }}>Nutrition Guide</h2>
            <p style={{ fontSize: 14, color: MU, marginBottom: 28, lineHeight: 1.6 }}>Your training is only as good as what you eat. These are the non-negotiables.</p>
            {[
              { title: "Daily Protein", value: "1g per lb of bodyweight", tip: "Chicken, eggs, whey, tuna, Greek yogurt, cottage cheese. Hit this every single day without fail." },
              { title: "Pre-Workout", value: "1–2 hours before training", tip: "Complex carbs + moderate protein + low fat. Oats with protein, chicken and rice, banana with peanut butter." },
              { title: "Post-Workout", value: "Within 30–60 mins", tip: "Fast protein + simple carbs. Whey shake + white rice or banana. Never skip this meal." },
              { title: "Calories", value: "TDEE + 200–300 to build", tip: "Calculate your TDEE online. Stay in a small surplus. Enough to build, not enough to get fat." },
              { title: "Water", value: "3–4 litres daily", tip: "Dehydration drops strength by up to 10%. Drink 500ml first thing every morning." },
              { title: "Sleep", value: "7–9 hours every night", tip: "Muscle is built during sleep. Non-negotiable. Poor sleep cancels good training." },
            ].map((item, i) => (
              <div key={i} style={{ padding: "18px", background: i % 2 === 0 ? CA : "#161616", borderRadius: 6, marginBottom: 8, borderLeft: `3px solid ${AC}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{item.title}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: AC, letterSpacing: "0.04em" }}>{item.value}</div>
                </div>
                <div style={{ fontSize: 13, color: MU, lineHeight: 1.6 }}>{item.tip}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "tracker" && (
          <div>
            <h2 style={{ fontFamily: "Arial Black, Arial", fontSize: 28, fontWeight: 900, marginBottom: 6 }}>Progress Tracker</h2>
            <p style={{ fontSize: 14, color: MU, marginBottom: 28 }}>Measure every 4 weeks. Progress that isn't tracked isn't progress.</p>
            {[
              { label: "Weight (kg)", emoji: "⚖️" },
              { label: "Chest (cm)", emoji: "📏" },
              { label: "Waist (cm)", emoji: "📏" },
              { label: "Bench Press 1RM (kg)", emoji: "🏋️" },
              { label: "Squat 1RM (kg)", emoji: "🏋️" },
              { label: "Deadlift 1RM (kg)", emoji: "🏋️" },
              { label: "Pull Ups (max reps)", emoji: "💪" },
            ].map((metric, i) => (
              <div key={i} style={{ padding: "16px", background: CA, borderRadius: 6, marginBottom: 10, border: `1px solid ${B2}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{metric.emoji} {metric.label}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {["Week 1", "Week 4", "Week 8", "Week 12"].map(w => (
                    <div key={w}>
                      <div style={{ fontSize: 10, color: MU, letterSpacing: "0.1em", marginBottom: 4 }}>{w.toUpperCase()}</div>
                      <input type="number" placeholder="—" style={{ width: "100%", padding: "10px 12px", background: "#161616", color: TX, border: `1px solid ${B2}`, borderRadius: 4, fontSize: 14, textAlign: "center", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [session, setSession] = useState(null);
  const [name, setName] = useState("");

  // Restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("fadl_session");
    if (saved) {
      try {
        const s = JSON.parse(saved);
        setSession(s);
        setName(s.name || "");
        setScreen(s.paid ? "dashboard" : "payment");
      } catch {}
    }
    // Check for Stripe redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "cancelled") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleAuth = (s) => {
    const full = { ...s };
    setSession(full);
    setName(s.name || s.user?.user_metadata?.name || "");
    localStorage.setItem("fadl_session", JSON.stringify(full));
    setScreen(s.paid ? "dashboard" : "payment");
  };

  const handlePaid = () => {
    const updated = { ...session, paid: true };
    setSession(updated);
    localStorage.setItem("fadl_session", JSON.stringify(updated));
    setScreen("dashboard");
  };

  const handleLogout = async () => {
    if (session?.token) await supa.signOut(session.token);
    localStorage.removeItem("fadl_session");
    setSession(null);
    setScreen("landing");
  };

  return (
    <div style={{ background: BG, color: TX, minHeight: "100vh", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } input:focus { border-color: #F0FF00 !important; } button { transition: opacity 0.15s, transform 0.15s; } button:active { opacity: 0.85; transform: scale(0.98); } ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }`}</style>

      {screen === "landing"   && <Landing onSignup={() => setScreen("signup")} onLogin={() => setScreen("login")} />}
      {screen === "signup"    && <AuthForm mode="signup" onSuccess={handleAuth} onSwitch={() => setScreen("login")} onBack={() => setScreen("landing")} />}
      {screen === "login"     && <AuthForm mode="login"  onSuccess={handleAuth} onSwitch={() => setScreen("signup")} onBack={() => setScreen("landing")} />}
      {screen === "payment"   && session && <PaymentScreen session={session} onPaid={handlePaid} />}
      {screen === "dashboard" && session && <Dashboard session={session} name={name} onLogout={handleLogout} />}
    </div>
  );
}
