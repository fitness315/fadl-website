const BG = "#080808", AC = "#F0FF00", MU = "#999999";
const CAP = 20;

const MUSCLES = [
  ["CHEST", "chest"], ["BACK", "back"], ["SHOULDERS", "shoulders"],
  ["ARMS", "arms"], ["LEGS", "legs"], ["CORE", "core"],
];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Small low-res snapshot stored in level-up history, kept cheap.
export function captureThumbnail(sourceCanvas, size = 160) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  const scale = Math.max(size / sourceCanvas.width, size / sourceCanvas.height);
  const dw = sourceCanvas.width * scale, dh = sourceCanvas.height * scale;
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(sourceCanvas, (size - dw) / 2, (size - dh) / 2, dw, dh);
  return c.toDataURL("image/jpeg", 0.72);
}

// Full 1080x1350 Instagram-ready share card, triggers a download.
export async function downloadShareCard(sourceCanvas, { level, totalWorkouts, stats }) {
  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = AC;
  ctx.fillRect(0, 0, W, 14);

  ctx.textBaseline = "top";
  ctx.font = "900 54px Arial";
  ctx.fillStyle = AC;
  ctx.fillText("#", 60, 60);
  const hashW = ctx.measureText("#").width;
  ctx.fillStyle = "#ffffff";
  ctx.fillText("FADL", 60 + hashW, 60);

  const levelText = `LEVEL ${level}`;
  ctx.font = "900 30px Arial";
  const levelW = ctx.measureText(levelText).width;
  const badgeX = W - levelW - 120, badgeW = levelW + 60;
  ctx.fillStyle = "#1a1a00";
  roundRect(ctx, badgeX, 55, badgeW, 56, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(240,255,0,0.5)";
  ctx.lineWidth = 2;
  roundRect(ctx, badgeX, 55, badgeW, 56, 8);
  ctx.stroke();
  ctx.fillStyle = AC;
  ctx.fillText(levelText, badgeX + 30, 70);

  const imgSize = 760, imgX = (W - imgSize) / 2, imgY = 170;
  const glow = ctx.createRadialGradient(W / 2, imgY + imgSize / 2, imgSize * 0.1, W / 2, imgY + imgSize / 2, imgSize * 0.55);
  glow.addColorStop(0, "rgba(240,255,0,0.12)");
  glow.addColorStop(1, "rgba(240,255,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, imgY - 40, W, imgSize + 80);

  await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.max(imgSize / sourceCanvas.width, imgSize / sourceCanvas.height);
      const dw = sourceCanvas.width * scale, dh = sourceCanvas.height * scale;
      ctx.drawImage(img, imgX + (imgSize - dw) / 2, imgY + (imgSize - dh) / 2, dw, dh);
      resolve();
    };
    img.src = sourceCanvas.toDataURL("image/png");
  });

  ctx.textAlign = "center";
  ctx.font = "900 34px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("BUILD THE BODY.", W / 2, imgY + imgSize + 30);
  ctx.font = "700 22px Arial";
  ctx.fillStyle = MU;
  ctx.fillText(`${totalWorkouts} WORKOUTS LOGGED`, W / 2, imgY + imgSize + 78);
  ctx.textAlign = "left";

  const barX = 140, barW = W - 280, barsTop = imgY + imgSize + 130;
  MUSCLES.forEach(([label, key], i) => {
    const y = barsTop + i * 54;
    const pct = Math.min(1, (stats[key] || 0) / CAP);
    ctx.font = "700 20px Arial";
    ctx.fillStyle = MU;
    ctx.textAlign = "left";
    ctx.fillText(label, barX, y);
    ctx.fillStyle = AC;
    ctx.textAlign = "right";
    ctx.fillText(`${Math.round(pct * 100)}%`, barX + barW, y);
    ctx.textAlign = "left";
    ctx.fillStyle = "#1c1c1c";
    roundRect(ctx, barX, y + 28, barW, 12, 6);
    ctx.fill();
    ctx.fillStyle = AC;
    roundRect(ctx, barX, y + 28, barW * pct, 12, 6);
    ctx.fill();
  });

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fadl-avatar-level-${level}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
