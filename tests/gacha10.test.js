/* 出发页十连：只弹一次、刷新不重抽、抽到解锁、没抽到仍锁、教程仍从 1/20 开始。
 * 运行：node tests/gacha10.test.js
 * 需要本机 Chrome，以及 puppeteer-core（不下载浏览器）。 */
'use strict';
var path = require('path');
var http = require('http');
var fs = require('fs');
var puppeteer;
try { puppeteer = require('puppeteer-core'); }
catch (e) { puppeteer = require('/tmp/node_modules/puppeteer-core'); }

var ROOT = path.resolve(__dirname, '..');
var OUT = process.env.GACHA_OUT || '/opt/cursor/artifacts/gacha10';
var CHROME = process.env.CHROME || '/usr/bin/google-chrome';
var PORT = 0;

function mime(p) {
  if (p.endsWith('.html')) return 'text/html; charset=utf-8';
  if (p.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (p.endsWith('.webp')) return 'image/webp';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.json')) return 'application/json';
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
    srv.listen(0, '127.0.0.1', function () { PORT = srv.address().port; resolve(srv); });
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
  }, n || 2);
}

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  var srv = await startServer();
  var browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--font-render-hinting=none']
  });
  var page = await browser.newPage();
  var errors = [];
  var missing = [];
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('response', function (res) { if (res.status() === 404) missing.push(res.url()); });
  page.on('console', function (msg) { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:' + PORT + '/index-split.html?intro=0', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(function () { return window.__xy && window.XY && window.XY.gacha10 && window.XY.save && window.XY.save.data && window.XY.TUT_STEPS; }, { timeout: 30000 });
  await page.evaluate(function () { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(function () { return window.__xy && window.XY && window.XY.gacha10 && window.XY.save && window.XY.save.data && window.XY.TUT_STEPS; }, { timeout: 30000 });
  await frames(page, 3);

  var report = await page.evaluate(function () {
    var out = { ok: true, notes: [] };
    function check(cond, msg) { if (!cond) { out.ok = false; out.notes.push(msg); } }
    check(XY.VERSION === '0.8.7', 'version ' + XY.VERSION);
    check(XY.TEST_BUILD === false, 'TEST_BUILD should be off');
    check(XY.C.TEST_DEFAULT === false, 'TEST_DEFAULT');
    ['points', 'treat', 'guest', 'pick'].forEach(function (k) {
      check(XY.auto.DEF[k] === false, 'auto def ' + k);
      check(XY.auto.get(k) === false, 'auto get ' + k);
    });
    check(XY.save.data.tutorial.done === false, 'tutorial.done before play');
    check(XY.TUT_STEPS.length === 20, 'steps ' + XY.TUT_STEPS.length);
    check(XY.TUT_STEPS[0].id === 'welcome' && XY.TUT_STEPS[0].title === '欢迎取经！', 'welcome title');
    XY.SPECIALS.forEach(function (d) { check(!XY.save.spOwned(d.id), 'fresh locked ' + d.id + ' cards=' + XY.save.spCards(d.id)); });
    check(!XY.save.xcharOpen(), 'xchar locked before clear');

    var G = XY.newGame(1);
    check(!!G.tut && G.tut.i === 0, 'tut index ' + (G.tut && G.tut.i));
    check(XY.tutSteps(G)[0].title === '欢迎取经！', 'in-game welcome');
    check(XY.tutSteps(G).length === 20, 'in-game steps');
    check(G.level === 1, 'level ' + G.level);
    check(!G.special, 'no special carried');
    check(XY.save.data.tutorial.done !== true, 'gacha/newGame must not finish tutorial');
    check(XY.guest.pool(G).length >= 1, 'guest pool');

    var a = XY.gacha10.roll(XY.seeded(20261109));
    var b = XY.gacha10.roll(XY.seeded(20261109));
    check(JSON.stringify(a) === JSON.stringify(b) && a.length === 10, 'seeded roll');
    check(a.every(function (id) { return !!XY.SP_BY[id] && !XY.isHidden(id); }), 'roll pool');

    var pack = XY.gacha10.ensure();
    check(pack.show && pack.fresh && pack.rec.pulls.length === 10, 'first show');
    check(pack.rec.granted === true, 'granted immediately');
    var seen = {};
    pack.rec.pulls.forEach(function (id) { seen[id] = 1; });
    XY.SPECIALS.forEach(function (d) {
      var own = XY.save.spOwned(d.id);
      if (seen[d.id]) check(own, 'pulled unlocked ' + d.id + ' cards=' + XY.save.spCards(d.id));
      else check(!own, 'unpulled still locked ' + d.id + ' cards=' + XY.save.spCards(d.id));
    });
    pack.rec.rows.forEach(function (r) {
      if (r.kind === 'unlock') check(r.lv >= 1 && r.cards >= XY.SP_LV_AT[0], 'unlock row ' + r.id);
    });
    var again = XY.gacha10.ensure();
    check(again.show && JSON.stringify(again.rec.pulls) === JSON.stringify(pack.rec.pulls), 'second ensure same pulls');
    var cards = JSON.stringify(XY.save.data.sp.cards);
    XY.gacha10.ensure();
    check(JSON.stringify(XY.save.data.sp.cards) === cards, 'no double grant');
    check(XY.save.data.tutorial.done !== true, 'gacha did not end tutorial');

    // 老存档：已有 Phyrex，第一次进出发页仍给一次，且 Phyrex 的重复卡不加出第二个解锁
    var savedPulls = pack.rec.pulls.slice();
    var savedCards = JSON.parse(cards);
    out.pulls = savedPulls;
    out.cards = savedCards;
    out.key = XY.save.KEY;
    return out;
  });
  if (!report.ok) fail(report.notes.join('\n'));
  console.log('in-page checks ok', JSON.stringify(report.pulls));

  var before = await page.evaluate(function () {
    return { pulls: XY.save.data.gacha10.pulls.slice(), cards: JSON.parse(JSON.stringify(XY.save.data.sp.cards)), acked: !!XY.save.data.gacha10.acked };
  });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(function () { return window.XY && window.XY.gacha10 && window.XY.save && window.XY.save.data && window.XY.save.data.gacha10; }, { timeout: 30000 });
  var after = await page.evaluate(function () {
    var pack = XY.gacha10.ensure();
    var v = XY.gacha10.view({ rt: 1 });
    return {
      pulls: XY.save.data.gacha10.pulls.slice(),
      cards: JSON.parse(JSON.stringify(XY.save.data.sp.cards)),
      show: pack.show,
      fresh: pack.fresh,
      phase: v && v.phase,
      acked: !!XY.save.data.gacha10.acked
    };
  });
  if (JSON.stringify(after.pulls) !== JSON.stringify(before.pulls)) fail('reload rerolled ' + JSON.stringify(after.pulls));
  if (JSON.stringify(after.cards) !== JSON.stringify(before.cards)) fail('reload changed cards');
  if (after.fresh) fail('reload treated the roll as fresh');
  if (after.phase !== 'result') fail('reload should open the result, phase=' + after.phase);
  if (!after.show) fail('unacked reload should still show');
  console.log('reload keeps the same result');

  await page.evaluate(function () { XY.gacha10.ack(); });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(function () { return window.XY && window.XY.save && window.XY.save.data && window.XY.save.data.gacha10; }, { timeout: 30000 });
  var acked = await page.evaluate(function () {
    var pack = XY.gacha10.ensure();
    return { show: pack.show, acked: !!XY.save.data.gacha10.acked, pulls: XY.save.data.gacha10.pulls.join(',') };
  });
  if (acked.show || !acked.acked) fail('acked save showed again ' + JSON.stringify(acked));
  if (acked.pulls !== before.pulls.join(',')) fail('ack reload changed pulls');
  console.log('ack stays closed');

  // 老存档第一次进：已有 Phyrex 两张，十连仍只发生一次，Phyrex 不算新解锁
  var old = await page.evaluate(function () {
    XY.save.reset();
    XY.save.data.sp.cards.phyrex = 2;
    XY.save.data.sp.chosen = 'phyrex';
    XY.save.data.gacha10 = null;
    XY.save.flush();
    var pack = XY.gacha10.ensure();
    var phy = pack.rec.rows.filter(function (r) { return r.id === 'phyrex'; });
    var firstPhy = phy[0];
    return {
      show: pack.show,
      firstKind: firstPhy && firstPhy.kind,
      owned: XY.SPECIALS.map(function (d) { return [d.id, XY.save.spOwned(d.id), XY.save.spCards(d.id)]; }),
      pulls: pack.rec.pulls
    };
  });
  if (!old.show) fail('old save did not get a pull');
  if (old.firstKind === 'unlock') fail('already-owned Phyrex was treated as a new unlock');
  var seenOld = {};
  old.pulls.forEach(function (id) { seenOld[id] = 1; });
  old.owned.forEach(function (row) {
    if (row[0] === 'phyrex') { if (!row[1]) fail('phyrex lost'); return; }
    if (seenOld[row[0]] && !row[1]) fail('old-save pulled still locked ' + row[0]);
    if (!seenOld[row[0]] && row[1]) fail('old-save unpulled unlocked ' + row[0]);
  });
  console.log('old save gets one pull');

  var bar = await page.evaluate(function () { return document.querySelectorAll('[id^=xyFail]').length; });
  if (bar) fail('script error bar on screen');
  var realErr = errors.filter(function (e) { return e.indexOf('Failed to load resource') < 0 && e.indexOf('favicon') < 0; });
  if (realErr.length) fail(realErr.join('\n'));
  console.log('missing', missing.filter(function (u, i, a) { return a.indexOf(u) === i; }).join('\n'));

  async function shot(name, width, height, phase, freeze) {
    await page.setViewport({ width: width, height: height, deviceScaleFactor: 1 });
    await page.evaluate(function (phase, freeze) {
      window.__xy.app.screen = 'levels';
      XY.gacha10.freeze = freeze;
      var v = XY.gacha10.view(window.__xy.app);
      if (v) v.phase = phase;
    }, phase, freeze);
    await frames(page, 3);
    var info = await page.evaluate(function () {
      var g = XY.gacha10.view(window.__xy.app);
      return { phase: g && g.phase, cw: XY.depart && XY.depart.geo && XY.depart.geo.land, fails: document.querySelectorAll('[id^=xyFail]').length, w: window.innerWidth, h: window.innerHeight };
    });
    if (info.fails) fail('fail bar during ' + name);
    var file = path.join(OUT, name + '.png');
    await page.screenshot({ path: file });
    console.log('shot', file, JSON.stringify(info));
  }
  // 同一份存档、同一组牌：结果页 → 收下 → 出发页。出发页的锁必须和结果页的「解锁」一致。
  function expectRoster(rows, label) {
    rows.forEach(function (r) {
      if (r.pulled !== r.owned) fail(label + ' ' + r.name + ' 结果' + (r.pulled ? '解锁' : '未抽到') + ' 但出发页' + (r.owned ? '没锁' : '还挂着锁'));
      if (r.locked !== !r.owned) fail(label + ' lock flag ' + r.name);
    });
  }
  await page.evaluate(function () { XY.save.reset(); window.__xy.app.screen = 'levels'; XY.gacha10.ensure(); });
  await page.waitForFunction(function () {
    var g = XY.save.data.gacha10;
    if (!g || !g.pulls) return false;
    return g.pulls.every(function (id) { var im = XY.bgArt(id); return im && im.naturalWidth > 0; });
  }, { timeout: 15000 }).catch(function () { console.log('portrait wait timed out, shooting anyway'); });
  var rosterOf = function () {
    var unlock = {};
    (XY.save.data.gacha10.rows || []).forEach(function (r) { if (r.kind === 'unlock') unlock[r.id] = r.text; });
    return {
      seed: XY.save.data.gacha10.seed,
      pulls: XY.save.data.gacha10.pulls.slice(),
      acked: !!XY.save.data.gacha10.acked,
      rows: XY.SPECIALS.map(function (d) {
        return { id: d.id, name: d.name, pulled: !!unlock[d.id], text: unlock[d.id] || '', owned: XY.save.spOwned(d.id), locked: !XY.save.spOwned(d.id), cards: XY.save.spCards(d.id) };
      })
    };
  };
  var beforeShot = await page.evaluate(rosterOf);
  expectRoster(beforeShot.rows, '结果页');
  if (beforeShot.acked) fail('result shot already acked');
  var timing = await page.evaluate(function () { return XY.gacha10.timing; });
  if (!(timing.total >= 6 && timing.total <= 8)) fail('flip duration ' + timing.total);
  var marks = await page.evaluate(function () {
    var rows = XY.save.data.gacha10.rows, i, pick = 4, t = XY.gacha10.timing;
    for (i = 2; i < rows.length; i++) if (rows[i].kind === 'unlock') { pick = i; break; }
    var id = XY.save.data.gacha10.pulls[0], im = XY.bgArt(id);
    var iw = im.naturalWidth, ih = im.naturalHeight, src = iw / ih, worst = 0;
    [[320, 480], [140, 200], [90, 360], [500, 180]].forEach(function (wh) {
      var b = XY.gacha10.portraitBox(iw, ih, 0, 0, wh[0], wh[1]);
      worst = Math.max(worst, Math.abs(b.dw / b.dh - src) / src);
    });
    var scales = [0, 0.25, 0.6, 1].map(function (p) { return XY.gacha10.flipScale(p); });
    var ratio = XY.gacha10.CARD_RATIO;
    var cards = [[360, 800], [800, 200], [200, 200]].map(function (wh) {
      var b = XY.gacha10.cardSize(wh[0], wh[1]);
      return b.w / b.h;
    });
    return { midAt: t.intro + pick * t.step + t.flip * 0.6, doneAt: t.intro + pick * t.step + t.flip, worst: worst, scales: scales, cards: cards, ratio: ratio };
  });
  if (marks.worst >= 0.02) fail('立绘宽高比偏差 ' + marks.worst);
  if (marks.scales.some(function (s) { return Math.abs(s - 1) > 0.001; })) fail('翻牌缩放不是 1：' + marks.scales.join(','));
  if (marks.cards.some(function (r) { return Math.abs(r - marks.ratio) > 0.001; })) fail('卡片宽高比不固定 ' + marks.cards.join(','));
  var midAt = marks.midAt, doneAt = marks.doneAt;
  var viewports = [[360, 640], [390, 844], [430, 932], [640, 360], [844, 390], [932, 430], [1920, 1080]];
  for (var vi = 0; vi < viewports.length; vi++) {
    var vw = viewports[vi][0], vh = viewports[vi][1], tag = vw + 'x' + vh;
    await shot('mid-' + tag, vw, vh, 'flip', midAt);
    var shown = await page.evaluate(function () {
      var lp = XY.gacha10.lastPortrait;
      if (!lp) return { ok: false, why: 'no portrait' };
      var src = lp.iw / lp.ih, dst = lp.dw / lp.dh, dev = Math.abs(dst - src) / src;
      return { ok: dev < 0.02, dev: dev, scale: XY.gacha10.flipScale(1) };
    });
    if (!shown.ok || Math.abs(shown.scale - 1) > 0.001) fail(tag + ' 立绘比例 ' + JSON.stringify(shown));
    await shot('done-' + tag, vw, vh, 'flip', doneAt);
    await shot('overview-' + tag, vw, vh, 'result', null);
  }
  await shot('desktop-start', 1920, 1080, 'flip', 0.15);
  await shot('desktop-mid', 1920, 1080, 'flip', midAt);
  await shot('desktop-overview', 1920, 1080, 'result', null);
  await shot('mobile-start', 390, 844, 'flip', 0.15);
  await shot('mobile-mid', 390, 844, 'flip', midAt);
  await shot('mobile-done', 390, 844, 'flip', doneAt);
  await shot('mobile-overview', 390, 844, 'result', null);
  var nudged = await page.evaluate(function () {
    var v = XY.gacha10.view(window.__xy.app);
    v.phase = 'flip'; v.hold = false; v.focus = 1;
    XY.gacha10.nudge(1);
    v = XY.gacha10.view(window.__xy.app);
    var out = { focus: v.focus, hold: !!v.hold };
    v.phase = 'result'; v.pages = 3; v.page = 0;
    XY.gacha10.nudge(1);
    v = XY.gacha10.view(window.__xy.app);
    out.page = v.page;
    return out;
  });
  if (nudged.focus !== 2 || !nudged.hold || nudged.page !== 1) fail('nudge ' + JSON.stringify(nudged));
  var still = await page.evaluate(rosterOf);
  if (still.seed !== beforeShot.seed || still.pulls.join(',') !== beforeShot.pulls.join(',')) fail('screenshots changed the pull');
  expectRoster(still.rows, '截完结果');
  await page.evaluate(function () { XY.gacha10.ack(); window.__xy.app.screen = 'levels'; });
  await frames(page, 3);
  var afterShot = await page.evaluate(rosterOf);
  if (afterShot.seed !== beforeShot.seed || afterShot.pulls.join(',') !== beforeShot.pulls.join(',')) fail('收下换了一组牌');
  if (afterShot.acked !== true) fail('depart shot not acked');
  expectRoster(afterShot.rows, '出发页');
  beforeShot.rows.forEach(function (a, i) {
    var b = afterShot.rows[i];
    if (a.id !== b.id || a.owned !== b.owned || a.cards !== b.cards) fail('收下改变了 ' + a.name + ' 的解锁');
  });
  console.log('same save', beforeShot.rows.map(function (r) { return r.name + (r.owned ? '=开' : '=锁'); }).join(' '));
  await shot('desktop-depart-after', 1920, 1080, 'result', 99);
  await shot('mobile-depart-after', 390, 844, 'result', 99);
  var departStill = await page.evaluate(function () {
    return { show: XY.gacha10.blocking(), seed: XY.save.data.gacha10.seed, owned: XY.SPECIALS.filter(function (d) { return XY.save.spOwned(d.id); }).map(function (d) { return d.id; }) };
  });
  if (departStill.show) fail('depart still showing gacha');
  if (departStill.seed !== beforeShot.seed) fail('depart seed drifted');
  var ownedIds = beforeShot.rows.filter(function (r) { return r.owned; }).map(function (r) { return r.id; }).join(',');
  if (departStill.owned.join(',') !== ownedIds) fail('depart owned set changed');

  await browser.close();
  srv.close();
  console.log('PASS');
})().catch(function (e) {
  console.error('FAIL', e && e.stack || e);
  process.exit(1);
});
