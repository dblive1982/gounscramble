/* Home page hub: try-a-scramble chips, progress summary and play calendar. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var f = $("f"), r = $("rack"), G = window.GUP;
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function signedIn() { try { return localStorage.getItem("gu-in") === "1"; } catch (e) { return false; } }

  function playedSet() {
    var G = window.GUP, o = {}; if (!G || !G.get) return o;
    function has(k) { var v = G.get(k); return !!v && (typeof v !== "object" || Object.keys(v).length > 0); }
    var ws = G.get("ws") || {}, any = function (x) { return x && Object.keys(x).some(function (c) { var v = x[c]; return Array.isArray(v) ? v.length : !!v; }); };
    o.wordsearch = any(ws.done) || any(ws.cur); o.sudoku = has("sd"); o.connect4 = has("c4"); o.ttt = has("tt"); o.memory = has("mm"); o.hangman = has("hm"); o.snakes = has("sl");
    return o;
  }
  function markPlayed() {
    var p = playedSet();
    document.querySelectorAll("[data-go], a.hb-card[href^='games.html#']").forEach(function (a) {
      var k = a.getAttribute("data-go") || (a.getAttribute("href") || "").split("#")[1], on = !!p[k];
      a.classList.toggle("played", on);
    });
  }
  markPlayed(); if (window.GUP && GUP.onChange) GUP.onChange(markPlayed);

  // Try a scramble: a fresh set of jumbled real words on every visit, and a button for more.
  var POOL = "airport anchor balloon basket bedroom blanket blossom brave breeze bridge candle captain castle chapter cherry chicken cloud cottage cricket curtain dance diamond dinner dolphin dragon eagle elephant eleven engine fabric famous father flame flower forest friend garden gentle ghost ginger giraffe guitar hammer harbor heart holiday insect invent island ivory jacket jewel joker journey jungle karma kitchen kitten knight ladder lemon light magnet mango market mirror monkey music nature night noble ocean office olive orange parent peace penguin pepper piano picture pillow planet pocket pumpkin purple queen quest quiet rabbit radio rhythm river rocket sandwich school shine silver simple stone summer sunset teacher thunder ticket tiger tomato trail ultra umbrella unity velvet village vivid water whale window winter wizard yellow yogurt youth zebra zipper".split(" ");
  var chips = $("hb-chips"), roll = $("hb-roll");
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function jumble(w) { var a = w.split(""), o; for (var n = 0; n < 8; n++) { o = shuffle(a.slice()).join(""); if (o !== w) return o; } return o; }
  function pick(n) { return shuffle(POOL.slice()).slice(0, n); }
  function makeChips() {
    if (!chips) return;
    var old = chips.querySelectorAll("[data-rack]"); old.forEach(function (b) { b.remove(); });
    var ws = pick(6), list = ws.map(function (w, i) {
      if (i === 5) { var a = w.split(""); a[Math.floor(Math.random() * a.length)] = "?"; return jumble(a.join("")).replace(/\?/g, "?"); }
      return jumble(w);
    });
    list.forEach(function (t) {
      var b = document.createElement("button"); b.type = "button"; b.setAttribute("data-rack", t); b.textContent = t.toUpperCase();
      chips.appendChild(b);
    });
  }
  if (chips) {
    makeChips();
    chips.addEventListener("click", function (e) {
      var b = e.target.closest("[data-rack]"); if (!b || !f || !r) return;
      r.value = b.getAttribute("data-rack");
      r.dispatchEvent(new Event("input", { bubbles: true }));
      if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event("submit", { cancelable: true }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    if (roll) roll.addEventListener("click", function () {
      roll.classList.remove("spin"); void roll.offsetWidth; roll.classList.add("spin"); makeChips();
    });
  }
  // Cards pop in as they scroll into view.
  (function () {
    var hub = document.querySelector(".hub");
    if (!hub || !("IntersectionObserver" in window) || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    var items = hub.querySelectorAll(".hb-card,.hb-fact,.hb-stats div,.hb-mine,.hb-cal");
    hub.classList.add("pop");
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el, i) { el.style.setProperty("--d", (i % 4) * 70 + "ms"); io.observe(el); });
  })();

  // Live tiles: today's weather and an "on this day" fact. Both are optional extras; the page works without them.
  (function () {
    var wx = $("hb-wx"), otd = $("hb-otd");
    function cache(k, ttl, fn) {
      var now = Date.now(), v = null;
      try { v = JSON.parse(sessionStorage.getItem(k) || "null"); } catch (e) { v = null; }
      if (v && now - v.t < ttl) return Promise.resolve(v.d);
      return fn().then(function (d) { try { sessionStorage.setItem(k, JSON.stringify({ t: now, d: d })); } catch (e) { /* ignore */ } return d; });
    }
    function getJSON(u) { return fetch(u).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
    function put(el, big, small, extra) {
      el.innerHTML = ""; var b = document.createElement("b"), s = document.createElement("span");
      b.textContent = big; s.textContent = small; el.appendChild(b); el.appendChild(s);
      if (extra) { var e = document.createElement("em"); e.textContent = extra; el.appendChild(e); }
    }
    var WX = [[0, "\u2600\uFE0F", "Clear"], [1, "\uD83C\uDF24\uFE0F", "Mostly clear"], [2, "\u26C5", "Part cloudy"], [3, "\u2601\uFE0F", "Cloudy"], [45, "\uD83C\uDF2B\uFE0F", "Foggy"], [51, "\uD83C\uDF26\uFE0F", "Drizzle"], [56, "\uD83C\uDF27\uFE0F", "Freezing drizzle"], [61, "\uD83C\uDF27\uFE0F", "Rain"], [66, "\uD83C\uDF27\uFE0F", "Freezing rain"], [71, "\uD83C\uDF28\uFE0F", "Snow"], [80, "\uD83C\uDF26\uFE0F", "Showers"], [85, "\uD83C\uDF28\uFE0F", "Snow showers"], [95, "\u26C8\uFE0F", "Thunderstorm"]];
    function wxInfo(c) { var r = WX[0]; for (var i = 0; i < WX.length; i++) if (c >= WX[i][0]) r = WX[i]; return r; }
    if (wx) {
      var tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { /* ignore */ }
      var city = (tz.split("/").pop() || "London").replace(/_/g, " ") || "London";
      if (/^(UTC|GMT|Etc)/i.test(city)) city = "London";
      var f = /^en-US|^en-LR|^en-MM/i.test(navigator.language || "");
      cache("gu-wx", 30 * 60 * 1000, function () {
        return getJSON("https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + encodeURIComponent(city)).then(function (g) {
          var p = g && g.results && g.results[0]; if (!p) throw 0;
          return getJSON("https://api.open-meteo.com/v1/forecast?latitude=" + p.latitude + "&longitude=" + p.longitude + "&current=temperature_2m,weather_code&timezone=auto").then(function (w) {
            if (!w || !w.current) throw 0; return { c: w.current.temperature_2m, code: w.current.weather_code, city: p.name };
          });
        });
      }).then(function (d) {
        var t = f ? d.c * 9 / 5 + 32 : d.c, i = wxInfo(d.code);
        wx.setAttribute("data-t", "Weather"); put(wx, i[1] + " " + Math.round(t) + (f ? "\u00B0F" : "\u00B0C"), i[2] + " in " + d.city);
        wx.classList.add("live");
      }).catch(function () { /* keep the built-in tile */ });
    }
    if (otd) {
      var d = new Date(), y = d.getFullYear(), mm = ("0" + (d.getMonth() + 1)).slice(-2), dd = ("0" + d.getDate()).slice(-2);
      var day = Math.floor((d - new Date(y, 0, 0)) / 864e5);
      function clean(t) { var x = document.createElement("div"); x.innerHTML = t; return (x.textContent || "").replace(/\s+/g, " ").replace(/\s*\(pictured\)/gi, "").trim(); }
      cache("gu-news-" + mm + dd, 30 * 60 * 1000, function () {
        var base = "https://en.wikipedia.org/api/rest_v1/feed/";
        var hist = getJSON(base + "onthisday/events/" + mm + "/" + dd).then(function (j) {
          return (j.events || []).filter(function (e) { return e.text && e.text.length <= 110 && e.year; })
            .map(function (e) { return { k: "On this day \u00B7 " + e.year, t: e.text }; });
        }).catch(function () { return []; });
        var now = getJSON(base + "featured/" + y + "/" + mm + "/" + dd).then(function (j) {
          return (j.news || []).map(function (n) { return { k: "In the news", t: clean(n.story || "") }; }).filter(function (n) { return n.t && n.t.length <= 150; });
        }).catch(function () { return []; });
        return Promise.all([hist, now]).then(function (r) {
          var h = r[0], n = r[1], out = [], i;
          for (i = 0; i < 3; i++) { if (n[i]) out.push(n[i]); if (h.length) out.push(h[(day * 7 + i * 13) % h.length]); }
          if (!out.length) throw 0; return out;
        });
      }).then(function (items) {
        function jumbled(w) { var a = w.split(""), o, n = 0; do { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } o = a.join(""); } while (o.toLowerCase() === w.toLowerCase() && ++n < 8); return o; }
        function render(it, reveal) {
          var words = it.t.split(" "), idx = [];
          words.forEach(function (w, i) { if (/^[A-Za-z]{5,}$/.test(w.replace(/[^A-Za-z]/g, "")) && w.replace(/[^A-Za-z]/g, "").length === w.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "").length) idx.push(i); });
          idx.sort(function (x, y2) { return words[y2].length - words[x].length; });
          var pick = idx.slice(0, 2);
          otd.innerHTML = "";
          if (it.k !== "In the news") { var k = document.createElement("em"); k.textContent = it.k; otd.appendChild(k); }
          var p = document.createElement("span"); p.className = "nt";
          words.forEach(function (w, i) {
            if (i) p.appendChild(document.createTextNode(" "));
            if (pick.indexOf(i) >= 0) {
              var m = /^([^A-Za-z]*)([A-Za-z]+)([^A-Za-z]*)$/.exec(w);
              if (m) {
                p.appendChild(document.createTextNode(m[1]));
                var s2 = document.createElement("mark"); s2.textContent = reveal ? m[2] : jumbled(m[2]); if (reveal) s2.className = "ok"; p.appendChild(s2);
                p.appendChild(document.createTextNode(m[3])); return;
              }
            }
            p.appendChild(document.createTextNode(w));
          });
          otd.appendChild(p);
          var h2 = document.createElement("small"); h2.textContent = reveal ? "Tap for another story" : "Tap to unscramble"; otd.appendChild(h2);
        }
        var cur = 0, shown = false, timer = null;
        function show(n) { cur = (n + items.length) % items.length; shown = false; otd.classList.add("fade"); setTimeout(function () { render(items[cur], false); otd.classList.remove("fade"); }, 180); }
        function tick() { if (!shown && !document.hidden && items.length > 1) show(cur + 1); }
        otd.setAttribute("aria-label", "News puzzle: tap to unscramble the jumbled words");
        otd.disabled = false; otd.classList.add("live"); otd.setAttribute("data-t", "News");
        render(items[0], false);
        otd.addEventListener("click", function () { if (!shown) { shown = true; render(items[cur], true); } else show(cur + 1); });
      }).catch(function () { /* keep the built-in tile */ });
    }
  })();
  // Third tile: a different word-list number each load.
  (function () {
    var el = document.querySelector(".hb-stats > div:nth-child(3)");
    if (!el) return;
    var F = [["8,636", "five-letter words"], ["96", "valid two-letter words"], ["28", "letters in the longest word"], ["10", "words typed on one keyboard row"], ["5", "anagrams of LISTEN"]];
    var order = F.slice().sort(function () { return Math.random() - .5; }), at = 0;
    function show(i, fade) {
      var f = order[i % order.length];
      function set() { el.innerHTML = "<b>" + f[0] + "</b><span>" + f[1] + "</span>"; el.classList.remove("fade"); }
      if (fade) { el.classList.add("fade"); setTimeout(set, 220); } else set();
    }
    show(0, false);
    setInterval(function () { if (!document.hidden) show(++at, true); }, 10000);
  })();
  // Numbers count up when the page loads.
  (function () {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll(".hb-stats > div:not(.hb-wx) b").forEach(function (el) {
      var txt = el.textContent, n = parseInt(txt.replace(/[^0-9]/g, ""), 10);
      if (!n || !/^[0-9,]+$/.test(txt)) return;
      var start = null, dur = 1100;
      el.textContent = "0";
      function step(t) {
        if (start === null) start = t;
        var k = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(n * e).toLocaleString("en-GB");
        if (k < 1) requestAnimationFrame(step); else el.textContent = txt;
      }
      requestAnimationFrame(step);
    });
  })();
  if (!G || !$("hb-cal")) return;
  if (f) f.addEventListener("submit", function () { if (r && r.value.replace(/\s/g, "")) { var o = G.get("gs") || {}; o.srch = (o.srch || 0) + 1; G.set("gs", o); } });

  var view = new Date(); view.setDate(1);
  function key(y, m, d) { return y + "-" + pad(m + 1) + "-" + pad(d); }
  var sel = key(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  function streak() {
    var n = 0, d = new Date();
    function had(x) { return G.days(x.getFullYear() + "-" + pad(x.getMonth() + 1)).indexOf(x.getDate()) >= 0; }
    if (!had(d)) d.setDate(d.getDate() - 1);          // today not played yet: the streak can still be alive
    while (had(d) && n < 400) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function calendar() {
    var host = $("hb-cal"), y = view.getFullYear(), m = view.getMonth(), ym = y + "-" + pad(m + 1);
    var played = G.days(ym), now = new Date(), isNow = now.getFullYear() === y && now.getMonth() === m;
    var first = (new Date(y, m, 1).getDay() + 6) % 7, len = new Date(y, m + 1, 0).getDate();
    host.innerHTML = "";
    var head = document.createElement("div"); head.className = "cal-head";
    var prev = document.createElement("button"); prev.type = "button"; prev.setAttribute("aria-label", "Previous month"); prev.innerHTML = "&lsaquo;";
    var next = document.createElement("button"); next.type = "button"; next.setAttribute("aria-label", "Next month"); next.innerHTML = "&rsaquo;"; next.disabled = isNow;
    var t = document.createElement("b"); t.textContent = MONTHS[m] + " " + y;
    prev.onclick = function () { view.setMonth(view.getMonth() - 1); calendar(); };
    next.onclick = function () { view.setMonth(view.getMonth() + 1); calendar(); };
    head.appendChild(prev); head.appendChild(t); head.appendChild(next); host.appendChild(head);
    var grid = document.createElement("div"); grid.className = "cal-grid";
    "MTWTFSS".split("").forEach(function (c) { var e = document.createElement("span"); e.className = "dow"; e.textContent = c; grid.appendChild(e); });
    for (var i = 0; i < first; i++) grid.appendChild(document.createElement("span"));
    for (var d = 1; d <= len; d++) {
      var e = document.createElement("button"), dk = key(y, m, d), fut = new Date(y, m, d) > now;
      e.type = "button"; e.textContent = d; e.setAttribute("data-d", dk); e.disabled = fut;
      var lab = d + " " + MONTHS[m] + (played.indexOf(d) >= 0 ? ", played" : "") + (G.note(dk) ? ", has a diary note" : "");
      e.setAttribute("aria-label", lab);
      if (played.indexOf(d) >= 0) e.classList.add("on");
      if (G.note(dk)) e.classList.add("note");
      if (isNow && d === now.getDate()) e.classList.add("today");
      if (dk === sel) e.classList.add("sel");
      e.onclick = function () { sel = this.getAttribute("data-d"); calendar(); diary(true); };
      grid.appendChild(e);
    }
    host.appendChild(grid);
    var s = streak(), foot = document.createElement("p"); foot.className = "cal-foot";
    foot.textContent = played.length + (played.length === 1 ? " day" : " days") + " played this month" + (s ? " · " + s + (s === 1 ? " day" : " days") + " in a row" : "");
    host.appendChild(foot);
  }

  // Diary: a short note for any day up to today.
  var dTimer = null, dBuilt = false;
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function niceDate(k) { var p = k.split("-"), dt = new Date(+p[0], +p[1] - 1, +p[2]); return DAYS[dt.getDay()] + " " + dt.getDate() + " " + MONTHS[dt.getMonth()] + " " + dt.getFullYear(); }
  function diary(force) {
    var host = $("hb-diary"); if (!host) return;
    if (!dBuilt) {
      host.innerHTML = '<p class="dy-t"><b id="dy-h"></b></p><textarea id="dy-x" rows="4" maxlength="500" placeholder="How was your day? Add a note or a thought..." aria-label="Diary note"></textarea>' +
        '<div class="dy-f"><span id="dy-s" aria-live="polite"></span><span id="dy-c">0/500</span><button type="button" id="dy-clear" class="dy-clear">Clear note</button></div><div id="dy-r" class="dy-r"></div>';
      var x = $("dy-x");
      x.addEventListener("input", function () {
        $("dy-c").textContent = x.value.length + "/500"; $("dy-s").textContent = "Saving...";
        clearTimeout(dTimer); var k = sel, v = x.value;
        dTimer = setTimeout(function () { G.setNote(k, v); $("dy-s").textContent = "Saved \u2713"; recent(); }, 600);
      });
      x.addEventListener("blur", function () { clearTimeout(dTimer); if (G.note(sel) !== x.value) { G.setNote(sel, x.value); $("dy-s").textContent = x.value.trim() ? "Saved \u2713" : ""; recent(); } });
      $("dy-clear").addEventListener("click", function () { clearTimeout(dTimer); x.value = ""; G.setNote(sel, ""); $("dy-c").textContent = "0/500"; $("dy-s").textContent = "Note cleared"; recent(); });
      host.addEventListener("click", function (e) { var b = e.target.closest("[data-pick]"); if (!b) return; sel = b.getAttribute("data-pick"); var p = sel.split("-"); view = new Date(+p[0], +p[1] - 1, 1); calendar(); diary(true); });
      dBuilt = true; force = true;
    }
    var xa = $("dy-x");
    if (force || document.activeElement !== xa) { xa.value = G.note(sel); $("dy-c").textContent = xa.value.length + "/500"; if (force) $("dy-s").textContent = ""; }
    $("dy-h").textContent = "Diary \u00B7 " + niceDate(sel);
    $("dy-clear").hidden = !xa.value;
    recent();
  }
  function recent() {
    var r = $("dy-r"); if (!r) return; var n = G.notes(), ks = Object.keys(n).sort().reverse().slice(0, 3);
    $("dy-clear").hidden = !G.note(sel);
    r.innerHTML = "";
    if (!ks.length) return;
    var h = document.createElement("p"); h.className = "dy-rt"; h.textContent = "Recent notes"; r.appendChild(h);
    ks.forEach(function (k) {
      var b = document.createElement("button"), p = k.split("-"); b.type = "button"; b.setAttribute("data-pick", k);
      var d = document.createElement("b"); d.textContent = +p[2] + " " + MONTHS[+p[1] - 1].slice(0, 3);
      var t = document.createElement("span"); t.textContent = n[k].length > 70 ? n[k].slice(0, 70) + "..." : n[k];
      b.appendChild(d); b.appendChild(t); r.appendChild(b);
    });
  }

  function stats() {
    var ws = G.get("ws") || {}, sd = G.get("sd") || {}, gs = G.get("gs") || {}, done = 0, st = sd.stats || {}, days = 0, k;
    Object.keys(ws.done || {}).forEach(function (c) { done += ws.done[c].length; });
    var ad = G.all().ad || {}; for (k in ad) if (k !== "t") days += ad[k].length;
    var solved = (st.easy || 0) + (st.medium || 0) + (st.hard || 0), played = (gs.gp || 0) + done + solved, s = streak();
    var rows = [[gs.srch || 0, (gs.srch === 1) ? "word searched" : "words searched"], [played, played === 1 ? "game played" : "games played"],
      [days, days === 1 ? "day active" : "days active"], [s, s === 1 ? "day streak" : "day streak"]];
    var ul = $("hb-nums"); ul.innerHTML = "";
    rows.forEach(function (x) {
      var li = document.createElement("li"), b = document.createElement("b"), t = document.createElement("span");
      b.textContent = x[0]; t.textContent = x[1]; li.appendChild(b); li.appendChild(t); ul.appendChild(li);
    });
    var live = [["wordsearch", "Word search", function () { for (var k in (ws.cur || {})) { var p = k.split("|"); if (((ws.done || {})[p[0]] || []).indexOf(+p[1]) < 0) return true; } return false; }],
      ["sudoku", "Sudoku", function () { return !!(sd.sol && !sd.done); }],
      ["snakes", "Snakes and ladders", function () { var v = G.get("sl"); return v && !v.over; }],
      ["connect4", "Connect 4", function () { var v = G.get("c4"); return v && !v.over; }],
      ["ttt", "Tic tac toe", function () { var v = G.get("tt"); return v && !v.over; }],
      ["memory", "Memory match", function () { var v = G.get("mm"); return v && !v.over; }],
      ["hangman", "Hangman", function () { var v = G.get("hm"); return v && !v.over; }]].filter(function (x) { return x[2](); });
    var go = $("hb-go"); go.innerHTML = "";
    var starts = [["wordsearch", "Word search"], ["sudoku", "Sudoku"], ["connect4", "Connect 4"], ["hangman", "Hangman"]];
    {
      var p = document.createElement("p"); p.textContent = live.length ? "Pick up where you left off:" : "Start a game:"; go.appendChild(p);
      (live.length ? live : starts.map(function (x) { return [x[0], x[1]]; })).forEach(function (x) { var a = document.createElement("a"); a.href = "games.html#" + x[0]; a.textContent = x[1]; go.appendChild(a); });
    }
  }

  function hello(name) {
    var h = $("hb-hi"), acc = $("hb-acc");
    if (signedIn()) {
      h.textContent = name ? "Welcome back, " + name + ". Your games and days are saved to your account." : "Welcome back. Your games and days are saved to your account.";
      acc.textContent = "Your account ›";
    } else {
      h.textContent = "This is saved in this browser. Sign in free and it follows you to every device.";
      acc.textContent = "Sign in to save it ›";
    }
  }
  function draw() {
    var si = signedIn(), me = document.querySelector(".hb-me");
    me.classList.toggle("out", !si);
    document.querySelector(".hb-mine").hidden = !si; $("hb-cal").hidden = !si; $("hb-lock").hidden = si;
    if (si) { stats(); calendar(); diary(false); }
  }
  hello(""); draw();
  G.onChange(draw);
  if (signedIn()) {
    G.sync();
    fetch("api/me.php", { credentials: "same-origin" }).then(function (x) { return x.json(); })
      .then(function (d) { if (d && d.user) hello(d.user.name); }).catch(function () { /* ignore */ });
  }
})();
