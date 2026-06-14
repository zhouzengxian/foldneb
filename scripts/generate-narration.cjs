/**
 * generate-narration.cjs — 星河巡游旁白预生成脚本
 * 使用微软 Edge 神经网络语音（zh-CN-XiaoxiaoNeural 晓晓）合成高质量自然语音。
 * 免费、无需 API key。质量接近豆包 TTS。
 *
 * 用法：node scripts/generate-narration.cjs
 * 产物：public/narration/narration-{1..8}.mp3
 *
 * 台词必须与 NebulaScene.jsx 中 speakNarration 的朗读版完全一致。
 * 修改台词后需重新运行本脚本。
 */
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs');
const path = require('path');

// 晓晓：甜美自然女声，最接近豆包风格，适合空灵星河旁白
const VOICE = 'zh-CN-XiaoxiaoNeural';
const RATE = 0.92;   // 略慢，增加空灵感
const PITCH = '+0Hz';

// 巡游 8 段旁白（朗读版，须与 NebulaScene.jsx 的 speakNarration 完全一致）
// 修改台词后需重新运行：node scripts/generate-narration.cjs
const lines = [
  { phase: 1, text: '如果人类群星闪耀，都在同一片天空。' },
  { phase: 2, text: 'AI前沿、认知决策——黄仁勋、马斯克、庄子，跨越千年的思想者化为发光星体。' },
  { phase: 3, text: '轻触一颗星，就能和他对话。回答会沉淀成记忆，下次还记得你。' },
  { phase: 4, text: '他们还会发朋友圈，自动回复你。' },
  { phase: 5, text: '思考凝成金色连线——知识内化不是记忆，是连线。' },
  { phase: 6, text: '召集他们开圆桌，多 Agent 横向辩论。' },
  { phase: 7, text: '时间折叠推演——还能和 5 年后的自己聊天。' },
  { phase: 8, text: 'FoldNeb——多 Agent 思想家推演引擎，帮你做战略博弈和认知决策，会动态生长的星河。' },
];

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function synthOne(line) {
  const tmpDir = path.join(outDirRef, `_tmp-${line.phase}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  let lastErr;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const safe = escapeXml(line.text);
      const { audioFilePath } = await tts.toFile(tmpDir, safe, { rate: RATE, pitch: PITCH });
      tts.close();

      const dest = path.join(outDirRef, `narration-${line.phase}.mp3`);
      fs.copyFileSync(audioFilePath, dest);
      fs.rmSync(tmpDir, { recursive: true, force: true });
      return dest;
    } catch (e) {
      lastErr = e;
      console.log(`  第 ${attempt} 次失败（${e.code || e.message}），${attempt < 5 ? `等待 ${attempt * 2}s 重试...` : '放弃'}`);
      await new Promise(r => setTimeout(r, attempt * 2000));
    }
  }
  throw lastErr;
}

const outDirRef = path.join(__dirname, '..', 'public', 'narration');

async function main() {
  const outDir = outDirRef;
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`语音: ${VOICE} | 语速: ${RATE} | 输出: ${outDir}\n`);

  let ok = 0;
  for (const line of lines) {
    try {
      const dest = await synthOne(line);
      const kb = (fs.statSync(dest).size / 1024).toFixed(1);
      console.log(`✓ Phase ${line.phase} (${kb}KB): ${line.text.slice(0, 18)}...`);
      ok++;
    } catch (e) {
      console.log(`✗ Phase ${line.phase} 失败: ${e.message}`);
    }
  }

  if (ok === lines.length) {
    console.log('\n全部生成完成。');
  } else if (ok > 0) {
    console.log(`\n部分完成（${ok}/${lines.length}）。失败的段可重新运行本脚本。`);
  } else {
    console.log('\n全部失败 —— 可能是网络无法连接微软 TTS 服务（wss 被重置）。前端将自动回退到浏览器神经网络语音。');
  }
}

main().catch((e) => {
  console.error('生成失败:', e);
  process.exit(1);
});
