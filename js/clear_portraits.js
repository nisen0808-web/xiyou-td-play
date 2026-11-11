/* 人物图只走预先抠好的清晰水墨，不再套狂野水墨残影图集，也不在画的时候加滤镜。 */
(function () {
  'use strict';
  var XY = window.XY;
  if (!XY) return;
  window.XY_NO_WILD = true;
  if (XY.chibi) XY.chibi.wildOff = true;
  /* 内联的 X 头像是失败的阈值残图。改读仓库里重新从清晰立绘裁出的头像。 */
  window.XY_X_AVATARS = null;

  var IDS = { tang: 1, wukong: 1, bajie: 1, wujing: 1, horse: 1 };
  var cache = {};
  function plate(id) {
    if (!IDS[id]) return null;
    var im = cache[id];
    if (!im) {
      im = cache[id] = new Image();
      im.src = 'assets/art/hero-clear/' + id + '.png';
    }
    return im.complete && im.naturalWidth ? im : null;
  }
  XY.clearPortraits = { img: plate, ids: IDS };

  if (XY.heroink && XY.heroink.portrait) {
    var oldPortrait = XY.heroink.portrait;
    XY.heroink.portrait = function (c, id, x, foot, h) {
      var im = plate(id);
      if (!im) return oldPortrait(c, id, x, foot, h);
      var sc = h / im.naturalHeight;
      var w = im.naturalWidth * sc;
      c.save();
      c.filter = 'none';
      c.imageSmoothingEnabled = true;
      c.imageSmoothingQuality = 'high';
      c.drawImage(im, x - w / 2, foot - h, w, h);
      c.restore();
      XY.heroink.stats.portrait++;
      return true;
    };
  }

  if (XY.MINK && XY.MINK.poseHero) {
    var oldPose = XY.MINK.poseHero;
    XY.MINK.poseHero = function (c, h) {
      var id = h && ((h.def && h.def.id) || h.id);
      if (h && !h.down && id && ((XY.CHIBI_INK && XY.CHIBI_INK[id]) || (XY.CHIBI && XY.CHIBI[id]))) return false;
      return oldPose.apply(this, arguments);
    };
  }

  function tidyPause(c, G, a) {
    var P = XY.pv2;
    if (!P || !P.begin || !G) return false;
    var K = P.begin(c, a);
    var W = K.W, H = K.H, port = H > W * 1.02;
    if (P.paper) P.paper(c, W, H);
    var gap = 78;
    K.t('暂驻', 24, port ? 34 : 40, port ? 30 : 38, '#a42d19', 'left', true);
    var name = (XY.lvPre ? XY.lvPre(G) : '') + ((G.lv && G.lv.name) || '') + '」';
    if (K.tf) K.tf(name, 24, port ? 64 : 70, port ? W - 48 : W * 0.4, 14, '#6d6455', 'left', false, 11);
    var hero = G.heroes[G.ctrl] || G.heroes[1];
    var hid = hero && ((hero.def && hero.def.id) || hero.id);
    var figH = port ? Math.min(220, H * 0.28) : Math.min(H - gap - 24, 460);
    var figX = port ? W / 2 : Math.min(W * 0.22, 220);
    var foot = port ? 84 + figH : H - gap - 4;
    c.save();
    c.filter = 'none';
    var drew = hid && XY.heroink && XY.heroink.portrait && XY.heroink.portrait(c, hid, figX, foot, figH);
    if (!drew && hero && XY.chibi && XY.chibi.portrait) drew = XY.chibi.portrait(c, hero.id, figX, foot, figH, 1);
    c.restore();
    var colW = Math.min(420, port ? W - 32 : W * 0.46);
    var x = port ? 16 : Math.max(figX + figH * 0.38, W - colW - 28);
    var w = colW;
    var y = port ? foot + 18 : 104;
    K.t('已坚持 ' + XY.fmtTime(G.t), x, y, 16, '#3a3226', 'left', true);
    K.t('Lv ' + G.level + ' · 击杀 ' + XY.fmtNum(G.kills), x, y + 26, 15, '#3a3226', 'left', true);
    y += 46;
    K.btn(x, y, w, 48, '继续 · Esc / P', 'resume', null, { primary: true, size: 20 });
    y += 56;
    var half = (w - 10) / 2;
    K.btn(x, y, half, 44, '重新开始 · R', 'restart', null, { size: 15 });
    K.btn(x + half + 10, y, half, 44, '回到首页', 'home', null, { size: 15 });
    y += 54;
    var muted = !!(XY.audio && XY.audio.mute);
    K.t('音效', x, y + 22, 14, '#6d6455', 'left', false);
    var bw = Math.min(92, (w - 64) / 2);
    K.btn(x + 50, y, bw, 44, '开', 'muteSet', { mute: false }, { on: !muted, size: 16 });
    K.btn(x + 58 + bw, y, bw + 16, 44, '关 · M', 'muteSet', { mute: true }, { on: muted, size: 15 });
    y += 52;
    if (XY.auto && XY.auto.LABEL) {
      K.t('自动', x, y + 22, 14, '#6d6455', 'left', false);
      var keys = ['points', 'treat', 'guest', 'pick'];
      var aw = (w - 50) / keys.length;
      keys.forEach(function (key, i) {
        K.btn(x + 50 + i * aw, y, aw - 6, 44, XY.auto.LABEL[key], 'autoTog', { key: key }, { on: XY.auto.get(key), size: 13 });
      });
      y += 52;
    }
    var tip = '小怪 +' + Math.round(XY.C.ENEMY_SCALE * G.t / 60 * 100) + '% · BOSS +' + Math.round(XY.C.BOSS_SCALE * G.t / 60 * 100) + '%（每分钟 +1% / +5%）';
    if (K.tf) K.tf(tip, x, Math.min(H - gap, y + 8), w, 12, '#6d6455', 'left', false, 10);
    if (P.end) P.end(c);
    return true;
  }

  if (XY.ov) {
    XY.ov.pause = function (c, G, a) {
      if (!tidyPause(c, G, a) && XY.ov._pauseInk) XY.ov._pauseInk(c, G, a);
    };
  }

  setTimeout(function () {
    if (!XY.render) return;
    var prev = XY.render;
    XY.render = function (ctx) {
      if (ctx) {
        ctx.filter = 'none';
        ctx.globalCompositeOperation = 'source-over';
      }
      return prev.apply(this, arguments);
    };
  }, 0);
})();
