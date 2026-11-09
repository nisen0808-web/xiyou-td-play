/* 登录、云存档合并、冲突、服务端十连。真实 Google 跳转不在这里测。
 * 运行：node tests/cloud.test.js
 */
'use strict';
var path = require('path');
var http = require('http');
var fs = require('fs');
var puppeteer;
try { puppeteer = require('puppeteer-core'); }
catch (e) { puppeteer = require('/tmp/node_modules/puppeteer-core'); }

var ROOT = path.resolve(__dirname, '..');
var OUT = process.env.CLOUD_OUT || '/opt/cursor/artifacts/cloud-login';
var CHROME = process.env.CHROME || '/usr/bin/google-chrome';

function mime(p) {
  if (p.endsWith('.html')) return 'text/html; charset=utf-8';
  if (p.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (p.endsWith('.webp')) return 'image/webp';
  if (p.endsWith('.png')) return 'image/png';
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
        if (err) { res.writeHead(404); res.end('missing'); return; }
        res.writeHead(200, { 'Content-Type': mime(fp), 'Cache-Control': 'no-store' });
        res.end(buf);
      });
    });
    srv.listen(0, '127.0.0.1', function () { resolve(srv); });
  });
}
function fail(msg) { throw new Error(msg); }
function frames(page, n) {
  return page.evaluate(function (n) {
    return new Promise(function (ok) {
      var i = 0;
      function step() { if (++i >= n) ok(); else requestAnimationFrame(step); }
      requestAnimationFrame(step);
    });
  }, n || 3);
}
function staticChecks() {
  var privacy = fs.readFileSync(path.join(ROOT, 'privacy.html'), 'utf8');
  ['邮箱', '名字', '头像', '不出售', '删除', '登录'].forEach(function (s) {
    if (privacy.indexOf(s) < 0) fail('privacy missing ' + s);
  });
  if (privacy.indexOf('service_role') >= 0) fail('privacy has a secret name');
  var files = ['index-split.html', 'index.html', 'xiyou-survivors.html'];
  files.forEach(function (name) {
    var t = fs.readFileSync(path.join(ROOT, name), 'utf8');
    if (t.indexOf('service_role') >= 0) fail(name + ' has service_role');
    if (t.indexOf('sb_publishable_oUR3b8V6A69bU1JrmfEAzA_vgXQXMKB') < 0) fail(name + ' missing publishable key');
    if (t.indexOf("rpc('draw_first_ten')") < 0 && t.indexOf('draw_first_ten') < 0) fail(name + ' missing draw_first_ten');
    if (t.indexOf('用 Google 登录') < 0) fail(name + ' missing login label');
    if (t.indexOf("XY.VERSION = '0.8.7'") < 0) fail(name + ' version moved');
  });
  var a = fs.readFileSync(path.join(ROOT, 'index.html'));
  var b = fs.readFileSync(path.join(ROOT, 'xiyou-survivors.html'));
  if (!a.equals(b)) fail('index and xiyou-survivors diverged');
  console.log('static checks ok');
}
function serverPulls() {
  return ['phyrex', 'sisi', 'laosiji', 'kuanggong', 'haiteng', 'yuanzhang', 'heyuxi', 'diaoyulao', 'martin', 'phyrex'];
}

(async function () {
  staticChecks();
  fs.mkdirSync(OUT, { recursive: true });
  var srv = await startServer();
  var port = srv.address().port;
  var browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--font-render-hinting=none']
  });
  var page = await browser.newPage();
  var errors = [];
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('console', function (msg) { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:' + port + '/index-split.html?intro=0', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(function () { return window.XY && window.XY.account && window.XY.gacha10 && window.XY.save && window.XY.save.data && window.__xy && window.__xy.app; }, { timeout: 30000 });
  await page.evaluate(function () { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(function () { return window.XY && window.XY.account && window.XY.gacha10 && window.XY.save && window.XY.save.data; }, { timeout: 30000 });

  var boot = await page.evaluate(function () {
    var out = { ok: true, notes: [] };
    function check(cond, msg) { if (!cond) { out.ok = false; out.notes.push(msg); } }
    check(XY.VERSION === '0.8.7', 'version ' + XY.VERSION);
    check(XY.account && !XY.account.signedIn(), 'starts logged out');
    check(XY.TUT_STEPS && XY.TUT_STEPS.length === 20 && XY.TUT_STEPS[0].title === '欢迎取经！', 'tutorial');
    ['points', 'treat', 'guest', 'pick'].forEach(function (k) { check(XY.auto && XY.auto.DEF[k] === false, 'auto ' + k); });
    var pack = XY.gacha10.ensure();
    check(pack.show && pack.rec && pack.rec.pulls.length === 10 && !pack.rec.server, 'logged-out local roll');
    check(XY.account.debug.calls().length === 0, 'no rpc while logged out');
    var again = XY.gacha10.ensure();
    check(again.rec.pulls.join() === pack.rec.pulls.join(), 'local roll stays');
    return out;
  });
  if (!boot.ok) fail(boot.notes.join('\n'));
  console.log('logged-out local roll ok');

  var login = await page.evaluate(function () {
    XY.account.debug.prepare({ user: { name: '行者小墨', email: 'xingzhe@gmail.com', avatar: '' }, remote: null, draw: { results: ['sisi', 'sisi', 'sisi', 'sisi', 'sisi', 'sisi', 'sisi', 'sisi', 'sisi', 'sisi'] } });
    var a = window.__xy.app;
    XY.hubUI.act({ act: 'cloudLogin' }, null, a);
    return XY.account.debug.wait();
  });
  if (!login.signedIn || login.name !== '行者小墨' || login.email !== 'xingzhe@gmail.com') fail('login state ' + JSON.stringify(login));
  if (!login.calls.some(function (c) { return c.op === 'draw'; })) fail('login did not draw ' + JSON.stringify(login.calls));
  var doubled = await page.evaluate(function () {
    var n = XY.save.spCards('sisi');
    XY.gacha10.ensure();
    return { n: n, n2: XY.save.spCards('sisi'), pulls: XY.save.data.gacha10.pulls.join() };
  });
  if (doubled.n !== doubled.n2 || doubled.pulls !== 'sisi,sisi,sisi,sisi,sisi,sisi,sisi,sisi,sisi,sisi') fail('double grant ' + JSON.stringify(doubled));
  console.log('button login + server ten ok', doubled.n);

  var againDraw = await page.evaluate(function () { return XY.account.debug.pullAgain(); });
  if (!againDraw.lastDraw || againDraw.lastDraw.already_drawn !== true) fail('second draw not idempotent ' + JSON.stringify(againDraw.lastDraw));
  var stable = await page.evaluate(function () { return XY.save.spCards('sisi'); });
  if (stable !== doubled.n) fail('second draw changed cards ' + stable + ' vs ' + doubled.n);
  console.log('already_drawn keeps the same ten');

  await page.evaluate(function () { XY.account.signOut(); XY.save.reset(); });
  var uploaded = await page.evaluate(function () {
    XY.save.data.stats.runs = 3;
    XY.save.data.lingshi = 40;
    XY.save.flush();
    return XY.account.debug.install({
      user: { name: '行者小墨', email: 'xingzhe@gmail.com' },
      remote: null,
      draw: { results: ['martin', 'martin', 'martin', 'martin', 'martin', 'martin', 'martin', 'martin', 'martin', 'martin'] }
    });
  });
  var save0 = uploaded.calls.filter(function (c) { return c.op === 'save'; })[0];
  if (!save0 || save0.expected !== 0 || save0.runs !== 3) fail('empty cloud upload ' + JSON.stringify(uploaded.calls));
  if (uploaded.choice) fail('empty cloud asked to choose');
  console.log('empty cloud uploads local');

  await page.evaluate(function () { XY.account.signOut(); XY.save.reset(); });
  var adopted = await page.evaluate(function () {
    var remote = JSON.parse(JSON.stringify(XY.save.data));
    remote.stats.runs = 6;
    remote.stats.wins = 2;
    remote.lingshi = 11;
    remote.updatedAt = Date.now();
    return XY.account.debug.install({
      user: { name: '行者小墨', email: 'xingzhe@gmail.com' },
      remote: { version: 2, data: remote },
      draw: { results: ['martin', 'martin', 'martin', 'martin', 'martin', 'martin', 'martin', 'martin', 'martin', 'phyrex'] }
    }).then(function (st) {
      return { st: st, runs: XY.save.data.stats.runs, lingshi: XY.save.data.lingshi, saves: st.calls.filter(function (c) { return c.op === 'save'; }).length };
    });
  });
  if (adopted.st.choice) fail('empty local showed a choice');
  if (adopted.runs !== 6 || adopted.lingshi !== 11) fail('did not adopt cloud ' + JSON.stringify(adopted));
  if (adopted.saves !== 0) fail('adopt uploaded over cloud ' + adopted.saves);
  console.log('empty local adopts cloud');

  await page.evaluate(function () { XY.account.signOut(); XY.save.reset(); });
  var merge = await page.evaluate(function () {
    var remote = JSON.parse(JSON.stringify(XY.save.data));
    remote.stats.runs = 9;
    remote.stats.wins = 4;
    remote.lingshi = 80;
    remote.updatedAt = Date.now() - 86400000;
    XY.save.data.stats.runs = 2;
    XY.save.data.stats.wins = 1;
    XY.save.data.lingshi = 5;
    XY.save.data.updatedAt = Date.now();
    XY.save.flush();
    return XY.account.debug.install({
      user: { name: '行者小墨', email: 'xingzhe@gmail.com' },
      remote: { version: 4, data: remote },
      draw: { results: ['heyuxi', 'heyuxi', 'heyuxi', 'heyuxi', 'heyuxi', 'heyuxi', 'heyuxi', 'heyuxi', 'heyuxi', 'heyuxi'] }
    }).then(function (st) {
      return { st: st, runs: XY.save.data.stats.runs, lingshi: XY.save.data.lingshi };
    });
  });
  if (merge.st.choice !== 'merge') fail('merge dialog missing ' + JSON.stringify(merge.st));
  if (merge.runs !== 2 || merge.lingshi !== 5) fail('dialog overwrote local ' + JSON.stringify(merge));
  if (merge.st.calls.some(function (c) { return c.op === 'save' || c.op === 'draw'; })) fail('dialog already wrote ' + JSON.stringify(merge.st.calls));
  console.log('both sides wait for a choice');

  var conflict = await page.evaluate(function () {
    var data = JSON.parse(JSON.stringify(XY.save.data));
    data.stats.runs = 9;
    data.lingshi = 123;
    data.updatedAt = Date.now();
    XY.account.debug.setRemote({ version: 7, data: data });
    return XY.account.choose('local').then(function (st) {
      return { st: st, runs: XY.save.data.stats.runs, lingshi: XY.save.data.lingshi };
    });
  });
  if (conflict.st.choice !== 'conflict') fail('conflict dialog missing ' + JSON.stringify(conflict.st));
  if (conflict.runs !== 2 || conflict.lingshi !== 5) fail('conflict overwrote local ' + JSON.stringify(conflict));
  if (conflict.st.remoteLingshi !== 123 || conflict.st.remoteVersion !== 7) fail('conflict wrote the server ' + JSON.stringify(conflict.st));
  console.log('conflict keeps the server copy');

  var tookCloud = await page.evaluate(function () {
    return XY.account.choose('cloud').then(function () {
      return { runs: XY.save.data.stats.runs, lingshi: XY.save.data.lingshi };
    });
  });
  if (tookCloud.runs !== 9 || tookCloud.lingshi !== 123) fail('choose cloud ' + JSON.stringify(tookCloud));
  console.log('player can take the cloud save');

  await page.evaluate(function () { XY.account.signOut(); XY.save.reset(); });
  var replaced = await page.evaluate(function () {
    var rolls = 0, orig = XY.gacha10.roll;
    XY.gacha10.roll = function () { rolls++; return orig.apply(XY.gacha10, arguments); };
    var local = XY.gacha10.ensure();
    var before = rolls;
    var server = ['phyrex', 'sisi', 'laosiji', 'kuanggong', 'haiteng', 'yuanzhang', 'heyuxi', 'diaoyulao', 'martin', 'sisi'];
    if (local.rec.pulls.join() === server.join()) server[9] = 'phyrex';
    var remote = JSON.parse(JSON.stringify(XY.save.data));
    return XY.account.debug.install({
      user: { name: '行者小墨', email: 'xingzhe@gmail.com' },
      remote: { version: 3, data: remote },
      draw: { results: server }
    }).then(function (st) {
      var rows = XY.gacha10.plan(server, {}), exp = {}, i;
      rows.forEach(function (r) { exp[r.id] = r.cards; });
      var got = {};
      XY.SPECIALS.forEach(function (d) { got[d.id] = XY.save.spCards(d.id); });
      return { rolls: rolls - before, pulls: XY.save.data.gacha10.pulls.join(), server: server.join(), got: got, exp: exp, choice: st.choice, drawOps: st.calls.filter(function (c) { return c.op === 'draw'; }).length };
    });
  });
  if (replaced.rolls !== 0) fail('logged-in path rolled locally');
  if (replaced.choice) fail('same progress opened a dialog');
  if (replaced.pulls !== replaced.server) fail('pulls not from server ' + replaced.pulls);
  if (replaced.drawOps < 1) fail('no draw rpc');
  Object.keys(replaced.exp).concat(Object.keys(replaced.got)).forEach(function (id) {
    if ((replaced.got[id] || 0) !== (replaced.exp[id] || 0)) fail('cards ' + id + ' got ' + replaced.got[id] + ' expected ' + replaced.exp[id]);
  });
  console.log('server ten replaces a local roll');

  await page.evaluate(function () { XY.account.signOut(); });
  var offline = await page.evaluate(function () {
    var runs = XY.save.data.stats.runs;
    return XY.account.debug.install({
      user: { name: '行者小墨', email: 'xingzhe@gmail.com' },
      remote: null,
      failSelect: true,
      draw: { results: ['phyrex', 'sisi', 'laosiji', 'kuanggong', 'haiteng', 'yuanzhang', 'heyuxi', 'diaoyulao', 'martin', 'phyrex'] }
    }).then(function (st) {
      var pack = XY.gacha10.ensure();
      return { st: st, runs: XY.save.data.stats.runs, show: pack.show, serverFlag: !!(pack.rec && pack.rec.server), signed: st.signedIn };
    });
  });
  if (!offline.signed || offline.st.choice) fail('offline behavior ' + JSON.stringify(offline));
  if (offline.st.calls.some(function (c) { return c.op === 'draw' || c.op === 'save'; })) fail('offline still called rpc ' + JSON.stringify(offline.st.calls));
  console.log('offline keeps the local save and does not roll');

  function hidePull() {
    var ids = XY.SPECIALS.map(function (d) { return d.id; }), pulls = [], i;
    for (i = 0; i < 10; i++) pulls.push(ids[i % ids.length]);
    XY.save.data.gacha10 = { seed: 'shot', pulls: pulls, rows: [], granted: true, acked: true, at: 1, server: true };
    XY.save.flush();
    return pulls;
  }
  await page.evaluate(function () { XY.account.signOut(); XY.save.reset(); });
  await page.evaluate(hidePull);
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.evaluate(function () { window.__xy.app.menuMsg = null; window.__xy.app.screen = 'levels'; });
  await frames(page, 4);
  var entryHit = await page.evaluate(function () {
    var z = window.__xy.app.zoom || 1, hits = (XY.ui.hits || []).filter(function (h) { return h.act === 'cloudLogin'; });
    return { n: hits.length, h: hits.length ? hits[0].h * z : 0, fails: document.querySelectorAll('[id^=xyFail]').length };
  });
  if (!entryHit.n || entryHit.h < 43 || entryHit.fails) {
    var why = await page.evaluate(function () {
      return Array.prototype.map.call(document.querySelectorAll('[id^=xyFail]'), function (n) { return n.textContent; }).join(' || ');
    });
    console.log('HITS', JSON.stringify(entryHit));
    console.log('FAILBAR', why);
    console.log('ERRORS', errors.join('\n'));
    fail('login hit ' + JSON.stringify(entryHit));
  }
  await page.screenshot({ path: path.join(OUT, 'login-entry.png') });
  await page.evaluate(function () { window.__xy.app.screen = 'hub'; });
  await frames(page, 3);
  var hubHit = await page.evaluate(function () {
    return (XY.ui.hits || []).some(function (h) { return h.act === 'cloudLogin'; });
  });
  if (!hubHit) fail('settings hub has no login control');
  await page.screenshot({ path: path.join(OUT, 'settings-hub.png') });
  await page.evaluate(function () { window.__xy.app.screen = 'levels'; });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await frames(page, 3);
  var mobileHit = await page.evaluate(function () {
    var z = window.__xy.app.zoom || 1, hits = (XY.ui.hits || []).filter(function (h) { return h.act === 'cloudLogin'; });
    return { n: hits.length, h: hits.length ? hits[0].h * z : 0, w: hits.length ? hits[0].w * z : 0 };
  });
  if (!mobileHit.n || mobileHit.h < 43) fail('mobile login hit ' + JSON.stringify(mobileHit));
  await page.screenshot({ path: path.join(OUT, 'login-entry-mobile.png') });
  await page.evaluate(function () { window.__xy.app.screen = 'hub'; });
  await frames(page, 3);
  await page.screenshot({ path: path.join(OUT, 'settings-hub-mobile.png') });
  console.log('login entry shots');

  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  var avatar = await page.evaluate(function () {
    var cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
    var g = cv.getContext('2d');
    g.fillStyle = '#8d3b2c'; g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fffaf0'; g.font = 'bold 32px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('行', 32, 34);
    return cv.toDataURL('image/png');
  });
  var signedShot = await page.evaluate(function (avatar) {
    var pulls = XY.save.data.gacha10.pulls.slice();
    return XY.account.debug.install({
      user: { name: '行者小墨', email: 'xingzhe@gmail.com', avatar: avatar },
      remote: null,
      draw: { results: pulls }
    }).then(function (st) { window.__xy.app.screen = 'levels'; return st; });
  }, avatar);
  if (!signedShot.signedIn || signedShot.choice) fail('signed shot state ' + JSON.stringify(signedShot));
  await frames(page, 4);
  var outHit = await page.evaluate(function () {
    var z = window.__xy.app.zoom || 1, hits = (XY.ui.hits || []).filter(function (h) { return h.act === 'cloudLogout'; });
    return { n: hits.length, h: hits.length ? hits[0].h * z : 0 };
  });
  if (!outHit.n || outHit.h < 43) fail('logout hit ' + JSON.stringify(outHit));
  await page.screenshot({ path: path.join(OUT, 'logged-in.png') });
  console.log('logged-in shot');

  var mergeShot = await page.evaluate(function () {
    var remote = JSON.parse(JSON.stringify(XY.save.data));
    remote.stats.runs = 12;
    remote.stats.wins = 5;
    remote.lingshi = 260;
    remote.updatedAt = Date.now() - 3600000;
    XY.save.data.stats.runs = 4;
    XY.save.data.stats.wins = 1;
    XY.save.data.lingshi = 36;
    XY.save.data.updatedAt = Date.now();
    XY.save.flush();
    return XY.account.debug.install({
      user: { name: '行者小墨', email: 'xingzhe@gmail.com', avatar: XY.account.debug.state ? '' : '' },
      remote: { version: 5, data: remote },
      draw: { results: XY.save.data.gacha10.pulls.slice() }
    });
  });
  if (mergeShot.choice !== 'merge') fail('merge shot ' + JSON.stringify(mergeShot));
  await page.evaluate(function () { window.__xy.app.screen = 'levels'; });
  await frames(page, 4);
  var pickHit = await page.evaluate(function () {
    var z = window.__xy.app.zoom || 1;
    return (XY.ui.hits || []).filter(function (h) { return h.act === 'cloudPick'; }).map(function (h) { return { which: h.which, h: h.h * z }; });
  });
  if (pickHit.length < 2 || pickHit.some(function (h) { return h.h < 43; })) fail('pick hits ' + JSON.stringify(pickHit));
  await page.screenshot({ path: path.join(OUT, 'merge-dialog.png') });
  console.log('merge shot');

  var bar = await page.evaluate(function () { return document.querySelectorAll('[id^=xyFail]').length; });
  if (bar) fail('script error bar');
  var realErr = errors.filter(function (e) { return e.indexOf('favicon') < 0 && e.indexOf('Failed to load resource') < 0; });
  if (realErr.length) fail(realErr.join('\n'));
  await browser.close();
  srv.close();
  console.log('cloud tests ok');
})().catch(function (e) { console.error(e); process.exit(1); });
