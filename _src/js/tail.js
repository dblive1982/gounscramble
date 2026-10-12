
  /* ---------- saving (only when signed in) ---------- */
  var store = {
    vals: {}, timer: null, touched: false,
    on: function () { try { return !!(window.GUP && GUP.signedIn()); } catch (e) { return false; } },
    load: function () { try { this.vals = (this.on() && GUP.getCalc(slug)) || {}; } catch (e) { this.vals = {}; } },
    get: function (k) { return Object.prototype.hasOwnProperty.call(this.vals, k) ? this.vals[k] : null; },
    set: function (k, v) {
      if (!this.on()) return;
      v = String(v).slice(0, 2000);
      if (this.vals[k] === v) return;
      this.vals[k] = v; this.touched = true;
      clearTimeout(this.timer);
      var self = this; this.timer = setTimeout(function () { try { GUP.setCalc(slug, self.vals); } catch (e) { /* ignore */ } }, 700);
    }
  };
  store.load();
  var restorers = [];   /* functions that re-apply saved values (used again after the account copy arrives) */

  /* ---------- generic renderer ---------- */
  function makeCtl(f, id) {
    var ctl;
    if (f.t === "sel") {
      ctl = el("select", "field");
      f.opts.forEach(function (o) { var op = el("option", null, o[1]); op.value = o[0]; ctl.appendChild(op); });
    } else if (f.t === "area") { ctl = el("textarea", "field"); ctl.rows = f.rows || 3; ctl.spellcheck = false; }
    else if (f.t === "date" || f.t === "time") { ctl = el("input", "field"); ctl.type = f.t; }
    else if (f.t === "chk") { ctl = el("input"); ctl.type = "checkbox"; }
    else { ctl = el("input", "field"); ctl.type = "text"; ctl.inputMode = "decimal"; ctl.autocomplete = "off"; if (f.ph) ctl.placeholder = f.ph; }
    ctl.id = id;
    return ctl;
  }
  function defOf(f) { return f.def === "today" ? todayISO() : (f.def == null ? "" : String(f.def)); }
  function getVal(ctl, f) { return f.t === "chk" ? (ctl.checked ? "1" : "") : ctl.value; }
  function setVal(ctl, f, v) { if (f.t === "chk") ctl.checked = v === "1"; else ctl.value = v; }

  function buildForm(box, spec, key, onChange) {
    var fields = spec.fields, nodes = {}, groups = {}, order = [];
    var grid = el("div", "cf-grid"), acc = null;
    fields.forEach(function (f) {
      var wrap = el("div", "cf" + (f.t === "area" || f.wide ? " cf-wide" : "")), lab = el("label", null, ""), id = "cf-" + key + "-" + f.id, ctl = makeCtl(f, id);
      lab.setAttribute("for", id);
      setVal(ctl, f, defOf(f));
      ctl.addEventListener("input", onChange); ctl.addEventListener("change", onChange);
      if (f.t === "chk") { wrap.className += " cf-check"; var cl = el("label", "cf-chk"); cl.setAttribute("for", id); cl.appendChild(ctl); var tx = el("span", null, ""); cl.appendChild(tx); wrap.appendChild(cl); lab = tx; }
      else { wrap.appendChild(lab); wrap.appendChild(ctl); }
      if (f.hint) wrap.appendChild(el("small", "cf-hint", f.hint));
      nodes[f.id] = { wrap: wrap, lab: lab, ctl: ctl, f: f };
      if (f.g) {
        if (!groups[f.g]) {
          if (!acc) { acc = el("div", "acc-list"); }
          var d = el("details", "acc"), sm = el("summary"), t = el("span", null, f.g), m = el("em", null, "Default"), body = el("div", "acc-body cf-grid");
          sm.appendChild(t); sm.appendChild(m); d.appendChild(sm); d.appendChild(body); acc.appendChild(d);
          groups[f.g] = { d: d, m: m, body: body, ids: [] }; order.push(f.g);
        }
        groups[f.g].body.appendChild(wrap); groups[f.g].ids.push(f.id);
      } else grid.appendChild(wrap);
    });
    box.appendChild(grid); if (acc) box.appendChild(acc);
    function edited(g) { return groups[g].ids.some(function (id) { var n = nodes[id]; return getVal(n.ctl, n.f) !== (n.f.t === "chk" ? "" : defOf(n.f)); }); }
    function restore() {
      fields.forEach(function (f) { var s = store.get(key + "." + f.id); if (s != null) setVal(nodes[f.id].ctl, f, s); });
      order.forEach(function (g) { if (edited(g)) groups[g].d.open = true; });
    }
    restore(); restorers.push(restore);
    return {
      read: function () {
        var v = {};
        fields.forEach(function (f) { v[f.id] = getVal(nodes[f.id].ctl, f); });
        fields.forEach(function (f) {
          var n = nodes[f.id];
          n.wrap.hidden = !!(f.show && !f.show(v));
          n.lab.textContent = typeof f.label === "function" ? f.label(v) : f.label;
          if (f.opts && f.optLabels) { /* reserved */ }
        });
        order.forEach(function (g) { var e = edited(g), gr = groups[g]; gr.m.textContent = e ? "Edited" : "Default"; gr.m.className = e ? "on" : ""; var vis = gr.ids.some(function (id) { return !nodes[id].wrap.hidden; }); gr.d.hidden = !vis; });
        return v;
      },
      save: function (v) { fields.forEach(function (f) { store.set(key + "." + f.id, v[f.id]); }); },
      reset: function () { fields.forEach(function (f) { setVal(nodes[f.id].ctl, f, defOf(f)); }); }
    };
  }
  function rowsDl(rows) {
    var dl = el("dl", "cr-rows");
    rows.forEach(function (x) {
      var row = el("div", "cr-row" + (x[2] === "total" ? " cr-total" : "")); row.appendChild(el("dt", null, x[0])); row.appendChild(el("dd", null, x[1])); dl.appendChild(row);
    });
    return dl;
  }
  function tableEl(t) {
    var w = el("div", "cr-tw" + (t.tall ? " cr-tall" : "")), tb = el("table", "cr-t"), th = el("thead"), tr = el("tr");
    t.head.forEach(function (h) { tr.appendChild(el("th", null, h)); }); th.appendChild(tr); tb.appendChild(th);
    var body = el("tbody"); t.rows.forEach(function (rw) { var x = el("tr"); rw.forEach(function (c) { x.appendChild(el("td", null, c)); }); body.appendChild(x); });
    tb.appendChild(body); w.appendChild(tb);
    return w;
  }
  function paint(out, r) {
    out.textContent = "";
    if (r.err) { out.appendChild(el("p", "cr-err", r.err)); return; }
    if (r.warn) out.appendChild(el("p", "cr-warn", r.warn));
    var hero = el("div", "cr-hero");
    hero.appendChild(el("span", "cr-k", r.hero[0]));
    hero.appendChild(el("b", "cr-v", r.hero[1]));
    if (r.hero[2]) hero.appendChild(el("span", "cr-s", r.hero[2]));
    out.appendChild(hero);
    if (r.bar) {
      var tot = r.bar.reduce(function (a, s) { return a + Math.max(0, s[1]); }, 0), bar = el("div", "sal-bar"), leg = el("ul", "sal-leg");
      r.bar.forEach(function (s) {
        if (!(s[1] > 0) || !(tot > 0)) return; var pc = s[1] / tot * 100;
        var b = el("span", "sb-" + s[2]); b.style.width = pc + "%"; bar.appendChild(b);
        var li = el("li"); li.appendChild(el("i", "sb-" + s[2])); li.appendChild(el("span", null, s[0] + " " + pc.toFixed(0) + "%")); leg.appendChild(li);
      });
      out.appendChild(bar); out.appendChild(leg);
    }
    if (r.rows && r.rows.length) out.appendChild(rowsDl(r.rows));
    (r.sections || []).forEach(function (s) { out.appendChild(el("h3", "cr-h", s[0])); out.appendChild(rowsDl(s[1])); });
    (r.tables || (r.table ? [r.table] : [])).forEach(function (t) { if (t.title) out.appendChild(el("h3", "cr-h", t.title)); out.appendChild(tableEl(t)); });
    if (r.note) out.appendChild(el("p", "hint", r.note));
  }
  function mountSpec(box, spec, key) {
    if (spec.mount) { spec.mount(box, key); return; }
    var out = el("div", "cr"); out.setAttribute("aria-live", "polite");
    var form, first = true;
    function go() { var v = form.read(); paint(out, spec.run(v)); if (!first) form.save(v); }
    form = buildForm(box, spec, key, function () { store.touched = true; go(); });
    if (spec.again) {
      var b = el("button", "btn", spec.again); b.type = "button"; b.addEventListener("click", go);
      var bar = el("div", "btns"); bar.appendChild(b); box.appendChild(bar);
    }
    box.appendChild(out); go(); first = false;
    restorers.push(function () { go(); });
  }

  /* ---------- scientific calculator ---------- */
  function sci(box) {
    var deg = true, last = "", hist = [], mem = 0, alt = false;
    var screen = el("div", "sc-screen");
    var inp = el("input", "sc-in"); inp.type = "text"; inp.autocomplete = "off"; inp.spellcheck = false; inp.setAttribute("aria-label", "Expression"); inp.inputMode = "none";
    var res = el("div", "sc-res", "0"); res.setAttribute("aria-live", "polite");
    var mode = el("button", "sc-mode", "DEG"); mode.type = "button"; mode.title = "Switch between degrees and radians";
    var mi = el("span", "sc-m", "M"); mi.hidden = true;
    screen.appendChild(mode); screen.appendChild(mi); screen.appendChild(inp); screen.appendChild(res);
    var pad = el("div", "sc-pad");
    /* label, value, class, alt label, alt value */
    var keys = [
      ["2nd", "2ND", "fn"], ["sin", "sin(", "fn", "asin", "asin("], ["cos", "cos(", "fn", "acos", "acos("], ["tan", "tan(", "fn", "atan", "atan("], ["ln", "ln(", "fn", "eˣ", "e^("],
      ["π", "π", "fn"], ["e", "e", "fn"], ["x²", "^2", "fn", "x³", "^3"], ["xʸ", "^", "fn"], ["√", "sqrt(", "fn", "∛", "cbrt("],
      ["log", "log(", "fn", "10ˣ", "10^("], ["n!", "!", "fn"], ["|x|", "abs(", "fn"], ["mod", " mod ", "fn"], ["Ans", "Ans", "fn"],
      ["MC", "MC", "mem"], ["MR", "MR", "mem"], ["M+", "M+", "mem"], ["M−", "M-", "mem"], ["nCr", "nCr(", "fn", "nPr", "nPr("],
      ["AC", "AC", "clr"], ["(", "(", "op"], [")", ")", "op"], ["%", "%", "op"], ["÷", "÷", "op"],
      ["7", "7"], ["8", "8"], ["9", "9"], ["⌫", "BK", "clr"], ["×", "×", "op"],
      ["4", "4"], ["5", "5"], ["6", "6"], [",", ",", "op"], ["−", "−", "op"],
      ["1", "1"], ["2", "2"], ["3", "3"], ["±", "NEG", "op"], ["+", "+", "op"],
      ["0", "0"], [".", "."], ["EXP", "E", "op"], ["=", "=", "eq"]
    ];
    var altBtns = [];
    keys.forEach(function (k) {
      var b = el("button", "sc-k " + (k[2] || "num"), k[0]); b.type = "button"; b.setAttribute("data-k", k[1]);
      if (k[0] === "=") b.style.gridColumn = "span 2";
      if (k[3]) { b._n = [k[0], k[1]]; b._a = [k[3], k[4]]; altBtns.push(b); }
      if (k[0] === "2nd") b.setAttribute("aria-pressed", "false");
      pad.appendChild(b);
    });
    box.appendChild(screen); box.appendChild(pad);
    var histBox = el("ol", "sc-hist"); box.appendChild(histBox);

    function ins(t) {
      var s = inp.selectionStart == null ? inp.value.length : inp.selectionStart, e = inp.selectionEnd == null ? s : inp.selectionEnd;
      inp.value = inp.value.slice(0, s) + t + inp.value.slice(e);
      var p = s + t.length; try { inp.setSelectionRange(p, p); } catch (x) { /* ignore */ }
      preview();
    }
    function back() {
      var s = inp.selectionStart, e = inp.selectionEnd;
      if (s === e) { if (s === 0) return; inp.value = inp.value.slice(0, s - 1) + inp.value.slice(e); s--; }
      else inp.value = inp.value.slice(0, s) + inp.value.slice(e);
      try { inp.setSelectionRange(s, s); } catch (x) { /* ignore */ }
      preview();
    }
    function show(n) { return Math.abs(n) >= 1e15 || (Math.abs(n) < 1e-9 && n !== 0) ? n.toExponential(8).replace(/\.?0+e/, "e") : fmtg(n, 10).replace(/ /g, " "); }
    function cur() { try { return evalExpr(inp.value.trim(), deg, last); } catch (e) { return NaN; } }
    function preview() {
      var t = inp.value.trim();
      if (!t) { res.textContent = "0"; res.classList.remove("bad"); return; }
      try { var r = evalExpr(t, deg, last); res.textContent = show(r); res.classList.remove("bad"); } catch (e) { res.textContent = ""; }
      store.set("expr", inp.value);
    }
    function equals() {
      var t = inp.value.trim(); if (!t) return;
      try {
        var r = evalExpr(t, deg, last); res.textContent = show(r); res.classList.remove("bad");
        hist.unshift([t, show(r)]); hist = hist.slice(0, 8); last = r;
        histBox.textContent = ""; hist.forEach(function (h) { var li = el("li"); li.appendChild(el("span", null, h[0])); li.appendChild(el("b", null, "= " + h[1])); histBox.appendChild(li); });
        inp.value = String(+r.toPrecision(12)); try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch (x) { /* ignore */ }
        store.set("expr", inp.value);
      } catch (e) { res.textContent = e.message || "Error"; res.classList.add("bad"); }
    }
    function setAlt(on) {
      alt = on; altBtns.forEach(function (b) { var s = on ? b._a : b._n; b.textContent = s[0]; b.setAttribute("data-k", s[1]); });
      var k = pad.querySelector('[data-k="2ND"]'); k.setAttribute("aria-pressed", on ? "true" : "false"); k.classList.toggle("on", on);
    }
    pad.addEventListener("click", function (ev) {
      var b = ev.target.closest("button"); if (!b) return;
      var k = b.getAttribute("data-k");
      if (k === "AC") { inp.value = ""; preview(); }
      else if (k === "BK") back();
      else if (k === "=") equals();
      else if (k === "2ND") setAlt(!alt);
      else if (k === "NEG") { inp.value = inp.value.indexOf("−") === 0 ? inp.value.slice(1) : "−" + inp.value; preview(); }
      else if (k === "MC") { mem = 0; mi.hidden = true; }
      else if (k === "MR") ins(String(+mem.toPrecision(12)));
      else if (k === "M+" || k === "M-") { var v = cur(); if (isFinite(v)) { mem += k === "M+" ? v : -v; mi.hidden = mem === 0; } }
      else ins(k);
      inp.focus({ preventScroll: true });
    });
    mode.addEventListener("click", function () { deg = !deg; mode.textContent = deg ? "DEG" : "RAD"; preview(); store.set("deg", deg ? "1" : "0"); });
    inp.addEventListener("input", preview);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); equals(); } });
    function restore() {
      var e = store.get("expr"), d = store.get("deg");
      if (d != null) { deg = d === "1"; mode.textContent = deg ? "DEG" : "RAD"; }
      inp.value = e != null ? e : "(12.5 + 7.5) × 3 ÷ 4"; preview();
    }
    restore(); restorers.push(restore);
  }

  function evalExpr(src, deg, ans) {
    var s = src.replace(/×/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-").replace(/√/g, "sqrt").replace(/π/g, "pi").replace(/\s+/g, "");
    var toks = [], re = /(\d+\.?\d*(?:E[+-]?\d+)?|\.\d+(?:E[+-]?\d+)?|[a-zA-Z]+|[-+*\/^()!%,])/gy, m, pos = 0;
    while (pos < s.length) {
      re.lastIndex = pos; m = re.exec(s);
      if (!m) throw new Error("Check the expression");
      toks.push(m[1]); pos = re.lastIndex;
    }
    var i = 0;
    function peek() { return toks[i]; }
    function isNum(t) { return t && /^[\d.]/.test(t); }
    function isName(t) { return t && /^[a-zA-Z]+$/.test(t) && t.toLowerCase() !== "mod"; }
    function rad(x) { return deg ? x * Math.PI / 180 : x; }
    function irad(x) { return deg ? x * 180 / Math.PI : x; }
    function fact(n) {
      if (n < 0 || Math.floor(n) !== n || n > 170) throw new Error("Factorial needs a whole number from 0 to 170");
      var r = 1; for (var k = 2; k <= n; k++) r *= k; return r;
    }
    function ncr(n, r) { if (n < 0 || r < 0 || r > n || Math.floor(n) !== n || Math.floor(r) !== r) throw new Error("nCr needs whole numbers, n ≥ r"); r = Math.min(r, n - r); var v = 1; for (var k = 1; k <= r; k++) v = v * (n - r + k) / k; return Math.round(v); }
    function npr(n, r) { if (n < 0 || r < 0 || r > n || Math.floor(n) !== n || Math.floor(r) !== r) throw new Error("nPr needs whole numbers, n ≥ r"); var v = 1; for (var k = 0; k < r; k++) v *= n - k; return v; }
    var F = {
      sin: function (x) { var r = Math.sin(rad(x)); return Math.abs(r) < 1e-15 ? 0 : r; },
      cos: function (x) { var r = Math.cos(rad(x)); return Math.abs(r) < 1e-15 ? 0 : r; },
      tan: function (x) { if (deg && Math.abs(((x % 180) + 180) % 180 - 90) < 1e-12) throw new Error("Undefined"); return Math.tan(rad(x)); },
      asin: function (x) { return irad(Math.asin(x)); }, acos: function (x) { return irad(Math.acos(x)); }, atan: function (x) { return irad(Math.atan(x)); },
      sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
      ln: Math.log, log: Math.log10, sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp, cbrt: Math.cbrt, floor: Math.floor, ceil: Math.ceil, round: Math.round,
      ncr: ncr, npr: npr
    };
    function expr() {
      var v = term();
      while (peek() === "+" || peek() === "-") { var o = toks[i++], r = term(); v = o === "+" ? v + r : v - r; }
      return v;
    }
    function term() {
      var v = unary();
      for (;;) {
        var t = peek();
        if (t === "*" || t === "/") { i++; var r = unary(); if (t === "/" && r === 0) throw new Error("Cannot divide by zero"); v = t === "*" ? v * r : v / r; }
        else if (t && t.toLowerCase() === "mod") { i++; var d = unary(); if (d === 0) throw new Error("Cannot divide by zero"); v = ((v % d) + d) % d; }
        else if (t === "(" || isNum(t) || isName(t)) { v = v * unary(); }
        else return v;
      }
    }
    function unary() {
      if (peek() === "-") { i++; return -unary(); }
      if (peek() === "+") { i++; return unary(); }
      return power();
    }
    function power() {
      var b = post();
      if (peek() === "^") { i++; var e = unary(); return Math.pow(b, e); }
      return b;
    }
    function post() {
      var v = primary();
      while (peek() === "!" || peek() === "%") { if (toks[i++] === "!") v = fact(v); else v = v / 100; }
      return v;
    }
    function primary() {
      var t = toks[i++];
      if (t === undefined) throw new Error("Expression is incomplete");
      if (isNum(t)) return parseFloat(t);
      if (t === "(") { var v = expr(); if (peek() !== ")") throw new Error("Missing )"); i++; return v; }
      if (isName(t)) {
        var n = t.toLowerCase();
        if (n === "pi") return Math.PI;
        if (n === "e") return Math.E;
        if (n === "ans") return typeof ans === "number" ? ans : 0;
        if (n === "rand") return Math.random();
        if (F[n]) {
          if (peek() !== "(") throw new Error("Use brackets, like " + n + "(30)");
          i++; var args = [expr()];
          while (peek() === ",") { i++; args.push(expr()); }
          if (peek() !== ")") throw new Error("Missing )"); i++;
          var r = F[n].apply(null, args); if (!isFinite(r)) throw new Error("Not a real number"); return r;
        }
        throw new Error("Unknown: " + t);
      }
      throw new Error("Check the expression");
    }
    var out = expr();
    if (i < toks.length) throw new Error("Check the expression");
    if (!isFinite(out)) throw new Error("Not a real number");
    return out;
  }
  window.GUEval = evalExpr;

  /* ---------- unit converter ---------- */
  var UNITS = {
    Length: { metre: 1, kilometre: 1000, centimetre: 0.01, millimetre: 0.001, micrometre: 1e-6, nanometre: 1e-9, mile: 1609.344, yard: 0.9144, foot: 0.3048, inch: 0.0254, "nautical mile": 1852 },
    Weight: { kilogram: 1, gram: 0.001, milligram: 1e-6, microgram: 1e-9, tonne: 1000, "UK ton": 1016.0469088, "US ton": 907.18474, pound: 0.45359237, ounce: 0.028349523125, stone: 6.35029318, carat: 0.0002 },
    Volume: { litre: 1, millilitre: 0.001, "cubic metre": 1000, "UK pint": 0.56826125, "UK gallon": 4.54609, "UK fl oz": 0.0284130625, "US gallon": 3.785411784, "US pint": 0.473176473, "US cup": 0.2365882365, "US fl oz": 0.0295735295625, tablespoon: 0.01478676478125, teaspoon: 0.00492892159375, "cubic foot": 28.316846592, "cubic inch": 0.016387064 },
    Area: { "square metre": 1, "square kilometre": 1e6, "square centimetre": 1e-4, hectare: 1e4, acre: 4046.8564224, "square mile": 2589988.110336, "square yard": 0.83612736, "square foot": 0.09290304, "square inch": 0.00064516 },
    Speed: { "metres per second": 1, "kilometres per hour": 1 / 3.6, "miles per hour": 0.44704, knot: 0.514444444, "feet per second": 0.3048, mach: 343 },
    Temperature: { "°C": 1, "°F": 1, K: 1 },
    Time: { millisecond: 0.001, second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, month: 2629800, year: 31557600 },
    "Data storage": { bit: 0.125, byte: 1, kilobyte: 1e3, megabyte: 1e6, gigabyte: 1e9, terabyte: 1e12, petabyte: 1e15, kibibyte: 1024, mebibyte: 1048576, gibibyte: 1073741824, tebibyte: 1099511627776 },
    Energy: { joule: 1, kilojoule: 1000, calorie: 4.184, kilocalorie: 4184, "watt hour": 3600, "kilowatt hour": 3.6e6, BTU: 1055.05585262, "foot-pound": 1.3558179483314 },
    Pressure: { pascal: 1, kilopascal: 1000, bar: 1e5, millibar: 100, psi: 6894.757293168, atmosphere: 101325, mmHg: 133.322387415, inHg: 3386.389 },
    Power: { watt: 1, kilowatt: 1000, megawatt: 1e6, "horsepower (mechanical)": 745.69987158227, "horsepower (metric)": 735.49875, "BTU per hour": 0.29307107 },
    Angle: { degree: Math.PI / 180, radian: 1, gradian: Math.PI / 200, turn: 2 * Math.PI, arcminute: Math.PI / 10800, arcsecond: Math.PI / 648000 },
    "Fuel economy": { "mpg (UK)": 1, "mpg (US)": 1, "L/100km": 1, "km per litre": 1 }
  };
  function convUnit(x, f, t, c) {
    if (c === "Temperature") {
      var k = f === "°C" ? x + 273.15 : f === "°F" ? (x - 32) * 5 / 9 + 273.15 : x;
      return t === "°C" ? k - 273.15 : t === "°F" ? (k - 273.15) * 9 / 5 + 32 : k;
    }
    if (c === "Fuel economy") {
      var l100 = f === "L/100km" ? x : f === "km per litre" ? 100 / x : f === "mpg (UK)" ? 282.480936 / x : 235.214583 / x;
      return t === "L/100km" ? l100 : t === "km per litre" ? 100 / l100 : t === "mpg (UK)" ? 282.480936 / l100 : 235.214583 / l100;
    }
    return x * UNITS[c][f] / UNITS[c][t];
  }
  function sig(x) {
    if (!isFinite(x)) return "-";
    if (x === 0) return "0";
    var a = Math.abs(x);
    if (a >= 1e15 || a < 1e-7) return x.toExponential(6).replace(/\.?0+e/, "e");
    return fmtg(+x.toPrecision(10), 10);
  }
  function units(box) {
    var cat = el("select", "field"), from = el("select", "field"), to = el("select", "field"), val = el("input", "field"), swap = el("button", "sc-swap", "⇅");
    val.type = "text"; val.inputMode = "decimal"; val.value = "1"; val.setAttribute("aria-label", "Value"); swap.type = "button"; swap.title = "Swap units"; swap.setAttribute("aria-label", "Swap units");
    Object.keys(UNITS).forEach(function (k) { var o = el("option", null, k); o.value = k; cat.appendChild(o); });
    var out = el("div", "cr"); out.setAttribute("aria-live", "polite");
    function mk(lbl, ctl, cls) { var w = el("div", "cf" + (cls ? " " + cls : "")); w.appendChild(el("label", null, lbl)); w.appendChild(ctl); return w; }
    var grid = el("div", "cf-grid");
    grid.appendChild(mk("Type", cat)); grid.appendChild(mk("Value", val)); grid.appendChild(mk("From", from)); grid.appendChild(mk("To", to));
    box.appendChild(grid);
    var bt = el("div", "btns"); bt.appendChild(swap); box.appendChild(bt); box.appendChild(out);
    function fill(keepF, keepT) {
      from.textContent = ""; to.textContent = "";
      Object.keys(UNITS[cat.value]).forEach(function (u) {
        var a = el("option", null, u); a.value = u; from.appendChild(a);
        var b = el("option", null, u); b.value = u; to.appendChild(b);
      });
      var def = { Length: ["mile", "kilometre"], Weight: ["kilogram", "pound"], Temperature: ["°C", "°F"], Volume: ["litre", "UK pint"], Speed: ["miles per hour", "kilometres per hour"], "Fuel economy": ["mpg (UK)", "L/100km"], "Data storage": ["gigabyte", "megabyte"] }[cat.value];
      from.selectedIndex = 0; to.selectedIndex = Math.min(1, to.options.length - 1);
      if (def) { from.value = def[0]; to.value = def[1]; }
      if (keepF) from.value = keepF; if (keepT) to.value = keepT;
    }
    function go() {
      var x = num(val.value);
      store.set("c", cat.value); store.set("f", from.value); store.set("t", to.value); store.set("v", val.value);
      if (isNaN(x)) { paint(out, { err: "Enter a number to convert." }); return; }
      var c = cat.value;
      if (c === "Fuel economy" && x <= 0) { paint(out, { err: "Fuel economy must be above zero." }); return; }
      var r = convUnit(x, from.value, to.value, c);
      var rows = Object.keys(UNITS[c]).filter(function (u) { return u !== to.value && u !== from.value; }).map(function (u) { return [u, sig(convUnit(x, from.value, u, c))]; });
      paint(out, { hero: [sig(x) + " " + from.value + " =", sig(r) + " " + to.value], rows: rows });
    }
    cat.addEventListener("change", function () { fill(); go(); });
    [from, to].forEach(function (s) { s.addEventListener("change", go); });
    swap.addEventListener("click", function () { var a = from.value; from.value = to.value; to.value = a; go(); });
    val.addEventListener("input", go);
    function restore() {
      var c = store.get("c"); if (c && UNITS[c]) cat.value = c; fill(store.get("f"), store.get("t"));
      var v = store.get("v"); if (v != null) val.value = v; go();
    }
    restore(); restorers.push(restore);
  }

  /* ---------- mount ---------- */
  if (slug === "scientific") sci(root);
  else if (slug === "unit-converter") units(root);
  else {
    var spec = CALCS[slug];
    if (spec) {
      if (spec.multi) {
        spec.multi.forEach(function (m, i) {
          var card = el("div", "cm"); card.appendChild(el("h2", "cm-h", m.title)); root.appendChild(card);
          mountSpec(card, m, slug + i);
        });
      } else mountSpec(root, spec, slug);
    }
  }
  /* when the account copy arrives (after sign-in sync), re-apply saved values if the visitor has not started typing */
  try {
    if (store.on() && window.GUP) GUP.sync().then(function (changed) { if (changed && !store.touched) { store.load(); restorers.forEach(function (f) { f(); }); } });
  } catch (e) { /* ignore */ }
  window.GUCalc = { CALCS: CALCS, run: function (slg, v) { return CALCS[slg].run(v); } };
})();
