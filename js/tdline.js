/* 第二关、第三关的天兵层。不改英雄伤害，不改原有怪的血量。
 * 第二关起多一队直扑唐僧的飞妖，只有天兵和阵法连携打得着。
 * 布阵时整段模拟停住；开战之后仍是原来的西行。
 */
(function () {
  'use strict';
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
      if (bonus) e.hp -= bonus;
      var dealt = dmg + bonus;
      G.td.dmg.tower += dealt;
      if (G.tang && G.tang.phase === 'rest') G.td.dmgRest.tower += dealt;
      var tk = e.type || 'other';
      G.td.byType[tk] = (G.td.byType[tk] || 0) + dealt;
      if (e.tdSky && e.hp - dmg <= 0 && !e._skyKill) { e._skyKill = 1; G.td.fly.towerKills++; }
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
    skyVolley(G, dt);
    try { origStep(G, dt); } finally {
      G.tang.speed = sp;
      restoreRanks(G);
      if (jin) {
        C.TANG_TARGET_W = tw0;
        G.td.form.hero.members.forEach(function (h, i) { if (h) h.speed = speeds[i]; });
      }
      XY.TOWERS.cannon.splash = TD._splash0 || XY.TOWERS.cannon.splash;
    }
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
      dist = 560 + Math.random() * 160;
      e = XY.makeEnemy(G, i < pack.bat ? 'bat' : 'owl', tang.x + Math.cos(ang) * dist, tang.y + Math.sin(ang) * dist, null);
      if (!e) continue;
      e.fly = true; e.tdSky = true; e.air = true; e.flow = true; e.road = true;
      e.fs = 'cruise'; e.fsT = 0; e.diveCd = 0.35; e.lock = null; e.coinM = R.FILL_COIN; e.xpM = C.FLOW_XP || 0.2;
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
  function skyVolley(G, dt) {
    var i, t, s, sky, dmg;
    for (i = 0; i < G.towers.length; i++) {
      t = G.towers[i];
      if (!R.hitsFlyer(t.type)) continue;
      s = XY.towerStat(G, t);
      if (t.type === 'heal') {
        t._skyCd = (t._skyCd || 0) - dt;
        if (t._skyCd > 0) continue;
        sky = nearestSky(G, t.x, t.y, s.range);
        if (!sky) continue;
        t._skyCd = s.cd;
        dmg = 9 * (R.rankOf(R.rank.dmg, t._rank || t.lv || 1)) * mulOf(G);
        XY.core.hurtEnemy(G, sky, dmg, { tower: true, kind: 'glow', type: 'magic', elem: 'metal', srcTower: t });
        sky.slowT = Math.max(sky.slowT || 0, 0.6);
        pushFx(G, { kind: 'bolt', x: t.x, y: t.y, x2: sky.x, y2: sky.y, life: 0.18, name: '' });
        continue;
      }
      if (t.cd > dt) continue;
      sky = nearestSky(G, t.x, t.y, s.range);
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
        XY.core.hurtEnemy(G, sky, s.dmg, { tower: true, kind: 'arrow', type: 'phys', srcTower: t });
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
      hit = hypot(e.x - tang.x, e.y - tang.y) < 56;
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
    ctx.strokeStyle = 'rgba(42,32,22,0.13)';
    ctx.lineWidth = C.ROAD_HALF * 2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    G.rt.pts.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
    ctx.stroke();
    G.td.spots.forEach(function (p) {
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.strokeStyle = 'rgba(42,32,22,0.78)'; ctx.lineWidth = 1.6; ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.arc(0, 0, 16, 0.2, 5.4); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#9a2e24'; ctx.font = font(11, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('位', 0, 1);
      ctx.restore();
      var s = w2s(G, p.x, p.y);
      hit(s.x - 22, s.y - 22, 44, 44, 'tdSpot', { i: p.i });
    });
    var sel = app() && app().selTower;
    var st = guideStep(G);
    if ((sel && G.towers.indexOf(sel) >= 0) || (st && st.id === 'move' && sel)) {
      var t = sel, ss = XY.towerStat(G, t);
      ctx.beginPath(); ctx.arc(t.x, t.y, ss.range, 0, PI2);
      ctx.fillStyle = 'rgba(50,40,28,0.04)'; ctx.fill();
      ctx.setLineDash([5, 6]); ctx.strokeStyle = 'rgba(42,32,22,0.75)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
    }
    previewSlots(ctx, G);
    ctx.restore();
  }
  function previewSlots(ctx, G) {
    ['tower', 'hero'].forEach(function (k) {
      var f = G.td.form[k]; if (!f || f.state === 'ended') return;
      var def = R.formById(f.id); if (!def) return;
      var slots = f.id === 'bagua' ? baguaSlots(G).filter(function (s) { return !s.empty; }).map(function (s) { return { x: s.x - f.cx, y: s.y - f.cy }; }) : (def.slots || []);
      ctx.strokeStyle = 'rgba(42,32,22,0.55)'; ctx.lineWidth = 1.4; ctx.setLineDash([2, 4]);
      slots.forEach(function (slot) {
        var w = f.id === 'bagua' ? { x: f.cx + slot.x, y: f.cy + slot.y } : slotWorld(f, slot);
        ctx.beginPath(); ctx.arc(w.x, w.y, 18, 0, PI2); ctx.stroke();
      });
      ctx.setLineDash([]);
      if (f.members && f.members.length >= 2 && f.state === 'active') {
        ctx.beginPath();
        f.members.forEach(function (m, i) { if (!m) return; if (i) ctx.lineTo(m.x, m.y); else ctx.moveTo(m.x, m.y); });
        ctx.strokeStyle = 'rgba(36,28,20,0.7)'; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.fillStyle = '#2a241c'; ctx.font = font(15, true); ctx.textAlign = 'left';
        ctx.fillText(def.name, f.cx + 16, f.cy - 20);
        ctx.fillStyle = '#9a2e24'; ctx.beginPath(); ctx.arc(f.cx + ctx.measureText(def.name).width + 28, f.cy - 24, 11, 0, PI2); ctx.fill();
        ctx.fillStyle = '#fff6ea'; ctx.font = font(11, true); ctx.textAlign = 'center';
        ctx.fillText('阵', f.cx + ctx.measureText(def.name).width + 28, f.cy - 24);
        var sealX = f.cx + ctx.measureText(def.name).width + 28, sealY = f.cy - 24;
        ctx.beginPath(); ctx.arc(sealX, sealY, 14, -Math.PI / 2, -Math.PI / 2 + PI2 * Math.max(0, Math.min(1, f.charge || 0)));
        ctx.strokeStyle = 'rgba(42,32,22,0.85)'; ctx.lineWidth = 2; ctx.stroke();
      }
    });
  }
  function drawFx(ctx, G) {
    var i, fx, k, p;
    for (i = 0; i < G.td.fx.length; i++) {
      fx = G.td.fx[i];
      k = Math.max(0, fx.t / fx.life);
      ctx.save();
      ctx.strokeStyle = 'rgba(28,22,16,' + (0.35 + 0.55 * k) + ')';
      ctx.fillStyle = 'rgba(28,22,16,' + (0.75 * k) + ')';
      ctx.lineWidth = 2.2;
      if (fx.kind === 'bolt') {
        ctx.beginPath(); ctx.moveTo(fx.x, fx.y); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
      } else if (fx.kind === 'ring') {
        ctx.beginPath(); ctx.arc(fx.x, fx.y, (fx.r || 200) * (1.05 - k), 0.2, 5.6); ctx.stroke();
      } else if (fx.kind === 'sweep') {
        ctx.translate(fx.x, fx.y); ctx.rotate(fx.a || 0);
        ctx.beginPath(); ctx.arc(0, 0, fx.r || 300, -1.1, 1.1); ctx.stroke();
      } else if (fx.kind === 'line') {
        ctx.translate(fx.x, fx.y); ctx.rotate(fx.a || 0);
        ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(fx.r || 500, -18); ctx.moveTo(0, 18); ctx.lineTo(fx.r || 500, 18); ctx.stroke();
      } else if (fx.kind === 'pull') {
        ctx.beginPath(); ctx.arc(fx.x, fx.y, 36 + (1 - k) * 40, 0, PI2); ctx.stroke();
      } else if (fx.kind === 'name' && fx.name) {
        ctx.translate(fx.x, fx.y - 46); ctx.rotate(-0.08);
        ctx.font = font(28 + 6 * k, true);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(fx.name, 0, 0);
        ctx.globalAlpha = 0.35 * k;
        ctx.fillText(fx.name, 1.5, 1.2);
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
    paper(ctx, 8, H - (narrow ? 200 : 150), R.formationOn(G) ? 132 : 72, 36);
    ctx.font = font(14, true); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = (G.td.tab || 'tower') === 'tower' ? '#9a2e24' : '#2a241c';
    ctx.fillText('天兵', 16, H - (narrow ? 200 : 150) + 18);
    hit(8, H - (narrow ? 200 : 150), 60, 36, 'tdTab', { id: 'tower' });
    if (R.formationOn(G)) {
      ctx.fillStyle = G.td.tab === 'form' ? '#9a2e24' : '#2a241c';
      ctx.fillText('阵型', 72, H - (narrow ? 200 : 150) + 18);
      hit(68, H - (narrow ? 200 : 150), 64, 36, 'tdTab', { id: 'form' });
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
