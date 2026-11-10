/* 天兵层规则。运行：node tests/tdline.test.js */
'use strict';
var assert = require('assert');
var R = require('../js/tdline-rules.js');

function eq(a, b, msg) { assert.strictEqual(a, b, (msg ? msg + ': ' : '') + a + ' !== ' + b); }

eq(R.gate({ levelId: 1 }), false);
eq(R.gate({ levelId: 2 }), true);
eq(R.gate({ levelId: 3 }), true);
eq(R.gate({ levelId: 2, dungeon: true }), false);
eq(R.gate({ levelId: 2, lair: true }), false);
eq(R.gate({ levelId: 2, villain: true }), false);
eq(R.gate({ levelId: 2, mod: true }), false);
eq(R.gate({ levelId: 2, noJourney: true }), false);
eq(R.formationOn({ levelId: 2 }), false);
eq(R.formationOn({ levelId: 3 }), true);
eq(R.widgets({ levelId: 2 }).some(function (w) { return w.id === 'form'; }), false);
eq(R.widgets({ levelId: 3 }).some(function (w) { return w.id === 'form'; }), true);
eq(R.unlocked(2).length, 0);
eq(R.unlocked(3).length, 6);
eq(R.TOWER_DMG_MUL[2] >= 1, true);
eq(R.BASE_COST.arrow, 30);
eq(R.BASE_COST.cannon, 70);
eq(R.BASE_COST.frost, 50);
eq(R.BASE_COST.siege, 90);
eq(R.BASE_COST.heal, 70);
eq(R.price('arrow', 'place', 1), 30);
eq(R.price('arrow', 'up2', 1), 30);
eq(R.price('arrow', 'up3', 1), 45);
eq(R.price('cannon', 'up2', 1), 70);
eq(R.price('cannon', 'up3', 1), 105);
eq(R.price('siege', 'up3', 0.8), 108);
eq(R.price('arrow', 'up2', 1), R.price('arrow', 'place', 1));

eq(R.refund(0, 100, 100, 100, 100, true), 0, 'free archer base');
eq(R.refund(30, 100, 100, 100, 100, false), 30, 'before start, full');
eq(R.refund(100, 50, 100, 80, 100, true), 35, 'floor 100*0.7*0.5');
eq(R.refund(45, 10, 100, 100, 100, true), 3, 'floor 45*0.7*0.1');

eq(R.rankOf(R.rank.dmg, 1), 1);
eq(R.rankOf(R.rank.dmg, 2), 1.25);
eq(R.rankOf(R.rank.dmg, 3), 1.55);
eq(R.rankOf(R.rank.slowTime, 3), 1.3);
eq(R.rankOf(R.rank.heal, 2), 1.1);
eq(R.rankOf(R.rank.hp, 2), 1.15);
eq(R.counterExtra('arrow', { fly: true }), 0.3);
eq(R.counterExtra('cannon', { fly: true }), -1);
eq(R.counterExtra('siege', { type: 'tank' }), 0.4);
eq(R.counterExtra('siege', { type: 'shield' }), 0.4);
eq(R.counterExtra('siege', { elite: true }), 0.4);
eq(R.counterExtra('siege', { type: 'small' }), 0);
eq(R.counterExtra('frost', { type: 'boss' }), 0, 'boss slow magnitude stays in the existing 0.5 rule');

var route = {
  total: 1000,
  at: function (s) { return { x: s, y: 100, a: 0 }; }
};
eq(R.spots(2, route, { x: 500, y: 100 }).length, 5);
eq(R.spots(3, route, { x: 500, y: 100 }).length, 6);
eq(R.spots(3, route, { x: 500, y: 100 }).filter(function (p) { return p.kind === 'camp'; }).length, 4);
var far = R.snap(0, 0, [{ x: 500, y: 500, i: 1 }], 1);
eq(far, null);
var near = R.snap(10, 10, [{ x: 40, y: 10, i: 2 }], 1);
eq(near.i, 2);
eq(R.snapRadius(0.5), 88);
eq(R.snapRadius(2), 60);
eq(R.room(0.22, 0.15, 0.5), 0.15);
assert.ok(Math.abs(R.room(0.45, 0.15, 0.5) - 0.05) < 1e-9);
eq(R.GUIDE2.length, 6);
eq(R.GUIDE3.length, 6);
eq(R.GUIDE2[5].id, 'go');
eq(R.GUIDE3[1].id, 'sancai');
assert.ok(R.GUIDE2.some(function (s) { return s.text.indexOf('只有天兵') >= 0; }));
assert.ok(R.FLY_HINT.indexOf('只有天兵') >= 0 && R.FLY_HINT.indexOf('飞妖') >= 0);
assert.ok(R.FORMATIONS.every(function (f) { return f.unlock === 3 && f.short && R.COMBOS[f.id]; }));
eq(R.hitsFlyer('arrow'), true);
eq(R.hitsFlyer('frost'), true);
eq(R.hitsFlyer('heal'), true);
eq(R.hitsFlyer('siege'), true);
eq(R.hitsFlyer('cannon'), false);
eq(R.blockFlyer({ flyer: false }), false);
eq(R.blockFlyer({ flyer: true }), true);
eq(R.blockFlyer({ flyer: true, tower: true }), false);
eq(R.blockFlyer({ flyer: true, combo: true }), false);
eq(R.blockFlyer({ flyer: true, cannon: true }), true);
eq(R.towerUntargetable(true), true);
eq(R.towerUntargetable(false), false);
eq(R.flyerPack(1, 0).bat, 0);
eq(R.flyerPack(2, 0).bat, 3);
eq(R.flyerPack(2, 1).owl, 1);
eq(R.flyerPack(3, 0).bat, 4);
eq(R.flyerPack(3, 0).owl, 1);
eq(R.charge(0, 8, 16), 0.5);
eq(R.charge(0.9, 8, 16), 1);

console.log('tdline rules ok');
