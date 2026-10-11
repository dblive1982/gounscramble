/* Home page hub: try-a-scramble chips, progress summary and play calendar. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var f = $("f"), r = $("rack"), G = window.GUP;
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function signedIn() { try { return localStorage.getItem("gu-in") === "1"; } catch (e) { return false; } }

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
      chips.insertBefore(b, roll);
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
  if (!G || !$("hb-cal")) return;
  if (f) f.addEventListener("submit", function () { if (r && r.value.replace(/\s/g, "")) { var o = G.get("gs") || {}; o.srch = (o.srch || 0) + 1; G.set("gs", o); } });

  var view = new Date(); view.setDate(1);

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
      var e = document.createElement("span"); e.textContent = d;
      if (played.indexOf(d) >= 0) { e.className = "on"; e.setAttribute("aria-label", d + " " + MONTHS[m] + ": played"); }
      if (isNow && d === now.getDate()) e.classList.add("today");
      grid.appendChild(e);
    }
    host.appendChild(grid);
    var s = streak(), foot = document.createElement("p"); foot.className = "cal-foot";
    foot.textContent = played.length + (played.length === 1 ? " day" : " days") + " played this month" + (s ? " · " + s + (s === 1 ? " day" : " days") + " in a row" : "");
    host.appendChild(foot);
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
    if (si) { stats(); calendar(); }
  }
  hello(""); draw();
  G.onChange(draw);
  if (signedIn()) {
    G.sync();
    fetch("api/me.php", { credentials: "same-origin" }).then(function (x) { return x.json(); })
      .then(function (d) { if (d && d.user) hello(d.user.name); }).catch(function () { /* ignore */ });
  }
})();
