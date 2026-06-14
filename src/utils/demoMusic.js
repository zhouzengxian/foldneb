/**
 * demoMusic.js — 星河巡游电子配乐引擎（V2 空灵版）
 * 纯 Web Audio API 实时合成，零外部依赖。
 * V2 改动：根除低频嗡嗡，全面提升空灵感
 *  - Pad：三角波 → 正弦波（去除丰富谐波）；提高低通滤波 600→1500Hz；降低单音 gain
 *  - Pad：增加高频八度点缀（像星光闪烁），不再依赖低频堆厚度
 *  - Bass：缩短 release，加快衰减；加低通 200Hz 切掉嗡嗡尾音
 *  - Arp：提高到高八度区间，更轻盈
 *  - Perc：hi-hat 频率提高到 9kHz，kick 大幅降低 + 加快衰减
 *  - master：0.18 → 0.10，整体音压降低；加低频 cut 80Hz 防低频堆积
 */

// ── 和弦进行（Am 调，空灵色彩） ──
const chordProgression = [
  { color: 'Am7',   notes: [220, 261.63, 329.63, 392] },        // A-C-E-G
  { color: 'Fmaj7', notes: [174.61, 220, 261.63, 349.23] },     // F-A-C-E
  { color: 'Cmaj7', notes: [261.63, 329.63, 392, 466.16] },     // C-E-G-B
  { color: 'Gsus4', notes: [196, 261.63, 293.66, 392] },        // G-C-D-G
];

// ── 琶音：高八度上行/下行，轻盈 ──
function arpFreq(chordNotes, step) {
  const len = chordNotes.length;
  // 0 1 2 3 2 1 来回
  const idx = step % (len * 2 - 2);
  const noteIdx = idx < len ? idx : len * 2 - 2 - idx;
  return chordNotes[noteIdx] * 2; // 全部高八度，更亮
}

export function createDemoMusic() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx();

  // 主输出 + 低频 cut（80Hz 以下全切，消除嗡嗡共振源）
  const master = ctx.createGain();
  master.gain.value = 0.10;

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 80;

  // 一个温和的全局低通（限制最高频，避免刺耳）
  const masterLow = ctx.createBiquadFilter();
  masterLow.type = 'lowpass';
  masterLow.frequency.value = 5500;

  master.connect(highpass);
  highpass.connect(masterLow);
  masterLow.connect(ctx.destination);

  const BPM = 92;                     // 略放慢，更空灵
  const beatLen = 60 / BPM;           // ≈ 0.652s
  const barLen = beatLen * 4;
  const halfBeat = beatLen / 2;

  let stopped = false;
  const timers = [];

  function rampUp(gain, value, attack, startAt) {
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(value, startAt + attack);
  }
  function rampDown(gain, duration, startAt) {
    // 长释放，让音色像光晕一样散开
    gain.gain.setValueAtTime(gain.gain.value, startAt + duration - 0.4);
    gain.gain.linearRampToValueAtTime(0, startAt + duration + 0.8);
  }

  // ── 1. Pad（正弦波空灵背景，加 2 倍频点缀像星光） ──
  function schedulePad(chordNotes, when, length) {
    chordNotes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // 正弦波，谐波少，不堆低频嗡嗡
      osc.type = 'sine';
      osc.frequency.value = freq;

      // 1500Hz 低通，保留温暖但不闷
      filter.type = 'lowpass';
      filter.frequency.value = 1500;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      // 慢起音（更朦胧）+ 长释放
      rampUp(gain, 0.022, 1.0, when);
      rampDown(gain, length, when);

      osc.start(when);
      osc.stop(when + length + 1.2);
    });
  }

  // ── 1b. 高八度星光点缀（每小节只响几颗，营造闪烁感） ──
  function scheduleSparkles(chordNotes, barStart) {
    // 每小节随机 3 个高音点缀
    const sparkTimes = [0, beatLen * 1.5, beatLen * 3];
    sparkTimes.forEach((offset, i) => {
      const freq = chordNotes[i % chordNotes.length] * 4; // 高两个八度
      const t = barStart + offset;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(master);

      // 极慢起音 + 极长释放，像光点慢慢亮起又消失
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.012, t + 0.3);
      gain.gain.linearRampToValueAtTime(0, t + 1.6);

      osc.start(t);
      osc.stop(t + 1.8);
    });
  }

  // ── 2. Arp（高八度琶音，轻盈正弦） ──
  function scheduleArp(chord, barStart) {
    const totalNotes = 16;
    const stepLen = barLen / totalNotes;

    for (let i = 0; i < totalNotes; i++) {
      // 隔点弹奏，不密集，避免赶
      if (i % 2 === 1 && i % 4 !== 3) continue;

      const freq = arpFreq(chord.notes, i);
      const t = barStart + i * stepLen;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(master);

      rampUp(gain, 0.018, 0.02, t);
      rampDown(gain, stepLen * 3, t);

      osc.start(t);
      osc.stop(t + stepLen * 3.5);
    }
  }

  // ── 3. Bass（短促根音，加快衰减，加低通切尾音） ──
  function scheduleBass(chord, barStart) {
    // 只在 1、3 拍点根音，少而稳
    [0, 2].forEach((beat) => {
      const freq = chord.notes[0] / 2;
      const t = barStart + beat * beatLen;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.value = 200; // 切掉所有中高频，只留极低根音
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      // 快起快收，不拖尾（防止嗡嗡堆积）
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.05, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  // ── 4. 极轻打击（远处的沙锤 + 几乎不存在的 kick） ──
  function schedulePerc(barStart) {
    // 沙锤只 4 次/小节（不是 8 次），频率更高更轻
    for (let i = 0; i < 4; i++) {
      const t = barStart + i * beatLen;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let s = 0; s < data.length; s++) {
        data[s] = (Math.random() * 2 - 1) * Math.exp(-s / (ctx.sampleRate * 0.01));
      }
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 9000; // 极高，像细沙
      src.buffer = buf;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      gain.gain.setValueAtTime(0.015, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      src.start(t);
      src.stop(t + 0.05);
    }
    // Kick 完全去掉 —— V2 让音乐完全空灵，不留任何鼓点压迫感
  }

  function scheduleBar(barIndex) {
    if (stopped) return;
    const now = ctx.currentTime;
    const chord = chordProgression[barIndex % chordProgression.length];
    const barStart = now + 0.1;

    schedulePad(chord.notes, barStart, barLen);
    scheduleSparkles(chord.notes, barStart);
    scheduleArp(chord, barStart);
    scheduleBass(chord, barStart);
    schedulePerc(barStart);

    const nextDelay = (barLen * 1000) - 30;
    const timer = setTimeout(() => scheduleBar(barIndex + 1), nextDelay);
    timers.push(timer);
  }

  scheduleBar(0);

  return {
    stop() {
      stopped = true;
      timers.forEach(clearTimeout);
      timers.length = 0;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      setTimeout(() => ctx.close().catch(() => {}), 1000);
    },
    ctx,
  };
}
