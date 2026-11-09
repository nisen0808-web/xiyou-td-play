/* 局内狂野水墨待机 / 出招。图集进战斗后才取，菜单不下载。
 * 时间轴来自各角色 animation.json：cycle 循环，pingpong 往返（baked 的已经展开成 cycle），oneshot 播完停住。
 */
(function (root) {
  'use strict';
  function sum(ds) {
    var t = 0, i;
    for (i = 0; i < ds.length; i++) t += ds[i];
    return t;
  }
  function sequence(clip) {
    var d = clip.durationsMs, n = d.length, seq = [], i;
    if (clip.loopPolicy === 'pingpong' && !clip.baked && n > 1) {
      for (i = 0; i < n; i++) seq.push(i);
      for (i = n - 2; i > 0; i--) seq.push(i);
    } else {
      for (i = 0; i < n; i++) seq.push(i);
    }
    return seq;
  }
  /* tMs 处的帧。oneshot 超过总长则 done，停在最后一帧。 */
  function frameAt(clip, tMs) {
    var seq = sequence(clip), durs = clip.durationsMs, spans = [], total = 0, i, acc, t;
    for (i = 0; i < seq.length; i++) { spans.push(durs[seq[i]]); total += durs[seq[i]]; }
    if (!seq.length || total <= 0) return { index: 0, done: true, total: 0 };
    var oneshot = clip.loopPolicy === 'oneshot';
    if (oneshot && tMs >= total) return { index: seq[seq.length - 1], done: true, total: total };
    t = oneshot ? Math.max(0, tMs) : ((tMs % total) + total) % total;
    acc = 0;
    for (i = 0; i < seq.length; i++) {
      acc += spans[i];
      if (t < acc) return { index: seq[i], done: false, total: total };
    }
    return { index: seq[seq.length - 1], done: !!oneshot, total: total };
  }
  /* 出招是一次性的。没有出招包（币圈老司机）时 edge 不离开待机。播完回到待机。 */
  /* Boss 战姿势名 → 狂野水墨片段。没有对应片段时返回 null，调用方继续画旧图。
   * 牛魔王：待机 / 出招 / 受击。队伍和特殊人物：待机和普攻；走路、蓄力、格挡、必杀仍走旧图。 */
  function poseClip(id, pose) {
    if (!pose) return null;
    if (id === 'niumo') {
      if (pose === 'hit' || pose === 'hit_a') return 'hit';
      if (pose === 'attack' || pose === 'swing' || pose === 'swing_a' || pose === 'swing_b' || pose === 'smash' || pose === 'smash_a') return 'attack';
      if (pose === 'stance' || pose === 'idle' || pose === 'idle_a' || pose === 'idle_b' || pose === 'idle2') return 'idle';
      return null;
    }
    if (pose === 'attack' || pose === 'attack_a' || pose === 'attack_b' || pose === 'attack_c') return 'attack';
    if (pose === 'stance' || pose === 'idle' || pose === 'idle_a' || pose === 'idle_b') return 'idle';
    return null;
  }
  function step(state, dtMs, edge, attackClip) {
    if (!state) state = { mode: 'idle', t: 0 };
    if (edge && attackClip) return { mode: 'attack', t: 0 };
    if (state.mode === 'attack' && attackClip) {
      var total = sum(attackClip.durationsMs);
      var t = state.t + (dtMs || 0);
      if (t >= total) return { mode: 'idle', t: 0 };
      return { mode: 'attack', t: t };
    }
    return { mode: 'idle', t: (state.mode === 'idle' ? state.t : 0) + (dtMs || 0) };
  }
  var W = {
    base: 'assets/wild/',
    data: null,
    imgs: {},
    status: 'idle',
    promise: null,
    frameAt: frameAt,
    step: step,
    sum: sum,
    poseClip: poseClip
  };
  function ingest(data) {
    if (!data || !data.ids) throw new Error('wild manifest missing ids');
    W.data = data;
    return Object.keys(data.ids);
  }
  W.ingest = ingest;
  W.knows = function (id) {
    return !!(W.data && W.data.ids && W.data.ids[id] && W.data.ids[id].idle);
  };
  W.clip = function (id, name) {
    var row = W.data && W.data.ids && W.data.ids[id];
    return row && row[name] ? row[name] : null;
  };
  W.ready = function (id, name) {
    var im = W.imgs[id + '/' + name];
    return !!(im && im.complete && im.naturalWidth > 0);
  };
  W.img = function (id, name) { return W.imgs[id + '/' + name] || null; };
  function loadImg(url) {
    return new Promise(function (resolve, reject) {
      var im = new Image();
      im.onload = function () { if (im.naturalWidth > 0) resolve(im); else reject(new Error(url)); };
      im.onerror = function () { reject(new Error(url)); };
      im.src = url;
    });
  }
  /* 只在进入战斗时调用。菜单页不取图集。 */
  W.arm = function () {
    if (W.promise) return W.promise;
    if (typeof fetch !== 'function' || typeof Image !== 'function') return Promise.reject(new Error('no image loader'));
    W.status = 'loading';
    W.promise = fetch(W.base + 'manifest.json').then(function (r) {
      if (!r.ok) throw new Error('manifest ' + r.status);
      return r.json();
    }).then(function (data) {
      var ids = ingest(data), jobs = [], i, names, n;
      for (i = 0; i < ids.length; i++) {
        names = ['idle', 'attack'];
        for (n = 0; n < names.length; n++) {
          (function (id, name) {
            var clip = data.ids[id][name];
            if (!clip || !clip.file) return;
            jobs.push(loadImg(W.base + clip.file).then(function (im) { W.imgs[id + '/' + name] = im; }, function () { }));
          })(ids[i], names[n]);
        }
      }
      return Promise.all(jobs);
    }).then(function () { W.status = 'ready'; return W; }, function (e) { W.status = 'fail'; W.promise = null; throw e; });
    return W.promise;
  };
  root.XY = root.XY || {};
  root.XY.wildAnim = W;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { frameAt: frameAt, step: step, sum: sum, poseClip: poseClip, ingest: ingest, api: W };
  }
})(typeof window !== 'undefined' ? window : globalThis);
