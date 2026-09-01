let ctx;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function tone(freq, startTime, duration, gainPeak = 0.15) {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playLevelUpSound() {
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();
  const now = audio.currentTime;
  tone(523.25, now, 0.14); // C5
  tone(659.25, now + 0.1, 0.14); // E5
  tone(783.99, now + 0.2, 0.3); // G5
}

export function playAchievementSound() {
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();
  const now = audio.currentTime;
  tone(880, now, 0.12, 0.12); // A5
  tone(1108.73, now + 0.09, 0.2, 0.12); // C#6
}

export function triggerHaptic() {
  if (navigator.vibrate) navigator.vibrate([40, 30, 60]);
}
