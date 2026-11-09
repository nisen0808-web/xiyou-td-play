/* Devil Kitty 浏览器接法：登场、狂暴、变身 mp4、活动弹窗、专属装备。
 * 素材目录 assets/devil-kitty/（art.json 指明可替换的立绘与变身视频）。
 */
(function () {
  'use strict';
  var API = window.XY_DEVIL_KITTY;
  var XY = window.XY;
  if (!API || !XY || !XY.step || !XY.save) return;

  var BASE = 'assets/devil-kitty/';
  var art = { stage1: 'stage1.webp', form: 'form.webp', stage1Cut: 'stage1-cut.webp', formCut: 'form-cut.webp', formVideo: 'form.mp4', formDurationMs: 9000, frameCount: 31, formName: '九尾咆哮' };
  var imgs = {};
  var vid = null;
  var frameImgs = [];
  var armed = { meta: false, frames: false };
  var session = loadSession();
  var fpsN = 0, fpsT = 0, fpsV = 0;
  var boxes = {};
  var inkCache = {};
  var BRUSH_FACE = 'DKBrush, serif';

  function loadSession() {
    try {
      var s = JSON.parse(window.sessionStorage.getItem('xy_dk_auto') || '{}');
      return { auto: { start: !!s.start, levels: !!s.levels } };
    } catch (e) { return API.freshSession(); }
  }
  function saveSession() {
    try { window.sessionStorage.setItem('xy_dk_auto', JSON.stringify(session.auto || {})); } catch (e) {}
  }
  function fonts() {
    if (document.getElementById('dk-font')) return;
    var st = document.createElement('style');
    st.id = 'dk-font';
    st.textContent = '@font-face{font-family:DKBrush;src:url("assets/fonts/MaShanZheng-Regular.ttf") format("truetype");font-display:swap}'
      + '@font-face{font-family:DKLatin;src:url("assets/fonts/GreatVibes-Regular.ttf") format("truetype");font-display:swap}';
    document.head.appendChild(st);
    if (document.fonts && document.fonts.load) {
      document.fonts.load('64px DKBrush').catch(function () {});
      document.fonts.load('64px DKLatin').catch(function () {});
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { inkCache = {}; });
  }
  function img(key, file) {
    var o = imgs[key];
    if (!o) {
      o = imgs[key] = new Image();
      o.src = BASE + file;
    }
    return o.complete && o.naturalWidth ? o : null;
  }
  function loadArt() {
    fetch(BASE + 'art.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j) return;
      art = j;
      if (j.formDurationMs) API.setFormDuration(j.formDurationMs / 1000);
    }).catch(function () {});
    fetch(BASE + 'animation.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (j) DK.anim = j;
    }).catch(function () {});
  }
  /* 首页不取图。点开活动才取立绘；开战才取变身视频；变身当帧才取 31 张序列。 */
  function arm(level) {
    if (!armed.meta) { armed.meta = true; loadArt(); }
    if (level === 'battle' || level === 'form') ensureVideo();
    if (level === 'form') armFrames();
  }
  function armFrames() {
    if (armed.frames) return;
    armed.frames = true;
    var n = art.frameCount || 31, i, im, num;
    frameImgs = [];
    for (i = 1; i <= n; i++) {
      im = new Image();
      num = (i < 10 ? '00' : i < 100 ? '0' : '') + i;
      im.src = BASE + 'frames/frame-' + num + '.webp';
      frameImgs.push(im);
    }
  }
  function frameAtRun(run) {
    if (!frameImgs.length) return null;
    var dur = (run && (run.formDur || API.formDuration())) || 5.583;
    var k = 1 - Math.max(0, Math.min(1, (run.formLeft || 0) / dur));
    var i = Math.min(frameImgs.length - 1, Math.floor(k * frameImgs.length));
    var im = frameImgs[i];
    return im && im.complete && im.naturalWidth ? im : null;
  }
  function ensureVideo() {
    if (vid) return vid;
    vid = document.createElement('video');
    vid.src = BASE + (art.formVideo || 'form.mp4');
    vid.playsInline = true;
    vid.setAttribute('playsinline', '');
    vid.muted = true;
    vid.preload = 'auto';
    vid.style.display = 'none';
    document.body.appendChild(vid);
    return vid;
  }
  function startVideo() {
    var v = ensureVideo();
    try { v.currentTime = 0; } catch (e) {}
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }
  function stopVideo() {
    if (!vid) return;
    try { vid.pause(); } catch (e) {}
  }

  function env() {
    var q = '';
    try { q = location.search || ''; } catch (e) {}
    var query = null;
    if (/[?&]cato=0(?:&|#|$)/.test(q)) query = '0';
    else if (/[?&]cato=1(?:&|#|$)/.test(q)) query = '1';
    var saved = null;
    var d = XY.save.data && XY.save.data.devilKitty;
    if (d && typeof d === 'object') {
      if (d.on === false) saved = false;
      else if (d.on === true) saved = true;
    }
    return { testBuild: !!XY.TEST_BUILD, query: query, saved: saved };
  }
  function eventOn() { return API.enabled(env()); }
  function setEventOn(on) {
    if (!XY.save.data) return;
    XY.save.data.devilKitty = { id: API.ID, name: API.NAME, on: !!on };
    if (XY.save.touch) XY.save.touch();
    if (XY.save.flush) XY.save.flush();
  }
  function tutCtx() {
    var G = window.__xy && window.__xy.G;
    var t = XY.save.data && XY.save.data.tutorial;
    return { inTutorial: !!(G && G.tut), tutorialDone: !!(t && t.done === true) };
  }
  function gear() { return API.readGear(XY.save.data || {}); }
  function saveGear(g) {
    API.writeGear(XY.save.data, g);
    if (XY.save.touch) XY.save.touch();
    if (XY.save.flush) XY.save.flush();
  }
  function cardPool() {
    return (XY.SPECIALS || []).map(function (d) { return d.id; }).filter(Boolean);
  }
  function gearIds() { return API.GEAR.map(function (g) { return g.id; }); }

  function appOf() { return (window.__xy && window.__xy.app) || null; }
  function hit(x, y, w, h, act, ex) {
    var o = { x: x, y: y, w: w, h: h, act: act };
    if (ex) for (var k in ex) o[k] = ex[k];
    if (XY.ui && XY.ui.hits) XY.ui.hits.push(o);
  }
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function latin(c, s, x, y, px, col, align) {
    c.font = px + 'px DKLatin, KaiTi, serif';
    c.fillStyle = col;
    c.textAlign = align || 'center';
    c.textBaseline = 'middle';
    c.fillText(s, x, y);
  }
  function cursive(c, s, x, y, px, col, align) {
    brush(c, s, x, y, px, col, align || 'left');
  }
  function kai(c, s, x, y, px, col, align) {
    brush(c, s, x, y, px, col, align || 'left');
  }
  function paper(c, x, y, w, h) {
    rr(c, x, y, w, h, 8);
    var g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#fbf6ea');
    g.addColorStop(0.5, '#f4ead2');
    g.addColorStop(1, '#efe0c0');
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = '#2a2118';
    c.lineWidth = 2.2;
    c.stroke();
    c.strokeStyle = 'rgba(168,48,32,0.55)';
    c.lineWidth = 1;
    rr(c, x + 6, y + 6, w - 12, h - 12, 4);
    c.stroke();
  }
  function redSeal(c, x, y, w, h, label, sub) {
    rr(c, x, y, w, h, Math.min(18, h * 0.35));
    var g = c.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#d24a34');
    g.addColorStop(1, '#a6281c');
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = 'rgba(255,220,170,0.85)';
    c.lineWidth = 1.4;
    rr(c, x + 3, y + 3, w - 6, h - 6, Math.min(14, h * 0.28));
    c.stroke();
    latin(c, sub ? '' : '', x, y, 1, '#fff', 'center');
    if (sub) {
      cursive(c, label, x + w / 2, y + h * 0.4, Math.min(26, h * 0.42), '#fff6e4', 'center');
      latin(c, sub, x + w / 2, y + h * 0.74, Math.min(16, h * 0.26), '#ffe1c2', 'center');
    } else {
      cursive(c, label, x + w / 2, y + h / 2, Math.min(28, h * 0.46), '#fff6e4', 'center');
    }
  }
  function dot(c, x, y) {
    c.beginPath();
    c.arc(x, y, 7, 0, Math.PI * 2);
    c.fillStyle = '#c4321c';
    c.fill();
    c.strokeStyle = '#fff6e4';
    c.lineWidth = 1.5;
    c.stroke();
  }
  function drawContain(c, im, x, y, w, h) {
    var ir = im.naturalWidth / im.naturalHeight, br = w / h, dw = w, dh = h, dx = x, dy = y;
    if (ir > br) { dh = h; dw = h * ir; dx = x - (dw - w) / 2; }
    else { dw = w; dh = w / ir; dy = y - (dh - h) / 2; }
    c.drawImage(im, dx, dy, dw, dh);
  }
  function portrait(c, which, x, y, w, h, bare) {
    var im = img(which, which === 'form' ? (art.form || 'form.webp') : (art.stage1 || 'stage1.webp'));
    if (bare) {
      c.save();
      c.beginPath();
      c.rect(x, y, w, h);
      c.clip();
      if (im) drawContain(c, im, x, y, w, h);
      else cursive(c, '猫', x + w / 2, y + h / 2, Math.min(w, h) * 0.28, '#3a2a1c', 'center');
      c.globalCompositeOperation = 'destination-in';
      var rg = c.createRadialGradient(x + w * 0.5, y + h * 0.42, Math.min(w, h) * 0.08, x + w * 0.5, y + h * 0.48, Math.max(w, h) * 0.78);
      rg.addColorStop(0, 'rgba(0,0,0,1)');
      rg.addColorStop(0.7, 'rgba(0,0,0,1)');
      rg.addColorStop(0.9, 'rgba(0,0,0,0.35)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = rg;
      c.fillRect(x, y, w, h);
      var fadeFrom = bare === 'field' ? 0.52 : 0.8;
      var fade = c.createLinearGradient(x, y + h * fadeFrom, x, y + h);
      fade.addColorStop(0, 'rgba(0,0,0,1)');
      fade.addColorStop(bare === 'field' ? 0.28 : 0.55, 'rgba(0,0,0,0.85)');
      fade.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = fade;
      c.fillRect(x, y, w, h);
      c.restore();
      return;
    }
    c.save();
    rr(c, x, y, w, h, 6);
    c.fillStyle = '#f7f1e4';
    c.fill();
    c.clip();
    if (im) drawContain(c, im, x, y, w, h);
    else cursive(c, '猫', x + w / 2, y + h / 2, Math.min(w, h) * 0.4, '#3a2a1c', 'center');
    c.restore();
    c.strokeStyle = '#2a2118';
    c.lineWidth = 2;
    rr(c, x, y, w, h, 6);
    c.stroke();
  }

  function ctxFrom(G) {
    return {
      enabled: eventOn(),
      mainline: API.isMainline(G),
      phase: G.tang && G.tang.phase,
      restT: G.tang ? G.tang.restT : 0,
      levelId: G.levelId || 1
    };
  }
  function ensureRun(G) {
    if (!G.dkRun) G.dkRun = API.freshRun();
    if (art.formDurationMs) G.dkRun.formDur = art.formDurationMs / 1000;
    return G.dkRun;
  }

  function makeUnit(G, run) {
    var u = run.unit;
    var camp = G.camp || { x: 900, y: 900 };
    var tang = G.heroes && G.heroes[0];
    var ang = tang ? Math.atan2(camp.y - tang.y, camp.x - tang.x) : -0.6;
    var e = {
      id: (G.nextId = (G.nextId || 1) + 1),
      type: 'cato_evil',
      dk: true,
      x: camp.x + Math.cos(ang) * 260,
      y: camp.y + Math.sin(ang) * 200,
      r: 30,
      hp: u.hp,
      maxHp: u.maxHp,
      speed: 62,
      dmg: 0,
      kx: 0, ky: 0, flash: 0, atkT: 2, burnT: 0, burnDps: 0, burnAcc: 0,
      slowT: 0, slowF: 0, stunT: 0, dead: false, wob: 1,
      elem: 'water', markT: 0, toCamp: false, retarget: 0, th: null, shootT: 9,
      def: {
        name: API.HERO, elite: false, boss: false, denBoss: false, etower: false, fly: false,
        hp: u.hp, dmg: 0, r: 30, speed: 62, color: '#241c18', dark: '#8d1f18',
        elem: 'water', dtype: 'magic', pdef: 0.08, mdef: 0.16, knockRes: 0.55,
        xp: 40, coin: 0, coinP: 0
      }
    };
    G.enemies.push(e);
    G.dkUnit = e;
    return e;
  }
  function syncUnit(G) {
    var e = G.dkUnit, u = G.dkRun && G.dkRun.unit;
    if (!e || !u || e.dead) return;
    e.hp = Math.max(1, u.hp);
    e.maxHp = u.maxHp;
    e.def.name = u.phase >= 2 ? API.HERO2 : API.HERO;
    e.def.elite = false;
    e.dkPhase = u.phase;
    if (u.dead) e.hp = 0;
  }
  function applyRage(G) {
    var run = G.dkRun;
    var list = G.enemies || [];
    var i, e;
    if (!run || !run.rageOn) {
      for (i = 0; i < list.length; i++) if (list[i]._dkRage) API.clearMobRage(list[i]);
      return;
    }
    for (i = 0; i < list.length; i++) {
      e = list[i];
      if (!e || e.dead || e.dk) continue;
      if (e.def && (e.def.denBoss || e.def.boss)) {
        if (API.shouldEnrageBoss(e) && XY.enrageBoss) XY.enrageBoss(G, e);
      } else {
        API.applyMobRage(e);
        if (e.atkT > 0.8 / API.MOB_MUL + 0.04 && e.atkT <= 0.86) e.atkT = 0.8 / API.MOB_MUL;
      }
    }
  }
  function nearestHero(G, e) {
    var best = null, bd = 1e15, i, h, d;
    for (i = 1; i < (G.heroes || []).length; i++) {
      h = G.heroes[i];
      if (!h || h.down) continue;
      d = (h.x - e.x) * (h.x - e.x) + (h.y - e.y) * (h.y - e.y);
      if (d < bd) { bd = d; best = h; }
    }
    return best;
  }
  function steer(G, e, dt) {
    var tang = G.heroes && G.heroes[0];
    if (tang && !tang.down) {
      var dx = e.x - tang.x, dy = e.y - tang.y, l = Math.sqrt(dx * dx + dy * dy) || 1;
      if (l < 220) { e.x += dx / l * 90 * dt; e.y += dy / l * 90 * dt; return; }
    }
    var h = nearestHero(G, e);
    if (!h) return;
    var hx = h.x - e.x, hy = h.y - e.y, hl = Math.sqrt(hx * hx + hy * hy) || 1;
    if (hl > 200) { e.x += hx / hl * 70 * dt; e.y += hy / hl * 70 * dt; }
    e.face = Math.atan2(hy, hx);
  }
  function strike(G, e, mul) {
    var h = nearestHero(G, e);
    var u = G.dkRun.unit;
    if (!h || !u || !XY.hurtHeroBy) return;
    XY.hurtHeroBy(G, h, Math.max(1, Math.round(u.dmg * (mul || 1))), false, undefined, 'magic', 'water');
    if (XY.ring) XY.ring(G, h.x, h.y, 36, '#8d1f18', 0.25);
  }
  function giveDrop(G, drop) {
    if (!drop) return;
    var d = XY.SP_BY && XY.SP_BY[drop.card];
    if (XY.save.addSpCard) XY.save.addSpCard(drop.card, 1);
    var gearName = '';
    if (drop.gear) {
      var g = gear();
      API.grantGear(g, drop.gear, 1);
      saveGear(g);
      gearName = (API.gearById[drop.gear] && API.gearById[drop.gear].name) || drop.gear;
    }
    G.dkDrops = { card: drop.card, cardName: d ? d.name : drop.card, gear: drop.gear, gearName: gearName, t: 0 };
    var msg = '击败「' + API.HERO2 + '」，获得角色卡「' + (d ? d.name : drop.card) + '」' + (gearName ? '，和专属「' + gearName + '」' : '');
    if (XY.banner) XY.banner(G, msg, 4.2);
    if (XY.toast) XY.toast(G, msg);
  }
  function applyGear(G) {
    if (!G || G._dkGearDone || !G.heroes) return;
    var id = G.special;
    if (!id) { G._dkGearDone = true; return; }
    var h = null, i;
    for (i = 0; i < G.heroes.length; i++) {
      var x = G.heroes[i];
      if (x && (x.id === id || (x.def && x.def.id === id))) h = x;
    }
    if (!h) return;
    API.applyEffects(h, API.effectsOf(gear(), id));
    G._dkGearDone = true;
  }

  function consume(G, events) {
    var i;
    for (i = 0; i < events.length; i++) {
      if (events[i] === 'spawn') {
        makeUnit(G, G.dkRun);
        applyRage(G);
        if (XY.banner) XY.banner(G, API.NAME + ' · ' + API.HERO + ' 登场', 3.2);
      }
      if (events[i] === 'formed') {
        stopVideo();
        syncUnit(G);
        applyRage(G);
        if (XY.banner) XY.banner(G, API.HERO2 + ' · ' + (art.formName || '九尾咆哮'), 3);
      }
      if (events[i] === 'attack' && G.dkUnit && !G.dkUnit.dead) strike(G, G.dkUnit, 1);
      if (events[i] === 'skill' && G.dkUnit && !G.dkUnit.dead) strike(G, G.dkUnit, G.dkRun.unit.phase >= 2 ? 1.35 : 1.15);
    }
  }
  function lockCam(G) {
    if (!G || !G.dkCamLock || !G.dkUnit || G.dkUnit.dead) return;
    G.cam.x = G.dkUnit.x;
    G.cam.y = G.dkUnit.y;
  }
  function lowBurst(G) {
    var u = G.dkRun && G.dkRun.unit, e = G.dkUnit;
    if (!u || u.dead || u.burstUsed || u.hp > u.maxHp * 0.4) return;
    u.burstUsed = true;
    var i;
    for (i = 1; i < G.heroes.length; i++) {
      var h = G.heroes[i];
      if (!h || h.down) continue;
      if (Math.hypot(h.x - e.x, h.y - e.y) < 200 && XY.hurtHeroBy) XY.hurtHeroBy(G, h, Math.round(u.dmg * 0.85), false, undefined, 'magic', 'water');
    }
    if (XY.ring) XY.ring(G, e.x, e.y, 160, '#8d1f18', 0.4);
  }

  function hold(G, dt) {
    var run = ensureRun(G);
    if (G.dkSkip && run.formLeft > 0) {
      API.skipForm(run);
      G.dkSkip = false;
      stopVideo();
      syncUnit(G);
      applyRage(G);
      G.dkHold = false;
      if (XY.banner) XY.banner(G, API.HERO2, 2.4);
      return;
    }
    var res = API.tickRun(run, ctxFrom(G), dt);
    G.dkRun = res.run;
    consume(G, res.events);
    syncUnit(G);
    G.dkHold = !!res.run.hold;
    if (!G.dkHold) stopVideo();
  }
  function afterStep(G, dt) {
    if (!G || G.mode !== 'play') return;
    applyGear(G);
    if (G.dkHold) return;
    var run = ensureRun(G);
    var res = API.tickRun(run, ctxFrom(G), dt);
    G.dkRun = res.run;
    G.dkHold = !!res.run.hold;
    consume(G, res.events);
    if (G.dkHold) return;
    applyRage(G);
    if (G.dkUnit && !G.dkUnit.dead && run.unit && !run.unit.dead) {
      steer(G, G.dkUnit, dt);
      lowBurst(G);
      syncUnit(G);
    }
    if (G.dkDrops) G.dkDrops.t += dt;
  }

  function interceptDeath(G, e) {
    if (!e || !e.dk) return false;
    var run = ensureRun(G);
    if (!run.unit) return false;
    if (run.formLeft > 0 || run.introLeft > 0 || run.unit.immune) {
      e.dead = false;
      e.hp = Math.max(1, run.unit.hp || 1);
      return true;
    }
    if (run.unit.phase < 2) {
      API.hurtUnit(run, 1e12);
      e.dead = false;
      e.hp = 1;
      G.dkHold = true;
      G.dkRun = run;
      startVideo();
      return true;
    }
    run.unit.hp = 0;
    run.unit.dead = true;
    var drop = API.onDefeat(run, Math.random, cardPool(), gearIds());
    giveDrop(G, drop);
    return false;
  }

  function w2s(G, app, x, y) {
    var vw = (G.view && G.view.w) || app.lw, vh = (G.view && G.view.h) || app.lh;
    return { x: vw / 2 + (x - G.cam.x), y: vh / 2 + (y - G.cam.y) };
  }
  function markFrame() {
    var now = (window.performance && performance.now) ? performance.now() : Date.now();
    if (!fpsT) fpsT = now;
    fpsN++;
    if (now - fpsT >= 500) { fpsV = fpsN * 1000 / (now - fpsT); fpsN = 0; fpsT = now; }
  }

  function buttonBox(app) {
    var W = app.lw, H = app.lh, port = H > W * 1.05;
    if (app.screen === 'start') {
      if (port) return { x: W - 124, y: 10, w: 112, h: 52 };
      return { x: W - 156, y: 14, w: 136, h: 56 };
    }
    if (port) return { x: 12, y: H - 64, w: 112, h: 52 };
    return { x: 22, y: Math.max(250, H - 250), w: 132, h: 56 };
  }
  function gearBox(app, btn) {
    var port = app.lh > app.lw * 1.05;
    if (app.screen !== 'levels') return null;
    if (port) return { x: 132, y: app.lh - 64, w: 112, h: 52 };
    return { x: btn.x + btn.w + 10, y: btn.y, w: 120, h: btn.h };
  }

  function paintButton(c, app) {
    var b = buttonBox(app);
    boxes.event = b;
    redSeal(c, b.x, b.y, b.w, b.h, '活动', API.NAME);
    if (!API.gachaClaimed(XY.save.data)) dot(c, b.x + b.w - 8, b.y + 8);
    hit(b.x, b.y, b.w, b.h, 'dkOpen');
    if (app.screen === 'levels') {
      var g = gearBox(app, b);
      boxes.gear = g;
      redSeal(c, g.x, g.y, g.w, g.h, '专属');
      hit(g.x, g.y, g.w, g.h, 'dkGear');
    }
  }
  function spArt(id) {
    if (!id || !XY.bgArt) return null;
    try { return XY.bgArt(id); } catch (e) { return null; }
  }
  /* 未领取：可抽池每人一张。可见特殊角色 9 位，猫叔在隐藏名单里，不进十连。
   * 以前用下标取余把池子凑成 10 张，会多画一张 Phyrex，那不是抽卡结果。
   * 真正的十连（XY.gacha10.roll）允许重复：重复的角色卡会计入升级。已领取后按实际抽出的 10 张画，重复就重复。 */
  function gachaPack() {
    var g = XY.save.data && XY.save.data.gacha10;
    var claimed = API.gachaClaimed(XY.save.data);
    if (claimed && g && g.pulls && g.pulls.length) return { claimed: true, ids: g.pulls.slice() };
    return { claimed: false, ids: (XY.SPECIALS || []).map(function (d) { return d.id; }) };
  }
  function inkWash(c, im, x, y, w, h, fallback) {
    c.save();
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();
    c.fillStyle = '#f3ead6';
    c.fillRect(x, y, w, h);
    if (im) drawContain(c, im, x, y, w, h);
    else if (fallback) cursive(c, fallback, x + w / 2, y + h * 0.46, Math.min(42, w * 0.34), '#3a2a1c', 'center');
    c.globalCompositeOperation = 'destination-in';
    var rg = c.createRadialGradient(x + w * 0.5, y + h * 0.4, Math.min(w, h) * 0.06, x + w * 0.5, y + h * 0.46, Math.max(w, h) * 0.68);
    rg.addColorStop(0, 'rgba(0,0,0,1)');
    rg.addColorStop(0.62, 'rgba(0,0,0,1)');
    rg.addColorStop(0.86, 'rgba(0,0,0,0.4)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = rg;
    c.fillRect(x, y, w, h);
    var lg = c.createLinearGradient(x, y + h * 0.72, x, y + h);
    lg.addColorStop(0, 'rgba(0,0,0,1)');
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = lg;
    c.fillRect(x, y, w, h);
    c.restore();
    c.save();
    c.strokeStyle = 'rgba(36,28,20,0.45)';
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(x + w * 0.08, y + h * 0.06);
    c.quadraticCurveTo(x + w * 0.4, y - h * 0.02, x + w * 0.78, y + h * 0.05);
    c.moveTo(x + w * 0.12, y + h * 0.9);
    c.quadraticCurveTo(x + w * 0.55, y + h * 1.02, x + w * 0.9, y + h * 0.82);
    c.stroke();
    c.restore();
  }
  function namePlate(c, s, x, y, maxW) {
    var size = 16, font;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    while (size > 10) {
      font = 'bold ' + size + 'px KaiTi, STKaiti, "Noto Serif CJK SC", serif';
      c.font = font;
      if (c.measureText(s).width <= maxW - 12) break;
      size -= 1;
    }
    var tw = Math.min(maxW, c.measureText(s).width + 16);
    var th = size + 10;
    rr(c, x - tw / 2, y - th / 2, tw, th, 2);
    c.fillStyle = 'rgba(251,246,234,0.92)';
    c.fill();
    c.lineWidth = 1.1;
    c.strokeStyle = '#2a2118';
    c.stroke();
    c.fillStyle = '#24180f';
    c.fillText(s, x, y + 0.5);
  }
  function brushReady() {
    return !!(document.fonts && document.fonts.check && document.fonts.check('32px ' + BRUSH_FACE));
  }
  function inkCanvas(s, size, col) {
    var ready = brushReady();
    var key = size + '\n' + (col || '') + '\n' + s;
    if (ready && inkCache[key]) return inkCache[key];
    var parts = String(s).split('·');
    var i;
    for (i = 0; i < parts.length; i++) parts[i] = parts[i].replace(/^\s+|\s+$/g, '');
    if (!parts.length) parts = [''];
    var probe = document.createElement('canvas').getContext('2d');
    probe.font = size + 'px ' + BRUSH_FACE;
    var widths = [], tw = 0, gap = size * 0.36;
    for (i = 0; i < parts.length; i++) {
      widths.push(parts[i] ? probe.measureText(parts[i]).width : 0);
      tw += widths[i] + (i ? gap : 0);
    }
    var pad = Math.ceil(size * 0.28);
    var cnv = document.createElement('canvas');
    cnv.width = Math.max(1, Math.ceil(tw) + pad * 2);
    cnv.height = Math.max(1, Math.ceil(size * 1.32));
    var g = cnv.getContext('2d');
    g.font = size + 'px ' + BRUSH_FACE;
    g.fillStyle = col || '#24180f';
    g.textBaseline = 'middle';
    var cy = cnv.height * 0.52, x0 = pad;
    for (i = 0; i < parts.length; i++) {
      if (i) {
        g.beginPath();
        g.arc(x0 + gap * 0.5, cy, Math.max(1.15, size * 0.055), 0, Math.PI * 2);
        g.fill();
        x0 += gap;
      }
      if (parts[i]) g.fillText(parts[i], x0, cy);
      x0 += widths[i];
    }
    cnv._tw = tw;
    cnv._pad = pad;
    if (ready) inkCache[key] = cnv;
    return cnv;
  }
  function brush(c, s, x, y, size, col, align) {
    if (s === undefined || s === null || s === '') return;
    var im = inkCanvas(String(s), size, col || '#24180f');
    var dx = x - im._pad;
    if (align === 'center') dx = x - im._pad - im._tw / 2;
    else if (align === 'right') dx = x - im._pad - im._tw;
    c.drawImage(im, dx, y - im.height / 2);
  }
  function brushFit(c, s, x, y, maxW, size, col, align) {
    var px = size;
    var im = inkCanvas(String(s), px, col || '#24180f');
    while (px > 11 && im._tw > maxW) {
      px -= 1;
      im = inkCanvas(String(s), px, col || '#24180f');
    }
    var dx = x - im._pad;
    if ((align || 'center') === 'center') dx = x - im._pad - im._tw / 2;
    else if (align === 'right') dx = x - im._pad - im._tw;
    c.drawImage(im, dx, y - im.height / 2);
    return px;
  }
  function brushVert(c, s, x, y, size, col) {
    var i, ch, step = size * 0.98, yy = y;
    for (i = 0; i < s.length; i++) {
      ch = s.charAt(i);
      if (ch === ' ') continue;
      if (ch === '·' || ch === '・') {
        c.beginPath();
        c.fillStyle = col || '#24180f';
        c.arc(x, yy, Math.max(1.4, size * 0.07), 0, Math.PI * 2);
        c.fill();
        yy += step * 0.48;
        continue;
      }
      brush(c, ch, x, yy, size, col, 'center');
      yy += step;
    }
    return yy - y;
  }
  function cinnabar(c, x, y, ch) {
    c.save();
    c.beginPath();
    c.arc(x, y, 11, 0, Math.PI * 2);
    c.fillStyle = '#8d1f18';
    c.fill();
    c.restore();
    brush(c, ch || '印', x, y, 13, '#f4e6d4', 'center');
  }
  function mostlyCjk(s) {
    var i, n = 0;
    for (i = 0; i < s.length; i++) if (s.charCodeAt(i) > 127) n++;
    return n >= s.length * 0.6;
  }
  function cardName(c, s, x, y, w, h) {
    if (mostlyCjk(s) && s.length <= 6) {
      var size = Math.max(13, Math.min(20, (h - 28) / s.length));
      var top = y + Math.max(12, (h - s.length * size) * 0.55);
      var used = brushVert(c, s, x + 16, top, size, '#24180f');
      cinnabar(c, x + 16, top + used + 8, '印');
    } else {
      var px = brushFit(c, s, x + w / 2, y + h - 18, w - 28, Math.min(20, w * 0.14), '#24180f', 'center');
      cinnabar(c, x + w - 16, y + h - 18, '印');
      void px;
    }
  }
  function drawGrid(c, ids, x, y, w, h, claimed) {
    var n = ids.length;
    if (!n || w < 40 || h < 40) return;
    var cols = n > 6 ? (w > h * 1.2 ? 5 : 3) : (n > 3 ? 3 : n);
    if (w < 420) cols = 3;
    var rows = Math.ceil(n / cols);
    var gap = 8;
    var cw = Math.floor((w - gap * (cols - 1)) / cols);
    var ch = Math.floor((h - gap * (rows - 1)) / rows);
    var i;
    for (i = 0; i < n; i++) {
      var col = i % cols;
      var row = Math.floor(i / cols);
      var inRow = row === rows - 1 ? n - row * cols : cols;
      var rowW = inRow * cw + (inRow - 1) * gap;
      var ox = x + Math.floor((w - rowW) / 2);
      var cx = ox + col * (cw + gap);
      var cy = y + row * (ch + gap);
      if (cx < x) cx = x;
      if (cx + cw > x + w) cx = x + w - cw;
      var id = ids[i];
      var d = XY.SP_BY && XY.SP_BY[id];
      var nm = d ? d.name : (id || '卡');
      inkWash(c, spArt(id), cx, cy, cw, ch, nm.slice(0, 1));
      cardName(c, nm, cx, cy, cw, ch);
      if (claimed) brush(c, '已领', cx + cw - 28, cy + 14, 12, '#8d1f18', 'center');
    }
  }
  function paintGacha(c, x, y, w, h, pack) {
    brush(c, '十连抽卡', x + 2, y + 16, 28, '#7d1c14', 'left');
    brush(c, pack.claimed ? '已入册' : ('池中 ' + pack.ids.length + ' 位'), x + 132, y + 16, 16, '#5c4a36', 'left');
    var top = y + 36;
    var btnH = 46;
    drawGrid(c, pack.ids, x, top, w, Math.max(60, h - 36 - btnH - 8), pack.claimed);
    var bw = Math.min(150, w - 4), bx = x, by = y + h - btnH;
    if (pack.claimed) brush(c, '已领取', bx + 36, by + btnH / 2, 22, '#6a5438', 'left');
    else {
      redSeal(c, bx, by, bw, btnH, '去抽卡');
      hit(bx, by, bw, btnH, 'dkDraw');
    }
  }
  function storyLines() {
    return [
      '休息后约二十秒登场。',
      '邪气必杀，全场狂暴约四十五秒。',
      '小怪约 ×1.5，洞主沿用狂暴 ×2。',
      '第一次倒下，化成九尾咆哮。',
      '只有击败魔化之身才掉落。',
      '必得一张角色卡，或再得专属。',
      '只在主线。没打败也不判负。'
    ];
  }
  function captionOn(c, x, y, w, h, name, handle) {
    var size = Math.max(16, Math.min(32, w * 0.1));
    var nameY = y + h - (handle ? 42 : 26);
    var used = brushFit(c, name, x + w / 2 - 12, nameY, Math.max(40, w - 64), size, '#24180f', 'center');
    var im = inkCanvas(name, used, '#24180f');
    var sealX = x + w / 2 - 12 + im._tw / 2 + 16;
    if (sealX > x + w - 14) sealX = x + w - 14;
    cinnabar(c, sealX, nameY, '印');
    if (handle) brush(c, handle, x + w / 2 - 12, y + h - 16, Math.max(12, Math.min(15, used * 0.42)), '#8d1f18', 'center');
  }
  function vertStory(c, s, x, y, maxW, h) {
    var size = 16, step, per, cols, need, i, col, row, yy, ch;
    function layout(px) {
      step = px * 1.08;
      per = Math.max(1, Math.floor((h - px * 1.4) / step));
      cols = Math.ceil(s.length / per);
      need = cols * (px + 8);
      return need;
    }
    while (size >= 13 && layout(size) > maxW) size -= 1;
    layout(size);
    for (i = 0; i < s.length; i++) {
      col = Math.floor(i / per);
      row = i % per;
      ch = s.charAt(i);
      yy = y + row * step + size * 0.5;
      if (ch === '·') {
        c.beginPath();
        c.fillStyle = '#3a2e22';
        c.arc(x + col * (size + 7) + size * 0.5, yy, Math.max(1.3, size * 0.07), 0, Math.PI * 2);
        c.fill();
      } else brush(c, ch, x + col * (size + 7) + size * 0.5, yy, size, '#3a2e22', 'center');
    }
    return Math.max(size + 8, cols * (size + 7));
  }
  function paintStory(c, x, y, w, h) {
    var lines = storyLines();
    var stage = img('stage1', art.stage1 || 'stage1.webp');
    var form = img('form', art.form || 'form.webp');
    var gap = 8, textW, px, pw, cardW, i, colW, half, yy, size;
    if (w >= 520 && h >= 360) {
      textW = vertStory(c, lines.join(''), x + 2, y + 4, Math.min(168, w * 0.22), h - 8);
      px = x + textW + 6;
      pw = Math.max(80, w - textW - 6);
      cardW = Math.floor((pw - gap) / 2);
      inkWash(c, stage, px, y, cardW, h, '猫');
      captionOn(c, px, y, cardW, h, API.HERO, API.HANDLE);
      inkWash(c, form, px + cardW + gap, y, cardW, h, '化');
      captionOn(c, px + cardW + gap, y, cardW, h, API.HERO2, '');
      return;
    }
    size = w < 420 ? 13 : 14;
    half = Math.ceil(lines.length / 2);
    colW = (w - 10) / 2;
    for (i = 0; i < lines.length; i++) {
      yy = y + 12 + (i % half) * (size + 5);
      brushFit(c, lines[i], x + (i < half ? 0 : colW + 8), yy, colW - 4, size, '#3a2e22', 'left');
    }
    var top = y + half * (size + 5) + 16;
    var cardH = Math.max(80, h - (top - y));
    cardW = Math.floor((w - gap) / 2);
    inkWash(c, stage, x, top, cardW, cardH, '猫');
    captionOn(c, x, top, cardW, cardH, API.HERO, API.HANDLE);
    inkWash(c, form, x + cardW + gap, top, cardW, cardH, '化');
    captionOn(c, x + cardW + gap, top, cardW, cardH, API.HERO2, '');
  }
  function paintPopup(c, app) {
    var W = app.lw, H = app.lh, port = H > W * 1.05 || W < 760;
    c.save();
    c.fillStyle = 'rgba(246,239,224,0.55)';
    c.fillRect(0, 0, W, H);
    var m = port ? 8 : 22;
    var x = m, y = port ? 10 : 16, w = W - m * 2, h = H - y - (port ? 10 : 14);
    paper(c, x, y, w, h);
    c.save();
    c.beginPath();
    c.rect(x + 6, y + 6, w - 12, h - 12);
    c.clip();
    brush(c, '特别活动', x + (port ? 16 : 24), y + (port ? 28 : 36), port ? 26 : 32, '#3a2a1c', 'left');
    latin(c, API.NAME, x + (port ? 150 : 180), y + (port ? 28 : 36), port ? 28 : 36, '#7d1c14', 'left');
    redSeal(c, x + w - (port ? 72 : 84), y + 12, port ? 56 : 66, 44, '关');
    hit(x + w - (port ? 72 : 84), y + 12, port ? 56 : 66, 44, 'dkClose');
    hit(0, 0, W, H, 'dkClose');
    hit(x, y, w, h, 'dkNoop');
    var pack = gachaPack();
    pack.ids.forEach(function (id) { spArt(id); });
    var on = eventOn();
    var top = y + (port ? 52 : 64);
    var bodyH = h - (top - y) - 10;
    if (!on) paintGacha(c, x + 14, top, w - 28, bodyH, pack);
    else if (port) {
      var gh = Math.floor(bodyH * 0.46);
      paintGacha(c, x + 10, top, w - 20, gh, pack);
      paintStory(c, x + 10, top + gh + 8, w - 20, bodyH - gh - 8);
    } else {
      var lw = Math.floor((w - 36) * 0.5);
      paintGacha(c, x + 14, top, lw, bodyH, pack);
      paintStory(c, x + 22 + lw, top, w - lw - 36, bodyH);
    }
    c.restore();
    c.restore();
    boxes.popup = { x: x, y: y, w: w, h: h };
  }
  function paintIntro(c, app, run) {
    var W = app.lw, H = app.lh, port = H > W * 1.05;
    c.save();
    c.fillStyle = 'rgba(246,239,224,0.82)';
    c.fillRect(0, 0, W, H);
    var m = port ? 6 : 12;
    var x = m, y = m, w = W - m * 2, hh = H - m * 2;
    paper(c, x, y, w, hh);
    brush(c, '特别活动 · 猫叔 登场', x + w / 2, y + (port ? 28 : 34), port ? 22 : 30, '#24180f', 'center');
    var top = y + (port ? 48 : 56);
    var gap = port ? 8 : 12;
    var availH = hh - (top - y) - 10;
    var stage = img('stage1', art.stage1 || 'stage1.webp');
    var form = img('form', art.form || 'form.webp');
    if (port) {
      var each = Math.floor((availH - gap) / 2);
      inkWash(c, stage, x + 8, top, w - 16, each, '猫');
      captionOn(c, x + 8, top, w - 16, each, API.HERO, API.HANDLE);
      inkWash(c, form, x + 8, top + each + gap, w - 16, each, '化');
      captionOn(c, x + 8, top + each + gap, w - 16, each, API.HERO2, '');
    } else {
      var cw = Math.floor((w - 24 - gap) / 2);
      inkWash(c, stage, x + 10, top, cw, availH, '猫');
      captionOn(c, x + 10, top, cw, availH, API.HERO, API.HANDLE);
      inkWash(c, form, x + 10 + cw + gap, top, cw, availH, '化');
      captionOn(c, x + 10 + cw + gap, top, cw, availH, API.HERO2, '');
    }
    c.restore();
  }
  function splatField(c, W, H, p) {
    var i, n = Math.floor(26 + p * 70);
    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (i = 0; i < n; i++) {
      var ang = i * 2.399963;
      var rad = (0.08 + (i % 13) * 0.05) * Math.max(W, H) * (0.22 + p * 0.85);
      var x = W / 2 + Math.cos(ang) * rad * 0.92;
      var y = H / 2 + Math.sin(ang * 0.97) * rad * 0.62;
      var len = (28 + (i % 8) * 22) * (0.55 + p);
      c.strokeStyle = 'rgba(28,22,16,' + (0.16 + (i % 4) * 0.08) + ')';
      c.lineWidth = 1.4 + (i % 5) * 1.5;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + Math.cos(ang + 1) * len, y + Math.sin(ang) * len * 0.55, x + Math.cos(ang) * len * 1.5, y + Math.sin(ang * 1.15) * len);
      c.stroke();
      if (i % 4 === 0) {
        var r = (46 + (i % 5) * 28) * (0.45 + p);
        var g = c.createRadialGradient(x, y, r * 0.08, x, y, r);
        g.addColorStop(0, 'rgba(28,22,16,' + (0.14 + (i % 3) * 0.04) + ')');
        g.addColorStop(1, 'rgba(28,22,16,0)');
        c.fillStyle = g;
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
  }
  function blitCut(c, key, file, cx, foot, ht) {
    var im = img(key, file);
    if (!im) return false;
    var w = ht * im.naturalWidth / im.naturalHeight;
    c.drawImage(im, cx - w / 2, foot - ht, w, ht);
    return true;
  }
  function paintForm(c, app, run) {
    var W = app.lw, H = app.lh, port = H > W;
    var dur = (run && (run.formDur || API.formDuration())) || 9;
    var p = 1 - Math.max(0, Math.min(1, (run.formLeft || 0) / dur));
    c.save();
    c.fillStyle = '#f6efe2';
    c.fillRect(0, 0, W, H);
    splatField(c, W, H, p);
    var foot = H - (port ? 6 : H * 0.015);
    var cx = port ? W * 0.5 : W * 0.58;
    var room = port ? Math.max(120, foot - 50) : H * 1.02;
    var ease = function (u) { return 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3); };
    if (p < 0.5) {
      var cover = p < 0.16 ? 0 : (p - 0.16) / 0.34;
      c.save();
      c.globalAlpha = 1 - cover * 0.94;
      blitCut(c, 'stage1cut', art.stage1Cut || 'stage1-cut.webp', cx, foot, room * (port ? 0.96 : 1));
      c.restore();
    }
    if (p > 0.12 && p < 0.62) {
      var k = Math.max(0, Math.min(1, (p - 0.12) / 0.42));
      var rr = H * (0.12 + 0.78 * k);
      var ig = c.createRadialGradient(cx, H * 0.46, rr * 0.08, cx, H * 0.46, rr);
      ig.addColorStop(0, 'rgba(22,16,12,' + (0.08 + 0.42 * k) + ')');
      ig.addColorStop(1, 'rgba(22,16,12,0)');
      c.fillStyle = ig;
      c.beginPath();
      c.arc(cx, H * 0.46, rr, 0, Math.PI * 2);
      c.fill();
    }
    if (p > 0.36) {
      var u = ease((p - 0.36) / 0.4);
      var fh = room * (port ? (0.78 + 0.22 * u) : (0.78 + 0.26 * u));
      c.save();
      c.globalAlpha = Math.min(1, (p - 0.36) / 0.16);
      blitCut(c, 'formcut', art.formCut || 'form-cut.webp', cx, foot, fh);
      c.restore();
    }
    if (p > 0.55) {
      if (port) {
        brush(c, API.HERO2, W / 2, 26, 22, '#24180f', 'center');
        cinnabar(c, W / 2 + 78, 26, '魔');
      } else {
        var nx = Math.max(36, Math.min(W * 0.07, cx - H * 0.46));
        var ny = H * 0.2;
        var used = brushVert(c, API.HERO2, nx, ny, 44, '#24180f');
        cinnabar(c, nx, ny + used + 8, '魔');
      }
    }
    var bw = 110, bh = 44, bx = W - bw - 14, by = H - bh - 12;
    redSeal(c, bx, by, bw, bh, '跳过');
    hit(bx, by, bw, bh, 'dkSkip');
    hit(0, 0, W, H, 'dkSkip');
    c.restore();
  }
  function inkBurst(c, x, y, r, t) {
    c.save();
    c.translate(x, y);
    c.strokeStyle = 'rgba(30,24,18,0.35)';
    c.lineWidth = 2;
    var i;
    for (i = 0; i < 9; i++) {
      c.beginPath();
      c.arc(0, 0, r * (0.25 + (i % 5) * 0.12), i, i + 1.4);
      c.stroke();
    }
    c.strokeStyle = 'rgba(166,40,28,' + (0.25 + 0.25 * Math.sin((t || 0) * 6)) + ')';
    c.lineWidth = 1.5;
    for (i = 0; i < 6; i++) {
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(i) * r * 0.8, Math.sin(i * 1.3) * r * 0.55);
      c.stroke();
    }
    c.restore();
  }
  function cracks(c, x, y, w, h, k) {
    c.save();
    c.strokeStyle = 'rgba(166,40,28,' + (0.35 + 0.4 * k) + ')';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(x + w * 0.5, y + h * 0.2);
    c.lineTo(x + w * 0.62, y + h * 0.45);
    c.lineTo(x + w * 0.48, y + h * 0.7);
    c.moveTo(x + w * 0.62, y + h * 0.45);
    c.lineTo(x + w * 0.78, y + h * 0.58);
    c.stroke();
    c.restore();
  }
  function paintGear(c, app) {
    var W = app.lw, H = app.lh, port = H > W * 1.05;
    c.save();
    c.fillStyle = 'rgba(246,239,224,0.72)';
    c.fillRect(0, 0, W, H);
    paper(c, 10, 10, W - 20, H - 20);
    latin(c, 'Gear', 28, 36, 18, '#7d1c14', 'left');
    cursive(c, '专属装备', 28, port ? 58 : 64, port ? 28 : 36, '#24180f', 'left');
    kai(c, '一人一武器、一道具。只能装给对应的人。圆章是占位，待换正式美术。', 28, port ? 88 : 98, 13, '#6a5438', 'left', false);
    redSeal(c, W - 96, 22, 70, 46, '返回');
    hit(W - 96, 22, 70, 46, 'dkGearClose');
    var ids = (XY.SPECIALS_ALL || XY.SPECIALS || []).map(function (d) { return d.id; });
    var sel = app.dkHero && ids.indexOf(app.dkHero) >= 0 ? app.dkHero : (ids[0] || 'phyrex');
    app.dkHero = sel;
    var sealD = port ? 48 : 54, gap = 8, x0 = 24, y0 = port ? 112 : 124, maxW = W - 48;
    var x = x0, y = y0, i;
    for (i = 0; i < ids.length; i++) {
      if (x + sealD > x0 + maxW) { x = x0; y += sealD + 22; }
      var id = ids[i], on = id === sel;
      c.beginPath();
      c.arc(x + sealD / 2, y + sealD / 2, sealD / 2, 0, Math.PI * 2);
      c.fillStyle = on ? '#a6281c' : '#f7f1e4';
      c.fill();
      c.lineWidth = on ? 3 : 1.4;
      c.strokeStyle = on ? '#f0d7a4' : '#2a2118';
      c.stroke();
      var nm = (XY.SP_BY && XY.SP_BY[id] && XY.SP_BY[id].name) || id;
      cursive(c, nm.slice(0, 1), x + sealD / 2, y + sealD / 2, 22, on ? '#fff6e4' : '#24180f', 'center');
      hit(x, y, sealD, sealD, 'dkHero', { id: id });
      x += sealD + gap;
    }
    var def = XY.SP_BY && XY.SP_BY[sel];
    var cardY = y + sealD + 28;
    var cardH = H - cardY - 28;
    if (cardH < 160) cardH = 160;
    paper(c, 24, cardY, W - 48, cardH);
    cursive(c, def ? def.name : sel, 44, cardY + 32, 30, '#24180f', 'left');
    kai(c, def && def.handle ? def.handle : '', 44, cardY + 60, 14, '#8d1f18', 'left', false);
    if (sel === 'cato') kai(c, '猫叔只作为敌方登场，不能编入队伍。装备先替他收着。', 44, cardY + 82, 13, '#6a5438', 'left', false);
    var gdoc = gear();
    var row = (gdoc.equip && gdoc.equip[sel]) || { weapon: null, item: null };
    ['weapon', 'item'].forEach(function (slot, si) {
      var sx = 40 + si * Math.min(280, (W - 100) / 2);
      var sy = cardY + 108;
      var piece = row[slot] && API.gearById[row[slot]];
      rr(c, sx, sy, Math.min(250, (W - 120) / 2), 118, 8);
      c.fillStyle = '#fffaf0';
      c.fill();
      c.strokeStyle = '#2a2118';
      c.stroke();
      c.beginPath();
      c.arc(sx + 36, sy + 40, 22, 0, Math.PI * 2);
      c.fillStyle = '#f3e6c8';
      c.fill();
      c.stroke();
      cursive(c, piece ? piece.seal : (slot === 'weapon' ? '武' : '具'), sx + 36, sy + 40, 20, '#7d1c14', 'center');
      kai(c, slot === 'weapon' ? '武器' : '道具', sx + 68, sy + 28, 13, '#8a7048', 'left', false);
      cursive(c, piece ? piece.name : '空', sx + 68, sy + 52, 20, '#24180f', 'left');
      kai(c, piece ? piece.desc : '尚未装备', sx + 68, sy + 78, 12, '#5c4a36', 'left', false);
    });
    var owned = API.GEAR.filter(function (g) { return g.owner === sel && ((gdoc.bag && gdoc.bag[g.id]) || 0) > 0; });
    var oy = cardY + 240;
    if (oy < cardY + cardH - 20) {
      kai(c, owned.length ? '行囊里可以装上：' : (row.weapon || row.item ? '这件已经装上了。' : '行囊里还没有这位的专属装备。'), 44, oy, 14, '#3a2e22', 'left', false);
      owned.forEach(function (g, n) {
        var bx = 44 + (n % 3) * 180, by = oy + 22 + Math.floor(n / 3) * 48;
        if (by > cardY + cardH - 36) return;
        redSeal(c, bx, by, 168, 40, g.seal + ' ' + g.name);
        hit(bx, by, 168, 40, 'dkEquip', { id: g.id, hero: sel });
      });
    }
    kai(c, '图标为墨笔圆章占位，说明待换正式美术。', 44, cardY + cardH - 18, 12, '#8a7048', 'left', false);
    c.restore();
  }

  function paintBattle(c, G, app) {
    var run = G.dkRun;
    if (!run) return;
    if (run.rageOn) {
      var list = G.enemies || [], n = 0, i;
      for (i = 0; i < list.length && n < 28; i++) {
        var e = list[i];
        if (!e || e.dead || e.dk) continue;
        if (!e._dkRage && !e.enraged) continue;
        var p = w2s(G, app, e.x, e.y - (e.r || 16) - 18);
        if (p.x < -20 || p.y < -20 || p.x > app.lw + 20 || p.y > app.lh + 20) continue;
        if (e.def && (e.def.denBoss || e.def.boss)) continue;
        c.beginPath();
        c.arc(p.x, p.y, 11, 0, Math.PI * 2);
        c.fillStyle = 'rgba(247,241,228,0.94)';
        c.fill();
        c.lineWidth = 1.4;
        c.strokeStyle = '#2a2118';
        c.stroke();
        cursive(c, '狂', p.x, p.y, 13, '#8d1f18', 'center');
        n++;
      }
      var left = Math.max(0, Math.ceil(run.rageLeft));
      brush(c, '狂暴 ' + left + ' 秒', 18, 86, 18, '#7d1c14', 'left');
    }
    var e2 = G.dkUnit;
    if (e2 && !e2.dead && run.unit && !run.unit.dead && run.introLeft <= 0 && run.formLeft <= 0) {
      var q = w2s(G, app, e2.x, e2.y);
      var ph = run.unit.phase >= 2 ? 292 : 200;
      var cutKey = run.unit.phase >= 2 ? 'formcut' : 'stage1cut';
      var cutFile = run.unit.phase >= 2 ? (art.formCut || 'form-cut.webp') : (art.stage1Cut || 'stage1-cut.webp');
      var cutIm = img(cutKey, cutFile);
      var aspect = cutIm ? cutIm.naturalWidth / cutIm.naturalHeight : 0.75;
      var pw = Math.round(ph * aspect);
      var px = q.x - pw / 2, py = q.y - ph;
      var boss = null, di;
      if (G.dens) for (di = 0; di < G.dens.length; di++) if (G.dens[di].boss && !G.dens[di].boss.dead) { boss = G.dens[di].boss; break; }
      if (boss) {
        var bq = w2s(G, app, boss.x, boss.y);
        if (bq.x > q.x - 30 && px + pw > bq.x - 110) px = Math.max(8, bq.x - 110 - pw);
      }
      var banW = Math.min(260, Math.max(168, app.lw * 0.28));
      var ban = { x: (app.lw - banW) / 2, y: Math.max(120, Math.min(app.lh * 0.18, 240)), w: banW, h: 64 };
      if (px < ban.x + ban.w && px + pw > ban.x && py < ban.y + ban.h + 6) {
        var shift = ban.y + ban.h + 8 - py;
        if (shift > 0 && shift < 140 && py + ph + shift < app.lh - 16) py += shift;
      }
      if (cutIm) c.drawImage(cutIm, px, py, pw, ph);
      else blitCut(c, cutKey, cutFile, px + pw / 2, py + ph, ph);
      var label = run.unit.phase >= 2 ? API.HERO2 : API.HERO;
      var sizeN = 16, stepN = sizeN * 0.98, lh = label.length * stepN + 28;
      var station = null;
      if (G.camp) {
        var cs = w2s(G, app, G.camp.x, G.camp.y - 98);
        station = { x: cs.x - 140, y: cs.y - 16, w: 280, h: 32 };
      }
      var bossTag = null;
      function overlap(r, b) { return b && r.x < b.x + b.w && r.x + r.w > b.x && r.y < b.y + b.h && r.y + r.h > b.y; }
      function blocked(nx, ny) {
        var r = { x: nx - 18, y: ny - 8, w: 36, h: lh };
        if (r.y < 100 || r.y + r.h > app.lh - 64) return true;
        if (r.x < 2 || r.x > app.lw - 8) return true;
        if (overlap(r, station) || overlap(r, bossTag) || overlap(r, ban)) return true;
        return false;
      }
      if (boss) {
        var bs = w2s(G, app, boss.x, boss.y - (boss.r || 36) - 28);
        bossTag = { x: bs.x - 170, y: bs.y - 30, w: 300, h: 64 };
      }
      var cands = [
        { x: px + pw + 18, y: py + ph * 0.58 },
        { x: px + pw + 18, y: py + ph * 0.34 },
        { x: Math.max(14, px - 36), y: py + ph * 0.62 },
        { x: Math.min(app.lw - 24, px + pw * 0.62), y: Math.min(app.lh - 96, py + ph + 16) }
      ];
      var spot = cands[0], ci;
      for (ci = 0; ci < cands.length; ci++) if (!blocked(cands[ci].x, cands[ci].y)) { spot = cands[ci]; break; }
      var usedN = brushVert(c, label, spot.x, spot.y, sizeN, '#24180f');
      cinnabar(c, spot.x, spot.y + usedN + 6, run.unit.phase >= 2 ? '魔' : '猫');
    }
    if (run.introLeft > 0) paintIntro(c, app, run);
    if (run.formLeft > 0) paintForm(c, app, run);
    if (G.dkDrops && G.dkDrops.t < 6) {
      paper(c, app.lw / 2 - 180, app.lh * 0.18, 360, 64);
      cursive(c, '掉落', app.lw / 2 - 150, app.lh * 0.18 + 22, 18, '#7d1c14', 'left');
      kai(c, '角色卡 · ' + G.dkDrops.cardName + (G.dkDrops.gearName ? '  ·  ' + G.dkDrops.gearName : ''), app.lw / 2 - 150, app.lh * 0.18 + 44, 14, '#24180f', 'left', false);
    }
  }
  function paintPause(c, app) {
    var W = app.lw, H = app.lh, w = Math.min(300, W - 24), h = 56;
    var x = 16, y = Math.max(8, H - h - 12);
    boxes.pause = { x: x, y: y, w: w, h: h };
    var on = eventOn();
    rr(c, x, y, w, h, 16);
    var g = c.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#d24a34');
    g.addColorStop(1, '#a6281c');
    c.fillStyle = g;
    c.fill();
    latin(c, API.NAME, x + 16, y + h / 2, 26, '#fff6e4', 'left');
    kai(c, on ? '开' : '关', x + w - 36, y + h / 2, 22, '#fff6e4', 'center');
    kai(c, API.SUB, x + 168, y + h / 2, 14, '#ffe1c2', 'left', false);
    hit(x, y, w, h, 'dkToggle');
  }

  function maybeAuto(app) {
    if (app.dkOpen || app.dkGear) return;
    if (app.screen !== 'start' && app.screen !== 'levels') return;
    if (!API.shouldAuto(session, app.screen, tutCtx())) return;
    app.dkOpen = true;
    API.markAuto(session, app.screen);
    saveSession();
  }
  function gachaOverlay() {
    return XY.gacha10 && XY.gacha10.overlay && XY.gacha10.overlay();
  }

  function paint(ctx, G, app) {
    markFrame();
    if (!app) return;
    boxes = {};
    if (app.dkOpen || app.dkGear) arm('popup');
    if (app.screen === 'play' || app.screen === 'pause') arm('battle');
    if (G && G.dkRun && G.dkRun.formLeft > 0) arm('form');
    if (app.screen === 'play' && G) {
      paintBattle(ctx, G, app);
      return;
    }
    if (app.screen === 'pause') return;
    if (gachaOverlay()) return;
    if (app.screen === 'start' || app.screen === 'levels') {
      if (app.dkGear && app.screen === 'levels') { paintGear(ctx, app); return; }
      maybeAuto(app);
      paintButton(ctx, app);
      if (app.dkOpen) paintPopup(ctx, app);
    }
  }

  function act(h) {
    if (!h || !h.act || h.act.indexOf('dk') !== 0) return false;
    var app = appOf();
    if (!app) return false;
    if (h.act === 'dkNoop') return true;
    if (h.act === 'dkOpen') { app.dkOpen = true; app.dkGear = false; return true; }
    if (h.act === 'dkClose') { app.dkOpen = false; return true; }
    if (h.act === 'dkGear') { app.dkGear = true; app.dkOpen = false; return true; }
    if (h.act === 'dkGearClose') { app.dkGear = false; return true; }
    if (h.act === 'dkHero') { app.dkHero = h.id; return true; }
    if (h.act === 'dkToggle') {
      if (env().query === '0') return true;
      setEventOn(!eventOn());
      return true;
    }
    if (h.act === 'dkSkip') {
      var G = window.__xy && window.__xy.G;
      if (G) G.dkSkip = true;
      return true;
    }
    if (h.act === 'dkDraw') {
      if (!XY.gacha10 || !XY.gacha10.ensure) return true;
      if (API.gachaClaimed(XY.save.data)) return true;
      XY.gacha10._showFlip = true;
      app.dkOpen = false;
      XY.gacha10.ensure();
      return true;
    }
    if (h.act === 'dkEquip') {
      var g = gear();
      var res = API.equipGear(g, h.hero, h.id);
      if (res.ok) saveGear(g);
      app.menuMsg = { text: res.reason, bad: !res.ok, until: (app.rt || 0) + 2.4 };
      return true;
    }
    return false;
  }

  var oldStep = XY.step;
  XY.step = function (G, dt) {
    if (G && G.dkHold) { hold(G, dt); lockCam(G); return; }
    oldStep(G, dt);
    if (G && G.mode === 'play') afterStep(G, dt);
    lockCam(G);
  };
  var oldRender = XY.render;
  XY.render = function (ctx, G, app) {
    oldRender(ctx, G, app);
    try { paint(ctx, G, app); } catch (err) { if (window.console) console.error(err); }
  };
  if (XY.gacha10 && XY.gacha10.view) {
    var oldView = XY.gacha10.view;
    XY.gacha10.view = function (a) {
      var g = XY.save.data && XY.save.data.gacha10;
      var exists = g && g.pulls && g.pulls.length === 10;
      if (!exists && !XY.gacha10._showFlip) return null;
      return oldView(a);
    };
    XY.gacha10.overlay = function () {
      var g = XY.save.data && XY.save.data.gacha10;
      return !!(g && g.pulls && g.pulls.length === 10 && !g.acked);
    };
  }
  if (XY.hubUI && XY.hubUI.act) {
    var oldAct = XY.hubUI.act;
    XY.hubUI.act = function (h, p, a) {
      if (act(h)) return true;
      return oldAct(h, p, a);
    };
  }
  if (XY.ov && XY.ov.pause) {
    var oldPause = XY.ov.pause;
    XY.ov.pause = function (c, G, a) {
      oldPause(c, G, a);
      try { paintPause(c, a); } catch (err) { if (window.console) console.error(err); }
    };
  }

  var DK = XY.devilKitty = {
    api: API,
    art: art,
    anim: null,
    boxes: function () { return boxes; },
    fps: function () { return fpsV; },
    eventOn: eventOn,
    setEventOn: setEventOn,
    env: env,
    interceptDeath: interceptDeath,
    session: function () { return session; }
  };
  XY.devilKitty = DK;
  fonts();
})();
