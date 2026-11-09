/* 第二关起的塔防层，第三关起的阵型。
 * 挂在整包脚本最后：只包一层现有的 newGame / step / 放置 / 绘制，第一关、副本、反派、验关原样走。
 * 扫荡不进战斗；若有人带 skipDeploy / sweep 开局，也不进布阵。
 */
(function () {
  'use strict';
  if (!window.XY || !window.TDRules) return;
  var XY = window.XY, R = window.TDRules;
  var TD = XY.tdline = { rules: R, force: null };

  function app() { return (window.__xy && window.__xy.app) || XY.app || null; }
  function hypot(x, y) { return Math.sqrt(x * x + y * y); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function tutStore() {
    var d = XY.save && XY.save.data;
    if (!d) return {};
    if (!d.tutorial || typeof d.tutorial !== 'object') d.tutorial = { done: false, grow: false };
    return d.tutorial;
  }
  function markTut(key) {
    tutStore()[key] = true;
    if (XY.save && XY.save.touch) XY.save.touch();
    if (XY.save && XY.save.flush) XY.save.flush();
  }

  /* ---------- 第四关：通天河。阵型后三个从这里解锁。 ---------- */
  function ensureLevel4() {
    if (!XY.LEVELS || XY.LEVELS.some(function (L) { return L.id === 4; })) {
      XY.LEVEL_COUNT = XY.LEVELS.length;
      return;
    }
    XY.LEVELS.push({
      id: 4, name: '通天河', sub: '河妖截住渡口，布阵才能过河',
      camp: { x: 4400, y: 1600 },
      route: [[4400, 1600], [3700, 1180], [3000, 1680], [2300, 1120], [1600, 1500], [900, 1280], [300, 1460]],
      rest: 0.55, walkSec: 300, theme: 'ochre',
      gate: { x: 300, y: 1460, name: '通天河口' },
      rate: 1.35, mul: 2.4, bossMul: 5, swarmN: 16, eliteN: 2,
      dens: [{ id: 'tongtian', name: '通天河', boss: 'iron', x: 2100, y: 2300 }],
      captives: [],
      main: { type: 'kill_den', den: 0, text: '守住渡口，击退铁扇公主', short: '击退铁扇公主' },
      sides: []
    });
    XY.LEVEL_COUNT = XY.LEVELS.length;
  }
  ensureLevel4();

  function buildPads(rt) {
    var pads = [], i, pts = rt.pts, C = XY.C;
    function push(s, side, x, y, corner) {
      if (x < 70 || y < 70 || x > C.WORLD_W - 70 || y > C.WORLD_H - 70) return;
      pads.push({ s: s, side: side, x: x, y: y, corner: !!corner, tower: null });
    }
    for (i = 1; i < pts.length - 1; i++) {
      var a = pts[i - 1], b = pts[i], c = pts[i + 1];
      var ang = Math.atan2(c.y - b.y, c.x - b.x);
      var prev = Math.atan2(b.y - a.y, b.x - a.x);
      var dlt = Math.atan2(Math.sin(ang - prev), Math.cos(ang - prev));
      var nx = -Math.sin(ang), ny = Math.cos(ang), s = rt.cum[i];
      push(s, 1, b.x + nx * 78, b.y + ny * 78, Math.abs(dlt) > 0.35);
      if (Math.abs(dlt) > 0.42) push(s, -1, b.x - nx * 78, b.y - ny * 78, true);
    }
    for (i = 1; i < pts.length; i++) {
      if (rt.cum[i] - rt.cum[i - 1] < 820) continue;
      var midS = (rt.cum[i] + rt.cum[i - 1]) / 2, mid = XY.routeAt(rt, midS);
      var nx2 = -Math.sin(mid.a), ny2 = Math.cos(mid.a);
      push(midS, 1, mid.x + nx2 * 78, mid.y + ny2 * 78, false);
    }
    var out = [];
    pads.sort(function (a, b) { return a.s - b.s || a.side - b.side; });
    pads.forEach(function (p) {
      if (out.some(function (q) { return hypot(q.x - p.x, q.y - p.y) < 64; })) return;
      p.id = out.length;
      out.push(p);
    });
    return out;
  }

  function nearestPad(G, x, y, maxD) {
    var best = null, bd = maxD || 96, i, p, d;
    for (i = 0; i < G.td.pads.length; i++) {
      p = G.td.pads[i];
      d = hypot(p.x - x, p.y - y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  function refreshForms(G) {
    var towers = G.towers.filter(function (t) { return t.tdPad != null; }).map(function (t) {
      var p = G.td.pads[t.tdPad];
      return { type: t.type, s: p ? p.s : 0, side: p ? p.side : 1, lv: t.lv || 1 };
    });
    var heroes = G.heroes.map(function (h) { return { id: h.id, order: h.order, down: h.down }; });
    G.td.active = R.activeMods(G.levelId, G.td.formTower, G.td.formHero, towers, heroes);
  }

  function armWave(G) {
    var w = G.td.waves[G.td.wi];
    if (!w) return;
    var list = [], n, delay = 0.35;
    w.groups.forEach(function (g) { for (n = 0; n < g.n; n++) list.push(g.kind); });
    if (w.boss) list.push('boss');
    G.td.queue = list.map(function (kind, i) { return { kind: kind, at: G.td.clock + 0.6 + i * (kind === 'boss' ? 1.4 : delay) }; });
    G.td.spawned = 0;
    var boss = R.BOSSES[G.levelId] || R.BOSSES[4];
    if (XY.banner) XY.banner(G, '第 ' + (G.td.wi + 1) + '/' + G.td.waves.length + ' 波' + (w.boss ? ' · ' + boss.name : ''), 2.4);
  }

  TD.boot = function (G, opts) {
    opts = opts || {};
    G.tut = null;
    G.towers.length = 0;
    G.enemies = G.enemies.filter(function (e) { return !(e.def && (e.def.denBoss || e.def.boss || e.def.etower)); });
    G.dens.forEach(function (d) {
      d.alive = false; d.closedT = 1e9;
      if (d.boss) { d.boss.dead = true; d.boss.hidden = true; }
    });
    G.noSpawn = true;
    G.events = [];
    G.eventIdx = 0;
    var pads = buildPads(G.rt);
    var skip = !!(opts.sweep || opts.skipDeploy || window.XY_TD_SKIP_DEPLOY);
    G.td = {
      phase: skip ? 'fight' : 'deploy',
      pads: pads, waves: R.waves(G.levelId), wi: 0, queue: [], clock: 0,
      lives: R.lives(G.levelId), maxLives: R.lives(G.levelId),
      formTower: null, formHero: null, active: { tower: null, hero: null },
      tab: 'tower', gapT: 0, hint: 0, guide: null, focusPad: null, needCam: !skip,
      leakAt: Math.max(80, Math.min(160, G.rt.total * 0.03))
    };
    G.coins = R.startGold(G.levelId);
    G.td.guide = pickGuide(G);
    if (skip) { G.td.phase = 'fight'; armWave(G); G.td.hint = 6; }
    refreshForms(G);
  };

  function pickGuide(G) {
    var seen = tutStore(), force = TD.force;
    TD.force = null;
    if (force === 'line' || (!seen.tdLine && G.levelId === 2 && !force)) {
      var pad = guidePad(G);
      G.td && (G.td.focusPad = pad);
      return { kind: 'line', i: 0, pad: pad };
    }
    if (force === 'form' || (!seen.tdForm && G.levelId === 3 && force !== 'line')) {
      return { kind: 'form', i: 0, pad: null };
    }
    return null;
  }
  function guidePad(G) {
    var pads = G.td.pads, best = null, i;
    for (i = 0; i < pads.length; i++) {
      if (!pads[i].corner) continue;
      if (pads[i].s < 180) continue;
      if (!best || pads[i].s < best.s) best = pads[i];
    }
    return best || pads[Math.min(1, pads.length - 1)] || null;
  }
  function guideStep(G) {
    if (!G.td || !G.td.guide) return null;
    var list = G.td.guide.kind === 'form' ? R.FORM_GUIDE : R.LINE_GUIDE;
    return list[G.td.guide.i] || null;
  }
  function advanceGuide(G) {
    var g = G.td.guide; if (!g) return;
    var list = g.kind === 'form' ? R.FORM_GUIDE : R.LINE_GUIDE;
    g.i++;
    if (g.i >= list.length) {
      markTut(g.kind === 'form' ? 'tdForm' : 'tdLine');
      G.td.guide = null;
    }
  }

  TD.startBattle = function (G) {
    if (!G || !G.td || G.td.phase !== 'deploy') return false;
    if (G.td.guide) return false;
    G.td.phase = 'fight';
    G.td.wi = 0;
    G.td.clock = 0;
    armWave(G);
    G.td.hint = 7;
    if (XY.sfx) XY.sfx('start');
    return true;
  };

  function spawnOne(G, kind) {
    var st = R.kindStats(G.levelId, kind);
    var boss = R.BOSSES[G.levelId] || R.BOSSES[4];
    var type = kind === 'boss' ? boss.type : kind === 'air' ? 'bat' : kind === 'armor' ? 'tank' : 'small';
    var s = Math.max(G.td.leakAt + 40, G.rt.total - 30);
    var p = XY.routeAt(G.rt, s);
    var e = XY.makeEnemy(G, type, p.x, p.y, null);
    e.def = {
      name: kind === 'boss' ? boss.name : st.name, r: kind === 'boss' ? 36 : kind === 'armor' ? 18 : 13,
      pdef: st.pdef, mdef: 0, denBoss: false, boss: kind === 'boss', fly: false, etower: false,
      elite: false, guard: false, color: '#3a342c', dark: '#241e18', knockRes: kind === 'boss' ? 0.8 : 0.15,
      coinP: 0, coin: 0, xp: 0, hp: st.hp, speed: st.speed, dmg: 6
    };
    e.fly = !!st.air;
    e.hp = e.maxHp = st.hp;
    e.speed = st.speed;
    e.tdLane = true;
    e.tdKind = kind;
    e.tdGold = st.gold;
    e.tdLeak = st.leak;
    e.tdS = s;
    e.tdPaid = false;
    e.toCamp = false;
    return e;
  }

  function pinLane(G) {
    var i, e, p;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (!e.tdLane || e.dead) continue;
      p = XY.routeAt(G.rt, clamp(e.tdS, 0, G.rt.total));
      e.x = p.x; e.y = p.y;
    }
  }

  function laneAlive(G) {
    var n = 0, i;
    for (i = 0; i < G.enemies.length; i++) if (G.enemies[i].tdLane && !G.enemies[i].dead) n++;
    return n;
  }

  function afterFight(G, dt) {
    var td = G.td, i, e, keep = [], lost, leakMul = 1;
    if (td.active.hero) {
      var hm = R.formById(td.active.hero).mods;
      if (hm.leak) leakMul = hm.leak;
      if (hm.heroHeal) {
        G.heroes.forEach(function (h) {
          if (h.down || h.id === 'tang' || h.order !== 'station') return;
          h.hp = Math.min(h.maxHp, h.hp + hm.heroHeal * dt);
        });
      }
    }
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (!e.tdLane) { keep.push(e); continue; }
      if (e.tdShred > 0) e.tdShred -= dt;
      if (!e.dead && e.tdS <= td.leakAt) {
        e.dead = true; e.tdPaid = true;
        lost = Math.max(1, Math.round(e.tdLeak * leakMul));
        td.lives -= lost;
        if (XY.core && XY.core.text) XY.core.text(G, e.x, e.y - 20, '漏 -' + lost, 'hurt');
      }
      if (e.dead && !e.tdPaid) { e.tdPaid = true; G.coins += e.tdGold || 0; }
      if (!e.dead) keep.push(e);
    }
    G.enemies = keep;
    if (td.lives <= 0) {
      td.lives = 0;
      G.ending = { kind: 'lose', cause: 'td', reason: '妖怪冲过了天兵，营地失守', t: 1.2 };
      G.mode = 'lose';
      return;
    }
    var pending = td.queue.some(function (q) { return !q.done; });
    if (!pending && laneAlive(G) === 0 && td.phase === 'fight') {
      td.wi++;
      if (td.wi >= td.waves.length) {
        G.ending = { kind: 'win', cause: 'td', reason: '天兵守住了这一关', t: 1.4 };
        G.mode = 'win';
        if (XY.banner) XY.banner(G, '守住了。', 2);
        return;
      }
      td.phase = 'gap';
      td.gapT = R.gap();
      if (XY.banner) XY.banner(G, '这一波清完了。用这 ' + R.gap() + ' 秒继续建塔、升级。', 3);
    }
  }

  function fightStep(G, dt) {
    var td = G.td;
    td.clock += dt;
    if (td.hint > 0) td.hint -= dt;
    var q, spawned = 0;
    for (q = 0; q < td.queue.length; q++) {
      if (td.queue[q].done || td.queue[q].at > td.clock) continue;
      if (G.enemies.length >= XY.C.MAX_ENEMIES - 8) break;
      spawnOne(G, td.queue[q].kind);
      td.queue[q].done = true;
      spawned++;
    }
    var i, e;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (!e.tdLane || e.dead) continue;
      var slow = e.slowT > 0 ? Math.max(0.35, 1 - (e.slowF || 0.45)) : 1;
      e.tdS -= e.speed * slow * dt;
    }
    pinLane(G);
    var mul = XY.C.HERO_DMG_MUL, pd = G.P.dmg;
    var snap = G.heroes.map(function (h) { return { dmg: h.dmgMul, wlv: h.wlv, dr: h.dr }; });
    var heroForm = td.active.hero && R.formById(td.active.hero);
    G.P.dmg = 1;
    XY.C.HERO_DMG_MUL = R.heroMul;
    G.heroes.forEach(function (h) {
      h.dmgMul = Math.min(h.dmgMul || 1, 1);
      h.wlv = 1;
      if (heroForm && heroForm.mods.heroDr && h.order === 'station' && h.id !== 'tang') h.dr = Math.min(0.72, (h.dr || 0) + heroForm.mods.heroDr);
    });
    var splash = XY.TOWERS.cannon.splash;
    var form = td.active.tower && R.formById(td.active.tower);
    XY.TOWERS.cannon.splash = (R.TOWERS.cannon.splash) * (form && form.mods.splash ? form.mods.splash : 1);
    G.tang.speed = 0;
    try { TD._step(G, dt); } finally {
      XY.TOWERS.cannon.splash = splash;
      XY.C.HERO_DMG_MUL = mul;
      G.P.dmg = pd;
      G.heroes.forEach(function (h, idx) { h.dmgMul = snap[idx].dmg; h.wlv = snap[idx].wlv; h.dr = snap[idx].dr; });
    }
    pinLane(G);
    G.heroes.forEach(function (h) {
      if (h.down || h.id === 'tang' || h.order !== 'station') return;
      var k = h.i || 1, ang = k * 1.3, rad = 86;
      h.x = G.heroes[0].x + Math.cos(ang) * rad;
      h.y = G.heroes[0].y + Math.sin(ang) * rad;
    });
    // 佛光：打飞妖，并给身旁天兵一点攻速（直接扣冷却）
    G.towers.forEach(function (t) {
      if (t.type !== 'heal') return;
      t._tdH = (t._tdH || 0) - dt;
      if (t._tdH > 0) return;
      t._tdH = 1.15;
      var sh = R.shot(G.levelId, 'heal', t.lv || 1, td.active.tower);
      G.enemies.forEach(function (en) {
        if (en.dead || !en.tdLane || en.tdKind !== 'air') return;
        if (hypot(en.x - t.x, en.y - t.y) > sh.range) return;
        var extra = R.hitExtra('heal', 'air', td.active.tower, false);
        en.hp -= sh.dmg * (1 + Math.max(0, extra));
        if (en.hp <= 0) en.dead = true;
      });
      G.towers.forEach(function (o) {
        if (o === t) return;
        if (hypot(o.x - t.x, o.y - t.y) < 230 && o.cd > 0) o.cd = Math.max(0, o.cd - 0.08);
      });
    });
    afterFight(G, dt);
    if (td.look) { G.cam.x = td.look.x; G.cam.y = td.look.y; }
  }

  TD._step = null;
  var origStep = XY.step;
  XY.step = function (G, dt) {
    if (!G || !G.td) return origStep(G, dt);
    if (G.mode !== 'play') return;
    var td = G.td;
    if (td.needCam) focus(G, 'deploy');
    if (td.phase === 'deploy') return;
    if (td.phase === 'gap') {
      td.gapT -= dt;
      if (td.gapT <= 0) { td.phase = 'fight'; armWave(G); }
      return;
    }
    refreshForms(G);
    fightStep(G, dt);
  };
  TD._step = origStep;

  var origDens = XY.updateDens;
  XY.updateDens = function (G, dt) { if (G && G.td) return; return origDens(G, dt); };
  var origSoldiers = XY.updateSoldiers;
  XY.updateSoldiers = function (G, dt) {
    if (G && G.td) {
      G.towers.forEach(function (t) {
        t.life = 1e9; t.maxLife = 1e9; t.mode = 'garrison';
        if (t.tdPad != null && G.td.pads[t.tdPad]) { t.x = G.td.pads[t.tdPad].x; t.y = G.td.pads[t.tdPad].y; }
      });
      return;
    }
    return origSoldiers(G, dt);
  };
  var prevStat = XY.towerStat;
  XY.towerStat = function (G, t) {
    var s = prevStat(G, t);
    if (!G || !G.td || !t) return s;
    var shot = R.shot(G.levelId, t.type, t.lv || 1, G.td.active && G.td.active.tower);
    s.dmg = shot.dmg; s.cd = shot.cd; s.range = shot.range;
    return s;
  };
  var prevHurt = XY.onHurt;
  XY.onHurt = function (G, e, dmg, em, el, dt, o) {
    if (prevHurt) prevHurt(G, e, dmg, em, el, dt, o);
    if (!G || !G.td || !e || !e.tdLane || !o) return;
    if (o.src && o.src.i !== undefined) return;
    var type = o.anti ? 'siege' : (o.ground && !o.dot) ? 'cannon' : (o.dot && o.elem === 'water') ? 'frost' : (!o.dot && !o.ground) ? 'arrow' : null;
    if (!type) return;
    var extra = R.hitExtra(type, e.tdKind, G.td.active && G.td.active.tower, e.tdShred > 0);
    if (extra > 0) e.hp -= dmg * extra;
    if (type === 'siege') e.tdShred = 4;
  };

  function ownAll(t) { return true; }
  if (XY.save && XY.save.solOwned) {
    var owned0 = XY.save.solOwned;
    XY.save.solOwned = function (t) {
      var G = XY.G; if (G && G.td) return true;
      return owned0(t);
    };
  }
  if (XY.soldierCost) {
    var cost0 = XY.soldierCost;
    XY.soldierCost = function (G, type) {
      if (G && G.td && R.TOWERS[type]) return R.TOWERS[type].cost;
      return cost0(G, type);
    };
  }

  TD.block = function (G, type, x, y) {
    if (!R.TOWERS[type]) return '没有这种天兵';
    var pad = nearestPad(G, x, y, 96);
    if (!pad) return '要放在塔位上（路口和转弯处的墨石）';
    if (pad.tower) return '这个塔位已经有天兵了';
    if (G.coins < R.TOWERS[type].cost) return '金币不够：' + R.TOWERS[type].name + '要 ' + R.TOWERS[type].cost;
    return null;
  };
  TD.place = function (G, type, x, y) {
    if (!G || !G.td || G.mode !== 'play') return false;
    var why = TD.block(G, type, x, y);
    if (why) { if (XY.toast) XY.toast(G, why); return false; }
    var pad = nearestPad(G, x, y, 96);
    var cost = R.TOWERS[type].cost;
    G.coins -= cost;
    var t = XY.makeTower(type, pad.x, pad.y);
    t.lv = 1; t.cl = 1; t.spent = cost; t.tdPad = pad.id; t.life = 1e9; t.maxLife = 1e9; t.mode = 'garrison'; t.r = XY.C.SOLDIER_R || 15;
    pad.tower = t;
    G.towers.push(t);
    refreshForms(G);
    if (XY.sfx) XY.sfx('place');
    var g = G.td.guide, st = guideStep(G);
    if (g && st && st.id === 'place' && g.pad && pad.id === g.pad.id && type === 'arrow') advanceGuide(G);
    return true;
  };
  var place0 = XY.placeTower, block0 = XY.towerBlock;
  XY.placeTower = function (G, type, x, y) { if (G && G.td) return TD.place(G, type, x, y); return place0(G, type, x, y); };
  XY.towerBlock = function (G, type, x, y) { if (G && G.td) return TD.block(G, type, x, y); return block0(G, type, x, y); };

  TD.upgrade = function (G, t) {
    if (!G || !G.td || !t) return false;
    if ((t.lv || 1) >= 3) { if (XY.toast) XY.toast(G, '已经满级了'); return false; }
    var cost = R.upgradeCost(t.type, (t.lv || 1) + 1);
    if (G.coins < cost) { if (XY.toast) XY.toast(G, '升级要 ' + cost + ' 金币'); return false; }
    G.coins -= cost; t.lv = (t.lv || 1) + 1; t.spent = (t.spent || 0) + cost;
    var mh = XY.towerMaxHp(t); t.maxHp = mh; t.hp = mh;
    if (t.lv >= 3) G.stats.tower3 = true;
    if (XY.core && XY.core.text) XY.core.text(G, t.x, t.y - 36, '升级 Lv' + t.lv, 'big');
    if (XY.sfx) XY.sfx('upgrade');
    refreshForms(G);
    return true;
  };
  TD.sell = function (G, t) {
    if (!G || !G.td || !t) return false;
    var back = R.sellRefund(t.type, t.lv || 1);
    G.coins += back;
    if (t.tdPad != null && G.td.pads[t.tdPad]) G.td.pads[t.tdPad].tower = null;
    var k = G.towers.indexOf(t); if (k >= 0) G.towers.splice(k, 1);
    var a = app(); if (a && a.selTower === t) a.selTower = null;
    if (XY.toast) XY.toast(G, '收回 ' + back + ' 金币');
    refreshForms(G);
    return true;
  };
  XY.upgradeTower = function (G, t) {
    if (G && G.td) return TD.upgrade(G, t || (app() && app().selTower));
    if (XY.toast) XY.toast(G, '这一关的天兵先跟着队伍');
    return false;
  };

  function emptyPads(G) { return G.td.pads.filter(function (p) { return !p.tower; }); }
  function putOn(G, type, pad) { if (pad && !pad.tower && G.coins >= R.TOWERS[type].cost) TD.place(G, type, pad.x, pad.y); }
  TD.applyPlan = function (G, name) {
    if (!G || !G.td) return;
    var pads = G.td.pads, plan = R.plan(G.levelId, name);
    if (name === 'crane') {
      var pair = null, i, j, k;
      for (i = 0; i < pads.length && !pair; i++) {
        for (j = 0; j < pads.length; j++) {
          if (pads[j] === pads[i] || Math.abs(pads[j].s - pads[i].s) > 50 || pads[j].side === pads[i].side) continue;
          for (k = 0; k < pads.length; k++) {
            if (pads[k] === pads[i] || pads[k] === pads[j]) continue;
            if (Math.abs(pads[k].s - pads[i].s) <= 640) { pair = [pads[i], pads[j], pads[k]]; break; }
          }
        }
      }
      if (pair) { putOn(G, 'cannon', pair[0]); putOn(G, 'frost', pair[1]); putOn(G, 'arrow', pair[2]); }
      G.td.formTower = G.levelId >= 3 ? 'crane' : null;
    } else if (name === 'zhi') {
      var cluster = pads.slice().sort(function (a, b) { return a.s - b.s; });
      var win = null, a, b;
      for (a = 0; a < cluster.length && !win; a++) {
        var bag = [];
        for (b = a; b < cluster.length && cluster[b].s - cluster[a].s <= 580; b++) bag.push(cluster[b]);
        if (bag.length >= 3) win = bag;
      }
      if (win) { putOn(G, 'siege', win[0]); putOn(G, 'arrow', win[1]); putOn(G, 'cannon', win[2]); }
      if (!G.towers.some(function (t) { return t.type === 'frost'; })) {
        var far = emptyPads(G).sort(function (a, b) { return a.s - b.s; })[0];
        putOn(G, 'frost', far);
      }
      G.td.formTower = G.levelId >= 4 ? 'zhi' : null;
    } else if (name === 'snake') {
      var sp = pads.slice().sort(function (a, b) { return a.s - b.s; });
      var pick = [], last = -9999;
      sp.forEach(function (p) { if (p.s - last >= 400 && p.s - last <= 1200) { pick.push(p); last = p.s; } else if (pick.length === 0) { pick.push(p); last = p.s; } });
      ['arrow', 'arrow', 'cannon', 'frost'].forEach(function (type, idx) { putOn(G, type, pick[idx]); });
      G.td.formTower = G.levelId >= 3 ? 'snake' : null;
    } else if (name === 'net') {
      var by = pads.slice().sort(function (a, b) { return a.s - b.s; });
      putOn(G, 'frost', by[1] || by[0]);
      putOn(G, 'arrow', by[3] || by[2]);
      putOn(G, 'heal', by[5] || by[4]);
      putOn(G, 'cannon', by[by.length - 1]);
      G.td.formTower = G.levelId >= 4 ? 'net' : null;
    } else if (name === 'line' || name === 'line-fang') {
      var line = pads.slice().sort(function (a, b) { return a.s - b.s; });
      var idx = [0.15, 0.32, 0.5, 0.68, 0.84].map(function (f) { return line[Math.min(line.length - 1, Math.round(f * (line.length - 1)))]; });
      var seen = {};
      idx = idx.filter(function (p) { if (!p || seen[p.id]) return false; seen[p.id] = 1; return true; });
      ['arrow', 'frost', 'cannon', 'siege', 'heal'].forEach(function (type, n) { putOn(G, type, idx[n]); });
      if (name === 'line-fang' && G.levelId >= 4) G.td.formHero = 'fang';
    } else if (name === 'fang-only' || name === 'bagua-only') {
      G.td.formHero = name === 'bagua-only' ? 'bagua' : 'fang';
    }
    var guardN = name === 'bagua-only' ? 3 : (name === 'fang-only' || name === 'line-fang') ? 2 : (plan.garrison || 0);
    var n = 0;
    G.heroes.forEach(function (h) {
      if (h.id === 'tang' || h.down) return;
      if (n < guardN) { h.order = 'station'; n++; }
    });
    if (plan.upgrade || name === 'line' || name === 'crane' || name === 'zhi' || name === 'snake' || name === 'net') {
      G.towers.slice().forEach(function (t) {
        while ((t.lv || 1) < 3 && G.coins >= R.upgradeCost(t.type, (t.lv || 1) + 1) + 40) TD.upgrade(G, t);
      });
    }
    refreshForms(G);
  };

  function focus(G, mode) {
    var pads = G.td.pads, p = null, i, sWant = G.rt.total * (mode === 'battle' ? 0.45 : 0.28);
    var best = 1e9;
    for (i = 0; i < pads.length; i++) {
      var d = Math.abs(pads[i].s - sWant);
      if (d < best) { best = d; p = pads[i]; }
    }
    if (!p && G.heroes[0]) p = G.heroes[0];
    if (p) { G.cam.x = p.x; G.cam.y = p.y; }
    G.td.needCam = false;
  }
  TD.focus = focus;

  /* ---------- 输入 ---------- */
  function guideAllows(G, h) {
    var st = guideStep(G); if (!st) return true;
    if (h.act === 'esc' || h.act === 'spd2' || h.act === 'tdGuideSkip') return true;
    if (st.id === 'pad') return h.act === 'tdPad' && G.td.guide.pad && h.id === G.td.guide.pad.id;
    if (st.id === 'place') return (h.act === 'tower' && h.type === 'arrow') || (h.act === 'tdPad' && G.td.guide.pad && h.id === G.td.guide.pad.id);
    if (st.id === 'range' || st.id === 'roles' || st.id === 'eye') return h.act === 'tdGuideNext';
    if (st.id === 'upgrade') return h.act === 'tdTower' || h.act === 'tdPad' || h.act === 'tdUpgrade' || h.act === 'tdSell' || h.act === 'tdGuideNext';
    if (st.id === 'start') return h.act === 'tdStart';
    if (st.id === 'tab') return h.act === 'tdTab' && h.id === 'form';
    if (st.id === 'pick') return h.act === 'tdPick' && h.id === 'crane';
    if (st.id === 'hold') return h.act === 'tdGarrison' || h.act === 'tdGuideNext';
    return false;
  }
  function onAct(h, G, a) {
    if (h.act === 'tdReplay') { a.tdChooser = true; return true; }
    if (h.act === 'menuTutorial') { a.tdChooser = true; return true; }
    if (h.act === 'tdReplayGo') {
      a.tdChooser = false;
      if (h.id === 'l1') { XY.tutForce = true; window.__xy.startGame(1); return true; }
      if (h.id === 'l2') { TD.force = 'line'; window.__xy.startGame(2); return true; }
      if (h.id === 'l3') { TD.force = 'form'; window.__xy.startGame(3); return true; }
      return true;
    }
    if (h.act === 'tdReplayClose') { a.tdChooser = false; return true; }
    if (!G || !G.td) return false;
    if (G.td.guide && !guideAllows(G, h)) return true;
    if (h.act === 'tdGuideSkip') {
      markTut(G.td.guide.kind === 'form' ? 'tdForm' : 'tdLine');
      G.td.guide = null; return true;
    }
    if (h.act === 'tdGuideNext') { advanceGuide(G); return true; }
    if (h.act === 'tdStart') {
      if (G.td.guide) { markTut(G.td.guide.kind === 'form' ? 'tdForm' : 'tdLine'); G.td.guide = null; }
      TD.startBattle(G); return true;
    }
    if (h.act === 'tdTab') {
      if (h.id === 'form' && !R.formTab(G.levelId)) return true;
      G.td.tab = h.id;
      if (guideStep(G) && guideStep(G).id === 'tab' && h.id === 'form') advanceGuide(G);
      return true;
    }
    if (h.act === 'tdPick') {
      var f = R.formById(h.id);
      if (!f || f.unlock > G.levelId) { if (XY.toast) XY.toast(G, '第 ' + (f ? f.unlock : 3) + ' 关才解锁'); return true; }
      if (f.who === 'tower') G.td.formTower = G.td.formTower === f.id ? null : f.id;
      else G.td.formHero = G.td.formHero === f.id ? null : f.id;
      refreshForms(G);
      if (guideStep(G) && guideStep(G).id === 'pick' && h.id === 'crane') advanceGuide(G);
      return true;
    }
    if (h.act === 'tdGarrison') {
      var hero = G.heroes[h.i];
      if (hero && hero.id !== 'tang' && !hero.down) hero.order = hero.order === 'station' ? 'guard' : 'station';
      refreshForms(G);
      if (guideStep(G) && guideStep(G).id === 'hold' && hero && hero.order === 'station') advanceGuide(G);
      return true;
    }
    if (h.act === 'tdPad') {
      var pad = G.td.pads[h.id];
      if (!pad) return true;
      if (a.build) { TD.place(G, a.build, pad.x, pad.y); if (a.touched) a.build = null; return true; }
      if (pad.tower) { a.selTower = pad.tower; a.build = null; if (guideStep(G) && guideStep(G).id === 'upgrade') advanceGuide(G); return true; }
      G.td.focusPad = pad;
      if (guideStep(G) && guideStep(G).id === 'pad') advanceGuide(G);
      return true;
    }
    if (h.act === 'tdTower') {
      var tw = null, ti;
      for (ti = 0; ti < G.towers.length; ti++) if (G.towers[ti].tdPad === h.id) tw = G.towers[ti];
      if (tw) { a.selTower = tw; if (guideStep(G) && guideStep(G).id === 'upgrade') advanceGuide(G); }
      return true;
    }
    if (h.act === 'tdUpgrade') { TD.upgrade(G, a.selTower); return true; }
    if (h.act === 'tdSell') { TD.sell(G, a.selTower); return true; }
    return false;
  }
  function hookAct() {
    if (!XY.hubUI || XY.hubUI._td) return;
    var prev = XY.hubUI.act;
    XY.hubUI.act = function (h, p, a) {
      var G = window.__xy && window.__xy.G;
      if (G && G.td && G.td.guide && h && h.act !== 'esc' && h.act !== 'spd2' && !guideAllows(G, h)) return true;
      if (h && (h.act === 'menuTutorial' || String(h.act || '').indexOf('td') === 0)) {
        if (onAct(h, G, a)) return true;
      }
      return prev ? prev(h, p, a) : false;
    };
    XY.hubUI._td = true;
  }
  hookAct();
  if (XY.auto && XY.auto.assist) {
    var assist0 = XY.auto.assist;
    XY.auto.assist = function (G, dt) {
      if (G && G.td && (G.td.phase === 'deploy' || G.td.guide)) return;
      return assist0(G, dt);
    };
  }

  var origNew = XY.newGame;
  XY.newGame = function (id, opts) {
    ensureLevel4();
    var G = origNew(id, opts);
    if (R.isTd(G.levelId, { dungeon: !!G.dungeon, villain: !!G.villain, lair: !!G.lair, mod: !!G.mod })) TD.boot(G, opts || {});
    return G;
  };

  /* ---------- 画面：宣纸、墨线、朱印。不铺深色，不加发光。 ---------- */
  function inkFont(px, bold) { return (bold ? '700 ' : '500 ') + px + 'px ' + (XY.C && XY.C.FONT ? XY.C.FONT : 'serif'); }
  function wrapText(ctx, text, maxW) {
    var lines = [], cur = '', i, ch;
    var parts = String(text).split('\n'), pi, line;
    for (pi = 0; pi < parts.length; pi++) {
      line = parts[pi]; cur = '';
      for (i = 0; i < line.length; i++) {
        ch = line.charAt(i);
        if (ctx.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch; }
        else cur += ch;
      }
      lines.push(cur);
    }
    return lines;
  }
  function paper(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#f6f1e4';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(48,36,24,0.85)';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.strokeStyle = 'rgba(48,36,24,0.35)';
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
    ctx.restore();
  }
  function seal(ctx, x, y, r, label) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.06);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#9a2e24';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#6e211b';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r - 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,236,214,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#fff6ea';
    ctx.font = inkFont(r > 30 ? 20 : 14, true);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);
    ctx.restore();
  }
  function w2s(G, x, y) {
    return { x: x - G.cam.x + G.view.w / 2, y: y - G.cam.y + G.view.h / 2 };
  }
  function phone() { var a = app(); return !!(a && a.zoom <= 0.65); }
  function hit(x, y, w, h, act, extra) {
    var o = { x: x, y: y, w: w, h: h, act: act };
    if (extra) for (var k in extra) o[k] = extra[k];
    XY.ui.hits.push(o);
  }

  function drawPads(ctx, G) {
    G.td.pads.forEach(function (p) {
      var s = w2s(G, p.x, p.y), rad = p.corner ? 20 : 16;
      if (s.x < -40 || s.y < -40 || s.x > G.view.w + 40 || s.y > G.view.h + 40) return;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(p.id * 0.2);
      ctx.fillStyle = p.tower ? 'rgba(246,241,228,0.2)' : 'rgba(246,241,228,0.92)';
      ctx.beginPath(); ctx.ellipse(0, 0, rad, rad * 0.72, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = p.corner ? '#6e211b' : '#2c241c';
      ctx.lineWidth = p.corner ? 2.2 : 1.5;
      ctx.beginPath(); ctx.ellipse(0, 0, rad, rad * 0.72, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      if (p.tower && p.tower.lv > 1) {
        ctx.fillStyle = '#2c241c';
        ctx.fillRect(s.x - 7, s.y - rad - 8, 5, 3);
        if (p.tower.lv > 2) ctx.fillRect(s.x + 1, s.y - rad - 8, 5, 3);
      }
      var hs = 28;
      hit(s.x - hs, s.y - hs, hs * 2, hs * 2, p.tower ? 'tdTower' : 'tdPad', { id: p.id });
    });
  }
  function drawRange(ctx, G, a) {
    var t = a && a.selTower, show = t && G.towers.indexOf(t) >= 0;
    var st = guideStep(G);
    if (!show && st && (st.id === 'range' || st.id === 'place') && G.td.guide.pad && G.td.guide.pad.tower) {
      t = G.td.guide.pad.tower; show = true;
    }
    if (!show && a && a.build && a.mouse) {
      var pad = nearestPad(G, a.mouse.x - G.view.w / 2 + G.cam.x, a.mouse.y - G.view.h / 2 + G.cam.y, 96);
      if (pad) {
        var sh = R.shot(G.levelId, a.build, 1, null), sp = w2s(G, pad.x, pad.y);
        ctx.save();
        ctx.beginPath(); ctx.arc(sp.x, sp.y, sh.range, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(42,36,28,0.55)'; ctx.lineWidth = 1.4; ctx.setLineDash([5, 6]); ctx.stroke();
        ctx.restore();
      }
    }
    if (!show || !t) return;
    var ss = XY.towerStat(G, t), sp2 = w2s(G, t.x, t.y);
    ctx.save();
    ctx.beginPath(); ctx.arc(sp2.x, sp2.y, ss.range, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(70,54,32,0.05)'; ctx.fill();
    ctx.strokeStyle = 'rgba(42,36,28,0.7)'; ctx.lineWidth = 1.6; ctx.setLineDash([6, 5]); ctx.stroke();
    ctx.restore();
  }
  function drawForms(ctx, G) {
    var act = G.td.active;
    if (act.tower) {
      var f = R.formById(act.tower), pts = [];
      G.towers.forEach(function (t) { if (t.tdPad != null) pts.push(w2s(G, t.x, t.y)); });
      if (pts.length >= 2) {
        ctx.save();
        ctx.strokeStyle = 'rgba(36,28,20,0.72)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (var i = 1; i < pts.length; i++) {
          var mx = (pts[i - 1].x + pts[i].x) / 2 + (i % 2 ? 10 : -8);
          var my = (pts[i - 1].y + pts[i].y) / 2 + (i % 2 ? -6 : 8);
          ctx.quadraticCurveTo(mx, my, pts[i].x, pts[i].y);
        }
        ctx.stroke();
        var cx = 0, cy = 0;
        pts.forEach(function (p) { cx += p.x; cy += p.y; });
        cx /= pts.length; cy /= pts.length;
        ctx.fillStyle = '#2a241c';
        ctx.font = inkFont(16, true);
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(f.name, cx, cy - 18);
        seal(ctx, cx + 46, cy - 28, 16, '阵');
        ctx.restore();
      }
    }
    if (act.hero) {
      var fh = R.formById(act.hero), home = w2s(G, G.heroes[0].x, G.heroes[0].y);
      ctx.save();
      ctx.strokeStyle = 'rgba(110,33,27,0.75)';
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(home.x, home.y, 92, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#2a241c';
      ctx.font = inkFont(15, true);
      ctx.textAlign = 'center';
      ctx.fillText(fh.name, home.x, home.y - 100);
      seal(ctx, home.x + 52, home.y - 108, 15, '守');
      ctx.restore();
    }
  }
  function drawHud(ctx, G, a) {
    var W = G.view.w, H = G.view.h, td = G.td, narrow = phone() || W < 520;
    var hint = td.phase === 'deploy' ? '布置天兵，准备好后点开战' : (td.phase === 'gap' ? '波次间隙，可以继续建塔、升级' : (td.hint > 0 ? '波次间隙可以继续建塔、升级' : ''));
    var py = narrow ? 108 : 78;
    if (!narrow && hint) {
      ctx.font = inkFont(16, true);
      var hw = Math.min(W - 24, ctx.measureText(hint).width + 28);
      paper(ctx, (W - hw) / 2, 40, hw, 32);
      ctx.fillStyle = '#2a241c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(hint, W / 2, 56);
    }
    var prev = R.preview(G.levelId);
    var pw = narrow ? Math.min(250, W - 86) : 300, ph = narrow ? 118 : 108;
    paper(ctx, 8, py, pw, ph);
    ctx.fillStyle = '#2a241c'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = inkFont(narrow ? 13 : 15, true);
    ctx.fillText('第 ' + G.levelId + ' 关 · ' + (G.lv.name || ''), 18, py + 8);
    ctx.fillText('命 ' + td.lives + '/' + td.maxLives, 18, py + 26);
    ctx.font = inkFont(narrow ? 12 : 13, false);
    ctx.fillStyle = '#4a4034';
    var sub = narrow
      ? ((hint ? hint + '。' : '') + prev.count + ' 波 · ' + prev.kinds.join('、') + ' · 末波' + prev.boss)
      : (prev.route + ' · ' + prev.count + ' 波 · ' + prev.kinds.join('、') + ' · 末波' + prev.boss);
    var lines = wrapText(ctx, sub, pw - 20).slice(0, narrow ? 2 : 3);
    lines.forEach(function (ln, i) { ctx.fillText(ln, 18, py + 46 + i * 16); });
    if (td.phase === 'fight' || td.phase === 'gap') {
      ctx.fillStyle = '#6e211b';
      ctx.fillText(td.phase === 'gap' ? ('下一波 ' + Math.ceil(td.gapT) + ' 秒') : ('第 ' + Math.min(td.wi + 1, td.waves.length) + '/' + td.waves.length + ' 波'), 18, py + ph - 16);
    }
    if (td.phase === 'deploy') {
      var sr = narrow ? 30 : 40, sx = W - sr - 10, sy = py + sr + 4;
      seal(ctx, sx, sy, sr, '开战');
      hit(sx - sr - 6, sy - sr - 6, sr * 2 + 12, sr * 2 + 12, 'tdStart');
    }
    var tabY = H - (narrow ? 168 : 132);
    paper(ctx, 8, tabY, narrow ? 132 : 150, 36);
    ctx.font = inkFont(14, true);
    ctx.fillStyle = td.tab === 'tower' ? '#9a2e24' : '#2a241c';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('天兵', 18, tabY + 18);
    hit(8, tabY, 64, 36, 'tdTab', { id: 'tower' });
    if (R.formTab(G.levelId)) {
      ctx.fillStyle = td.tab === 'form' ? '#9a2e24' : '#2a241c';
      ctx.fillText('阵型', 78, tabY + 18);
      hit(72, tabY, 70, 36, 'tdTab', { id: 'form' });
    }
    if (td.tab === 'form' && R.formTab(G.levelId)) drawFormPanel(ctx, G, a, narrow);
    if (a && a.selTower && G.towers.indexOf(a.selTower) >= 0) drawUpgrade(ctx, G, a, a.selTower, narrow);
  }
  function drawFormPanel(ctx, G, a, narrow) {
    var list = R.FORMATIONS, x = narrow ? 16 : G.view.w - 320, y = narrow ? 280 : 180, w = narrow ? Math.min(440, G.view.w - 140) : 300;
    var row = 64, h = Math.min(G.view.h * 0.62, 44 + list.length * row);
    paper(ctx, x, y, w, h);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#2a241c'; ctx.font = inkFont(15, true);
    ctx.fillText('阵型（点一下选用，再点取消）', x + 12, y + 8);
    var unlocked = R.unlocked(G.levelId);
    list.forEach(function (f, i) {
      var yy = y + 34 + i * row;
      if (yy > y + h - row) return;
      var on = G.td.formTower === f.id || G.td.formHero === f.id;
      var open = f.unlock <= G.levelId;
      ctx.fillStyle = on ? 'rgba(154,46,36,0.08)' : 'rgba(0,0,0,0)';
      ctx.fillRect(x + 8, yy - 2, w - 16, row - 6);
      ctx.fillStyle = open ? '#2a241c' : '#8a7d6a';
      ctx.font = inkFont(14, true);
      ctx.fillText(f.name + (f.who === 'hero' ? ' · 留守' : ' · 天兵'), x + 12, yy);
      ctx.font = inkFont(12, false);
      ctx.fillStyle = '#5c5144';
      var brief = open ? f.effect.split('。')[0] : ('第 ' + f.unlock + ' 关解锁');
      while (brief.length > 2 && ctx.measureText(brief).width > w - 36) brief = brief.slice(0, -1);
      ctx.fillText(brief, x + 12, yy + 22);
      if (open) hit(x + 8, yy - 2, w - 16, row - 6, 'tdPick', { id: f.id });
    });
    var gy = y + h - 4;
    if (!narrow) {
      /* 留守按钮画在面板下沿外面，避免和列表抢 */
    }
    var names = G.heroes.filter(function (h) { return h.id !== 'tang' && !h.down; });
    var bx = 8, by = G.view.h - (narrow ? 214 : 178);
    names.forEach(function (h, i) {
      var bw = narrow ? 70 : 78;
      paper(ctx, bx + i * (bw + 4), by, bw, 36);
      ctx.fillStyle = h.order === 'station' ? '#9a2e24' : '#2a241c';
      ctx.font = inkFont(12, true);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText((h.def.name || '').slice(0, 2) + (h.order === 'station' ? '·守' : '·留'), bx + i * (bw + 4) + bw / 2, by + 18);
      hit(bx + i * (bw + 4), by, bw, 36, 'tdGarrison', { i: h.i });
    });
  }
  function drawUpgrade(ctx, G, a, t, narrow) {
    var sp = w2s(G, t.x, t.y);
    var w = narrow ? Math.min(220, G.view.w - 16) : 240, h = 132;
    var target = { x: sp.x - 30, y: sp.y - 30, w: 60, h: 60 };
    var card = narrow
      ? { x: 8, y: Math.min(G.view.h - h - 150, 250) }
      : R.placeCard({ w: G.view.w, h: G.view.h }, target, { w: w, h: h });
    if (narrow && !(card.x + w < target.x || card.x > target.x + target.w || card.y + h < target.y || card.y > target.y + target.h)) {
      card = { x: Math.max(8, G.view.w - w - 8), y: 250 };
    }
    paper(ctx, card.x, card.y, w, h);
    var d = R.TOWERS[t.type], lv = t.lv || 1, next = lv < 3 ? R.upgradeCost(t.type, lv + 1) : 0;
    ctx.fillStyle = '#2a241c'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = inkFont(16, true);
    ctx.fillText(d.name + '  Lv' + lv, card.x + 12, card.y + 10);
    ctx.font = inkFont(13, false); ctx.fillStyle = '#4a4034';
    ctx.fillText(d.role + ' · 已花 ' + (t.spent || d.cost), card.x + 12, card.y + 34);
    ctx.fillText('出售收回 ' + R.sellRefund(t.type, lv) + ' 金币', card.x + 12, card.y + 54);
    var bw = (w - 36) / 2;
    seal(ctx, card.x + 18 + bw / 2, card.y + 100, 22, lv >= 3 ? '满' : '升');
    hit(card.x + 12, card.y + 78, bw, 44, 'tdUpgrade');
    ctx.fillStyle = '#2a241c'; ctx.font = inkFont(14, true); ctx.textAlign = 'center';
    paper(ctx, card.x + 24 + bw, card.y + 78, bw, 40);
    ctx.fillText('出售', card.x + 24 + bw + bw / 2, card.y + 90);
    hit(card.x + 24 + bw, card.y + 78, bw, 40, 'tdSell');
    if (next) {
      ctx.textAlign = 'left'; ctx.font = inkFont(12, false); ctx.fillStyle = '#6e211b';
      ctx.fillText(next + ' 金', card.x + 12, card.y + 72);
    }
  }
  function drawGuide(ctx, G) {
    var st = guideStep(G); if (!st) return;
    var W = G.view.w, H = G.view.h, target = null;
    if (st.id === 'pad' || st.id === 'place' || st.id === 'range') {
      var pad = G.td.guide.pad;
      if (pad) { var s = w2s(G, pad.x, pad.y); target = { x: s.x - 28, y: s.y - 28, w: 56, h: 56 }; }
    } else if (st.id === 'start') {
      var sr = phone() ? 30 : 40, py = phone() ? 108 : 78, sx = W - sr - 10, sy = py + sr + 4;
      target = { x: sx - sr - 6, y: sy - sr - 6, w: sr * 2 + 12, h: sr * 2 + 12 };
    } else if (st.id === 'tab' || st.id === 'pick') {
      target = { x: 72, y: H - (W < 520 ? 168 : 132), w: 78, h: 36 };
    } else if (st.id === 'hold') {
      target = { x: 8, y: H - (W < 520 ? 214 : 178), w: Math.min(240, W - 16), h: 36 };
    } else if (st.id === 'upgrade') {
      var tw = G.td.guide.pad && G.td.guide.pad.tower;
      if (tw) { var s2 = w2s(G, tw.x, tw.y); target = { x: s2.x - 28, y: s2.y - 28, w: 56, h: 56 }; }
    }
    if (!target) target = { x: W / 2 - 20, y: H / 2 - 20, w: 40, h: 40 };
    ctx.save();
    ctx.fillStyle = 'rgba(246,240,226,0.55)';
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.rect(target.x - 6, target.y - 6, target.w + 12, target.h + 12);
    ctx.fill('evenodd');
    ctx.strokeStyle = '#6e211b'; ctx.lineWidth = 2;
    ctx.strokeRect(target.x - 6, target.y - 6, target.w + 12, target.h + 12);
    ctx.restore();
    var size = R.cardSize({ w: W, h: H });
    var pos = phone() ? { x: 16, y: G.td.tab === 'form' ? 760 : 260 } : R.placeCard({ w: W, h: H }, target, size);
    if (phone()) size = { w: Math.min(460, W - 32), h: 170 };
    paper(ctx, pos.x, pos.y, size.w, size.h);
    var list = G.td.guide.kind === 'form' ? R.FORM_GUIDE : R.LINE_GUIDE;
    ctx.fillStyle = '#9a2e24'; ctx.font = inkFont(12, true); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText((G.td.guide.kind === 'form' ? '阵型' : '布阵') + ' ' + (G.td.guide.i + 1) + '/' + list.length, pos.x + 12, pos.y + 8);
    ctx.fillStyle = '#2a241c'; ctx.font = inkFont(W < 520 ? 14 : 15, false);
    var ls = wrapText(ctx, st.text, size.w - 24).slice(0, 4);
    ls.forEach(function (ln, i) { ctx.fillText(ln, pos.x + 12, pos.y + 30 + i * 20); });
    var by = pos.y + size.h - 40;
    paper(ctx, pos.x + 12, by, 72, 30);
    ctx.fillStyle = '#2a241c'; ctx.font = inkFont(13, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('跳过', pos.x + 48, by + 15);
    hit(pos.x + 12, by, 72, 30, 'tdGuideSkip');
    if (st.id === 'range' || st.id === 'roles' || st.id === 'eye' || st.id === 'upgrade' || st.id === 'hold') {
      seal(ctx, pos.x + size.w - 48, by + 15, 16, '下一步');
      hit(pos.x + size.w - 78, by, 70, 32, 'tdGuideNext');
    }
  }
  function drawChooser(ctx, a) {
    var W = a.lw || 800, H = a.lh || 600;
    ctx.save();
    var z = (a.zoom || 1) * (a.dpr || 1);
    ctx.setTransform(z, 0, 0, z, 0, 0);
    ctx.fillStyle = 'rgba(246,240,226,0.72)';
    ctx.fillRect(0, 0, W, H);
    var w = Math.min(420, W - 24), h = 280, x = (W - w) / 2, y = Math.max(16, (H - h) / 2);
    paper(ctx, x, y, w, h);
    ctx.fillStyle = '#2a241c'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = inkFont(18, true);
    ctx.fillText('新手教程', x + 16, y + 14);
    ctx.font = inkFont(13, false); ctx.fillStyle = '#4a4034';
    ctx.fillText('选一段再看。只重看，不清存档。', x + 16, y + 42);
    [['l1', '第一关 · 走路和操作'], ['l2', '第二关 · 布置天兵'], ['l3', '第三关 · 阵型']].forEach(function (b, i) {
      var yy = y + 74 + i * 52;
      paper(ctx, x + 16, yy, w - 32, 44);
      ctx.fillStyle = '#2a241c'; ctx.font = inkFont(16, true); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(b[1], x + 28, yy + 22);
      hit(x + 16, yy, w - 32, 44, 'tdReplayGo', { id: b[0] });
    });
    ctx.fillStyle = '#6e211b'; ctx.font = inkFont(13, false); ctx.textAlign = 'right';
    ctx.fillText('关闭', x + w - 16, y + h - 22);
    hit(x + w - 80, y + h - 36, 70, 28, 'tdReplayClose');
    ctx.restore();
  }

  var origRender = XY.render;
  XY.render = function (ctx, G, a) {
    origRender(ctx, G, a);
    if (!a) return;
    if (a.tdChooser) { try { drawChooser(ctx, a); } catch (e) { if (window.console) console.warn(e); } }
    if (!G || !G.td || a.screen !== 'play' || G.mode !== 'play') return;
    try {
      var z = (a.zoom || 1) * (a.dpr || 1);
      ctx.setTransform(z, 0, 0, z, 0, 0);
      if (G.td.needCam) focus(G, 'deploy');
      refreshForms(G);
      drawPads(ctx, G);
      drawRange(ctx, G, a);
      drawForms(ctx, G);
      drawHud(ctx, G, a);
      if (G.td.guide) drawGuide(ctx, G);
    } catch (err) { if (window.console) console.warn('tdline', err); }
  };
})();
