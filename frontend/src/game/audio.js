let ctx = null;
let noiseBuf = null;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function noise(freq, dur, vol, type = "bandpass", attack = 0.002) {
  const c = ac();
  if (!c) return;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + dur + 0.05);
}

function tone(freq, dur, vol) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  const t = c.currentTime;
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.5, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const audio = {
  sound: true,
  voice: true,
  unlock() { if (this.sound) ac(); },
  hit(power = 1) { if (!this.sound) return; noise(2200, 0.07, 0.5 * power); tone(220, 0.09, 0.35 * power); },
  bounce() { if (!this.sound) return; tone(140, 0.07, 0.25); noise(900, 0.04, 0.12); },
  net() { if (!this.sound) return; noise(400, 0.25, 0.25, "lowpass", 0.01); },
  cheer(strength = 1) { if (!this.sound) return; noise(1100, 1.6 * strength, 0.18 * strength, "lowpass", 0.25); },
  say(text) {
    if (!this.voice || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.pitch = 0.9;
    window.speechSynthesis.speak(u);
  },
};
