/* Devil Kitty 浏览器接法：登场、狂暴、变身 mp4、活动弹窗、专属装备。
 * 素材目录 assets/devil-kitty/（art.json 指明可替换的立绘与变身视频）。
 */
(function () {
  'use strict';
  var API = window.XY_DEVIL_KITTY;
  var XY = window.XY;
  if (!API || !XY || !XY.step || !XY.save) return;

  var BASE = 'assets/devil-kitty/';
  var art = { stage1: 'stage1.webp', form: 'form.webp', formVideo: 'form.mp4', formDurationMs: 5583, frameCount: 31, formName: '九尾咆哮' };
  var imgs = {};
  var vid = null;
  var frameImgs = [];
  var armed = { meta: false, frames: false };
  var session = loadSession();
  var fpsN = 0, fpsT = 0, fpsV = 0;
  var boxes = {};

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
    st.textContent = '@font-face{font-family:DKLatin;src:url("assets/fonts/GreatVibes-Regular.ttf") format("truetype");font-display:swap}';
    document.head.appendChild(st);
    if (document.fonts && document.fonts.load) document.fonts.load('64px DKLatin').catch(function () {});
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
    var latinOnly = /^[\x00-\x7F\s]+$/.test(s);
    c.font = latinOnly
      ? px + 'px DKLatin, KaiTi, serif'
      : 'bold ' + px + 'px KaiTi, STKaiti, "Noto Serif CJK SC", serif';
    c.fillStyle = col;
    c.textAlign = align || 'left';
    c.textBaseline = 'middle';
    c.fillText(s, x, y);
  }
  function kai(c, s, x, y, px, col, align, bold) {
    c.font = (bold === false ? '' : 'bold ') + px + 'px KaiTi, STKaiti, "Noto Serif CJK SC", serif';
    c.fillStyle = col;
    c.textAlign = align || 'left';
    c.textBaseline = 'middle';
    c.fillText(s, x, y);
  }
  function paper(c, x, y, w, h) {
    rr(c, x, y, w, h, 8);
    var g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#fbf6ea');
    g.addColorStop(0.5, '#f4ead2');
    g.addColorStop(1, '#efe0c0');
    c.fillStyle = g;
    c.fill();
    c.save();
    c.globalAlpha = 0.35;
    c.strokeStyle = 'rgba(90,70,40,0.35)';
    c.lineWidth = 1;
    for (var i = 0; i < 7; i++) {
      c.beginPath();
      c.moveTo(x + 12, y + 18 + i * (h / 8));
      c.lineTo(x + w - 16, y + 14 + i * (h / 8));
      c.stroke();
    }
    c.restore();
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
      if (im) drawContain(c, im, x, y, w, h);
      else { cursive(c, '猫', x + w / 2, y + h / 2, Math.min(w, h) * 0.28, '#3a2a1c', 'center'); }
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
        name: API.HERO, elite: true, boss: false, denBoss: false, etower: false, fly: false,
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
  function paintPopup(c, app) {
    var W = app.lw, H = app.lh, port = H > W * 1.05 || W < 760;
    c.save();
    c.fillStyle = 'rgba(246,239,224,0.55)';
    c.fillRect(0, 0, W, H);
    var m = port ? 12 : 36;
    var x = m, y = port ? 18 : 28, w = W - m * 2, h = H - y - (port ? 16 : 24);
    paper(c, x, y, w, h);
    latin(c, API.NAME, x + (port ? 24 : 36), y + (port ? 36 : 48), port ? 40 : 58, '#7d1c14', 'left');
    cursive(c, API.SUB, x + (port ? 24 : 40), y + (port ? 68 : 86), port ? 22 : 28, '#3a2a1c', 'left');
    redSeal(c, x + w - (port ? 78 : 92), y + 16, port ? 64 : 72, 48, '关');
    hit(x + w - (port ? 78 : 92), y + 16, port ? 64 : 72, 48, 'dkClose');
    hit(0, 0, W, H, 'dkClose');
    hit(x, y, w, h, 'dkNoop');

    var on = eventOn();
    var top = y + (port ? 96 : 118);
    var gap = 16;
    var colW, colH, lx, rx;
    if (!on) {
      lx = x + 20; colW = w - 40; colH = h - (top - y) - 24; rx = null;
    } else if (port) {
      colW = w - 40; colH = Math.floor((h - (top - y) - 36) / 2);
      lx = x + 20; rx = lx;
    } else {
      colW = Math.floor((w - 52) / 2); colH = h - (top - y) - 28;
      lx = x + 18; rx = lx + colW + gap;
    }
    slip(c, app, lx, top, colW, colH, 'gacha');
    if (on) slip(c, app, port ? rx : rx, port ? top + colH + 12 : top, colW, colH, 'cato');
    c.restore();
    boxes.popup = { x: x, y: y, w: w, h: h };
  }
  function slip(c, app, x, y, w, h, kind) {
    rr(c, x, y, w, h, 6);
    c.fillStyle = 'rgba(255,252,244,0.72)';
    c.fill();
    c.strokeStyle = 'rgba(42,33,24,0.45)';
    c.lineWidth = 1.2;
    c.stroke();
    if (kind === 'gacha') {
      cursive(c, '十连抽卡', x + 18, y + 28, 26, '#7d1c14', 'left');
      kai(c, '每个存档一次。登录后走云端，只抽一次。', x + 18, y + 58, 14, '#5c4a36', 'left', false);
      var claimed = API.gachaClaimed(XY.save.data);
      var bw = Math.min(220, w - 36), bh = 56, bx = x + 18, by = y + h - 78;
      if (claimed) {
        rr(c, bx, by, bw, bh, 8);
        c.fillStyle = '#efe6d2';
        c.fill();
        c.strokeStyle = '#8a7048';
        c.stroke();
        cursive(c, '已领取', bx + bw / 2, by + bh / 2, 28, '#6a5438', 'center');
      } else {
        redSeal(c, bx, by, bw, bh, '去抽卡');
        hit(bx, by, bw, bh, 'dkDraw');
      }
      kai(c, claimed ? '这一档的十连已经抽过。' : '点红印进入原来的翻牌。', x + 18, by - 22, 13, '#6a5438', 'left', false);
    } else {
      cursive(c, API.HERO, x + 18, y + 28, 28, '#24180f', 'left');
      kai(c, API.HANDLE, x + 18, y + 54, 13, '#8d1f18', 'left', false);
      var pw = Math.min(148, w * 0.42), ph = Math.min(h - 36, pw * 1.25);
      portrait(c, 'stage1', x + w - pw - 16, y + 16, pw, ph, true);
      var lines = [
        '取经路休息后约二十秒登场。',
        '先演邪气必杀，再让全场狂暴。',
        '小怪攻速、移速、伤害约 ×1.5，',
        '洞主套用原有狂暴 ×2，约四十五秒。',
        '第一次倒下会化成九尾咆哮。',
        '只有击败「' + API.HERO2 + '」才掉落。',
        '必得一张随机特殊角色卡，',
        '并有机会掉该角色的专属装备。',
        '只在主线关。没打败也不判负。'
      ];
      var i, yy = y + 84;
      for (i = 0; i < lines.length && yy < y + h - 18; i++) {
        kai(c, lines[i], x + 16, yy, 14, '#3a2e22', 'left', false);
        yy += 20;
      }
      kai(c, '变身形象：九尾咆哮。', x + 16, y + h - 16, 12, '#8a7048', 'left', false);
    }
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
        c.beginPath();
        c.arc(p.x, p.y, 11, 0, Math.PI * 2);
        c.fillStyle = 'rgba(166,40,28,0.9)';
        c.fill();
        cursive(c, '狂', p.x, p.y, 14, '#fff6e4', 'center');
        n++;
      }
      var left = Math.max(0, Math.ceil(run.rageLeft));
      paper(c, app.lw / 2 - 92, 8, 184, 36);
      cursive(c, '狂暴 ' + left + ' 秒', app.lw / 2, 26, 20, '#7d1c14', 'center');
    }
    var e2 = G.dkUnit;
    if (e2 && !e2.dead && run.unit && !run.unit.dead && run.introLeft <= 0 && run.formLeft <= 0) {
      var q = w2s(G, app, e2.x, e2.y);
      var ph = run.unit.phase >= 2 ? 250 : 220, pw = Math.round(ph * 0.72);
      portrait(c, run.unit.phase >= 2 ? 'form' : 'stage1', q.x - pw / 2, q.y - ph + 28, pw, ph, true);
      var label = run.unit.phase >= 2 ? API.HERO2 : API.HERO;
      paper(c, q.x - 78, q.y - ph - 6, 156, 36);
      cursive(c, label, q.x, q.y - ph + 6, 18, '#24180f', 'center');
      kai(c, API.HANDLE, q.x, q.y - ph + 22, 11, '#8d1f18', 'center', false);
      var bw = 90, ratio = Math.max(0, Math.min(1, e2.hp / (e2.maxHp || 1)));
      c.fillStyle = 'rgba(255,250,240,0.9)';
      c.fillRect(q.x - bw / 2, q.y + 14, bw, 7);
      c.fillStyle = run.unit.phase >= 2 ? '#a6281c' : '#3a2e22';
      c.fillRect(q.x - bw / 2, q.y + 14, bw * ratio, 7);
      c.strokeStyle = '#2a2118';
      c.strokeRect(q.x - bw / 2, q.y + 14, bw, 7);
    }
    if (run.introLeft > 0) paintIntro(c, app, run);
    if (run.formLeft > 0) paintForm(c, app, run);
    if (G.dkDrops && G.dkDrops.t < 6) {
      paper(c, app.lw / 2 - 180, app.lh * 0.18, 360, 64);
      cursive(c, '掉落', app.lw / 2 - 150, app.lh * 0.18 + 22, 18, '#7d1c14', 'left');
      kai(c, '角色卡 · ' + G.dkDrops.cardName + (G.dkDrops.gearName ? '  ·  ' + G.dkDrops.gearName : ''), app.lw / 2 - 150, app.lh * 0.18 + 44, 14, '#24180f', 'left', false);
    }
  }
  function paintIntro(c, app, run) {
    var W = app.lw, H = app.lh;
    c.save();
    c.fillStyle = 'rgba(246,239,224,0.78)';
    c.fillRect(0, 0, W, H);
    var w = Math.min(520, W - 28), h = Math.min(640, H - 28);
    var x = (W - w) / 2, y = (H - h) / 2;
    paper(c, x, y, w, h);
    latin(c, API.NAME, x + w / 2, y + 46, Math.min(64, w * 0.14), '#7d1c14', 'center');
    cursive(c, API.SUB + ' · ' + API.HERO + ' 登场', x + w / 2, y + 84, 22, '#3a2a1c', 'center');
    var ph = Math.min(360, h - 180), pw = Math.min(240, w - 80);
    portrait(c, 'stage1', x + (w - pw) / 2, y + 108, pw, ph, true);
    kai(c, API.HERO, x + w / 2, y + h - 52, 22, '#24180f', 'center');
    kai(c, API.HANDLE, x + w / 2, y + h - 28, 13, '#8d1f18', 'center', false);
    c.restore();
  }
  function paintForm(c, app, run) {
    var W = app.lw, H = app.lh, port = H > W;
    c.save();
    c.fillStyle = 'rgba(246,239,224,0.8)';
    c.fillRect(0, 0, W, H);
    inkBurst(c, W / 2, H / 2, Math.min(W, H) * 0.45, run.formLeft);
    var maxH = H - (port ? 120 : 90);
    var vh = Math.min(maxH, port ? W * 0.92 * 960 / 720 : H * 0.72);
    var vw = vh * 720 / 960;
    var x = (W - vw) / 2, y = port ? 56 : 36;
    paper(c, x - 12, y - 12, vw + 24, vh + 24);
    var drawn = false;
    if (vid && vid.readyState >= 2 && vid.currentTime > 0.04) {
      try { c.drawImage(vid, x, y, vw, vh); drawn = true; } catch (e) { drawn = false; }
    }
    if (!drawn) {
      var fr = frameAtRun(run);
      if (fr) drawContain(c, fr, x, y, vw, vh);
      else portrait(c, 'form', x, y, vw, vh, true);
    }
    latin(c, API.NAME, W / 2, port ? 28 : 22, port ? 28 : 36, '#7d1c14', 'center');
    cursive(c, API.HERO2, W / 2, y + vh + (port ? 28 : 22), port ? 22 : 26, '#24180f', 'center');
    var bw = 120, bh = 48, bx = W / 2 - bw / 2, by = Math.min(H - 58, y + vh + 48);
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
