import { useState, useRef, useEffect } from "react";
import Avatar3D from "./Avatar3D";
import { SKIN_TONES, HAIR_COLORS, HAIR_STYLES } from "./useAvatarState";
import { captureThumbnail, downloadShareCard } from "./shareCard";

const BG = "#080808", AC = "#F0FF00", CA = "#111", MU = "#666", B2 = "#2a2a2a";

const HAIR_STYLE_LABELS = { none: "🥚 NONE", short: "💇 SHORT", mohawk: "🎸 MOHAWK", long: "💁 LONG" };

// Workouts of a given muscle group needed to hit full growth.
const CAP = 20;
const norm = (v) => Math.min(v, CAP) / CAP;

function StatBar({ label, value, raw }) {
  const pct = norm(value) * 100;
  const decaying = raw - value > 0.4;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: MU, letterSpacing: "0.1em" }}>
          {label}{decaying && <span style={{ color: "#ff8844", marginLeft: 6 }}>▼ decaying</span>}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: AC }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 8, background: "#161616", borderRadius: 4, overflow: "hidden", border: `1px solid ${B2}` }}>
        <div style={{ width: `${pct}%`, height: "100%", background: decaying ? "#cc8833" : AC, transition: "width 0.5s ease" }} />
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

function AchievementBadge({ a }) {
  return (
    <div
      title={a.desc}
      style={{
        padding: "12px 10px", borderRadius: 6, textAlign: "center",
        background: a.unlocked ? "#1a1a00" : "#161616",
        border: `1px solid ${a.unlocked ? AC + "55" : B2}`,
        opacity: a.unlocked ? 1 : 0.45,
      }}
    >
      <div style={{ fontSize: 26, marginBottom: 6, filter: a.unlocked ? "none" : "grayscale(1)" }}>{a.icon}</div>
      <div style={{ fontSize: 10, fontWeight: 900, color: a.unlocked ? AC : MU, letterSpacing: "0.03em", lineHeight: 1.3 }}>{a.label}</div>
    </div>
  );
}

function Pill({ label, active, onClick }) {
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

export function AvatarPanel({ avatar }) {
  const {
    stats, rawStats, totalWorkouts, history, streaks, achievements, pendingLevelUp, commitLevelUpSnapshot,
    skinTone, bodyType, hairStyle, hairColor, facialHair, glasses,
    setSkinTone, setBodyType, setHairStyle, setHairColor, setFacialHair, setGlasses,
  } = avatar;

  const level = 1 + Math.floor(totalWorkouts / 4);
  const xp = totalWorkouts % 4;
  const canvasRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  // Once a level-up bumps the growth stats, grab an "after" thumbnail for
  // history. If the Avatar tab (and its WebGL canvas) just mounted for
  // the first time, canvasRef can lag a beat behind - poll briefly
  // rather than risk a single fixed delay losing the race.
  useEffect(() => {
    if (pendingLevelUp == null) return;
    let cancelled = false;
    let attempts = 0;
    const tryCapture = () => {
      if (cancelled) return;
      if (canvasRef.current || attempts > 15) {
        commitLevelUpSnapshot(canvasRef.current ? captureThumbnail(canvasRef.current) : null);
      } else {
        attempts += 1;
        setTimeout(tryCapture, 150);
      }
    };
    const t = setTimeout(tryCapture, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [pendingLevelUp, commitLevelUpSnapshot]);

  const handleShare = async () => {
    if (!canvasRef.current || sharing) return;
    setSharing(true);
    try {
      await downloadShareCard(canvasRef.current, { level, totalWorkouts, stats });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: "Arial Black, Arial", fontSize: 28, fontWeight: 900, marginBottom: 6 }}>Your Avatar</h2>
      <p style={{ fontSize: 14, color: MU, marginBottom: 24, lineHeight: 1.6 }}>
        Every workout you log grows the muscle group you trained. Go quiet on a body part for a week and it starts to shrink back — balance it out.
      </p>

      <div style={{ padding: "18px", background: CA, borderRadius: 6, border: `1px solid ${B2}`, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MU, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>Skin Tone</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          {SKIN_TONES.map((tone) => (
            <SkinSwatch key={tone.hex} tone={tone} active={skinTone === tone.hex} onClick={() => setSkinTone(tone.hex)} />
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: MU, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>Hair Style</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {HAIR_STYLES.map((style) => (
            <Pill key={style} label={HAIR_STYLE_LABELS[style]} active={hairStyle === style} onClick={() => setHairStyle(style)} />
          ))}
        </div>

        {hairStyle !== "none" && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: MU, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>Hair Color</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
              {HAIR_COLORS.map((c) => (
                <SkinSwatch key={c.hex} tone={c} active={hairColor === c.hex} onClick={() => setHairColor(c.hex)} />
              ))}
            </div>
          </>
        )}

        <div style={{ fontSize: 11, fontWeight: 700, color: MU, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>Facial Hair</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <Pill label="NONE" active={facialHair === "none"} onClick={() => setFacialHair("none")} />
          <Pill label="🧔 BEARD" active={facialHair === "beard"} onClick={() => setFacialHair("beard")} />
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: MU, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>Glasses</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <Pill label="OFF" active={!glasses} onClick={() => setGlasses(false)} />
          <Pill label="👓 ON" active={glasses} onClick={() => setGlasses(true)} />
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: MU, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>Body Type</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Pill label="🧍 STANDING" active={bodyType === "standing"} onClick={() => setBodyType("standing")} />
          <Pill label="🦽 WHEELCHAIR" active={bodyType === "wheelchair"} onClick={() => setBodyType("wheelchair")} />
        </div>
      </div>

      <div style={{ padding: "20px", background: CA, borderRadius: 6, border: `1px solid ${B2}`, marginBottom: 24, textAlign: "center" }}>
        <Avatar3D
          stats={stats}
          skinTone={skinTone}
          bodyType={bodyType}
          hairStyle={hairStyle}
          hairColor={hairColor}
          facialHair={facialHair}
          glasses={glasses}
          onCanvasReady={(el) => { canvasRef.current = el; }}
        />
        <div style={{ fontSize: 11, color: MU, marginTop: 10 }}>🖱️ Drag to spin · Scroll to zoom</div>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ padding: "6px 14px", background: "#1a1a00", border: `1px solid ${AC}44`, borderRadius: 4, fontSize: 12, color: AC, fontWeight: 900 }}>LEVEL {level}</div>
          <div style={{ padding: "6px 14px", background: BG, border: `1px solid ${B2}`, borderRadius: 4, fontSize: 12, color: MU, fontWeight: 700 }}>{totalWorkouts} WORKOUTS LOGGED</div>
          {streaks.current > 0 && (
            <div style={{ padding: "6px 14px", background: "#331a00", border: "1px solid #ff884455", borderRadius: 4, fontSize: 12, color: "#ffaa55", fontWeight: 900 }}>🔥 {streaks.current} WEEK STREAK</div>
          )}
        </div>
        <div style={{ marginTop: 10, height: 6, background: "#161616", borderRadius: 3, overflow: "hidden", maxWidth: 200, marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ width: `${(xp / 4) * 100}%`, height: "100%", background: AC, transition: "width 0.5s ease" }} />
        </div>
        <div style={{ fontSize: 10, color: MU, marginTop: 4 }}>{xp}/4 to Level {level + 1}</div>

        <button
          onClick={handleShare}
          disabled={sharing}
          style={{ width: "100%", marginTop: 16, padding: "14px", background: "transparent", color: AC, fontSize: 13, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", border: `1px solid ${AC}55`, borderRadius: 4, cursor: sharing ? "default" : "pointer", fontFamily: "inherit" }}
        >
          {sharing ? "Building Card..." : "📲 Download Share Card"}
        </button>
      </div>

      <div style={{ padding: "18px", background: CA, borderRadius: 6, border: `1px solid ${B2}`, marginBottom: 16 }}>
        <StatBar label="CHEST" value={stats.chest} raw={rawStats.chest} />
        <StatBar label="BACK" value={stats.back} raw={rawStats.back} />
        <StatBar label="SHOULDERS" value={stats.shoulders} raw={rawStats.shoulders} />
        <StatBar label="ARMS" value={stats.arms} raw={rawStats.arms} />
        <StatBar label="LEGS" value={stats.legs} raw={rawStats.legs} />
        <StatBar label="CORE" value={stats.core} raw={rawStats.core} />
      </div>

      <div style={{ padding: "18px", background: CA, borderRadius: 6, border: `1px solid ${B2}`, marginBottom: history.length ? 16 : 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MU, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
          Achievements ({achievements.filter((a) => a.unlocked).length}/{achievements.length})
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 10 }}>
          {achievements.map((a) => <AchievementBadge key={a.id} a={a} />)}
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ padding: "18px", background: CA, borderRadius: 6, border: `1px solid ${B2}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MU, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Level-Up History</div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {[...history].reverse().map((h, i) => (
              <div key={i} style={{ flex: "0 0 auto", width: 100, textAlign: "center" }}>
                {h.thumbnail
                  ? <img src={h.thumbnail} alt={`Level ${h.level}`} style={{ width: 100, height: 100, borderRadius: 6, border: `1px solid ${B2}`, objectFit: "cover", display: "block" }} />
                  : <div style={{ width: 100, height: 100, borderRadius: 6, background: "#161616", border: `1px solid ${B2}` }} />}
                <div style={{ fontSize: 11, color: AC, fontWeight: 900, marginTop: 6 }}>LVL {h.level}</div>
                <div style={{ fontSize: 9, color: MU }}>{new Date(h.date).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
