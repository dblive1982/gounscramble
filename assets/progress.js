/* Game progress. Saved in this browser always, and to your account too when you are signed in.
   Shape: { ws: { done: {Cat: [n,...]}, cur: {"Cat|n": {f:[[WORD,colour],...], h:hintsUsed, hc:[cellIdx], t}} , t },
            sd: { lv, sol, giv, cur, done, stats:{easy,medium,hard}, t } } */
(function () {
  "use strict";
  var KEY = "gu-progress", data = {}, timer = null, listeners = [];

  function read() {
    try { var s = localStorage.getItem(KEY); if (s) data = JSON.parse(s) || {}; } catch (e) { data = {}; }
    // One-off: bring over word search results saved by the first version.
    try {
      var old = localStorage.getItem("gu-ws");
      if (old && !(data.ws && data.ws.done)) { data.ws = data.ws || {}; data.ws.done = JSON.parse(old) || {}; data.ws.t = data.ws.t || 1; }
    } catch (e) { /* ignore */ }
  }
  function write() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable */ } }
  function signedIn() { try { return localStorage.getItem("gu-in") === "1"; } catch (e) { return false; } }

  function union(a, b) { var s = {}; (a || []).concat(b || []).forEach(function (x) { s[x] = 1; }); return Object.keys(s).map(Number).sort(function (x, y) { return x - y; }); }

  // Combine what this device has with what the account has, never losing a finished puzzle.
  function merge(local, remote) {
    local = local || {}; remote = remote || {};
    var out = {};
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
      if (d && d.user === null) { try { localStorage.removeItem("gu-in"); } catch (e) { /* ignore */ } }
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
    mark: function () { if (markToday()) { write(); queue(); listeners.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } }); } },
    days: function (ym) { return ((data.ad || {})[ym] || []).slice(); },
    get: function (g) { return data[g]; },
    set: function (g, v) { v.t = Date.now(); data[g] = v; markToday(); write(); queue(); },
    all: function () { return data; },
    onChange: function (fn) { listeners.push(fn); },
    // Pull the account copy and merge it in. Resolves to true when something changed.
    sync: function () {
      if (!signedIn()) return Promise.resolve(false);
      return fetch("api/progress.php", { credentials: "same-origin" })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d || d.user === null) { try { localStorage.removeItem("gu-in"); } catch (e) { /* ignore */ } return false; }
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
  read();
  window.GUP = api;
})();
