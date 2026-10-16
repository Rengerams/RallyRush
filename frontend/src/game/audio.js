let ctx = null;
let noiseBuf = null;
let musicBus = null;
let musicDelay = null;
let musicTimer = null;
let musicActive = false;
let nextMusicBar = 0;
let musicBarIndex = 0;

const MUSIC_BEAT = 60 / 100;
const MUSIC_BAR = MUSIC_BEAT * 4;
const MUSIC_BARS = [
  { bass: 73.42, pad: [146.83, 174.61, 220], lead: [440, 587.33, 698.46, 587.33, 440, 523.25, 587.33, 523.25] },
  { bass: 58.27, pad: [116.54, 146.83, 174.61], lead: [349.23, 440, 466.16, 587.33, 698.46, 587.33, 466.16, 440] },
  { bass: 87.31, pad: [130.81, 174.61, 220], lead: [440, 523.25, 698.46, 523.25, 783.99, 698.46, 523.25, 440] },
  { bass: 65.41, pad: [130.81, 164.81, 196], lead: [392, 523.25, 587.33, 783.99, 659.25, 587.33, 523.25, 392] },
  { bass: 73.42, pad: [146.83, 174.61, 220], lead: [587.33, 698.46, 880, 698.46, 587.33, 523.25, 587.33, 698.46] },
  { bass: 58.27, pad: [116.54, 146.83, 174.61], lead: [466.16, 587.33, 698.46, 587.33, 440, 466.16, 523.25, 587.33] },
  { bass: 87.31, pad: [130.81, 174.61, 220], lead: [523.25, 698.46, 783.99, 698.46, 523.25, 440, 523.25, 698.46] },
  { bass: 65.41, pad: [130.81, 164.81, 196], lead: [392, 493.88, 587.33, 659.25, 783.99, 659.25, 587.33, 493.88] },
];

function musicNote(freq, start, duration, volume, type = "triangle") {
  if (!ctx || !musicBus) return;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(type === "sine" ? 900 : 2800, start);
  gain.gain.setValueAtTime(0.0001, start);
  const attack = type === "sine" ? 0.16 : 0.018;
  gain.gain.exponentialRampToValueAtTime(volume, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  const output = osc.connect(filter).connect(gain);
  output.connect(musicBus);
  if (musicDelay && type !== "sine") output.connect(musicDelay);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function scheduleMusicBar(start, index) {
  const bar = MUSIC_BARS[index % MUSIC_BARS.length];
  bar.pad.forEach((freq) => musicNote(freq, start, MUSIC_BAR * 0.96, 0.008, "sine"));
  [0, 2].forEach((beat) => {
    const bassTime = start + beat * MUSIC_BEAT;
    musicNote(bar.bass, bassTime, MUSIC_BEAT * 0.8, 0.032, "triangle");
    musicKick(bassTime, beat === 0 ? 0.12 : 0.085);
  });
  [1, 3].forEach((beat) => musicSnare(start + beat * MUSIC_BEAT, beat === 3 ? 0.032 : 0.024));
  for (let step = 0; step < 8; step++) {
    if (step % 2 === 0 || (index + step) % 3 !== 0) {
      musicHat(start + step * MUSIC_BEAT / 2, step % 2 === 0 ? 0.006 : 0.0035);
    }
  }
  bar.lead.forEach((freq, step) => {
    if (step === 3 || (step === 7 && index % 2 === 0)) return;
    const startAt = start + step * MUSIC_BEAT / 2;
    musicNote(freq, startAt, MUSIC_BEAT * (step % 2 ? 0.24 : 0.32), step > 4 ? 0.021 : 0.025, "triangle");
    if (step === 2 || step === 6) {
      const chordTone = bar.pad[(index + step / 2) % bar.pad.length];
      musicNote(chordTone * 2, startAt + MUSIC_BEAT * 0.18, MUSIC_BEAT * 0.22, 0.009, "sine");
    }
    if (step === 4 && index % 2 === 1) musicNote(freq / 2, startAt, MUSIC_BEAT * 0.5, 0.012, "sine");
  });
}

function scheduleMusic() {
  if (!ctx || !musicBus || !musicActive) return;
  const horizon = ctx.currentTime + 1.1;
  while (nextMusicBar < horizon) {
    scheduleMusicBar(nextMusicBar, musicBarIndex++);
    nextMusicBar += MUSIC_BAR;
  }
  musicTimer = setTimeout(scheduleMusic, 220);
}

function startMusic() {
  if (!ctx || !musicActive || musicTimer) return;
  if (!musicBus) {
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.0001;
    musicBus.connect(ctx.destination);
    musicDelay = ctx.createDelay(0.5);
    musicDelay.delayTime.value = MUSIC_BEAT * 0.375;
    const feedback = ctx.createGain();
    const wet = ctx.createGain();
    feedback.gain.value = 0.16;
    wet.gain.value = 0.18;
    musicDelay.connect(wet).connect(musicBus);
    musicDelay.connect(feedback).connect(musicDelay);
  }
  const now = ctx.currentTime;
  musicBus.gain.cancelScheduledValues(now);
  musicBus.gain.setValueAtTime(musicBus.gain.value, now);
  musicBus.gain.linearRampToValueAtTime(0.72, now + 0.8);
  nextMusicBar = now + 0.08;
  musicBarIndex = 0;
  scheduleMusic();
}

function stopMusic() {
  if (musicTimer) clearTimeout(musicTimer);
  musicTimer = null;
  if (musicBus && ctx) {
    const now = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setValueAtTime(musicBus.gain.value, now);
    musicBus.gain.linearRampToValueAtTime(0.0001, now + 0.25);
  }
}

function ac() {
  if (typeof window === "undefined") return null;
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

function musicKick(start, volume = 0.12) {
  const c = ac();
  if (!c || !musicBus) return;
  const t = c.currentTime + start;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(105, t);
  osc.frequency.exponentialRampToValueAtTime(48, t + 0.16);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  osc.connect(gain).connect(musicBus);
  osc.start(t);
  osc.stop(t + 0.22);
}

function musicSnare(start, volume = 0.035) {
  const c = ac();
  if (!c || !noiseBuf || !musicBus) return;
  const t = c.currentTime + start;
  const source = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const gain = c.createGain();
  source.buffer = noiseBuf;
  filter.type = "highpass";
  filter.frequency.setValueAtTime(1600, t);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
  source.connect(filter).connect(gain).connect(musicBus);
  source.start(t);
  source.stop(t + 0.14);
}

function musicHat(start, volume = 0.009) {
  const c = ac();
  if (!c || !noiseBuf || !musicBus) return;
  const t = c.currentTime + start;
  const source = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const gain = c.createGain();
  source.buffer = noiseBuf;
  filter.type = "highpass";
  filter.frequency.setValueAtTime(6800, t);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  source.connect(filter).connect(gain).connect(musicBus);
  source.start(t);
  source.stop(t + 0.05);
}

const N = { G3: 196, C4: 261.6, E4: 329.6, G4: 392, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784 };

export function selectUmpireVoice(voices = []) {
  const english = voices.filter((voice) => /^en([_-]|$)/i.test(voice.lang || ""));
  return english.find((voice) => /^en[-_]gb/i.test(voice.lang || "") && /male|daniel|george|arthur|ryan|oliver|thomas/i.test(voice.name || ""))
    || english.find((voice) => /^en[-_]gb/i.test(voice.lang || ""))
    || english.find((voice) => voice.default)
    || english[0]
    || null;
}

export const audio = {
  sound: true,
  voice: true,
  unlock() {
    if (this.sound) {
      ac();
      if (musicActive) startMusic();
    }
  },
  setSound(enabled) {
    this.sound = enabled;
    if (enabled) {
      ac();
      if (musicActive) startMusic();
    } else {
      stopMusic();
    }
  },
  setMusicActive(active) {
    musicActive = active;
    if (active && this.sound) startMusic();
    else stopMusic();
  },
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
    if (!this.voice || typeof window === "undefined" || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    u.rate = 0.9;
    u.pitch = 0.96;
    u.voice = selectUmpireVoice(synth.getVoices?.() || []) || null;
    synth.speak(u);
  },
};
