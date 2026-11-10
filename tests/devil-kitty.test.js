/* Devil Kitty：登场、狂暴、变身、掉落、装备、开关、弹窗、存档。
 * 运行：node --test tests/devil-kitty.test.js
 */
'use strict';
var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('fs');
var path = require('path');
var DK = require('../js/devil_kitty_logic.js');

function restCtx(over) {
  return Object.assign({ enabled: true, mainline: true, phase: 'rest', restT: 0, levelId: 1 }, over || {});
}

test('猫叔在休息满 20 秒后登场，之前不出现', function () {
  var run = DK.freshRun();
  var early = DK.tickRun(run, restCtx({ restT: 19.9 }), 0.05);
  assert.equal(early.run.spawned, false);
  assert.equal(early.events.indexOf('intro'), -1);
  var go = DK.tickRun(early.run, restCtx({ restT: 20 }), 0.016);
  assert.equal(go.run.spawned, true);
  assert.equal(go.events[0], 'intro');
  assert.equal(go.run.hold, true);
  assert.ok(Math.abs(go.run.introLeft - DK.INTRO_T) < 1e-6);
});

test('只在主线出现，副本和 Boss 战不出现', function () {
  ['dungeon', 'villain', 'lair', 'bossfight', 'mod', 'iframe'].forEach(function (key) {
    var g = {};
    g[key] = true;
    assert.equal(DK.isMainline(g), false, key);
    var run = DK.tickRun(DK.freshRun(), restCtx({ mainline: false, restT: 80 }), 1);
    assert.equal(run.run.spawned, false);
  });
  assert.equal(DK.isMainline({ lv: { rest: 0.001 } }), false);
  assert.equal(DK.isMainline({ lv: { rest: 0.5 } }), true);
  assert.equal(DK.isMainline({}), true);
});

test('狂暴倍率与 45 秒时长，结束后小怪恢复', function () {
  var run = DK.freshRun();
  run = DK.tickRun(run, restCtx({ restT: 20 }), 0.01).run;
  run = DK.skipIntro(run, 2);
  assert.equal(run.rageOn, true);
  assert.ok(Math.abs(run.rageLeft - DK.RAGE_DUR) < 1e-6);
  var mob = { speed: 40, dmg: 10 };
  DK.applyMobRage(mob);
  assert.equal(mob.speed, 60);
  assert.equal(mob.dmg, 15);
  assert.ok(Math.abs(mob.atkEvery - 0.8 / DK.MOB_MUL) < 1e-9);
  assert.equal(DK.rageMul(run).mob, DK.MOB_MUL);
  assert.equal(DK.rageMul(run).boss, DK.BOSS_MUL);
  assert.equal(DK.shouldEnrageBoss({ dead: false, enraged: false, def: { denBoss: true } }), true);
  assert.equal(DK.shouldEnrageBoss({ dead: false, enraged: true, def: { denBoss: true } }), false);
  run.rageLeft = 0.05;
  run.rageOn = true;
  var end = DK.tickRun(run, restCtx({ restT: 30 }), 0.05);
  assert.equal(end.run.rageOn, false);
  assert.equal(end.events.indexOf('rageEnd') >= 0, true);
  DK.clearMobRage(mob);
  assert.equal(mob.speed, 40);
  assert.equal(mob.dmg, 10);
  assert.equal(DK.rageMul(end.run).mob, 1);
});

test('第一次归零只变身不掉落，跳过演出后数值提升，二次击败才掉落', function () {
  var run = DK.skipIntro(DK.tickRun(DK.freshRun(), restCtx({ restT: 21 }), 0.01).run, 1);
  var base = DK.baseStats(1);
  assert.equal(run.unit.phase, 1);
  assert.equal(run.unit.name, '猫叔');
  assert.equal(run.unit.hp, base.hp);
  var first = DK.hurtUnit(run, 999999);
  assert.equal(first.formed, true);
  assert.equal(first.defeated, undefined);
  assert.equal(run.dropped, false);
  assert.equal(run.drops, null);
  assert.equal(run.unit.dead, false);
  assert.ok(run.formLeft > 2.5);
  DK.skipForm(run);
  assert.equal(run.formLeft, 0);
  assert.equal(run.unit.phase, 2);
  assert.equal(run.unit.name, '猫叔 · 魔化');
  assert.equal(run.unit.hp, Math.round(base.hp * DK.PHASE2.hp));
  assert.equal(run.unit.maxHp, Math.round(base.hp * DK.PHASE2.hp));
  assert.equal(run.unit.dmg, Math.round(base.dmg * DK.PHASE2.dmg));
  assert.ok(Math.abs(run.unit.atkEvery - base.atkEvery / DK.PHASE2.atk) < 1e-9);
  assert.equal(run.rageLeft, DK.RAGE_DUR);
  assert.equal(run.rageReset, true);
  var second = DK.hurtUnit(run, 999999);
  assert.equal(second.defeated, true);
  var rng = [0, 0.5, 0];
  var drop = DK.onDefeat(run, function () { return rng.shift(); }, ['sisi', 'phyrex'], ['sisi_w', 'phyrex_i']);
  assert.equal(drop.card, 'sisi');
  assert.equal(drop.gear, 'sisi_w');
  assert.equal(drop.p, DK.GEAR_P2);
  assert.equal(DK.onDefeat(run, Math.random, ['phyrex'], []), null);
});

test('变身演出可被跳过，跳过即满血进入二阶段', function () {
  var run = DK.freshRun();
  run.spawned = true;
  DK.spawnUnit(run, 3);
  DK.hurtUnit(run, 1e9);
  assert.ok(run.formLeft > 0);
  var mid = DK.tickRun(run, restCtx(), 1);
  assert.ok(mid.run.formLeft > 0);
  assert.equal(mid.run.hold, true);
  assert.equal(mid.run.unit.phase, 1);
  DK.skipForm(mid.run);
  var lv = DK.baseStats(3);
  assert.equal(mid.run.unit.phase, 2);
  assert.equal(mid.run.unit.hp, Math.round(lv.hp * 1.6));
  assert.equal(mid.run.hold, false);
});

test('开关默认开，不看版本标志，?cato=0 或存档关掉后不登场', function () {
  assert.equal(DK.enabled({ testBuild: true, query: null, saved: null }), true);
  assert.equal(DK.enabled({ testBuild: false, query: null, saved: null }), true);
  assert.equal(DK.enabled({ query: '0', saved: true }), false);
  assert.equal(DK.enabled({ saved: false }), false);
  assert.equal(DK.SUB, '特别活动');
  var run = DK.tickRun(DK.freshRun(), restCtx({ enabled: false, restT: 40 }), 1);
  assert.equal(run.run.spawned, false);
});

test('装备只能给对应角色，装上后数值生效，旧档没有字段也能读', function () {
  var data = { schema: 5, lingshi: 3 };
  var g = DK.readGear(data);
  assert.deepEqual(g.bag, {});
  DK.grantGear(g, 'phyrex_w', 1);
  DK.grantGear(g, 'sisi_i', 1);
  var bad = DK.equipGear(g, 'sisi', 'phyrex_w');
  assert.equal(bad.ok, false);
  var ok = DK.equipGear(g, 'phyrex', 'phyrex_w');
  assert.equal(ok.ok, true);
  assert.equal(g.equip.phyrex.weapon, 'phyrex_w');
  assert.equal(g.bag.phyrex_w, undefined);
  var fx = DK.effectsOf(g, 'phyrex');
  assert.equal(fx.dmg, 0.06);
  assert.equal(DK.effectsOf(g, 'sisi').dmg, 0);
  var hero = { dmgMul: 2, speed: 100, maxHp: 200, hp: 200, mod: { atkSpd: 1, dr: 1, regen: 0 } };
  DK.applyEffects(hero, fx);
  assert.ok(Math.abs(hero.dmgMul - 2.12) < 1e-9);
  DK.writeGear(data, g);
  var again = DK.readGear(JSON.parse(JSON.stringify(data)));
  assert.equal(again.equip.phyrex.weapon, 'phyrex_w');
  assert.equal(again.bag.sisi_i, 1);
  assert.equal(DK.readGear({}).equip.phyrex, undefined);
});

test('活动弹窗：教程中不弹，每页每次会话只自动弹一次', function () {
  var s = DK.freshSession();
  assert.equal(DK.shouldAuto(s, 'start', { tutorialDone: false, inTutorial: false }), false);
  assert.equal(DK.shouldAuto(s, 'levels', { tutorialDone: true, inTutorial: true }), false);
  assert.equal(DK.shouldAuto(s, 'start', { tutorialDone: true, inTutorial: false }), true);
  DK.markAuto(s, 'start');
  assert.equal(DK.shouldAuto(s, 'start', { tutorialDone: true, inTutorial: false }), false);
  assert.equal(DK.shouldAuto(s, 'levels', { tutorialDone: true, inTutorial: false }), true);
  DK.markAuto(s, 'levels');
  assert.equal(DK.shouldAuto(s, 'levels', { tutorialDone: true, inTutorial: false }), false);
  assert.equal(DK.shouldAuto(s, 'shop', { tutorialDone: true }), false);
});

test('十连从活动入口抽，抽过就不能再抽一次', function () {
  var save = { gacha10: null };
  var n = 0;
  function ensure() {
    if (save.gacha10 && save.gacha10.pulls && save.gacha10.pulls.length === 10) return save.gacha10;
    n++;
    save.gacha10 = { pulls: ['phyrex', 'sisi', 'phyrex', 'sisi', 'phyrex', 'sisi', 'phyrex', 'sisi', 'phyrex', 'sisi'], granted: true, acked: false };
    return save.gacha10;
  }
  assert.equal(DK.gachaClaimed(save), false);
  var a = DK.requestDraw(save, ensure);
  assert.equal(a.ok, true);
  assert.equal(n, 1);
  var b = DK.requestDraw(save, ensure);
  assert.equal(b.ok, false);
  assert.equal(b.claimed, true);
  assert.equal(n, 1);
  assert.equal(DK.gachaClaimed(save), true);
  assert.deepEqual(save.gacha10.pulls, a.pack.pulls);
});

test('隐藏角色没获得前不进装备名单和掉落，获得后才出现', function () {
  var hidden = { qinba: true, traders18: true, cato: true };
  function isHidden(id) { return !!hidden[id]; }
  assert.equal(DK.heroRevealed('qinba', true, false), false);
  assert.equal(DK.heroRevealed('traders18', true, false), false);
  assert.equal(DK.heroRevealed('cato', true, false), false);
  assert.equal(DK.heroRevealed('phyrex', false, false), true);
  assert.equal(DK.heroRevealed('qinba', true, true), true);
  var locked = DK.GEAR.filter(function (g) { return DK.heroRevealed(g.owner, isHidden(g.owner), false); });
  ['qinba', 'traders18', 'cato'].forEach(function (id) {
    assert.equal(locked.some(function (g) { return g.owner === id; }), false, id);
  });
  assert.equal(locked.some(function (g) { return g.owner === 'phyrex'; }), true);
  var opened = DK.GEAR.filter(function (g) { return DK.heroRevealed(g.owner, isHidden(g.owner), g.owner === 'qinba'); });
  assert.equal(opened.some(function (g) { return g.id === 'qinba_w'; }), true);
  assert.equal(opened.some(function (g) { return g.owner === 'traders18' || g.owner === 'cato'; }), false);
  var names = ['qinbafrank', 'TraderS', '@qinbafrank', '@TraderS18'];
  var pub = ['js/devil_kitty_ui.js'];
  pub.forEach(function (rel) {
    var text = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
    names.forEach(function (n) {
      assert.equal(text.indexOf(n), -1, rel + ' 写了 ' + n);
    });
  });
});

test('变身素材清单和动画时间轴可替换', function () {
  var root = path.join(__dirname, '..', 'assets', 'devil-kitty');
  var anim = JSON.parse(fs.readFileSync(path.join(root, 'animation.json'), 'utf8'));
  var art = JSON.parse(fs.readFileSync(path.join(root, 'art.json'), 'utf8'));
  assert.equal(art.formId, 'B');
  assert.equal(art.form, 'form.webp');
  assert.equal(art.formVideo, 'form.mp4');
  assert.equal(art.version, 7);
  var formBuf = fs.readFileSync(path.join(root, 'form.mp4'));
  assert.equal(formBuf.length, 8551265);
  assert.equal(require('crypto').createHash('sha256').update(formBuf).digest('hex'), 'dbcfde5749b4b929f39c6b0174973566bc65462b5c2c52ca47fd42c3ceb0791e');
  assert.equal(art.stage1, 'stage1.webp');
  assert.equal(art.frameCount, 31);
  ['stage1.webp', 'form.webp', 'form.mp4', 'frames/frame-001.webp', 'frames/frame-031.webp'].forEach(function (f) {
    assert.equal(fs.existsSync(path.join(root, f)), true, f);
  });
  assert.ok(Math.abs(DK.formDuration() - art.formDurationMs / 1000) < 1e-6);
  ['idle', 'attack', 'hit', 'form'].forEach(function (name) {
    var clip = DK.clipOf(anim, name);
    assert.ok(clip, name);
    assert.equal(clip.durationsMs.length, clip.frameCount);
    assert.equal(clip.durationMs, DK.sum(clip.durationsMs));
  });
  var attack = DK.clipOf(anim, 'attack');
  assert.equal(DK.frameAt(attack, attack.hit.atMs).index, attack.hit.frame);
  var idle = DK.clipOf(anim, 'idle');
  assert.equal(DK.frameAt(idle, idle.durationMs + 10).done, false);
  var state = DK.stepAnim({ mode: 'idle', t: 0 }, 0, true, attack, false, null);
  assert.equal(state.mode, 'attack');
  var back = DK.stepAnim(state, attack.durationMs, false, attack, false, null);
  assert.equal(back.mode, 'idle');
  var hit = DK.clipOf(anim, 'hit');
  var stung = DK.stepAnim({ mode: 'idle', t: 0 }, 0, false, attack, true, hit);
  assert.equal(stung.mode, 'hit');
});
