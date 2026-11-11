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
      if (!U.hold) return;
      if (app && app.rt > U.until) { U.skip(); return; }
      ctx.save();
      ctx.setTransform(app.zoom * app.dpr, 0, 0, app.zoom * app.dpr, 0, 0);
      U.paint(ctx, app, U.hold);
      ctx.restore();
    }
    render._ult = 1;
    XY.render = render;
  }
  hook();
  window.addEventListener('pointerdown', function () { if (U.hold) U.skip(); }, true);
})();
