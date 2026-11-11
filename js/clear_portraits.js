/* 人物与暂停页走宣纸、红印、墨条。不套运行时滤镜。 */
(function () {
  'use strict';
  var XY = window.XY;
  if (!XY) return;
  window.XY_X_AVATARS = null;
  if (document.head) {
    var css = document.createElement('style');
    css.textContent = '@font-face{font-family:"Ma Shan Zheng";src:url("assets/fonts/MaShanZheng-Regular.ttf") format("truetype");font-display:swap}';
    document.head.appendChild(css);
  }
  var BRUSH = '"Ma Shan Zheng","TDBrush","KaiTi",serif';

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
  function brush(c, text, x, y, size, col, align) {
    c.save();
    c.font = size + 'px ' + BRUSH;
    c.fillStyle = col || '#24180f';
    c.textAlign = align || 'left';
    c.textBaseline = 'middle';
    c.fillText(text, x, y);
    c.restore();
  }
  function sealBtn(c, K, x, y, w, h, label, act, ex, solid) {
    var VU = XY.villainUI;
    if (VU && solid && VU.drawSeal) VU.drawSeal(c, x, y, w, h, label, { style: 'solid', col: '#b8322a', sz: Math.min(22, h * 0.42), rot: -0.02, stack: false });
    else if (VU && VU.drawBrush) VU.drawBrush(c, x, y, w, h, label, { strong: true, sz: Math.min(18, h * 0.36) });
    else brush(c, label, x + w / 2, y + h / 2, 18, '#24180f', 'center');
    if (K.hit) K.hit(x, y, w, Math.max(44, h), act, ex || null);
  }

  function tidyPause(c, G, a) {
    var P = XY.pv2;
    if (!P || !P.begin || !G) return false;
    var K = P.begin(c, a);
    var W = K.W, H = K.H, port = H > W * 1.02;
    if (P.paper) P.paper(c, W, H);
    var hero = G.heroes[G.ctrl] || G.heroes[1];
    var hid = hero && ((hero.def && hero.def.id) || hero.id);
    var colW = port ? W - 28 : Math.min(520, W * 0.42);
    var autoN = XY.auto && XY.auto.LABEL ? 1 : 0;
    var ctrlH = 100 + 44 + 44 + 44 + 52 + autoN * 52 + 36;
    var figH, figX, foot;
    if (port) {
      var panelTop = Math.max(48, H - 12 - ctrlH);
      figH = Math.max(64, Math.min(H * 0.42, panelTop - 28));
      figX = W / 2;
      foot = 16 + figH;
      if (foot + 8 > panelTop) foot = panelTop - 8;
    } else {
      figH = H - 24;
      figX = W * 0.28;
      foot = H - 12;
    }
    var im = pauseArt(hid);
    c.save();
    c.filter = 'none';
    if (im) {
      var sc = figH / im.naturalHeight;
      var dw = im.naturalWidth * sc;
      c.drawImage(im, figX - dw / 2, foot - figH, dw, figH);
    }
    c.restore();
    var x = port ? 14 : W - colW - 28;
    var y0 = port ? Math.max(foot + 8, H - 12 - ctrlH) : 28;
    var ph = port ? H - y0 - 16 : H - 48;
    var VU = XY.villainUI;
    if (VU && VU.artCard) VU.artCard(c, x, y0, colW, ph, { seed: 9, paper: '#f6edd8', edge: '#2a2118' });
    else {
      c.fillStyle = '#f6edd8';
      c.fillRect(x, y0, colW, ph);
      c.strokeStyle = '#2a2118';
      c.strokeRect(x, y0, colW, ph);
    }
    var pad = 18, inner = colW - pad * 2, y = y0 + 36;
    brush(c, '暂驻', x + pad, y, port ? 32 : 40, '#a83224', 'left');
    y += 28;
    brush(c, (XY.lvPre ? XY.lvPre(G) : '') + ((G.lv && G.lv.name) || ''), x + pad, y, 16, '#5c4a38', 'left');
    y += 26;
    brush(c, '已坚持 ' + XY.fmtTime(G.t) + '    Lv' + G.level + '  击杀 ' + XY.fmtNum(G.kills), x + pad, y, 16, '#24180f', 'left');
    var short = port && H < 720;
    var rows = [
      { label: '继续', act: 'resume', solid: true, h: short ? 44 : 56 },
      { label: '重新开始', act: 'restart', h: short ? 44 : 48 },
      { label: '回到首页', act: 'home', h: short ? 44 : 48 }
    ];
    var rest = y0 + ph - 16 - y;
    var used = rows[0].h + rows[1].h + rows[2].h + 52 + (XY.auto && XY.auto.LABEL ? 52 : 0) + 24;
    var gap = Math.max(4, Math.min(14, (rest - used) / 6));
    y += gap;
    rows.forEach(function (r) {
      sealBtn(c, K, x + pad, y, inner, r.h, r.label, r.act, null, r.solid);
      y += r.h + gap;
    });
    brush(c, '音效', x + pad, y + 22, 16, '#5c4a38', 'left');
    var muted = !!(XY.audio && XY.audio.mute);
    sealBtn(c, K, x + pad + 56, y, 72, 44, '开', 'muteSet', { mute: false }, !muted);
    sealBtn(c, K, x + pad + 136, y, 88, 44, '关', 'muteSet', { mute: true }, muted);
    y += 52;
    if (XY.auto && XY.auto.LABEL) {
      var keys = ['points', 'treat', 'guest', 'pick'];
      var aw = inner / keys.length;
      keys.forEach(function (key, i) {
        sealBtn(c, K, x + pad + i * aw, y, aw - 6, 44, XY.auto.LABEL[key], 'autoTog', { key: key }, !!XY.auto.get(key));
      });
      y += 52;
    }
    brush(c, '小怪 +' + Math.round(XY.C.ENEMY_SCALE * G.t / 60 * 100) + '%   首领 +' + Math.round(XY.C.BOSS_SCALE * G.t / 60 * 100) + '%', x + pad, Math.min(y0 + ph - 22, y + 16), 14, '#5c4a38', 'left');
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
