/* Boss 战模拟必须还能打完。牛魔王待机 / 出招 / 受击按 animation.json 播完回到待机。 */
var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('fs');
var path = require('path');
var BF = require('../bossfight/sim.js');
var wild = require('../assets/wild/wild-anim.js');

test('boss fight sim still reaches an ending', function () {
  ['sisi', 'wukong'].forEach(function () {});
  var F = BF.run({ partner: 'sisi', seed: 3, wukongLv: 5, partnerLv: 5 });
  assert.ok(F.over, 'fight ends');
  assert.equal(typeof F.over.win, 'boolean');
  assert.ok(F.t > 0 && F.t < 200);
  assert.equal(F.heroes[0].id, 'wukong');
  assert.equal(F.heroes[1].id, 'sisi');
  assert.ok(F.boss.maxHp > 0);
});

test('niumo plays idle, attack, and hit, then returns to idle', function () {
  var manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/wild/manifest.json'), 'utf8'));
  wild.ingest(manifest);
  var idle = wild.api.clip('niumo', 'idle');
  var atk = wild.api.clip('niumo', 'attack');
  var hit = wild.api.clip('niumo', 'hit');
  assert.equal(idle.loopPolicy, 'cycle');
  assert.equal(idle.frameCount, 36);
  assert.equal(idle.durationMs, 3000);
  assert.equal(idle.stand, 480);
  assert.equal(atk.loopPolicy, 'oneshot');
  assert.equal(atk.frameCount, 8);
  assert.equal(atk.durationMs, 667);
  assert.equal(atk.hit.atMs, 250);
  assert.equal(atk.hit.frame, 3);
  assert.equal(hit.frameCount, 5);
  assert.equal(hit.durationMs, 417);
  assert.equal(hit.hit.atMs, 167);
  assert.equal(wild.frameAt(atk, 250).index, 3);
  assert.equal(wild.frameAt(hit, 167).index, hit.hit.frame);
  var st = wild.step({ mode: 'idle', t: 0 }, 0, true, atk);
  st = wild.step(st, 667, false, atk);
  assert.equal(st.mode, 'idle');
  var hs = wild.step({ mode: 'idle', t: 0 }, 0, true, hit);
  hs = wild.step(hs, 167, false, hit);
  assert.equal(hs.mode, 'attack');
  assert.equal(wild.frameAt(hit, hs.t).index, 2);
  hs = wild.step(hs, 417 - 167, false, hit);
  assert.equal(hs.mode, 'idle');
  assert.equal(wild.poseClip('niumo', 'ko'), 'hit');
  assert.equal(wild.poseClip('niumo', 'rush'), 'idle');
  assert.equal(wild.poseClip('wukong', 'stance'), 'idle');
  assert.equal(wild.poseClip('wukong', 'hit'), 'hit');
  assert.equal(wild.poseClip('heyuxi', 'leap'), 'idle');
  assert.equal(wild.poseClip('heyuxi', 'ult'), 'attack');
  assert.equal(wild.poseClip('niumo', 'hit'), 'hit');
  assert.ok(fs.existsSync(path.join(__dirname, '../assets/wild', hit.file)));
});

test('boss fight plates stay off the journey clips', function () {
  var manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/wild/manifest.json'), 'utf8'));
  wild.ingest(manifest);
  assert.equal(manifest.ids.wukong.idle.file, 'wukong-idle.webp');
  assert.equal(manifest.ids.wukong.idle.frameCount, 90);
  assert.equal(manifest.ids.tang.idle.file, 'tang-idle.webp');
  assert.equal(manifest.ids.bajie.idle.file, 'bajie-idle.webp');
  assert.equal(manifest.ids.wujing.idle.file, 'wujing-idle.webp');
  assert.equal(manifest.ids.phyrex.idle.file, 'phyrex-idle.webp');
  assert.equal(manifest.ids.sisi.idle.file, 'sisi-idle.webp');
  assert.deepEqual(BF.ORDER, ['phyrex', 'sisi', 'laosiji', 'kuanggong', 'haiteng', 'yuanzhang', 'heyuxi', 'diaoyulao', 'martin']);
  ['bajie', 'wujing', 'qinba', 'traders18', 'cato'].forEach(function (id) {
    assert.equal(BF.ORDER.indexOf(id), -1);
  });
  [['niumo', 250, 3, 'left'], ['phyrex', 333, 4, 'right'], ['sisi', 333, 4, 'right'], ['wukong', 333, 4, 'right']].forEach(function (row) {
    var id = row[0], atk = wild.api.clip(id, 'bossAttack'), idle = wild.api.clip(id, 'bossIdle'), hit = wild.api.clip(id, 'bossHit');
    assert.equal(idle.loopPolicy, 'pingpong');
    assert.equal(idle.frameCount, 27);
    assert.equal(idle.durationMs, 2250);
    assert.equal(atk.loopPolicy, 'oneshot');
    assert.equal(atk.frameCount, 8);
    assert.equal(atk.hit.atMs, row[1]);
    assert.equal(atk.hit.frame, row[2]);
    assert.equal(wild.frameAt(atk, row[1]).index, row[2]);
    assert.equal(hit.frameCount, 5);
    assert.equal(hit.hit.atMs, 167);
    assert.equal(hit.facing, row[3]);
    assert.equal(wild.frameAt(idle, 0).index, 0);
    assert.equal(wild.frameAt(idle, idle.durationMs - 1).index, 26);
    [idle, atk, hit].forEach(function (clip) {
      assert.ok(fs.existsSync(path.join(__dirname, '../assets/wild', clip.file)));
      assert.ok(clip.stand > 400);
    });
  });
});
