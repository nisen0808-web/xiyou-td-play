/* 第二关、第三关的天兵层。不改英雄伤害，不改原有怪的血量。
 * 第二关起多一队直扑唐僧的飞妖，只有天兵和阵法连携打得着。
 * 布阵时整段模拟停住；开战之后仍是原来的西行。
 */
(function () {
  'use strict';
  (function loadBrush() {
    if (typeof FontFace === 'undefined' || typeof document === 'undefined') return;
    var b64 = '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';
    var face = new FontFace('TDBrush', 'url(data:font/woff2;base64,' + b64 + ')');
    face.load().then(function (f) { document.fonts.add(f); }).catch(function () {});
  })();
  if (!window.XY || !window.TDRules) return;
  var XY = window.XY, R = window.TDRules, C = XY.C;
  var TD = XY.tdline = { rules: R, force: null };
  var PI2 = Math.PI * 2;

  function app() { return (window.__xy && window.__xy.app) || XY.app || null; }
  function hypot(x, y) { return Math.sqrt(x * x + y * y); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function disc(G) { return XY.solMods ? XY.solMods(G).cost : 1; }
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
  function phone() { var a = app(); return !!(a && a.zoom <= 0.65); }

  TD.price = function (G, type, kind) { return R.price(type, kind, disc(G)); };

  function eligible(G) {
    return R.gate({
      levelId: G.levelId, noJourney: G.noJourney, lair: G.lair, villain: G.villain,
      dungeon: !!G.dungeon, mod: !!G.mod
    });
  }

  /* ---------- 推荐位 ---------- */
  function makeSpots(G) {
    var route = { total: G.rt.total, at: function (s) { return XY.routeAt(G.rt, s); } };
    var list = R.spots(G.levelId, route, G.camp);
    return list.filter(function (p) {
      if (p.x < 40 || p.y < 40 || p.x > C.WORLD_W - 40 || p.y > C.WORLD_H - 40) return false;
      if (XY.routeProject(G.rt, p.x, p.y).d > C.ROAD_HALF) return false;
      var i;
      for (i = 0; i < G.dens.length; i++) if (hypot(p.x - G.dens[i].x, p.y - G.dens[i].y) < C.DEN_NOBUILD) return false;
      return true;
    });
  }

  function boot(G) {
    var grant = R.START_GRANT[G.levelId] || R.START_GRANT[3];
    G.coins += grant;
    G.td = {
      on: true, deploy: !G.tut, pending: !!G.tut, started: false,
      hold: { deploy: !G.tut, pause: false, party: false, skills: false, guide: false, tip: false },
      spots: makeSpots(G), guide: null, focus: null, gapT: 0, inSurge: false,
      surges: G.stats.surges || 0, restHint: false, restFormHint: false,
      dmg: { hero: 0, tower: 0 }, dmgRest: { hero: 0, tower: 0 }, byType: {},
      toastBat: false, toastLife: false, baguaTill: 0, form: { tower: null, hero: null },
      clock: 0, tangSafe: 0, campShield: 0,
      fly: { n: 0, waves: 0, towerKills: 0, leak: 0 },
      combos: {}, fx: []
    };
    G.towers.forEach(function (t) {
      t.free = true; t.paid = 0; t._rank = t.lv || 1;
      if (!t._tdLife) { t._tdLife = 1; t.maxLife = (t.maxLife || t.life || 1) * R.LIFE_MUL; t.life = t.maxLife; }
    });
    if (!G.tut) openGuide(G);
  }
  function openGuide(G) {
    var seen = tutStore(), force = TD.force;
    TD.force = null;
    if (force === 'td2' || (!seen.td2 && G.levelId === 2 && force !== 'td3')) G.td.guide = { kind: 'td2', i: 0 };
    else if (force === 'td3' || (!seen.td3 && G.levelId >= 3 && force !== 'td2')) G.td.guide = { kind: 'td3', i: 0 };
  }
  TD.start = function (G) {
    if (!G || !G.td || !G.td.deploy) return false;
    if (G.td.guide) return false;
    G.td.deploy = false;
    G.td.hold.deploy = false;
    G.td.started = true;
    if (XY.sfx) XY.sfx('start');
    return true;
  };

  var origNew = XY.newGame;
  XY.newGame = function (id, opts) {
    var G = origNew(id, opts);
    opts = opts || {};
    if (!eligible(G) || opts.sweep || opts.skipDeploy || window.XY_TD_SKIP_DEPLOY) return G;
    boot(G);
    return G;
  };
  var origTutFinish = XY.tutFinish;
  XY.tutFinish = function (G, skipped) {
    var r = origTutFinish(G, skipped);
    if (G && G.td && G.td.pending) {
      G.td.pending = false;
      G.td.deploy = true;
      G.td.hold.deploy = true;
      openGuide(G);
    }
    return r;
  };

  /* ---------- 伤害、战阶、克制。英雄系数不动。 ---------- */
  function mulOf(G) { return R.TOWER_DMG_MUL[G.levelId] || R.TOWER_DMG_MUL[3]; }
  var prevStat = XY.towerStat;
  XY.towerStat = function (G, t) {
    var s = prevStat(G, t);
    if (!G || !G.td || !G.td.on || !t) return s;
    var rank = t._rank || t.lv || 1, used = t.lv || 1;
    if (used !== rank) {
      var dmgK = 1 + 0.5 * (used - 1), rngK = 1 + 0.1 * (used - 1);
      if (dmgK) s.dmg /= dmgK;
      if (rngK) s.range /= rngK;
      if (used === 3) s.cd /= 0.85;
    } else {
      var dk = 1 + 0.5 * (rank - 1), rk = 1 + 0.1 * (rank - 1);
      if (dk) s.dmg /= dk;
      if (rk) s.range /= rk;
      if (rank === 3) s.cd /= 0.85;
    }
    var dmgRank = (t.type === 'arrow' || t.type === 'cannon' || t.type === 'siege') ? R.rankOf(R.rank.dmg, rank) : 1;
    s.dmg *= dmgRank * mulOf(G);
    var formAdd = t._formDmg || 0;
    var usedBuff = (t._sb && t._sb.dmg) || 0;
    s.dmg *= 1 + R.room(usedBuff, formAdd, C.SOLBUFF && C.SOLBUFF.cap);
    return s;
  };
  var prevMax = XY.towerMaxHp;
  XY.towerMaxHp = function (t) {
    var base = prevMax(t);
    var rank = (t && (t._rank || t.lv)) || 1;
    var old = 1 + 0.5 * ((t && t.lv || 1) - 1);
    var want = R.rankOf(R.rank.hp, rank);
    return old ? base / old * want : base;
  };

  var prevHurt = XY.onHurt;
  XY.onHurt = function (G, e, dmg, em, el, dt, o) {
    if (prevHurt) prevHurt(G, e, dmg, em, el, dt, o);
    if (!G || !G.td || !G.td.on || !o || !(dmg > 0)) return;
    if (o.combo) { noteComboHit(G, o, dmg, e); return; }
    var towerHit = !!(o.anti || o.tower || o._tower || (!o.src && !o.fb));
    var heroHit = !!(o.src && o.src.i !== undefined && !o.fb);
    if (towerHit && !heroHit) {
      var kind = o.kind || (o.anti ? 'siege' : (o.ground && !o.dot) ? 'cannon' : (o.dot && o.elem === 'water') ? 'frost' : 'arrow');
      if (kind === 'bolt') kind = 'siege';
      if (kind === 'glow') kind = 'heal';
      var extra = R.counterExtra(kind, { fly: e.fly || e.tdSky, type: e.type, elite: !!(e.def && (e.def.elite || e.type === 'elite')) });
      var bonus = extra > 0 ? dmg * extra : 0;
      if (e.def && e.def.denBoss) bonus += dmg * 2;
      if (bonus) e.hp -= bonus;
      var dealt = dmg + bonus;
      G.td.dmg.tower += dealt;
      if (G.tang && G.tang.phase === 'rest') G.td.dmgRest.tower += dealt;
      var tk = e.type || 'other';
      G.td.byType[tk] = (G.td.byType[tk] || 0) + dealt;
      if (e.tdSky && e.hp - dmg <= 0 && !e._skyKill) { e._skyKill = 1; G.td.fly.towerKills++; }
      if (e.tdSky && G.heroes && G.heroes[0]) {
        var tx = G.heroes[0].x, ty = G.heroes[0].y, kx = e.x - tx, ky = e.y - ty, kl = Math.sqrt(kx * kx + ky * ky) || 1;
        e.kx = (e.kx || 0) + kx / kl * 380; e.ky = (e.ky || 0) + ky / kl * 380;
        if (kl < 110) { e.x += kx / kl * 48; e.y += ky / kl * 48; e.fs = 'recover'; e.fsT = 0.8; e.diveCd = 1.3; }
      }
      var form = G.td.form.tower;
      if (form && form.state === 'active' && o.srcTower && form.members && form.members.indexOf(o.srcTower) >= 0) {
        var spec = R.COMBOS[form.id];
        form.charge = Math.min(1, (form.charge || 0) + dmg / (spec ? 5000 : 5000));
      }
    } else if (heroHit) {
      var heroBonus = o.src._fengshi && e._fengshi ? 0.12 : 0;
      if (heroBonus && e.def && (e.def.boss || e.def.etower)) heroBonus = 0;
      if (heroBonus) e.hp -= dmg * heroBonus;
      G.td.dmg.hero += dmg * (1 + heroBonus);
      if (G.tang && G.tang.phase === 'rest') G.td.dmgRest.hero += dmg * (1 + heroBonus);
    }
  };
  var prevTowerHurt = XY.hurtTower;
  if (prevTowerHurt) XY.hurtTower = function (G, t, dmg) {
    if (G && G.td && G.td.on) return;
    if (G && G.td && t && t._formDr) dmg *= 1 - Math.min(0.5, t._formDr);
    return prevTowerHurt(G, t, dmg);
  };
  XY.tdHitBlock = function (G, e, o) {
    if (!G || !G.td || !G.td.on || !e || !e.tdSky) return false;
    o = o || {};
    var cannon = o.kind === 'shell' || (o.ground && !o.tower && !o.combo);
    return R.blockFlyer({
      flyer: true,
      cannon: cannon,
      tower: !!(o.tower || o.kind === 'arrow' || o.kind === 'bolt' || o.kind === 'frost' || o.kind === 'glow'),
      combo: !!o.combo
    });
  };
  XY.tdTangSave = function (G, h) {
    return !!(G && G.td && G.td.on && h && G.heroes && h === G.heroes[0] && G.td.tangSafe > G.td.clock);
  };
  if (XY.pickTarget) {
    var pick0 = XY.pickTarget;
    XY.pickTarget = function (G, e) {
      if (e && e.tdSky && G && G.td && G.td.on) {
        if (G.camp && G.camp.active) return G.camp;
        return G.heroes[0];
      }
      return pick0(G, e);
    };
  }
  function noteComboHit(G, o, dmg, e) {
    var id = o.combo;
    var row = G.td.combos[id] || (G.td.combos[id] = { casts: 0, dmg: 0 });
    row.dmg += dmg;
    if (e && e.tdSky) {
      G.td.dmg.tower += dmg;
      if (e.hp - dmg <= 0 && !e._skyKill) { e._skyKill = 1; G.td.fly.towerKills++; }
    } else if (o.comboHero) {
      G.td.dmg.hero += dmg;
    } else {
      G.td.dmg.tower += dmg;
      if (G.tang && G.tang.phase === 'rest') G.td.dmgRest.tower += dmg;
    }
  }

  /* ---------- 放置：原来的禁区都还在，靠近推荐位才吸附 ---------- */
  var origPlace = XY.placeTower;
  XY.placeTower = function (G, type, x, y) {
    if (!(G && G.td && G.td.on)) return origPlace(G, type, x, y);
    var z = (app() && app().zoom) || 1;
    var spot = R.snap(x, y, G.td.spots, z);
    var px = spot ? spot.x : x, py = spot ? spot.y : y;
    var before = G.coins, n0 = G.towers.length;
    var ok = origPlace(G, type, px, py);
    if (ok && G.towers.length > n0) {
      var t = G.towers[G.towers.length - 1];
      t.paid = (t.paid || 0) + Math.max(0, before - G.coins);
      t.free = false;
      t._rank = t.lv || 1;
      if (!t._tdLife) { t._tdLife = 1; t.maxLife = (t.maxLife || t.life || 1) * R.LIFE_MUL; t.life = t.maxLife; }
      t.spot = spot ? spot.i : null;
      var g = guideStep(G);
      if (g && g.id === 'hire') advanceGuide(G);
    }
    return ok;
  };

  TD.upgrade = function (G, t) {
    if (!G || !G.td || !t) return false;
    var rank = t._rank || t.lv || 1;
    if (rank >= 3) { if (XY.toast) XY.toast(G, '已经满级'); return false; }
    var cost = TD.price(G, t.type, rank === 1 ? 'up2' : 'up3');
    if (G.coins < cost) { if (XY.toast) XY.toast(G, '升级要 ' + cost + ' 金币'); return false; }
    G.coins -= cost;
    t.paid = (t.paid || 0) + cost;
    t.lv = rank + 1; t._rank = t.lv;
    var mh = XY.towerMaxHp(t);
    t.maxHp = mh; t.hp = Math.min(mh, t.hp);
    t._tdLife = 1;
    t.maxLife = (XY.towerMaxLife ? XY.towerMaxLife(t) : (t.maxLife || 1)) * R.LIFE_MUL;
    t.life = t.maxLife;
    if (t.lv >= 3 && G.stats) G.stats.tower3 = true;
    if (XY.core && XY.core.text) XY.core.text(G, t.x, t.y - 36, '升级 Lv' + t.lv, 'big');
    if (XY.sfx) XY.sfx('upgrade');
    return true;
  };
  TD.recall = function (G, t) {
    if (!G || !G.td || !t) return false;
    var back = R.refund(t.paid || 0, t.hp, XY.towerMaxHp(t), t.life, t.maxLife || t.life, G.td.started);
    G.coins += back;
    t.recalled = true;
    var k = G.towers.indexOf(t);
    if (k >= 0) G.towers.splice(k, 1);
    var a = app(); if (a && a.selTower === t) a.selTower = null;
    if (XY.toast) XY.toast(G, back ? ('遣返，退回 ' + back + ' 金币') : '遣返。这名弓兵是请来的，没有可退的钱');
    breakForms(G, t, 'recall');
    return true;
  };
  XY.upgradeTower = function (G, t) {
    if (G && G.td && G.td.on) return TD.upgrade(G, t || (app() && app().selTower));
    if (XY.toast) XY.toast(G, '这一关的天兵先跟着队伍');
    return false;
  };
  TD.moveTower = function (G, t, x, y) {
    if (!t) return false;
    var z = (app() && app().zoom) || 1;
    var spot = R.snap(x, y, G.td.spots, z) || { x: x, y: y, i: null };
    if (XY.towerBlock && XY.towerBlock(G, t.type, spot.x, spot.y)) {
      if (XY.toast) XY.toast(G, XY.towerBlock(G, t.type, spot.x, spot.y));
      return false;
    }
    t.x = spot.x; t.y = spot.y; t.mode = 'garrison'; t.anchor = { x: spot.x, y: spot.y };
    if (XY.soldierMode) XY.soldierMode(G, t);
    t.mode = 'garrison';
    t.spot = spot.i;
    var g = guideStep(G);
    if (g && g.id === 'move') advanceGuide(G);
    return true;
  };

  /* ---------- 模拟 ---------- */
  var origStep = XY.step;
  var origDens = XY.updateDens;
  var origSoldiers = XY.updateSoldiers;
  XY.updateDens = function (G, dt) {
    if (G && G.td && G.td.on && (G.td.deploy || G.td.gapT > 0)) return;
    return origDens(G, dt);
  };
  XY.updateSoldiers = function (G, dt) {
    if (!(G && G.td && G.td.on)) return origSoldiers(G, dt);
    if (G.td.deploy) return;
    var lives = G.towers.map(function (t) { return t.life; });
    origSoldiers(G, dt);
    if (G.td.gapT > 0) G.towers.forEach(function (t, i) { if (lives[i] != null) t.life = lives[i]; });
    /* 原版天兵有寿命，到点会自己撤走。这一层把他们留下：玩家花金币请来的人要守完整段西行，不在半路集体走光。犒赏和升级还在。 */
    G.towers.forEach(function (t) { if (t.maxLife) { t.life = t.maxLife; } });
    pinRest(G);
    pinForms(G);
  };
  function pinRest(G) {
    if (!G.tang || G.tang.phase !== 'rest' || !G.camp) return;
    var list = G.towers.filter(function (t) { return t.mode === 'follow' && !t.holdForm; });
    var rad = C.CAMP_ZONE_R + 40, n = list.length, i;
    for (i = 0; i < n; i++) {
      var a = i / n * PI2 - Math.PI / 2;
      list[i].x = G.camp.x + Math.cos(a) * rad;
      list[i].y = G.camp.y + Math.sin(a) * rad;
    }
  }

  XY.step = function (G, dt) {
    if (!G || !G.td || !G.td.on) return origStep(G, dt);
    noteHolds(G);
    if (G.tut || G.td.pending) return origStep(G, dt);
    if (G.td.deploy || G.td.hold.deploy) return;
    var surge0 = G.stats.surges || 0;
    var ids = {};
    G.enemies.forEach(function (e) { ids[e.id] = 1; });
    var slow0 = G.enemies.map(function (e) { return e.slowT || 0; });
    prepareRanks(G);
    var sp = G.tang.speed;
    if (G.td.gapT > 0) G.tang.speed = 0;
    var camp0 = G.camp.hp;
    var jin = G.td.form.hero && G.td.form.hero.id === 'jinchan' && G.td.form.hero.state === 'active';
    var tw0 = C.TANG_TARGET_W, speeds = null;
    if (jin) {
      C.TANG_TARGET_W = (tw0 || 0) + 1;
      speeds = G.td.form.hero.members.map(function (h) { return h ? h.speed : 0; });
      G.td.form.hero.members.forEach(function (h) { if (h && !h.down) h.speed *= 0.9; });
    }
    splashBoost(G);
    coverSky(G);
    skyVolley(G, dt);
    baitBoss(G);
    try { origStep(G, dt); } finally {
      G.tang.speed = sp;
      restoreRanks(G);
      if (jin) {
        C.TANG_TARGET_W = tw0;
        G.td.form.hero.members.forEach(function (h, i) { if (h) h.speed = speeds[i]; });
      }
      XY.TOWERS.cannon.splash = TD._splash0 || XY.TOWERS.cannon.splash;
    }
    baitBoss(G);
    extendFrost(G, slow0);
    if (G.td.gapT > 0) G.td.gapT = Math.max(0, G.td.gapT - dt);
    G.td.clock += dt;
    if ((G.stats.surges || 0) > surge0) {
      G.coins += R.WAVE_BOUNTY[G.levelId] || R.WAVE_BOUNTY[3];
      G.enemies.forEach(function (e) { if (!ids[e.id] && e.road) e.coinM = R.WAVE_COIN; });
      G.td.inSurge = true;
      spawnSky(G);
    }
    if (G.td.fly.waves === 0 && G.td.clock > 0.8) spawnSky(G);
    if (G.td.inSurge && G.enemies.filter(function (e) { return !e.dead && !e.def.denBoss; }).length < 6) {
      G.td.inSurge = false;
      G.td.gapT = R.GAP;
      if (XY.banner) XY.banner(G, '这一波过去了。可以用这 ' + R.GAP + ' 秒继续请天兵。', 2.6);
    }
    tideBounty(G);
    restWatch(G);
    campForm(G, camp0, dt);
    campGuard(G, camp0, dt);
    formTick(G, dt);
    skyLeak(G);
    fadeFx(G, dt);
    toasts(G);
    if (G.td.look) { G.cam.x = G.td.look.x; G.cam.y = G.td.look.y; }
  };
  function prepareRanks(G) {
    G.towers.forEach(function (t) {
      t._rank = t._rank || t.lv || 1;
      t._lvSave = t.lv;
      if (t.type === 'heal') {
        var want = R.rankOf(R.rank.heal, t._rank);
        t.lv = 1 + (want - 1) / 0.3;
      } else t.lv = 1;
    });
  }
  function restoreRanks(G) {
    G.towers.forEach(function (t) { if (t._lvSave != null) t.lv = t._lvSave; });
  }
  function extendFrost(G, slow0) {
    var best = 1, i;
    G.towers.forEach(function (t) { if (t.type === 'frost') best = Math.max(best, R.rankOf(R.rank.slowTime, t._rank || t.lv || 1)); });
    if (best <= 1) return;
    for (i = 0; i < G.enemies.length; i++) {
      var e = G.enemies[i];
      if ((e.slowT || 0) > (slow0[i] || 0) + 0.05) e.slowT += 0.9 * (best - 1);
    }
  }
  function tideBounty(G) {
    if (!G.tang || G.tang.phase !== 'rest') { G.td._tide = -1; return; }
    var seg = Math.floor(G.tang.restT / (C.REST_SEG || 100));
    var local = G.tang.restT - seg * (C.REST_SEG || 100);
    var wrap = local >= ((C.REST_SEG || 100) - (C.REST_WRAP || 20));
    if (wrap && G.td._tide !== seg) {
      G.td._tide = seg;
      G.coins += R.TIDE_BOUNTY[G.levelId] || R.TIDE_BOUNTY[3];
    }
  }
  function restWatch(G) {
    var rest = G.tang && G.tang.phase === 'rest';
    if (rest && !G.td.wasRest) {
      var hf = G.td.form.hero;
      if (hf && (hf.id === 'sixiang' || hf.id === 'fengshi') && G.camp && hf.state !== 'broken' && hf.state !== 'ended') {
        var hd = R.formById(hf.id);
        hf.cx = G.camp.x; hf.cy = G.camp.y;
        hf.state = 'assembling'; hf.held = 0;
        if (hd && hd.order) hf.members.forEach(function (h) { if (h) h.order = hd.order; });
      }
      if (!G.td.restHint) {
        G.td.restHint = true;
        G.td.offer = true;
        if (XY.banner) XY.banner(G, '到了休息点。跟随的天兵改在营地外圈站着。可以再布一阵。', 4);
      }
      if (G.levelId >= 3 && !G.td.restFormHint) {
        G.td.restFormHint = true;
        if (XY.toast) XY.toast(G, '休息点可以换成金刚八卦阵，或四象守营阵');
      }
    }
    G.td.wasRest = rest;
    if (!rest) G.towers.forEach(function (t) { if (t.mode === 'follow') t.holdForm = false; });
  }
  XY.tdCampMul = function (G) {
    if (!G || !G.td || !G.td.on || !G.camp || !G.camp.active) return 1;
    var near = 0, i;
    for (i = 0; i < G.towers.length; i++) {
      if (hypot(G.towers[i].x - G.camp.x, G.towers[i].y - G.camp.y) < C.CAMP_ZONE_R + 90) near++;
    }
    return near >= 2 ? 0.28 : 1;
  };
  /* 休息点夜潮会把没人守的营地打穿。两名以上天兵守在营地边上时，伤害在 hurtCamp 里先打折，这里再慢慢修。 */
  function campGuard(G, camp0, dt) {
    if (!G.camp || !G.camp.active || !G.tang || G.tang.phase !== 'rest') return;
    var near = 0, i, t;
    for (i = 0; i < G.towers.length; i++) {
      t = G.towers[i];
      if (hypot(t.x - G.camp.x, t.y - G.camp.y) < C.CAMP_ZONE_R + 90) near++;
    }
    if (near < 2) return;
    var lost = camp0 - G.camp.hp;
    if (lost > 0) G.camp.hp += lost * 0.62;
    G.camp.hp = Math.min(G.camp.maxHp, G.camp.hp + near * 12 * dt);
  }
  function campForm(G, camp0, dt) {
    var f = G.td.form.hero;
    if (f && f.id === 'sixiang' && f.state === 'active' && G.camp) {
      var lost = camp0 - G.camp.hp;
      if (G.td.campShield > 0 && lost > 0) {
        var back = Math.min(lost, G.td.campShield);
        G.camp.hp += back;
        G.td.campShield -= back;
        lost -= back;
      }
      if (lost > 0) G.camp.hp = Math.min(G.camp.maxHp, G.camp.hp + lost * 0.15);
      var n = (f.members || []).filter(function (h) { return h && !h.down && h._inSlot; }).length;
      if (n) G.camp.hp = Math.min(G.camp.maxHp, G.camp.hp + 0.8 * dt);
    }
    if (f && f.id === 'jinchan' && f.state === 'active') G._tangW = (C.TANG_TARGET_W || 0) + 1;
  }
  function toasts(G) {
    var i, e, t;
    if (!G.td.toastBat) {
      for (i = 0; i < G.enemies.length; i++) {
        e = G.enemies[i];
        if (!e.dead && (e.fly || e.type === 'bat')) { G.td.toastBat = true; if (XY.toast) XY.toast(G, '炮打不着飞妖，靠弓'); break; }
      }
    }
    if (!G.td.toastLife) {
      for (i = 0; i < G.towers.length; i++) {
        t = G.towers[i];
        var rank = t._rank || t.lv || 1;
        if (rank >= 3 || !(t.maxLife > 0) || t.life / t.maxLife > 0.28) continue;
        var cost = TD.price(G, t.type, rank === 1 ? 'up2' : 'up3');
        if (G.coins >= cost) { G.td.toastLife = true; if (XY.toast) XY.toast(G, '升级能补满寿命'); break; }
      }
    }
  }
  function noteHolds(G) {
    var a = app();
    if (!a || !G.td) return;
    G.td.hold.pause = a.screen === 'pause';
    G.td.hold.party = !!a.partyPanel;
    G.td.hold.skills = G.mode === 'skills';
    G.td.hold.tip = !!a.tipHold;
    G.td.hold.guide = !!(G.td.guide && G.td.deploy);
    G.td.hold.deploy = !!G.td.deploy;
  }

  /* ---------- 飞妖：直扑唐僧 / 营地，只有天兵和连携打得着 ---------- */
  function spawnSky(G) {
    if (!G.td || (G.levelId | 0) < 2 || !XY.makeEnemy) return;
    var pack = R.flyerPack(G.levelId, G.td.fly.waves);
    var tang = G.heroes[0];
    if (!tang) return;
    var total = pack.bat + pack.owl, i, e, ang, dist;
    for (i = 0; i < total; i++) {
      if (G.enemies.length >= (C.MAX_ENEMIES || 400) - 8) break;
      ang = Math.random() * PI2;
      dist = 700 + Math.random() * 140;
      e = XY.makeEnemy(G, i < pack.bat ? 'bat' : 'owl', tang.x + Math.cos(ang) * dist, tang.y + Math.sin(ang) * dist, null);
      if (!e) continue;
      e.fly = true; e.tdSky = true; e.air = true; e.flow = true; e.road = true;
      e.fs = 'cruise'; e.fsT = 0; e.diveCd = 1.1; e.lock = null; e.coinM = R.FILL_COIN; e.xpM = C.FLOW_XP || 0.2;
      if (e.type === 'owl') e.shootT = Math.max(e.shootT || 0, 2.6);
      G.td.fly.n++;
    }
    G.td.fly.waves++;
  }
  function nearestSky(G, x, y, range) {
    var best = null, bd = Infinity, tang = G.heroes[0], i, e, d, threat;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (!e.tdSky || e.dead) continue;
      d = hypot(e.x - x, e.y - y);
      if (d > range + e.r) continue;
      threat = tang ? hypot(e.x - tang.x, e.y - tang.y) : d;
      if (threat < bd) { bd = threat; best = e; }
    }
    return best;
  }
  /* 洞主只会追人。路上的天兵如果够得着，就把他往炮口前带，免得他回洞把血养回来。 */
  function baitBoss(G) {
    var i, e, j, t, best, bd, d, dx, dy, l;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead || e.hidden || !e.def || !e.def.denBoss || e.retreatT > 0) continue;
      best = null; bd = 1e9;
      for (j = 0; j < G.towers.length; j++) {
        t = G.towers[j];
        d = hypot(t.x - e.x, t.y - e.y);
        if (d < bd) { bd = d; best = t; }
      }
      if (!best || bd > 900 || bd < 40) continue;
      dx = best.x - e.x; dy = best.y - e.y; l = hypot(dx, dy) || 1;
      e.x += dx / l * 7; e.y += dy / l * 7;
      e.engaged = true; e.hidden = false;
    }
  }
  function coverSky(G) {
    if (!G.towers.length || !G.heroes[0]) return;
    var tang = G.heroes[0], i, e, t, covered, dx, dy, d;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (!e.tdSky || e.dead || e.fs !== 'dive') continue;
      covered = false;
      for (t = 0; t < G.towers.length; t++) {
        if ((G.towers[t].type === 'arrow' || G.towers[t].type === 'siege' || G.towers[t].type === 'frost') && hypot(G.towers[t].x - e.x, G.towers[t].y - e.y) < 440) { covered = true; break; }
      }
      if (!covered) continue;
      dx = e.x - tang.x; dy = e.y - tang.y; d = hypot(dx, dy) || 1;
      if (d < 220) { e.x += dx / d * 90; e.y += dy / d * 90; e.fs = 'recover'; e.fsT = 0.7; e.diveCd = 1.4; }
    }
  }
  function skyVolley(G, dt) {
    var i, t, s, sky, dmg;
    for (i = 0; i < G.towers.length; i++) {
      t = G.towers[i];
      if (!R.hitsFlyer(t.type)) continue;
      s = XY.towerStat(G, t);
      var airR = s.range * ((t.type === 'arrow' || t.type === 'siege') ? 1.5 : 1);
      if (t.type === 'heal') {
        t._skyCd = (t._skyCd || 0) - dt;
        if (t._skyCd > 0) continue;
        sky = nearestSky(G, t.x, t.y, airR);
        if (!sky) continue;
        t._skyCd = s.cd;
        dmg = 9 * (R.rankOf(R.rank.dmg, t._rank || t.lv || 1)) * mulOf(G);
        XY.core.hurtEnemy(G, sky, dmg, { tower: true, kind: 'glow', type: 'magic', elem: 'metal', srcTower: t });
        sky.slowT = Math.max(sky.slowT || 0, 0.6);
        pushFx(G, { kind: 'bolt', x: t.x, y: t.y, x2: sky.x, y2: sky.y, life: 0.18, name: '' });
        continue;
      }
      if (t.cd > dt) continue;
      sky = nearestSky(G, t.x, t.y, airR);
      if (!sky) continue;
      G.td.fly.shots = (G.td.fly.shots || 0) + 1;
      t.cd = s.cd + dt;
      t.ang = Math.atan2(sky.y - t.y, sky.x - t.x);
      t.atkT = 0.3;
      if (t.type === 'frost') {
        sky.slowT = Math.max(sky.slowT || 0, 0.9 * R.rankOf(R.rank.slowTime, t._rank || 1));
        sky.slowF = Math.max(sky.slowF || 0, (XY.TOWERS.frost.slow || 0.45) * (sky.def && sky.def.boss ? 0.5 : 1));
        XY.core.hurtEnemy(G, sky, s.dmg, { tower: true, kind: 'frost', dot: true, type: 'magic', elem: 'water', srcTower: t });
      } else if (t.type === 'siege') {
        XY.core.hurtEnemy(G, sky, s.dmg, { tower: true, kind: 'bolt', type: 'phys', srcTower: t });
      } else {
        XY.core.hurtEnemy(G, sky, s.dmg * 1.85, { tower: true, kind: 'arrow', type: 'phys', srcTower: t });
      }
      pushFx(G, { kind: 'bolt', x: t.x, y: t.y - 10, x2: sky.x, y2: sky.y, life: 0.16, name: '' });
    }
  }
  function skyLeak(G) {
    var tang = G.heroes[0], i, e, hit;
    if (!tang) return;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (!e.tdSky || e.dead || e._leaked) continue;
      if (e._skyKill || e.dead) continue;
      hit = hypot(e.x - tang.x, e.y - tang.y) < tang.def.r + e.r + 6;
      if (!hit && e.type === 'owl' && G.eprojs) {
        hit = G.eprojs.some(function (q) {
          return q.feather && hypot(q.x - tang.x, q.y - tang.y) < 56 && hypot(q.x - e.x, q.y - e.y) < 420;
        });
      }
      if (hit) { e._leaked = 1; G.td.fly.leak++; }
    }
  }
  function pushFx(G, fx) { fx.t = fx.life; G.td.fx.push(fx); if (G.td.fx.length > 24) G.td.fx.shift(); }
  function fadeFx(G, dt) {
    var i, fx, keep = [];
    for (i = 0; i < G.td.fx.length; i++) {
      fx = G.td.fx[i]; fx.t -= dt; if (fx.t > 0) keep.push(fx);
    }
    G.td.fx = keep;
  }

  /* ---------- 阵 ---------- */
  function breakForms(G, who, why) {
    ['tower', 'hero'].forEach(function (k) {
      var f = G.td.form[k];
      if (!f || !f.members) return;
      if (f.members.indexOf(who) >= 0) { f.state = 'broken'; f.why = why; clearMemberFlags(f); }
    });
  }
  function clearMemberFlags(f) {
    (f.members || []).forEach(function (m) { if (!m) return; m.holdForm = false; m._formDmg = 0; m._formDr = 0; m._inSlot = false; m._fengshi = false; });
  }
  function slotWorld(f, slot) {
    var a = f.facing || 0, c = Math.cos(a), s = Math.sin(a);
    return { x: f.cx + slot.x * c - slot.y * s, y: f.cy + slot.x * s + slot.y * c };
  }
  function formTick(G, dt) {
    var jf = G.td.form.hero;
    if (jf && jf.id === 'jinchan' && G.heroes[0] && jf.state !== 'broken' && jf.state !== 'ended' && jf.state !== 'draft') {
      var tang = G.heroes[0];
      jf.cx = tang.x; jf.cy = tang.y;
      var ahead = XY.routeAt(G.rt, Math.min(G.rt.total, (G.tang && G.tang.s || 0) + 30));
      jf.facing = Math.atan2(ahead.y - tang.y, ahead.x - tang.x);
    }
    pinForms(G);
    G.towers.forEach(function (t) { t._formDmg = 0; t._formDr = 0; t.holdForm = !!t.holdForm && G.td.form.tower && G.td.form.tower.state === 'active'; });
    G.heroes.forEach(function (h) { h._fengshi = false; });
    if (G.td.baguaTill > G.td.clock) { /* 散阵后的空窗 */ }
    ['tower', 'hero'].forEach(function (k) {
      var f = G.td.form[k];
      if (!f || f.state === 'broken' || f.state === 'ended' || f.state === 'draft') return;
      var def = R.formById(f.id);
      if (!def) return;
      if (f.id === 'jinchan' || f.id === 'sixiang' || f.id === 'fengshi') {
        if (!(G.camp && G.camp.active) && f.id !== 'jinchan') { f.state = 'planned'; return; }
        if (f.id === 'jinchan' && f.members.some(function (h) { return h && !h.down && h.order !== 'guard'; })) {
          if (f.state === 'active') { f.state = 'broken'; f.why = 'order'; clearMemberFlags(f); }
          return;
        }
      }
      var ready = membersReady(G, f, def);
      if (!ready.ok) {
        if (ready.hard) { f.state = 'broken'; f.why = ready.hard; clearMemberFlags(f); return; }
        if (f.state === 'active') {
          f.grace = (f.grace == null ? 3 : f.grace) - dt;
          if (f.grace <= 0) { f.state = 'broken'; f.why = 'leave'; clearMemberFlags(f); return; }
        } else { f.held = 0; f.state = 'assembling'; }
        return;
      }
      f.grace = 3;
      f.held = (f.held || 0) + dt;
      if (f.state !== 'active') {
        f.state = 'assembling';
        if (f.held >= 0.5) { f.state = 'active'; f.ever = true; }
      }
      if (f.state === 'active') f.ever = true;
      if (f.state === 'active') {
        applyForm(G, f, def);
        chargeCombo(G, f, dt);
      }
    });
    splashBoost(G);
  }
  function chargeCombo(G, f, dt) {
    if (G.td.deploy) return;
    var spec = R.COMBOS[f.id];
    if (!spec) return;
    f.charge = R.charge(f.charge, dt, spec.sec);
    if (f.charge >= 1) castCombo(G, f);
  }
  function castCombo(G, f) {
    var spec = R.COMBOS[f.id];
    if (!spec) return;
    f.charge = 0;
    f.castT = 1.15;
    var row = G.td.combos[f.id] || (G.td.combos[f.id] = { casts: 0, dmg: 0 });
    row.casts++;
    var mul = mulOf(G), dmg, i, e, tang = G.heroes[0];
    pushFx(G, { kind: 'name', x: f.cx, y: f.cy, life: 1.15, name: spec.name, a: f.facing || 0 });
    if (f.id === 'sancai') {
      G.td.tangSafe = G.td.clock + 2.4;
      dmg = 28 * mul;
      for (i = 0; i < G.enemies.length; i++) {
        e = G.enemies[i];
        if (e.dead || !tang || hypot(e.x - tang.x, e.y - tang.y) > 280) continue;
        if (e.def && (e.def.boss || e.def.etower || e.def.elite)) continue;
        XY.core.hurtEnemy(G, e, dmg, { combo: f.id, type: 'magic', elem: 'metal' });
      }
      pushFx(G, { kind: 'ring', x: tang ? tang.x : f.cx, y: tang ? tang.y : f.cy, life: 0.7, r: 280, name: '' });
    } else if (f.id === 'yanyue') {
      dmg = 36 * mul;
      for (i = 0; i < G.enemies.length; i++) {
        e = G.enemies[i];
        if (e.dead || hypot(e.x - f.cx, e.y - f.cy) > 340) continue;
        e.slowT = Math.max(e.slowT || 0, 2.8);
        e.slowF = Math.max(e.slowF || 0, e.def && e.def.boss ? 0.35 : 0.72);
        e.stunT = Math.max(e.stunT || 0, 0.45);
        XY.core.hurtEnemy(G, e, dmg * (e.tdSky ? 1.15 : 1), { combo: f.id, type: 'magic', elem: 'water' });
      }
      pushFx(G, { kind: 'sweep', x: f.cx, y: f.cy, life: 0.7, a: f.facing || 0, r: 340, name: '' });
    } else if (f.id === 'bagua') {
      dmg = 22 * mul;
      for (i = 0; i < G.enemies.length; i++) {
        e = G.enemies[i];
        if (e.dead || hypot(e.x - f.cx, e.y - f.cy) > 360) continue;
        e.stunT = Math.max(e.stunT || 0, 1.6);
        XY.core.hurtEnemy(G, e, dmg, { combo: f.id, type: 'magic', elem: 'earth' });
      }
      pushFx(G, { kind: 'ring', x: f.cx, y: f.cy, life: 0.8, r: 360, name: '' });
    } else if (f.id === 'jinchan') {
      var van = f.members && f.members[0];
      if (van && tang) {
        for (i = 0; i < G.enemies.length; i++) {
          e = G.enemies[i];
          if (e.dead || (e.def && (e.def.boss || e.def.etower))) continue;
          if (hypot(e.x - tang.x, e.y - tang.y) > 420) continue;
          var dx = van.x - e.x, dy = van.y - e.y, len = hypot(dx, dy) || 1;
          e.x += dx / len * Math.min(140, len * 0.55);
          e.y += dy / len * Math.min(140, len * 0.55);
          e.th = van; e.retarget = 3;
          if (e.tdSky) XY.core.hurtEnemy(G, e, 12 * mul, { combo: f.id, type: 'magic' });
        }
      }
      pushFx(G, { kind: 'pull', x: van ? van.x : f.cx, y: van ? van.y : f.cy, life: 0.7, name: '' });
    } else if (f.id === 'sixiang') {
      G.td.campShield = (G.td.campShield || 0) + 900;
      if (G.camp) G.camp.hp = Math.min(G.camp.maxHp, G.camp.hp + G.camp.maxHp * 0.08);
      dmg = 16 * mul;
      for (i = 0; i < G.enemies.length; i++) {
        e = G.enemies[i];
        if (e.dead || !G.camp || hypot(e.x - G.camp.x, e.y - G.camp.y) > 260) continue;
        e.slowT = Math.max(e.slowT || 0, 2.2);
        e.slowF = Math.max(e.slowF || 0, 0.55);
        XY.core.hurtEnemy(G, e, dmg, { combo: f.id, type: 'magic', elem: 'earth' });
      }
      pushFx(G, { kind: 'ring', x: G.camp ? G.camp.x : f.cx, y: G.camp ? G.camp.y : f.cy, life: 0.8, r: 260, name: '' });
    } else if (f.id === 'fengshi') {
      dmg = 48 * mul;
      var a = f.facing || 0, ux = Math.cos(a), uy = Math.sin(a);
      for (i = 0; i < G.enemies.length; i++) {
        e = G.enemies[i];
        if (e.dead) continue;
        var rx = e.x - f.cx, ry = e.y - f.cy, along = rx * ux + ry * uy, side = rx * -uy + ry * ux;
        if (along < 0 || along > 560 || Math.abs(side) > 72) continue;
        XY.core.hurtEnemy(G, e, dmg * ((e.def && (e.def.boss || e.def.etower)) ? 1 : 0.85), { combo: f.id, comboHero: true, type: 'phys' });
      }
      pushFx(G, { kind: 'line', x: f.cx, y: f.cy, life: 0.55, a: a, r: 560, name: '' });
    }
  }
  function membersReady(G, f, def) {
    var i, m, slots = f.slots || def.slots || [], hard = null;
    if (!f.members || f.members.length < (def.min || (def.slots ? def.slots.length : 1))) return { ok: false };
    for (i = 0; i < f.members.length; i++) {
      m = f.members[i];
      if (!m || m.recalled || m.down || (m.hp != null && m.hp <= 0 && m.type)) return { ok: false, hard: 'dead' };
      if (m.order && def.order && m.order !== def.order) return { ok: false, hard: 'order' };
      if (m.i != null && m.i === G.ctrl && G.input && (G.input.mx || G.input.my)) return { ok: false, hard: 'control' };
      if (m.ridden || m.mounted) return { ok: false, hard: 'ride' };
    }
    if (f.id === 'bagua') return { ok: baguaReady(G, f) };
    var ok = true;
    for (i = 0; i < f.members.length && i < slots.length; i++) {
      var w = slotWorld(f, slots[i]);
      var d = hypot(f.members[i].x - w.x, f.members[i].y - w.y);
      f.members[i]._inSlot = d <= 52;
      if (d > 52) ok = false;
    }
    return { ok: ok, hard: hard };
  }
  function baguaReady(G, f) {
    var gates = baguaSlots(G), filled = 0, i, j;
    for (i = 0; i < gates.length; i++) {
      if (gates[i].empty) continue;
      for (j = 0; j < f.members.length; j++) {
        if (hypot(f.members[j].x - gates[i].x, f.members[j].y - gates[i].y) <= 56) { filled++; break; }
      }
    }
    return filled >= 5;
  }
  function baguaSlots(G) {
    var c = G.camp, out = [], i;
    for (i = 0; i < 8; i++) {
      var a = i / 8 * PI2;
      out.push({ x: c.x + Math.cos(a) * 190, y: c.y + Math.sin(a) * 190, empty: i === 1 || i === 5 });
    }
    return out;
  }
  function applyForm(G, f, def) {
    if (f.id === 'sancai') {
      f.members.forEach(function (m) { if (m && m.type === 'arrow') m._formDmg = 0; });
      var heal = null, arrows = [];
      f.members.forEach(function (m) { if (!m) return; if (m.type === 'heal') heal = m; if (m.type === 'arrow') arrows.push(m); });
      if (heal) arrows.forEach(function (a) {
        if (hypot(a.x - heal.x, a.y - heal.y) < 220) a.hp = Math.min(XY.towerMaxHp(a), a.hp + a.maxHp * 0.05 * 0.15 * 0.5);
      });
    }
    if (f.id === 'bagua' && !(G.td.baguaTill > G.td.clock)) {
      f.members.forEach(function (m) { if (!m) return; m.holdForm = true; m._formDmg = 0.15; m._formDr = 0.2; });
    }
    if (f.id === 'jinchan') {
      f.members.forEach(function (h) { if (!h || h.down) return; h._inSlot = true; if (h.mod) h.mod.tauntMul = 0.8; });
    }
    if (f.id === 'fengshi') {
      var elite = focusElite(G, f);
      f.members.forEach(function (h) { if (h) h._fengshi = true; });
      G.enemies.forEach(function (e) { e._fengshi = elite && e === elite; });
    }
  }
  function focusElite(G, f) {
    var best = null, bd = 300, a0 = f.facing || 0;
    G.enemies.forEach(function (e) {
      if (e.dead || !(e.def && e.def.elite) || (e.def.boss || e.def.etower)) return;
      var dx = e.x - f.cx, dy = e.y - f.cy, dist = hypot(dx, dy);
      if (dist > 300) return;
      var ang = Math.atan2(dy, dx), dlt = Math.atan2(Math.sin(ang - a0), Math.cos(ang - a0));
      if (Math.abs(dlt) > Math.PI / 3) return;
      if (dist < bd) { bd = dist; best = e; }
    });
    return best;
  }
  function splashBoost(G) {
    var f = G.td.form.tower;
    var base = TD._splash0 || (TD._splash0 = XY.TOWERS.cannon.splash);
    XY.TOWERS.cannon.splash = base;
    if (!f || f.id !== 'yanyue' || f.state !== 'active') return;
    var frost = null;
    (f.members || []).forEach(function (m) { if (m && m.type === 'frost') frost = m; });
    if (!frost) return;
    var slowed = G.enemies.some(function (e) { return !e.dead && e.slowT > 0 && hypot(e.x - frost.x, e.y - frost.y) < (XY.towerStat(G, frost).range || 180); });
    if (slowed) XY.TOWERS.cannon.splash = base * 1.15;
  }
  function pinForms(G) {
    var f = G.td.form.tower;
    if (f && (f.state === 'active' || f.state === 'assembling')) {
      if (f.id === 'bagua' && G.camp) {
        var gates = baguaSlots(G).filter(function (s) { return !s.empty; });
        f.members.forEach(function (m, i) {
          var s = gates[i % gates.length];
          if (!s || !m) return;
          m.x = s.x; m.y = s.y; m.mode = 'garrison'; m.rs = 1e9; m.holdForm = true; m.anchor = { x: s.x, y: s.y };
        });
      } else {
        var def = R.formById(f.id);
        if (def && def.slots) f.members.forEach(function (m, i) {
          if (!m || !def.slots[i]) return;
          var w = slotWorld(f, def.slots[i]);
          m.x = w.x; m.y = w.y; m.mode = 'garrison'; m.rs = 1e9; m.holdForm = true; m.anchor = { x: w.x, y: w.y };
        });
      }
    }
    var hf = G.td.form.hero;
    if (hf && (hf.state === 'active' || hf.state === 'assembling')) {
      var hd = R.formById(hf.id);
      if (hd && hd.slots) hf.members.forEach(function (h, i) {
        if (!h || h.down || h.i === G.ctrl || !hd.slots[i]) return;
        var w = slotWorld(hf, hd.slots[i]);
        h.x = w.x; h.y = w.y;
        if (hd.order) h.order = hd.order;
        h._inSlot = true;
      });
    }
  }

  TD.confirmForm = function (G, kind) {
    var f = G.td.form[kind];
    if (!f) return false;
    var def = R.formById(f.id);
    if (f.id === 'sancai' && countType(f, 'heal') < 1) { f.missing = '缺佛光'; if (XY.toast) XY.toast(G, '三才护法阵缺佛光'); return false; }
    if (def && def.need) {
      for (var k in def.need) if (countType(f, k) < def.need[k]) { f.missing = '缺' + XY.TOWERS[k].name; if (XY.toast) XY.toast(G, f.name + '还缺人'); return false; }
    }
    if (def && def.min && (!f.members || f.members.length < def.min)) { if (XY.toast) XY.toast(G, '人数不够'); return false; }
    if (kind === 'hero') {
      var pool = G.heroes.filter(function (h) { return h.id !== 'tang' && !h.down; });
      var free = pool.filter(function (h) { return f.members.indexOf(h) < 0; }).length;
      if (pool.length > f.members.length && free < 1) { if (XY.toast) XY.toast(G, '至少留一名徒弟可以指挥'); return false; }
      if (def && def.order) f.members.forEach(function (h) { if (h) h.order = def.order; });
    }
    f.state = (def && def.order === 'guard') || (G.camp && G.camp.active) || kind === 'tower' ? 'assembling' : 'planned';
    f.held = 0;
    f.charge = f.charge || 0;
    pinForms(G);
    var g = guideStep(G);
    if (g && (g.id === 'confirm' || g.id === 'sancai' || g.id === 'jinchan')) advanceGuide(G);
    return true;
  };
  function countType(f, type) { return (f.members || []).filter(function (m) { return m && m.type === type; }).length; }

  /* ---------- 引导 ---------- */
  function guideStep(G) {
    if (!G.td || !G.td.guide) return null;
    var list = G.td.guide.kind === 'td3' ? R.GUIDE3 : R.GUIDE2;
    return list[G.td.guide.i] || null;
  }
  function advanceGuide(G) {
    var g = G.td.guide; if (!g) return;
    var list = g.kind === 'td3' ? R.GUIDE3 : R.GUIDE2;
    if (list[g.i] && list[g.i].id === 'hire' && !canHire(G)) { /* 钱不够或没有别的兵：这一步跳过 */ }
    g.i++;
    if (g.i >= list.length) { markTut(g.kind); G.td.guide = null; }
    else if (list[g.i] && list[g.i].id === 'hire' && !canHire(G)) advanceGuide(G);
  }
  function canHire(G) {
    var ids = ['arrow', 'cannon', 'frost', 'siege', 'heal'], i;
    for (i = 0; i < ids.length; i++) {
      if (XY.save.solOwned(ids[i]) && G.coins >= TD.price(G, ids[i], 'place') && G.towers.every(function (t) { return t.type !== ids[i] || ids[i] === 'arrow'; })) {
        if (G.towers.filter(function (t) { return t.type === ids[i]; }).length === 0 || ids[i] !== 'arrow') return XY.save.solOwned(ids[i]) && G.coins >= TD.price(G, ids[i], 'place');
      }
    }
    for (i = 0; i < ids.length; i++) if (XY.save.solOwned(ids[i]) && G.coins >= TD.price(G, ids[i], 'place')) return true;
    return false;
  }

  function guideAllows(G, h) {
    var st = guideStep(G);
    if (!st) return true;
    if (h.act === 'tdGuideSkip' || h.act === 'esc' || h.act === 'spd2') return true;
    if (st.id === 'wait' || st.id === 'break') return h.act === 'tdGuideNext';
    if (st.id === 'pick') return h.act === 'tdSel' && h.freeArrow;
    if (st.id === 'move') return h.act === 'tdSpot';
    if (st.id === 'hire') return h.act === 'tower' || h.act === 'tdGuideNext';
    if (st.id === 'detail') return h.act === 'tdSel' || h.act === 'tdUpgrade' || h.act === 'tdRecall' || h.act === 'treat' || h.act === 'tdGuideNext';
    if (st.id === 'go') return h.act === 'tdStart';
    if (st.id === 'open') return h.act === 'tdTab' && h.id === 'form';
    if (st.id === 'sancai') return h.act === 'tdPick' && h.id === 'sancai';
    if (st.id === 'confirm') return h.act === 'tdBind' || h.act === 'tdCenter' || h.act === 'tdConfirm' || h.act === 'tdGuideNext';
    if (st.id === 'jinchan') return h.act === 'tdPick' && h.id === 'jinchan' || h.act === 'tdBind' || h.act === 'order' || h.act === 'tdConfirm';
    return false;
  }
  function onAct(h, G, a) {
    if (!h) return false;
    if (h.act === 'menuTutorial') { if (a) a.tdChooser = true; return true; }
    if (h.act === 'tdReplayGo') {
      if (a) a.tdChooser = false;
      if (h.id === 'l1') { XY.tutForce = true; window.__xy.startGame(1); }
      if (h.id === 'l2') { TD.force = 'td2'; window.__xy.startGame(2); }
      if (h.id === 'l3') { TD.force = 'td3'; window.__xy.startGame(3); }
      return true;
    }
    if (h.act === 'tdReplayClose') { if (a) a.tdChooser = false; return true; }
    if (!G || !G.td || !G.td.on) return false;
    if (G.td.guide && !guideAllows(G, h)) return true;
    if (h.act === 'tdGuideSkip') { markTut(G.td.guide.kind); G.td.guide = null; return true; }
    if (h.act === 'tdGuideNext') { advanceGuide(G); return true; }
    if (h.act === 'tdStart') {
      if (G.td.guide && guideStep(G) && guideStep(G).id === 'go') { markTut(G.td.guide.kind); G.td.guide = null; }
      if (G.td.guide) return true;
      TD.start(G); return true;
    }
    if (h.act === 'tdOffer') { G.td.deploy = true; G.td.hold.deploy = true; G.td.offer = false; return true; }
    if (h.act === 'tdTab') {
      if (h.id === 'form' && !R.formationOn(G)) return true;
      G.td.tab = h.id;
      if (guideStep(G) && guideStep(G).id === 'open' && h.id === 'form') advanceGuide(G);
      return true;
    }
    if (h.act === 'tdSel') {
      var t = null, i;
      for (i = 0; i < G.towers.length; i++) if (G.towers[i] === h.tower || (h.idx != null && i === h.idx)) t = G.towers[i];
      if (!t && h.idx != null) t = G.towers[h.idx];
      if (t) {
        a.selTower = t; G.td.focus = t;
        if (guideStep(G) && guideStep(G).id === 'pick' && t.type === 'arrow') advanceGuide(G);
      }
      return true;
    }
    if (h.act === 'tdSpot') {
      var spot = G.td.spots[h.i];
      if (a && a.selTower && spot) TD.moveTower(G, a.selTower, spot.x, spot.y);
      return true;
    }
    if (h.act === 'tdUpgrade') { TD.upgrade(G, a.selTower); return true; }
    if (h.act === 'tdRecall') { TD.recall(G, a.selTower); return true; }
    if (h.act === 'tdPick') {
      var def = R.formById(h.id); if (!def) return true;
      var kind = def.who === 'hero' ? 'hero' : 'tower';
      var center = def.camp && G.camp ? G.camp : G.heroes[0];
      var facing = XY.routeAt(G.rt, XY.routeProject(G.rt, center.x, center.y).s).a;
      G.td.form[kind] = { id: def.id, name: def.name, who: def.who, state: 'draft', members: [], cx: center.x, cy: center.y, facing: facing, missing: '' };
      G.td.tab = 'form';
      if (guideStep(G) && ((guideStep(G).id === 'sancai' && h.id === 'sancai') || (guideStep(G).id === 'jinchan' && h.id === 'jinchan'))) advanceGuide(G);
      return true;
    }
    if (h.act === 'tdBind') {
      var fk = h.who === 'hero' ? 'hero' : 'tower';
      var form = G.td.form[fk]; if (!form || form.state !== 'draft' && form.state !== 'broken') return true;
      form.state = 'draft';
      var unit = h.who === 'hero' ? G.heroes[h.i] : G.towers[h.i];
      if (!unit) return true;
      var at = form.members.indexOf(unit);
      if (at >= 0) form.members.splice(at, 1); else form.members.push(unit);
      return true;
    }
    if (h.act === 'tdCenter') {
      var ff = G.td.form[h.who === 'hero' ? 'hero' : 'tower'];
      if (ff && h.x != null) { ff.cx = h.x; ff.cy = h.y; ff.facing = h.a || ff.facing; }
      return true;
    }
    if (h.act === 'tdConfirm') { TD.confirmForm(G, h.who === 'hero' ? 'hero' : 'tower'); return true; }
    if (h.act === 'tdDisband') {
      var side = h.who === 'hero' ? 'hero' : 'tower';
      var cur = G.td.form[side];
      if (cur && cur.id === 'bagua') G.td.baguaTill = G.td.clock + 8;
      if (cur) { cur.state = 'ended'; clearMemberFlags(cur); }
      G.td.form[side] = null;
      return true;
    }
    return false;
  }
  if (XY.hubUI && !XY.hubUI._td) {
    var prevAct = XY.hubUI.act;
    XY.hubUI.act = function (h, p, a) {
      var G = window.__xy && window.__xy.G;
      if (G && G.td && G.td.guide && G.td.deploy && h && h.act !== 'esc' && !guideAllows(G, h)) return true;
      if (h && (h.act === 'menuTutorial' || String(h.act || '').indexOf('td') === 0)) {
        if (onAct(h, G, a)) return true;
      }
      return prevAct ? prevAct(h, p, a) : false;
    };
    XY.hubUI._td = true;
  }
  if (XY.auto && XY.auto.assist) {
    var assist0 = XY.auto.assist;
    XY.auto.assist = function (G, dt) {
      if (G && G.td && G.td.deploy) return;
      return assist0(G, dt);
    };
  }
  if (XY.R4 && XY.R4.soldier) {
    var drawS = XY.R4.soldier;
    XY.R4.soldier = function (c, G, t, rt) {
      if (!(G && G.td && G.td.on)) return drawS(c, G, t, rt);
      var lv = t.lv; t.lv = 1;
      c.save(); c.translate(t.x, t.y); c.scale(1.45, 1.45); c.translate(-t.x, -t.y);
      drawS(c, G, t, rt);
      c.restore(); t.lv = lv;
    };
  }

  /* ---------- 画面 ---------- */
  function font(px, bold) { return (bold ? '700 ' : '500 ') + px + 'px ' + (C.FONT || 'serif'); }
  function brushFont(px) { return px + 'px "TDBrush","Ma Shan Zheng",' + (C.FONT || 'serif'); }
  function dryArc(ctx, r, a0, a1) {
    var i, n = 7, span = a1 - a0;
    ctx.lineCap = 'round';
    for (i = 0; i < n; i++) {
      if (i % 2 === 1) continue;
      ctx.lineWidth = i % 4 === 0 ? 2.4 : 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.9 + (i % 3) * 0.05), a0 + span * i / n, a0 + span * (i + 0.42) / n);
      ctx.stroke();
    }
  }
  function inkSlip(ctx, x, y, w, h) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = 'rgba(42,32,22,0.18)';
    ctx.lineWidth = h * 0.55;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(6, h * 0.55);
    ctx.quadraticCurveTo(w * 0.45, h * 0.15, w - 8, h * 0.48);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(42,32,22,0.78)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(4, h - 3);
    ctx.quadraticCurveTo(w * 0.4, h - 7, w - 2, h - 2);
    ctx.stroke();
    ctx.restore();
  }
  function paper(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#f6f1e4';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(42,32,22,0.88)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.restore();
  }
  function seal(ctx, x, y, r, label) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.05);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, PI2); ctx.fillStyle = '#9a2e24'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#6e211b'; ctx.stroke();
    ctx.fillStyle = '#fff6ea'; ctx.font = font(r > 28 ? 18 : 13, true);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 1);
    ctx.restore();
  }
  function hit(x, y, w, h, act, extra) {
    var o = { x: x, y: y, w: w, h: h, act: act };
    if (extra) for (var k in extra) o[k] = extra[k];
    XY.ui.hits.push(o);
  }
  function w2s(G, x, y) { return { x: x - G.cam.x + G.view.w / 2, y: y - G.cam.y + G.view.h / 2 }; }

  function drawSpots(ctx, G) {
    ctx.save();
    ctx.translate(G.view.w / 2 - G.cam.x, G.view.h / 2 - G.cam.y);
    if (G.td.deploy) {
      ctx.strokeStyle = 'rgba(42,32,22,0.16)';
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      G.rt.pts.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
      ctx.stroke();
      G.td.spots.forEach(function (p) {
        ctx.save(); ctx.translate(p.x, p.y);
        ctx.strokeStyle = 'rgba(42,32,22,0.8)';
        ctx.lineWidth = 1.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-11, 8); ctx.quadraticCurveTo(0, 12, 12, 7); ctx.stroke();
        ctx.fillStyle = '#9a2e24'; ctx.font = brushFont(15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('位', 0, -2);
        ctx.restore();
        var s = w2s(G, p.x, p.y);
        hit(s.x - 22, s.y - 22, 44, 44, 'tdSpot', { i: p.i });
      });
    }
    var sel = app() && app().selTower;
    var st = guideStep(G);
    if ((sel && G.towers.indexOf(sel) >= 0) || (st && st.id === 'move' && sel)) {
      var t = sel, ss = XY.towerStat(G, t);
      ctx.save(); ctx.translate(t.x, t.y);
      ctx.strokeStyle = 'rgba(42,32,22,0.45)';
      dryArc(ctx, ss.range, 0.2, 6.05);
      ctx.restore();
    }
    previewSlots(ctx, G);
    ctx.restore();
  }
  function previewSlots(ctx, G) {
    ['tower', 'hero'].forEach(function (k) {
      var f = G.td.form[k]; if (!f || f.state === 'ended') return;
      var def = R.formById(f.id); if (!def) return;
      var showMarks = f.state === 'draft' || f.state === 'assembling' || f.state === 'planned';
      if (showMarks) {
        var slots = f.id === 'bagua' ? baguaSlots(G).filter(function (s) { return !s.empty; }).map(function (s) { return { x: s.x - f.cx, y: s.y - f.cy }; }) : (def.slots || []);
        ctx.strokeStyle = 'rgba(42,32,22,0.55)';
        slots.forEach(function (slot) {
          var w = f.id === 'bagua' ? { x: f.cx + slot.x, y: f.cy + slot.y } : slotWorld(f, slot);
          ctx.save(); ctx.translate(w.x, w.y); dryArc(ctx, 16, 0.3, 5.6); ctx.restore();
        });
      }
      if (f.id === 'bagua' && G.camp && (f.state === 'active' || showMarks)) {
        baguaSlots(G).forEach(function (g) {
          if (!g.empty) return;
          ctx.fillStyle = '#6e211b'; ctx.font = brushFont(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('生', g.x, g.y);
        });
      }
      if (f.members && f.members.length >= 2 && f.state === 'active' && !(f.castT > 0)) {
        ctx.beginPath();
        f.members.forEach(function (m, i) { if (!m) return; if (i) ctx.lineTo(m.x, m.y); else ctx.moveTo(m.x, m.y); });
        ctx.strokeStyle = 'rgba(36,28,20,0.55)'; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.fillStyle = '#2a241c'; ctx.font = brushFont(18); ctx.textAlign = 'center';
        ctx.fillText(def.name, f.cx, f.cy - 78);
        ctx.fillStyle = '#9a2e24'; ctx.beginPath(); ctx.arc(f.cx + ctx.measureText(def.name).width / 2 + 16, f.cy - 78, 10, 0, PI2); ctx.fill();
        ctx.fillStyle = '#fff6ea'; ctx.font = brushFont(12); ctx.textAlign = 'center';
        ctx.fillText('阵', f.cx + ctx.measureText(def.name).width / 2 + 16, f.cy - 78);
      }
    });
  }
  function drawFx(ctx, G) {
    var i, fx, k, p;
    for (i = 0; i < G.td.fx.length; i++) {
      fx = G.td.fx[i];
      k = Math.max(0, fx.t / fx.life);
      ctx.save();
      ctx.strokeStyle = 'rgba(36,28,20,' + (0.28 + 0.4 * k) + ')';
      ctx.fillStyle = 'rgba(36,28,20,' + (0.82 * k) + ')';
      ctx.lineWidth = 1.6;
      if (fx.kind === 'bolt') {
        ctx.beginPath(); ctx.moveTo(fx.x, fx.y); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
      } else if (fx.kind === 'ring') {
        ctx.translate(fx.x, fx.y); dryArc(ctx, (fx.r || 180) * (0.86 + 0.14 * (1 - k)), 0.15, 6.0);
      } else if (fx.kind === 'sweep') {
        ctx.translate(fx.x, fx.y); ctx.rotate(fx.a || 0);
        dryArc(ctx, (fx.r || 260) * 0.72, -1.05, 1.05);
      } else if (fx.kind === 'line') {
        ctx.translate(fx.x, fx.y); ctx.rotate(fx.a || 0);
        ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo((fx.r || 420) * k + 40, 0); ctx.stroke();
        ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(20, -10); ctx.lineTo((fx.r || 420) * 0.6, -7); ctx.stroke();
      } else if (fx.kind === 'pull') {
        ctx.translate(fx.x, fx.y); dryArc(ctx, 28 + (1 - k) * 26, 0.2, 5.4);
      } else if (fx.kind === 'name' && fx.name) {
        ctx.translate(fx.x, fx.y - 196); ctx.rotate(-0.06);
        ctx.font = brushFont(40);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(fx.name, 0, 0);
      }
      ctx.restore();
    }
  }
  function drawHud(ctx, G, a) {
    var W = G.view.w, H = G.view.h, narrow = phone() || W < 700;
    var bh = R.hitSize((a && a.zoom) || 1);
    if (G.td.deploy) {
      var sr = narrow ? 30 : 38;
      seal(ctx, W - sr - 18, 78 + sr, sr, '出发');
      hit(W - sr * 2 - 26, 78, sr * 2 + 16, sr * 2 + 16, 'tdStart');
      ctx.fillStyle = '#2a241c'; ctx.font = font(narrow ? 14 : 16, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      paper(ctx, W / 2 - 150, 46, 300, 30);
      ctx.fillText('布置天兵，准备好后点出发', W / 2, 61);
      var hw = narrow ? Math.min(W - 24, 460) : 460;
      paper(ctx, W / 2 - hw / 2, 82, hw, 28);
      ctx.font = font(narrow ? 13 : 15, false);
      ctx.fillText(R.FLY_HINT, W / 2, 96);
    }
    if (G.td.offer && !G.td.deploy) {
      paper(ctx, W / 2 - 70, 78, 140, bh);
      ctx.fillStyle = '#9a2e24'; ctx.font = font(16, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('布阵', W / 2, 78 + bh / 2);
      hit(W / 2 - 70, 78, 140, bh, 'tdOffer');
    }
    var tabY = H - (narrow ? 200 : 150);
    inkSlip(ctx, 6, tabY, R.formationOn(G) ? 128 : 64, 34);
    ctx.font = brushFont(18); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = (G.td.tab || 'tower') === 'tower' ? '#9a2e24' : '#2a241c';
    ctx.fillText('天兵', 14, tabY + 17);
    hit(6, tabY, 58, 34, 'tdTab', { id: 'tower' });
    if (R.formationOn(G)) {
      ctx.fillStyle = G.td.tab === 'form' ? '#9a2e24' : '#2a241c';
      ctx.fillText('阵型', 70, tabY + 17);
      hit(64, tabY, 64, 34, 'tdTab', { id: 'form' });
    }
    if (a && a.selTower && G.towers.indexOf(a.selTower) >= 0) drawTag(ctx, G, a, a.selTower, bh);
    if (G.td.tab === 'form' && R.formationOn(G)) drawFormPanel(ctx, G, narrow, bh);
    G.towers.forEach(function (t, i) {
      var s = w2s(G, t.x, t.y);
      if (s.x < -20 || s.y < -20 || s.x > W + 20 || s.y > H + 20) return;
      hit(s.x - 24, s.y - 28, 48, 56, 'tdSel', { idx: i, freeArrow: !!(t.free && t.type === 'arrow'), tower: t });
      if ((t._rank || t.lv || 1) >= 2) {
        ctx.fillStyle = '#2a241c';
        ctx.fillRect(s.x - 8, s.y - 34, 5, 3);
        if ((t._rank || 1) >= 3) ctx.fillRect(s.x + 0, s.y - 34, 5, 3);
      }
    });
  }
  function drawTag(ctx, G, a, t, bh) {
    var s = w2s(G, t.x, t.y), w = Math.max(220, bh * 3 + 24), x = clamp(s.x - w / 2, 8, G.view.w - w - 8);
    var y = s.y - bh - 78;
    if (y < 72) y = s.y + 36;
    paper(ctx, x, y, w, bh + 56);
    ctx.fillStyle = '#2a241c'; ctx.font = font(14, true); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText((XY.TOWERS[t.type].name) + ' Lv' + (t._rank || t.lv || 1), x + 10, y + 8);
    var back = R.refund(t.paid || 0, t.hp, XY.towerMaxHp(t), t.life, t.maxLife || 1, G.td.started);
    ctx.font = font(12, false); ctx.fillStyle = '#4a4034';
    ctx.fillText('遣返退 ' + back + (G.td.started ? '' : '（开战前全额）'), x + 10, y + 28);
    var labels = [['升级', 'tdUpgrade'], ['犒赏', 'treat'], ['遣返', 'tdRecall']];
    var bw = (w - 16) / 3;
    labels.forEach(function (lb, i) {
      var bx = x + 8 + i * bw;
      paper(ctx, bx, y + 48, bw - 6, bh);
      ctx.fillStyle = '#2a241c'; ctx.font = font(14, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lb[0], bx + (bw - 6) / 2, y + 48 + bh / 2);
      hit(bx, y + 48, bw - 6, bh, lb[1]);
    });
  }
  function drawFormPanel(ctx, G, narrow, bh) {
    var x = narrow ? 12 : G.view.w - 340, y = narrow ? 230 : 120, w = narrow ? Math.min(460, G.view.w - 24) : 320;
    var list = R.FORMATIONS, h = Math.min(G.view.h * 0.55, 36 + list.length * 36 + bh + 8);
    paper(ctx, x, y, w, h);
    ctx.fillStyle = '#2a241c'; ctx.font = font(14, true); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('选阵、绑人、确认', x + 10, y + 8);
    list.forEach(function (f, i) {
      var yy = y + 30 + i * 34;
      if (yy > y + h - bh - 8) return;
      var on = (G.td.form.tower && G.td.form.tower.id === f.id) || (G.td.form.hero && G.td.form.hero.id === f.id);
      ctx.fillStyle = on ? 'rgba(154,46,36,0.08)' : 'rgba(0,0,0,0)';
      ctx.fillRect(x + 6, yy, w - 12, 32);
      ctx.fillStyle = '#2a241c'; ctx.font = font(13, true);
      ctx.fillText(f.name, x + 10, yy + 4);
      ctx.font = font(11, false); ctx.fillStyle = '#5c5144';
      var line = f.short;
      while (line.length > 2 && ctx.measureText(line).width > w - 24) line = line.slice(0, -1);
      ctx.fillText(line, x + 10, yy + 18);
      hit(x + 6, yy, w - 12, 32, 'tdPick', { id: f.id });
    });
    var cur = G.td.form.tower || G.td.form.hero;
    if (cur && cur.state === 'draft') {
      ctx.fillStyle = '#6e211b'; ctx.font = font(12, false);
      ctx.fillText(cur.missing || '点场上的人加入，再确认', x + 10, y + h - bh - 4);
    }
    if (cur) {
      paper(ctx, x + 8, y + h - bh - 2, 88, bh);
      ctx.fillStyle = '#9a2e24'; ctx.font = font(14, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('确认', x + 52, y + h - bh / 2 - 2);
      hit(x + 8, y + h - bh - 2, 88, bh, 'tdConfirm', { who: cur.who });
      paper(ctx, x + 104, y + h - bh - 2, 88, bh);
      ctx.fillStyle = '#2a241c';
      ctx.fillText('散阵', x + 148, y + h - bh / 2 - 2);
      hit(x + 104, y + h - bh - 2, 88, bh, 'tdDisband', { who: cur.who });
    }
    bindHits(G, cur);
  }
  function bindHits(G, cur) {
    if (!cur || cur.state === 'ended') return;
    var who = cur.who === 'hero' ? 'hero' : 'tower';
    if (who === 'tower') G.towers.forEach(function (t, i) { var s = w2s(G, t.x, t.y); hit(s.x - 20, s.y - 20, 40, 40, 'tdBind', { who: 'tower', i: i }); });
    else G.heroes.forEach(function (h, i) { if (h.id === 'tang') return; var s = w2s(G, h.x, h.y); hit(s.x - 20, s.y - 20, 40, 40, 'tdBind', { who: 'hero', i: i }); });
  }
  function drawGuide(ctx, G) {
    var st = guideStep(G); if (!st) return;
    var W = G.view.w, H = G.view.h, target = { x: W / 2 - 20, y: H / 2 - 20, w: 40, h: 40 };
    if (st.id === 'move' && G.td.spots[0]) { var s = w2s(G, G.td.spots[0].x, G.td.spots[0].y); target = { x: s.x - 24, y: s.y - 24, w: 48, h: 48 }; }
    if (st.id === 'go' || st.id === 'wait') target = { x: W - 120, y: 70, w: 100, h: 100 };
    if (st.id === 'open') target = { x: 68, y: H - (phone() ? 200 : 150), w: 64, h: 36 };
    ctx.save();
    ctx.fillStyle = 'rgba(246,240,226,0.5)';
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(target.x - 6, target.y - 6, target.w + 12, target.h + 12); ctx.fill('evenodd');
    ctx.strokeStyle = '#6e211b'; ctx.lineWidth = 2; ctx.strokeRect(target.x - 6, target.y - 6, target.w + 12, target.h + 12);
    ctx.restore();
    var cw = phone() ? Math.min(420, W * 0.52) : Math.min(460, W - 24), ch = phone() ? 160 : 132;
    var x = phone() ? 16 : Math.min(W - cw - 12, Math.max(12, target.x - cw - 16));
    var y = phone() ? 460 : Math.max(80, target.y - ch - 16);
    if (!phone() && (y + ch > target.y - 8 && y < target.y + target.h + 8)) y = Math.min(H - ch - 12, target.y + target.h + 16);
    paper(ctx, x, y, cw, ch);
    var list = G.td.guide.kind === 'td3' ? R.GUIDE3 : R.GUIDE2;
    ctx.fillStyle = '#9a2e24'; ctx.font = font(12, true); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText((G.td.guide.kind === 'td3' ? '阵型' : '布阵') + ' ' + (G.td.guide.i + 1) + '/' + list.length, x + 12, y + 8);
    ctx.fillStyle = '#2a241c'; ctx.font = font(phone() ? 15 : 16, false);
    var words = st.text, line = '', lines = [], i;
    for (i = 0; i < words.length; i++) {
      if (ctx.measureText(line + words.charAt(i)).width > cw - 24) { lines.push(line); line = words.charAt(i); }
      else line += words.charAt(i);
    }
    lines.push(line);
    lines.slice(0, 4).forEach(function (ln, n) { ctx.fillText(ln, x + 12, y + 30 + n * 22); });
    var by = y + ch - 40;
    paper(ctx, x + 12, by, 72, 30);
    ctx.fillStyle = '#2a241c'; ctx.font = font(13, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('跳过', x + 48, by + 15);
    hit(x + 12, by, 72, 30, 'tdGuideSkip');
    if (st.id === 'wait' || st.id === 'break' || st.id === 'detail' || st.id === 'hire') {
      seal(ctx, x + cw - 46, by + 14, 16, '下一步');
      hit(x + cw - 78, by - 4, 70, 36, 'tdGuideNext');
    }
  }
  function drawChooser(ctx, a) {
    var W = a.lw, H = a.lh, w = Math.min(420, W - 24), h = 250, x = (W - w) / 2, y = Math.max(16, (H - h) / 2);
    ctx.save();
    var z = (a.zoom || 1) * (a.dpr || 1);
    ctx.setTransform(z, 0, 0, z, 0, 0);
    ctx.fillStyle = 'rgba(246,240,226,0.72)'; ctx.fillRect(0, 0, W, H);
    paper(ctx, x, y, w, h);
    ctx.fillStyle = '#2a241c'; ctx.font = font(18, true); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('新手教程', x + 16, y + 12);
    [['l1', '第一关 · 走路和操作'], ['l2', '第二关 · 布置天兵'], ['l3', '第三关 · 阵型']].forEach(function (b, i) {
      var yy = y + 52 + i * 52;
      paper(ctx, x + 16, yy, w - 32, 44);
      ctx.font = font(16, true); ctx.textBaseline = 'middle'; ctx.fillText(b[1], x + 28, yy + 22);
      hit(x + 16, yy, w - 32, 44, 'tdReplayGo', { id: b[0] });
    });
    ctx.restore();
  }

  var origRender = XY.render;
  XY.render = function (ctx, G, a) {
    origRender(ctx, G, a);
    if (!a) return;
    if (a.tdChooser) { try { drawChooser(ctx, a); } catch (e) {} }
    if (!G || !G.td || !G.td.on || a.screen !== 'play') return;
    try {
      var z = (a.zoom || 1) * (a.dpr || 1);
      ctx.setTransform(z, 0, 0, z, 0, 0);
      if (G.td.deploy && G.td.needCam !== false) {
        var p = XY.routeAt(G.rt, Math.min(G.rt.total * 0.2, G.tang.s + 280));
        G.cam.x = p.x; G.cam.y = p.y; G.td.needCam = false;
      }
      if (G.td.deploy) {
        var now = a.rt || 0;
        var pdt = G.td._prt == null ? 0 : Math.min(0.05, Math.max(0, now - G.td._prt));
        G.td._prt = now;
        if (pdt > 0) formTick(G, pdt);
      }
      drawSpots(ctx, G);
      ctx.save();
      ctx.translate(G.view.w / 2 - G.cam.x, G.view.h / 2 - G.cam.y);
      drawFx(ctx, G);
      ctx.restore();
      drawHud(ctx, G, a);
      if (G.td.guide && G.td.deploy) drawGuide(ctx, G);
    } catch (err) { if (window.console) console.warn('tdline', err); }
  };

  TD.share = function (G) {
    var d = G.td.dmg, s = d.hero + d.tower;
    var r = G.td.dmgRest, rs = r.hero + r.tower;
    return {
      hero: s ? d.hero / s : 0, tower: s ? d.tower / s : 0,
      restTower: rs ? r.tower / rs : 0,
      heroN: d.hero, towerN: d.tower
    };
  };
})();
