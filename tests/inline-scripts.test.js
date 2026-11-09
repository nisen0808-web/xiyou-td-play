/* 抽出 index.html 和 index-split.html 里每一个内联 <script>，用 node --check 做语法检查。
 * 商店脚本曾经多一个 }，整段解析失败，新手教程跟着坏掉。这里拦住同样的漏网。
 * 运行：node tests/inline-scripts.test.js
 */
'use strict';
var fs = require('fs');
var os = require('os');
var path = require('path');
var spawnSync = require('child_process').spawnSync;

var ROOT = path.resolve(__dirname, '..');
var FILES = ['index.html', 'index-split.html'];

function fail(msg) { throw new Error(msg); }

function extract(file) {
  var lines = fs.readFileSync(file, 'utf8').split('\n');
  var scripts = [];
  var inScript = false, start = 0, buf = [];
  var n, line, m, after, endIdx;
  for (n = 0; n < lines.length; n++) {
    line = lines[n];
    if (!inScript) {
      m = line.match(/<script\b([^>]*)>/i);
      if (!m) continue;
      if (/\bsrc\s*=/i.test(m[1] || '')) continue;
      after = line.slice(line.indexOf(m[0]) + m[0].length);
      endIdx = after.search(/<\/script>/i);
      if (endIdx >= 0) scripts.push({ start: n + 1, end: n + 1, code: after.slice(0, endIdx) });
      else { inScript = true; start = n + 1; buf = [after]; }
    } else {
      endIdx = line.search(/<\/script>/i);
      if (endIdx >= 0) {
        buf.push(line.slice(0, endIdx));
        scripts.push({ start: start, end: n + 1, code: buf.join('\n') });
        inScript = false;
        buf = [];
      } else buf.push(line);
    }
  }
  if (inScript) fail(path.basename(file) + ' has an unclosed inline script from line ' + start);
  return scripts;
}

function checkFile(name) {
  var file = path.join(ROOT, name);
  var scripts = extract(file);
  if (!scripts.length) fail(name + ' has no inline scripts');
  scripts.forEach(function (s, i) {
    var tmp = path.join(os.tmpdir(), 'xy-inline-' + name.replace(/\W/g, '_') + '-' + i + '.js');
    fs.writeFileSync(tmp, s.code);
    var r = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
    fs.unlinkSync(tmp);
    if (r.status !== 0) {
      var err = ((r.stderr || r.stdout || '') + '').trim();
      fail(name + ' inline script lines ' + s.start + '-' + s.end + ' failed node --check\n' + err);
    }
  });
  console.log(name + ' ' + scripts.length + ' inline scripts ok');
}

FILES.forEach(checkFile);
console.log('inline script syntax ok');
