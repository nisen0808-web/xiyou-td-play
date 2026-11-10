/* 第二关、第三关天兵层的纯规则。不改英雄伤害、不改关卡怪的血量。
 * 第二关起另加飞妖（出怪表里只加这一项）。浏览器和 node 测试共用。
 */
(function (root) {
  'use strict';
  var R = {};
  R.VERSION = '0.8.7';
  /* 不再为了凑伤害占比把一箭放大到秒杀。
   * 第二关 3.2：弓对小妖大约四下，两名跟随弓兵能在蝠妖俯冲落地前打死它。
   * 第三关 3.6：怪更厚，连携和升级（1.25 / 1.55）才是清精英的部分。 */
  R.TOWER_DMG_MUL = { 2: 3.2, 3: 3.6 };
  R.START_GRANT = { 2: 120, 3: 160 };
  R.WAVE_BOUNTY = { 2: 6, 3: 8 };
  R.TIDE_BOUNTY = { 2: 15, 3: 20 };
  R.WAVE_COIN = 0.5;
  R.FILL_COIN = 0.2;
  R.LIFE_MUL = 1.3;
  R.GAP = 12;
  R.BASE_COST = { arrow: 30, cannon: 70, frost: 50, siege: 90, heal: 70 };

  R.gate = function (g) {
    g = g || {};
    if ((g.levelId | 0) < 2) return false;
    if (g.noJourney || g.lair || g.villain || g.dungeon || g.mod) return false;
    return true;
  };
  R.formationOn = function (g) { return R.gate(g) && (g.levelId | 0) >= 3; };

  R.price = function (type, kind, disc) {
    var base = R.BASE_COST[type];
    if (!base) return 0;
    var k = kind === 'up3' ? 1.5 : 1;
    return Math.round(base * k * (disc == null ? 1 : disc));
  };

  /* started=false：开战前全额。开战后退 floor(投资 × 0.7 × min(血比, 寿比))。免费弓的投资不含白送的本体。 */
  R.refund = function (paid, hp, maxHp, life, maxLife, started) {
    paid = Math.max(0, paid || 0);
    if (!started) return paid;
    var hpR = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
    var lifeR = maxLife > 0 ? Math.max(0, Math.min(1, life / maxLife)) : 0;
    return Math.floor(paid * 0.7 * Math.min(hpR, lifeR));
  };

  R.rank = {
    dmg: { 1: 1, 2: 1.25, 3: 1.55 },
    slowTime: { 1: 1, 2: 1.15, 3: 1.3 },
    heal: { 1: 1, 2: 1.1, 3: 1.2 },
    hp: { 1: 1, 2: 1.15, 3: 1.3 }
  };
  R.rankOf = function (table, lv) { return table[lv] || table[1]; };

  /* 炮是地面溅射，打不着飞妖。弓、寒冰、破阵弹道、佛光脉冲打得着。 */
  R.hitsFlyer = function (type) {
    return type === 'arrow' || type === 'frost' || type === 'siege' || type === 'heal';
  };
  /* 飞妖伤害门。返回 true 表示这一下要取消。炮、英雄、法宝、大招、援军都取消。 */
  R.blockFlyer = function (hit) {
    if (!hit || !hit.flyer) return false;
    if (hit.cannon) return true;
    if (hit.tower || hit.combo) return false;
    return true;
  };
  R.towerUntargetable = function (tdOn) { return !!tdOn; };

  R.COMBOS = {
    sixiang: { name: '四象回春', sec: 16 },
    wuxing: { name: '五行相生', sec: 16 },
    liuhe: { name: '六合锁空', sec: 16 },
    qixing: { name: '七星坠野', sec: 17 },
    bagua: { name: '天罗地网', sec: 18 }
  };
  /* 人数下限。某阵自己的人数就是它的阵位数，四象 4 人到八卦 8 人。 */
  R.FORM_MIN = 4;
  R.FORM_MAX = 8;
  /* 唐僧在阵里时，给阵中其他人的护持。不改英雄伤害。 */
  R.TANG_GUARD = { dr: 0.08, regen: 3 };
  R.FORM_EFFECT = {
    sixiang: { dr: 0.10 },
    wuxing: { dmg: 0.08 },
    liuhe: { dr: 0.08 },
    qixing: { slow: 0.15 },
    bagua: { dmg: 0.12, dr: 0.15 }
  };
  R.charge = function (cur, dt, sec) { return Math.min(1, (cur || 0) + (dt || 0) / (sec || 16)); };

  /* 每波额外飞妖。第一关不走这里。 */
  R.flyerPack = function (levelId, wave) {
    var lv = levelId | 0, n = wave | 0;
    if (lv < 2) return { bat: 0, owl: 0 };
    if (lv === 2) return { bat: 2, owl: n % 3 === 2 ? 1 : 0 };
    return { bat: 3, owl: n % 2 === 1 ? 1 : 0 };
  };

  /* 弓 ×1.3 对飞妖；炮不对空（调用方直接不打）；破阵对 tank/shield/elite ×1.4。返回额外倍率（0 表示不加）。 */
  R.counterExtra = function (towerType, enemy) {
    enemy = enemy || {};
    if (towerType === 'arrow' && enemy.fly) return 0.3;
    if (towerType === 'cannon' && enemy.fly) return -1;
    if (towerType === 'siege' && (enemy.type === 'tank' || enemy.type === 'shield' || enemy.type === 'elite' || enemy.elite)) return 0.4;
    return 0;
  };

  R.snapRadius = function (zoom) { return Math.max(60, 44 / (zoom || 1)); };

  /* 推荐位：沿路线累计距离取点，再沿法线偏出。不使用屏幕坐标。
   * route.at(s) 返回 {x,y,a}。第三关是前方 2 个加营地四向各 1 个。 */
  R.spots = function (levelId, route, camp) {
    var out = [], i, dists = (levelId | 0) >= 3 ? [420, 860] : [240, 520, 880, 1280, 1760];
    for (i = 0; i < dists.length; i++) {
      var s = Math.max(80, Math.min(route.total * 0.82, dists[i]));
      var p = route.at(s);
      var nx = -Math.sin(p.a), ny = Math.cos(p.a), side = i % 2 ? 1 : -1;
      out.push({ x: p.x + nx * 96 * side, y: p.y + ny * 96 * side, s: s, kind: 'road', i: out.length });
    }
    if ((levelId | 0) >= 3 && camp) {
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (i = 0; i < dirs.length; i++) {
        out.push({ x: camp.x + dirs[i][0] * 140, y: camp.y + dirs[i][1] * 140, s: route.total * 0.5, kind: 'camp', i: out.length });
      }
    }
    return out;
  };

  R.snap = function (x, y, spots, zoom) {
    var rad = R.snapRadius(zoom), best = null, bd = rad, i, d, dx, dy;
    for (i = 0; i < spots.length; i++) {
      dx = spots[i].x - x; dy = spots[i].y - y; d = Math.sqrt(dx * dx + dy * dy);
      if (d <= bd) { bd = d; best = spots[i]; }
    }
    return best;
  };

  R.hitSize = function (zoom) { return Math.max(44, 44 / (zoom || 1)); };

  /* 阵效叠加进联防、香火之后，总和不超过 cap。返回还能加上的比例。 */
  R.room = function (used, add, cap) {
    cap = cap == null ? 0.5 : cap;
    return Math.max(0, Math.min(add, cap - (used || 0)));
  };

  /* 阵眼在圆心。其余人按这个阵自己的方位站。八卦留一个生门，不算人。 */
  function ringSlots(labels, radius, skipAt) {
    var n = labels.length + (skipAt == null ? 0 : 1), slots = [{ eye: true, x: 0, y: 0, label: '阵眼' }], k = 0, i, a;
    for (i = 0; i < n; i++) {
      a = -Math.PI / 2 + i * Math.PI * 2 / n;
      if (skipAt != null && i === skipAt) continue;
      slots.push({ x: Math.cos(a) * radius, y: Math.sin(a) * radius, label: labels[k++] });
    }
    return slots;
  }
  R.FORMATIONS = [
    { id: 'sixiang', name: '四象阵', who: 'line', unlock: 3, size: 4,
      slots: ringSlots(['青龙', '白虎', '朱雀'], 100),
      effect: '阵内少挨一成。唐僧在阵再护持。',
      short: '4 人。阵眼居中，三灵环绕' },
    { id: 'wuxing', name: '五行阵', who: 'line', unlock: 3, size: 5,
      slots: ringSlots(['金', '木', '水', '火'], 112),
      effect: '阵内天兵伤害略高。',
      short: '5 人。阵眼为土，四方为金木水火' },
    { id: 'liuhe', name: '六合阵', who: 'line', unlock: 3, size: 6,
      slots: ringSlots(['东', '南', '西', '北', '天'], 120),
      effect: '阵内少挨一成。连携能定飞妖。',
      short: '6 人。阵眼在中，五方合围' },
    { id: 'qixing', name: '七星阵', who: 'line', unlock: 3, size: 7,
      slots: ringSlots(['天璇', '天玑', '天权', '玉衡', '开阳', '摇光'], 128),
      effect: '阵心附近的妖怪更慢。',
      short: '7 人。阵眼为枢，六星环列' },
    { id: 'bagua', name: '八卦阵', who: 'line', unlock: 3, size: 8,
      slots: ringSlots(['乾', '坤', '震', '巽', '坎', '离', '艮'], 140, 5),
      gap: (function () { var a = -Math.PI / 2 + 5 * Math.PI * 2 / 8; return { x: Math.cos(a) * 140, y: Math.sin(a) * 140, label: '生' }; })(),
      effect: '天兵略强，人少挨一成半。',
      short: '8 人。阵眼居中，七方有人，兑位是生门' }
  ];
  R.formById = function (id) {
    for (var i = 0; i < R.FORMATIONS.length; i++) if (R.FORMATIONS[i].id === id) return R.FORMATIONS[i];
    return null;
  };
  R.filled = function (seats) {
    var n = 0, i;
    for (i = 0; i < (seats || []).length; i++) if (seats[i]) n++;
    return n;
  };
  /* 不满 4 人不能成阵。每种阵还要坐满自己的阵位。 */
  R.formOk = function (def, seats) {
    var n = R.filled(seats);
    if (!def || n < R.FORM_MIN || n > R.FORM_MAX) return false;
    return n === def.size;
  };
  R.isTang = function (u) { return !!(u && u.id === 'tang' && !u.type); };
  R.unlocked = function (levelId) {
    if ((levelId | 0) < 3) return [];
    return R.FORMATIONS.slice();
  };

  R.FLY_HINT = '这一关有飞妖。飞妖直扑唐僧，只有天兵能打。';
  R.GUIDE2 = [
    { id: 'wait', text: '出发前先安排天兵。现在时间不走，怪也不会出来。飞妖只有天兵打得着。' },
    { id: 'pick', text: '点选一名已经在场的弓兵。' },
    { id: 'move', text: '把他调到唐僧前方的推荐位。虚线是他现在的真实射程。' },
    { id: 'hire', text: '再请一名已经有、也买得起的天兵。弓打飞妖，炮清地面上的一群，寒冰拖慢，破阵攻坚，佛光回血。' },
    { id: 'detail', text: '点开他，可以升级、犒赏或遣返。升级会把寿命补满。' },
    { id: 'go', text: '天兵守沿途，英雄去做任务。布置好了，自己点出发。' }
  ];
  R.GUIDE3 = [
    { id: 'open', text: '第三关可以布阵。点「阵型」，先看每阵要几个人。' },
    { id: 'sixiang', text: '选四象阵：一共 4 人，阵眼居中。唐僧、天兵、徒弟都能入。' },
    { id: 'confirm', text: '点阵位，再点人放入。不满 4 人不能成阵。站稳半秒才算成阵。' },
    { id: 'break', text: '阵员阵亡或天兵被遣返，阵效马上停。天兵不会被妖怪打死。唐僧仍沿路走。' },
    { id: 'bagua', text: '八卦阵是 8 人阵：阵眼在中，七个方位，兑位留作生门。' },
    { id: 'go', text: '五行、六合、七星的人数在阵名旁边。人数够了再确认，然后点出发。' }
  ];

  R.widgets = function (g) {
    if (!R.gate(g)) return [];
    var out = [{ act: 'tdStart' }, { act: 'tdTab', id: 'tower' }];
    if (R.formationOn(g)) out.push({ act: 'tdTab', id: 'form' });
    return out;
  };

  root.TDRules = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R;
})(typeof window !== 'undefined' ? window : globalThis);
