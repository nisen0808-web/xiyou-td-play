/* 无头浏览器：活动弹窗、按钮、登场、狂暴、变身、掉落、专属装备。 */
'use strict';
var path = require('path');
var http = require('http');
var fs = require('fs');
var puppeteer = require('/tmp/node_modules/puppeteer-core');

var ROOT = path.resolve(__dirname, '..');
var OUT = process.env.DK_OUT || '/opt/cursor/artifacts/devil-kitty';
var CHROME = process.env.CHROME || '/usr/bin/google-chrome';

function mime(p) {
  if (p.endsWith('.html')) return 'text/html; charset=utf-8';
  if (p.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (p.endsWith('.json')) return 'application/json';
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.webp')) return 'image/webp';
  if (p.endsWith('.mp4')) return 'video/mp4';
  if (p.endsWith('.ttf')) return 'font/ttf';
  return 'application/octet-stream';
}
function startServer() {
  return new Promise(function (resolve) {
    var srv = http.createServer(function (req, res) {
      var u = decodeURIComponent((req.url || '/').split('?')[0]);
      if (u === '/') u = '/index-split.html';
      var fp = path.normalize(path.join(ROOT, u));
      if (fp.indexOf(ROOT) !== 0) { res.writeHead(403); res.end('no'); return; }
      fs.readFile(fp, function (err, buf) {
        if (err) { res.writeHead(404); res.end('missing ' + u); return; }
        res.writeHead(200, { 'Content-Type': mime(fp), 'Cache-Control': 'no-store' });
        res.end(buf);
      });
    });
    srv.listen(0, '127.0.0.1', function () { resolve(srv); });
  });
}
function fail(msg) { throw new Error(msg); }
async function frames(page, n) {
  await page.evaluate(function (n) {
    return new Promise(function (ok) {
      var i = 0;
      function step() { if (++i >= n) ok(); else requestAnimationFrame(step); }
      requestAnimationFrame(step);
    });
  }, n || 3);
}
async function shot(page, name) {
  var file = path.join(OUT, name + '.png');
  await page.screenshot({ path: file });
  console.log('shot', file);
  return file;
}

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  var srv = await startServer();
  var port = srv.address().port;
  var browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required', '--font-render-hinting=none']
  });
  var page = await browser.newPage();
  var errors = [];
  var missing = [];
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('console', function (msg) { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
  page.on('response', function (res) { if (res.status() === 404) missing.push(res.url()); });
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:' + port + '/index-split.html?intro=0&test=1', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(function () { return window.XY && window.XY.devilKitty && window.XY.gacha10 && window.__xy; }, { timeout: 30000 });
  await page.evaluate(function () {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(function () { return window.XY && window.XY.devilKitty && window.XY.save && window.XY.save.data; }, { timeout: 30000 });
  await page.evaluate(function () {
    XY.save.data.tutorial.done = true;
    XY.save.data.tutorial.grow = true;
    XY.save.data.devilKitty = { id: 'devil_kitty', name: 'Devil Kitty', on: true };
    XY.save.flush();
    sessionStorage.removeItem('xy_dk_auto');
  });
  await page.evaluate(function () {
    return document.fonts.ready.then(function () {
      return Promise.all(['stage1.webp', 'form.webp', 'stage1-cut.webp', 'form-cut.webp'].map(function (f) {
        return new Promise(function (ok) {
          var im = new Image();
          im.onload = function () { ok(f); };
          im.onerror = function () { ok('fail ' + f); };
          im.src = 'assets/devil-kitty/' + f;
        });
      }));
    });
  });
  await frames(page, 8);

  async function setSize(w, h) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await frames(page, 4);
  }
  await page.evaluate(function () {
    XY.save.data.tutorial.done = true;
    XY.save.data.tutorial.grow = true;
    XY.save.data.devilKitty = { id: 'devil_kitty', name: 'Devil Kitty', on: true };
    XY.save.flush();
    sessionStorage.removeItem('xy_dk_auto');
  });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(function () { return window.XY && window.XY.devilKitty && window.XY.save && window.XY.save.data; }, { timeout: 30000 });
  var fontOk = await page.evaluate(function () {
    return document.fonts.load('64px DKBrush').then(function () {
      return document.fonts.ready.then(function () {
        return Promise.all(['stage1.webp', 'form.webp', 'stage1-cut.webp', 'form-cut.webp'].map(function (f) {
          return new Promise(function (ok) {
            var im = new Image();
            im.onload = function () { ok(1); };
            im.onerror = function () { ok(0); };
            im.src = 'assets/devil-kitty/' + f;
          });
        })).then(function () {
          return { check: document.fonts.check('64px DKBrush') };
        });
      });
    });
  });
  console.log('brush font', JSON.stringify(fontOk));
  if (!fontOk.check) fail('calligraphy font DKBrush did not load');

  async function prepPopup(screen) {
    await page.evaluate(function (screen) {
      var app = window.__xy.app;
      app.dkGear = false;
      app.screen = screen;
      if (screen === 'levels') app.dkOpen = false;
    }, screen);
    await frames(page, 6);
  }

  await setSize(1920, 1080);
  await frames(page, 8);
  await prepPopup('start');
  var home = await page.evaluate(function () {
    return { open: !!window.__xy.app.dkOpen, screen: window.__xy.app.screen, on: XY.devilKitty.eventOn() };
  });
  if (!home.open) fail('home popup did not auto open ' + JSON.stringify(home));
  await shot(page, 'home-popup-desktop');

  await setSize(390, 844);
  await frames(page, 4);
  await shot(page, 'home-popup-mobile');

  await page.evaluate(function () { window.__xy.app.dkOpen = false; });
  await frames(page, 3);
  await shot(page, 'home-button-mobile');
  var homeBtn = await page.evaluate(function () {
    var b = XY.devilKitty.boxes().event;
    var hits = (XY.ui.hits || []).filter(function (h) { return h.act === 'menuLevels' || h.act === 'dkOpen'; });
    return { b: b, hits: hits.map(function (h) { return { act: h.act, x: h.x, y: h.y, w: h.w, h: h.h }; }) };
  });
  if (!homeBtn.b || homeBtn.b.w < 44 || homeBtn.b.h < 44) fail('home button small ' + JSON.stringify(homeBtn));

  await setSize(1920, 1080);
  await page.evaluate(function () { window.__xy.app.dkOpen = false; window.__xy.app.screen = 'start'; });
  await frames(page, 3);
  await shot(page, 'home-button-desktop');

  await prepPopup('levels');
  await setSize(1920, 1080);
  await frames(page, 4);
  var lv = await page.evaluate(function () { return { open: !!window.__xy.app.dkOpen, screen: window.__xy.app.screen }; });
  if (!lv.open) fail('levels popup did not auto open ' + JSON.stringify(lv));
  await shot(page, 'levels-popup-desktop');
  await setSize(390, 844);
  await frames(page, 4);
  await shot(page, 'levels-popup-mobile');
  await page.evaluate(function () { window.__xy.app.dkOpen = false; });
  await frames(page, 3);
  await shot(page, 'levels-button-mobile');
  await setSize(1920, 1080);
  await page.evaluate(function () { window.__xy.app.dkOpen = false; window.__xy.app.screen = 'levels'; });
  await frames(page, 3);
  await shot(page, 'levels-button-desktop');
  var overlap = await page.evaluate(function () {
    function box(h) { return { x: h.x, y: h.y, w: h.w, h: h.h, r: h.x + h.w, b: h.y + h.h }; }
    function hit(a, b) { return a.x < b.r && a.r > b.x && a.y < b.b && a.b > b.y; }
    var ours = (XY.ui.hits || []).filter(function (h) { return h.act === 'dkOpen' || h.act === 'dkGear'; }).map(box);
    var main = (XY.ui.hits || []).filter(function (h) { return h.act === 'levelGo' || h.act === 'menuLevels' || h.act === 'back' || h.act === 'menuHub'; }).map(box);
    var bad = [];
    ours.forEach(function (a) {
      if (a.w < 44 || a.h < 44) bad.push('small');
      main.forEach(function (b) { if (hit(a, b)) bad.push(a.x + ',' + a.y + ' vs ' + b.x + ',' + b.y); });
    });
    return { bad: bad, ours: ours, main: main.length };
  });
  if (overlap.bad.length) fail('button overlap or size ' + JSON.stringify(overlap));

  await page.evaluate(function () {
    XY.gacha10._showFlip = true;
    XY.gacha10.ensure();
    XY.gacha10.ack();
    window.__xy.app.dkOpen = true;
    window.__xy.app.screen = 'levels';
  });
  await frames(page, 3);
  await shot(page, 'levels-popup-claimed-desktop');
  await setSize(390, 844);
  await page.evaluate(function () { window.__xy.app.dkOpen = true; window.__xy.app.screen = 'levels'; window.__xy.app.dkGear = false; });
  await frames(page, 3);
  await shot(page, 'levels-popup-claimed-mobile');

  await page.evaluate(function () {
    var app = window.__xy.app;
    app.dkOpen = false;
    app.dkGear = false;
    app.screen = 'levels';
    XY.save.data.devilKitty = { id: 'devil_kitty', on: false };
    XY.save.flush();
  });
  await frames(page, 2);
  await page.evaluate(function () { window.__xy.app.dkOpen = true; });
  await frames(page, 2);
  var only = await page.evaluate(function () { return XY.devilKitty.eventOn(); });
  if (only) fail('event still on');
  await shot(page, 'popup-gacha-only-mobile');
  await page.evaluate(function () {
    XY.save.data.devilKitty = { id: 'devil_kitty', on: true };
    XY.save.flush();
    window.__xy.app.dkOpen = false;
  });

  await setSize(1920, 1080);
  await page.evaluate(function () {
    var app = window.__xy.app;
    app.dkOpen = false;
    app.dkGear = true;
    app.dkHero = 'phyrex';
    app.screen = 'levels';
    var g = XY_DEVIL_KITTY.readGear(XY.save.data);
    XY_DEVIL_KITTY.grantGear(g, 'phyrex_w', 1);
    XY_DEVIL_KITTY.grantGear(g, 'sisi_i', 1);
    XY_DEVIL_KITTY.equipGear(g, 'phyrex', 'phyrex_w');
    XY_DEVIL_KITTY.writeGear(XY.save.data, g);
  });
  await frames(page, 3);
  var leak = await page.evaluate(function () {
    var hidden = ['qinba', 'traders18', 'cato'];
    var ids = (XY.SPECIALS_ALL || []).map(function (d) { return d.id; }).filter(function (id) {
      return XY_DEVIL_KITTY.heroRevealed(id, !!(XY.isHidden && XY.isHidden(id)), !!(XY.isHidden && XY.isHidden(id) && XY.save.spRealOwned(id)));
    });
    var pack = (XY.SPECIALS || []).map(function (d) { return d.id; });
    var resources = performance.getEntriesByType('resource').map(function (e) { return e.name; });
    return {
      hiddenInGear: ids.filter(function (id) { return hidden.indexOf(id) >= 0; }),
      hiddenInPool: pack.filter(function (id) { return hidden.indexOf(id) >= 0; }),
      art: resources.filter(function (u) { return /heroes\/(qinba|traders18)|gear\/(qinba_|traders18_|cato_)/.test(u); })
    };
  });
  console.log('hidden-locked', JSON.stringify(leak));
  if (leak.hiddenInGear.length || leak.hiddenInPool.length || leak.art.length) fail('hidden leak ' + JSON.stringify(leak));
  await shot(page, 'gear-locked-desktop');
  await setSize(390, 844);
  await page.evaluate(function () { window.__xy.app.dkGear = true; window.__xy.app.screen = 'levels'; window.__xy.app.dkOpen = false; });
  await frames(page, 2);
  await shot(page, 'gear-locked-mobile');
  await setSize(1920, 1080);
  await page.evaluate(function () {
    XY.save.addSpCard('qinba', 2);
    window.__xy.app.dkHero = 'qinba';
    window.__xy.app.dkGear = true;
    window.__xy.app.screen = 'levels';
  });
  await frames(page, 3);
  var opened = await page.evaluate(function () {
    return XY.save.spRealOwned('qinba') && XY_DEVIL_KITTY.heroRevealed('qinba', true, true);
  });
  if (!opened) fail('qinba still hidden after cards');
  await shot(page, 'gear-unlocked-desktop');
  await page.evaluate(function () {
    var files = ['gear/phyrex_w.webp', 'gear/yuanzhang_i.webp'];
    return Promise.all(files.map(function (f) {
      return new Promise(function (res) {
        var im = new Image();
        im.onload = function () { res(1); };
        im.onerror = function () { res(0); };
        im.src = 'assets/devil-kitty/' + f;
      });
    }));
  });
  await frames(page, 3);
  await shot(page, 'gear-desktop');
  await setSize(390, 844);
  await page.evaluate(function () { window.__xy.app.dkGear = true; window.__xy.app.screen = 'levels'; window.__xy.app.dkOpen = false; });
  await frames(page, 3);
  await shot(page, 'gear-mobile');

  await setSize(1920, 1080);
  async function both(name) {
    await setSize(1920, 1080);
    await shot(page, name + '-desktop');
    await setSize(390, 844);
    await shot(page, name + '-mobile');
  }
  var battle = await page.evaluate(function () {
    var app = window.__xy.app;
    app.dkGear = false;
    app.dkOpen = false;
    window.__xy.startGame(1);
    var G = window.__xy.G;
    if (G.tut) G.tut = null;
    G.godMode = false;
    G.noSpawn = false;
    XY.debug.toRest(G);
    G.tang.restT = 20;
    XY.step(G, 1 / 60);
    return {
      phase: G.tang.phase,
      rest: G.tang.restT,
      hold: !!G.dkHold,
      intro: G.dkRun && G.dkRun.introLeft,
      spawned: G.dkRun && G.dkRun.spawned
    };
  });
  console.log('battle-intro', JSON.stringify(battle));
  if (!battle.spawned || !battle.hold) fail('intro did not start ' + JSON.stringify(battle));
  await page.evaluate(function () {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = im.onerror = function () { res(1); };
      im.src = 'assets/devil-kitty/intro-scene.webp';
    });
  });
  await frames(page, 6);
  await both('intro');

  await page.evaluate(function () {
    var G = window.__xy.G;
    XY_DEVIL_KITTY.skipIntro(G.dkRun, G.levelId || 1);
    G.dkHold = false;
    var e = G.dkUnit;
    if (!e) {
      /* skipIntro 不创建单位，补一步让 afterStep 看到已经结束的 intro 不会再生；直接造。 */
    }
    if (!G.dkUnit && G.dkRun.unit) {
      var spot0 = XY.devilKitty.roadStand(G);
      G.enemies.push({
        id: 9001, type: 'cato_evil', dk: true, x: spot0.x, y: spot0.y, r: 30,
        hp: G.dkRun.unit.hp, maxHp: G.dkRun.unit.maxHp, speed: 62, dmg: 0, dead: false,
        kx: 0, ky: 0, flash: 0, atkT: 1, slowT: 0, stunT: 0, burnT: 0, def: G.dkRun.unit && {
          name: '猫叔', elite: false, color: '#241c18', dark: '#8d1f18', r: 30, elem: 'water'
        }
      });
      G.dkUnit = G.enemies[G.enemies.length - 1];
      G.dkUnit.def = { name: '猫叔', elite: false, boss: false, denBoss: false, color: '#241c18', dark: '#8d1f18', r: 30, elem: 'water', xp: 10, coin: 0, coinP: 0, pdef: 0, mdef: 0, knockRes: 0.4, dmg: 0, hp: 900 };
    }
    var u = G.dkUnit;
    var stand = XY.devilKitty.roadStand(G);
    u.x = stand.x; u.y = stand.y;
    XY.makeEnemy(G, 'small', u.x + 90, u.y + 40, 0);
    XY.makeEnemy(G, 'small', u.x + 40, u.y - 70, 0);
    XY.makeEnemy(G, 'tank', u.x - 80, u.y + 50, 0);
    if (G.dens && G.dens[0] && G.dens[0].boss) { G.dens[0].boss.x = u.x + 320; G.dens[0].boss.y = u.y - 180; }
    G.dkCamLock = true;
    for (var i = 0; i < 8; i++) XY.step(G, 1 / 60);
    return { rage: G.dkRun.rageOn, left: G.dkRun.rageLeft, mobs: G.enemies.filter(function (e) { return e._dkRage; }).length, boss: (G.dens[0] && G.dens[0].boss && G.dens[0].boss.enraged) || false, name: u.def.name };
  });
  await frames(page, 4);
  await both('rage');

  var formed = await page.evaluate(function () {
    var G = window.__xy.G;
    G.dkUnit.hp = 1;
    XY.core.hurtEnemy(G, G.dkUnit, 1e9, {});
    return { hold: !!G.dkHold, form: G.dkRun.formLeft, phase: G.dkRun.unit.phase, dead: !!G.dkUnit.dead, drop: G.dkDrops || null };
  });
  console.log('formed', JSON.stringify(formed));
  if (!formed.hold || formed.drop) fail('phase1 should transform without drop ' + JSON.stringify(formed));
  var marks = [[8.6, 'a'], [6.6, 'b'], [4.4, 'c'], [2.4, 'd'], [0.7, 'e']];
  async function pinForm(left) {
    await page.evaluate(function (left) {
      var G = window.__xy.G;
      G.dkRun.formDur = 9;
      G.dkRun.formLeft = left;
      G.dkHold = true;
    }, left);
    await frames(page, 2);
  }
  var mi;
  for (mi = 0; mi < marks.length; mi++) {
    await setSize(1920, 1080);
    await pinForm(marks[mi][0]);
    await shot(page, 'form-' + marks[mi][1] + '-desktop');
    await setSize(390, 844);
    await pinForm(marks[mi][0]);
    await shot(page, 'form-' + marks[mi][1] + '-mobile');
  }
  await setSize(1920, 1080);
  await pinForm(3.2);
  await shot(page, 'form-desktop');
  await setSize(390, 844);
  await pinForm(3.2);
  await shot(page, 'form-mobile');

  var phase2 = await page.evaluate(function () {
    var G = window.__xy.G;
    G.dkSkip = true;
    G.dkCamLock = true;
    XY.step(G, 1 / 60);
    return { phase: G.dkRun.unit.phase, name: G.dkUnit.def.name, hp: G.dkUnit.hp, max: G.dkUnit.maxHp, hold: !!G.dkHold, rage: G.dkRun.rageLeft };
  });
  console.log('phase2', JSON.stringify(phase2));
  if (phase2.phase !== 2 || phase2.name !== '猫叔 · 魔化') fail('phase2 name ' + JSON.stringify(phase2));
  await frames(page, 4);
  await both('phase2');

  var dead = await page.evaluate(function () {
    var G = window.__xy.G;
    var before = JSON.parse(JSON.stringify((XY.save.data.spT || XY.save.data.sp).cards));
    XY.core.hurtEnemy(G, G.dkUnit, 1e9, {});
    var key = XY.TEST_BUILD ? 'spT' : 'sp';
    return { dead: !!G.dkUnit.dead, drop: G.dkDrops, cards: XY.save.data[key].cards, before: before, phase: G.dkRun.unit.phase };
  });
  console.log('dead', JSON.stringify(dead));
  if (!dead.dead || !dead.drop || !dead.drop.card) fail('no drop ' + JSON.stringify(dead));
  async function showObtain(ids, index, t) {
    await page.evaluate(function (ids, index, t) {
      var items = ids.map(function (id) { return { kind: 'gear', id: id }; });
      var g0 = XY_DEVIL_KITTY.gearById[ids[index] || ids[0]];
      window.__xy.G.dkDrops = {
        card: 'yuanzhang', cardName: '园长', gear: ids[0], gearName: g0 ? g0.name : '',
        items: items, i: index, t: t, pin: true
      };
      var jobs = [];
      ids.forEach(function (id) {
        jobs.push(new Promise(function (res) {
          var im = new Image();
          im.onload = im.onerror = function () { res(1); };
          im.src = 'assets/devil-kitty/gear/' + id + '.webp';
        }));
        var owner = XY_DEVIL_KITTY.gearById[id] && XY_DEVIL_KITTY.gearById[id].owner;
        if (owner) jobs.push(new Promise(function (res) {
          var im = new Image();
          im.onload = im.onerror = function () { res(1); };
          im.src = 'assets/art/x-avatars/' + owner + '.webp';
        }));
      });
      return Promise.all(jobs);
    }, ids, index, t);
    await frames(page, 4);
  }
  async function obtainBoth(name, ids, index, t) {
    await setSize(1920, 1080);
    await showObtain(ids, index, t);
    await shot(page, name + '-desktop');
    await setSize(390, 844);
    await showObtain(ids, index, t);
    await shot(page, name + '-mobile');
  }
  await obtainBoth('obtain-blade', ['phyrex_w'], 0, 1.8);
  await obtainBoth('obtain-bell', ['yuanzhang_w'], 0, 1.8);
  await obtainBoth('obtain-seq-1', ['phyrex_w', 'yuanzhang_w'], 0, 0.85);
  await obtainBoth('obtain-seq-2', ['phyrex_w', 'yuanzhang_w'], 1, 1.8);
  await setSize(1920, 1080);

  await page.evaluate(function () { window.__xy.app.screen = 'pause'; });
  await frames(page, 3);
  await shot(page, 'pause-toggle-desktop');

  var fps = await page.evaluate(function () {
    return { app: window.__xy.app.fps, dk: XY.devilKitty.fps() };
  });
  console.log('fps', JSON.stringify(fps));

  var realErr = errors.filter(function (e) {
    return e.indexOf('favicon') < 0 && e.indexOf('Failed to load resource') < 0 && e.indexOf('net::ERR') < 0;
  });
  var miss = missing.filter(function (u) { return u.indexOf('favicon') < 0; });
  if (miss.length) console.log('missing', miss.join('\n'));
  if (realErr.length) fail(realErr.join('\n'));
  console.log('browser ok', 'fps', JSON.stringify(fps));
  await browser.close();
  srv.close();
})().catch(function (e) {
  console.error(e);
  process.exit(1);
});
