/* 必杀高潮：按已确认的效果图切入，墨晕收边，约 1.5 秒，点按可跳过。不改伤害和冷却。 */
(function () {
  'use strict';
  var XY = window.XY;
  if (!XY) return;
  var IDS = ['tang', 'wukong', 'bajie', 'wujing', 'horse', 'phyrex', 'sisi', 'laosiji', 'kuanggong', 'haiteng', 'diaoyulao', 'yuanzhang', 'heyuxi', 'martin', 'niumo', 'arrow', 'cannon', 'frost', 'siege', 'heal'];
  var cache = {};
  var BASE = 'assets/art/ult-climax/';
  function img(id) {
    var e = cache[id];
    if (!e) {
      e = cache[id] = { im: new Image(), ok: false };
      e.im.onload = function () { e.ok = e.im.naturalWidth > 0; };
      e.im.src = BASE + id + '.jpg';
    }
    return e.ok ? e.im : null;
  }
  IDS.forEach(img);
  var U = XY.ultClimax = { hold: null, until: 0, id: null };
  U.play = function (id, app) {
    if (IDS.indexOf(id) < 0) return;
    U.id = id;
    U.hold = id;
    U.until = (app && app.rt || 0) + 1.5;
    img(id);
  };
  U.skip = function () { U.hold = null; U.id = null; };
  U.paint = function (c, app, id) {
    id = id || U.hold;
    var im = img(id);
    if (!im) return false;
    var W = app.lw, H = app.lh;
    c.save();
    c.fillStyle = 'rgba(244,234,212,0.94)';
    c.fillRect(0, 0, W, H);
    var s = Math.max(W / im.naturalWidth, H / im.naturalHeight);
    var dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    c.save();
    c.beginPath();
    c.moveTo(W * 0.04, H * 0.08);
    c.lineTo(W * 0.96, H * 0.04);
    c.lineTo(W * 0.98, H * 0.92);
    c.lineTo(W * 0.03, H * 0.96);
    c.closePath();
    c.clip();
    c.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
    c.restore();
    c.restore();
    return true;
  };
  function hook() {
    if (!XY.render || XY.render._ult) return;
    var old = XY.render;
    function render(ctx, G, app) {
      old(ctx, G, app);
      if (U.hold) {
        if (app && app.rt > U.until) U.skip();
        else {
          ctx.save();
          ctx.setTransform(app.zoom * app.dpr, 0, 0, app.zoom * app.dpr, 0, 0);
          U.paint(ctx, app, U.hold);
          ctx.restore();
        }
      }
      var q = XY.introQ;
      if (!q || !q.length || !app) { if (XY.gacha10) XY.gacha10.forceHold = false; return; }
      var id = q[0], sp = XY.SP_BY && XY.SP_BY[id];
      if (!sp) { q.shift(); return; }
      ctx.save();
      ctx.setTransform(app.zoom * app.dpr, 0, 0, app.zoom * app.dpr, 0, 0);
      if (!(XY.gacha10 && XY.gacha10.overlay && XY.gacha10.overlay())) { q.length = 0; ctx.restore(); return; }
      if (XY.gacha10) XY.gacha10.forceHold = true;
      var W = app.lw, H = app.lh, pw = Math.min(560, W - 24), ph = Math.min(280, H * 0.46);
      var x = (W - pw) / 2, y = (H - ph) / 2;
      ctx.fillStyle = '#f6efe2';
      ctx.beginPath();
      ctx.moveTo(x + 16, y + 6);
      ctx.quadraticCurveTo(x + pw * 0.5, y - 8, x + pw - 12, y + 8);
      ctx.quadraticCurveTo(x + pw + 6, y + ph * 0.5, x + pw - 10, y + ph - 8);
      ctx.quadraticCurveTo(x + pw * 0.4, y + ph + 6, x + 14, y + ph - 6);
      ctx.quadraticCurveTo(x - 6, y + ph * 0.4, x + 16, y + 6);
      ctx.fill();
      var bag = render._introArt || (render._introArt = {});
      var im = bag[id];
      if (!im) { im = bag[id] = new Image(); im.src = 'assets/art/battle-hd/' + id + '.webp'; }
      if (im.complete && im.naturalWidth) {
        var ih = ph - 36, iw = ih * im.naturalWidth / im.naturalHeight;
        ctx.drawImage(im, x + 12, y + 18, Math.min(iw, pw * 0.38), ih);
      }
      ctx.fillStyle = '#a42d19';
      ctx.font = '28px "Ma Shan Zheng","KaiTi",serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(sp.name, x + pw * 0.46, y + 48);
      ctx.fillStyle = '#24180f';
      ctx.font = '15px "Ma Shan Zheng","KaiTi",serif';
      ctx.fillText(sp.role || '', x + 24, y + 68);
      ctx.fillText('大招 ' + (sp.ult || ''), x + 24, y + 96);
      ctx.fillStyle = '#5c4a38';
      ctx.fillText('点一下收下', x + 24, y + ph - 28);
      XY._introBox = { x: x, y: y, w: pw, h: ph };
      ctx.restore();
    }
    render._ult = 1;
    XY.render = render;
  }
  hook();
  window.addEventListener('pointerdown', function (ev) {
    if (U.hold) U.skip();
    var q = XY.introQ, box = XY._introBox;
    if (!q || !q.length || !box) return;
    var id = q[0];
    var data = XY.save && XY.save.data;
    if (data) { data.intros = data.intros || {}; data.intros[id] = 1; if (XY.save.touch) XY.save.touch(); }
    q.shift();
    if (ev && ev.stopPropagation) ev.stopPropagation();
  }, true);
})();
