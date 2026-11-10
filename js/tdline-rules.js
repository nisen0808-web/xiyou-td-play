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
    sancai: { name: '佛光护行', sec: 16 },
    yanyue: { name: '寒锋横扫', sec: 16 },
    bagua: { name: '天罗地网', sec: 18 },
    jinchan: { name: '金蝉引怪', sec: 16 },
    sixiang: { name: '四象守营', sec: 18 },
    fengshi: { name: '锋矢破阵', sec: 16 }
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

  R.FORMATIONS = [
    { id: 'sancai', name: '三才护法阵', who: 'tower', unlock: 3,
      need: { arrow: 2, heal: 1 },
      slots: [{ type: 'arrow', x: 90, y: 80 }, { type: 'arrow', x: 90, y: -80 }, { type: 'heal', x: -60, y: 0 }],
      effect: '佛光对本阵两名弓兵的治疗 +15%',
      short: '不能清群，也拆不动硬目标' },
    { id: 'yanyue', name: '偃月寒锋阵', who: 'tower', unlock: 3,
      need: { frost: 1, cannon: 2 },
      slots: [{ type: 'frost', x: 70, y: 0 }, { type: 'cannon', x: -60, y: 100 }, { type: 'cannon', x: -60, y: -100 }],
      effect: '炮弹主目标正被本阵寒冰减速时，溅射半径 +15%',
      short: '不能对空，也拆不了远处的塔' },
    { id: 'bagua', name: '金刚八卦阵', who: 'tower', unlock: 3, camp: true, min: 5,
      effect: '围营全员伤害 +15%、受伤 −20%，佛光盖住整环',
      short: '唐僧离营后天兵不跟，散阵后 8 秒没有加成，生门没人拦' },
    { id: 'jinchan', name: '金蝉护法阵', who: 'hero', unlock: 3, order: 'guard', min: 2,
      slots: [{ x: 60, y: 0 }, { x: -50, y: 50 }, { x: -50, y: -50 }],
      effect: '在位嘲讽 ×0.8，唐僧被选中的权重 +1，移速 −10%',
      short: '不离唐僧 90 以外追击' },
    { id: 'sixiang', name: '四象守营阵', who: 'hero', unlock: 3, order: 'station', min: 2, camp: true,
      slots: [{ x: 110, y: 0 }, { x: -110, y: 0 }, { x: 0, y: 110 }, { x: 0, y: -110 }],
      effect: '营地受伤 ×0.85，在位每秒回血 +0.8',
      short: '只追 160 以内的怪，不管远处' },
    { id: 'fengshi', name: '锋矢破围阵', who: 'hero', unlock: 3, min: 3, camp: true,
      slots: [{ role: 'van', x: 160, y: 0 }, { x: 50, y: 90 }, { x: 50, y: -90 }],
      effect: '集火营地前方 120°、300 以内的一名精英，对它伤害 +12%',
      short: '对 Boss 和妖塔不加，没有营地减伤，背后容易漏' }
  ];
  R.formById = function (id) {
    for (var i = 0; i < R.FORMATIONS.length; i++) if (R.FORMATIONS[i].id === id) return R.FORMATIONS[i];
    return null;
  };
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
    { id: 'open', text: '第三关可以布阵。点「阵型」。' },
    { id: 'sancai', text: '选三才护法阵：两名弓兵在前，佛光在后。没有佛光就会显示缺员。' },
    { id: 'confirm', text: '选阵心，看槽位，再确认。站稳半秒才算成阵。' },
    { id: 'break', text: '徒弟阵亡、天兵被遣返或离开槽位，阵效马上停。天兵不会被妖怪打死。脚步抖开有三秒宽限。' },
    { id: 'jinchan', text: '再选金蝉护法阵，把两位徒弟设为守护，站到唐僧身前。' },
    { id: 'go', text: '阵看过了。到休息点还可以换成八卦阵和四象守营阵。自己点出发。' }
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
