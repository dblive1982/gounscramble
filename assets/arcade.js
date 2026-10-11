/* GoUnscramble retro arcade: seven original games on a tiny shared engine. */
(function () {
"use strict";
var $ = function (id) { return document.getElementById(id); };
var rnd = function (n) { return Math.floor(Math.random() * n); };
var FONT = '"Press Start 2P",ui-monospace,Menlo,Consolas,monospace';
var C = { bg: "#0b0b22", teal: "#2de2e6", yel: "#ffd23f", pink: "#ff5c8a", grn: "#7cff6b", pur: "#a78bff", org: "#ff9d3d", red: "#ff4545", wht: "#f4f4ff", blu: "#3b6cff", dim: "#5a5a8a" };

/* ---------- sound ---------- */
var mute = false; try { mute = localStorage.getItem("gu-mute") === "1"; } catch (e) { /* ignore */ }
var ac = null;
function beep(f, d, type, v, f2) {
  if (mute) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === "suspended") ac.resume();
    var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    o.type = type || "square"; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v || 0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
  } catch (e) { /* ignore */ }
}

/* ---------- scores (best scores and play counts live in the saved "gs" counters) ---------- */
var mem = {};
function gsAll() { return (window.GUP && GUP.get && GUP.get("gs")) || {}; }
function bestOf(id) { return Math.max(mem[id] || 0, gsAll()["b_" + id] || 0); }
function record(id, v) {
  var prev = bestOf(id), nb = v != null && v > prev;
  if (nb) mem[id] = v;
  if (window.GUP && GUP.set) {
    var o = Object.assign({}, gsAll());
    o["a_" + id] = (o["a_" + id] || 0) + 1; o.gp = (o.gp || 0) + 1;
    if (v != null && v > (o["b_" + id] || 0)) o["b_" + id] = v;
    GUP.set("gs", o);
  }
  return nb;
}

/* ---------- engine ---------- */
var KEYMAP = { KeyA: "ArrowLeft", KeyD: "ArrowRight", KeyW: "ArrowUp", KeyS: "ArrowDown", Enter: "Space" };
function mount(id, host, cfg) {
  var W = cfg.w, H = cfg.h;
  host.innerHTML = '<div class="ar" style="max-width:' + (cfg.mw || 380) + 'px">' +
    '<div class="ar-hud"><span>' + (cfg.sl || "Score") + ' <b class="ar-sc">0</b></span><span>' + (cfg.bl || "Best") + ' <b class="ar-bs">0</b></span>' +
    '<button class="pill ar-pz" type="button">Pause</button><button class="pill ar-sn" type="button"></button></div>' +
    '<div class="ar-scr"><canvas class="ar-cv" width="' + W + '" height="' + H + '" tabindex="0" role="img" aria-label="' + cfg.name + ' game screen"></canvas></div>' +
    (cfg.opts ? '<div class="row ar-opts"></div>' : "") +
    (cfg.pad ? '<div class="ar-pad ar-pad' + cfg.pad.length + '"></div>' : "") +
    '<p class="ar-help">' + cfg.help + '</p></div>';
  var cv = host.querySelector(".ar-cv"), c = cv.getContext("2d"), scE = host.querySelector(".ar-sc"), bsE = host.querySelector(".ar-bs");
  var pz = host.querySelector(".ar-pz"), sn = host.querySelector(".ar-sn");
  c.imageSmoothingEnabled = false;
  var G = { c: c, W: W, H: H, st: "ready", nb: false, opt: cfg.opts ? cfg.opts[1 % cfg.opts.length][0] : null, sub: "", title: "", beep: beep, C: C, rnd: rnd, keys: {}, t: 0 };
  var game, lockUntil = 0;
  function bestTxt() { var b = bestOf(id); return cfg.fmtBest ? cfg.fmtBest(b) : b; }
  G.score = function (v) { scE.textContent = v; };
  G.refresh = function () { bsE.textContent = bestTxt(); };
  G.txt = function (s, x, y, size, col, al) {
    c.font = size + "px " + FONT; var w = c.measureText(s).width, k = size;
    if (w > W - 8) { k = Math.max(6, Math.floor(size * (W - 8) / w)); c.font = k + "px " + FONT; }
    c.fillStyle = col || C.wht; c.textAlign = al || "center"; c.textBaseline = "middle"; c.fillText(s, x, y);
  };
  G.rect = function (x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
  G.spr = function (rows, x, y, s, col) {
    c.fillStyle = col;
    for (var j = 0; j < rows.length; j++) for (var i = 0; i < rows[j].length; i++) if (rows[j][i] === "1") c.fillRect(Math.round(x + i * s), Math.round(y + j * s), s, s);
  };
  G.bestNow = function () { return bestOf(id); };
  G.save = function (v) { G.nb = record(id, v); G.refresh(); };
  G.end = function (title, sub) {
    G.st = "over"; G.title = title || "GAME OVER"; G.sub = sub || ""; lockUntil = performance.now() + 700; pz.disabled = true;
  };
  function begin() {
    G.keys = {}; G.nb = false; G.st = "play"; G.t = 0; pz.disabled = false; pz.textContent = "Pause"; game.reset(); cv.focus({ preventScroll: true });
  }
  function pause(on) { if (on && G.st === "play") { G.st = "pause"; pz.textContent = "Resume"; } else if (!on && G.st === "pause") { G.st = "play"; pz.textContent = "Pause"; G.keys = {}; } }
  function press(code, down) {
    if (down && (code === "Space" || (code.indexOf("Arrow") === 0 && cfg.arrowStart))) {
      if (G.st === "ready" || (G.st === "over" && performance.now() > lockUntil)) { begin(); if (code !== "Space") game.key(code, true); return; }
      if (G.st === "pause") { pause(false); return; }
    }
    if (down && (code === "KeyP" || code === "Escape")) { if (G.st === "play") pause(true); else pause(false); return; }
    if (down) G.keys[code] = true; else delete G.keys[code];
    if (G.st === "play") game.key(code, down);
  }
  function visible() { return host.offsetParent !== null; }
  document.addEventListener("keydown", function (e) {
    if (!visible() || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    var k = KEYMAP[e.code] || e.code;
    if (!/^(Arrow|Space|KeyP|Escape)/.test(k)) return;
    if (e.target.tagName === "BUTTON" && k === "Space") return;
    e.preventDefault(); if (e.repeat && !cfg.repeat) return; press(k, true);
  });
  document.addEventListener("keyup", function (e) {
    if (!visible()) return; var k = KEYMAP[e.code] || e.code; if (G.keys[k]) press(k, false);
  });
  function lpt(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }
  cv.addEventListener("pointerdown", function (e) {
    e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
    var p = lpt(e);
    if (G.st !== "play") { press("Space", true); delete G.keys.Space; if (G.st !== "play") return; }
    if (game.ptr) game.ptr(p[0], p[1], "down");
  });
  cv.addEventListener("pointermove", function (e) { if (G.st === "play" && game.ptr && (e.buttons || e.pointerType === "touch")) { var p = lpt(e); game.ptr(p[0], p[1], "move"); } });
  cv.addEventListener("pointerup", function (e) { if (G.st === "play" && game.ptr) { var p = lpt(e); game.ptr(p[0], p[1], "up"); } });
  cv.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  pz.addEventListener("click", function () { if (G.st === "play") pause(true); else if (G.st === "pause") pause(false); });
  function snd() { sn.textContent = "Sound: " + (mute ? "off" : "on"); }
  snd(); sn.addEventListener("click", function () { mute = !mute; try { localStorage.setItem("gu-mute", mute ? "1" : "0"); } catch (e) { /* ignore */ } snd(); if (!mute) beep(660, 0.08); });
  if (cfg.opts) {
    var oh = host.querySelector(".ar-opts");
    cfg.opts.forEach(function (o) {
      var b = document.createElement("button"); b.type = "button"; b.className = "pill" + (o[0] === G.opt ? " on" : ""); b.textContent = o[1];
      b.addEventListener("click", function () { G.opt = o[0]; oh.querySelectorAll(".pill").forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); G.st = "ready"; game.reset(); });
      oh.appendChild(b);
    });
  }
  if (cfg.pad) {
    var ph = host.querySelector(".ar-pad");
    cfg.pad.forEach(function (p) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = p[0]; b.setAttribute("aria-label", p[2] || p[0]);
      b.addEventListener("pointerdown", function (e) { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } b.classList.add("dn"); press(p[1], true); });
      var up = function () { b.classList.remove("dn"); if (G.keys[p[1]]) press(p[1], false); };
      b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("lostpointercapture", up);
      b.addEventListener("contextmenu", function (e) { e.preventDefault(); });
      ph.appendChild(b);
    });
  }
  game = cfg.make(G); game.reset(); G.refresh(); G.score(0);
  var last = 0, acc = 0, STEP = 1000 / 60;
  function overlay() {
    if (G.st === "play") return;
    c.fillStyle = "rgba(5,5,20,.72)"; c.fillRect(0, 0, W, H);
    var mid = H / 2, blink = Math.floor(performance.now() / 450) % 2;
    if (G.st === "ready") {
      G.txt(cfg.name.toUpperCase(), W / 2, mid - 34, 16, C.yel);
      G.txt(cfg.tag || "", W / 2, mid - 8, 8, C.teal);
      if (blink) G.txt("TAP OR PRESS SPACE", W / 2, mid + 28, 8, C.wht);
    } else if (G.st === "pause") {
      G.txt("PAUSED", W / 2, mid - 10, 16, C.yel); if (blink) G.txt("TAP TO RESUME", W / 2, mid + 22, 8, C.wht);
    } else {
      G.txt(G.title, W / 2, mid - 40, 16, C.pink);
      if (G.sub) G.txt(G.sub, W / 2, mid - 12, 8, C.wht);
      if (G.nb) G.txt("NEW BEST!", W / 2, mid + 12, 12, C.yel);
      if (blink) G.txt("TAP TO PLAY AGAIN", W / 2, mid + 44, 8, C.teal);
    }
  }
  function frame(t) {
    requestAnimationFrame(frame);
    if (!visible() || document.hidden) { last = 0; if (G.st === "play") pause(true); return; }
    if (!last) last = t;
    var dt = Math.min(50, t - last); last = t;
    if (G.st === "play") { acc += dt; while (acc >= STEP) { G.t += STEP / 1000; game.update(STEP / 1000); acc -= STEP; if (G.st !== "play") break; } }
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    game.draw(c); overlay();
  }
  requestAnimationFrame(frame);
  try { if (document.fonts && document.fonts.load) document.fonts.load('16px "Press Start 2P"'); } catch (e) { /* ignore */ }
}

/* ============ 1. Retro Snake ============ */
function snake(G) {
  var N = 20, S = 16, sn, dir, q, food, sc, t, iv, sx, sy;
  function put() { do { food = { x: rnd(N), y: rnd(N) }; } while (sn.some(function (p) { return p.x === food.x && p.y === food.y; })); }
  function turn(k) {
    var m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[k]; if (!m) return;
    var l = q.length ? q[q.length - 1] : dir;
    if ((m[0] === -l.x && m[1] === -l.y) || (m[0] === l.x && m[1] === l.y)) return;
    if (q.length < 2) q.push({ x: m[0], y: m[1] });
  }
  return {
    reset: function () { sn = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]; dir = { x: 1, y: 0 }; q = []; sc = 0; t = 0; iv = 0.13; put(); G.score(0); },
    key: function (k, d) { if (d) turn(k); },
    ptr: function (x, y, ph) {
      if (ph === "down") { sx = x; sy = y; return; }
      if (sx == null) return; var dx = x - sx, dy = y - sy;
      if (Math.abs(dx) > 18 || Math.abs(dy) > 18) { turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "ArrowRight" : "ArrowLeft") : (dy > 0 ? "ArrowDown" : "ArrowUp")); sx = x; sy = y; }
      if (ph === "up") sx = null;
    },
    update: function (dt) {
      t += dt; if (t < iv) return; t -= iv;
      if (q.length) dir = q.shift();
      var h = { x: sn[0].x + dir.x, y: sn[0].y + dir.y };
      if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || sn.slice(0, -1).some(function (p) { return p.x === h.x && p.y === h.y; })) { G.beep(150, 0.5, "sawtooth", 0.05, 40); G.save(sc); G.end("GAME OVER", "SCORE " + sc); return; }
      sn.unshift(h);
      if (h.x === food.x && h.y === food.y) { sc += 10; G.score(sc); G.beep(660, 0.09, "square", 0.04, 990); iv = Math.max(0.06, 0.13 - Math.floor(sc / 40) * 0.008); put(); } else sn.pop();
    },
    draw: function (c) {
      c.fillStyle = "#14143a"; for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) if ((i + j) % 2 === 0) c.fillRect(i * S, j * S, S, S);
      var fx = food.x * S, fy = food.y * S;
      G.rect(fx + 3, fy + 4, 10, 9, C.red); G.rect(fx + 2, fy + 6, 12, 5, C.red); G.rect(fx + 7, fy + 1, 2, 4, C.grn); G.rect(fx + 4, fy + 5, 2, 2, "#ff9b9b");
      sn.forEach(function (p, k) {
        G.rect(p.x * S + 1, p.y * S + 1, S - 2, S - 2, k === 0 ? C.grn : C.teal);
        G.rect(p.x * S + 4, p.y * S + 4, S - 8, S - 8, k === 0 ? "#b6ffa8" : "#1aa9ad");
      });
      var h = sn[0], ex = dir.x ? (dir.x > 0 ? 9 : 3) : 0, ey = dir.y ? (dir.y > 0 ? 9 : 3) : 0;
      if (dir.x) { G.rect(h.x * S + ex, h.y * S + 3, 3, 3, "#000"); G.rect(h.x * S + ex, h.y * S + 10, 3, 3, "#000"); } else { G.rect(h.x * S + 3, h.y * S + ey, 3, 3, "#000"); G.rect(h.x * S + 10, h.y * S + ey, 3, 3, "#000"); }
    }
  };
}

/* ============ 2. Paddle Rally ============ */
function rally(G) {
  var W = 360, H = 240, PH = 40, py, cy, bx, by, vx, vy, ps, cs, wait, spd, tgt, hits;
  var AI = { easy: { v: 95, err: 22 }, normal: { v: 135, err: 12 }, hard: { v: 185, err: 5 } };
  function serve(dir) { bx = W / 2; by = H / 2; spd = 170; var a = (Math.random() - 0.5) * 0.9; vx = Math.cos(a) * spd * dir; vy = Math.sin(a) * spd; wait = 0.8; hits = 0; tgt = H / 2; }
  function bounce(px, dirx, py2) {
    var off = Math.max(-1, Math.min(1, (by - py2) / (PH / 2))); spd = Math.min(360, spd + 12); hits++;
    var a = off * 1.0; vx = Math.cos(a) * spd * dirx; vy = Math.sin(a) * spd; G.beep(dirx > 0 ? 440 : 330, 0.05);
  }
  return {
    reset: function () { py = cy = H / 2 - PH / 2; ps = cs = 0; serve(1); G.score("0 - 0"); },
    key: function () { },
    ptr: function (x, y) { py = Math.max(0, Math.min(H - PH, y - PH / 2)); },
    update: function (dt) {
      var k = G.keys; if (k.ArrowUp) py -= 230 * dt; if (k.ArrowDown) py += 230 * dt; py = Math.max(0, Math.min(H - PH, py));
      var ai = AI[G.opt] || AI.normal;
      if (wait > 0) { wait -= dt; return; }
      bx += vx * dt; by += vy * dt;
      if (by < 3) { by = 3; vy = Math.abs(vy); G.beep(220, 0.03); } if (by > H - 3) { by = H - 3; vy = -Math.abs(vy); G.beep(220, 0.03); }
      if (vx > 0 && bx > W / 2) { tgt = by + Math.sin(G.t * 3 + hits) * ai.err; } else tgt = H / 2;
      var cc = cy + PH / 2, d = tgt - cc; cy += Math.max(-ai.v * dt, Math.min(ai.v * dt, d)); cy = Math.max(0, Math.min(H - PH, cy));
      if (vx < 0 && bx - 3 <= 16 && bx > 6 && by >= py - 3 && by <= py + PH + 3) { bx = 17; bounce(16, 1, py + PH / 2); }
      if (vx > 0 && bx + 3 >= W - 16 && bx < W - 6 && by >= cy - 3 && by <= cy + PH + 3) { bx = W - 17; bounce(W - 16, -1, cy + PH / 2); }
      if (bx < -6) { cs++; G.beep(120, 0.35, "sawtooth", 0.05, 60); G.score(ps + " - " + cs); serve(1); }
      if (bx > W + 6) { ps++; G.beep(880, 0.2, "square", 0.04, 1320); G.score(ps + " - " + cs); serve(-1); }
      if (ps >= 7 || cs >= 7) {
        var win = ps > cs;
        G.save(win ? G.bestNow() + 1 : null); G.end(win ? "YOU WIN!" : "CPU WINS", "FINAL " + ps + " - " + cs);
      }
    },
    draw: function (c) {
      c.fillStyle = C.dim; for (var y = 4; y < H; y += 14) c.fillRect(W / 2 - 1, y, 2, 8);
      G.rect(8, py, 8, PH, C.teal); G.rect(W - 16, cy, 8, PH, C.pink);
      G.txt(String(ps), W / 2 - 40, 22, 16, C.teal); G.txt(String(cs), W / 2 + 40, 22, 16, C.pink);
      if (wait <= 0 || Math.floor(G.t * 8) % 2) G.rect(bx - 3, by - 3, 6, 6, C.yel);
    }
  };
}

/* ============ 3. Brick Smash ============ */
function bricks(G) {
  var W = 300, H = 360, PY = 336, PW = 52, px, bx, by, vx, vy, stuck, br, lives, lv, sc, spd, cols = [C.red, C.org, C.yel, C.grn, C.teal, C.pur, C.pink, C.blu];
  function layout() {
    br = []; var rows = Math.min(8, 4 + lv);
    for (var r = 0; r < rows; r++) for (var i = 0; i < 10; i++) br.push({ x: i * 30 + 1, y: 40 + r * 14, w: 28, h: 12, r: r, hp: (lv > 2 && r === 0) ? 2 : 1 });
  }
  function ready() { stuck = true; bx = px; by = PY - 5; vx = vy = 0; }
  function launch() { if (!stuck) return; stuck = false; var a = (Math.random() - 0.5) * 0.7; vx = Math.sin(a) * spd; vy = -Math.cos(a) * spd; G.beep(520, 0.06); }
  return {
    reset: function () { lives = 3; lv = 1; sc = 0; spd = 190; px = W / 2; layout(); ready(); G.score(0); },
    key: function (k, d) { if (d && k === "Space") launch(); },
    ptr: function (x, y, ph) { px = Math.max(PW / 2, Math.min(W - PW / 2, x)); if (ph === "down") launch(); },
    update: function (dt) {
      var k = G.keys; if (k.ArrowLeft) px -= 270 * dt; if (k.ArrowRight) px += 270 * dt; px = Math.max(PW / 2, Math.min(W - PW / 2, px));
      if (stuck) { bx = px; by = PY - 5; return; }
      for (var s = 0; s < 3; s++) {
        bx += vx * dt / 3; by += vy * dt / 3;
        if (bx < 4) { bx = 4; vx = Math.abs(vx); } if (bx > W - 4) { bx = W - 4; vx = -Math.abs(vx); } if (by < 4) { by = 4; vy = Math.abs(vy); }
        if (vy > 0 && by + 4 >= PY && by - 4 <= PY + 8 && bx >= px - PW / 2 - 4 && bx <= px + PW / 2 + 4) {
          var off = Math.max(-1, Math.min(1, (bx - px) / (PW / 2))), a = off * 1.05; vx = Math.sin(a) * spd; vy = -Math.cos(a) * spd; by = PY - 5; G.beep(300, 0.05);
        }
        for (var i = 0; i < br.length; i++) {
          var b = br[i], nx = Math.max(b.x, Math.min(bx, b.x + b.w)), ny = Math.max(b.y, Math.min(by, b.y + b.h)), dx = bx - nx, dy = by - ny;
          if (dx * dx + dy * dy < 16) {
            var ox = Math.abs(bx - (b.x + b.w / 2)) / (b.w / 2 + 4), oy = Math.abs(by - (b.y + b.h / 2)) / (b.h / 2 + 4);
            if (ox > oy) vx = (bx < b.x + b.w / 2) ? -Math.abs(vx) : Math.abs(vx); else vy = (by < b.y + b.h / 2) ? -Math.abs(vy) : Math.abs(vy);
            b.hp--; if (b.hp <= 0) { br.splice(i, 1); sc += 10 * (8 - Math.min(7, b.r)); G.score(sc); G.beep(700 - b.r * 40, 0.06, "square", 0.04); } else G.beep(260, 0.05);
            break;
          }
        }
        if (!br.length) { lv++; spd = Math.min(330, spd + 18); layout(); ready(); G.beep(880, 0.3, "square", 0.05, 1320); return; }
        if (by > H + 6) {
          lives--; G.beep(150, 0.4, "sawtooth", 0.05, 50);
          if (lives <= 0) { G.save(sc); G.end("GAME OVER", "SCORE " + sc); return; }
          ready(); return;
        }
      }
    },
    draw: function (c) {
      br.forEach(function (b) { G.rect(b.x, b.y, b.w, b.h, cols[b.r % cols.length]); G.rect(b.x, b.y, b.w, 2, "rgba(255,255,255,.45)"); G.rect(b.x, b.y + b.h - 2, b.w, 2, "rgba(0,0,0,.3)"); if (b.hp > 1) G.rect(b.x + 12, b.y + 5, 4, 2, "#fff"); });
      G.rect(px - PW / 2, PY, PW, 8, C.wht); G.rect(px - PW / 2, PY, PW, 2, C.teal);
      G.rect(bx - 4, by - 4, 8, 8, C.yel);
      G.txt("LEVEL " + lv, 8, 14, 8, C.teal, "left"); for (var i = 0; i < lives; i++) G.rect(W - 18 - i * 14, 9, 10, 10, C.pink);
      if (stuck) G.txt("TAP OR SPACE TO LAUNCH", W / 2, 300, 8, C.wht);
    }
  };
}

/* ============ 4. Star Blaster ============ */
var SPR = {
  a: [["..1111..", ".111111.", "11.11.11", "11111111", ".1.11.1.", "1......1"], ["..1111..", ".111111.", "11.11.11", "11111111", "..1..1..", ".1....1."]],
  b: [["1..11..1", ".111111.", "11.11.11", "11111111", "1.1111.1", "1.1..1.1"], ["1..11..1", "1111111.", "11.11.11", ".1111111", ".1.11.1.", "11....11"]],
  c: [["..1111..", "11111111", "1.1111.1", "11111111", ".11..11.", "1.1..1.1"], ["..1111..", "11111111", "1.1111.1", "11111111", "..1111..", ".1....1."]]
};
var SHIP = ["....1....", "...111...", "..11111..", "111111111", "111111111", "11.....11"];
var UFO = ["..11111111..", ".1111111111.", "111.11.11.111", "1111111111111", "..11....11.."];
function blaster(G) {
  var W = 300, H = 360, px, bl, bombs, en, dir, stepT, stepIv, frame, lives, wave, sc, cd, inv, ufo, ufoT, bunk, ex;
  function mkBunk() {
    bunk = []; for (var b = 0; b < 3; b++) for (var r = 0; r < 4; r++) for (var i = 0; i < 9; i++) { if ((r === 3 && i > 2 && i < 6)) continue; bunk.push({ x: 33 + b * 91 + i * 4, y: 268 + r * 4, a: true }); }
  }
  function mkWave() {
    en = []; for (var r = 0; r < 4; r++) for (var i = 0; i < 8; i++) en.push({ x: 24 + i * 30, y: 44 + r * 24 + Math.min(wave - 1, 4) * 8, t: r === 0 ? "c" : (r < 3 ? "b" : "a"), pts: r === 0 ? 30 : (r < 3 ? 20 : 10), alive: true });
    dir = 1; stepT = 0; frame = 0; bl = []; bombs = [];
  }
  function iv() { var n = en.filter(function (e) { return e.alive; }).length; return Math.max(0.04, (0.07 + n * 0.022) * Math.pow(0.93, wave - 1)); }
  function rectHit(ax, ay, aw, ah, bx2, by2, bw, bh) { return ax < bx2 + bw && ax + aw > bx2 && ay < by2 + bh && ay + ah > by2; }
  return {
    reset: function () { px = W / 2; lives = 3; wave = 1; sc = 0; cd = 0; inv = 0; ufo = null; ufoT = 14; ex = []; mkBunk(); mkWave(); G.score(0); },
    key: function () { },
    ptr: function (x, y, ph) { px = Math.max(10, Math.min(W - 10, x)); if (ph === "down" && cd <= 0) { G.keys.Space = true; setTimeout(function () { delete G.keys.Space; }, 120); } },
    update: function (dt) {
      var k = G.keys; if (k.ArrowLeft) px -= 150 * dt; if (k.ArrowRight) px += 150 * dt; px = Math.max(10, Math.min(W - 10, px));
      cd -= dt; inv -= dt;
      if (k.Space && cd <= 0 && bl.length < 2) { bl.push({ x: px, y: 310 }); cd = 0.32; G.beep(880, 0.08, "square", 0.03, 440); }
      bl.forEach(function (b) { b.y -= 300 * dt; }); bl = bl.filter(function (b) { return b.y > -6; });
      bombs.forEach(function (b) { b.y += (110 + wave * 8) * dt; }); bombs = bombs.filter(function (b) { return b.y < H; });
      stepT += dt;
      if (stepT >= stepIv_()) {
        stepT = 0; frame ^= 1; var edge = false;
        en.forEach(function (e) { if (e.alive && ((dir > 0 && e.x > W - 34) || (dir < 0 && e.x < 18))) edge = true; });
        if (edge) { dir = -dir; en.forEach(function (e) { e.y += 10; }); } else en.forEach(function (e) { e.x += dir * 6; });
        G.beep(frame ? 90 : 70, 0.05, "square", 0.03);
      }
      var alive = en.filter(function (e) { return e.alive; });
      if (!alive.length) { wave++; mkWave(); mkBunk(); G.beep(880, 0.3, "square", 0.05, 1320); return; }
      if (alive.some(function (e) { return e.y + 16 >= 300; })) { lives = 0; }
      if (Math.random() < dt * (0.9 + wave * 0.25)) {
        var col = alive[rnd(alive.length)], low = alive.filter(function (e) { return Math.abs(e.x - col.x) < 4; }).sort(function (a, b) { return b.y - a.y; })[0];
        bombs.push({ x: low.x + 8, y: low.y + 14 });
      }
      ufoT -= dt; if (ufoT <= 0 && !ufo) { ufo = { x: -14, v: 60 * (Math.random() < 0.5 ? 1 : -1) }; if (ufo.v < 0) ufo.x = W + 14; ufoT = 18; }
      if (ufo) { ufo.x += ufo.v * dt; if (ufo.x < -20 || ufo.x > W + 20) ufo = null; }
      bl.forEach(function (b) {
        en.forEach(function (e) { if (e.alive && !b.dead && rectHit(b.x - 1, b.y, 2, 6, e.x, e.y, 16, 12)) { e.alive = false; b.dead = true; sc += e.pts; G.score(sc); G.beep(200, 0.15, "sawtooth", 0.05, 60); ex.push({ x: e.x + 8, y: e.y + 6, t: 0.25 }); } });
        if (ufo && !b.dead && rectHit(b.x - 1, b.y, 2, 6, ufo.x - 12, 24, 26, 10)) { b.dead = true; var p = [50, 100, 150, 300][rnd(4)]; sc += p; G.score(sc); ex.push({ x: ufo.x, y: 28, t: 0.5, p: p }); G.beep(1200, 0.3, "square", 0.05, 300); ufo = null; }
        bunk.forEach(function (u) { if (u.a && !b.dead && rectHit(b.x - 1, b.y, 2, 6, u.x, u.y, 4, 4)) { u.a = false; b.dead = true; } });
      });
      bl = bl.filter(function (b) { return !b.dead; });
      bombs.forEach(function (b) {
        bunk.forEach(function (u) { if (u.a && !b.dead && rectHit(b.x - 1, b.y, 3, 6, u.x, u.y, 4, 4)) { u.a = false; b.dead = true; } });
        if (!b.dead && inv <= 0 && rectHit(b.x - 1, b.y, 3, 6, px - 9, 314, 18, 12)) { b.dead = true; lives--; inv = 1.6; G.beep(120, 0.5, "sawtooth", 0.06, 40); ex.push({ x: px, y: 320, t: 0.4 }); }
      });
      bombs = bombs.filter(function (b) { return !b.dead; });
      ex.forEach(function (e) { e.t -= dt; }); ex = ex.filter(function (e) { return e.t > 0; });
      if (lives <= 0) { G.save(sc); G.end("GAME OVER", "SCORE " + sc); }
    },
    draw: function (c) {
      bunk.forEach(function (u) { if (u.a) G.rect(u.x, u.y, 4, 4, C.grn); });
      en.forEach(function (e) { if (e.alive) G.spr(SPR[e.t][frame], e.x, e.y, 2, e.t === "c" ? C.pink : e.t === "b" ? C.grn : C.yel); });
      if (ufo) G.spr(UFO, ufo.x - 13, 24, 2, C.red);
      if (inv <= 0 || Math.floor(G.t * 12) % 2) G.spr(SHIP, px - 9, 314, 2, C.teal);
      G.rect(0, 336, W, 2, C.grn);
      bl.forEach(function (b) { G.rect(b.x - 1, b.y, 2, 6, C.wht); });
      bombs.forEach(function (b) { G.rect(b.x - 1, b.y, 3, 6, C.org); });
      ex.forEach(function (e) { if (e.p) G.txt(String(e.p), e.x, e.y, 8, C.yel); else { G.rect(e.x - 6, e.y - 1, 12, 2, C.wht); G.rect(e.x - 1, e.y - 6, 2, 12, C.wht); } });
      G.txt("WAVE " + wave, 8, 12, 8, C.teal, "left"); for (var i = 0; i < Math.max(0, lives); i++) G.spr(SHIP, W - 24 - i * 22, 6, 1, C.teal);
    }
  };
  function stepIv_() { return iv(); }
}

/* ============ 5. Maze Muncher ============ */
var MAZE = [
  "###################", "#........#........#", "#o##.###.#.###.##o#", "#.................#", "#.##.#.#####.#.##.#", "#....#...#...#....#", "####.### # ###.####",
  "   #.#       #.#   ", "####.# ##-## #.####", "    .  #GGG#  .    ", "####.# ##### #.####", "   #.#       #.#   ", "####.# ##### #.####", "#........#........#",
  "#.##.###.#.###.##.#", "#o.#.....P.....#.o#", "##.#.#.#####.#.#.##", "#....#...#...#....#", "#.######.#.######.#", "#.................#", "###################"];
function muncher(G) {
  var T = 16, NC = 19, NR = 21, grid, dots, pac, want, gh, sc, lives, lv, fr, frT, combo, frozen, mouth;
  var GC = [C.red, C.pink, C.teal, C.org], DIRS = [[0, -1], [-1, 0], [0, 1], [1, 0]];
  function wrap(x, y) { return y === 9 ? (x + NC) % NC : x; }
  function ch(x, y) { x = wrap(x, y); if (x < 0 || x >= NC || y < 0 || y >= NR) return "#"; return grid[y][x]; }
  function build() { grid = MAZE.map(function (r) { return r.split(""); }); dots = 0; for (var y = 0; y < NR; y++) for (var x = 0; x < NC; x++) if (grid[y][x] === "." || grid[y][x] === "o") dots++; }
  function ent(x, y, sp) { return { tx: x, ty: y, dx: 0, dy: 0, p: 0, sp: sp }; }
  function place() {
    pac = ent(9, 15, 6.4); want = [0, 0]; combo = 0; fr = 0;
    var rel = [0, 2.5, 5, 8], st = [[9, 7], [8, 9], [9, 9], [10, 9]];
    gh = st.map(function (s, i) { var g = ent(s[0], s[1], 5); g.i = i; g.mode = "norm"; g.house = i > 0; g.rel = rel[i] / (1 + (lv - 1) * 0.15); g.dx = i === 0 ? 1 : 0; return g; });
    frozen = 1.2;
  }
  function pcOpen(x, y) { var c = ch(x, y); return c !== "#" && c !== "-" && c !== "G"; }
  function ghOpen(g, x, y, dy) {
    var c = ch(x, y); if (c === "#") return false;
    if (c === "-") return (g.mode === "eyes" && dy === 1) || (g.house && dy === -1);
    if (c === "G") return g.house || g.mode === "eyes";
    return true;
  }
  function pos(e) { return [e.tx + e.dx * e.p, e.ty + e.dy * e.p]; }
  function eat(x, y) {
    var c = grid[y][x];
    if (c === ".") { grid[y][x] = " "; dots--; sc += 10; G.score(sc); G.beep(dots % 2 ? 330 : 260, 0.03); }
    else if (c === "o") { grid[y][x] = " "; dots--; sc += 50; G.score(sc); fr = Math.max(2.5, 7 - lv * 0.6); combo = 0; gh.forEach(function (g) { if (g.mode === "norm") { g.dx = -g.dx; g.dy = -g.dy; g.p = g.dx || g.dy ? 1 - g.p : 0; if (g.dx || g.dy) { g.tx = wrap(g.tx + (-g.dx), g.ty); g.ty += -g.dy; } } }); G.beep(200, 0.25, "square", 0.05, 600); }
  }
  function arrivePac(e) {
    eat(e.tx, e.ty);
    if (pcOpen(e.tx + want[0], e.ty + want[1]) && (want[0] || want[1])) { e.dx = want[0]; e.dy = want[1]; }
    else if (!pcOpen(e.tx + e.dx, e.ty + e.dy)) { e.dx = 0; e.dy = 0; }
  }
  function target(g) {
    var P = pac;
    if (g.mode === "eyes") return [9, 9];
    if (g.house) return [9, 7];
    if (g.i === 0) return [P.tx, P.ty];
    if (g.i === 1) return [P.tx + P.dx * 4, P.ty + P.dy * 4];
    if (g.i === 2) { var d = Math.abs(g.tx - P.tx) + Math.abs(g.ty - P.ty); return d > 8 ? [P.tx, P.ty] : [1, 19]; }
    return Math.random() < 0.4 ? [rnd(NC), rnd(NR)] : [P.tx, P.ty];
  }
  function arriveGh(g) {
    if (g.mode === "eyes" && g.tx === 9 && g.ty === 9) { g.mode = "norm"; g.house = true; g.rel = 0.4; }
    if (g.house && g.ty < 8) g.house = false;
    if (g.house && g.rel > 0 && g.ty >= 8) { g.dx = 0; g.dy = 0; return; }
    var opts = [];
    DIRS.forEach(function (d) { if ((d[0] === -g.dx && d[1] === -g.dy) && (g.dx || g.dy)) return; if (ghOpen(g, g.tx + d[0], g.ty + d[1], d[1])) opts.push(d); });
    if (!opts.length) { DIRS.forEach(function (d) { if (ghOpen(g, g.tx + d[0], g.ty + d[1], d[1])) opts.push(d); }); }
    if (!opts.length) { g.dx = 0; g.dy = 0; return; }
    var pick;
    if (fr > 0 && g.mode === "norm" && !g.house) pick = opts[rnd(opts.length)];
    else { var t = target(g), best = 1e9; opts.forEach(function (d) { var dd = Math.pow(wrap(g.tx + d[0], g.ty) - t[0], 2) + Math.pow(g.ty + d[1] - t[1], 2); if (dd < best) { best = dd; pick = d; } }); }
    g.dx = pick[0]; g.dy = pick[1];
  }
  function adv(e, dt, arrive) {
    var d = e.sp * dt, guard = 0;
    while (d > 0 && guard++ < 8) {
      if (e.dx || e.dy) {
        var need = 1 - e.p;
        if (d < need) { e.p += d; d = 0; } else { d -= need; e.tx = wrap(e.tx + e.dx, e.ty); e.ty += e.dy; e.p = 0; arrive(e); }
      } else { arrive(e); if (!e.dx && !e.dy) break; }
    }
  }
  function setWant(k) {
    var m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[k]; if (!m) return; want = m;
    if ((pac.dx || pac.dy) && m[0] === -pac.dx && m[1] === -pac.dy) { pac.tx = wrap(pac.tx + pac.dx, pac.ty); pac.ty += pac.dy; pac.dx = m[0]; pac.dy = m[1]; pac.p = 1 - pac.p; }
  }
  var sx, sy;
  return {
    reset: function () { sc = 0; lives = 3; lv = 1; build(); place(); G.score(0); },
    key: function (k, d) { if (d) setWant(k); },
    ptr: function (x, y, ph) {
      if (ph === "down") { sx = x; sy = y; return; } if (sx == null) return;
      var dx = x - sx, dy = y - sy; if (Math.abs(dx) > 14 || Math.abs(dy) > 14) { setWant(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "ArrowRight" : "ArrowLeft") : (dy > 0 ? "ArrowDown" : "ArrowUp")); sx = x; sy = y; }
      if (ph === "up") sx = null;
    },
    update: function (dt) {
      if (frozen > 0) { frozen -= dt; return; }
      mouth = (G.t * 9) % 1;
      if (fr > 0) fr -= dt;
      adv(pac, dt, arrivePac);
      gh.forEach(function (g) {
        if (g.house && g.rel > 0) g.rel -= dt;
        g.sp = g.mode === "eyes" ? 11 : (fr > 0 ? 3.4 : Math.min(7, 5 + lv * 0.25 + g.i * 0.1));
        if (g.house && g.rel <= 0 && !g.dx && !g.dy) arriveGh(g);
        adv(g, dt, arriveGh);
      });
      if (dots <= 0) { lv++; build(); place(); G.beep(880, 0.4, "square", 0.05, 1320); return; }
      var pp = pos(pac);
      for (var i = 0; i < gh.length; i++) {
        var g = gh[i], gp = pos(g), dx = pp[0] - gp[0], dy = pp[1] - gp[1];
        if (g.mode !== "eyes" && !(g.house && g.ty >= 8) && dx * dx + dy * dy < 0.4) {
          if (fr > 0) { g.mode = "eyes"; combo++; sc += 100 * Math.pow(2, combo); G.score(sc); G.beep(900, 0.25, "square", 0.05, 200); }
          else {
            lives--; G.beep(300, 0.7, "sawtooth", 0.05, 40);
            if (lives <= 0) { G.save(sc); G.end("GAME OVER", "SCORE " + sc); return; }
            place(); return;
          }
        }
      }
    },
    draw: function (c) {
      for (var y = 0; y < NR; y++) for (var x = 0; x < NC; x++) {
        var k = grid[y][x];
        if (k === "#") { G.rect(x * T, y * T, T, T, "#1c2bbd"); G.rect(x * T + 2, y * T + 2, T - 4, T - 4, "#0d1466"); }
        else if (k === "-") G.rect(x * T, y * T + 6, T, 3, C.pink);
        else if (k === ".") G.rect(x * T + 7, y * T + 7, 2, 2, "#ffd9a0");
        else if (k === "o" && Math.floor(G.t * 4) % 2 === 0) { c.fillStyle = "#ffd9a0"; c.beginPath(); c.arc(x * T + 8, y * T + 8, 5, 0, 7); c.fill(); }
        else if (k === "o" && G.st !== "play") { c.fillStyle = "#ffd9a0"; c.beginPath(); c.arc(x * T + 8, y * T + 8, 5, 0, 7); c.fill(); }
      }
      var pp = pos(pac), cx = pp[0] * T + 8, cy = pp[1] * T + 8;
      if (pp[0] < -0.5) cx += NC * T; if (pp[0] > NC - 0.5) cx -= NC * T;
      var face = Math.atan2(pac.dy || 0, pac.dx || 1), m = (pac.dx || pac.dy) ? Math.abs(Math.sin((mouth || 0) * Math.PI)) * 0.7 : 0.15;
      c.fillStyle = C.yel; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, 7, face + m, face + Math.PI * 2 - m); c.closePath(); c.fill();
      gh.forEach(function (g) {
        var q = pos(g), gx = q[0] * T + 8, gy = q[1] * T + 8, body = g.mode === "eyes" ? null : (fr > 0 ? ((fr < 2 && Math.floor(fr * 6) % 2) ? C.wht : C.blu) : GC[g.i]);
        if (body) {
          c.fillStyle = body; c.beginPath(); c.arc(gx, gy - 1, 7, Math.PI, 0); c.lineTo(gx + 7, gy + 7);
          for (var i = 0; i < 3; i++) { c.lineTo(gx + 7 - (i * 2 + 1) * 14 / 6, gy + (i % 2 ? 7 : 4)); }
          c.lineTo(gx - 7, gy + 7); c.closePath(); c.fill();
        }
        var ex = fr > 0 && body ? 0 : g.dx * 1.5, ey = fr > 0 && body ? 0 : g.dy * 1.5;
        c.fillStyle = (fr > 0 && body) ? C.pink : "#fff"; c.fillRect(gx - 5, gy - 4, 4, 4); c.fillRect(gx + 1, gy - 4, 4, 4);
        if (!(fr > 0 && body)) { c.fillStyle = "#1c2bbd"; c.fillRect(gx - 5 + 1 + ex, gy - 4 + 1 + ey, 2, 2); c.fillRect(gx + 1 + 1 + ex, gy - 4 + 1 + ey, 2, 2); }
      });
      for (var i = 0; i < lives - 1; i++) { c.fillStyle = C.yel; c.beginPath(); c.moveTo(14 + i * 20, 344); c.arc(14 + i * 20, 344, 6, 0.5, Math.PI * 2 - 0.5); c.closePath(); c.fill(); }
      G.txt("LEVEL " + lv, W_ - 8, 344, 8, C.teal, "right");
    }
  };
  var W_ = NC * T;
}

/* ============ 6. Falling Blocks ============ */
var PIECES = [
  { c: C.teal, s: [[-1, 0], [0, 0], [1, 0], [2, 0]] }, { c: C.yel, s: [[0, 0], [1, 0], [0, 1], [1, 1]], o: 1 }, { c: C.pur, s: [[-1, 0], [0, 0], [1, 0], [0, -1]] },
  { c: C.grn, s: [[-1, 0], [0, 0], [0, -1], [1, -1]] }, { c: C.red, s: [[-1, -1], [0, -1], [0, 0], [1, 0]] }, { c: C.blu, s: [[-1, -1], [-1, 0], [0, 0], [1, 0]] }, { c: C.org, s: [[1, -1], [-1, 0], [0, 0], [1, 0]] }];
function blocks(G) {
  var CS = 15, BW = 10, BH = 20, OX = 10, OY = 10, b, cur, nxt, bag, x, y, cells, drop, lines, lv, sc, hold, ht, flash;
  function nextP() { if (!bag.length) { bag = [0, 1, 2, 3, 4, 5, 6]; for (var i = 6; i > 0; i--) { var j = rnd(i + 1), t = bag[i]; bag[i] = bag[j]; bag[j] = t; } } return bag.pop(); }
  function fits(cs, px, py) { return cs.every(function (p) { var a = px + p[0], r = py + p[1]; return a >= 0 && a < BW && r < BH && (r < 0 || !b[r][a]); }); }
  function spawn() { cur = nxt; nxt = nextP(); cells = PIECES[cur].s.map(function (p) { return p.slice(); }); x = 4; y = 1; drop = 0; if (!fits(cells, x, y)) { G.save(sc); G.end("GAME OVER", "SCORE " + sc); } }
  function rot() { if (PIECES[cur].o) return; var n = cells.map(function (p) { return [-p[1], p[0]]; }); [0, -1, 1, -2, 2].some(function (k) { if (fits(n, x + k, y)) { cells = n; x += k; G.beep(440, 0.03); return true; } return false; }); }
  function lock() {
    cells.forEach(function (p) { if (y + p[1] >= 0) b[y + p[1]][x + p[0]] = PIECES[cur].c; });
    var n = 0; for (var r = BH - 1; r >= 0; r--) if (b[r].every(function (v) { return v; })) { b.splice(r, 1); b.unshift(new Array(BW).fill(0)); n++; r++; }
    if (n) { lines += n; sc += [0, 100, 300, 500, 800][n] * lv; lv = 1 + Math.floor(lines / 10); G.score(sc); G.beep(600, 0.2, "square", 0.05, 1000); flash = 0.15; } else G.beep(160, 0.05);
    spawn();
  }
  function move(d) { if (fits(cells, x + d, y)) { x += d; G.beep(300, 0.02); } }
  var sx, sy, mv;
  return {
    reset: function () { b = []; for (var i = 0; i < BH; i++) b.push(new Array(BW).fill(0)); bag = []; nxt = nextP(); lines = 0; lv = 1; sc = 0; hold = 0; ht = 0; flash = 0; spawn(); G.score(0); },
    key: function (k, d) {
      if (!d) { if (k === "ArrowLeft" || k === "ArrowRight") hold = 0; return; }
      if (k === "ArrowLeft") { hold = -1; ht = 0.17; move(-1); } else if (k === "ArrowRight") { hold = 1; ht = 0.17; move(1); }
      else if (k === "ArrowUp") rot();
      else if (k === "Space") { var n = 0; while (fits(cells, x, y + 1)) { y++; n++; } sc += n * 2; G.score(sc); lock(); }
    },
    ptr: function (px, py, ph) {
      if (ph === "down") { sx = px; sy = py; mv = false; return; } if (sx == null) return;
      if (ph === "move") { var dx = px - sx; if (Math.abs(dx) > 14) { move(dx > 0 ? 1 : -1); sx = px; mv = true; } else if (py - sy > 40) { while (fits(cells, x, y + 1)) y++; lock(); sy = py; mv = true; } }
      if (ph === "up") { if (!mv) rot(); sx = null; }
    },
    update: function (dt) {
      if (flash > 0) flash -= dt;
      if (hold) { ht -= dt; while (ht <= 0) { move(hold); ht += 0.05; } }
      var iv = G.keys.ArrowDown ? 0.04 : Math.max(0.07, 0.8 - (lv - 1) * 0.07); drop += dt;
      while (drop >= iv && G.st === "play") { drop -= iv; if (fits(cells, x, y + 1)) { y++; if (G.keys.ArrowDown) { sc++; G.score(sc); } } else { lock(); break; } }
    },
    draw: function (c) {
      c.fillStyle = flash > 0 ? "#2a2a66" : "#10102e"; c.fillRect(OX - 2, OY - 2, BW * CS + 4, BH * CS + 4); c.fillStyle = "#0b0b22"; c.fillRect(OX, OY, BW * CS, BH * CS);
      function cell(a, r, col) { G.rect(OX + a * CS, OY + r * CS, CS - 1, CS - 1, col); G.rect(OX + a * CS, OY + r * CS, CS - 1, 3, "rgba(255,255,255,.4)"); G.rect(OX + a * CS, OY + r * CS + CS - 4, CS - 1, 3, "rgba(0,0,0,.3)"); }
      for (var r = 0; r < BH; r++) for (var a = 0; a < BW; a++) if (b[r][a]) cell(a, r, b[r][a]);
      var gy = y; while (fits(cells, x, gy + 1)) gy++;
      cells.forEach(function (p) { if (gy + p[1] >= 0) { c.strokeStyle = PIECES[cur].c; c.globalAlpha = 0.5; c.strokeRect(OX + (x + p[0]) * CS + .5, OY + (gy + p[1]) * CS + .5, CS - 2, CS - 2); c.globalAlpha = 1; } });
      cells.forEach(function (p) { if (y + p[1] >= 0) cell(x + p[0], y + p[1], PIECES[cur].c); });
      G.txt("NEXT", 200, 22, 8, C.teal); PIECES[nxt].s.forEach(function (p) { G.rect(192 + (p[0] + 1) * 11 - (PIECES[nxt].o ? 0 : 0), 38 + (p[1] + 1) * 11, 10, 10, PIECES[nxt].c); });
      G.txt("LINES", 200, 120, 8, C.teal); G.txt(String(lines), 200, 138, 8, C.wht);
      G.txt("LEVEL", 200, 170, 8, C.teal); G.txt(String(lv), 200, 188, 8, C.wht);
    }
  };
}

/* ============ 7. Road Hopper ============ */
function hopper(G) {
  var CS = 24, NCOL = 13, W = 312, fx, row, maxRow, lives, lv, sc, tl, bays, dead, off, sx, sy, mult;
  var LANES = {
    1: { d: 1, v: 1.6, w: 3, g: 3, k: "log" }, 2: { d: -1, v: 2.2, w: 2, g: 3, k: "log" }, 3: { d: 1, v: 1.2, w: 4, g: 3, k: "log" }, 4: { d: -1, v: 1.8, w: 3, g: 3, k: "log" }, 5: { d: 1, v: 2.4, w: 2, g: 3, k: "log" },
    7: { d: -1, v: 2.2, w: 1, g: 4, k: "car" }, 8: { d: 1, v: 3.0, w: 2, g: 5, k: "truck" }, 9: { d: -1, v: 1.6, w: 1, g: 3, k: "car" }, 10: { d: 1, v: 2.8, w: 1, g: 4, k: "car" }, 11: { d: -1, v: 3.6, w: 1, g: 6, k: "car" }
  };
  var CARC = [C.red, C.yel, C.pink, C.org, C.pur];
  function objs(r, t) {
    var L = LANES[r], per = L.w + L.g, n = Math.ceil((NCOL + L.w) / per), Lc = n * per, o = [], i;
    for (i = 0; i < n; i++) { var p = (((i * per + L.d * (off[r] || 0)) % Lc) + Lc) % Lc - L.w; o.push(p); }
    return o;
  }
  function respawn() { fx = 6; row = 12; maxRow = 12; tl = 30; dead = 0; }
  function die() { lives--; G.beep(160, 0.5, "sawtooth", 0.06, 40); if (lives <= 0) { G.save(sc); G.end("GAME OVER", "SCORE " + sc); return; } dead = 0.8; }
  function hop(dx, dy) {
    if (dead > 0) return; var nx = Math.round(fx) + dx, nr = row + dy;
    if (nr < 0 || nr > 12 || nx < 0 || nx > NCOL - 1) return;
    if (dy === 0 && LANES[row] && LANES[row].k === "log") nx = Math.round(fx + dx);
    fx = (LANES[nr] && LANES[nr].k === "log") ? (dy ? fx : nx) : nx; row = nr; G.beep(520, 0.04, "square", 0.03, 700);
    if (nr < maxRow) { maxRow = nr; sc += 10; G.score(sc); }
    if (nr === 0) {
      var bi = Math.round(fx);
      if (bi % 2 === 1 && !bays[(bi - 1) / 2]) { bays[(bi - 1) / 2] = 1; sc += 50 + Math.floor(tl) * 2; G.score(sc); G.beep(900, 0.3, "square", 0.05, 1400); if (bays.every(function (v) { return v; })) { lv++; mult *= 1.12; bays = [0, 0, 0, 0, 0, 0]; sc += 200; G.score(sc); } respawn(); } else die();
    }
  }
  return {
    reset: function () { lives = 3; lv = 1; sc = 0; mult = 1; bays = [0, 0, 0, 0, 0, 0]; off = {}; respawn(); G.score(0); },
    key: function (k, d) { if (!d) return; if (k === "ArrowUp") hop(0, -1); else if (k === "ArrowDown") hop(0, 1); else if (k === "ArrowLeft") hop(-1, 0); else if (k === "ArrowRight") hop(1, 0); },
    ptr: function (x, y, ph) {
      if (ph === "down") { sx = x; sy = y; return; } if (sx == null) return;
      var dx = x - sx, dy = y - sy;
      if (ph === "up") { if (Math.abs(dx) < 12 && Math.abs(dy) < 12) hop(0, -1); sx = null; return; }
      if (Math.abs(dx) > 20 || Math.abs(dy) > 20) { if (Math.abs(dx) > Math.abs(dy)) hop(dx > 0 ? 1 : -1, 0); else hop(0, dy > 0 ? 1 : -1); sx = null; }
    },
    update: function (dt) {
      for (var r in LANES) off[r] = (off[r] || 0) + LANES[r].v * mult * dt;
      if (dead > 0) { dead -= dt; if (dead <= 0) respawn(); return; }
      tl -= dt; if (tl <= 0) { die(); return; }
      var L = LANES[row];
      if (L) {
        var o = objs(row), fc = fx + 0.5;
        if (L.k === "log") {
          var on = o.some(function (p) { return fc >= p + 0.1 && fc <= p + L.w - 0.1; });
          if (!on) { G.beep(250, 0.3, "sawtooth", 0.05, 80); die(); return; }
          fx += L.d * L.v * mult * dt; if (fx < -0.4 || fx > NCOL - 0.6) die();
        } else if (o.some(function (p) { return fx + 0.85 > p && fx + 0.15 < p + L.w; })) die();
      }
    },
    draw: function (c) {
      G.rect(0, 0, W, 24, "#1b5e20"); G.rect(0, 24, W, 120, "#0d3d9c"); G.rect(0, 144, W, 24, "#2a6b2a"); G.rect(0, 168, W, 120, "#2b2b3a"); G.rect(0, 288, W, 24, "#2a6b2a");
      for (var i = 0; i < 6; i++) { G.rect(24 + i * 48, 2, 24, 22, bays[i] ? "#1b5e20" : "#0d3d9c"); if (bays[i]) { G.rect(24 + i * 48 + 6, 8, 12, 10, C.grn); } }
      c.fillStyle = "#555"; for (var rr = 7; rr <= 11; rr++) for (var xx = 0; xx < W; xx += 24) c.fillRect(xx + 6, rr * CS + 23, 10, 1);
      for (var r in LANES) {
        var L = LANES[r], o = objs(+r);
        o.forEach(function (p, k) {
          var x = p * CS, w = L.w * CS, y = r * CS;
          if (L.k === "log") { G.rect(x, y + 3, w, CS - 6, "#8a5a2b"); G.rect(x, y + 3, w, 3, "#b07a40"); for (var s = 6; s < w - 4; s += 14) G.rect(x + s, y + 9, 6, 2, "#5a3a1a"); }
          else { var col = L.k === "truck" ? C.wht : CARC[(+r + k) % CARC.length]; G.rect(x + 1, y + 4, w - 2, CS - 8, col); G.rect(L.d > 0 ? x + w - 8 : x + 2, y + 6, 6, CS - 12, "#9fe7ff"); G.rect(x + 3, y + CS - 5, 5, 3, "#000"); G.rect(x + w - 8, y + CS - 5, 5, 3, "#000"); G.rect(x + 3, y + 2, 5, 3, "#000"); G.rect(x + w - 8, y + 2, 5, 3, "#000"); }
        });
      }
      var gx = fx * CS, gy = row * CS;
      if (dead > 0) { G.txt("X", gx + 12, gy + 12, 16, C.red); } else {
        G.rect(gx + 4, gy + 6, 16, 13, C.grn); G.rect(gx + 2, gy + 14, 4, 6, C.grn); G.rect(gx + 18, gy + 14, 4, 6, C.grn); G.rect(gx + 5, gy + 3, 5, 5, C.grn); G.rect(gx + 14, gy + 3, 5, 5, C.grn); G.rect(gx + 7, gy + 4, 2, 2, "#000"); G.rect(gx + 16, gy + 4, 2, 2, "#000");
      }
      G.rect(0, 312, W, 24, "#0b0b22"); G.rect(80, 318, Math.max(0, tl / 30) * 120, 10, tl < 8 ? C.red : C.yel); G.txt("TIME", 8, 324, 8, C.teal, "left");
      for (var j = 0; j < lives; j++) G.rect(W - 18 - j * 14, 318, 10, 10, C.grn);
    }
  };
}

/* ---------- registry ---------- */
var GAMES = {
  retrosnake: { name: "Retro Snake", tag: "EAT, GROW, DON'T CRASH", w: 320, h: 320, mw: 400, make: snake, arrowStart: 1, pad: [["◀", "ArrowLeft", "Left"], ["▲", "ArrowUp", "Up"], ["▼", "ArrowDown", "Down"], ["▶", "ArrowRight", "Right"]], help: "Arrow keys or WASD to steer. On a phone, swipe on the screen or use the buttons. P to pause." },
  rally: { name: "Paddle Rally", tag: "FIRST TO 7 WINS", w: 360, h: 240, mw: 520, make: rally, opts: [["easy", "Easy"], ["normal", "Normal"], ["hard", "Hard"]], bl: "Wins", pad: [["▲", "ArrowUp", "Up"], ["▼", "ArrowDown", "Down"]], sl: "Score", help: "Up and down arrows (or W and S), or drag your finger up and down the screen. Beat the computer to 7 points." },
  bricks: { name: "Brick Smash", tag: "CLEAR EVERY BRICK", w: 300, h: 360, mw: 400, make: bricks, pad: [["◀", "ArrowLeft", "Left"], ["LAUNCH", "Space", "Launch ball"], ["▶", "ArrowRight", "Right"]], help: "Left and right arrows or drag to move the bat. Space or tap to launch the ball. You have 3 lives." },
  blaster: { name: "Star Blaster", tag: "STOP THE INVASION", w: 300, h: 360, mw: 400, make: blaster, repeat: 1, pad: [["◀", "ArrowLeft", "Left"], ["FIRE", "Space", "Fire"], ["▶", "ArrowRight", "Right"]], help: "Left and right arrows to move, hold Space to fire. On a phone use the buttons or drag the ship. Hide behind the green shields." },
  muncher: { name: "Maze Muncher", tag: "EAT ALL THE DOTS", w: 304, h: 352, mw: 400, make: muncher, arrowStart: 1, pad: [["◀", "ArrowLeft", "Left"], ["▲", "ArrowUp", "Up"], ["▼", "ArrowDown", "Down"], ["▶", "ArrowRight", "Right"]], help: "Arrow keys or WASD to steer, or swipe on the screen. Grab a big pellet to turn the ghosts blue and chase them." },
  blocks: { name: "Falling Blocks", tag: "FILL THE LINES", w: 240, h: 320, mw: 340, make: blocks, repeat: 0, pad: [["◀", "ArrowLeft", "Left"], ["⟳", "ArrowUp", "Rotate"], ["▼", "ArrowDown", "Down"], ["DROP", "Space", "Hard drop"], ["▶", "ArrowRight", "Right"]], help: "Left and right to move, up to rotate, down to speed up, Space to drop. On a phone tap the screen to rotate, swipe sideways to move." },
  hopper: { name: "Road Hopper", tag: "CROSS THE ROAD AND RIVER", w: 312, h: 336, mw: 400, make: hopper, pad: [["◀", "ArrowLeft", "Left"], ["▲", "ArrowUp", "Up"], ["▼", "ArrowDown", "Down"], ["▶", "ArrowRight", "Right"]], help: "Hop with the arrow keys or swipe. Dodge the traffic, ride the logs and land in an empty green bay." }
};
var NAMES = {}; for (var k in GAMES) NAMES[k] = GAMES[k].name;
window.ARC = {
  ids: Object.keys(GAMES), names: NAMES,
  init: function (id) { var g = GAMES[id], h = $("a-" + id); if (g && h && !h.firstChild) mount(id, h, g); }
};
})();
