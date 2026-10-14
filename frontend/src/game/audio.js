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

function brass(freq, start, dur, vol = 0.12) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(600, t);
  f.frequency.linearRampToValueAtTime(2600, t + 0.08);
  f.frequency.linearRampToValueAtTime(1200, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
  g.gain.setValueAtTime(vol, t + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  [0, 4, -5].forEach((det) => {
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = freq;
    o.detune.value = det;
    o.connect(f);
    o.start(t);
    o.stop(t + dur + 0.05);
  });
  f.connect(g).connect(c.destination);
}

function drum(start, vol = 0.6) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.35);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + 0.5);
}

const N = { G3: 196, C4: 261.6, E4: 329.6, G4: 392, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784 };

export const audio = {
  sound: true,
  voice: true,
  unlock() { if (this.sound) ac(); },
  hit(power = 1) { if (!this.sound) return; noise(2200, 0.07, 0.5 * power); tone(220, 0.09, 0.35 * power); },
  bounce() { if (!this.sound) return; tone(140, 0.07, 0.25); noise(900, 0.04, 0.12); },
  net() { if (!this.sound) return; noise(400, 0.25, 0.25, "lowpass", 0.01); },
  cheer(strength = 1) { if (!this.sound) return; noise(1100, 1.6 * strength, 0.18 * strength, "lowpass", 0.25); },
  fanfare() {
    if (!this.sound) return;
    [0, 0.45, 0.9, 1.35, 1.6, 1.8].forEach((t, i) => drum(t, i > 3 ? 0.4 : 0.65));
    [["G3", 0, 0.2], ["C4", 0.22, 0.2], ["E4", 0.44, 0.2], ["G4", 0.66, 0.5], ["E4", 1.2, 0.18], ["G4", 1.4, 0.18]].forEach(([n, t, d]) => brass(N[n], t, d));
    ["C5", "E5", "G5", "C4"].forEach((n) => brass(N[n], 1.65, 1.8, 0.07));
    drum(1.65, 0.9);
    setTimeout(() => this.cheer(1.6), 1700);
  },
  sting() {
    if (!this.sound) return;
    brass(N.D5, 0, 0.14, 0.08);
    brass(N.G5, 0.12, 0.35, 0.08);
    drum(0, 0.5);
  },
  say(text) {
    if (!this.voice || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.pitch = 0.9;
    window.speechSynthesis.speak(u);
  },
};
