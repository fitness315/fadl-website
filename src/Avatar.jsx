const BG = "#080808", AC = "#F0FF00", CA = "#111", MU = "#666", B2 = "#2a2a2a";

// Workouts of a given muscle group needed to hit full growth.
const CAP = 20;
const norm = (v) => Math.min(v, CAP) / CAP;

export function AvatarFigure({ stats }) {
  const chestG = norm(stats.chest), backG = norm(stats.back), shoulderG = norm(stats.shoulders),
        armG = norm(stats.arms), legG = norm(stats.legs), coreG = norm(stats.core);

  const torsoScale = 1 + 0.45 * ((chestG + backG) / 2);
  const torsoW = 50 * torsoScale, torsoX = 120 - torsoW / 2;

  const shoulderR = 20 * (1 + 0.5 * shoulderG);

  const armScale = 1 + 0.6 * armG;
  const armW = 22 * armScale;
  const armLX = 54 - (armW - 22) / 2, armRX = 186 - (armW - 22) / 2;

  const legScale = 1 + 0.55 * legG;
  const legW = 26 * legScale;
  const legLX = 105 - (legW - 26) / 2, legRX = 135 - (legW - 26) / 2;

  const t = { transition: "all 0.5s ease" };

  return (
    <svg viewBox="0 0 240 420" style={{ width: "100%", maxWidth: 260, display: "block", margin: "0 auto" }}>
      <rect style={t} x={legLX} y={260} width={legW} height={130} rx={legW / 2} fill={CA} stroke={B2} strokeWidth="2" />
      <rect style={t} x={legRX} y={260} width={legW} height={130} rx={legW / 2} fill={CA} stroke={B2} strokeWidth="2" />
      <ellipse cx={legLX + legW / 2} cy={392} rx={16} ry={8} fill={B2} />
      <ellipse cx={legRX + legW / 2} cy={392} rx={16} ry={8} fill={B2} />

      <rect x={90} y={235} width={60} height={32} rx={14} fill={CA} stroke={B2} strokeWidth="2" />

      <rect style={t} x={armLX} y={95} width={armW} height={140} rx={armW / 2} fill={CA} stroke={B2} strokeWidth="2" />
      <rect style={t} x={armRX} y={95} width={armW} height={140} rx={armW / 2} fill={CA} stroke={B2} strokeWidth="2" />
      <circle cx={armLX + armW / 2} cy={240} r={11} fill={B2} />
      <circle cx={armRX + armW / 2} cy={240} r={11} fill={B2} />

      <rect style={t} x={torsoX} y={100} width={torsoW} height={112} rx={16} fill={CA} stroke={AC} strokeWidth="2" />

      <g style={{ transition: "opacity 0.5s ease" }} opacity={coreG > 0.1 ? 0.35 + coreG * 0.5 : 0}>
        <line x1="120" y1="150" x2="120" y2="205" stroke={AC} strokeWidth="2" />
        {[160, 175, 190].map((y) => (
          <line key={y} x1={torsoX + 8} y1={y} x2={torsoX + torsoW - 8} y2={y} stroke={AC} strokeWidth="1.5" />
        ))}
      </g>

      <circle style={t} cx={76} cy={104} r={shoulderR} fill={CA} stroke={AC} strokeWidth="2" />
      <circle style={t} cx={164} cy={104} r={shoulderR} fill={CA} stroke={AC} strokeWidth="2" />

      <rect x={110} y={74} width={20} height={18} fill={CA} stroke={B2} strokeWidth="2" />
      <circle cx="120" cy="52" r="26" fill={CA} stroke={AC} strokeWidth="2" />
    </svg>
  );
}

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

export function AvatarPanel({ stats, totalWorkouts }) {
  const level = 1 + Math.floor(totalWorkouts / 4);
  const xp = totalWorkouts % 4;

  return (
    <div>
      <h2 style={{ fontFamily: "Arial Black, Arial", fontSize: 28, fontWeight: 900, marginBottom: 6 }}>Your Avatar</h2>
      <p style={{ fontSize: 14, color: MU, marginBottom: 24, lineHeight: 1.6 }}>
        Every workout you log grows the muscle group you trained. Miss a body part and it lags behind — balance it out.
      </p>

      <div style={{ padding: "20px", background: CA, borderRadius: 6, border: `1px solid ${B2}`, marginBottom: 24, textAlign: "center" }}>
        <AvatarFigure stats={stats} />
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
