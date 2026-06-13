/**
 * MemoryCrystal — 折叠记忆提取引擎
 * 
 * 三种精度等级：
 * - CRYSTAL (LLM提取):   对话完成后调LLM提取精确三元组
 * - FRAGMENT (关键词匹配): 社交评论用关键词快速匹配
 * - DUST (截断降级):      匹配失败时截取文本前15字
 * 
 * 所有关系都经过 AGENT_ALIAS_MAP 验证 —— 不存在于系统中的Agent会被丢弃
 */

import useNebulaStore from '../store/useNebulaStore.js';

// ============================================================
// 一、Agent 双向别名映射表（42个Tier-1 + 用户）
// ============================================================
const AGENT_ALIAS_MAP = {
  // ==== 1. AI前沿 (12人) ====
  'jensen_huang':   { names: ['黄仁勋','Jensen Huang','老黄','NVIDIA CEO'],      id: 'jensen_huang' },
  'elon_musk':      { names: ['Elon Musk','马斯克','Elon','Musk','伊隆·马斯克'],  id: 'elon_musk' },
  'sam_altman':     { names: ['Sam Altman','奥特曼','Sam','Altman'],             id: 'sam_altman' },
  'demis_hassabis': { names: ['Demis Hassabis','哈萨比斯','DeepMind','Demis'],   id: 'demis_hassabis' },
  'yann_lecun':     { names: ['Yann LeCun','杨立昆','LeCun','Yann'],             id: 'yann_lecun' },
  'dario_amodei':   { names: ['Dario Amodei','阿莫迪','Dario','Anthropic'],     id: 'dario_amodei' },
  'feifei_li':      { names: ['李飞飞','Fei-Fei Li','李飞飞教授'],                id: 'feifei_li' },
  'li_kaifu':       { names: ['李开复','Kaifu Lee','开复','创新工场'],            id: 'li_kaifu' },
  'liang_wenfeng':  { names: ['梁文锋','DeepSeek','幻方','梁文峰'],               id: 'liang_wenfeng' },
  'andrej_karpathy':{ names: ['Andrej Karpathy','Karpathy','安德烈'],            id: 'andrej_karpathy' },
  'geoffrey_hinton':{ names: ['Geoffrey Hinton','Hinton','杰弗里·辛顿','辛顿'],   id: 'geoffrey_hinton' },
  'andrew_ng':      { names: ['Andrew Ng','吴恩达','吴恩达教授','Ng'],            id: 'andrew_ng' },
  // ==== 2. 认知与决策 (10人) ====
  'kahneman':       { names: ['卡尼曼','Kahneman','丹尼尔·卡尼曼'],               id: 'kahneman' },
  'charlie_munger': { names: ['芒格','Charlie Munger','查理·芒格','Munger'],     id: 'charlie_munger' },
  'nassim_taleb':   { names: ['塔勒布','Nassim Taleb','黑天鹅作者','Taleb'],     id: 'nassim_taleb' },
  'hofstadter':     { names: ['侯世达','Hofstadter','道格拉斯·侯世达','GEB'],     id: 'hofstadter' },
  'steven_pinker':  { names: ['Steven Pinker','Pinker','斯蒂芬·平克','平克'],     id: 'steven_pinker' },
  'morgan_housel':  { names: ['Morgan Housel','豪斯','金钱心理学'],               id: 'morgan_housel' },
  'sam_harris':     { names: ['Sam Harris','哈里斯','山姆·哈里斯'],               id: 'sam_harris' },
  'annie_duke':     { names: ['安妮·杜克','Annie Duke','杜克','扑克冠军'],        id: 'annie_duke' },
  'herbert_simon':  { names: ['赫伯特·西蒙','Herbert Simon','Simon','西蒙'],      id: 'herbert_simon' },
  'cialdini':       { names: ['西奥迪尼','Cialdini','罗伯特·西奥迪尼','影响力'],  id: 'cialdini' },
  // ==== 3. 战略与博弈 (8人) ====
  'sunzi':          { names: ['孙子','孙武','Sun Tzu','孙子兵法'],                id: 'sunzi' },
  'michael_porter': { names: ['迈克尔·波特','波特','Porter','竞争战略'],          id: 'michael_porter' },
  'clayton_christensen': { names: ['克里斯坦森','Christensen','Clayton','创新者的窘境'], id: 'clayton_christensen' },
  'peter_thiel':    { names: ['Peter Thiel','彼得·蒂尔','Thiel','从0到1'],        id: 'peter_thiel' },
  'thomas_schelling':{ names: ['托马斯·谢林','谢林','Schelling'],                 id: 'thomas_schelling' },
  'john_boyd':      { names: ['John Boyd','博伊德','Boyd','OODA'],               id: 'john_boyd' },
  'schumpeter':     { names: ['熊彼特','Schumpeter','约瑟夫·熊彼特'],             id: 'schumpeter' },
  'jim_collins':    { names: ['吉姆·柯林斯','柯林斯','Jim Collins','基业长青'],   id: 'jim_collins' },
  // ==== 4. 资本与周期 (8人) ====
  'shen_nanpeng':   { names: ['沈南鹏','Neil Shen','红杉中国'],                   id: 'shen_nanpeng' },
  'marc_andreessen':{ names: ['Marc Andreessen','Andreessen','a16z','安德森'],    id: 'marc_andreessen' },
  'naval_ravikant': { names: ['Naval Ravikant','Naval','拉维坎特'],               id: 'naval_ravikant' },
  'ray_dalio':      { names: ['Ray Dalio','达利欧','Dalio','桥水','原则'],        id: 'ray_dalio' },
  'balaji_srinivasan': { names: ['Balaji','Balaji Srinivasan','巴拉吉'],          id: 'balaji_srinivasan' },
  'bill_gurley':    { names: ['Bill Gurley','Gurley','格利'],                    id: 'bill_gurley' },
  'vinod_khosla':   { names: ['Vinod Khosla','Khosla','科斯拉'],                 id: 'vinod_khosla' },
  'fang_aizhi':     { names: ['方爱之','真格基金','真格'],                         id: 'fang_aizhi' },
  // ==== 5. 复杂系统 (8人) ====
  'geoffrey_west':  { names: ['Geoffrey West','韦斯特','West','规模法则'],        id: 'geoffrey_west' },
  'stuart_kauffman':{ names: ['Stuart Kauffman','考夫曼','Kauffman'],             id: 'stuart_kauffman' },
  'kevin_kelly':    { names: ['Kevin Kelly','凯文·凯利','KK','Kelly'],           id: 'kevin_kelly' },
  'donella_meadows':{ names: ['Donella Meadows','梅多斯','Meadows','系统思考'],   id: 'donella_meadows' },
  'stephen_wolfram':{ names: ['Stephen Wolfram','Wolfram','沃尔夫拉姆'],          id: 'stephen_wolfram' },
  'john_holland':   { names: ['John Holland','霍兰德','Holland','遗传算法'],      id: 'john_holland' },
  'duncan_watts':   { names: ['Duncan Watts','瓦茨','Watts','六度分隔'],          id: 'duncan_watts' },
  'barabasi':       { names: ['Barabási','巴拉巴西','Barabasi','无标度网络'],     id: 'barabasi' },
  // ==== 6. 网络与平台 (8人) ====
  'tim_berners_lee':{ names: ['Tim Berners-Lee','伯纳斯-李','万维网之父','Berners-Lee'], id: 'tim_berners_lee' },
  'vitalik_buterin':{ names: ['Vitalik Buterin','V神','Vitalik','以太坊'],        id: 'vitalik_buterin' },
  'satoshi_nakamoto':{ names: ['中本聪','Satoshi','Satoshi Nakamoto','比特币'],   id: 'satoshi_nakamoto' },
  'reid_hoffman':   { names: ['Reid Hoffman','霍夫曼','Hoffman','LinkedIn'],     id: 'reid_hoffman' },
  'benedict_evans': { names: ['Benedict Evans','Evans','本尼迪克特'],             id: 'benedict_evans' },
  'clay_shirky':    { names: ['Clay Shirky','舍基','Shirky','人人时代'],          id: 'clay_shirky' },
  'wang_jianshuo':  { names: ['王建硕','百姓网'],                                  id: 'wang_jianshuo' },
  'lan_xi':         { names: ['阑夕','科技评论'],                                  id: 'lan_xi' },
  // ==== 7. 产品与设计 (6人) ====
  'dieter_rams':    { names: ['Dieter Rams','迪特·拉姆斯','Rams'],                id: 'dieter_rams' },
  'zhang_xiaolong': { names: ['张小龙','小龙','微信之父','Allen Zhang'],           id: 'zhang_xiaolong' },
  'don_norman':     { names: ['Don Norman','诺曼','唐·诺曼','设计心理学'],         id: 'don_norman' },
  'jony_ive':       { names: ['Jony Ive','乔纳森·艾维','苹果设计师','Ive'],       id: 'jony_ive' },
  'bret_victor':    { names: ['Bret Victor','Victor','布雷特·维克托'],            id: 'bret_victor' },
  'hara_kenya':     { names: ['原研哉','Kenya Hara','Hara','MUJI'],              id: 'hara_kenya' },
  // ==== 8. 中国当代力量 (13人) ====
  'lei_jun':        { names: ['雷军','Lei Jun','小米创始人','Are you OK'],        id: 'lei_jun' },
  'zhang_yiming':   { names: ['张一鸣','Yiming Zhang','字节跳动','一鸣'],          id: 'zhang_yiming' },
  'ma_huateng':     { names: ['马化腾','Pony Ma','腾讯','小马哥'],                id: 'ma_huateng' },
  'wang_xing':      { names: ['王兴','美团','Wang Xing'],                         id: 'wang_xing' },
  'huang_zheng':    { names: ['黄峥','拼多多','Temu','Colin Huang'],              id: 'huang_zheng' },
  'wang_chuanfu':   { names: ['王传福','比亚迪','BYD'],                            id: 'wang_chuanfu' },
  'zhihui_jun':     { names: ['稚晖君','彭志辉','智元机器人','野生钢铁侠'],        id: 'zhihui_jun' },
  'yang_zhilin':    { names: ['杨植麟','月之暗面','Kimi','Moonshot'],             id: 'yang_zhilin' },
  'wang_xingxing':  { names: ['王兴兴','宇树科技','Unitree','人形机器人'],         id: 'wang_xingxing' },
  'yu_hao':         { names: ['俞浩','追觅科技','Dreame'],                        id: 'yu_hao' },
  'yan_junjie':     { names: ['闫俊杰','MiniMax','海螺AI'],                       id: 'yan_junjie' },
  'zhang_peng':     { names: ['张鹏','智谱AI','GLM','ChatGLM'],                  id: 'zhang_peng' },
  'jiang_daxin':    { names: ['姜大昕','阶跃星辰','StepFun'],                      id: 'jiang_daxin' },
  // ==== 9. 思想源流 (10人) ====
  'zhuangzi':       { names: ['庄子','庄周','庄生','Zhuangzi','Chuang-tzu'],      id: 'zhuangzi' },
  'wangyangming':   { names: ['王阳明','王守仁','阳明先生','王阳明先生'],           id: 'wangyangming' },
  'huineng':        { names: ['慧能','惠能','六祖','禅宗六祖','惠能大师'],         id: 'huineng' },
  'laozi':          { names: ['老子','李耳','Laozi','Lao Tzu','道德经'],         id: 'laozi' },
  'hanfeizi':       { names: ['韩非子','韩非','Han Fei','法家'],                  id: 'hanfeizi' },
  'deleuze':        { names: ['德勒兹','Gilles Deleuze','Deleuze','吉尔·德勒兹'], id: 'deleuze' },
  'nietzsche':      { names: ['尼采','Nietzsche','弗里德里希·尼采','超人'],        id: 'nietzsche' },
  'marcus_aurelius':{ names: ['马可·奥勒留','奥勒留','Marcus Aurelius','沉思录'],  id: 'marcus_aurelius' },
  'foucault':       { names: ['福柯','Michel Foucault','Foucault','米歇尔·福柯'], id: 'foucault' },
  'wittgenstein':   { names: ['维特根斯坦','Wittgenstein','维特根斯坦'],           id: 'wittgenstein' },
  // ==== 10. AI叙事场 (10人) ====
  'lex_fridman':    { names: ['Lex Fridman','弗里德曼','Lex','播客'],             id: 'lex_fridman' },
  'rowan_cheung':   { names: ['Rowan Cheung','The Rundown','AI日报'],             id: 'rowan_cheung' },
  'soumith_chintala':{ names: ['Soumith Chintala','PyTorch','Soumith'],           id: 'soumith_chintala' },
  'gary_marcus':    { names: ['Gary Marcus','Marcus','马库斯'],                   id: 'gary_marcus' },
  'lilian_weng':    { names: ['Lilian Weng','翁丽莲','Weng','OpenAI安全'],        id: 'lilian_weng' },
  'john_carmack':   { names: ['John Carmack','卡马克','Carmack','Doom'],          id: 'john_carmack' },
  'allie_miller':   { names: ['Allie Miller','Miller','米勒'],                    id: 'allie_miller' },
  'schmidhuber':    { names: ['Schmidhuber','施密德胡贝','LSTM'],                  id: 'schmidhuber' },
  'jeremy_howard':  { names: ['Jeremy Howard','Howard','fast.ai'],                id: 'jeremy_howard' },
  'rodney_brooks':  { names: ['Rodney Brooks','Brooks','布鲁克斯','iRobot'],      id: 'rodney_brooks' },
  // ==== 11. 跨界之眼 (4人) ====
  'kafka':          { names: ['卡夫卡','Franz Kafka','Kafka'],                    id: 'kafka' },
  'harari':         { names: ['赫拉利','Harari','尤瓦尔·赫拉利','人类简史'],       id: 'harari' },
  'stewart_brand':  { names: ['Stewart Brand','布兰德','Brand','全球概览'],       id: 'stewart_brand' },
  'tim_urban':      { names: ['Tim Urban','Urban','WaitButWhy'],                  id: 'tim_urban' },
  // ==== 12. 知识枢纽 (4人) ====
  'mochi':          { names: ['墨池'],                                            id: 'mochi' },
  'paul_graham':    { names: ['Paul Graham','PG','格雷厄姆','Graham','YC'],       id: 'paul_graham' },
  'peter_diamandis':{ names: ['Peter Diamandis','Diamandis','XPRIZE'],            id: 'peter_diamandis' },
  'zhang_xiaoyu':   { names: ['张潇雨','得意忘形'],                                id: 'zhang_xiaoyu' },
  // ==== 13. 草根力量 (24人) ====
  'dan_koe':        { names: ['Dan Koe'],                                         id: 'dan_koe' },
  'justin_welsh':   { names: ['Justin Welsh'],                                    id: 'justin_welsh' },
  'alex_hormozi':   { names: ['Alex Hormozi'],                                    id: 'alex_hormozi' },
  'pieter_levels':  { names: ['Pieter Levels','levelsio'],                        id: 'pieter_levels' },
  'sahil_bloom':    { names: ['Sahil Bloom'],                                     id: 'sahil_bloom' },
  'arvid_kahl':     { names: ['Arvid Kahl'],                                      id: 'arvid_kahl' },
  'dickie_bush':    { names: ['Dickie Bush'],                                     id: 'dickie_bush' },
  'liu_siyi':       { names: ['刘思毅','群响'],                                    id: 'liu_siyi' },
  'chen_jing':      { names: ['陈晶','清华陈晶'],                                  id: 'chen_jing' },
  'xiao_yiqun':     { names: ['肖逸群','肖厂长','私域肖厂长'],                     id: 'xiao_yiqun' },
  'li_xiaolai':     { names: ['李笑来'],                                          id: 'li_xiaolai' },
  'cao_zheng':      { names: ['曹政','caoz'],                                     id: 'cao_zheng' },
  'liu_run':        { names: ['刘润'],                                            id: 'liu_run' },
  'gong_wenxiang':  { names: ['龚文祥','触电会'],                                  id: 'gong_wenxiang' },
  'xu_zhibin':      { names: ['徐志斌','见实'],                                    id: 'xu_zhibin' },
  'shao_nan':       { names: ['少楠','flomo'],                                    id: 'shao_nan' },
  'fan_bing':       { names: ['范冰'],                                            id: 'fan_bing' },
  'li_ziran':       { names: ['李自然'],                                          id: 'li_ziran' },
  'suozhang_linchao': { names: ['所长林超','林超'],                                id: 'suozhang_linchao' },
  'heiba_duizhang': { names: ['黑八队长'],                                        id: 'heiba_duizhang' },
  'feng_zihan':     { names: ['冯子涵','心窝'],                                    id: 'feng_zihan' },
  'yu_qing':        { names: ['喻庆'],                                            id: 'yu_qing' },
  'marc_lou':       { names: ['Marc Lou'],                                        id: 'marc_lou' },
  'sahil_lavingia': { names: ['Sahil Lavingia','Gumroad'],                       id: 'sahil_lavingia' },
  // ==== 用户 ====
  'user':           { names: ['我','用户','你','自己','创始人','我本人'],           id: 'user' },
};

// ============================================================
// 二、别名解析引擎
// ============================================================

/**
 * 将 LLM 返回的名字映射到 Agent ID
 * @param {string} name - LLM 返回的人物名称
 * @returns {string|null} agent id，或 null（表示无法匹配，应丢弃）
 */
export function resolveAgentId(name) {
  if (!name || typeof name !== 'string') return null;
  const normalized = name.trim();

  // 1. 精确匹配（大小写不敏感）
  const lowerName = normalized.toLowerCase();
  for (const [, entry] of Object.entries(AGENT_ALIAS_MAP)) {
    if (entry.names.some(n => n.toLowerCase() === lowerName)) {
      return entry.id;
    }
  }

  // 2. 包含匹配（"庄子" 出现在 "庄子说" 中）
  for (const [, entry] of Object.entries(AGENT_ALIAS_MAP)) {
    if (entry.names.some(n => {
      const ln = n.toLowerCase();
      return lowerName.includes(ln) || ln.includes(lowerName);
    })) {
      return entry.id;
    }
  }

  // 无法匹配
  return null;
}

// ============================================================
// 三、JSON 清洗管道（移植自 kg-visualizer）
// ============================================================

/**
 * 清洗 LLM 返回的原始文本，提取 JSON 数组
 * @param {string} rawText - LLM 原始输出
 * @returns {Array} 清洗后的三元组数组
 */
export function cleanLLMResponse(rawText) {
  if (!rawText) return [];
  let text = rawText;

  // 1. 去除 markdown 代码块包裹
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

  // 2. 去除首尾空白和控制字符
  text = text.trim();

  // 3. 提取第一个 '[' 到最后一个 ']' 之间的内容
  const startIdx = text.indexOf('[');
  const endIdx = text.lastIndexOf(']');
  if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
    text = text.substring(startIdx, endIdx + 1);
  }

  // 4. 修复尾部多余逗号
  text = text.replace(/,(\s*[}\]])/g, '$1').replace(/,\s*$/g, '');

  // 5. 尝试解析
  try {
    const result = JSON.parse(text);
    if (!Array.isArray(result)) return [];
    return result;
  } catch (e) {
    console.warn('[MemoryCrystal] JSON parse failed, raw:', rawText.substring(0, 200));
    return [];
  }
}

// ============================================================
// 四、LLM 提取管道（CRYSTAL 精度）
// ============================================================

const LLM_SYSTEM_PROMPT = `你是一个知识图谱分析器。从以下 Agent 对话中提取"记忆晶体"——知识三元组。

输出 JSON 数组格式（只输出JSON，不要任何其他文字）：
[
  {
    "source": "对话中其中一个思想者的名字",
    "target": "对话中另一个思想者的名字",
    "relation": "两者之间的知识关系（中文短句，10字以内）"
  }
]

规则：
1. 只提取对话中明确涉及、直接参与对话的思想者之间的关系。
2. 名字必须和对话中出现的名称一致，不要翻译。
3. 没有明确的知识关系就不要强行生成，宁可少不要错。
4. 每次对话最多提取 2 个三元组。`;

import { getDeliberationProvider } from './deliberationEngine';
import { callLLMWithProvider } from './modelConfig';

let extractCallId = 0;

/**
 * 从对话文本中提取知识三元组（CRYSTAL 精度）
 * @param {Array<{speaker: string, text: string}>} dialogues - 对话列表
 * @returns {Promise<Array<{from: string, to: string, relation: string}>>} 验证后的记忆晶体
 */
export async function extractMemory(dialogues) {
  if (!dialogues || dialogues.length === 0) return [];

  const callId = ++extractCallId;
  
  // 构建对话文本
  const dialogText = dialogues
    .map(d => {
      const speakerName = d.speaker || '未知';
      return `${speakerName}: ${d.text}`;
    })
    .join('\n');

  console.log(`[MemoryCrystal #${callId}] 提取开始，${dialogues.length} 段对话`);

  try {
    const providerId = getDeliberationProvider();
    const rawOutput = await callLLMWithProvider(providerId, LLM_SYSTEM_PROMPT, dialogText, {
      temperature: 0.1, maxTokens: 500, timeoutMs: 10000,
    });
    if (!rawOutput) {
      console.warn(`[MemoryCrystal #${callId}] 空响应`);
      return [];
    }

    // 清洗 + 解析
    const triples = cleanLLMResponse(rawOutput);

    // 别名匹配 + 过滤
    const validTriples = [];
    for (const t of triples) {
      const fromId = resolveAgentId(t.source);
      const toId = resolveAgentId(t.target);

      if (!fromId) {
        console.log(`[MemoryCrystal #${callId}] 跳过未知来源: "${t.source}"`);
        continue;
      }
      if (!toId) {
        console.log(`[MemoryCrystal #${callId}] 跳过未知目标: "${t.target}"`);
        continue;
      }
      if (fromId === toId) {
        console.log(`[MemoryCrystal #${callId}] 跳过自指关系: ${fromId}`);
        continue;
      }

      validTriples.push({
        from: fromId,
        to: toId,
        relation: t.relation?.slice(0, 20) || '知识关联',
      });
    }

    console.log(`[MemoryCrystal #${callId}] 提取完成: ${triples.length} 原始 → ${validTriples.length} 有效`);
    return validTriples;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`[MemoryCrystal #${callId}] 超时`);
    } else {
      console.error(`[MemoryCrystal #${callId}] 异常:`, error.message);
    }
    return [];
  }
}

// ============================================================
// 五、社交评论快速提取（FRAGMENT 精度）
// ============================================================

const KEYWORD_MAP = [
  { pattern: /知行合一|事上磨[练煉]|致良知|心学/, label: '心学共鸣' },
  { pattern: /逍遥[游遊]|自由|飞翔|鹏[鸟鳥]/, label: '逍遥共鸣' },
  { pattern: /块茎|根茎|连接|网络|拓扑/, label: '思想连接' },
  { pattern: /CUDA|GPU|算力|芯片|NVIDIA/, label: '技术认同' },
  { pattern: /非遗|传承|手工|匠人|刺绣/, label: '文化共鸣' },
  { pattern: /AI|人工智能|智能体|Agent/, label: 'AI认同' },
  { pattern: /哲学|思想|智慧|深思/, label: '哲学共鸣' },
  { pattern: /建筑|空间|城市|设计/, label: '空间共鸣' },
  { pattern: /艺术|美学|画|诗|音乐/, label: '艺术共鸣' },
  { pattern: /创业|创始人|决策|公司/, label: '创业共鸣' },
  { pattern: /[佩赞]服|厉害|牛|精彩|深刻/, label: '赞赏' },
  { pattern: /同意|认同|对的|没错|确实/, label: '认同' },
  { pattern: /[请问请教求解]|怎么[看做]|什么[意思]/, label: '请教' },
];

/**
 * 从用户评论中快速提取关系标签（FRAGMENT 精度）
 * @param {string} commentText - 用户评论内容
 * @returns {string} 关系标签
 */
export function extractRelationFromComment(commentText) {
  if (!commentText || commentText.length < 2) return '互动';

  // 1. 关键词匹配
  for (const kw of KEYWORD_MAP) {
    if (kw.pattern.test(commentText)) {
      return kw.label;
    }
  }

  // 2. 降级：截取有意义的前段
  const cleaned = commentText.replace(/[@#\s]/g, '').slice(0, 15);
  return cleaned || '互动';
}

// ============================================================
// 六、导出 Agent 名册（供 LLM Prompt 使用）
// ============================================================

/**
 * 获取系统中所有可识别 Agent 的名字列表（给 LLM 做参考）
 */
export function getAvailableAgentNames() {
  const seen = new Set();
  const names = [];
  for (const [, entry] of Object.entries(AGENT_ALIAS_MAP)) {
    if (entry.id === 'user') continue;
    const displayName = entry.names[0]; // 使用首选名
    if (!seen.has(displayName)) {
      seen.add(displayName);
      names.push(displayName);
    }
  }
  return names;
}

// ============================================================
// FoldNeb 对话处理（供 DialoguePanel 使用）
// ============================================================

export function generateDialogue(agentId, targetId, topic = '') {
  const templates = [
    `你对${topic || '这个方向'}的核心洞察是什么？`,
    `我一直在思考${topic || '这个问题'}，你的看法影响了我很多。`,
    `${topic || '这个领域'}的未来，你觉得最大的变数是什么？`,
  ];
  const text = templates[Math.floor(Math.random() * templates.length)];
  return { text, relationLabel: extractRelationFromComment(text) };
}

export function processDialogue(fromId, toId, topic = '') {
  const store = useNebulaStore.getState();
  const { text, relationLabel } = generateDialogue(fromId, toId, topic);
  store.addMemory(fromId, toId, relationLabel, '对话');
  const existing = store.getMemoryBetween(fromId, toId);
  const isNew = existing?.relations?.length <= 1;
  return { relationLabel, isNew, text };
}

export async function simulateConversationRound() {
  const store = useNebulaStore.getState();
  const { tier1Agents: allTier1 } = await import('../data/gameData.js');
  const results = [];
  const shuffled = [...allTier1].sort(() => Math.random() - 0.5);
  for (let i = 0; i < shuffled.length - 1; i += 2) {
    const a = shuffled[i], b = shuffled[i + 1];
    const result = processDialogue(a.id, b.id, a.tags?.[0] || '');
    results.push({ ...result, from: a.name, to: b.name });
  }
  return results;
}
