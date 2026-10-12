/* Game progress. Saved in this browser always, and to your account too when you are signed in.
   Shape: { ws: { done: {Cat: [n,...]}, cur: {"Cat|n": {f:[[WORD,colour],...], h:hintsUsed, hc:[cellIdx], t}} , t },
            sd: { lv, sol, giv, cur, done, stats:{easy,medium,hard}, t } } */
(function () {
  "use strict";
  var KEY = "gu-progress", data = {}, timer = null, listeners = [];

  // Progress is only kept (and shown) while you are signed in. Signed out, it lives in memory for this page only.
  function forget() { data = {}; try { localStorage.removeItem(KEY); localStorage.removeItem("gu-ws"); } catch (e) { /* ignore */ } }
  function read() {
    if (!signedIn()) { forget(); return; }
    try { var s = localStorage.getItem(KEY); if (s) data = JSON.parse(s) || {}; } catch (e) { data = {}; }
    // One-off: bring over word search results saved by the first version.
    try {
      var old = localStorage.getItem("gu-ws");
      if (old && !(data.ws && data.ws.done)) { data.ws = data.ws || {}; data.ws.done = JSON.parse(old) || {}; data.ws.t = data.ws.t || 1; }
    } catch (e) { /* ignore */ }
  }
  function write() { if (!signedIn()) return; try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable */ } }
  function signedIn() { try { return localStorage.getItem("gu-in") === "1"; } catch (e) { return false; } }

  function union(a, b) { var s = {}; (a || []).concat(b || []).forEach(function (x) { s[x] = 1; }); return Object.keys(s).map(Number).sort(function (x, y) { return x - y; }); }

  // Combine what this device has with what the account has, never losing a finished puzzle.
  // Anything saved before the latest "reset" (on any device) is dropped.
  function strip(d, rs) { var r = {}, k; for (k in d) if (k !== "rs" && (k === "dy" || k === "cc" || !d[k] || (d[k].t || 0) >= rs)) r[k] = d[k]; return r; }
  function merge(local, remote) {
    local = local || {}; remote = remote || {};
    var rst = Math.max((local.rs || {}).t || 0, (remote.rs || {}).t || 0);
    if (rst) { local = strip(local, rst); remote = strip(remote, rst); }
    var out = {};
    if (rst) out.rs = { t: rst };
    ["sl", "c4", "tt", "mm", "hm"].forEach(function (g) {
      var a = local[g], b = remote[g];
      if (!a) { if (b) out[g] = b; } else if (!b) out[g] = a; else out[g] = ((a.t || 0) >= (b.t || 0)) ? a : b;
    });
    (function () {
      var a = local.gs, b = remote.gs;
      if (!a && !b) return;
      var r = {}, k;
      a = a || {}; b = b || {};
      for (k in a) r[k] = a[k];
      for (k in b) {
        if (k === "t") continue;
        if (k === "mmb") r[k] = (r[k] && b[k]) ? Math.min(r[k], b[k]) : (r[k] || b[k]);
        else r[k] = Math.max(r[k] || 0, b[k] || 0);
      }
      r.t = Math.max(a.t || 0, b.t || 0);
      out.gs = r;
    })();
    (function () {                       // days played: keep every day seen on either side
      var a = local.ad, b = remote.ad;
      if (!a && !b) return;
      a = a || {}; b = b || {};
      var r = { t: Math.max(a.t || 0, b.t || 0) }, k;
      for (k in a) if (k !== "t") r[k] = a[k];
      for (k in b) if (k !== "t") r[k] = r[k] ? union(r[k], b[k]) : b[k];
      out.ad = r;
    })();
    (function () {                       // diary: newest edit of each day wins
      var a = local.dy, b = remote.dy;
      if (!a && !b) return;
      var an = (a || {}).n || {}, bn = (b || {}).n || {}, r = {}, k;
      for (k in an) r[k] = an[k];
      for (k in bn) if (!r[k] || (bn[k].t || 0) > (r[k].t || 0)) r[k] = bn[k];
      out.dy = { n: r, t: Math.max((a || {}).t || 0, (b || {}).t || 0) };
    })();
    (function () {                       // saved calculators: newest save of each calculator wins
      var a = local.cc, b = remote.cc;
      if (!a && !b) return;
      var r = {}, k; a = a || {}; b = b || {};
      for (k in a) r[k] = a[k];
      for (k in b) if (!r[k] || (b[k].t || 0) > (r[k].t || 0)) r[k] = b[k];
      out.cc = r;
    })();
    ["ws", "sd"].forEach(function (g) {
      var a = local[g], b = remote[g];
      if (!a) { if (b) out[g] = b; return; }
      if (!b) { out[g] = a; return; }
      if (g === "ws") {
        var r = { done: {}, cur: {}, t: Math.max(a.t || 0, b.t || 0) };
        var cats = {}; Object.keys(a.done || {}).concat(Object.keys(b.done || {})).forEach(function (c) { cats[c] = 1; });
        Object.keys(cats).forEach(function (c) { r.done[c] = union((a.done || {})[c], (b.done || {})[c]); });
        var keys = {}; Object.keys(a.cur || {}).concat(Object.keys(b.cur || {})).forEach(function (k) { keys[k] = 1; });
        Object.keys(keys).forEach(function (k) {
          var x = (a.cur || {})[k], y = (b.cur || {})[k], cat = k.split("|")[0], n = +k.split("|")[1];
          if (((r.done[cat]) || []).indexOf(n) >= 0) return;          // finished somewhere, so no longer in progress
          r.cur[k] = (!y || (x && (x.t || 0) >= (y.t || 0))) ? x : y;
        });
        out.ws = r;
      } else {
        var s = ((a.t || 0) >= (b.t || 0)) ? a : b, o = (s === a) ? b : a;
        var st = {}; ["easy", "medium", "hard"].forEach(function (k) { st[k] = Math.max(((a.stats || {})[k]) || 0, ((b.stats || {})[k]) || 0); });
        s = JSON.parse(JSON.stringify(s)); s.stats = st; out.sd = s;
      }
    });
    return out;
  }

  function push() {
    if (!signedIn()) return;
    fetch("api/progress.php", {
      method: "POST", credentials: "same-origin", keepalive: true,
      headers: { "Content-Type": "application/json", "X-GU": "1" },
      body: JSON.stringify({ data: data })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.user === null) { try { localStorage.removeItem("gu-in"); } catch (e) { /* ignore */ } forget(); }
    }).catch(function () { /* will retry on the next change */ });
  }
  function queue() { if (!signedIn()) return; clearTimeout(timer); timer = setTimeout(push, 1500); }

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  // Remember that today was a day you played (no scores, just the date).
  function markToday() {
    var d = new Date(), ym = d.getFullYear() + "-" + pad(d.getMonth() + 1), ad = data.ad || (data.ad = {});
    var arr = ad[ym] || (ad[ym] = []);
    if (arr.indexOf(d.getDate()) >= 0) return false;
    arr.push(d.getDate()); arr.sort(function (x, y) { return x - y; });
    var ks = Object.keys(ad).filter(function (k) { return k !== "t"; }).sort();
    while (ks.length > 14) delete ad[ks.shift()];
    ad.t = Date.now();
    return true;
  }

  var api = {
    // Called on sign-out: nothing from this account is left behind on the device.
    clear: function () { clearTimeout(timer); forget(); listeners.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } }); },
    signedIn: signedIn,
    // Wipe saved games, scores and the calendar here and on the account (other devices follow on their next sync).
    reset: function () {
      var keepDiary = data.dy, keepCalc = data.cc;
      clearTimeout(timer); data = { rs: { t: Date.now() } }; if (keepDiary) data.dy = keepDiary; if (keepCalc) data.cc = keepCalc; write();
      listeners.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } });
      push();
    },
    mark: function () { if (markToday()) { write(); queue(); listeners.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } }); } },
    // Diary: one short note per date ("YYYY-MM-DD"). Reset keeps the diary.
    note: function (d) { var e = ((data.dy || {}).n || {})[d]; return (e && e.x) || ""; },
    notes: function () { var o = {}, n = (data.dy || {}).n || {}, k; for (k in n) if (n[k] && n[k].x) o[k] = n[k].x; return o; },
    setNote: function (d, x) {
      if (!signedIn() || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
      x = String(x == null ? "" : x).slice(0, 500);
      var dy = data.dy || (data.dy = { n: {} }), n = dy.n || (dy.n = {}), now = Date.now(), k;
      if (!x.trim()) { if (!n[d] || !n[d].x) return; n[d] = { x: "", t: now }; } else n[d] = { x: x, t: now };
      for (k in n) if (!n[k].x && now - (n[k].t || 0) > 60 * 864e5) delete n[k];
      dy.t = now; write(); queue();
      listeners.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } });
    },
    // Calculators: the last inputs used in each one (signed in only).
    getCalc: function (slug) { var c = (data.cc || {})[slug]; return c && c.v ? Object.assign({}, c.v) : null; },
    setCalc: function (slug, vals) {
      if (!signedIn() || !/^[a-z0-9-]{1,40}$/.test(slug)) return;
      var cc = data.cc || (data.cc = {}), now = Date.now(), ks = Object.keys(cc);
      cc[slug] = { v: vals, t: now };
      if (ks.length > 60) { ks.sort(function (x, y) { return (cc[x].t || 0) - (cc[y].t || 0); }); delete cc[ks[0]]; }
      write(); queue();
    },
    calcs: function () { var o = {}, c = data.cc || {}; Object.keys(c).forEach(function (k) { o[k] = c[k].t || 0; }); return o; },
    clearCalcs: function () { data.cc = {}; write(); push(); listeners.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } }); },
    days: function (ym) { return ((data.ad || {})[ym] || []).slice(); },
    get: function (g) { return data[g]; },
    set: function (g, v) {
      // A game that has just ended counts as one game played.
      if (/^(sl|c4|tt|mm|hm)$/.test(g) && v.over && !(data[g] && data[g].over)) { var o = data.gs || (data.gs = {}); o.gp = (o.gp || 0) + 1; o.t = Date.now(); }
      v.t = Date.now(); data[g] = v; markToday(); write(); queue();
    },
    all: function () { return data; },
    onChange: function (fn) { listeners.push(fn); },
    // Pull the account copy and merge it in. Resolves to true when something changed.
    sync: function () {
      if (!signedIn()) return Promise.resolve(false);
      return fetch("api/progress.php", { credentials: "same-origin" })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d || d.user === null) { try { localStorage.removeItem("gu-in"); } catch (e) { /* ignore */ } forget(); return false; }
          var before = JSON.stringify(data);
          data = merge(data, d.data || {});
          var changed = JSON.stringify(data) !== before;
          write();
          if (JSON.stringify(data) !== JSON.stringify(d.data || {})) push();
          if (changed) listeners.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } });
          return changed;
        }).catch(function () { return false; });
    }
  };
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden" && signedIn()) push(); });
  // Phones can restore a cached page on Back: re-check the sign-in state so nothing from a signed-out account is shown.
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    if (!signedIn()) api.clear(); else api.sync();
    if (window.guMenu) window.guMenu();
  });
  read();
  window.GUToast = function (msg) {
    var t = document.getElementById("gu-toast");
    if (!t) { t = document.createElement("div"); t.id = "gu-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.className = "on"; clearTimeout(t._t); t._t = setTimeout(function () { t.className = ""; }, 1800);
  };
  window.GUP = api;
})();
