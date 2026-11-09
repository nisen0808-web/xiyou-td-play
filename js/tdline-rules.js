/* 天兵关卡的纯规则：第二关起的塔防数值、波次、阵型判定、布阵界面布局、教学卡避让。
 * 不碰画面、不读存档。浏览器和 node 测试共用这一份，避免两套数字。
 */
(function (root) {
  'use strict';
  var R = {};
  R.VERSION = '0.8.7';

  R.TOWERS = {
    arrow:  { id: 'arrow', name: '弓天兵', role: '单体快攻', cost: 40, dmg: 11, cd: 0.55, range: 250, splash: 0, slow: 0, desc: '射得快，专点一只，飞妖也打得到' },
    cannon: { id: 'cannon', name: '炮天兵', role: '范围溅射', cost: 85, dmg: 34, cd: 1.65, range: 210, splash: 78, slow: 0, desc: '炸一片地面上的妖怪，打不着飞在天上的' },
    frost:  { id: 'frost', name: '寒冰天兵', role: '减速', cost: 55, dmg: 7, cd: 0.85, range: 188, splash: 0, slow: 0.48, desc: '让路上的妖怪明显变慢，给后面的天兵争取时间' },
    siege:  { id: 'siege', name: '破阵天兵', role: '破甲', cost: 110, dmg: 42, cd: 2.15, range: 400, splash: 0, slow: 0, desc: '打重甲和 Boss 更疼，并撕开护甲' },
    heal:   { id: 'heal', name: '佛光天兵', role: '对空增益', cost: 70, dmg: 12, cd: 1.25, range: 210, splash: 0, slow: 0, desc: '佛光扫飞妖，并让身旁天兵出手更快' }
  };
  R.TOWER_ORDER = ['arrow', 'cannon', 'frost', 'siege', 'heal'];

  R.KINDS = {
    swarm: { name: '成群小妖', hp: 72, speed: 96, pdef: 0, leak: 1, gold: 4, air: false },
    fast:  { name: '急脚妖', hp: 48, speed: 168, pdef: 0, leak: 1, gold: 5, air: false },
    armor: { name: '重甲', hp: 540, speed: 44, pdef: 0.46, leak: 2, gold: 12, air: false },
    air:   { name: '飞妖', hp: 58, speed: 112, pdef: 0, leak: 1, gold: 6, air: true },
    boss:  { name: 'Boss', hp: 6400, speed: 36, pdef: 0.2, leak: 6, gold: 80, air: false, boss: true }
  };

  /* 第三关先开三个，第四关再开三个。第一、二关没有任何阵型。 */
  R.FORMATIONS = [
    { id: 'snake', name: '一字长蛇阵', who: 'tower', unlock: 3,
      how: '沿路至少 3 座天兵，相邻两座路程相距 400 到 1200，头尾拉开 480 以上',
      effect: '射程 +18%，攻速 −12%。拉开站位才算，挤在同一处不算数',
      mods: { range: 1.18, cd: 1.12, dmg: 1 } },
    { id: 'crane', name: '鹤翼阵', who: 'tower', unlock: 3,
      how: '选一个路口，左右两侧都放天兵，并再放一座离这个路口不远的',
      effect: '炮火溅射 +30%，减速更久，单体伤害 −10%。适合成群，单挑 Boss 吃亏',
      mods: { splash: 1.3, slow: 1.28, dmg: 0.9, cd: 1 } },
    { id: 'bagua', name: '八卦阵', who: 'hero', unlock: 3,
      how: '至少 3 名徒弟留守营地，围着唐僧站',
      effect: '留守者减伤 +18%，互相回血，本人出手 −15%。守家，不替天兵清线',
      mods: { heroDr: 0.18, heroHeal: 4, heroDmg: 0.85 } },
    { id: 'zhi', name: '锱矢阵', who: 'tower', unlock: 4,
      how: '至少一座破阵天兵，并有 3 座天兵挤在同一段路上（路程跨度 ≤ 580）',
      effect: '对重甲和 Boss +40%，攻速 −8%，溅射 −15%。专打硬的，清群慢',
      mods: { armor: 1.4, boss: 1.4, cd: 1.08, splash: 0.85, dmg: 1 } },
    { id: 'net', name: '天罗地网', who: 'tower', unlock: 4,
      how: '寒冰，加上弓兵或佛光，凑齐至少 3 种天兵',
      effect: '对空 +35%，减速更久，射程 −8%。飞妖多时有用，打重甲一般',
      mods: { air: 1.35, slow: 1.4, range: 0.92, dmg: 1 } },
    { id: 'fang', name: '方圆阵', who: 'hero', unlock: 4,
      how: '至少 2 名徒弟留守营地（不满 3 人时用这个；3 人也可以改守方圆）',
      effect: '漏到营地的妖怪少扣命（约 −38%），留守者攻速变慢。保命，不增加清线',
      mods: { leak: 0.62, heroCd: 1.12 } }
  ];

  R.BOSSES = { 2: { type: 'jin', name: '金角大王' }, 3: { type: 'boss', name: '牛魔王' }, 4: { type: 'iron', name: '铁扇公主' } };

  R.isTd = function (levelId, flags) {
    flags = flags || {};
    if ((levelId | 0) < 2) return false;
    if (flags.dungeon || flags.villain || flags.lair || flags.mod) return false;
    return true;
  };
  R.formTab = function (levelId) { return (levelId | 0) >= 3; };
  R.unlocked = function (levelId) {
    return R.FORMATIONS.filter(function (f) { return f.unlock <= (levelId | 0); });
  };
  R.formById = function (id) {
    for (var i = 0; i < R.FORMATIONS.length; i++) if (R.FORMATIONS[i].id === id) return R.FORMATIONS[i];
    return null;
  };
  R.dmgScale = function (levelId) { return levelId <= 2 ? 2.55 : levelId === 3 ? 3.05 : 3.5; };
  R.hpScale = function (levelId) { return levelId <= 2 ? 1 : levelId === 3 ? 1.32 : 1.62; };
  R.startGold = function (levelId) { return levelId <= 2 ? 250 : levelId === 3 ? 300 : 340; };
  R.lives = function (levelId) { return levelId <= 2 ? 20 : levelId === 3 ? 18 : 16; };
  R.gap = function () { return 14; };
  R.sellRate = 0.6;
  R.heroMul = 0.04;
  R.upgradeCost = function (type, nextLv) {
    var c = R.TOWERS[type].cost;
    if (nextLv === 2) return Math.round(c * 0.7);
    if (nextLv === 3) return Math.round(c * 1.05);
    return 0;
  };
  R.spentFor = function (type, lv) {
    var s = R.TOWERS[type].cost, i;
    for (i = 2; i <= lv; i++) s += R.upgradeCost(type, i);
    return s;
  };
  R.sellRefund = function (type, lv) { return Math.round(R.spentFor(type, lv) * R.sellRate); };

  R.shot = function (levelId, type, lv, formId) {
    var b = R.TOWERS[type], f = R.formById(formId), m = f && f.who === 'tower' ? f.mods : null;
    var dmg = b.dmg * (1 + 0.5 * ((lv || 1) - 1)) * R.dmgScale(levelId);
    var cd = b.cd * ((lv || 1) === 3 ? 0.85 : 1);
    var range = b.range * (1 + 0.1 * ((lv || 1) - 1));
    var splash = b.splash || 0;
    if (m) {
      if (m.dmg) dmg *= m.dmg;
      if (m.cd) cd *= m.cd;
      if (m.range) range *= m.range;
      if (m.splash && splash) splash *= m.splash;
    }
    return { dmg: dmg, cd: cd, range: range, splash: splash, slow: b.slow * (m && m.slow ? m.slow : 1) };
  };

  /* 命中后再乘的克制。返回额外倍率（0 = 不加）。破甲、对空、对 Boss 放在这里，避免和基础伤害叠成万能。 */
  R.hitExtra = function (towerType, kind, formId, shredded) {
    var k = R.KINDS[kind] || {}, f = R.formById(formId), m = f && f.who === 'tower' ? f.mods : null, x = 0;
    if (towerType === 'cannon' && k.air) return -1;
    if (towerType === 'siege' && (kind === 'armor' || kind === 'boss')) x += 0.7;
    if (m && m.armor && kind === 'armor' && towerType === 'siege') x += m.armor - 1;
    if (m && m.boss && kind === 'boss' && towerType === 'siege') x += m.boss - 1;
    if (k.air && (towerType === 'arrow' || towerType === 'heal')) {
      x += 0.15;
      if (m && m.air) x += m.air - 1;
    }
    if (shredded && towerType !== 'siege' && !k.air) x += 0.22;
    return x;
  };

  R.kindStats = function (levelId, kind) {
    var b = R.KINDS[kind], s = R.hpScale(levelId);
    return { hp: Math.round(b.hp * s), speed: b.speed, pdef: b.pdef, leak: b.leak, gold: b.gold + (levelId >= 4 ? 1 : 0), air: !!b.air, boss: !!b.boss, name: kind === 'boss' ? (R.BOSSES[levelId] || R.BOSSES[4]).name : b.name };
  };

  function wave(groups, boss) {
    var g = groups.map(function (p) { return { kind: p[0], n: p[1] }; });
    return { groups: g, boss: boss || null };
  }
  R.waves = function (levelId) {
    if (levelId <= 2) return [
      wave([['swarm', 8]]),
      wave([['swarm', 6], ['fast', 4]]),
      wave([['armor', 2], ['swarm', 6]]),
      wave([['air', 6], ['swarm', 4]]),
      wave([['fast', 6], ['armor', 2]]),
      wave([['swarm', 8], ['air', 4], ['armor', 2]]),
      wave([['swarm', 6]], 'boss')
    ];
    if (levelId === 3) return [
      wave([['swarm', 10]]),
      wave([['fast', 6], ['swarm', 6]]),
      wave([['armor', 3], ['swarm', 6]]),
      wave([['air', 8], ['fast', 4]]),
      wave([['armor', 3], ['air', 4]]),
      wave([['swarm', 8], ['armor', 2], ['fast', 4]]),
      wave([['air', 6], ['armor', 3]]),
      wave([['swarm', 8]], 'boss')
    ];
    return [
      wave([['swarm', 12], ['fast', 4]]),
      wave([['armor', 3], ['swarm', 8]]),
      wave([['air', 8], ['fast', 6]]),
      wave([['armor', 4], ['air', 4]]),
      wave([['fast', 8], ['swarm', 8]]),
      wave([['armor', 4], ['air', 6], ['swarm', 6]]),
      wave([['armor', 3], ['fast', 6]]),
      wave([['swarm', 10], ['air', 6]], 'boss')
    ];
  };

  R.preview = function (levelId) {
    var seen = {}, order = [], waves = R.waves(levelId), i, j, g, boss = R.BOSSES[levelId] || R.BOSSES[4];
    for (i = 0; i < waves.length; i++) {
      for (j = 0; j < waves[i].groups.length; j++) {
        g = waves[i].groups[j].kind;
        if (!seen[g]) { seen[g] = 1; order.push(R.KINDS[g].name); }
      }
    }
    return { count: waves.length, kinds: order, boss: boss.name, route: levelId === 2 ? '平顶山官道，路口多' : levelId === 3 ? '火焰山，弯急、飞妖多' : '通天河渡口，路更长' };
  };

  /* ---------- 阵型成不成 ---------- */
  function byS(a, b) { return a.s - b.s; }
  R.matchTower = function (id, towers) {
    towers = (towers || []).slice().sort(byS);
    if (id === 'snake') {
      if (towers.length < 3) return false;
      if (towers[towers.length - 1].s - towers[0].s < 480) return false;
      for (var i = 1; i < towers.length; i++) {
        var ds = towers[i].s - towers[i - 1].s;
        if (ds < 400 || ds > 1200) return false;
      }
      return true;
    }
    if (id === 'crane') {
      var i2, j, k, t, wings, extra;
      for (i2 = 0; i2 < towers.length; i2++) {
        t = towers[i2]; wings = { 1: 0, '-1': 0 }; extra = 0;
        for (j = 0; j < towers.length; j++) {
          if (Math.abs(towers[j].s - t.s) > 640) continue;
          wings[towers[j].side >= 0 ? 1 : -1]++;
        }
        if (wings[1] >= 1 && wings[-1] >= 1) {
          for (k = 0; k < towers.length; k++) if (Math.abs(towers[k].s - t.s) <= 640) extra++;
          if (extra >= 3) return true;
        }
      }
      return false;
    }
    if (id === 'zhi') {
      if (!towers.some(function (t) { return t.type === 'siege'; })) return false;
      var a, b, span, n;
      for (a = 0; a < towers.length; a++) {
        for (b = a; b < towers.length; b++) {
          span = towers[b].s - towers[a].s;
          if (span > 580) break;
          n = b - a + 1;
          if (n >= 3 && towers.slice(a, b + 1).some(function (t) { return t.type === 'siege'; })) return true;
        }
      }
      return false;
    }
    if (id === 'net') {
      var types = {}, nk = 0, tpe;
      towers.forEach(function (t) { if (!types[t.type]) { types[t.type] = 1; nk++; } });
      return nk >= 3 && types.frost && (types.arrow || types.heal);
    }
    return false;
  };
  R.matchHero = function (id, heroes) {
    var n = (heroes || []).filter(function (h) { return h && h.id !== 'tang' && h.order === 'station' && !h.down; }).length;
    if (id === 'bagua') return n >= 3;
    if (id === 'fang') return n >= 2;
    return false;
  };
  R.activeMods = function (levelId, towerId, heroId, towers, heroes) {
    var tm = null, hm = null;
    if (towerId && R.formById(towerId) && R.formById(towerId).unlock <= levelId && R.matchTower(towerId, towers)) tm = towerId;
    if (heroId && R.formById(heroId) && R.formById(heroId).unlock <= levelId && R.matchHero(heroId, heroes)) hm = heroId;
    return { tower: tm, hero: hm };
  };

  /* ---------- 教学卡：避开高亮，不超出屏幕 ---------- */
  R.placeCard = function (view, target, card) {
    var m = 8, w = view.w, h = view.h, cw = card.w, ch = card.h;
    var below = { x: target.x + target.w / 2 - cw / 2, y: target.y + target.h + 16 };
    var above = { x: target.x + target.w / 2 - cw / 2, y: target.y - ch - 16 };
    var low = target.y > view.h * 0.42;
    var spots = [
      low ? above : below,
      low ? below : above,
      { x: target.x + target.w + 16, y: target.y + target.h / 2 - ch / 2 },
      { x: target.x - cw - 16, y: target.y + target.h / 2 - ch / 2 },
      { x: m, y: h - ch - m },
      { x: w - cw - m, y: m }
    ];
    function inside(s) { return s.x >= m && s.y >= m && s.x + cw <= w - m && s.y + ch <= h - m; }
    function hit(s) {
      return !(s.x + cw < target.x - 6 || s.x > target.x + target.w + 6 || s.y + ch < target.y - 6 || s.y > target.y + target.h + 6);
    }
    var i, s;
    for (i = 0; i < spots.length; i++) {
      s = { x: Math.round(spots[i].x), y: Math.round(spots[i].y) };
      if (inside(s) && !hit(s)) return s;
    }
    s = { x: m, y: m };
    if (hit(s)) s = { x: m, y: Math.max(m, h - ch - m) };
    s.x = Math.max(m, Math.min(s.x, w - cw - m));
    s.y = Math.max(m, Math.min(s.y, h - ch - m));
    return s;
  };
  R.cardSize = function (view) {
    var w = Math.min(340, Math.max(168, view.w - 16));
    var h = view.w < 520 ? 168 : 150;
    return { w: w, h: h };
  };

  /* 布阵界面有哪些入口。第一关不是塔防；第二关没有阵型页。 */
  R.widgets = function (levelId, phase) {
    if (!R.isTd(levelId)) return [];
    var out = [
      { act: 'tdStart', label: '开战' },
      { act: 'tdTab', id: 'tower', label: '天兵' },
      { act: 'tdHint', text: '布置天兵，准备好后点开战' }
    ];
    if (R.formTab(levelId)) out.push({ act: 'tdTab', id: 'form', label: '阵型' });
    if (phase === 'fight' || phase === 'gap') out.push({ act: 'tdWave', label: '波次' });
    return out;
  };

  R.LINE_GUIDE = [
    { id: 'pad', text: '点这个路口的塔位。放在转弯处，一路上的妖怪都得从射程里走过。' },
    { id: 'place', text: '点弓天兵，再点刚才的塔位放下。弓兵射得快，专打一只。' },
    { id: 'range', text: '虚线是射程。妖怪走进圈里才会挨打。' },
    { id: 'roles', text: '弓兵点杀，炮兵炸地面上的一群，寒冰让怪变慢，破阵专打重甲和 Boss，佛光打飞妖并让旁边的天兵更快。这一关有成群、急脚、重甲、飞妖。' },
    { id: 'upgrade', text: '点已放下的天兵，可以升级或出售。出售退回六成金币。' },
    { id: 'start', text: '准备好了就点开战。波次之间还能继续建塔。' }
  ];
  R.FORM_GUIDE = [
    { id: 'tab', text: '第三关起可以布阵。点「阵型」。' },
    { id: 'pick', text: '先看鹤翼阵：路口左右都放天兵，溅射和减速更强，单体会变弱。' },
    { id: 'eye', text: '地面上的墨线是阵眼。按说明摆，阵成了才会亮出阵名朱印。' },
    { id: 'hold', text: '点一名徒弟「留守」。八卦阵要三名留守，方圆阵两名就能保营地的命。' },
    { id: 'start', text: '阵型和天兵都看过了，点开战。' }
  ];

  /* ---------- 简化战线：和局内同一套伤害公式，用来先看经济能不能打完 ---------- */
  R.samplePads = function () {
    return [
      { s: 700, side: 1, corner: false },
      { s: 1280, side: 1, corner: true },
      { s: 1280, side: -1, corner: true },
      { s: 1760, side: 1, corner: false },
      { s: 2300, side: -1, corner: true },
      { s: 2300, side: 1, corner: true },
      { s: 2860, side: 1, corner: false },
      { s: 2860, side: -1, corner: false },
      { s: 3400, side: 1, corner: true },
      { s: 4000, side: -1, corner: false }
    ];
  };

  function cover(range) {
    var off = 72, r = range;
    if (r <= off) return 40;
    return 2 * Math.sqrt(r * r - off * off);
  }

  R.run = function (opts) {
    opts = opts || {};
    var level = opts.level || 2;
    var waves = opts.waves || R.waves(level);
    var pads = (opts.pads || R.samplePads()).map(function (p, i) { return { i: i, s: p.s, side: p.side, corner: !!p.corner, tower: null }; });
    var gold = opts.gold != null ? opts.gold : R.startGold(level);
    var lives = R.lives(level), maxLives = lives;
    var formWant = opts.form || null, heroWant = opts.heroForm || null;
    var garrison = opts.garrison || 0;
    var heroOn = opts.hero !== false;
    var buys = (opts.buys || []).map(function (b) { return { type: b.type, pad: b.pad, lv: b.lv || 0 }; });
    var spawnEvery = opts.spawnEvery || 0.72;
    var pathEnd = opts.pathEnd || 4520, leakAt = opts.leakAt || 60;
    var dt = 0.2, clock = 0, cap = opts.cap || 1400;
    var towers = [], queue = [], alive = [], wi = -1, gapT = 0, phase = 'deploy', shred = {};
    var killed = 0, leaked = 0, spentGold = 0;

    function heroes() {
      var hs = [], i;
      for (i = 0; i < garrison; i++) hs.push({ id: 'h' + i, order: 'station', down: false });
      return hs;
    }
    function act() { return R.activeMods(level, formWant, heroWant, towers.map(slim), heroes()); }
    function slim(t) { return { type: t.type, s: t.s, side: t.side, lv: t.lv }; }
    function tryBuy() {
      var i, b, pad, cost, t;
      for (i = 0; i < buys.length; i++) {
        b = buys[i];
        if (b.done) continue;
        pad = pads[b.pad];
        if (!pad || pad.tower) continue;
        if (b.lv && b.lv > 1) continue;
        cost = R.TOWERS[b.type].cost;
        if (gold < cost) continue;
        gold -= cost; spentGold += cost;
        t = { type: b.type, lv: 1, s: pad.s, side: pad.side, spent: cost, cd: 0.2 };
        pad.tower = t; towers.push(t); b.done = true;
      }
      towers.forEach(function (t) {
        while (t.lv < 3) {
          var c = R.upgradeCost(t.type, t.lv + 1);
          if (!opts.upgrade) break;
          if (gold < c) break;
          gold -= c; t.spent += c; t.lv++;
        }
      });
    }
    function arm(index) {
      var w = waves[index], list = [], g, n, u;
      w.groups.forEach(function (g0) {
        for (n = 0; n < g0.n; n++) list.push(g0.kind);
      });
      if (w.boss) list.push('boss');
      queue = list.map(function (kind, n) {
        var st = R.kindStats(level, kind);
        return { kind: kind, hp: st.hp, max: st.hp, speed: st.speed, pdef: st.pdef, leak: st.leak, gold: st.gold, air: st.air, boss: !!st.boss, s: pathEnd, at: clock + n * spawnEvery, slow: 0, id: index + ':' + n };
      });
    }
    function damageOf(tower, e, mods) {
      if (tower.type === 'cannon' && e.air) return 0;
      var sh = R.shot(level, tower.type, tower.lv, mods.tower);
      var extra = R.hitExtra(tower.type, e.kind, mods.tower, shred[e.id] > clock);
      if (extra < 0) return 0;
      var dmg = sh.dmg * (1 - e.pdef) * (1 + extra);
      if (tower.type === 'heal' && !e.air) dmg = 0;
      return dmg;
    }
    function inRange(tower, e, mods) {
      var sh = R.shot(level, tower.type, tower.lv, mods.tower);
      return Math.abs(e.s - tower.s) <= cover(sh.range) / 2;
    }

    tryBuy();
    phase = 'fight'; wi = 0; arm(0);
    while (clock < cap && lives > 0) {
      var mods = act(), leakMul = 1, hd = R.heroMul;
      if (mods.hero) {
        var hm = R.formById(mods.hero).mods;
        if (hm.leak) leakMul = hm.leak;
        if (hm.heroDmg) hd *= hm.heroDmg;
      }
      if (gapT > 0) {
        gapT -= dt; clock += dt;
        if (gapT <= 0) { if (wi >= waves.length) break; arm(wi); }
        tryBuy();
        continue;
      }
      queue.forEach(function (e) { if (e.at <= clock && e.s === pathEnd && !e.born) { e.born = true; alive.push(e); } });
      alive.forEach(function (e) {
        var sp = e.speed * (e.slow > clock ? 0.52 : 1);
        e.s -= sp * dt;
      });
      towers.forEach(function (t) {
        t.cd -= dt;
        if (t.cd > 0) return;
        var sh = R.shot(level, t.type, t.lv, mods.tower);
        var haste = towers.some(function (o) { return o.type === 'heal' && o !== t && Math.abs(o.s - t.s) < 240; });
        var cd = sh.cd * (haste ? 0.88 : 1);
        var pool = alive.filter(function (e) { return e.hp > 0 && e.born && inRange(t, e, mods); });
        if (!pool.length) return;
        pool.sort(function (a, b) {
          if (t.type === 'siege') {
            var pa = (a.kind === 'armor' || a.kind === 'boss') ? 0 : 1;
            var pb = (b.kind === 'armor' || b.kind === 'boss') ? 0 : 1;
            if (pa !== pb) return pa - pb;
          }
          if (t.type === 'heal') return (a.air === b.air) ? a.s - b.s : (a.air ? -1 : 1);
          return a.s - b.s;
        });
        var tgt = pool[0], hits = [tgt];
        if (t.type === 'cannon' && sh.splash) {
          hits = pool.filter(function (e) { return !e.air && Math.abs(e.s - tgt.s) <= sh.splash; });
        }
        if (t.type === 'frost') hits = pool.slice(0, 4);
        var fired = false;
        hits.forEach(function (e) {
          var dmg = damageOf(t, e, mods);
          if (dmg <= 0) return;
          fired = true;
          e.hp -= dmg;
          if (t.type === 'frost') e.slow = clock + 1.15 * (R.formById(mods.tower) && R.formById(mods.tower).mods.slow ? R.formById(mods.tower).mods.slow : 1);
          if (t.type === 'siege') shred[e.id] = clock + 4;
        });
        if (fired) t.cd = cd;
      });
      if (heroOn) {
        var heroDps = 26 * hd * (mods.hero && R.formById(mods.hero).mods.heroCd ? 1 / R.formById(mods.hero).mods.heroCd : 1);
        var front = alive.filter(function (e) { return e.born && e.hp > 0 && e.s < 1600; }).sort(function (a, b) { return a.s - b.s; })[0];
        if (front) front.hp -= heroDps * dt;
      }
      var left = [];
      alive.forEach(function (e) {
        if (e.hp <= 0) { killed++; gold += e.gold; return; }
        if (e.s <= leakAt) {
          leaked++;
          var loss = Math.max(1, Math.round(e.leak * leakMul));
          lives -= loss;
          return;
        }
        left.push(e);
      });
      alive = left;
      var pending = queue.some(function (e) { return !e.born; });
      if (!pending && !alive.length) {
        wi++;
        if (wi >= waves.length) break;
        gapT = R.gap();
        tryBuy();
      }
      clock += dt;
      if (lives <= 0) break;
    }
    var modsF = act();
    return {
      win: lives > 0 && wi >= waves.length && !alive.length,
      lives: Math.max(0, lives), maxLives: maxLives, leaked: leaked, killed: killed,
      gold: gold, time: Math.round(clock),
      towerForm: modsF.tower, heroForm: modsF.hero,
      towers: towers.map(slim)
    };
  };

  R.plan = function (level, name) {
    var pads = R.samplePads();
    var buys = [];
    function add(type, pad) { buys.push({ type: type, pad: pad }); }
    if (name === 'hero' || name === 'fang-only' || name === 'bagua-only') {
      return { buys: [], form: null, heroForm: name === 'fang-only' ? 'fang' : name === 'bagua-only' ? 'bagua' : null, garrison: name === 'bagua-only' ? 3 : name === 'fang-only' ? 2 : 0, upgrade: false };
    }
    if (name === 'crane') {
      add('cannon', 1); add('frost', 2); add('arrow', 3); add('arrow', 6);
      return { buys: buys, form: 'crane', heroForm: null, garrison: 0, upgrade: true };
    }
    if (name === 'zhi') {
      add('siege', 4); add('arrow', 5); add('cannon', 6); add('frost', 0);
      return { buys: buys, form: 'zhi', heroForm: null, garrison: 0, upgrade: true };
    }
    if (name === 'snake') {
      add('arrow', 0); add('arrow', 3); add('cannon', 6); add('frost', 8);
      return { buys: buys, form: 'snake', heroForm: null, garrison: 0, upgrade: true };
    }
    if (name === 'net') {
      add('frost', 2); add('arrow', 3); add('heal', 6); add('cannon', 8);
      return { buys: buys, form: 'net', heroForm: null, garrison: 0, upgrade: true };
    }
    if (name === 'line-fang') {
      add('arrow', 0); add('frost', 2); add('cannon', 3); add('siege', 4); add('arrow', 6);
      return { buys: buys, form: null, heroForm: 'fang', garrison: 2, upgrade: true };
    }
    add('arrow', 0); add('frost', 2); add('cannon', 3); add('arrow', 6); add('siege', 4); add('heal', 8);
    return { buys: buys, form: null, heroForm: null, garrison: 0, upgrade: true, pads: pads };
  };

  R.simulate = function (level, name) {
    var p = R.plan(level, name);
    return R.run({
      level: level, buys: p.buys, form: p.form, heroForm: p.heroForm,
      garrison: p.garrison, upgrade: p.upgrade, hero: name !== 'hero' ? true : true,
      pads: p.pads
    });
  };

  /* 三种战线分开走。同一套怪，不同阵的剩命不能由同一个阵全部领先。 */
  R.scenarios = function () {
    var crane = R.plan(4, 'crane'), zhi = R.plan(4, 'zhi'), net = R.plan(4, 'net'), snake = R.plan(4, 'snake');
    function go(plan, form, waves, extra) {
      return R.run({
        level: 4, waves: waves, buys: plan.buys, form: form, hero: false, upgrade: false, gold: 800, garrison: 0,
        pathEnd: extra.pathEnd, leakAt: extra.leakAt, spawnEvery: extra.spawnEvery
      });
    }
    var swarmW = [wave([['swarm', 16], ['fast', 8]]), wave([['swarm', 18]])];
    var armorW = [wave([['armor', 4]]), wave([['armor', 2]], 'boss')];
    var airW = [wave([['air', 18]]), wave([['air', 14]])];
    return {
      swarm: {
        crane: go(crane, 'crane', swarmW, { pathEnd: 2100, leakAt: 800, spawnEvery: 0.4 }),
        zhi: go(zhi, 'zhi', swarmW, { pathEnd: 3200, leakAt: 1900, spawnEvery: 0.4 }),
        snake: go(snake, 'snake', swarmW, { pathEnd: 4200, leakAt: 400, spawnEvery: 0.4 })
      },
      armor: {
        zhi: go(zhi, 'zhi', armorW, { pathEnd: 3400, leakAt: 1600, spawnEvery: 0.9 }),
        crane: go(crane, 'crane', armorW, { pathEnd: 2200, leakAt: 700, spawnEvery: 0.9 }),
        snake: go(snake, 'snake', armorW, { pathEnd: 4200, leakAt: 400, spawnEvery: 0.9 })
      },
      air: {
        net: go(net, 'net', airW, { pathEnd: 3600, leakAt: 1500, spawnEvery: 0.35 }),
        snake: go(snake, 'snake', airW, { pathEnd: 3600, leakAt: 1500, spawnEvery: 0.35 }),
        crane: go(crane, 'crane', airW, { pathEnd: 3600, leakAt: 1500, spawnEvery: 0.35 }),
        netOff: go(net, null, airW, { pathEnd: 3600, leakAt: 1500, spawnEvery: 0.35 })
      }
    };
  };

  root.TDRules = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R;
})(typeof window !== 'undefined' ? window : globalThis);
