/* 每个局内角色的狂野水墨时间轴都要在，出招播完必须回到待机。 */
var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('fs');
var path = require('path');
var wild = require('../assets/wild/wild-anim.js');

var ROSTER = ['tang', 'wukong', 'bajie', 'wujing', 'horse', 'sisi', 'heyuxi', 'phyrex', 'phyrex_x', 'haiteng', 'yuanzhang', 'diaoyulao', 'laosiji', 'kuanggong', 'martin'];
var manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/wild/manifest.json'), 'utf8'));

test('manifest loads animation data for every battle character', function () {
  var ids = wild.ingest(manifest);
  assert.deepEqual(ids, ROSTER);
  ROSTER.forEach(function (id) {
    assert.equal(wild.api.knows(id), true);
    var idle = wild.api.clip(id, 'idle');
    assert.ok(idle, id + ' idle');
    assert.ok(idle.loopPolicy === 'cycle' || idle.loopPolicy === 'pingpong', id + ' idle policy');
    assert.equal(idle.durationsMs.length, idle.frameCount, id + ' idle frames');
    assert.equal(idle.durationMs, wild.sum(idle.durationsMs));
    assert.ok(fs.existsSync(path.join(__dirname, '../assets/wild', idle.file)), idle.file);
    var attack = wild.api.clip(id, 'attack');
    if (id === 'laosiji') {
      assert.equal(attack, null);
      return;
    }
    assert.equal(attack.loopPolicy, 'oneshot');
    assert.equal(attack.frameCount, 8);
    assert.equal(attack.durationsMs.length, 8);
    assert.ok(attack.durationMs >= 640 && attack.durationMs <= 700, id + ' duration ' + attack.durationMs);
    assert.equal(attack.hit.frame, 3);
    assert.equal(attack.hit.atMs, 250);
    assert.ok(fs.existsSync(path.join(__dirname, '../assets/wild', attack.file)), attack.file);
  });
});

test('attack plays once, hit frame lands at 250ms, then idle', function () {
  wild.ingest(manifest);
  ROSTER.forEach(function (id) {
    var attack = wild.api.clip(id, 'attack');
    var state = wild.step({ mode: 'idle', t: 40 }, 16, true, attack);
    if (id === 'laosiji') {
      assert.equal(state.mode, 'idle', 'laosiji stays idle without an attack clip');
      state = wild.step(state, 800, true, null);
      assert.equal(state.mode, 'idle');
      return;
    }
    assert.equal(state.mode, 'attack');
    assert.equal(state.t, 0);
    var atHit = wild.step(state, attack.hit.atMs, false, attack);
    assert.equal(atHit.mode, 'attack');
    assert.equal(wild.frameAt(attack, atHit.t).index, attack.hit.frame);
    var done = wild.step(atHit, attack.durationMs - attack.hit.atMs, false, attack);
    assert.equal(done.mode, 'idle', id + ' returns to idle');
    var after = wild.step(done, 500, false, attack);
    assert.equal(after.mode, 'idle');
    var idle = wild.api.clip(id, 'idle');
    var looped = wild.frameAt(idle, idle.durationMs + idle.durationsMs[0] / 2);
    assert.equal(looped.done, false);
    assert.equal(looped.index, 0);
  });
});

test('pingpong walks forward then back without repeating the ends', function () {
  var clip = { loopPolicy: 'pingpong', baked: false, durationsMs: [100, 100, 100] };
  assert.equal(wild.frameAt(clip, 0).index, 0);
  assert.equal(wild.frameAt(clip, 100).index, 1);
  assert.equal(wild.frameAt(clip, 200).index, 2);
  assert.equal(wild.frameAt(clip, 300).index, 1);
  assert.equal(wild.frameAt(clip, 400).index, 0);
  assert.equal(wild.frameAt(clip, 500).index, 1);
});
