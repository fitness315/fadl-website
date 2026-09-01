import Avatar3D from "./Avatar3D";
import { useAvatarPrefs, SKIN_TONES } from "./useAvatarPrefs";

const BG = "#080808", AC = "#F0FF00", CA = "#111", MU = "#666", B2 = "#2a2a2a";

// Workouts of a given muscle group needed to hit full growth.
const CAP = 20;
const norm = (v) => Math.min(v, CAP) / CAP;

function StatBar({ label, value }) {
  const pct = norm(value) * 100;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: MU, letterSpacing: "0.1em" }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: AC }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 8, background: "#161616", borderRadius: 4, overflow: "hidden", border: `1px solid ${B2}` }}>
        <div style={{ width: `${pct}%`, height: "100%", background: AC, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

function SkinSwatch({ tone, active, onClick }) {
  return (
    <button
      onClick={onClick}
      title={tone.name}
      style={{
        width: 30, height: 30, borderRadius: "50%", background: tone.hex, cursor: "pointer",
        border: active ? `3px solid ${AC}` : `2px solid ${B2}`,
        boxShadow: active ? `0 0 0 2px ${BG}` : "none", padding: 0,
      }}
    />
  );
}

function BodyTypeButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "10px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 900,
        letterSpacing: "0.04em", fontFamily: "inherit",
        background: active ? AC : CA, color: active ? BG : MU, border: `1px solid ${active ? AC : B2}`,
      }}
    >
      {label}
    </button>
  );
}

export function AvatarPanel({ stats, totalWorkouts, userId }) {
  const level = 1 + Math.floor(totalWorkouts / 4);
  const xp = totalWorkouts % 4;
  const { skinTone, bodyType, setSkinTone, setBodyType } = useAvatarPrefs(userId);

  return (
    <div>
      <h2 style={{ fontFamily: "Arial Black, Arial", fontSize: 28, fontWeight: 900, marginBottom: 6 }}>Your Avatar</h2>
      <p style={{ fontSize: 14, color: MU, marginBottom: 24, lineHeight: 1.6 }}>
        Every workout you log grows the muscle group you trained. Miss a body part and it lags behind — balance it out.
      </p>

      <div style={{ padding: "18px", background: CA, borderRadius: 6, border: `1px solid ${B2}`, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MU, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>Skin Tone</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          {SKIN_TONES.map((tone) => (
            <SkinSwatch key={tone.hex} tone={tone} active={skinTone === tone.hex} onClick={() => setSkinTone(tone.hex)} />
          ))}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: MU, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>Body Type</div>
        <div style={{ display: "flex", gap: 8 }}>
          <BodyTypeButton label="🧍 STANDING" active={bodyType === "standing"} onClick={() => setBodyType("standing")} />
          <BodyTypeButton label="🦽 WHEELCHAIR" active={bodyType === "wheelchair"} onClick={() => setBodyType("wheelchair")} />
        </div>
      </div>

      <div style={{ padding: "20px", background: CA, borderRadius: 6, border: `1px solid ${B2}`, marginBottom: 24, textAlign: "center" }}>
        <Avatar3D stats={stats} skinTone={skinTone} bodyType={bodyType} />
        <div style={{ fontSize: 11, color: MU, marginTop: 10 }}>🖱️ Drag to spin · Scroll to zoom</div>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ padding: "6px 14px", background: "#1a1a00", border: `1px solid ${AC}44`, borderRadius: 4, fontSize: 12, color: AC, fontWeight: 900 }}>LEVEL {level}</div>
          <div style={{ padding: "6px 14px", background: BG, border: `1px solid ${B2}`, borderRadius: 4, fontSize: 12, color: MU, fontWeight: 700 }}>{totalWorkouts} WORKOUTS LOGGED</div>
        </div>
        <div style={{ marginTop: 10, height: 6, background: "#161616", borderRadius: 3, overflow: "hidden", maxWidth: 200, marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ width: `${(xp / 4) * 100}%`, height: "100%", background: AC, transition: "width 0.5s ease" }} />
        </div>
        <div style={{ fontSize: 10, color: MU, marginTop: 4 }}>{xp}/4 to Level {level + 1}</div>
      </div>

      <div style={{ padding: "18px", background: CA, borderRadius: 6, border: `1px solid ${B2}` }}>
        <StatBar label="CHEST" value={stats.chest} />
        <StatBar label="BACK" value={stats.back} />
        <StatBar label="SHOULDERS" value={stats.shoulders} />
        <StatBar label="ARMS" value={stats.arms} />
        <StatBar label="LEGS" value={stats.legs} />
        <StatBar label="CORE" value={stats.core} />
      </div>
    </div>
  );
}
