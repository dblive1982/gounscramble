/* GoUnscramble calculators. Built from _src/js/*.js by _src/mkcalc.py. Everything runs in the browser. */
(function () {
  "use strict";

  /* ---------- UK tax engine, 2026/27 (shared by the salary and income tax calculators) ---------- */
  var PA = 12570, NI_LO = 12570, NI_HI = 50270;
  var RUK = [[37700, 0.2, "Basic rate"], [125140, 0.4, "Higher rate"], [Infinity, 0.45, "Additional rate"]];
  var SCO = [[3967, 0.19, "Starter rate"], [16956, 0.2, "Basic rate"], [31092, 0.21, "Intermediate rate"], [62430, 0.42, "Higher rate"], [125140, 0.45, "Advanced rate"], [Infinity, 0.48, "Top rate"]];
  var LOAN = { "1": 26900, "2": 29385, "4": 33795, "5": 25000 }, PG = 21000;
  function parseCode(raw) {
    var c = String(raw || "").toUpperCase().replace(/\s+/g, ""), r = { std: false, sco: false, flat: null, nt: false, allowance: 0, label: "" };
    if (!c) { r.std = true; r.label = "1257L"; return r; }
    if (c[0] === "S") { r.sco = true; c = c.slice(1); } else if (c[0] === "C") c = c.slice(1);
    r.label = String(raw).toUpperCase().replace(/\s+/g, "");
    if (c === "NT") { r.nt = true; return r; }
    if (c === "BR") { r.flat = 0.2; return r; }
    if (c === "D0") { r.flat = 0.4; return r; }
    if (c === "D1") { r.flat = 0.45; return r; }
    if (c === "0T") { r.allowance = 0; return r; }
    var m = /^(K)?(\d{1,5})([LMNTPVY])?$/.exec(c);
    if (!m) return null;
    r.allowance = (m[1] ? -1 : 1) * +m[2] * 10;
    return r;
  }
  function bandTax(ti, bands, ext, out) {
    var tax = 0, prev = 0;
    for (var i = 0; i < bands.length; i++) {
      var lim = bands[i][0] + ext, amt = ti > prev ? Math.min(ti, lim) - prev : 0;
      tax += amt * bands[i][1];
      if (out) out.push({ name: bands[i][2], amt: amt, rate: bands[i][1], tax: amt * bands[i][1] });
      prev = lim;
    }
    return tax;
  }
  function ukCalc(o) {
    var daily = o.annual / (52 * (o.days || 5)), base = Math.max(0, o.annual - (o.off || 0) * daily);
    var gross = base + o.bonus + o.overtime;
    var pen = o.penUnit === "pct" ? base * o.pen / 100 : o.pen * 12;
    var sac = o.penMethod === "sac" ? pen : 0, net = o.penMethod === "net" ? pen : 0, ras = o.penMethod === "ras" ? pen : 0;
    var niPay = Math.max(0, gross - sac - o.ss), taxPay = Math.max(0, gross + o.benefits - sac - net - o.ss);
    var code = parseCode(o.code), sco = o.region === "sco" || (code && code.sco), tax = 0, allowance = PA, bands = [];
    if (code && code.nt) tax = 0;
    else if (code && code.flat != null) { tax = taxPay * code.flat; allowance = 0; bands.push({ name: "Flat rate (" + code.label + ")", amt: taxPay, rate: code.flat, tax: tax }); }
    else {
      if (!code || code.std) { var ani = taxPay - ras; allowance = ani > 100000 ? Math.max(0, PA - (ani - 100000) / 2) : PA; }
      else allowance = code.allowance;
      tax = bandTax(Math.max(0, taxPay - allowance), sco ? SCO : RUK, ras, bands);
    }
    var ni = 0;
    if (!o.spa) { if (niPay > NI_LO) ni += (Math.min(niPay, NI_HI) - NI_LO) * 0.08; if (niPay > NI_HI) ni += (niPay - NI_HI) * 0.02; }
    var sl = 0; if (LOAN[o.loan]) sl += Math.max(0, niPay - LOAN[o.loan]) * 0.09; if (o.pg) sl += Math.max(0, niPay - PG) * 0.06;
    var penOut = o.penMethod === "ras" ? pen * 0.8 : pen;
    var take = gross - penOut - o.ss - tax - ni - sl - o.other;
    return { base: base, gross: gross, pen: penOut, ss: o.ss, tax: tax, ni: ni, sl: sl, other: o.other, take: take, allowance: allowance, sco: sco, daily: daily, benefits: o.benefits, taxPay: taxPay, bands: bands };
  }
  window.GUSal = { calc: ukCalc, parseCode: parseCode };
  window.GUTax = function (g) { var r = ukCalc({ annual: g, days: 5, hours: 40, off: 0, bonus: 0, overtime: 0, benefits: 0, ss: 0, other: 0, pen: 0, penUnit: "pct", penMethod: "net", code: "", region: "eng", loan: "0", pg: false, spa: false }); return { pa: r.allowance, tax: r.tax, ni: r.ni, net: r.take }; };

  var root = document.querySelector("[data-calc]");
  if (!root) return;
  var slug = root.getAttribute("data-calc");

  /* ---------- helpers ---------- */
  function num(s) {
    if (typeof s === "number") return s;
    s = String(s == null ? "" : s).replace(/[,\s£$€%]/g, "");
    if (s === "" || s === "-" || s === ".") return NaN;
    return Number(s);
  }
  function opt(s, d) { var n = num(s); return isNaN(n) ? (d == null ? 0 : d) : n; }
  function fmt(n, dp) {
    if (!isFinite(n)) return "-";
    dp = dp == null ? 2 : dp;
    return n.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  }
  function fmtg(n, max) {
    if (!isFinite(n)) return "-";
    return n.toLocaleString("en-GB", { maximumFractionDigits: max == null ? 6 : max });
  }
  function money(n, c) { return (n < 0 ? "-" : "") + c + fmt(Math.abs(n), 2); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function todayISO() { var d = new Date(); return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    if (!m) return null;
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  }
  function dstr(d, short) {
    return d.toLocaleDateString("en-GB", short ? { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" } : { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  }
  function addDays(d, n) { return new Date(d.getTime() + n * 864e5); }
  function addMonths(d, n) {
    var y = d.getUTCFullYear(), m = d.getUTCMonth() + n, day = d.getUTCDate(), t = new Date(Date.UTC(y, m, 1)), last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
    return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), Math.min(day, last)));
  }
  function pmtFn(L, ratePct, n) { var i = ratePct / 1200; return i ? L * i / (1 - Math.pow(1 + i, -n)) : L / n; }
  function ym(months) { var y = Math.floor(months / 12), m = months % 12; return (y ? y + (y === 1 ? " year" : " years") : "") + (y && m ? ", " : "") + (m || !y ? m + (m === 1 ? " month" : " months") : ""); }
  function parseList(s) { return String(s).split(/[\s,;]+/).filter(Boolean).map(num); }
  var CUR = { id: "c", label: "Currency", t: "sel", opts: [["£", "£ Pound"], ["$", "$ Dollar"], ["€", "€ Euro"]], def: "£" };
  function rnd(max) { var b = new Uint32Array(1), lim = Math.floor(4294967296 / max) * max, x; do { crypto.getRandomValues(b); x = b[0]; } while (x >= lim); return x % max; }
  var NOGO = function () { return false; };

  /* body measurements shared by BMI, calorie and ideal weight calculators */
  function bodyFields(noWeight) {
    var f = [
      { id: "u", label: "Units", t: "sel", opts: [["m", "Metric (cm, kg)"], ["i", "Imperial (ft/in, st/lb)"]], def: "m" },
      { id: "h1", label: function (v) { return v.u === "i" ? "Height (feet)" : "Height (cm)"; }, def: "170" },
      { id: "h2", label: "Height (inches)", def: "0", show: function (v) { return v.u === "i"; } }];
    if (!noWeight) f.push({ id: "w1", label: function (v) { return v.u === "i" ? "Weight (stone)" : "Weight (kg)"; }, def: "70" },
      { id: "w2", label: "Weight (pounds)", def: "0", show: function (v) { return v.u === "i"; } });
    return f;
  }
  function bodyMetric(v) {
    var h1 = num(v.h1), h2 = num(v.h2) || 0, w1 = num(v.w1), w2 = num(v.w2) || 0;
    if (v.u === "i") return { h: (h1 * 12 + h2) * 2.54, w: (w1 * 14 + w2) * 0.45359237 };
    return { h: h1, w: w1 };
  }
  function stLb(kg) { var lb = kg / 0.45359237, st = Math.floor(lb / 14 + 1e-9); return st + " st " + fmt(lb - st * 14, 1) + " lb"; }

  var CALCS = {};
