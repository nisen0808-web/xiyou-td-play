/* Boss 战模拟必须还能打完。牛魔王的新图没到时，姿势映射不强迫换图。 */
var test = require('node:test');
var assert = require('node:assert/strict');
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

test('niumo pose map is ready for animation.json and stays empty until a pack arrives', function () {
  assert.equal(wild.api.clip('niumo', 'idle'), null);
  assert.equal(wild.api.clip('niumo', 'attack'), null);
  assert.equal(wild.api.clip('niumo', 'hit'), null);
  assert.equal(wild.poseClip('niumo', 'stance'), 'idle');
  assert.equal(wild.poseClip('niumo', 'idle_b'), 'idle');
  assert.equal(wild.poseClip('niumo', 'swing'), 'attack');
  assert.equal(wild.poseClip('niumo', 'smash'), 'attack');
  assert.equal(wild.poseClip('niumo', 'hit'), 'hit');
  assert.equal(wild.poseClip('niumo', 'ko'), null);
  assert.equal(wild.poseClip('niumo', 'rush'), null);
  assert.equal(wild.poseClip('wukong', 'stance'), 'idle');
  assert.equal(wild.poseClip('wukong', 'attack_b'), 'attack');
  assert.equal(wild.poseClip('heyuxi', 'leap'), null);
  assert.equal(wild.poseClip('laosiji', 'charge'), null);
  assert.equal(wild.poseClip('tang', 'ult'), null);

  wild.ingest({
    stand: 192,
    ids: {
      niumo: {
        idle: { loopPolicy: 'cycle', durationsMs: [100, 100, 100, 100], frameCount: 4, durationMs: 400, anchor: [10, 20], cell: [30, 40], cols: 2 },
        attack: { loopPolicy: 'oneshot', durationsMs: [83, 84, 83, 83, 84, 83, 83, 84], frameCount: 8, durationMs: 667, anchor: [10, 20], cell: [30, 40], cols: 4, hit: { atMs: 250, frame: 3 } },
        hit: { loopPolicy: 'oneshot', durationsMs: [100, 100, 100, 100], frameCount: 4, durationMs: 400, anchor: [10, 20], cell: [30, 40], cols: 2 }
      }
    }
  });
  var atk = wild.api.clip('niumo', 'attack');
  assert.equal(wild.frameAt(atk, 250).index, 3);
  var st = wild.step({ mode: 'idle', t: 0 }, 0, true, atk);
  st = wild.step(st, 667, false, atk);
  assert.equal(st.mode, 'idle');
  var hit = wild.api.clip('niumo', 'hit');
  assert.equal(hit.loopPolicy, 'oneshot');
  assert.equal(wild.frameAt(hit, 500).done, true);
});
