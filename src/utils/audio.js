// Web Audio API 音效合成引擎 - 零外部依赖
let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// 打字声 - 短促清脆
export function playTypeSound() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800 + Math.random() * 400, t);
  osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);
  gain.gain.setValueAtTime(0.06, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.05);
}

// 节点高亮"叮"声
export function playDing() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, t);
  osc.frequency.exponentialRampToValueAtTime(1600, t + 0.05);
  osc.frequency.exponentialRampToValueAtTime(800, t + 0.3);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.4);
}

// 钟声 - 新人入驻
export function playBell() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.exponentialRampToValueAtTime(220, t + 0.5);
  osc.frequency.exponentialRampToValueAtTime(110, t + 1.5);
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t); osc.stop(t + 2);
}

// 场景过渡嗡鸣
export function playWhoosh() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(200, t);
  filter.frequency.exponentialRampToValueAtTime(3000, t + 0.15);
  filter.frequency.exponentialRampToValueAtTime(100, t + 0.4);
  filter.Q.setValueAtTime(0.5, t);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start(t); noise.stop(t + 0.4);
}

// 低音氛围 - 城邦背景
let ambientOsc = null;
let ambientGain = null;

export function startAmbient() {
  const ctx = getCtx();
  if (ambientOsc) return;
  ambientOsc = ctx.createOscillator();
  ambientGain = ctx.createGain();
  ambientOsc.type = 'sine';
  ambientOsc.frequency.value = 55;
  ambientGain.gain.value = 0.03;
  ambientOsc.connect(ambientGain).connect(ctx.destination);
  ambientOsc.start();
}

export function stopAmbient() {
  if (ambientOsc) {
    ambientOsc.stop();
    ambientOsc = null;
    ambientGain = null;
  }
}

// 粒子聚合嗡鸣
export function playConvergeWhoosh() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(60, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 2);
  osc.frequency.exponentialRampToValueAtTime(80, t + 3);
  gain.gain.setValueAtTime(0.05, t);
  gain.gain.linearRampToValueAtTime(0.08, t + 1.5);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 3);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t); osc.stop(t + 3.2);
}

// 确保用户交互后初始化AudioContext
export function initAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
}
