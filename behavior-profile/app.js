/* 行为档案 — 本地离线分析工具
 * 数据仅保存在浏览器 localStorage。
 * 所有推断均为启发式估计，不是心理诊断。 */
(function () {
  'use strict';

  /* ============================================================
   * 1. 常量与词典
   * ============================================================ */

  const TRAITS = [
    { key: 'O', name: '开放性', en: 'Openness', desc: '好奇、想象、尝试新事物的倾向' },
    { key: 'C', name: '尽责性', en: 'Conscientiousness', desc: '计划、条理、坚持与细节把控' },
    { key: 'E', name: '外向性', en: 'Extraversion', desc: '社交能量、表达与主动性' },
    { key: 'A', name: '宜人性', en: 'Agreeableness', desc: '合作、体谅、信任与妥协' },
    { key: 'N', name: '情绪敏感', en: 'Neuroticism', desc: '焦虑、情绪波动与压力反应' },
    { key: 'H', name: '诚实谦逊', en: 'Honesty-Humility', desc: '真诚、公平、不操纵不炫耀' }
  ];

  // 简版量表：每题 {t: 维度, rev: 是否反向计分, q: 题干}
  const SCALE_ITEMS = [
    { id: 1,  t: 'O', rev: 0, q: '我喜欢尝试新的方法和思路。' },
    { id: 2,  t: 'O', rev: 1, q: '我更愿意按熟悉的方式做事。' },
    { id: 3,  t: 'O', rev: 0, q: '我经常产生抽象或理论性的想法。' },
    { id: 4,  t: 'O', rev: 0, q: '我对艺术、音乐或文字有浓厚兴趣。' },
    { id: 5,  t: 'O', rev: 1, q: '我不喜欢需要想象力的任务。' },
    { id: 6,  t: 'O', rev: 0, q: '我乐于接触不同背景的人的观点。' },

    { id: 7,  t: 'C', rev: 0, q: '我会提前制定计划并按计划执行。' },
    { id: 8,  t: 'C', rev: 1, q: '我常常把事情拖到最后一刻。' },
    { id: 9,  t: 'C', rev: 0, q: '我对细节很在意，会反复核对。' },
    { id: 10, t: 'C', rev: 0, q: '我做事目标明确，能坚持完成。' },
    { id: 11, t: 'C', rev: 1, q: '我经常临时改变主意。' },
    { id: 12, t: 'C', rev: 0, q: '我习惯列清单并逐项完成。' },

    { id: 13, t: 'E', rev: 0, q: '我在人群中容易成为话题中心。' },
    { id: 14, t: 'E', rev: 1, q: '我喜欢独处胜过参加聚会。' },
    { id: 15, t: 'E', rev: 0, q: '我主动发起对话和社交。' },
    { id: 16, t: 'E', rev: 1, q: '我在陌生场合容易感到不自在。' },
    { id: 17, t: 'E', rev: 0, q: '我精力充沛，喜欢热闹。' },
    { id: 18, t: 'E', rev: 1, q: '我说话很少，除非被问到。' },

    { id: 19, t: 'A', rev: 0, q: '我愿意帮助别人，即使对自己不便。' },
    { id: 20, t: 'A', rev: 1, q: '我经常怀疑别人的动机。' },
    { id: 21, t: 'A', rev: 0, q: '我容易体谅他人的处境。' },
    { id: 22, t: 'A', rev: 1, q: '我更喜欢竞争而不是合作。' },
    { id: 23, t: 'A', rev: 0, q: '我愿意为了团队做出妥协。' },
    { id: 24, t: 'A', rev: 1, q: '我说话直率，不太顾及他人感受。' },

    { id: 25, t: 'N', rev: 0, q: '我容易担心还没发生的事。' },
    { id: 26, t: 'N', rev: 1, q: '面对压力我能保持冷静。' },
    { id: 27, t: 'N', rev: 0, q: '我的情绪波动比较大。' },
    { id: 28, t: 'N', rev: 1, q: '我很少感到焦虑。' },
    { id: 29, t: 'N', rev: 0, q: '批评会让我长时间难受。' },
    { id: 30, t: 'N', rev: 1, q: '我能很快从挫折中恢复。' },

    { id: 31, t: 'H', rev: 0, q: '我不会为了利益夸大自己的贡献。' },
    { id: 32, t: 'H', rev: 0, q: '我愿意承认自己的错误。' },
    { id: 33, t: 'H', rev: 1, q: '我会利用别人的弱点达成目标。' },
    { id: 34, t: 'H', rev: 0, q: '我不喜欢炫耀成就。' },
    { id: 35, t: 'H', rev: 1, q: '为了赢，我愿意讨好有权力的人。' },
    { id: 36, t: 'H', rev: 0, q: '我对财富和地位看得很淡。' }
  ];

  // 文本用词信号词典（中英文关键词）
  const LEXICON = {
    O: ['好奇','探索','尝试','创意','想象','灵感','可能性','不同','新想法','抽象','艺术','音乐','写作',' curious','explore','creative','imagine','novel','idea','abstract','art ','maybe','perhaps'],
    C: ['计划','按时','完成','核对','细节','清单','目标','坚持','效率','整理','复盘','deadline','plan','detail','check','finish','organize','goal','discipline','review'],
    E: ['聚会','朋友','聊天','社交','发言','主持','热闹','主动','大家','团队活动','一起','party','friends','talk','social','speak','lead','we ','together'],
    A: ['帮助','理解','体谅','合作','妥协','谢谢','抱歉','团队','关心','配合','让一步','help','understand','team','cooperate','sorry','thanks','care','sorry'],
    N: ['担心','焦虑','紧张','害怕','压力','崩溃','睡不着','情绪','难受','生气','烦','怕','不确定','worry','anxious','stress','afraid','nervous','upset','scared','maybe'],
    H: ['诚实','承认','错误','谦逊','低调','公平','原则','不炫耀','透明','honest','admit','humble','fair','principle','transparent']
  };

  // 情境类别标签
  const CONTEXTS = [
    '高压/截止', '冲突/反对', '不确定/模糊', '社交/公开', '亲密/信任',
    '评价/批评', '竞争/成就', '规则/流程', '变化/风险', '帮助/求助'
  ];

  // 情境词 → 类别（自动归类）
  const CONTEXT_KW = {
    '高压/截止': ['压力','截止','deadline','赶','期限','紧张','加班','紧急','来不及'],
    '冲突/反对': ['冲突','反对','批评','质疑','争执',' disagreement','conflict','argue','pushback','争吵','分歧'],
    '不确定/模糊': ['不确定','模糊','未知','信息不足','没想清楚','uncertain','unclear','ambiguity','unknown'],
    '社交/公开': ['公开','会议','演讲','聚会','社交','多人','众人','meeting','presentation','party','public','crowd'],
    '亲密/信任': ['家人','伴侣','朋友','信任','亲密','私下','family','partner','trust','close','intimate'],
    '评价/批评': ['评价','表扬','认可','反馈','考核','打分','review','praise','feedback','appraisal'],
    '竞争/成就': ['竞争','赢','目标','排名','业绩','竞赛','compete','win','goal','rank','achievement'],
    '规则/流程': ['规则','流程','制度','标准','合规','审批','rule','process','policy','compliance'],
    '变化/风险': ['变化','改动','风险','突发','临时','变更','change','risk','sudden','unexpected'],
    '帮助/求助': ['求助','帮忙','支持','请教','依赖','help','support','ask','rely']
  };

  // 行为类别
  const BEHAVIORS = [
    '主动推进', '回避退缩', '情绪表达', '理性分析',
    '合作协调', '竞争主导', '谨慎核实', '即兴尝试'
  ];

  // 行为词 → 类别（自动归类）
  const BEHAVIOR_KW = {
    '主动推进': ['主动','推进','发起','决定','承担','牵头','先做','initiate','proactive','decide','lead','take charge'],
    '回避退缩': ['回避','拖延','退缩','沉默','离开','不表态','拖','avoid','delay','withdraw','silent','postpone'],
    '情绪表达': ['生气','哭','焦虑','发泄','情绪','激动','沮丧','愤怒','angry','cry','upset','emotional','frustrated'],
    '理性分析': ['分析','权衡','数据','逻辑','拆解','列清单','比较','analyze','logic','data','reason','break down'],
    '合作协调': ['沟通','协调','配合','妥协','帮助','商量','consensus','cooperate','coordinate','help','compromise'],
    '竞争主导': ['反驳','坚持','控制','主导','争取','不让步','争论','dominate','insist','control','compete','argue'],
    '谨慎核实': ['核对','确认','检查','反复','保守','验证','双保险','verify','check','confirm','cautious','double-check'],
    '即兴尝试': ['尝试','临时','灵活','即兴','冒险','试一下',' improvise','try','flexible','experiment','ad hoc','risk']
  };

  // 主题词（用于归纳反复出现的模式）
  const THEMES = {
    '控制感需求': ['控制','计划','流程','核对','确定','安全','把握','规则'],
    '被认可需求': ['认可','表扬','评价','面子','被看见','肯定','证明'],
    '回避冲突': ['避免','不表态','沉默','忍','绕开','不想起冲突','和气'],
    '独立自立': ['自己','独立','不麻烦','独自','靠自己','自主'],
    '关系维护': ['关系','照顾','体谅','感受','团队','我们','氛围'],
    '探索成长': ['新','学习','尝试','成长','改进','优化','不同'],
    '风险警惕': ['风险','担心','怕出错','谨慎','万一','预防'],
    '效率导向': ['效率','快','结果','产出',' deadline','赶','优先级']
  };

  // 状态与特质映射（用于预测先验）
  const TRAIT_PRIOR = {
    '主动推进': { E: 0.45, C: 0.25, O: 0.15, A: -0.05, N: -0.05, H: 0.05 },
    '回避退缩': { E: -0.35, C: -0.15, O: -0.1, A: 0.05, N: 0.35, H: 0 },
    '情绪表达': { E: 0.15, C: -0.15, O: 0.1, A: -0.1, N: 0.5, H: 0 },
    '理性分析': { E: -0.05, C: 0.4, O: 0.25, A: -0.05, N: -0.2, H: 0.05 },
    '合作协调': { E: 0.25, C: 0.1, O: 0.05, A: 0.5, N: -0.1, H: 0.25 },
    '竞争主导': { E: 0.3, C: 0.15, O: 0.05, A: -0.45, N: 0.1, H: -0.3 },
    '谨慎核实': { E: -0.05, C: 0.5, O: -0.1, A: 0.05, N: 0.25, H: 0.1 },
    '即兴尝试': { E: 0.15, C: -0.35, O: 0.5, A: 0.05, N: 0, H: 0.05 }
  };

  /* ============================================================
   * 2. 存储与状态
   * ============================================================ */

  const STORE_KEY = 'behavior_profile_v1';
  let DB = { version: 1, activeId: null, profiles: [] };
  let currentPrediction = null;

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function loadDB() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.profiles)) DB = parsed;
      }
    } catch (e) { console.warn('读取本地数据失败', e); }
    if (!DB.profiles.length) {
      DB.profiles.push(emptyProfile('默认档案'));
      DB.activeId = DB.profiles[0].id;
      saveDB();
    }
    if (!DB.profiles.find(p => p.id === DB.activeId)) DB.activeId = DB.profiles[0].id;
  }

  function saveDB() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); }
    catch (e) { toast('保存失败：本地存储不可用'); }
  }

  function emptyProfile(name) {
    return {
      id: uid(), name: name || '未命名档案', role: '', relation: '', notes: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      observations: [], texts: [], scale: {}, rhythm: []
    };
  }

  function P() { return DB.profiles.find(p => p.id === DB.activeId); }
  function touch() { const p = P(); if (p) p.updatedAt = new Date().toISOString(); }

  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ============================================================
   * 3. 分析引擎
   * ============================================================ */

  // ---- 文本信号工具：归一化、词边界匹配、否定识别、IDF ----
  function normText(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/[\uFF01-\uFF5E]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
      .replace(/\s+/g, ' ').trim();
  }
  function escRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function avg(a) { return a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0; }
  function sd(a) { if (a.length < 2) return 0; const m = avg(a); return Math.sqrt(a.reduce((x,y)=>x+(y-m)*(y-m),0)/(a.length-1)); }
  function sigmoid(z) { return 1/(1+Math.exp(-z)); }

  const NEGATORS = ['并不','从未','从不','很少','没有','不是','不能','不会','没','不','无','别','非','未','never','not','hardly','rarely','without'];
  function isNegationTerm(t) { return /^(不|没|无|别|非|未|never|not\b|hardly|rarely|without)/i.test(t); }

  function findSpans(text, terms) {
    const s = normText(text);
    const spans = [];
    terms.forEach(t => {
      const tt = normText(t); if (!tt) return;
      const re = /^[a-z0-9]/.test(tt) ? new RegExp('\\b' + escRe(tt) + '\\b','g') : new RegExp(escRe(tt),'g');
      let m;
      while ((m = re.exec(s)) !== null) {
        spans.push({ start: m.index, end: m.index + tt.length, term: tt });
        if (m.index + tt.length >= s.length) break;
      }
    });
    spans.sort((a,b) => (b.end-b.start)-(a.end-a.start) || a.start-b.start);
    const chosen = [];
    for (const sp of spans) {
      let hit = false;
      for (const o of chosen) { if (sp.start < o.end && sp.end > o.start) { hit = true; break; } }
      if (!hit) chosen.push(sp);
    }
    return { s, spans: chosen };
  }

  function termHits(text, terms, idf) {
    const { s, spans } = findSpans(text, terms);
    let pos = 0, neg = 0;
    spans.forEach(sp => {
      const w = idf ? (idf[sp.term] || 1) : 1;
      const pre = s.slice(Math.max(0, sp.start - 6), sp.start);
      const inverted = !isNegationTerm(sp.term) && NEGATORS.some(n => pre.indexOf(normText(n)) !== -1);
      if (inverted) neg += w; else pos += w;
    });
    return { pos, neg, total: pos + neg };
  }

  function countHits(text, words) { return Math.round(termHits(text, words, null).total); }

  function buildIdf(docs) {
    const all = [];
    ['LEXICON','CONTEXT_KW','BEHAVIOR_KW','THEMES'].forEach(name => {
      const dict = name === 'LEXICON' ? LEXICON : (name === 'CONTEXT_KW' ? CONTEXT_KW : (name === 'BEHAVIOR_KW' ? BEHAVIOR_KW : THEMES));
      Object.keys(dict).forEach(k => dict[k].forEach(t => all.push(normText(t))));
    });
    const terms = Array.from(new Set(all));
    const idf = {};
    terms.forEach(t => {
      let df = 0;
      docs.forEach(d => { if (findSpans(d, [t]).spans.length) df++; });
      idf[t] = Math.log((docs.length + 1)/(df + 1)) + 1;
    });
    return idf;
  }

  // ---- 量表效度：直线作答、正反向题一致性 ----
  function scaleValidity(p) {
    const items = SCALE_ITEMS.map(i => ({ i, v: Number(p.scale[i.id]) })).filter(x => x.v >= 1 && x.v <= 5);
    const flags = [];
    if (!items.length) return { n:0, flags, perTrait:{}, consistency:null, straightline:false, usable:false };
    const vals = items.map(x => x.v);
    const straightline = items.length >= 12 && new Set(vals).size === 1;
    if (straightline) flags.push('所有题目作答相同，可能存在直线作答，量表信息量下降');
    const perTrait = {};
    TRAITS.forEach(t => {
      const its = items.filter(x => x.i.t === t.key);
      if (its.length < 3) return;
      const f = its.filter(x => !x.i.rev).map(x => x.v);
      const r = its.filter(x => x.i.rev).map(x => 6 - x.v);
      if (!f.length || !r.length) return;
      const mf = avg(f), mr = avg(r), diff = Math.abs(mf - mr);
      const spread = sd(its.map(x => x.v));
      const consistent = diff <= Math.max(0.9, (spread || 1) * 0.9);
      perTrait[t.key] = { forward: mf, reverse: mr, diff, consistent };
      if (!consistent) flags.push(t.name + '正反向题作答不一致（差 ' + diff.toFixed(1) + '），该维度量表权重降低');
    });
    const checked = Object.keys(perTrait);
    const consistentCount = checked.filter(k => perTrait[k].consistent).length;
    return {
      n: items.length, flags, perTrait, straightline,
      consistency: checked.length ? consistentCount / checked.length : null,
      usable: items.length >= 6
    };
  }

  // ---- 行为标签 → 特质方向证据 ----
  const TAG_TRAIT = {
    '主动推进': { E:1, C:.35, O:.3 },
    '回避退缩': { E:-1, N:.6, C:-.4 },
    '情绪表达': { N:1, E:.3, A:-.3 },
    '理性分析': { C:.7, O:.5, N:-.5 },
    '合作协调': { A:1, E:.4, H:.3 },
    '竞争主导': { A:-1, E:.4, H:-.5 },
    '谨慎核实': { C:1, N:.4, O:-.3 },
    '即兴尝试': { O:1, C:-.6, E:.2 }
  };

  function dirichletScore(h, H, K) {
    const s = (h + 1)/(H + K);
    const z = (s - 1/K)/(1/K);
    return clamp(100 * sigmoid(2*z), 0, 100);
  }
  function dirichletSE(H, K) { return clamp(50 * Math.sqrt(K/(H + K + 1)), 6, 32); }

  function streamScale(p, trait, validity) {
    const items = SCALE_ITEMS.filter(i => i.t === trait.key && Number(p.scale[i.id]) >= 1 && Number(p.scale[i.id]) <= 5);
    if (!items.length) return null;
    const vals = items.map(i => { const v = Number(p.scale[i.id]); return i.rev ? 6 - v : v; });
    const score = clamp((avg(vals) - 1)/4*100, 0, 100);
    let se = clamp((sd(vals) || 18)/Math.sqrt(items.length)*25/4, 6, 26);
    const pv = validity.perTrait[trait.key];
    if (pv && !pv.consistent) se *= 1.7;
    if (validity.straightline) se *= 1.5;
    if (items.length < 4) se *= 1.35;
    return { source:'量表', score, se:clamp(se,6,40), n:items.length, total:6,
             reliable:!pv || pv.consistent };
  }

  function streamTexts(docs, idf) {
    if (!docs.length) return null;
    const K = TRAITS.length, H = {}, out = {};
    TRAITS.forEach(t => H[t.key] = 0);
    let negated = 0, chars = 0;
    docs.forEach(doc => {
      const text = typeof doc === 'string' ? doc : (doc.text || '');
      chars += text.length;
      TRAITS.forEach(t => {
        const r = termHits(text, LEXICON[t.key], idf);
        H[t.key] += r.pos; negated += r.neg;
      });
    });
    const total = Object.values(H).reduce((a,b)=>a+b,0) + negated*0.5;
    TRAITS.forEach(t => {
      out[t.key] = { source:'文本', score:dirichletScore(H[t.key], total, K),
        se:dirichletSE(total,K) * (docs.length < 2 ? 1.2 : 1),
        n:Math.round(H[t.key]), total:Math.round(total), chars, docs:docs.length,
        negated:Math.round(negated), reliable:true };
    });
    return out;
  }

  function streamObs(p, idf) {
    const K = TRAITS.length, H = {}, out = {};
    TRAITS.forEach(t => H[t.key] = 0);
    let negAcc = 0, tagged = 0, parsed = 0;
    p.observations.forEach(o => {
      parsed++;
      const tags = o.behaviorTags || [];
      if (tags.length) tagged++;
      const age = o.date ? Math.max(0, (Date.now() - new Date(o.date).getTime())/86400000) : 0;
      const rec = 0.7 + 0.3*Math.exp(-age/90);
      tags.forEach(b => {
        const sig = TAG_TRAIT[b] || {};
        TRAITS.forEach(t => { const v = sig[t.key] || 0; if (v > 0) H[t.key] += v*rec; else if (v < 0) negAcc += -v*rec*0.7; });
      });
      TRAITS.forEach(t => {
        const r = termHits(o.interpretation || '', LEXICON[t.key], idf);
        H[t.key] += r.pos*0.35*rec; negAcc += r.neg*0.35*0.5;
      });
    });
    const total = Object.values(H).reduce((a,b)=>a+b,0) + negAcc;
    TRAITS.forEach(t => {
      out[t.key] = { source:'观察', score:dirichletScore(H[t.key], total, K),
        se:dirichletSE(total,K) * (parsed < 3 ? 1.2 : 1),
        n:Math.round(H[t.key]), total:Math.round(total), observations:parsed, tagged,
        reliable:tagged >= 2 };
    });
    return out;
  }

  // ---- 逆方差 + 随机效应 + 向中性收缩的贝叶斯融合 ----
  function fuseStreams(streams) {
    const valid = streams.filter(Boolean);
    if (!valid.length) return { score:50, se:20, conf:0.02, streams:[], consistency:null, conflicts:[], raw:50, tau2:0 };
    const k = valid.length;
    let w = valid.map(s => 1/Math.pow(Math.max(s.se,4),2));
    let sw = w.reduce((a,b)=>a+b,0);
    let mu = w.reduce((a,wi,i)=>a+wi*valid[i].score,0)/sw;
    const Q = w.reduce((a,wi,i)=>a+wi*Math.pow(valid[i].score-mu,2),0);
    const C = sw - w.reduce((a,wi)=>a+wi*wi,0)/sw;
    const tau2 = k > 1 ? Math.max(0,(Q-(k-1))/(C || 1)) : 0;
    w = valid.map(s => 1/(Math.pow(Math.max(s.se,4),2)+tau2));
    sw = w.reduce((a,b)=>a+b,0);
    mu = w.reduce((a,wi,i)=>a+wi*valid[i].score,0)/sw;
    const rawSE = Math.sqrt(1/sw);
    const I2 = Q > 0 ? clamp((Q-(k-1))/Q,0,1) : 0;
    const priorP = 1/(20*20), dataP = 1/(rawSE*rawSE);
    const post = (mu*dataP + 50*priorP)/(dataP+priorP);
    const postSE = Math.sqrt(1/(dataP+priorP));
    const conflicts = valid.filter(s => Math.abs(s.score-mu) > 1.5*Math.sqrt(s.se*s.se+tau2)).map(s => s.source);
    return { score:clamp(post,0,100), se:postSE, conf:clamp(1-postSE/28,0.02,0.98),
             streams:valid, consistency:1-I2, conflicts, raw:mu, tau2 };
  }

  // ---- 引擎缓存：按档案指纹复用分析结果 ----
  let engineCache = { key:null, data:null };
  function engineKey(p) {
    return [p.id, p.updatedAt, p.observations.length, p.texts.length,
      Object.keys(p.scale).length, p.rhythm.length].join('|');
  }
  function getAnalysis(p) {
    const key = engineKey(p);
    if (engineCache.key === key && engineCache.data) return engineCache.data;
    const validity = scaleValidity(p);
    const textDocs = p.texts.filter(t => (t.text||'').trim()).map(t => t.text);
    const docs = textDocs.concat(p.observations.map(o => [o.situation,o.behavior,o.interpretation].filter(Boolean).join(' ')));
    const idf = buildIdf(docs.length ? docs : ['']);
    const scaleS = {}, textS = streamTexts(textDocs, idf), obsS = streamObs(p, idf);
    const traits = {};
    TRAITS.forEach(t => {
      scaleS[t.key] = streamScale(p, t, validity);
      const fused = fuseStreams([scaleS[t.key], textS && textS[t.key], obsS && obsS[t.key]]);
      traits[t.key] = fused;
    });
    const data = { validity, traits, idf, docs,
      patterns: minePatterns(p), themes: mineThemes(p, idf, docs), state: stateVsTrait(p) };
    engineCache = { key, data };
    return data;
  }

  function analyzeTraits(p) { return getAnalysis(p).traits; }

  function autoTags(text, dict, idf) {
    const out = [];
    Object.keys(dict).forEach(k => { if (termHits(text, dict[k], idf).pos > 0) out.push(k); });
    return out;
  }

  function obsContexts(o, idf) {
    return (o.contextTags || []).length ? o.contextTags : autoTags(o.situation, CONTEXT_KW, idf);
  }
  function obsBehaviors(o, idf) {
    return (o.behaviorTags || []).length ? o.behaviorTags : autoTags(o.behavior, BEHAVIOR_KW, idf);
  }

  // Wilson 二项置信区间：小样本比正态近似可靠
  function wilson(k, n, z) {
    z = z || 1.96;
    if (!n) return { low:0, high:1, mid:0 };
    const p = k/n, d = 1 + z*z/n;
    const c = (p + z*z/(2*n))/d;
    const h = z*Math.sqrt(p*(1-p)/n + z*z/(4*n*n))/d;
    return { low:clamp(c-h,0,1), high:clamp(c+h,0,1), mid:p };
  }
  function normalCDF(x) {
    const t = 1/(1 + 0.2316419*Math.abs(x));
    const d = 0.3989422804014327*Math.exp(-x*x/2);
    let p = d*t*(0.319381530 + t*(-0.356563782 + t*(1.781477937 + t*(-1.821255978 + t*1.330274429))));
    return x > 0 ? 1 - p : p;
  }

  function minePatterns(p) {
    const N = p.observations.length;
    if (!N) return [];
    const K = BEHAVIORS.length;
    const counts = {};
    BEHAVIORS.forEach(b => counts[b] = p.observations.filter(o => obsBehaviors(o).includes(b)).length);
    const rows = [];
    CONTEXTS.forEach(c => {
      BEHAVIORS.forEach(b => {
        let support = 0, withC = 0;
        p.observations.forEach(o => {
          const cs = obsContexts(o), bs = obsBehaviors(o);
          if (cs.includes(c)) { withC++; if (bs.includes(b)) support++; }
        });
        if (!support || !withC) return;
        const pObs = support/withC;
        const pSmoothed = (support + 1/K)/(withC + 1);
        const baseRate = (counts[b] + 1/K)/(N + 1);
        const lift = pSmoothed/Math.max(baseRate, 1e-6);
        const ci = wilson(support, withC);
        const se = Math.sqrt(Math.max(baseRate*(1-baseRate),1e-6)/withC);
        const z = se > 0 ? (pObs - baseRate)/se : 0;
        const pval = 2*(1-normalCDF(Math.abs(z)));
        rows.push({ context:c, behavior:b, support, withC, confidence:pSmoothed,
          rawConfidence:pObs, ciLow:ci.low, ciHigh:ci.high, baseRate, lift, z,
          pval, significant:pval < 0.05, robust:pval < 0.05/(CONTEXTS.length*K) });
      });
    });
    return rows.sort((a,b) => b.support - a.support || b.lift - a.lift);
  }

  function mineThemes(p, idf, docs) {
    if (!docs || !docs.length) return [];
    const rows = [];
    Object.keys(THEMES).forEach(k => {
      let weighted = 0, raw = 0, df = 0;
      docs.forEach(d => {
        const h = termHits(d, THEMES[k], idf);
        weighted += h.pos; raw += Math.round(h.pos);
        if (h.pos > 0) df++;
      });
      if (raw > 0) rows.push({ theme:k, count:raw, weighted, docs:df });
    });
    return rows.sort((a,b) => b.weighted - a.weighted);
  }

  function stateVsTrait(p) {
    if (p.rhythm.length < 4) return { enough:false, reason:'至少需要 4 天节律记录' };
    const sorted = p.rhythm.slice().sort((a,b) => (a.date||'').localeCompare(b.date||''));
    const split = Math.max(2, Math.floor(sorted.length/2));
    const early = sorted.slice(0, split), recent = sorted.slice(split);
    if (recent.length < 2) return { enough:false, reason:'前后两段都需要至少 2 天记录' };
    const vals = (arr,k) => arr.map(x => Number(x[k])).filter(n => !isNaN(n));
    const metrics = ['mood','stress','sleep','social','focus'];
    const out = [];
    metrics.forEach(k => {
      const a = vals(early,k), b = vals(recent,k);
      if (a.length < 2 || b.length < 2) return;
      const ma = avg(a), mb = avg(b);
      const pooled = Math.sqrt((sd(a)*sd(a) + sd(b)*sd(b))/2);
      const floor = (k === 'mood' || k === 'stress') ? 0.35 : 0.6;
      const d = (mb - ma)/Math.max(pooled, floor);
      const xs = sorted.map((r,i) => ({ x:i, y:Number(r[k]) })).filter(o => !isNaN(o.y));
      const mx = avg(xs.map(o=>o.x)), my = avg(xs.map(o=>o.y));
      const den = xs.reduce((s,o)=>s+(o.x-mx)*(o.x-mx),0);
      const slope = den > 0 ? xs.reduce((s,o)=>s+(o.x-mx)*(o.y-my),0)/den : 0;
      out.push({ key:k, early:ma, recent:mb, delta:mb-ma, d,
        magnitude:Math.abs(d) < 0.2 ? '微小' : Math.abs(d) < 0.5 ? '小' : Math.abs(d) < 0.8 ? '中等' : '大',
        slope, trend:slope > 0.03 ? '上升' : slope < -0.03 ? '下降' : '平稳' });
    });
    const meaningful = out.filter(x => Math.abs(x.d) >= 0.6);
    return { enough:true, rows:out, shifted:meaningful.length > 0, shiftedRows:meaningful,
             earlyN:early.length, recentN:recent.length };
  }

  // 人格先验：logit 加权后 softmax，得到归一化的行为先验分布
  function traitPriorDist(traits) {
    const B = BEHAVIORS.length;
    const out = {};
    let maxLogit = -Infinity;
    const logits = {};
    BEHAVIORS.forEach(b => {
      const w = TRAIT_PRIOR[b] || {};
      let s = 0;
      TRAITS.forEach(t => {
        const tr = traits && traits[t.key];
        if (!tr) return;
        const z = ((tr.score - 50)/50) * (0.4 + 0.6*tr.conf);
        s += (w[t.key] || 0) * z;
      });
      logits[b] = Math.log(1/B) + 1.1*s;
      if (logits[b] > maxLogit) maxLogit = logits[b];
    });
    let sum = 0;
    BEHAVIORS.forEach(b => { out[b] = Math.exp(logits[b] - maxLogit); sum += out[b]; });
    BEHAVIORS.forEach(b => out[b] /= (sum || 1));
    return out;
  }

  function traitStrength(traits) {
    const confs = TRAITS.map(t => traits && traits[t.key] ? traits[t.key].conf : 0);
    return clamp(avg(confs), 0, 0.95);
  }

  function predictBehavior(p, situation, selectedContexts) {
    const a = getAnalysis(p);
    const traits = a.traits, st = a.state, N = p.observations.length, B = BEHAVIORS.length;
    const ctxWeight = {};
    CONTEXTS.forEach(c => {
      let w = (selectedContexts || []).indexOf(c) !== -1 ? 1 : 0;
      const h = termHits(situation || '', CONTEXT_KW[c], a.idf);
      if (h.pos > 0) w = Math.max(w, clamp(0.35 + 0.22*Math.log2(1 + h.pos), 0, 1));
      ctxWeight[c] = w;
    });
    const contexts = CONTEXTS.filter(c => ctxWeight[c] > 0);
    const mode = !N ? 'cold' : (!contexts.length ? 'unseen' : 'matched');

    const prior = traitPriorDist(traits);
    const baseCounts = {};
    BEHAVIORS.forEach(b => baseCounts[b] = p.observations.filter(o => obsBehaviors(o, a.idf).includes(b)).length);

    const likelihood = {}, histN = {};
    BEHAVIORS.forEach(b => {
      let num = 0, den = 0;
      contexts.forEach(c => {
        let k = 0, n = 0;
        p.observations.forEach(o => {
          if (obsContexts(o, a.idf).includes(c)) { n++; if (obsBehaviors(o, a.idf).includes(b)) k++; }
        });
        const precision = Math.sqrt(n);
        num += ctxWeight[c] * ((k + 1/B)/(n + 1)) * precision;
        den += ctxWeight[c] * precision;
      });
      likelihood[b] = den > 0 ? num/den : null;
      histN[b] = den;
    });

    const tStrength = traitStrength(traits);
    const temperature = clamp(1.45 - 0.09*Math.log(1 + N), 0.85, 1.45);
    const rows = BEHAVIORS.map(b => {
      const base = (baseCounts[b] + 0.5)/(N + B*0.5);
      const wHist = clamp(0.75*histN[b]/(histN[b] + 2.5), 0, 0.75);
      let logp;
      if (likelihood[b] !== null && wHist > 0) {
        logp = wHist*Math.log(likelihood[b]) + (1-wHist)*(tStrength*Math.log(prior[b]) + (1-tStrength)*Math.log(base));
      } else {
        logp = tStrength*Math.log(prior[b]) + (1-tStrength)*Math.log(base);
      }
      if (st.enough) {
        const stress = st.rows.find(r => r.key === 'stress'), mood = st.rows.find(r => r.key === 'mood');
        if (stress && stress.d > 0.6 && (b === '情绪表达' || b === '回避退缩')) logp += 0.12*stress.d;
        if (mood && mood.d < -0.6 && b === '回避退缩') logp += 0.10*Math.abs(mood.d);
        if (mood && mood.d < -0.6 && b === '主动推进') logp -= 0.08*Math.abs(mood.d);
      }
      return { behavior:b, logp, support:contexts.reduce((s,c) => {
        const k = p.observations.filter(o => obsContexts(o,a.idf).includes(c) && obsBehaviors(o,a.idf).includes(b)).length;
        return s + k*ctxWeight[c];
      }, 0) };
    });
    const mx = Math.max.apply(null, rows.map(r => r.logp));
    const exps = rows.map(r => Math.exp((r.logp - mx)/temperature));
    const esum = exps.reduce((x,y)=>x+y,0) || 1;
    const nEff = Math.max(3, N + Math.round(tStrength*4));
    rows.forEach((r,i) => {
      r.prob = exps[i]/esum;
      const ci = wilson(r.prob*nEff, nEff);
      const widen = mode === 'cold' ? 1.6 : (mode === 'unseen' ? 1.3 : 1);
      r.low = clamp(ci.low - (widen-1)*0.08, 0, 1);
      r.high = clamp(ci.high + (widen-1)*0.08, 0, 1);
      r.evidence = clamp(0.18 + 0.55*histN[r.behavior]/(histN[r.behavior]+3) + 0.25*tStrength, 0.18, 0.95);
    });
    return { situation, contexts, contextWeights:ctxWeight, mode,
      rows:rows.sort((x,y) => y.prob - x.prob), traits, state:st, nObs:N,
      traitStrength:tStrength };
  }

  /* ============================================================
   * 4. 渲染
   * ============================================================ */

  function renderProfileSelect() {
    const sel = document.getElementById('profileSelect');
    sel.innerHTML = DB.profiles.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
    sel.value = DB.activeId;
  }

  function renderMeta() {
    const p = P(); if (!p) return;
    document.getElementById('metaName').value = p.name || '';
    document.getElementById('metaRole').value = p.role || '';
    document.getElementById('metaRelation').value = p.relation || '';
    document.getElementById('metaNotes').value = p.notes || '';
    document.getElementById('pageSub').textContent = '当前档案：' + p.name;
  }

  function renderCoverage() {
    const p = P(); if (!p) return;
    const a = getAnalysis(p);
    const tr = a.traits;
    const answered = a.validity.n;
    const texts = p.texts.reduce((a,t) => a + (t.text||'').length, 0);
    const rows = [
      { k: '情境—行为观察', v: p.observations.length, unit: '条', ok: p.observations.length >= 5 },
      { k: '文本样本', v: texts, unit: '字', ok: texts >= 300 },
      { k: '量表作答', v: answered, unit: '/' + SCALE_ITEMS.length, ok: answered >= 24 },
      { k: '节律记录', v: p.rhythm.length, unit: '天', ok: p.rhythm.length >= 7 }
    ];
    document.getElementById('coverageStats').innerHTML = rows.map(r =>
      `<div class="stat"><div class="k">${r.k}</div><div class="v">${r.v}<small> ${r.unit}</small></div>
       <div style="margin-top:4px"><span class="tag ${r.ok?'green':'amber'}">${r.ok?'充足':'偏少'}</span></div></div>`).join('');

    const conflicts = TRAITS.filter(t => tr[t.key].conflicts.length);
    const v = a.validity;
    const qItems = [];
    if (!answered) qItems.push('<span class="tag amber">量表未作答</span> 人格分数仅来自文本/观察，或者停在中性参考点。');
    v.flags.forEach(f => qItems.push(`<span class="tag ${v.straightline && f.indexOf('所有题目')===0?'red':'amber'}">量表一致性</span> ` + esc(f)));
    if (conflicts.length) qItems.push(`<span class="tag red">证据冲突</span> ${conflicts.map(t=>t.name).join('、')} 的数据流彼此不一致，已扩大不确定区间并降低置信度。`);
    if (p.observations.length && p.observations.filter(o => (o.behaviorTags||[]).length).length < Math.max(2, p.observations.length/2))
      qItems.push('<span class="tag amber">标签不足</span> 多数观察没有行为类别标签，自动归类只作兜底。');
    if (!qItems.length) qItems.push('<span class="tag green">未发现明显异常</span> 当前数据未见直线作答或显著证据冲突。');
    document.getElementById('qualityBox').innerHTML = qItems.map(s => `<div class="small" style="margin-bottom:6px">${s}</div>`).join('');

    const conf = TRAITS.map(t => tr[t.key].conf);
    const avgConf = avg(conf);
    const top = TRAITS.slice().sort((a,b)=>tr[b.key].score-tr[a.key].score).slice(0,2);
    const low = TRAITS.slice().sort((a,b)=>tr[a.key].score-tr[b.key].score).slice(0,2);
    const patterns = a.patterns.filter(r => r.significant).slice(0,3);
    const fallback = a.patterns.slice(0,3);
    const shown = patterns.length ? patterns : fallback;
    let html = `<div class="grid grid-2">
      <div>
        <p><strong>整体置信度：</strong>${(avgConf*100).toFixed(0)}% — ${avgConf>0.7?'证据较充分':avgConf>0.45?'中等，建议补充数据':'偏低，结论应视为粗略假设'}</p>
        <p><strong>较突出的维度：</strong>${top.map(t=>t.name+' '+tr[t.key].score.toFixed(0)).join('、')}</p>
        <p><strong>相对较低的维度：</strong>${low.map(t=>t.name+' '+tr[t.key].score.toFixed(0)).join('、')}</p>
        ${conflicts.length ? `<p class="small muted">注意：${conflicts.map(t=>t.name).join('、')} 存在证据冲突，分数区间较宽。</p>` : ''}
        ${p.observations.length ? '' : '<p class="muted small">尚无观察记录，当前分数主要来自量表或文本，覆盖面有限。</p>'}
      </div>
      <div>
        <p><strong>${patterns.length?'较显著的':'最常出现的'}情境→行为：</strong></p>
        ${shown.length ? shown.map(r=>`<div class="small">· ${esc(r.context)} → ${esc(r.behavior)}（${r.support}/${r.withC} 次，条件 ${(r.confidence*100).toFixed(0)}%，区间 ${(r.ciLow*100).toFixed(0)}–${(r.ciHigh*100).toFixed(0)}%${r.significant?'，显著':''}）</div>`).join('') : '<p class="muted small">暂无足够观察。</p>'}
      </div></div>`;
    document.getElementById('overviewSummary').innerHTML = html;
  }

  function buildCheckline(el, items, prefix, checked) {
    el.innerHTML = items.map(x => `<label><input type="checkbox" data-prefix="${prefix}" value="${esc(x)}" ${checked && checked.includes(x)?'checked':''}> ${esc(x)}</label>`).join('');
  }

  function renderEntryLists() {
    const p = P(); if (!p) return;
    document.getElementById('obsList').innerHTML = p.observations.length ? p.observations.slice().reverse().map(o =>
      `<div class="list-item"><div class="li-head"><span class="li-title">${esc(o.situation||'未标注情境')} → ${esc((o.behaviorTags||[]).join('、')||'未分类')}</span><span class="li-date">${esc(o.date)}</span></div>
       <p>${esc(o.behavior)}</p>
       <p class="muted small">解读：${esc(o.interpretation||'—')}　强度 ${esc(o.intensity)}/5</p>
       <div>${(o.contextTags||[]).map(x=>`<span class="tag blue">${esc(x)}</span>`).join('')}${(o.behaviorTags||[]).map(x=>`<span class="tag green">${esc(x)}</span>`).join('')}</div>
       <div class="row-actions" style="margin-top:8px"><button class="btn tiny danger" data-del-obs="${o.id}">删除</button></div></div>`).join('')
      : '<div class="notice">还没有观察记录。</div>';

    document.getElementById('textList').innerHTML = p.texts.length ? p.texts.slice().reverse().map(t =>
      `<div class="list-item"><div class="li-head"><span class="li-title">${esc(t.source||'未标注来源')}</span><span class="li-date">${t.date||''} · ${(t.text||'').length} 字</span></div>
       <p>${esc((t.text||'').slice(0,160))}${(t.text||'').length>160?'…':''}</p>
       <div class="row-actions" style="margin-top:8px"><button class="btn tiny danger" data-del-text="${t.id}">删除</button></div></div>`).join('')
      : '<div class="notice">还没有文本样本。</div>';

    document.getElementById('rhythmList').innerHTML = p.rhythm.length ? p.rhythm.slice().reverse().slice(0,20).map(r =>
      `<div class="list-item"><div class="li-head"><span class="li-title">${esc(r.date)}　睡眠 ${esc(r.sleep||'—')}h · 社交 ${esc(r.social||'—')}h · 专注 ${esc(r.focus||'—')}h</span><span class="li-date">情绪 ${esc(r.mood)}/5 · 压力 ${esc(r.stress)}/5</span></div>
       ${r.note?`<p class="muted small">${esc(r.note)}</p>`:''}
       <div class="row-actions" style="margin-top:8px"><button class="btn tiny danger" data-del-rh="${r.id}">删除</button></div></div>`).join('')
      : '<div class="notice">还没有节律记录。</div>';
  }

  function renderScale() {
    const p = P(); if (!p) return;
    document.getElementById('scaleContainer').innerHTML = SCALE_ITEMS.map(i =>
      `<div class="scale-item"><div class="q">${i.id}. ${esc(i.q)}</div>
       <div class="likert">${[1,2,3,4,5].map(v=>`<label><input type="radio" name="s${i.id}" value="${v}" ${Number(p.scale[i.id])===v?'checked':''}><span>${v}</span></label>`).join('')}</div></div>`).join('');
  }

  function radarSVG(traits) {
    const cx = 180, cy = 150, R = 108, n = TRAITS.length;
    const pt = (i, r) => { const a = -Math.PI/2 + i*2*Math.PI/n; return [cx + Math.cos(a)*r, cy + Math.sin(a)*r]; };
    let s = `<svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg">`;
    for (let ring=1; ring<=4; ring++) {
      const r = R*ring/4;
      const pts = TRAITS.map((_,i)=>pt(i,r).join(',')).join(' ');
      s += `<polygon points="${pts}" fill="none" stroke="#e3e6ec" stroke-width="1"/>`;
    }
    TRAITS.forEach((_,i)=>{ const [x,y]=pt(i,R); s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#e3e6ec"/>`; });
    const poly = TRAITS.map((t,i)=>pt(i, R*traits[t.key].score/100).join(',')).join(' ');
    s += `<polygon points="${poly}" fill="rgba(52,87,213,.18)" stroke="#3457d5" stroke-width="2"/>`;
    TRAITS.forEach((t,i)=>{
      const [x,y]=pt(i,R*traits[t.key].score/100);
      s += `<circle cx="${x}" cy="${y}" r="3" fill="#3457d5"/>`;
      const [lx,ly]=pt(i,R+22);
      s += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#5c6472">${t.name}</text>`;
    });
    s += '</svg>'; return s;
  }

  function renderTraits() {
    const p = P(); if (!p) return;
    const a = getAnalysis(p), tr = a.traits;
    document.getElementById('radar').innerHTML = radarSVG(tr);
    document.getElementById('traitBars').innerHTML = TRAITS.map(t =>
      `<div class="trait-row"><div class="name">${t.name}<small>${t.en}</small></div>
       <div class="bar"><i style="width:${tr[t.key].score.toFixed(1)}%"></i><span class="mid"></span></div>
       <div class="score">${tr[t.key].score.toFixed(0)}<div class="muted" style="font-size:10px;font-weight:400">信 ${(tr[t.key].conf*100).toFixed(0)}%</div></div></div>`).join('');

    const ci95 = f => { const m = f.score, e = 1.96*f.se; return `${Math.max(0,m-e).toFixed(0)}–${Math.min(100,m+e).toFixed(0)}`; };
    document.getElementById('traitEvidence').innerHTML = '<table><thead><tr><th>维度</th><th>量表</th><th>文本</th><th>观察</th><th>融合分数 · 95%区间</th><th>置信度</th><th>一致性/冲突</th></tr></thead><tbody>' +
      TRAITS.map(t => {
        const f = tr[t.key], s = f.streams;
        const g = src => { const x = s.find(y=>y.source===src); return x ? `${x.score.toFixed(0)} <span class="muted">(n=${x.n}, ±${x.se.toFixed(0)})</span>` : '<span class="muted">—</span>'; };
        const flag = f.conflicts.length ? `<span class="tag red">冲突：${f.conflicts.join('/')}</span>` :
          (f.consistency != null && f.consistency < 0.6 ? '<span class="tag amber">分歧较大</span>' : '<span class="tag green">一致</span>');
        return `<tr><td>${t.name}</td><td>${g('量表')}</td><td>${g('文本')}</td><td>${g('观察')}</td><td>${f.score.toFixed(0)} <span class="muted">[${ci95(f)}]</span></td><td>${(f.conf*100).toFixed(0)}%</td><td>${flag}</td></tr>`;
      }).join('') + '</tbody></table>';

    // MBTI 推导
    const g = k => tr[k].score;
    const m = [
      ['E / I', g('E') >= 50 ? 'E 外向' : 'I 内向', g('E')],
      ['S / N', g('O') >= 52 ? 'N 直觉' : 'S 实感', Math.abs(g('O')-50)+50],
      ['T / F', g('A') < 48 ? 'T 思考' : 'F 情感', Math.abs(g('A')-50)+50],
      ['J / P', g('C') >= 50 ? 'J 判断' : 'P 感知', g('C')]
    ];
    const code = m.map(x=>x[1][0]).join('');
    document.getElementById('mbtiView').innerHTML =
      `<p style="font-size:22px;font-weight:650;margin:0 0 8px">${code} <span class="muted" style="font-size:12px;font-weight:400">推导倾向</span></p>` +
      m.map(x=>`<div class="trait-row"><div class="name">${x[0]}</div><div class="bar"><i style="width:${clamp(x[2],0,100)}%"></i></div><div class="score">${x[1]}</div></div>`).join('') +
      '<p class="muted small">MBTI 的科学信效度存在争议，此处仅作为沟通速记。</p>';

    // DISC 推导
    const d = [
      ['D 支配', clamp(g('E')*0.5 + (100-g('A'))*0.5, 0,100)],
      ['I 影响', clamp(g('E')*0.65 + g('O')*0.35, 0,100)],
      ['S 稳健', clamp(g('A')*0.6 + (100-g('O'))*0.4, 0,100)],
      ['C 谨慎', clamp(g('C')*0.7 + g('N')*0.15 + g('H')*0.15, 0,100)]
    ];
    document.getElementById('discView').innerHTML = d.map(x =>
      `<div class="trait-row"><div class="name">${x[0]}</div><div class="bar"><i style="width:${x[1].toFixed(0)}%"></i></div><div class="score">${x[1].toFixed(0)}</div></div>`).join('') +
      '<p class="muted small">DISC 描述做事风格，不评价能力高低。</p>';

    // 主题 → 图式/依恋取向
    const themes = a.themes;
    const mapTheme = {
      '控制感需求':'可能偏「焦虑型 / 高控制」的关系与工作模式：在不确定时倾向于建立规则与核对。',
      '被认可需求':'可能对外界评价较敏感，行为常被「被看见 / 被肯定」的需求驱动。',
      '回避冲突':'可能偏「回避型」冲突处理：宁可让步或沉默，也不愿正面争执。',
      '独立自立':'可能偏「疏离 / 自立型」模式：强调不依赖他人，情绪表达较克制。',
      '关系维护':'可能偏「安全 / 依恋型」模式：重视关系氛围与他人感受。',
      '探索成长':'可能具有较强的成长取向，面对变化时更愿意尝试。',
      '风险警惕':'可能存在「预期焦虑」模式：提前预演风险以降低不确定感。',
      '效率导向':'结果导向明显，对时间与产出的权重高于过程感受。'
    };
    document.getElementById('schemaView').innerHTML = themes.length ?
      themes.slice(0,6).map(t=>`<div class="list-item"><div class="li-head"><span class="li-title">${t.theme} <span class="muted small">（${t.count} 次）</span></span></div><p>${esc(mapTheme[t.theme]||'反复出现的主题。')}</p></div>`).join('') +
      '<p class="muted small">以上为文本主题归纳，属于可验证假设，不等同于图式疗法或依恋类型的正式评估。</p>'
      : '<div class="notice">需要更多观察记录或文本样本才能归纳主题。</div>';
  }

  function renderPatterns() {
    const p = P(); if (!p) return;
    const rows = getAnalysis(p).patterns;
    document.getElementById('patternTable').innerHTML = rows.length ?
      `<table><thead><tr><th>情境</th><th>行为</th><th>支持度</th><th>平滑条件概率</th><th>95% 区间</th><th>相对基线</th><th>显著性</th></tr></thead><tbody>` +
      rows.slice(0,20).map(r=>`<tr><td>${esc(r.context)}</td><td>${esc(r.behavior)}</td><td>${r.support}/${r.withC} ${r.support<3?'<span class="tag amber">样本少</span>':''}</td><td>${(r.confidence*100).toFixed(0)}%</td><td>${(r.ciLow*100).toFixed(0)}–${(r.ciHigh*100).toFixed(0)}%</td><td>${r.lift.toFixed(2)}×</td><td>${r.robust?'<span class="tag green">稳健显著</span>':r.significant?'<span class="tag blue">显著</span>':'<span class="muted">不显著</span>'}</td></tr>`).join('') +
      '</tbody></table><p class="muted small" style="margin-top:10px">条件概率经平滑（小样本不再报 100%）；区间为 Wilson 95%；显著性经过多重比较校正标注「稳健显著」。观察数较少时，不显著条目应视为线索而非结论。</p>'
      : '<div class="notice">还没有可挖掘的共现模式。请先在「情境—行为观察」中记录至少 5 条，并填写情境与行为标签。</div>';

    const themes = getAnalysis(p).themes;
    document.getElementById('themeTable').innerHTML = themes.length ?
      themes.map(t=>`<span class="tag blue" style="font-size:12px;padding:4px 10px">${esc(t.theme)} · ${t.count}</span>`).join(' ')
      : '<div class="notice">暂无高频主题。</div>';

    const st = getAnalysis(p).state;
    if (!st.enough) {
      document.getElementById('stateTrait').innerHTML = `<div class="notice">${esc(st.reason || '节律数据不足')}</div>`;
    } else {
      const label = { mood:'情绪', stress:'压力', sleep:'睡眠(h)', social:'社交(h)', focus:'专注(h)' };
      document.getElementById('stateTrait').innerHTML =
        `<p><strong>判断：</strong>${st.shifted ? '近期出现中等以上效应量的偏移，更像「状态」变化，预测时应谨慎外推为长期特质。' : '早期与近期差异微小，节律较稳定，可视为较持续的模式。'} <span class="muted small">（早期 ${st.earlyN} 天 / 近期 ${st.recentN} 天）</span></p>
         <table><thead><tr><th>指标</th><th>早期均值</th><th>近期均值</th><th>变化</th><th>效应量 d</th><th>程度</th><th>趋势</th></tr></thead><tbody>` +
        st.rows.map(r=>`<tr><td>${label[r.key]}</td><td>${r.early.toFixed(1)}</td><td>${r.recent.toFixed(1)}</td><td>${r.delta>0?'+':''}${r.delta.toFixed(1)}</td><td>${r.d>0?'+':''}${r.d.toFixed(2)}</td><td><span class="tag ${Math.abs(r.d)>=0.6?'amber':'green'}">${r.magnitude}</span></td><td>${r.trend}</td></tr>`).join('') +
        '</tbody></table><p class="muted small" style="margin-top:8px">效应量 d 用合并标准差标准化，避免不同量纲直接比较；趋势为按日期的线性斜率。样本少于 4 天时不作判断。</p>';
    }
  }

  function renderPrediction() {
    if (!currentPrediction) return;
    const pr = currentPrediction;
    document.getElementById('predResultCard').style.display = 'block';
    document.getElementById('predResult').innerHTML = pr.rows.map(r =>
      `<div class="pred-row"><div class="label">${esc(r.behavior)}</div>
       <div class="track"><div class="bar"><i style="width:${clamp(r.prob*100/0.6,0,100).toFixed(1)}%"></i></div>
       <div class="muted small" style="margin-top:2px">区间 ${(r.low*100).toFixed(0)}% – ${(r.high*100).toFixed(0)}%</div></div>
       <div class="val"><strong>${(r.prob*100).toFixed(1)}%</strong><div class="muted" style="font-size:10px">样本 ${r.support.toFixed(1)}</div></div></div>`).join('');

    const top = pr.rows[0];
    const reasons = [];
    const modeText = { matched:'情境匹配到历史模式', unseen:'该情境在历史中未出现，退化为人格先验 + 基线', cold:'冷启动：无历史观察，几乎完全依赖人格先验' };
    reasons.push('<strong>' + modeText[pr.mode] + '</strong>');
    if (pr.contexts.length) reasons.push('识别到的情境：' + pr.contexts.join('、'));
    if (top && top.support) reasons.push(`历史中「${top.behavior}」在同类情境出现约 ${top.support.toFixed(1)} 次（按情境权重加权）`);
    reasons.push(`人格先验强度 ${(pr.traitStrength*100).toFixed(0)}%：${TRAITS.slice().sort((a,b)=>Math.abs(pr.traits[b.key].score-50)-Math.abs(pr.traits[a.key].score-50)).slice(0,2).map(t=>t.name).join('、')} 偏离中性`);
    if (pr.state.enough && pr.state.shifted) reasons.push('近期节律出现中等以上状态偏移，已对相关行为作小幅调节');
    reasons.push(`总观察样本 ${pr.nObs} 条；概率在对数空间融合后归一化，区间随证据量收窄`);
    document.getElementById('predWhy').innerHTML =
      `<div class="notice ${pr.mode==='cold'?'warn':'info'}"><strong>推断依据：</strong><br>${reasons.map(r=>'· '+r).join('<br>')}</div>`;
  }

  function buildReport() {
    const p = P(); if (!p) return '';
    const a = getAnalysis(p);
    const tr = a.traits, patterns = a.patterns, themes = a.themes, st = a.state, v = a.validity;
    const L = [];
    L.push('# 行为档案报告');
    L.push('');
    L.push(`- 档案名称：${p.name}`);
    L.push(`- 角色 / 语境：${p.role || '—'}`);
    L.push(`- 观察关系：${p.relation || '—'}`);
    L.push(`- 生成时间：${new Date().toLocaleString('zh-CN')}`);
    L.push(`- 数据规模：观察 ${p.observations.length} 条 / 文本 ${p.texts.reduce((a,t)=>a+(t.text||'').length,0)} 字 / 量表 ${v.n}/${SCALE_ITEMS.length} / 节律 ${p.rhythm.length} 天`);
    L.push('');
    L.push('> 声明：本报告基于有限输入做启发式归纳，结论为待验证假设，不是心理诊断，也不应用于操控或重大决策。');
    L.push('');
    L.push('## 一、数据质量检查');
    L.push('');
    L.push(`- 量表效度：${v.usable ? '可用' : '信息不足'}；作答一致性 ${v.consistency==null?'—':(v.consistency*100).toFixed(0)+'%'}；直线作答：${v.straightline?'是':'否'}`);
    v.flags.forEach(f => L.push(`  - 提示：${f}`));
    const conflicts = TRAITS.filter(t => tr[t.key].conflicts.length);
    L.push(`- 证据冲突：${conflicts.length ? conflicts.map(t=>t.name+'（'+tr[t.key].conflicts.join('/')+'）').join('、') : '未发现'}`);
    L.push('');
    L.push('## 二、人格画像（0–100，50 为中性）');
    L.push('');
    L.push('| 维度 | 融合分数 | 95% 区间 | 置信度 | 证据来源 |');
    L.push('|---|---|---|---|---|');
    TRAITS.forEach(t => {
      const s = tr[t.key], e = 1.96*s.se;
      const src = s.streams.map(x=>x.source).join('、') || '无';
      L.push(`| ${t.name} ${t.en} | ${s.score.toFixed(0)} | ${Math.max(0,s.score-e).toFixed(0)}–${Math.min(100,s.score+e).toFixed(0)} | ${(s.conf*100).toFixed(0)}% | ${src} |`);
    });
    L.push('');
    L.push('说明：多源证据用逆方差加权融合，流间分歧会扩大区间；小样本向中性 50 收缩。' + TRAITS.map(t=>`${t.name}=${t.desc}`).join('；') + '。');
    L.push('');
    L.push('## 三、推导视图');
    L.push('');
    const g = k => tr[k].score;
    const code = (g('E')>=50?'E':'I') + (g('O')>=52?'N':'S') + (g('A')<48?'T':'F') + (g('C')>=50?'J':'P');
    L.push(`- MBTI 推导倾向：${code}（信效度有限，仅作速记）`);
    L.push(`- DISC 推导：D ${(g('E')*.5+(100-g('A'))*.5).toFixed(0)} / I ${(g('E')*.65+g('O')*.35).toFixed(0)} / S ${(g('A')*.6+(100-g('O'))*.4).toFixed(0)} / C ${(g('C')*.7+g('N')*.15+g('H')*.15).toFixed(0)}`);
    L.push('');
    L.push('## 四、反复出现的主题');
    L.push('');
    if (themes.length) themes.forEach(t => L.push(`- ${t.theme}（${t.count} 次，涉及 ${t.docs} 份文本，IDF 加权 ${t.weighted.toFixed(1)}）`)); else L.push('- 暂无足够数据');
    L.push('');
    L.push('## 五、情境 → 行为模式');
    L.push('');
    if (patterns.length) {
      L.push('| 情境 | 行为 | 支持度 | 平滑概率 | Wilson 95% | 相对基线 | 显著性 |');
      L.push('|---|---|---|---|---|---|---|');
      patterns.slice(0,15).forEach(r => L.push(`| ${r.context} | ${r.behavior} | ${r.support}/${r.withC} | ${(r.confidence*100).toFixed(0)}% | ${(r.ciLow*100).toFixed(0)}–${(r.ciHigh*100).toFixed(0)}% | ${r.lift.toFixed(2)}× | ${r.robust?'稳健显著':r.significant?'显著':'不显著'} |`));
    } else L.push('- 暂无足够数据');
    L.push('');
    L.push('## 六、状态 vs 特质');
    L.push('');
    if (st.enough) {
      L.push(st.shifted ? '近期出现中等以上效应量偏移，更可能反映短期状态；不宜外推为长期特质。' : '早期与近期节律差异微小，可视为较持续的模式。');
      st.rows.forEach(r => L.push(`- ${r.key}: ${r.early.toFixed(1)} → ${r.recent.toFixed(1)}（Δ ${r.delta>0?'+':''}${r.delta.toFixed(1)}，d=${r.d.toFixed(2)}，${r.magnitude}，趋势${r.trend}）`));
    } else L.push(`- 节律数据不足：${st.reason || '需 ≥4 天'}`);
    L.push('');
    L.push('## 七、下一步行为倾向（概率区间）');
    L.push('');
    if (currentPrediction) {
      const modeText = { matched:'匹配到历史模式', unseen:'情境未见过，退化为人格先验+基线', cold:'冷启动，几乎完全依赖人格先验' };
      L.push(`情境：${currentPrediction.situation || '—'}（${currentPrediction.contexts.join('、')||'未标注'}） · 模式：${modeText[currentPrediction.mode]}`);
      L.push('');
      currentPrediction.rows.forEach(r => L.push(`- ${r.behavior}: ${(r.prob*100).toFixed(1)}%（区间 ${(r.low*100).toFixed(0)}%–${(r.high*100).toFixed(0)}%，证据 ${(r.evidence*100).toFixed(0)}%）`));
    } else L.push('- 尚未运行模拟器。可到「行为预测」输入情境后重新生成报告。');
    L.push('');
    L.push('## 八、观察记录原文');
    L.push('');
    if (p.observations.length) p.observations.forEach(o => {
      L.push(`- **${o.date}** ${o.situation||'未标注情境'} → ${(o.behaviorTags||[]).join('、')||'未分类'}：${o.behavior}`);
      if (o.interpretation) L.push(`  - 解读：${o.interpretation}`);
    }); else L.push('- 暂无');
    L.push('');
    L.push('---');
    L.push('工具：行为档案（本地离线）· 方法：IPIP-NEO / HEXACO 简版量表与效度检查、IDF 加权词汇信号与否定识别、逆方差 + 随机效应融合与向中性贝叶斯收缩、Wilson 区间与多重比较校正、数字表型节律的效应量分析、对数空间多源证据融合的概率预测。');
    return L.join('\n');
  }

  function renderAbout() {
    document.getElementById('aboutContent').innerHTML = `
      <div class="grid grid-2">
        <div class="list-item"><div class="li-title">大五人格 + HEXACO 简版量表</div><p>采用公开领域的 IPIP-NEO 思路与 HEXACO 的诚实-谦逊维度，36 题简版。对应 Open Source Psychometrics Project、IPIP-NEO 公开题库的取向。</p></div>
        <div class="list-item"><div class="li-title">文本信号提取</div><p>中英文词边界匹配 + 最长匹配优先（避免嵌套词重复计数）+ 否定识别（「不喜欢」不会算成喜欢）+ IDF 加权（常见词权重更低）。参考 Personality Insights / KnowMe 的行为信号思路，本地规则实现。</p></div>
        <div class="list-item"><div class="li-title">量表效度与证据融合</div><p>检查直线作答与正反向题矛盾；三条证据流（量表/文本/观察）按逆方差加权，流间分歧用随机效应模型扩大区间，并向中性 50 做贝叶斯收缩。冲突会显式列出而非被平均掉。</p></div>
        <div class="list-item"><div class="li-title">数字表型节律</div><p>用早期与近期对比，报告 Cohen's d 效应量与线性趋势来区分状态与特质，避免不同量纲直接比较。</p></div>
        <div class="list-item"><div class="li-title">模式挖掘与显著性</div><p>条件概率经 Dirichlet 平滑（单次观察不再报 100%）；Wilson 95% 区间；两比例 z 检验并标注 Bonferroni 校正后的稳健显著。lift 的基线用平滑后的行为基率。</p></div>
        <div class="list-item"><div class="li-title">概率预测</div><p>历史似然、人格先验、基线三类证据在对数空间按证据强度加权并 softmax 归一化；区间随证据量收窄；未见过情境会自动退化并标注，不做无根据的自信推断。</p></div>
        <div class="list-item"><div class="li-title">推导视图</div><p>MBTI 与 DISC 均由大五分数粗略映射，仅作沟通速记；相关量表的科学争议已在界面中标注。</p></div>
      </div>`;
    document.getElementById('ethicsBox').innerHTML = `
      1. <strong>知情与同意</strong>：对他人画像前，尽可能说明你在做什么、数据如何使用，并获得同意。<br>
      2. <strong>假设而非结论</strong>：输出是待验证的假设，应用来提出更好的问题，而不是给人下定论。<br>
      3. <strong>避免伤害</strong>：不要用于操控、跟踪、歧视、替他人做重大决定，或作为惩罚的依据。<br>
      4. <strong>数据最小化</strong>：只记录与目的相关的观察；本工具的数据只存在此浏览器，不上传。<br>
      5. <strong>边界</strong>：不是临床诊断工具，不能替代专业心理评估；涉及心理健康问题请寻求专业人士。`;
  }

  function renderAll() {
    renderProfileSelect(); renderMeta(); renderCoverage(); renderEntryLists();
    renderScale(); renderTraits(); renderPatterns(); renderPrediction();
    document.getElementById('reportOut').textContent = buildReport();
  }

  /* ============================================================
   * 5. 交互绑定
   * ============================================================ */

  const SECTION_TITLES = {
    overview: ['档案总览','当前数据的整体覆盖与快速解读'],
    entry: ['数据录入','观察、文本、量表与节律四类数据'],
    traits: ['人格画像','大五 + 诚实谦逊，及推导视图'],
    patterns: ['行为模式','情境—行为共现与主题归纳'],
    predict: ['行为预测','给定情境下的行为倾向估计'],
    report: ['档案报告','可复制与下载的完整报告'],
    about: ['方法与说明','方法来源与伦理边界']
  };

  function bind() {
    document.getElementById('nav').addEventListener('click', e => {
      const b = e.target.closest('button[data-section]'); if (!b) return;
      const s = b.dataset.section;
      document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('active', x===b));
      document.querySelectorAll('.section').forEach(x=>x.classList.toggle('active', x.id==='sec-'+s));
      document.getElementById('pageTitle').textContent = SECTION_TITLES[s][0];
      document.getElementById('pageSub').textContent = SECTION_TITLES[s][1] + ' · ' + (P()?P().name:'');
      if (s === 'report') document.getElementById('reportOut').textContent = buildReport();
      if (s === 'about') renderAbout();
      window.scrollTo({top:0, behavior:'smooth'});
    });

    document.getElementById('entryTabs').addEventListener('click', e => {
      const b = e.target.closest('button[data-sub]'); if (!b) return;
      document.querySelectorAll('#entryTabs button').forEach(x=>x.classList.toggle('active', x===b));
      document.querySelectorAll('.subview').forEach(x=>x.classList.toggle('active', x.id==='sub-'+b.dataset.sub));
    });

    document.getElementById('profileSelect').addEventListener('change', e => {
      DB.activeId = e.target.value; saveDB(); renderAll();
    });

    document.getElementById('btnNewProfile').addEventListener('click', () => {
      const name = prompt('新档案名称：', '新档案 ' + (DB.profiles.length + 1));
      if (!name) return;
      const p = emptyProfile(name); DB.profiles.push(p); DB.activeId = p.id; saveDB(); renderAll(); toast('已创建档案');
    });

    document.getElementById('btnDeleteProfile').addEventListener('click', () => {
      if (!confirm('确认删除当前档案？此操作不可撤销。')) return;
      DB.profiles = DB.profiles.filter(p => p.id !== DB.activeId);
      if (!DB.profiles.length) DB.profiles.push(emptyProfile('默认档案'));
      DB.activeId = DB.profiles[0].id; saveDB(); renderAll(); toast('已删除');
    });

    document.getElementById('btnSaveMeta').addEventListener('click', () => {
      const p = P(); if (!p) return;
      p.name = document.getElementById('metaName').value.trim() || '未命名档案';
      p.role = document.getElementById('metaRole').value.trim();
      p.relation = document.getElementById('metaRelation').value.trim();
      p.notes = document.getElementById('metaNotes').value.trim();
      touch(); saveDB(); renderAll(); toast('档案信息已保存');
    });

    document.getElementById('btnAddObs').addEventListener('click', () => {
      const p = P(); if (!p) return;
      const behavior = document.getElementById('obsBehavior').value.trim();
      if (!behavior) { toast('请填写观察到的行为'); return; }
      const tags = el => Array.from(document.querySelectorAll(`${el} input:checked`)).map(x=>x.value);
      p.observations.push({
        id: uid(), date: document.getElementById('obsDate').value || today(),
        situation: document.getElementById('obsSituation').value.trim(),
        behavior, interpretation: document.getElementById('obsInterpret').value.trim(),
        behaviorTags: tags('#obsBehaviorTags'), contextTags: tags('#obsContextTags'),
        intensity: Number(document.getElementById('obsIntensity').value) || 3,
        outcome: document.getElementById('obsOutcome').value
      });
      touch(); saveDB();
      document.getElementById('obsBehavior').value = ''; document.getElementById('obsInterpret').value = '';
      document.getElementById('obsSituation').value = '';
      document.querySelectorAll('#obsBehaviorTags input, #obsContextTags input').forEach(x=>x.checked=false);
      renderEntryLists(); renderCoverage(); renderTraits(); renderPatterns();
      document.getElementById('reportOut').textContent = buildReport(); toast('观察已添加');
    });

    document.getElementById('btnAddText').addEventListener('click', () => {
      const p = P(); if (!p) return;
      const text = document.getElementById('textBody').value.trim();
      if (!text) { toast('请粘贴文本'); return; }
      p.texts.push({ id: uid(), date: today(), source: document.getElementById('textSource').value.trim(), text });
      touch(); saveDB(); document.getElementById('textBody').value = '';
      renderEntryLists(); renderCoverage(); renderTraits();
      document.getElementById('reportOut').textContent = buildReport(); toast('文本已保存并分析');
    });

    document.getElementById('btnSaveScale').addEventListener('click', () => {
      const p = P(); if (!p) return;
      SCALE_ITEMS.forEach(i => {
        const el = document.querySelector(`input[name="s${i.id}"]:checked`);
        if (el) p.scale[i.id] = Number(el.value);
      });
      touch(); saveDB(); renderCoverage(); renderTraits();
      document.getElementById('reportOut').textContent = buildReport(); toast('量表已保存');
    });

    document.getElementById('btnClearScale').addEventListener('click', () => {
      const p = P(); if (!p) return;
      if (!confirm('清空当前档案的量表作答？')) return;
      p.scale = {}; touch(); saveDB(); renderScale(); renderCoverage(); renderTraits(); toast('已清空');
    });

    document.getElementById('btnAddRhythm').addEventListener('click', () => {
      const p = P(); if (!p) return;
      const date = document.getElementById('rhDate').value || today();
      p.rhythm = p.rhythm.filter(r => r.date !== date);
      p.rhythm.push({
        id: uid(), date,
        sleep: document.getElementById('rhSleep').value, social: document.getElementById('rhSocial').value,
        focus: document.getElementById('rhFocus').value, mood: Number(document.getElementById('rhMood').value)||3,
        stress: Number(document.getElementById('rhStress').value)||3, note: document.getElementById('rhNote').value.trim()
      });
      touch(); saveDB(); renderEntryLists(); renderCoverage(); renderPatterns(); toast('节律已添加');
    });

    document.getElementById('sec-entry').addEventListener('click', e => {
      const b = e.target.closest('button[data-del-obs],button[data-del-text],button[data-del-rh]'); if (!b) return;
      const p = P(); if (!p) return;
      if (!confirm('删除这条记录？')) return;
      if (b.dataset.delObs) p.observations = p.observations.filter(x=>x.id!==b.dataset.delObs);
      if (b.dataset.delText) p.texts = p.texts.filter(x=>x.id!==b.dataset.delText);
      if (b.dataset.delRh) p.rhythm = p.rhythm.filter(x=>x.id!==b.dataset.delRh);
      touch(); saveDB(); renderEntryLists(); renderCoverage(); renderTraits(); renderPatterns();
      document.getElementById('reportOut').textContent = buildReport();
    });

    document.getElementById('btnPredict').addEventListener('click', () => {
      const p = P(); if (!p) return;
      const situation = document.getElementById('predSituation').value.trim();
      const selected = Array.from(document.querySelectorAll('#predContextTags input:checked')).map(x=>x.value);
      if (!situation && !selected.length) { toast('请描述情境或选择情境类别'); return; }
      currentPrediction = predictBehavior(p, situation, selected);
      renderPrediction();
      document.getElementById('reportOut').textContent = buildReport();
    });

    document.getElementById('btnCopyReport').addEventListener('click', async () => {
      const txt = document.getElementById('reportOut').textContent;
      try { await navigator.clipboard.writeText(txt); toast('已复制报告'); }
      catch(e) { toast('复制失败，请手动选择文本'); }
    });

    document.getElementById('btnDownloadReport').addEventListener('click', () => {
      const txt = document.getElementById('reportOut').textContent;
      const blob = new Blob([txt], {type:'text/markdown;charset=utf-8'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = (P()?P().name:'档案') + '_行为档案报告.md'; a.click();
      URL.revokeObjectURL(a.href); toast('报告已下载');
    });

    document.getElementById('btnPrint').addEventListener('click', () => window.print());

    document.getElementById('btnExport').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(DB, null, 2)], {type:'application/json'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'behavior-profile-backup.json'; a.click(); URL.revokeObjectURL(a.href); toast('已导出全部档案');
    });

    document.getElementById('btnImport').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('fileInput').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const d = JSON.parse(r.result);
          if (!d || !Array.isArray(d.profiles)) throw new Error('格式不正确');
          if (!confirm('导入将覆盖当前所有档案，确认继续？')) return;
          DB = d; if (!DB.profiles.find(p=>p.id===DB.activeId)) DB.activeId = DB.profiles[0].id;
          saveDB(); renderAll(); toast('导入成功');
        } catch(err) { toast('导入失败：' + err.message); }
      };
      r.readAsText(f); e.target.value = '';
    });

    document.getElementById('btnDemo').addEventListener('click', () => {
      if (!confirm('载入示例数据会覆盖当前档案内容，确认继续？')) return;
      const p = P(); if (!p) return;
      p.role = '项目团队成员'; p.relation = '共事 6 个月';
      p.notes = '示例数据，用于演示分析链；请按实际情况修改。';
      p.observations = [
        {id:uid(),date:'2026-10-12',situation:'项目临近截止，需求临时变更',behavior:'把新需求拆成清单，逐条确认影响范围后才继续执行',interpretation:'面对不确定时倾向于用流程降低风险',behaviorTags:['谨慎核实','理性分析'],contextTags:['高压/截止','变化/风险'],intensity:4,outcome:'positive'},
        {id:uid(),date:'2026-10-18',situation:'会议上被当众质疑方案',behavior:'先听完对方意见，再逐点用数据回应，没有抬高音量',interpretation:'在冲突中更愿意用证据说话，而非情绪对抗',behaviorTags:['理性分析','竞争主导'],contextTags:['冲突/反对','社交/公开'],intensity:4,outcome:'neutral'},
        {id:uid(),date:'2026-10-25',situation:'新同事请教问题',behavior:'放下手头工作详细讲解，并主动分享自己的笔记',interpretation:'愿意帮助他人，即使对自己略有不便',behaviorTags:['合作协调','主动推进'],contextTags:['帮助/求助','亲密/信任'],intensity:2,outcome:'positive'},
        {id:uid(),date:'2026-11-02',situation:'团队讨论方向模糊，没人表态',behavior:'第一个提出三种方案并说明取舍，推动会议收束',interpretation:'在模糊情境下愿意承担推动责任',behaviorTags:['主动推进','即兴尝试'],contextTags:['不确定/模糊','社交/公开'],intensity:3,outcome:'positive'},
        {id:uid(),date:'2026-11-09',situation:'方案被上级否定',behavior:'私下反复复盘，第二天带着修改版本回来',interpretation:'对批评敏感但恢复较快，倾向于用改进回应',behaviorTags:['谨慎核实','主动推进'],contextTags:['评价/批评','高压/截止'],intensity:4,outcome:'neutral'},
        {id:uid(),date:'2026-11-15',situation:'跨部门资源争夺',behavior:'坚持己方优先级，但提出对双方都有利的替代方案',interpretation:'合作倾向与竞争意识并存',behaviorTags:['竞争主导','合作协调'],contextTags:['竞争/成就','冲突/反对'],intensity:3,outcome:'neutral'},
        {id:uid(),date:'2026-11-20',situation:'接到一个从未做过的任务',behavior:'主动查阅资料并找人请教，先做一个小样验证',interpretation:'对新事物好奇，愿意低风险试错',behaviorTags:['即兴尝试','主动推进'],contextTags:['不确定/模糊','帮助/求助'],intensity:3,outcome:'positive'}
      ];
      p.texts = [
        {id:uid(),date:'2026-11-01',source:'工作群消息',text:'我先把目标拆一下，列个清单，重点核对几个细节，避免最后出问题。大家可以提不同想法，我们一起看看可能性，我也想尝试一个新方法。'},
        {id:uid(),date:'2026-11-12',source:'周报节选',text:'本周按计划完成了三件事，整理了流程文档。有一点不确定，我反复确认了两遍。感谢同事的帮助，我承认之前判断有偏差，已经修正。'}
      ];
      p.scale = {};
      const answers = {1:4,2:2,3:5,4:4,5:2,6:5, 7:5,8:2,9:5,10:4,11:2,12:4, 13:4,14:2,15:4,16:3,17:4,18:2, 19:5,20:2,21:5,22:2,23:4,24:2, 25:3,26:4,27:3,28:3,29:3,30:4, 31:5,32:5,33:1,34:4,35:1,36:4};
      Object.keys(answers).forEach(k=>p.scale[k]=answers[k]);
      p.rhythm = [];
      const base = [['2026-11-10',7.2,1.5,3.0,4,2],['2026-11-11',7.0,1.0,3.5,4,2],['2026-11-12',6.8,2.0,4.0,3,3],['2026-11-13',7.5,1.0,3.2,4,2],['2026-11-14',8.0,0.5,1.0,4,1],['2026-11-15',7.0,2.5,2.0,5,1],['2026-11-16',6.5,1.0,4.5,3,3],['2026-11-17',5.5,0.5,2.0,2,4],['2026-11-18',5.0,0.5,1.5,2,5],['2026-11-19',5.5,1.0,2.0,3,4]];
      base.forEach(r=>p.rhythm.push({id:uid(),date:r[0],sleep:r[1],social:r[2],focus:r[3],mood:r[4],stress:r[5],note:''}));
      touch(); saveDB(); renderAll(); toast('示例数据已载入');
    });
  }

  function init() {
    loadDB();
    const d = document.getElementById('obsDate'); d.value = today();
    document.getElementById('rhDate').value = today();
    buildCheckline(document.getElementById('obsBehaviorTags'), BEHAVIORS, 'b', []);
    buildCheckline(document.getElementById('obsContextTags'), CONTEXTS, 'c', []);
    buildCheckline(document.getElementById('predContextTags'), CONTEXTS, 'p', []);
    bind(); renderAbout(); renderAll();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
