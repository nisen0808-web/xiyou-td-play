/* 天兵关卡规则。运行：node tests/tdline.test.js
 * 第一关不是塔防；第二关没有阵型入口；第三关起阵型生效，且没有一个阵通吃。
 */
'use strict';
var assert = require('assert');
var R = require('../js/tdline-rules.js');

function eq(a, b, msg) { assert.strictEqual(a, b, msg || (a + ' !== ' + b)); }

eq(R.isTd(1), false, 'level 1 is not tower defense');
eq(R.isTd(2), true);
eq(R.isTd(3), true);
eq(R.isTd(4), true);
eq(R.isTd(2, { dungeon: true }), false);
eq(R.isTd(2, { villain: true }), false);
eq(R.isTd(2, { lair: true }), false);
eq(R.isTd(2, { mod: true }), false);
eq(R.isTd(2, { sweep: true }), true, 'sweep is not a level flag; the caller skips deploy');

eq(R.formTab(1), false);
eq(R.formTab(2), false);
eq(R.widgets(1).length, 0);
eq(R.widgets(2).some(function (w) { return w.id === 'form'; }), false, 'level 2 has no formation tab');
eq(R.widgets(3).some(function (w) { return w.id === 'form'; }), true);
eq(R.unlocked(2).length, 0);
eq(R.unlocked(3).length, 3);
eq(R.unlocked(4).length, 6);
eq(R.unlocked(3).every(function (f) { return f.unlock === 3; }), true);

eq(R.upgradeCost('arrow', 2) > 0, true);
eq(R.upgradeCost('arrow', 4), 0);
var spent = R.spentFor('arrow', 3);
eq(R.sellRefund('arrow', 3), Math.round(spent * 0.6));
eq(R.sellRefund('arrow', 3) < spent, true);

var bosses = [2, 3, 4].map(function (id) { return R.BOSSES[id].name; });
eq(new Set(bosses).size, 3, 'each level has its own boss');

[2, 3, 4].forEach(function (lv) {
  var hero = R.simulate(lv, 'hero');
  var line = R.simulate(lv, 'line');
  assert.ok(!hero.win, 'level ' + lv + ' hero-only should lose, lives ' + hero.lives);
  eq(hero.lives, 0);
  assert.ok(line.win, 'level ' + lv + ' with towers should win, lives ' + line.lives + ' leak ' + line.leaked);
  assert.ok(line.lives > 0 && line.lives <= line.maxLives);
});

var plain = R.plan(4, 'line');
var noFang = R.run({ level: 4, buys: plain.buys, heroForm: null, garrison: 0, upgrade: true, hero: true });
var fang = R.run({ level: 4, buys: plain.buys, heroForm: 'fang', garrison: 2, upgrade: true, hero: true });
assert.ok(fang.heroForm === 'fang');
assert.ok(fang.lives > noFang.lives, '方圆阵同样漏怪时少扣命');
assert.ok(fang.leaked === noFang.leaked, '方圆阵不增加清线');
assert.ok(!R.simulate(4, 'fang-only').win, '只留阵、不放天兵过不了');
assert.ok(!R.simulate(3, 'bagua-only').win);

var sc = R.scenarios();
assert.ok(sc.swarm.crane.lives > sc.swarm.zhi.lives, '鹤翼清群优于锱矢');
assert.ok(sc.armor.zhi.lives > sc.armor.snake.lives, '锱矢打重甲优于长蛇');
assert.ok(sc.armor.zhi.lives > sc.armor.crane.lives, '锱矢打重甲优于鹤翼');
assert.ok(sc.air.net.lives > sc.air.snake.lives, '天罗地网对空优于长蛇');
assert.ok(sc.air.net.lives > sc.air.netOff.lives, '天罗地网关掉就变弱');
assert.ok(sc.air.crane.lives < sc.air.net.lives, '鹤翼不是对空最优');

function best(map) {
  var max = -1, names = [];
  Object.keys(map).forEach(function (k) { if (k === 'netOff') return; if (map[k].lives > max) max = map[k].lives; });
  Object.keys(map).forEach(function (k) { if (k === 'netOff') return; if (map[k].lives === max) names.push(k); });
  return names;
}
var winners = [best(sc.swarm), best(sc.armor), best(sc.air)];
var all = winners[0].filter(function (n) { return winners[1].indexOf(n) >= 0 && winners[2].indexOf(n) >= 0; });
eq(all.length, 0, 'no formation wins every scenario: ' + JSON.stringify(winners));

var desk = R.placeCard({ w: 1920, h: 1080 }, { x: 400, y: 400, w: 80, h: 80 }, R.cardSize({ w: 1920, h: 1080 }));
var phoneT = { x: 40, y: 80, w: 70, h: 70 };
var phoneC = R.cardSize({ w: 390, h: 844 });
var phone = R.placeCard({ w: 390, h: 844 }, phoneT, phoneC);
function overlaps(c, t, size) {
  return !(c.x + size.w < t.x || c.x > t.x + t.w || c.y + size.h < t.y || c.y > t.y + t.h);
}
assert.ok(!overlaps(desk, { x: 400, y: 400, w: 80, h: 80 }, R.cardSize({ w: 1920, h: 1080 })));
assert.ok(!overlaps(phone, phoneT, phoneC), 'phone guide card covers the target');
assert.ok(phone.x >= 8 && phone.y >= 8 && phone.x + phoneC.w <= 382 && phone.y + phoneC.h <= 836);

assert.ok(R.LINE_GUIDE.length >= 6);
assert.ok(R.FORM_GUIDE.length >= 5);
eq(R.FORM_GUIDE[0].id, 'tab');
eq(R.LINE_GUIDE[1].id, 'place');

console.log('tdline rules ok');
console.log('balance', [2, 3, 4].map(function (lv) {
  var h = R.simulate(lv, 'hero'), t = R.simulate(lv, 'line');
  return 'L' + lv + ' hero ' + h.lives + '/' + h.maxLives + ' line ' + t.lives + '/' + t.maxLives;
}).join(' | '));
