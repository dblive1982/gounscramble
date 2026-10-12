/* Printer-friendly black and white copies of the game on screen. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var btn = $("print"), main = document.querySelector("main.gm");
  if (!btn || !main) return;
  var sheet = document.createElement("div"); sheet.id = "print-sheet"; document.body.appendChild(sheet);

  function cur() { var s = main.querySelector("section[id^='v-']:not([hidden])"); return s ? s.id.slice(2) : "games"; }
  function h(tag, cls, html) { return "<" + tag + (cls ? ' class="' + cls + '"' : "") + ">" + (html == null ? "" : html) + "</" + tag + ">"; }
  function page(title, note, body) {
    return h("h1", "", title) + (note ? h("p", "pn", note) : "") + body + h("p", "pf", "Free puzzles and games at gounscramble.com");
  }

  var B = {
    sudoku: function () {
      var cells = main.querySelectorAll("#sg .sc"); if (cells.length !== 81) return null;
      var t = "<table class='ps'>";
      for (var r = 0; r < 9; r++) {
        t += "<tr>";
        for (var c = 0; c < 9; c++) { var el = cells[r * 9 + c]; t += "<td>" + (el.classList.contains("given") ? el.textContent : "") + "</td>"; }
        t += "</tr>";
      }
      return page("Sudoku", "Fill every row, column and 3 x 3 box with the numbers 1 to 9.", t + "</table>");
    },
    wordsearch: function () {
      var cs = main.querySelectorAll("#ws-app .gcard .c"); if (!cs.length) return null;
      var n = Math.round(Math.sqrt(cs.length)), t = "<table class='pw'>";
      for (var r = 0; r < n; r++) { t += "<tr>"; for (var c = 0; c < n; c++) t += "<td>" + cs[r * n + c].textContent + "</td>"; t += "</tr>"; }
      t += "</table>";
      var ws = [].map.call(main.querySelectorAll("#ws-app .words .w"), function (w) { return "<li>" + w.textContent + "</li>"; }).join("");
      var ttl = ($("ttl") && $("ws-title") ? $("ws-title").textContent : "") || "Word search";
      return page("Word search: " + ttl, "Find every word. They run in straight lines, in any direction.", t + h("p", "pl", "Words to find") + "<ul class='pwl'>" + ws + "</ul>");
    },
    ttt: function () {
      var b = "<div class='pb3'>" + new Array(7).join("<table class='pt'><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></table>") + "</div>";
      return page("Tic tac toe", "Two players. One is X, one is O. Get three in a row.", b);
    },
    connect4: function () {
      var g = "<table class='pc'>"; for (var r = 0; r < 6; r++) { g += "<tr>"; for (var c = 0; c < 7; c++) g += "<td><i></i></td>"; g += "</tr>"; } g += "</table>";
      return page("Connect 4", "Take turns writing X or O in the lowest empty circle of any column. First to four in a line wins.", g + g);
    },
    hangman: function () {
      var n = main.querySelectorAll("#hm-word span").length || 7, w = "";
      for (var i = 0; i < n; i++) w += "<span></span>";
      var a = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(function (l) { return "<b>" + l + "</b>"; }).join("");
      var svg = '<svg viewBox="0 0 120 130" width="220" height="240" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round"><path d="M12 122h70M30 122V10h56v18"/></svg>';
      return page("Hangman", "Guess the word one letter at a time. Draw a part of the body for every wrong guess: head, body, two arms, two legs.", "<div class='ph'>" + svg + "</div><div class='phw'>" + w + "</div><p class='pl'>Letters</p><div class='pal'>" + a + "</div>");
    },
    snakes: function () {
      var sl = $("sl"); if (!sl || !sl.firstChild) return null;
      var c = sl.cloneNode(true); c.removeAttribute("id"); [].forEach.call(c.querySelectorAll(".tok"), function (t) { t.remove(); });
      [].forEach.call(c.querySelectorAll("[id]"), function (e) { e.removeAttribute("id"); });
      return page("Snakes and ladders", "You need a dice and a counter each. Climb ladders, slide down snakes, and land exactly on 100.", "<div class='psl'>" + c.outerHTML + "</div>");
    },
    maze: function () {
      if (!window.__mzPrint) return null;
      return page("Maze", "Find the way from START to FINISH without crossing a wall.", "<div class='pmz'>" + window.__mzPrint() + "</div>");
    },
    wordle: function () {
      if (!window.__wgPrint) return null;
      return page("Wordle Global", "Guess the five-letter word in six tries. Write each guess in a row, then mark letters in the right place, in the word, or not in it.", "<div class='pwgw'>" + window.__wgPrint() + "</div>");
    },
    crossword: function () {
      if (!window.__cwPrint) return null;
      var b = window.__cwPrint(); if (!b) return null;
      return page("Mini Crossword", "Fill the white squares using the clues.", "<div class='pcww'>" + b + "</div>");
    },
    memory: function () {
      var f = ["A", "B", "C", "D", "E", "F", "G", "H"], c = "";
      for (var i = 0; i < 16; i++) c += "<div class='pm'>" + (i % 2 ? "" : "") + "</div>";
      return null;
    }
  };

  function build() {
    var k = cur(), f = B[k], html = f ? f() : null;
    sheet.innerHTML = html || ""; return !!html;
  }
  function setHidden(el, v) { if (el && el.hidden !== v) el.hidden = v; }
  function refresh() { var k = cur(); setHidden(sh, k === "games"); setHidden(btn, !(B[k] && k !== "memory" && (k !== "wordsearch" || !!main.querySelector("#ws-app .gcard")))); }
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
  var sh = $("share");
  function shareLabel(t) { (window.GUToast || function () {})(t); }
  if (sh) sh.addEventListener("click", function () {
    var k = cur(), name = ($("ttl") && $("ttl").textContent) || "a game", url = location.origin + location.pathname + (k === "games" ? "" : "#" + k);
    var data = { title: "GoUnscramble: " + name, text: "Try " + name + " free on GoUnscramble", url: url };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    var done = function () { shareLabel("Link copied"); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { window.prompt("Copy this link", url); });
    else window.prompt("Copy this link", url);
  });
  btn.addEventListener("click", function () { if (build()) window.print(); });
  window.addEventListener("beforeprint", build);
  new MutationObserver(refresh).observe(main, { subtree: true, childList: true, attributes: true, attributeFilter: ["hidden"] });
  refresh();
})();
