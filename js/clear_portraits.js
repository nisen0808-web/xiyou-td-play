/* 灰色残影来自失败的阈值头像和运行时滤镜。头像改读仓库里认可过的彩色 X 照片，画的时候不再套滤镜。
 * 不替换成另一套立绘，也不关掉已认可的狂野水墨动画。 */
(function () {
  'use strict';
  var XY = window.XY;
  if (!XY) return;
  window.XY_X_AVATARS = null;

  var FIVE = { tang: 1, wukong: 1, bajie: 1, wujing: 1, horse: 1 };
  var cache = {};
  function fileIm(src) {
    var im = cache[src];
    if (!im) {
      im = cache[src] = new Image();
      im.src = src;
    }
    return im.complete && im.naturalWidth ? im : null;
  }
  function pauseArt(id) {
    if (!id) return null;
    if (FIVE[id]) return fileIm('assets/art/menu-v5/fig_' + id + '.webp');
    return fileIm('assets/art/bg/' + id + '.webp');
  }

  function tidyPause(c, G, a) {
    var P = XY.pv2;
    if (!P || !P.begin || !G) return false;
    var K = P.begin(c, a);
    var W = K.W, H = K.H, port = H > W * 1.02;
    if (P.paper) P.paper(c, W, H);
    var hero = G.heroes[G.ctrl] || G.heroes[1];
    var hid = hero && ((hero.def && hero.def.id) || hero.id);
    var colW = Math.min(460, port ? W - 24 : Math.min(440, W * 0.38));
    var figH = port ? Math.min(H * 0.42, 380) : Math.min(H - 36, 620);
    var figSpan = figH * 0.62;
    var groupW = figSpan + 28 + colW;
    var groupX = port ? 12 : Math.max(16, (W - groupW) / 2);
    var figX = port ? W / 2 : groupX + figSpan * 0.5;
    var foot = port ? 48 + figH : H - 18;
    var im = pauseArt(hid);
    c.save();
    c.filter = 'none';
    if (im) {
      var sc = figH / im.naturalHeight;
      var dw = im.naturalWidth * sc;
      c.drawImage(im, figX - dw / 2, foot - figH, dw, figH);
    } else if (hid && XY.heroink && XY.heroink.portrait) {
      XY.heroink.portrait(c, hid, figX, foot, figH);
    }
    c.restore();
    var x = port ? 12 : groupX + figSpan + 20;
    var w = port ? W - 24 : colW;
    var y = port ? foot + 12 : 78;
    var panelY = Math.max(12, y - 52);
    var panelH = Math.max(120, H - panelY - 12);
    c.save();
    c.fillStyle = 'rgba(246,239,224,0.94)';
    c.fillRect(x - 16, panelY, w + 32, panelH);
    c.strokeStyle = 'rgba(58,50,38,0.35)';
    c.strokeRect(x - 16, panelY, w + 32, panelH);
    c.restore();
    K.t('暂驻', x, y - 18, port ? 28 : 34, '#a42d19', 'left', true);
    var name = (XY.lvPre ? XY.lvPre(G) : '') + ((G.lv && G.lv.name) || '') + '」';
    if (K.tf) K.tf(name, x, y + 6, w, 15, '#6d6455', 'left', false, 12);
    y += 28;
    K.t('已坚持 ' + XY.fmtTime(G.t), x, y, 18, '#3a3226', 'left', true);
    K.t('Lv ' + G.level + ' · 击杀 ' + XY.fmtNum(G.kills), x, y + 26, 16, '#3a3226', 'left', true);
    y += 52;
    K.btn(x, y, w, 52, '继续 · Esc / P', 'resume', null, { primary: true, size: 22 });
    y += 60;
    var half = (w - 10) / 2;
    K.btn(x, y, half, 48, '重新开始 · R', 'restart', null, { size: 16 });
    K.btn(x + half + 10, y, half, 48, '回到首页', 'home', null, { size: 16 });
    y += 56;
    var muted = !!(XY.audio && XY.audio.mute);
    K.t('音效', x, y + 24, 15, '#6d6455', 'left', false);
    var bw = Math.min(96, (w - 70) / 2);
    K.btn(x + 52, y, bw, 48, '开', 'muteSet', { mute: false }, { on: !muted, size: 16 });
    K.btn(x + 60 + bw, y, bw + 16, 48, '关 · M', 'muteSet', { mute: true }, { on: muted, size: 16 });
    y += 56;
    if (XY.auto && XY.auto.LABEL) {
      K.t('自动', x, y + 24, 15, '#6d6455', 'left', false);
      var keys = ['points', 'treat', 'guest', 'pick'];
      var aw = (w - 52) / keys.length;
      keys.forEach(function (key, i) {
        K.btn(x + 52 + i * aw, y, Math.max(44, aw - 6), 48, XY.auto.LABEL[key], 'autoTog', { key: key }, { on: XY.auto.get(key), size: 14 });
      });
      y += 56;
    }
    var tip = '小怪 +' + Math.round(XY.C.ENEMY_SCALE * G.t / 60 * 100) + '% · BOSS +' + Math.round(XY.C.BOSS_SCALE * G.t / 60 * 100) + '%（每分钟 +1% / +5%）';
    if (K.tf) K.tf(tip, x, Math.min(H - 28, y + 4), w, 13, '#6d6455', 'left', false, 11);
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
