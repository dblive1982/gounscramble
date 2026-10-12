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
      { id: "u", label: "Units", t: "sel", opts: [["m", "Metric"], ["i", "Imperial"]], def: "m" },
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


  /* ================= FINANCIAL ================= */
  /* Loan engine. n periods, ppy payments a year. o: extra, fx (years), r2, io. */
  function amort(L, r1, n, ppy, o) {
    o = o || {};
    var extra = o.extra || 0, fxP = Math.round((o.fx || 0) * ppy), r2 = (o.r2 == null || isNaN(o.r2)) ? r1 : o.r2, io = !!o.io;
    var bal = L, k = 0, interest = 0, paid = 0, rate = r1, i = rate / 100 / ppy;
    var pmt = io ? bal * i : (i ? bal * i / (1 - Math.pow(1 + i, -n)) : bal / n), pmt1 = pmt, pmt2 = null, rows = [], yi = 0, yp = 0;
    while (bal > 0.005 && k < n) {
      if (fxP > 0 && k === fxP && r2 !== r1) {
        rate = r2; i = rate / 100 / ppy; var left = n - k;
        pmt = io ? bal * i : (i ? bal * i / (1 - Math.pow(1 + i, -left)) : bal / left); pmt2 = pmt;
      }
      var it = bal * i, pay, pr;
      if (io) { pr = Math.min(extra, bal); pay = it + pr; }
      else { pay = Math.min(pmt + extra, bal + it); pr = pay - it; }
      bal -= pr; interest += it; paid += pay; yi += it; yp += pay; k++;
      if (k % ppy === 0 || bal <= 0.005 || k === n) { rows.push([String(Math.ceil(k / ppy)), yp, yi, Math.max(bal, 0)]); yi = 0; yp = 0; }
    }
    return { pmt1: pmt1, pmt2: pmt2, months: k, interest: interest, paid: paid, endBal: Math.max(bal, 0), rows: rows };
  }
  function yearTable(rows, c) {
    return { title: "Year by year", tall: rows.length > 12, head: ["Year", "Paid", "Interest", "Balance"], rows: rows.map(function (r) { return [r[0], money(r[1], c), money(r[2], c), money(r[3], c)]; }) };
  }
  function irrPeriod(net, pmt, n) {   /* periodic rate where net = pmt * annuity */
    var lo = 0, hi = 1, i;
    for (var k = 0; k < 200; k++) { i = (lo + hi) / 2; var pv = i ? pmt * (1 - Math.pow(1 + i, -n)) / i : pmt * n; if (pv > net) lo = i; else hi = i; }
    return i;
  }
  function sdlt(P, type) {
    var std = [[125000, 0], [250000, 0.02], [925000, 0.05], [1500000, 0.10], [Infinity, 0.12]], b = std;
    if (type === "ftb" && P <= 500000) b = [[300000, 0], [500000, 0.05]];
    if (type === "add") b = std.map(function (x) { return [x[0], x[1] + 0.05]; });
    var tax = 0, prev = 0; for (var k = 0; k < b.length; k++) { if (P > prev) tax += (Math.min(P, b[k][0]) - prev) * b[k][1]; prev = b[k][0]; }
    return tax;
  }
  window.GUFin = { amort: amort, sdlt: sdlt };

  CALCS.mortgage = {
    fields: [CUR,
      { id: "p", label: "Property price", def: "300000" },
      { id: "d", label: "Deposit", def: "60000" },
      { id: "du", label: "Deposit is", t: "sel", opts: [["amt", "An amount"], ["pct", "% of the price"]], def: "amt" },
      { id: "r", label: "Interest rate (% a year)", def: "4.5" },
      { id: "t", label: "Term (years)", def: "25" },
      { g: "Mortgage type", id: "ty", label: "Type", t: "sel", opts: [["rep", "Repayment"], ["io", "Interest only"]], def: "rep" },
      { g: "Mortgage type", id: "fx", label: "Fixed deal length (years, 0 for none)", def: "0" },
      { g: "Mortgage type", id: "r2", label: "Rate when the deal ends (%)", def: "", ph: "Same rate", wide: true },
      { g: "Overpayments", id: "op", label: "Overpay each month", def: "0", hint: "Paying extra shortens the mortgage and saves interest." },
      { g: "Fees and stamp duty", id: "fee", label: "Arrangement fee", def: "0" },
      { g: "Fees and stamp duty", id: "fa", label: "The fee is", t: "sel", opts: [["up", "Paid upfront"], ["add", "Added to the loan"]], def: "up" },
      { g: "Fees and stamp duty", id: "bt", label: "Stamp duty (England and N. Ireland)", t: "sel", opts: [["none", "Do not include"], ["mover", "Home mover"], ["ftb", "First-time buyer"], ["add", "Additional property"]], def: "none", wide: true }],
    run: function (v) {
      var P = num(v.p), r = num(v.r), t = num(v.t), fee = opt(v.fee), op = opt(v.op), fx = opt(v.fx), r2 = v.r2 === "" ? null : num(v.r2);
      var D = v.du === "pct" ? P * opt(v.d) / 100 : opt(v.d);
      if (!(P > 0) || !(t > 0) || t > 60 || !(r >= 0) || D < 0 || D >= P) return { err: "Enter a price, a deposit smaller than the price, a rate and a term of up to 60 years." };
      if (fee < 0 || op < 0 || fx < 0 || fx > t || (v.r2 !== "" && !(r2 >= 0))) return { err: "Check the fixed deal length, second rate, overpayment and fee." };
      var L = P - D + (v.fa === "add" ? fee : 0), n = Math.round(t * 12), io = v.ty === "io";
      var s = amort(L, r, n, 12, { extra: op, fx: fx, r2: r2, io: io }), base = op > 0 ? amort(L, r, n, 12, { fx: fx, r2: r2, io: io }) : s;
      var sd = v.c === "£" && v.bt !== "none" ? sdlt(P, v.bt) : 0, upfront = D + sd + (v.fa === "up" ? fee : 0);
      var rows = [["Amount borrowed", money(L, v.c)], ["Loan to value", fmt((P - D) / P * 100, 1) + "%"], ["Total interest", money(s.interest, v.c)], ["Total you repay", money(s.paid + (io ? s.endBal : 0), v.c)]];
      if (io) rows.push(["Balance still owed at the end", money(s.endBal, v.c)]);
      if (op > 0 && !io) rows.push(["Mortgage ends after", ym(s.months)], ["Interest saved", money(base.interest - s.interest, v.c)], ["Time saved", ym(Math.max(0, base.months - s.months))]);
      rows.push(["Cash needed upfront", money(upfront, v.c)]);
      var secs = []; if (sd > 0 || (v.c === "£" && v.bt !== "none")) secs.push(["Stamp duty", [["Stamp duty to pay", money(sd, v.c)], ["As a share of the price", fmt(sd / P * 100, 2) + "%"]]]);
      return { hero: [io ? "Monthly payment (interest only)" : "Monthly payment", money(s.pmt1, v.c), s.pmt2 ? "Then " + money(s.pmt2, v.c) + " a month from year " + (fx + 1) : null], rows: rows, sections: secs, tables: [yearTable(s.rows, v.c)],
        note: "Fixed rate unless you add a second rate. Fees, insurance and valuation costs are not included. Stamp duty is for England and Northern Ireland, and rates change, so check with HMRC." };
    }
  };

  CALCS.loan = {
    fields: [CUR,
      { id: "p", label: "Loan amount", def: "10000" },
      { id: "r", label: "Interest rate (% a year)", def: "7.9" },
      { id: "t", label: "Term", def: "5" },
      { id: "u", label: "Term in", t: "sel", opts: [["y", "Years"], ["m", "Months"]], def: "y" },
      { g: "Payments", id: "fq", label: "Pay", t: "sel", opts: [["12", "Monthly"], ["26", "Every 2 weeks"], ["52", "Weekly"]], def: "12" },
      { g: "Payments", id: "ex", label: "Extra payment each time", def: "0", hint: "Paying extra clears the loan sooner and saves interest." },
      { g: "Fees", id: "fee", label: "Arrangement fee", def: "0" },
      { g: "Fees", id: "fa", label: "The fee is", t: "sel", opts: [["up", "Paid upfront"], ["add", "Added to the loan"]], def: "up" }],
    run: function (v) {
      var P = num(v.p), r = num(v.r), t = num(v.t), ppy = +v.fq, fee = opt(v.fee), ex = opt(v.ex);
      if (!(P > 0) || !(t > 0) || !(r >= 0) || fee < 0 || ex < 0) return { err: "Enter a loan amount, a rate and a term." };
      var years = v.u === "y" ? t : t / 12, n = Math.max(1, Math.round(years * ppy)), L = P + (v.fa === "add" ? fee : 0);
      var s = amort(L, r, n, ppy, { extra: ex }), base = ex > 0 ? amort(L, r, n, ppy) : s, name = { 12: "Monthly", 26: "Fortnightly", 52: "Weekly" }[ppy];
      var net = P - (v.fa === "up" ? fee : 0), eff = Math.pow(1 + irrPeriod(net, base.pmt1, n), ppy) - 1;
      var upFee = v.fa === "up" ? fee : 0, rows = [["Total interest", money(s.interest, v.c)], ["Total you repay", money(s.paid + upFee, v.c)], ["Number of payments", String(s.months)], ["Effective yearly cost", fmt(eff * 100, 2) + "%"]];
      if (ex > 0) rows.push(["Interest saved", money(base.interest - s.interest, v.c)], ["Payments saved", String(Math.max(0, base.months - s.months))]);
      return { hero: [name + " payment", money(s.pmt1, v.c), ex > 0 ? "plus " + money(ex, v.c) + " extra" : null], rows: rows, tables: [yearTable(s.rows, v.c)], note: "Fixed rate, equal payments. The effective yearly cost includes any arrangement fee." };
    }
  };

  CALCS["auto-loan"] = {
    fields: [CUR,
      { id: "p", label: "Car price", def: "18000" },
      { id: "d", label: "Deposit", def: "3000" },
      { id: "r", label: "Interest rate (% a year)", def: "8.9" },
      { id: "t", label: "Term (months)", def: "48" },
      { g: "Trade-in and tax", id: "ti", label: "Trade-in value", def: "0" },
      { g: "Trade-in and tax", id: "tx", label: "Sales tax or VAT on top (%)", def: "0" },
      { g: "Trade-in and tax", id: "fee", label: "Fees added to the loan", def: "0" },
      { g: "Final payment and extras", id: "bl", label: "Final (balloon) payment", def: "0", hint: "Common on PCP deals. It is paid as one lump at the end." },
      { g: "Final payment and extras", id: "ex", label: "Extra each month", def: "0" }],
    run: function (v) {
      var P = num(v.p), D = opt(v.d), TI = opt(v.ti), tx = opt(v.tx), fee = opt(v.fee), r = num(v.r), n = Math.round(num(v.t)), B = opt(v.bl), ex = opt(v.ex);
      if (!(P > 0) || D < 0 || TI < 0 || tx < 0 || fee < 0 || !(r >= 0) || !(n > 0) || B < 0 || ex < 0) return { err: "Enter a price, rate and number of months, and use zero or positive numbers elsewhere." };
      var price = P * (1 + tx / 100), L = price + fee - D - TI;
      if (!(L > 0)) return { err: "The deposit and trade-in cover the whole price, so there is nothing to borrow." };
      if (B >= L) return { err: "The final payment must be smaller than the amount borrowed." };
      var i = r / 1200, pmt = i ? (L - B / Math.pow(1 + i, n)) * i / (1 - Math.pow(1 + i, -n)) : (L - B) / n;
      var bal = L, k = 0, interest = 0;
      while (k < n && bal > 0.005) { var it = bal * i, pay = Math.min(pmt + ex, bal + it); interest += it; bal -= pay - it; k++; }
      var left = k === n ? Math.max(0, bal) : 0, paid = pmt * k + ex * k;
      var rows = [["Amount financed", money(L, v.c)], ["Total interest", money(interest, v.c)], ["Total cost including deposit", money(paid + left + D + TI, v.c)]];
      if (tx > 0) rows.unshift(["Price including tax", money(price, v.c)]);
      if (B > 0) rows.push(["Final payment due", money(left, v.c)]);
      if (ex > 0 && k < n) rows.push(["Paid off after", k + " months"]);
      return { hero: ["Monthly payment", money(pmt, v.c), ex > 0 ? "plus " + money(ex, v.c) + " extra" : null], rows: rows, note: "Fixed rate. Dealer deals can have other charges, so check the full agreement." };
    }
  };

  CALCS["interest-rate"] = {
    fields: [CUR,
      { id: "p", label: "Loan amount", def: "10000" },
      { id: "m", label: "Monthly payment", def: "200" },
      { id: "t", label: "Term", def: "60" },
      { id: "u", label: "Term in", t: "sel", opts: [["m", "Months"], ["y", "Years"]], def: "m" },
      { g: "Fees and final payment", id: "fee", label: "Upfront fee", def: "0", hint: "Included to find the true yearly cost." },
      { g: "Fees and final payment", id: "bl", label: "Final (balloon) payment", def: "0" }],
    run: function (v) {
      var P = num(v.p), M = num(v.m), fee = opt(v.fee), B = opt(v.bl), n = Math.round(v.u === "y" ? num(v.t) * 12 : num(v.t));
      if (!(P > 0) || !(M > 0) || !(n > 0) || fee < 0 || B < 0 || fee >= P) return { err: "Enter a loan amount, a monthly payment and a term." };
      if (M * n + B < P) return { err: "Those payments add up to less than the loan, so the rate would be negative." };
      function pv(i) { return (i ? M * (1 - Math.pow(1 + i, -n)) / i : M * n) + B / Math.pow(1 + i, n); }
      function solve(target) { var lo = 0, hi = 1, i; for (var k = 0; k < 200; k++) { i = (lo + hi) / 2; if (pv(i) > target) lo = i; else hi = i; } return i; }
      var i1 = solve(P), i2 = fee > 0 ? solve(P - fee) : i1;
      return { hero: ["Interest rate", fmt(i1 * 1200, 3) + "% a year"], rows: [["Effective yearly rate", fmt((Math.pow(1 + i1, 12) - 1) * 100, 3) + "%"], fee > 0 ? ["True yearly cost with the fee", fmt((Math.pow(1 + i2, 12) - 1) * 100, 3) + "%"] : null, ["Total you repay", money(M * n + B, v.c)], ["Total interest", money(M * n + B - P, v.c)]].filter(Boolean), note: "The headline figure is the nominal yearly rate, compounded monthly." };
    }
  };

  CALCS.amortization = {
    fields: [CUR,
      { id: "p", label: "Loan amount", def: "200000" },
      { id: "r", label: "Interest rate (% a year)", def: "4.5" },
      { id: "t", label: "Term (years)", def: "25" },
      { g: "Extra payments", id: "ex", label: "Extra each month", def: "0" },
      { g: "Extra payments", id: "lump", label: "One-off lump sum at the start", def: "0" },
      { g: "Table", id: "tv", label: "Show the table by", t: "sel", opts: [["y", "Year"], ["m", "Month"]], def: "y" }],
    run: function (v) {
      var P = num(v.p), r = num(v.r), t = num(v.t), ex = opt(v.ex), lump = opt(v.lump);
      if (!(P > 0) || !(r >= 0) || !(t > 0) || t > 60 || ex < 0 || lump < 0 || lump >= P) return { err: "Enter a loan amount, a rate and a term of up to 60 years." };
      var n = Math.round(t * 12), L = P - lump, s = amort(L, r, n, 12, { extra: ex }), base = amort(P, r, n, 12), tbl;
      if (v.tv === "m") {
        var bal = L, i = r / 1200, pmt = pmtFn(L, r, n), rows = [];
        for (var k = 1; k <= n && bal > 0.005; k++) { var it = bal * i, pay = Math.min(pmt + ex, bal + it), pr = pay - it; bal -= pr; rows.push([String(k), money(pr, v.c), money(it, v.c), money(Math.max(bal, 0), v.c)]); }
        tbl = { title: "Month by month", tall: true, head: ["Month", "Principal", "Interest", "Balance"], rows: rows };
      } else tbl = yearTable(s.rows, v.c);
      var rowsOut = [["Total interest", money(s.interest, v.c)], ["Total you repay", money(s.paid + lump, v.c)], ["Paid off after", ym(s.months)]];
      if (ex > 0 || lump > 0) rowsOut.push(["Interest saved", money(base.interest - s.interest, v.c)], ["Time saved", ym(Math.max(0, n - s.months))]);
      return { hero: ["Monthly payment", money(s.pmt1, v.c), ex > 0 ? "plus " + money(ex, v.c) + " extra" : null], rows: rowsOut, tables: [tbl], note: "Fixed rate and equal monthly payments." };
    }
  };

  /* growth engine for compound interest and retirement */
  function grow(o) {
    var i = Math.pow(1 + o.r * (1 - (o.tax || 0) / 100) / 100 / o.f, o.f / 12) - 1, bal = o.P, put = o.P, rows = [], yPut = 0, yInt = 0, n = Math.round(o.years * 12);
    for (var m = 1; m <= n; m++) {
      var y = Math.floor((m - 1) / 12), c = o.C * Math.pow(1 + (o.inc || 0) / 100, y), add = 0;
      if (o.freq === "m") add = c; else if ((o.timing === "start" && m % 12 === 1) || (o.timing !== "start" && m % 12 === 0)) add = c;
      if (o.timing === "start") { bal += add; put += add; yPut += add; }
      var it = bal * i; bal += it; yInt += it;
      if (o.timing !== "start") { bal += add; put += add; yPut += add; }
      if (m % 12 === 0 || m === n) { rows.push([String(Math.ceil(m / 12)), yPut, yInt, bal]); yPut = 0; yInt = 0; }
    }
    return { fv: bal, put: put, rows: rows };
  }
  window.GUGrow = grow;

  CALCS["compound-interest"] = {
    fields: [CUR,
      { id: "p", label: "Starting amount", def: "5000" },
      { id: "m", label: "Regular contribution", def: "200" },
      { id: "r", label: "Interest rate (% a year)", def: "5" },
      { id: "t", label: "Years", def: "10" },
      { id: "f", label: "Compounded", t: "sel", opts: [["1", "Yearly"], ["2", "Half-yearly"], ["4", "Quarterly"], ["12", "Monthly"], ["365", "Daily"]], def: "12" },
      { g: "Contributions", id: "fq", label: "Contribute", t: "sel", opts: [["m", "Every month"], ["y", "Every year"]], def: "m" },
      { g: "Contributions", id: "tm", label: "Paid in at", t: "sel", opts: [["end", "End of the period"], ["start", "Start of the period"]], def: "end" },
      { g: "Contributions", id: "inc", label: "Yearly increase in contributions (%)", def: "0", wide: true },
      { g: "Tax and inflation", id: "tax", label: "Tax on the interest (%)", def: "0" },
      { g: "Tax and inflation", id: "inf", label: "Inflation (% a year)", def: "0" }],
    run: function (v) {
      var P = opt(v.p), C = opt(v.m), r = num(v.r), t = num(v.t), inc = opt(v.inc), tax = opt(v.tax), inf = opt(v.inf);
      if (!(t > 0) || t > 100 || !(r >= 0) || P < 0 || C < 0 || P + C <= 0 || tax < 0 || tax > 100) return { err: "Enter an amount, a rate and a number of years (up to 100)." };
      var g = grow({ P: P, C: C, r: r, years: t, f: +v.f, freq: v.fq, timing: v.tm, inc: inc, tax: tax });
      var rows = [["Total you put in", money(g.put, v.c)], ["Interest earned", money(g.fv - g.put, v.c)], ["Starting amount", money(P, v.c)]];
      if (inf > 0) rows.push(["Worth in today's money", money(g.fv / Math.pow(1 + inf / 100, t), v.c)]);
      var tb = { title: "Year by year", tall: g.rows.length > 12, head: inf > 0 ? ["Year", "Paid in", "Interest", "Balance", "Today's money"] : ["Year", "Paid in", "Interest", "Balance"],
        rows: g.rows.map(function (x) { var r0 = [x[0], money(x[1], v.c), money(x[2], v.c), money(x[3], v.c)]; if (inf > 0) r0.push(money(x[3] / Math.pow(1 + inf / 100, +x[0]), v.c)); return r0; }) };
      return { hero: ["Final balance", money(g.fv, v.c)], bar: [["You put in", g.put, "take"], ["Interest", Math.max(0, g.fv - g.put), "sl"]], rows: rows, tables: [tb], note: "Tax is approximated by reducing the rate. ISAs and pensions can shelter interest in the UK." };
    }
  };

  CALCS["simple-interest"] = {
    fields: [CUR,
      { id: "p", label: "Amount", def: "2000" },
      { id: "r", label: "Interest rate (% a year)", def: "3.5" },
      { id: "t", label: "Time", def: "4" },
      { id: "u", label: "Time in", t: "sel", opts: [["y", "Years"], ["m", "Months"], ["d", "Days"]], def: "y" },
      { g: "Compare", id: "cmp", label: "Also show compound interest", t: "sel", opts: [["no", "No"], ["12", "Monthly compounding"], ["1", "Yearly compounding"], ["365", "Daily compounding"]], def: "no" }],
    run: function (v) {
      var P = num(v.p), r = num(v.r), t = num(v.t);
      if (!(P > 0) || !(r >= 0) || !(t > 0)) return { err: "Enter an amount, a rate and a time." };
      var yrs = v.u === "y" ? t : v.u === "m" ? t / 12 : t / 365, I = P * r / 100 * yrs;
      var rows = [["Total with interest", money(P + I, v.c)], ["Interest per year", money(I / yrs, v.c)], ["Interest per month", money(I / yrs / 12, v.c)], ["Interest per day", money(I / yrs / 365, v.c)]];
      if (v.cmp !== "no") { var f = +v.cmp, C = P * Math.pow(1 + r / 100 / f, f * yrs) - P; rows.push(["Compound interest, same period", money(C, v.c)], ["Extra from compounding", money(C - I, v.c)]); }
      return { hero: ["Interest", money(I, v.c)], rows: rows };
    }
  };

  CALCS.retirement = {
    fields: [CUR,
      { id: "a", label: "Your age now", def: "35" },
      { id: "z", label: "Retire at age", def: "67" },
      { id: "s", label: "Savings so far", def: "20000" },
      { id: "m", label: "You add each month", def: "400" },
      { id: "r", label: "Growth (% a year)", def: "5" },
      { g: "Employer and increases", id: "em", label: "Employer adds each month", def: "0" },
      { g: "Employer and increases", id: "inc", label: "Yearly increase in contributions (%)", def: "0" },
      { g: "Inflation and income", id: "inf", label: "Inflation (% a year)", def: "2.5" },
      { g: "Inflation and income", id: "wd", label: "Yearly withdrawal rate (%)", def: "4" },
      { g: "Inflation and income", id: "sp", label: "State pension per week (today's money)", def: "0", wide: true },
      { g: "Inflation and income", id: "tg", label: "Income you want a year (today's money)", def: "0", wide: true }],
    run: function (v) {
      var a = num(v.a), z = num(v.z), S = opt(v.s), C = opt(v.m) + opt(v.em), r = num(v.r), inc = opt(v.inc), inf = opt(v.inf), wd = num(v.wd), sp = opt(v.sp), tg = opt(v.tg);
      if (!(a >= 16) || !(z > a) || z > 100 || S < 0 || C < 0 || isNaN(r) || !(wd > 0)) return { err: "Enter your age, a later retirement age, savings, growth and a withdrawal rate above zero." };
      var yrs = z - a, g = grow({ P: S, C: C, r: r, years: yrs, f: 12, freq: "m", timing: "end", inc: inc }), f = Math.pow(1 + inf / 100, yrs);
      var income = g.fv * wd / 100, spN = sp * 52 * f;
      var rows = [["You and your employer paid in", money(g.put, v.c)], ["Growth", money(g.fv - g.put, v.c)], ["Pot in today's money", money(g.fv / f, v.c)],
        ["Income from the pot", money(income / 12, v.c) + " a month"], ["Income in today's money", money(income / f / 12, v.c) + " a month"]];
      if (sp > 0) rows.push(["Plus state pension", money(sp * 52 / 12, v.c) + " a month (today's money)"], ["Total income, today's money", money((income / f + sp * 52) / 12, v.c) + " a month"]);
      if (tg > 0) {
        var need = Math.max(0, tg * f - spN) / (wd / 100), gap = need - g.fv, i = Math.pow(1 + r / 100, 1 / 12) - 1, n = Math.round(yrs * 12), ann = i ? (Math.pow(1 + i, n) - 1) / i : n;
        rows.push(["Pot needed for your target", money(need, v.c)], gap > 0 ? ["Shortfall", money(gap, v.c)] : ["Ahead of target by", money(-gap, v.c)]);
        if (gap > 0) rows.push(["Extra to save each month", money(gap / ann, v.c)]);
      }
      return { hero: ["Pot at " + fmtg(z, 0), money(g.fv, v.c)], rows: rows, tables: [{ title: "Year by year", tall: g.rows.length > 12, head: ["Age", "Paid in", "Growth", "Pot"], rows: g.rows.map(function (x) { return [String(a + +x[0]), money(x[1], v.c), money(x[2], v.c), money(x[3], v.c)]; }) }],
        note: "Contributions are made at the end of each month. Growth is not guaranteed and tax is not included." };
    }
  };

  CALCS.inflation = {
    multi: [
      { title: "What will it cost in the future?", fields: [CUR, { id: "a", label: "Amount today", def: "1000" }, { id: "r", label: "Inflation (% a year)", def: "3" }, { id: "t", label: "Years", def: "10" }],
        run: function (v) {
          var a = num(v.a), r = num(v.r), t = num(v.t);
          if (!(a >= 0) || isNaN(r) || !(t > 0)) return { err: "Enter an amount, an inflation rate and a number of years." };
          var f = Math.pow(1 + r / 100, t);
          return { hero: ["Cost in " + fmtg(t, 2) + " years", money(a * f, v.c)], rows: [["What " + money(a, v.c) + " will buy then (today's money)", money(a / f, v.c)], ["Total price rise", fmt((f - 1) * 100, 1) + "%"]] };
        } },
      { title: "What was it worth in the past?", fields: [CUR, { id: "a", label: "Amount today", def: "1000" }, { id: "r", label: "Average inflation (% a year)", def: "3" }, { id: "t", label: "Years ago", def: "10" }],
        run: function (v) {
          var a = num(v.a), r = num(v.r), t = num(v.t);
          if (!(a >= 0) || isNaN(r) || !(t > 0)) return { err: "Enter an amount, an inflation rate and a number of years." };
          var f = Math.pow(1 + r / 100, t);
          return { hero: ["The same goods cost", money(a / f, v.c)], rows: [["Your " + money(a, v.c) + " would have been worth", money(a * f, v.c)]], note: "Both figures use a steady yearly rate, so they are an estimate." };
        } },
      { title: "Find the inflation rate", fields: [CUR, { id: "a", label: "Price then", def: "100" }, { id: "b", label: "Price now", def: "135" }, { id: "t", label: "Years between", def: "10" }],
        run: function (v) {
          var a = num(v.a), b = num(v.b), t = num(v.t);
          if (!(a > 0) || !(b > 0) || !(t > 0)) return { err: "Enter both prices and the number of years." };
          return { hero: ["Average yearly inflation", fmt((Math.pow(b / a, 1 / t) - 1) * 100, 2) + "%"], rows: [["Total rise", fmt((b / a - 1) * 100, 1) + "%"], ["Price difference", money(b - a, v.c)]] };
        } }
    ]
  };

  var VATRATES = [["20", "20% standard"], ["5", "5% reduced"], ["0", "0% zero rate"], ["x", "Other rate"]];
  CALCS.vat = {
    fields: [CUR,
      { id: "a", label: "Amount", def: "100" },
      { id: "rt", label: "VAT rate", t: "sel", opts: VATRATES, def: "20" },
      { id: "r", label: "Your VAT rate (%)", def: "20", show: function (v) { return v.rt === "x"; } },
      { id: "m", label: "The amount is", t: "sel", opts: [["ex", "Without VAT"], ["inc", "With VAT included"]], def: "ex" },
      { g: "Quantity", id: "q", label: "Number of items", def: "1" },
      { g: "Quantity", id: "pi", label: "The amount is", t: "sel", opts: [["each", "Per item"], ["all", "For everything"]], def: "each" }],
    run: function (v) {
      var a = num(v.a), r = v.rt === "x" ? num(v.r) : +v.rt, q = Math.max(1, Math.round(opt(v.q, 1)));
      if (!(a >= 0) || !(r >= 0)) return { err: "Enter an amount and a VAT rate." };
      var amt = v.pi === "each" ? a * q : a, net = v.m === "ex" ? amt : amt / (1 + r / 100), vat = net * r / 100;
      var rows = [["Without VAT", money(net, v.c)], ["VAT at " + fmtg(r, 2) + "%", money(vat, v.c)], ["With VAT", money(net + vat, v.c)]];
      if (q > 1) rows.push(["Each item with VAT", money((net + vat) / q, v.c)]);
      return { hero: [v.m === "ex" ? "Price with VAT" : "Price without VAT", money(v.m === "ex" ? net + vat : net, v.c)], bar: [["Price", net, "take"], ["VAT", vat, "tax"]], rows: rows, note: "The standard UK rate is 20% and the reduced rate is 5%. Some goods, such as most food, are zero rated." };
    }
  };

  CALCS["sales-tax"] = {
    fields: [CUR,
      { id: "a", label: "Amount", def: "100" },
      { id: "r", label: "State or main rate (%)", def: "6" },
      { id: "l", label: "Local rate (%)", def: "2" },
      { id: "m", label: "The amount is", t: "sel", opts: [["ex", "Before tax"], ["inc", "Tax included"]], def: "ex" },
      { g: "Quantity", id: "q", label: "Number of items", def: "1" },
      { g: "Quantity", id: "pi", label: "The amount is", t: "sel", opts: [["each", "Per item"], ["all", "For everything"]], def: "each" }],
    run: function (v) {
      var a = num(v.a), r = num(v.r), l = opt(v.l), q = Math.max(1, Math.round(opt(v.q, 1)));
      if (!(a >= 0) || !(r >= 0) || l < 0) return { err: "Enter an amount and a tax rate." };
      var amt = v.pi === "each" ? a * q : a, tot = r + l, net = v.m === "ex" ? amt : amt / (1 + tot / 100);
      var rows = [["Before tax", money(net, v.c)], ["Main tax at " + fmtg(r, 3) + "%", money(net * r / 100, v.c)]];
      if (l > 0) rows.push(["Local tax at " + fmtg(l, 3) + "%", money(net * l / 100, v.c)]);
      rows.push(["Total tax", money(net * tot / 100, v.c)], ["Total with tax", money(net * (1 + tot / 100), v.c)]);
      return { hero: [v.m === "ex" ? "Total with tax" : "Price before tax", money(v.m === "ex" ? net * (1 + tot / 100) : net, v.c)], bar: [["Price", net, "take"], ["Tax", net * tot / 100, "tax"]], rows: rows };
    }
  };

  CALCS.tip = {
    fields: [CUR,
      { id: "b", label: "Bill", def: "60" },
      { id: "t", label: "Tip (%)", def: "12.5" },
      { id: "n", label: "People", def: "2" },
      { g: "Options", id: "vt", label: "VAT or tax rate in the bill (%)", def: "0", hint: "Set this to leave the tip on the price before tax." },
      { g: "Options", id: "sv", label: "Service charge already added (%)", def: "0" },
      { g: "Options", id: "rd", label: "Round each share", t: "sel", opts: [["no", "Do not round"], ["up", "Up to the next whole unit"], ["near", "To the nearest whole unit"]], def: "no" },
      { g: "Options", id: "tb", label: "Tip on", t: "sel", opts: [["all", "The whole bill"], ["net", "The bill before tax"]], def: "all" }],
    run: function (v) {
      var b = num(v.b), t = num(v.t), n = Math.max(1, Math.round(opt(v.n, 1))), vt = opt(v.vt), sv = opt(v.sv);
      if (!(b >= 0) || !(t >= 0) || vt < 0 || sv < 0) return { err: "Enter a bill and a tip percentage." };
      var base = v.tb === "net" && vt > 0 ? b / (1 + vt / 100) : b, svc = sv > 0 ? base * sv / 100 : 0, tip = (base + 0) * t / 100, total = b + svc + tip, each = total / n;
      if (v.rd === "up") each = Math.ceil(each - 1e-9); else if (v.rd === "near") each = Math.round(each);
      var paid = each * n;
      var rows = [["Tip", money(tip, v.c)], ["Bill with tip", money(total, v.c)], ["Tip each", money(tip / n, v.c)], ["Tip as a share of the bill", fmt(b ? (paid - b) / b * 100 : 0, 1) + "%"]];
      if (svc > 0) rows.splice(1, 0, ["Service charge", money(svc, v.c)]);
      if (v.rd !== "no") rows.push(["Total paid after rounding", money(paid, v.c)], ["Extra left as tip by rounding", money(paid - total, v.c)]);
      return { hero: ["Each person pays", money(each, v.c)], rows: rows };
    }
  };

  CALCS.discount = {
    fields: [CUR,
      { id: "p", label: "Original price", def: "80" },
      { id: "d", label: "Discount (%)", def: "25" },
      { id: "e", label: "Extra off (%)", def: "0" },
      { g: "Quantity and coupon", id: "q", label: "Number of items", def: "1" },
      { g: "Quantity and coupon", id: "cp", label: "Coupon taken off at the end", def: "0" },
      { g: "Tax", id: "tx", label: "VAT or sales tax on top (%)", def: "0" }],
    run: function (v) {
      var p = num(v.p), d = num(v.d), e = opt(v.e), q = Math.max(1, Math.round(opt(v.q, 1))), cp = opt(v.cp), tx = opt(v.tx);
      if (!(p >= 0) || !(d >= 0) || d > 100 || e < 0 || e > 100 || cp < 0 || tx < 0) return { err: "Enter a price and a discount between 0 and 100." };
      var each = p * (1 - d / 100) * (1 - e / 100), sub = Math.max(0, each * q - cp), tax = sub * tx / 100, total = sub + tax, was = p * q;
      var rows = [["Price after discount", money(each, v.c) + (q > 1 ? " each" : "")], ["You save", money(was - sub, v.c)], ["Total discount", fmt(was ? (1 - sub / was) * 100 : 0, 1) + "%"]];
      if (tx > 0) rows.push(["Tax", money(tax, v.c)]);
      if (q > 1) rows.push(["Original total", money(was, v.c)]);
      return { hero: ["You pay", money(total, v.c)], rows: rows };
    }
  };

  CALCS["income-tax"] = {
    fields: [
      { id: "g", label: "Income (£)", def: "45000" },
      { id: "per", label: "Income is per", t: "sel", opts: [["year", "Year"], ["month", "Month"], ["week", "Week"]], def: "year" },
      { g: "Region and tax code", id: "rg", label: "Where you live", t: "sel", opts: [["eng", "England, Wales or N. Ireland"], ["sco", "Scotland"]], def: "eng", wide: true },
      { g: "Region and tax code", id: "cd", label: "Tax code (optional)", def: "", ph: "Standard 1257L", wide: true },
      { g: "Pension and benefits", id: "pen", label: "Pension (% of income, before tax)", def: "0" },
      { g: "Pension and benefits", id: "ben", label: "Taxable benefits per year (£)", def: "0" },
      { g: "National Insurance", id: "ni", label: "National Insurance", t: "sel", opts: [["yes", "Pay National Insurance"], ["no", "Over state pension age (none)"]], def: "yes", wide: true }],
    run: function (v) {
      var g = num(v.g), m = { year: 1, month: 12, week: 52 }[v.per], pen = opt(v.pen), ben = opt(v.ben);
      if (!(g >= 0)) return { err: "Enter your income." };
      var code = parseCode(v.cd.trim()); if (!code) return { err: "That tax code is not recognised. Try 1257L, BR, D0, K475 or S1257L, or leave it blank." };
      if (pen < 0 || pen > 100 || ben < 0) return { err: "Check the pension percentage and benefits." };
      var annual = g * m, r = ukCalc({ annual: annual, days: 5, hours: 40, off: 0, bonus: 0, overtime: 0, benefits: ben, ss: 0, other: 0, pen: pen, penUnit: "pct", penMethod: "net", code: v.cd.trim(), region: v.rg, loan: "0", pg: false, spa: v.ni === "no" });
      var tb = r.bands.filter(function (b) { return b.amt > 0; }).map(function (b) { return [b.name, money(b.amt, "£"), fmtg(b.rate * 100, 1) + "%", money(b.tax, "£")]; });
      if (r.allowance > 0) tb.unshift(["Tax-free allowance", money(Math.min(r.allowance, r.taxPay), "£"), "0%", "£0.00"]);
      var marg = (function () { var a2 = ukCalc({ annual: annual + 100, days: 5, hours: 40, off: 0, bonus: 0, overtime: 0, benefits: ben, ss: 0, other: 0, pen: pen, penUnit: "pct", penMethod: "net", code: v.cd.trim(), region: v.rg, loan: "0", pg: false, spa: v.ni === "no" }); return (a2.tax + a2.ni - r.tax - r.ni) / 100; })();
      var d = m;
      return { hero: ["Take-home pay · " + { year: "yearly", month: "monthly", week: "weekly" }[v.per], money(r.take / d, "£")], bar: [["Take-home", r.take, "take"], ["Income tax", r.tax, "tax"], ["National Insurance", r.ni, "ni"], ["Pension", r.pen, "pen"]],
        rows: [["Gross income", money(r.gross / d, "£")], ["Pension", money(-r.pen / d, "£")], ["Income tax", money(-r.tax / d, "£")], ["National Insurance", money(-r.ni / d, "£")], ["Take-home pay", money(r.take / d, "£"), "total"], ["Yearly take-home", money(r.take, "£")], ["Average tax rate", fmt(r.gross ? (r.tax + r.ni) / r.gross * 100 : 0, 1) + "% (tax and NI)"], ["Tax on your next £1", fmt(marg * 100, 0) + "p (tax and NI)"]],
        tables: [{ title: "How your tax is worked out", head: ["Band", "Income", "Rate", "Tax"], rows: tb }],
        note: (r.sco ? "Scottish rates. " : "") + "2026/27. Student loan and other deductions are not included. Use the salary calculator for those." };
    }
  };


  /* ================= MATH ================= */
  CALCS.percentage = {
    multi: [
      { title: "What is X% of Y?", fields: [{ id: "x", label: "X (%)", def: "15" }, { id: "y", label: "Y", def: "240" }],
        run: function (v) { var x = num(v.x), y = num(v.y); if (isNaN(x) || isNaN(y)) return { err: "Enter two numbers." }; return { hero: ["Answer", fmtg(x / 100 * y, 6)], rows: [["Calculation", fmtg(x, 6) + " ÷ 100 × " + fmtg(y, 6)]] }; } },
      { title: "X is what percent of Y?", fields: [{ id: "x", label: "X", def: "36" }, { id: "y", label: "Y", def: "240" }],
        run: function (v) { var x = num(v.x), y = num(v.y); if (isNaN(x) || !y || isNaN(y)) return { err: "Enter two numbers. Y cannot be zero." }; return { hero: ["Answer", fmtg(x / y * 100, 4) + "%"], rows: [["As a decimal", fmtg(x / y, 8)]] }; } },
      { title: "X is Y% of what?", fields: [{ id: "x", label: "X", def: "36" }, { id: "y", label: "Y (%)", def: "15" }],
        run: function (v) { var x = num(v.x), y = num(v.y); if (isNaN(x) || !y || isNaN(y)) return { err: "Enter two numbers. Y cannot be zero." }; return { hero: ["The whole is", fmtg(x / (y / 100), 6)] }; } },
      { title: "Increase or decrease Y by X%", fields: [{ id: "x", label: "X (%)", def: "10" }, { id: "y", label: "Y", def: "200" }],
        run: function (v) { var x = num(v.x), y = num(v.y); if (isNaN(x) || isNaN(y)) return { err: "Enter two numbers." }; return { hero: ["Increased", fmtg(y * (1 + x / 100), 6)], rows: [["Decreased", fmtg(y * (1 - x / 100), 6)], ["Amount of the change", fmtg(y * x / 100, 6)]] }; } },
      { title: "Percentage difference between two numbers", fields: [{ id: "x", label: "First number", def: "80" }, { id: "y", label: "Second number", def: "100" }],
        run: function (v) { var x = num(v.x), y = num(v.y); if (isNaN(x) || isNaN(y) || x + y === 0) return { err: "Enter two numbers that do not add up to zero." }; return { hero: ["Difference", fmtg(Math.abs(x - y) / ((Math.abs(x) + Math.abs(y)) / 2) * 100, 4) + "%"], rows: [["Absolute difference", fmtg(Math.abs(x - y), 6)]], note: "This compares the gap with the average of the two numbers. For a change from one value to another, use the percentage change calculator." }; } }
    ]
  };

  CALCS["percentage-change"] = {
    fields: [
      { id: "a", label: "From", def: "80" },
      { id: "b", label: "To", def: "100" },
      { g: "More", id: "y", label: "Years between (for yearly growth)", def: "" , ph: "Optional"},
      { g: "More", id: "dp", label: "Decimal places", t: "sel", opts: [["0", "0"], ["1", "1"], ["2", "2"], ["4", "4"]], def: "2" }],
    run: function (v) {
      var a = num(v.a), b = num(v.b), y = v.y === "" ? 0 : num(v.y), dp = +v.dp;
      if (isNaN(a) || isNaN(b) || a === 0) return { err: "Enter two numbers. The first cannot be zero." };
      if (isNaN(y) || y < 0) return { err: "Years must be zero or more." };
      var c = (b - a) / Math.abs(a) * 100, rows = [["Difference", fmtg(b - a, 4)], ["New value is", fmtg(b / a * 100, dp) + "% of the old"]];
      if (y > 0) { if (a > 0 && b > 0) rows.push(["Average growth each year", fmt((Math.pow(b / a, 1 / y) - 1) * 100, dp) + "%"]); else rows.push(["Average growth each year", "Needs positive values"]); }
      return { hero: [c >= 0 ? "Increase" : "Decrease", fmt(Math.abs(c), dp) + "%"], rows: rows };
    }
  };

  function quant(sorted, p) { var pos = (sorted.length - 1) * p, lo = Math.floor(pos), hi = Math.ceil(pos); return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo); }
  function stats(a) {
    var n = a.length, s = a.reduce(function (x, y) { return x + y; }, 0), sorted = a.slice().sort(function (x, y) { return x - y; }), mean = s / n;
    var cnt = {}, best = 0; a.forEach(function (x) { cnt[x] = (cnt[x] || 0) + 1; best = Math.max(best, cnt[x]); });
    var modes = best > 1 ? Object.keys(cnt).filter(function (k) { return cnt[k] === best; }).map(Number).sort(function (x, y) { return x - y; }) : [];
    var ss = a.reduce(function (x, y) { return x + (y - mean) * (y - mean); }, 0);
    return { n: n, sum: s, sorted: sorted, mean: mean, median: quant(sorted, 0.5), modes: modes, ss: ss, min: sorted[0], max: sorted[n - 1] };
  }
  CALCS.average = {
    multi: [
      { title: "Average of a list of numbers", fields: [{ id: "l", label: "Numbers (separate with commas, spaces or new lines)", t: "area", def: "12, 7, 9, 15, 7, 20" }],
        run: function (v) {
          var a = parseList(v.l);
          if (!a.length || a.some(isNaN)) return { err: "Enter some numbers, separated by commas or spaces." };
          var s = stats(a), pos = a.every(function (x) { return x > 0; });
          var rows = [["Median", fmtg(s.median, 6)], ["Mode", s.modes.length ? s.modes.map(function (m) { return fmtg(m); }).join(", ") : "None"], ["Sum", fmtg(s.sum, 6)], ["Count", String(s.n)], ["Smallest", fmtg(s.min)], ["Largest", fmtg(s.max)], ["Range", fmtg(s.max - s.min)],
            ["First quartile (Q1)", fmtg(quant(s.sorted, 0.25))], ["Third quartile (Q3)", fmtg(quant(s.sorted, 0.75))], ["Midrange", fmtg((s.min + s.max) / 2)]];
          if (pos) rows.push(["Geometric mean", fmtg(Math.exp(a.reduce(function (x, y) { return x + Math.log(y); }, 0) / s.n), 6)], ["Harmonic mean", fmtg(s.n / a.reduce(function (x, y) { return x + 1 / y; }, 0), 6)]);
          return { hero: ["Mean (average)", fmtg(s.mean, 6)], rows: rows };
        } },
      { title: "Weighted average", fields: [{ id: "l", label: "One per line: value, then weight (like  85 30)", t: "area", def: "85 30\n72 20\n90 50" }],
        run: function (v) {
          var lines = String(v.l).split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean), s = 0, w = 0;
          if (!lines.length) return { err: "Enter at least one value and its weight." };
          for (var i = 0; i < lines.length; i++) {
            var m = /^(-?\d+(?:\.\d+)?)[\s,;]+(\d+(?:\.\d+)?)$/.exec(lines[i]);
            if (!m) return { err: "Line " + (i + 1) + " should look like 85 30 (value, then weight)." };
            s += +m[1] * +m[2]; w += +m[2];
          }
          if (!(w > 0)) return { err: "The weights must add up to more than zero." };
          return { hero: ["Weighted average", fmtg(s / w, 6)], rows: [["Total weight", fmtg(w, 6)]] };
        } }
    ]
  };

  CALCS["standard-deviation"] = {
    fields: [{ id: "l", label: "Numbers (separate with commas, spaces or new lines)", t: "area", def: "4, 8, 6, 5, 3, 7, 9" },
      { g: "Z-score", id: "z", label: "Find the z-score of this value", def: "", ph: "Optional" }],
    run: function (v) {
      var a = parseList(v.l);
      if (a.length < 2 || a.some(isNaN)) return { err: "Enter at least two numbers." };
      var s = stats(a), n = s.n, sd = Math.sqrt(s.ss / (n - 1)), pd = Math.sqrt(s.ss / n), se = sd / Math.sqrt(n);
      var rows = [["Population standard deviation", fmtg(pd, 6)], ["Sample variance", fmtg(s.ss / (n - 1), 6)], ["Population variance", fmtg(s.ss / n, 6)], ["Mean", fmtg(s.mean, 6)], ["Median", fmtg(s.median, 6)], ["Count", String(n)],
        ["Standard error of the mean", fmtg(se, 6)], ["Coefficient of variation", s.mean ? fmtg(sd / Math.abs(s.mean) * 100, 3) + "%" : "-"], ["95% range for the mean", fmtg(s.mean - 1.96 * se, 5) + " to " + fmtg(s.mean + 1.96 * se, 5)], ["Range", fmtg(s.max - s.min)]];
      if (v.z !== "") { var x = num(v.z); if (isNaN(x)) return { err: "Enter a number for the z-score, or leave it blank." }; rows.push(["Z-score of " + fmtg(x), sd ? fmtg((x - s.mean) / sd, 4) : "-"]); }
      return { hero: ["Sample standard deviation", fmtg(sd, 6)], rows: rows, note: "Use the sample figure when your numbers are only part of a bigger group, and the population figure when they are the whole group. The 95% range uses the normal approximation." };
    }
  };

  function frac(n, m) { if (m < 0) { n = -n; m = -m; } var g = gcdI(n, m) || 1, sn = n / g, sm = m / g, whole = Math.trunc(sn / sm), rem = Math.abs(sn % sm); return { n: sn, d: sm, txt: sm === 1 ? String(sn) : sn + "/" + sm, mixed: sm !== 1 && Math.abs(whole) >= 1 ? whole + " " + rem + "/" + sm : (sm === 1 ? String(sn) : sn + "/" + sm) }; }
  function gcdI(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  CALCS.fraction = {
    multi: [
      { title: "Add, subtract, multiply or divide", fields: [
        { id: "w1", label: "First: whole number", def: "0" }, { id: "a", label: "Top (numerator)", def: "3" }, { id: "b", label: "Bottom (denominator)", def: "4" },
        { id: "o", label: "Operation", t: "sel", opts: [["+", "Add (+)"], ["-", "Subtract (−)"], ["*", "Multiply (×)"], ["/", "Divide (÷)"]], def: "+" },
        { id: "w2", label: "Second: whole number", def: "0" }, { id: "c", label: "Top (numerator)", def: "2" }, { id: "d", label: "Bottom (denominator)", def: "3" }],
        run: function (v) {
          var w1 = opt(v.w1), a = num(v.a), b = num(v.b), w2 = opt(v.w2), c = num(v.c), d = num(v.d);
          if ([w1, a, b, w2, c, d].some(function (x) { return !isFinite(x) || Math.floor(x) !== x; })) return { err: "Use whole numbers in each box." };
          if (!b || !d) return { err: "A bottom number cannot be zero." };
          var n1 = (w1 < 0 ? -1 : 1) * (Math.abs(w1) * b + a), n2 = (w2 < 0 ? -1 : 1) * (Math.abs(w2) * d + c), n, m;
          if (v.o === "+") { n = n1 * d + n2 * b; m = b * d; } else if (v.o === "-") { n = n1 * d - n2 * b; m = b * d; }
          else if (v.o === "*") { n = n1 * n2; m = b * d; } else { if (!n2) return { err: "You cannot divide by zero." }; n = n1 * d; m = b * n2; }
          var f = frac(n, m);
          return { hero: ["Answer", f.txt], rows: [["As a mixed number", f.mixed], ["As a decimal", fmtg(n / m, 8)], ["As a percentage", fmtg(n / m * 100, 6) + "%"], ["Before simplifying", (m < 0 ? -n : n) + "/" + Math.abs(m)]] };
        } },
      { title: "Turn a decimal into a fraction", fields: [{ id: "x", label: "Decimal", def: "0.375" }, { id: "mx", label: "Largest bottom number", t: "sel", opts: [["100", "100"], ["1000", "1,000"], ["10000", "10,000"]], def: "1000" }],
        run: function (v) {
          var s = String(v.x).trim(), x = num(s), mx = +v.mx;
          if (isNaN(x)) return { err: "Enter a decimal such as 0.375." };
          var digits = (s.split(".")[1] || "").replace(/\D/g, "").length, tol = 0.5 * Math.pow(10, -Math.min(digits, 12)), sign = x < 0 ? -1 : 1, ax = Math.abs(x), whole = Math.floor(ax), fr = ax - whole;
          var h1 = 1, h0 = 0, k1 = 0, k0 = 1, y = fr, p = 0, q = 1;
          for (var i = 0; i < 40; i++) {
            var a = Math.floor(y), h2 = a * h1 + h0, k2 = a * k1 + k0;
            if (k2 > mx) break; h0 = h1; h1 = h2; k0 = k1; k1 = k2; p = h1; q = k1;
            if (Math.abs(fr - p / q) < tol || y - a < 1e-12) break; y = 1 / (y - a);
          }
          if (!q) { p = 0; q = 1; }
          var top = whole * q + p, f = frac(sign * top, q);
          return { hero: ["Fraction", f.txt], rows: [["As a mixed number", f.mixed], ["Check", fmtg(sign * top / q, 10)], ["As a percentage", fmtg(x * 100, 8) + "%"]], note: Math.abs(ax - top / q) > tol ? "This is the closest fraction within your limit." : "" };
        } },
      { title: "Simplify a fraction", fields: [{ id: "a", label: "Top (numerator)", def: "18" }, { id: "b", label: "Bottom (denominator)", def: "24" }],
        run: function (v) {
          var a = num(v.a), b = num(v.b);
          if (!isFinite(a) || !isFinite(b) || Math.floor(a) !== a || Math.floor(b) !== b) return { err: "Use whole numbers." };
          if (!b) return { err: "The bottom number cannot be zero." };
          var f = frac(a, b), g = gcdI(a, b);
          return { hero: ["Simplest form", f.txt], rows: [["Greatest common factor", String(g)], ["As a decimal", fmtg(a / b, 8)], ["As a percentage", fmtg(a / b * 100, 6) + "%"], ["As a mixed number", f.mixed]] };
        } }
    ]
  };

  function triResult(a, b, c) {
    var s = (a + b + c) / 2, area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
    function ang(x, y, z) { return Math.acos(Math.max(-1, Math.min(1, (y * y + z * z - x * x) / (2 * y * z)))) * 180 / Math.PI; }
    var A = ang(a, b, c), B = ang(b, a, c), C = 180 - A - B, big = Math.max(a, b, c);
    var kind = (Math.abs(a - b) < 1e-9 && Math.abs(b - c) < 1e-9) ? "Equilateral" : (Math.abs(a - b) < 1e-9 || Math.abs(b - c) < 1e-9 || Math.abs(a - c) < 1e-9) ? "Isosceles" : "Scalene";
    var angType = big * big > (a * a + b * b + c * c - big * big) + 1e-9 * big * big ? "obtuse" : Math.abs(big * big - (a * a + b * b + c * c - big * big)) < 1e-9 * big * big ? "right-angled" : "acute";
    return { a: a, b: b, c: c, A: A, B: B, C: C, area: area, per: a + b + c, kind: kind, angType: angType, inr: area / s, circ: a * b * c / (4 * area) };
  }
  CALCS.triangle = {
    fields: [
      { id: "m", label: "You know", t: "sel", opts: [["sss", "Three sides"], ["sas", "Two sides and the angle between them"], ["asa", "Two angles and the side between them"], ["rl", "Right triangle: two short sides"], ["rh", "Right triangle: one short side and the long side"]], def: "sss", wide: true },
      { id: "a", label: function (v) { return v.m === "asa" ? "Angle A (degrees)" : v.m === "rl" ? "Short side a" : v.m === "rh" ? "Short side a" : "Side a"; }, def: "3" },
      { id: "b", label: function (v) { return v.m === "asa" ? "Angle B (degrees)" : v.m === "rl" ? "Short side b" : v.m === "rh" ? "Long side (hypotenuse) c" : "Side b"; }, def: "4" },
      { id: "c", label: function (v) { return v.m === "sas" ? "Angle C between them (degrees)" : v.m === "asa" ? "Side c between them" : "Side c"; }, def: "5", show: function (v) { return v.m === "sss" || v.m === "sas" || v.m === "asa"; } }],
    run: function (v) {
      var a = num(v.a), b = num(v.b), c = num(v.c), t;
      if (v.m === "rl") { if (!(a > 0) || !(b > 0)) return { err: "Enter both short sides." }; t = triResult(a, b, Math.hypot(a, b)); }
      else if (v.m === "rh") { if (!(a > 0) || !(b > 0) || a >= b) return { err: "Enter a short side that is smaller than the long side." }; t = triResult(a, Math.sqrt(b * b - a * a), b); }
      else if (v.m === "sas") { if (!(a > 0) || !(b > 0) || !(c > 0 && c < 180)) return { err: "Enter two sides and an angle between 0 and 180 degrees." }; t = triResult(a, b, Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(c * Math.PI / 180))); }
      else if (v.m === "asa") { if (!(a > 0) || !(b > 0) || !(c > 0) || a + b >= 180) return { err: "Enter two angles that add up to less than 180 degrees, and the side between them." }; var C = 180 - a - b, ra = a * Math.PI / 180, rb = b * Math.PI / 180, rc = C * Math.PI / 180; t = triResult(c * Math.sin(ra) / Math.sin(rc), c * Math.sin(rb) / Math.sin(rc), c); }
      else { if (!(a > 0) || !(b > 0) || !(c > 0)) return { err: "Enter the length of all three sides." }; if (a + b <= c || a + c <= b || b + c <= a) return { err: "Those sides cannot make a triangle. Any two sides must add up to more than the third." }; t = triResult(a, b, c); }
      return { hero: ["Area", fmtg(t.area, 6)], rows: [["Side a", fmtg(t.a, 6)], ["Side b", fmtg(t.b, 6)], ["Side c", fmtg(t.c, 6)], ["Angle A", fmt(t.A, 2) + "°"], ["Angle B", fmt(t.B, 2) + "°"], ["Angle C", fmt(t.C, 2) + "°"], ["Perimeter", fmtg(t.per, 6)], ["Inscribed circle radius", fmtg(t.inr, 6)], ["Circumscribed circle radius", fmtg(t.circ, 6)], ["Type", t.kind + ", " + t.angType]] };
    }
  };

  CALCS["random-number"] = {
    multi: [
      { title: "Random numbers", again: "Pick again", fields: [
        { id: "a", label: "Smallest", def: "1" }, { id: "b", label: "Largest", def: "100" }, { id: "n", label: "How many", def: "5" },
        { id: "u", label: "Repeats", t: "sel", opts: [["y", "Allow repeats"], ["n", "No repeats"]], def: "n" },
        { g: "Options", id: "dp", label: "Decimal places", t: "sel", opts: [["0", "None (whole numbers)"], ["1", "1"], ["2", "2"], ["3", "3"]], def: "0" },
        { g: "Options", id: "so", label: "Order", t: "sel", opts: [["no", "As picked"], ["asc", "Smallest first"], ["desc", "Largest first"]], def: "no" }],
        run: function (v) {
          var a = num(v.a), b = num(v.b), n = Math.round(num(v.n)), dp = +v.dp, k = Math.pow(10, dp);
          if (isNaN(a) || isNaN(b) || b < a || !(n >= 1) || n > 1000) return { err: "Enter a smallest and largest number, and how many to pick (up to 1000)." };
          var lo = Math.ceil(a * k), hi = Math.floor(b * k);
          if (hi < lo) return { err: "There is no number in that range with that many decimal places." };
          if (v.u === "n" && n > hi - lo + 1) return { err: "There are not enough different numbers in that range." };
          var out = [], seen = {};
          while (out.length < n) { var x = lo + rnd(hi - lo + 1); if (v.u === "n") { if (seen[x]) continue; seen[x] = 1; } out.push(x); }
          if (v.so === "asc") out.sort(function (p, q) { return p - q; }); else if (v.so === "desc") out.sort(function (p, q) { return q - p; });
          var txt = out.map(function (x) { return (x / k).toFixed(dp); });
          return { hero: [n === 1 ? "Your number" : "Your numbers", txt.join(", ")], rows: n > 1 ? [["Sum", fmt(out.reduce(function (p, q) { return p + q; }, 0) / k, dp)], ["Average", fmt(out.reduce(function (p, q) { return p + q; }, 0) / k / n, Math.max(dp, 2))]] : [] };
        } },
      { title: "Roll dice", again: "Roll again", fields: [{ id: "n", label: "Number of dice", def: "2" }, { id: "s", label: "Sides on each die", t: "sel", opts: [["4", "4"], ["6", "6"], ["8", "8"], ["10", "10"], ["12", "12"], ["20", "20"], ["100", "100"]], def: "6" }],
        run: function (v) {
          var n = Math.round(num(v.n)), s = +v.s;
          if (!(n >= 1 && n <= 50)) return { err: "Roll between 1 and 50 dice." };
          var r = [], t = 0; for (var i = 0; i < n; i++) { var x = 1 + rnd(s); r.push(x); t += x; }
          return { hero: ["Total", String(t)], rows: [["Rolls", r.join(", ")], ["Range", n + " to " + n * s]] };
        } },
      { title: "Flip coins", again: "Flip again", fields: [{ id: "n", label: "Number of coins", def: "1" }],
        run: function (v) {
          var n = Math.round(num(v.n));
          if (!(n >= 1 && n <= 1000)) return { err: "Flip between 1 and 1000 coins." };
          var h = 0, seq = []; for (var i = 0; i < n; i++) { var x = rnd(2); h += x; if (n <= 20) seq.push(x ? "Heads" : "Tails"); }
          return { hero: [n === 1 ? "Result" : "Result", n === 1 ? (h ? "Heads" : "Tails") : h + " heads, " + (n - h) + " tails"], rows: seq.length > 1 ? [["Flips", seq.join(", ")]] : [] };
        } }
    ]
  };


  /* ================= FITNESS AND HEALTH ================= */
  CALCS.bmi = {
    fields: bodyFields().concat([
      { g: "About you", id: "ag", label: "Age", def: "30" },
      { g: "About you", id: "eth", label: "Cut-offs to use", t: "sel", opts: [["who", "Standard (WHO)"], ["asia", "South or East Asian"]], def: "who", wide: true }]),
    run: function (v) {
      var m = bodyMetric(v), age = opt(v.ag, 30);
      if (!(m.h > 50 && m.h < 260) || !(m.w > 10 && m.w < 400)) return { err: "Enter your height and weight." };
      var hm = m.h / 100, bmi = m.w / (hm * hm), asia = v.eth === "asia", hi = asia ? 23 : 25, ob = asia ? 27.5 : 30;
      var cat = bmi < 16 ? "Severely underweight" : bmi < 18.5 ? "Underweight" : bmi < hi ? "Healthy weight" : bmi < ob ? "Overweight" : bmi < 35 ? "Obese (class 1)" : bmi < 40 ? "Obese (class 2)" : "Obese (class 3)";
      var lo = 18.5 * hm * hm, up = (hi - 0.01) * hm * hm, diff = bmi < 18.5 ? "gain " + fmt(lo - m.w, 1) + " kg" : bmi >= hi ? "lose " + fmt(m.w - up, 1) + " kg" : null;
      var rows = [["Healthy weight range", fmt(lo, 1) + " to " + fmt(up, 1) + " kg"], ["In stone and pounds", stLb(lo) + " to " + stLb(up)]];
      if (diff) rows.push(["To reach a healthy BMI", diff]);
      rows.push(["BMI Prime", fmt(bmi / hi, 2)], ["Ponderal index", fmt(m.w / (hm * hm * hm), 1) + " kg/m³"], ["Your weight", fmt(m.w, 1) + " kg · " + stLb(m.w)]);
      return { hero: ["Your BMI", fmt(bmi, 1), cat], warn: age < 18 ? "BMI for children and teenagers is read against growth charts for their age, so this result may not apply." : null, rows: rows,
        note: "BMI is a rough guide. It does not account for muscle, age or body shape, so speak to a doctor or nurse about what is right for you." };
    }
  };

  var ACT = [["1.2", "Little or no exercise"], ["1.375", "Light, 1 to 3 days a week"], ["1.55", "Moderate, 3 to 5 days a week"], ["1.725", "Hard, 6 to 7 days a week"], ["1.9", "Very hard or a physical job"]];
  function bmrOf(f, m, sex, age, bf) {
    if (f === "hb") return sex === "m" ? 88.362 + 13.397 * m.w + 4.799 * m.h - 5.677 * age : 447.593 + 9.247 * m.w + 3.098 * m.h - 4.33 * age;
    if (f === "km") return 370 + 21.6 * m.w * (1 - bf / 100);
    return 10 * m.w + 6.25 * m.h - 5 * age + (sex === "m" ? 5 : -161);
  }
  var BMRF = [["ms", "Mifflin-St Jeor (most used)"], ["hb", "Harris-Benedict (revised)"], ["km", "Katch-McArdle (needs body fat)"]];
  CALCS.calorie = {
    fields: [{ id: "s", label: "Sex", t: "sel", opts: [["f", "Female"], ["m", "Male"]], def: "f" }, { id: "g", label: "Age", def: "35" }].concat(bodyFields(), [
      { id: "x", label: "Activity", t: "sel", opts: ACT, def: "1.375", wide: true },
      { g: "Your goal", id: "go", label: "Goal", t: "sel", opts: [["keep", "Maintain my weight"], ["lose", "Lose weight"], ["gain", "Gain weight"]], def: "keep" },
      { g: "Your goal", id: "rt", label: "Per week", t: "sel", opts: [["0.25", "0.25 kg (about 0.5 lb)"], ["0.5", "0.5 kg (about 1 lb)"], ["0.75", "0.75 kg (about 1.5 lb)"], ["1", "1 kg (about 2 lb)"]], def: "0.5", show: function (v) { return v.go !== "keep"; } },
      { g: "Formula and macros", id: "f", label: "Formula", t: "sel", opts: BMRF, def: "ms", wide: true },
      { g: "Formula and macros", id: "bf", label: "Body fat (%)", def: "25", show: function (v) { return v.f === "km"; } },
      { g: "Formula and macros", id: "mx", label: "Macro split (carbs / protein / fat)", t: "sel", opts: [["45:25:30", "Balanced, 45 / 25 / 30"], ["35:35:30", "High protein, 35 / 35 / 30"], ["25:35:40", "Lower carb, 25 / 35 / 40"], ["55:20:25", "Higher carb, 55 / 20 / 25"]], def: "45:25:30", wide: true }]),
    run: function (v) {
      var m = bodyMetric(v), age = num(v.g), bf = opt(v.bf, 25);
      if (!(m.h > 50 && m.h < 260) || !(m.w > 10 && m.w < 400) || !(age > 14 && age < 100)) return { err: "Enter your age, height and weight." };
      if (v.f === "km" && !(bf > 2 && bf < 60)) return { err: "Enter your body fat percentage (between 3 and 60)." };
      var bmr = bmrOf(v.f, m, v.s, age, bf), tdee = bmr * (+v.x), rate = v.go === "keep" ? 0 : +v.rt, adj = rate * 1100 * (v.go === "lose" ? -1 : 1), target = tdee + adj, floor = v.s === "m" ? 1500 : 1200;
      var sp = v.mx.split(":").map(Number), mac = [["Carbohydrate", target * sp[0] / 100 / 4], ["Protein", target * sp[1] / 100 / 4], ["Fat", target * sp[2] / 100 / 9]];
      var warn = v.go === "lose" && target < floor ? "That is below " + fmtg(floor, 0) + " calories a day, which is too low to follow without medical supervision. Choose a gentler rate." : null;
      var goals = [0.25, 0.5, 0.75, 1].map(function (r) { return [fmt(r, 2) + " kg a week", fmtg(Math.round(tdee - r * 1100), 0), fmtg(Math.round(tdee + r * 1100), 0)]; });
      return { hero: [v.go === "keep" ? "Calories to maintain weight" : v.go === "lose" ? "Calories to lose weight" : "Calories to gain weight", fmtg(Math.round(target), 0) + " a day"], warn: warn,
        rows: [["Basal metabolic rate (BMR)", fmtg(Math.round(bmr), 0) + " a day"], ["To maintain your weight", fmtg(Math.round(tdee), 0) + " a day"], ["Target for your goal", fmtg(Math.round(target), 0) + " a day"]],
        sections: [["Daily macros for your target", mac.map(function (x) { return [x[0], fmtg(Math.round(x[1]), 0) + " g"]; })]],
        tables: [{ title: "Calories for each pace", head: ["Pace", "To lose", "To gain"], rows: goals }],
        note: "Uses about 7,700 calories per kilo of body weight. An estimate, not medical advice." };
    }
  };

  CALCS.bmr = {
    fields: [{ id: "s", label: "Sex", t: "sel", opts: [["f", "Female"], ["m", "Male"]], def: "f" }, { id: "g", label: "Age", def: "35" }].concat(bodyFields(), [
      { g: "Formula", id: "f", label: "Formula", t: "sel", opts: BMRF, def: "ms", wide: true },
      { g: "Formula", id: "bf", label: "Body fat (%)", def: "25", show: function (v) { return v.f === "km"; } }]),
    run: function (v) {
      var m = bodyMetric(v), age = num(v.g), bf = opt(v.bf, 25);
      if (!(m.h > 50 && m.h < 260) || !(m.w > 10 && m.w < 400) || !(age > 14 && age < 100)) return { err: "Enter your age, height and weight." };
      if (v.f === "km" && !(bf > 2 && bf < 60)) return { err: "Enter your body fat percentage (between 3 and 60)." };
      var b = bmrOf(v.f, m, v.s, age, bf), rows = [["In kilojoules", fmtg(Math.round(b * 4.184), 0) + " kJ a day"], ["Per hour", fmtg(Math.round(b / 24), 0) + " calories"]];
      var cmp = BMRF.filter(function (f) { return f[0] !== v.f && (f[0] !== "km" || (bf > 2 && bf < 60 && v.f === "km")); }).filter(function (f) { return f[0] !== "km"; }).map(function (f) { return [f[1], fmtg(Math.round(bmrOf(f[0], m, v.s, age, bf)), 0) + " a day"]; });
      return { hero: ["Basal metabolic rate", fmtg(Math.round(b), 0) + " calories a day"], rows: rows, sections: [["Other formulas", cmp]],
        tables: [{ title: "Calories a day by activity", head: ["Activity", "Calories"], rows: ACT.map(function (a) { return [a[1], fmtg(Math.round(b * +a[0]), 0)]; }) }],
        note: "The calories your body burns at rest. It is an estimate." };
    }
  };

  CALCS["body-fat"] = {
    fields: [{ id: "s", label: "Sex", t: "sel", opts: [["m", "Male"], ["f", "Female"]], def: "m" },
      { id: "u", label: "Measure in", t: "sel", opts: [["c", "Centimetres (and kg)"], ["i", "Inches (and pounds)"]], def: "c", wide: true },
      { id: "h", label: "Height", def: "178" }, { id: "n", label: "Neck", def: "38" }, { id: "w", label: "Waist (at the navel)", def: "86" },
      { id: "p", label: "Hips (widest point)", def: "98", show: function (v) { return v.s === "f"; } },
      { g: "Weight and age (optional)", id: "wt", label: function (v) { return v.u === "i" ? "Weight (pounds)" : "Weight (kg)"; }, def: "", ph: "Optional" },
      { g: "Weight and age (optional)", id: "ag", label: "Age", def: "", ph: "Optional" }],
    run: function (v) {
      var k = v.u === "i" ? 2.54 : 1, h = num(v.h) * k, n = num(v.n) * k, w = num(v.w) * k, p = opt(v.p) * k;
      if (!(h > 100) || !(n > 10) || !(w > 30) || (v.s === "f" && !(p > 30))) return { err: "Enter your height and measurements." };
      var d = v.s === "m" ? w - n : w + p - n;
      if (!(d > 0)) return { err: "The waist must be larger than the neck. Check your measurements." };
      var bf = v.s === "m" ? 495 / (1.0324 - 0.19077 * Math.log10(d) + 0.15456 * Math.log10(h)) - 450 : 495 / (1.29579 - 0.35004 * Math.log10(d) + 0.221 * Math.log10(h)) - 450;
      if (!(bf > 1 && bf < 70)) return { err: "Those measurements give an unusual result. Check them and try again." };
      var cat = v.s === "m" ? (bf < 6 ? "Essential fat" : bf < 14 ? "Athletes" : bf < 18 ? "Fitness" : bf < 25 ? "Average" : "Obese") : (bf < 14 ? "Essential fat" : bf < 21 ? "Athletes" : bf < 25 ? "Fitness" : bf < 32 ? "Average" : "Obese");
      var rows = [["Range", cat]], wt = v.wt === "" ? NaN : num(v.wt) * (v.u === "i" ? 0.45359237 : 1), ag = v.ag === "" ? NaN : num(v.ag);
      if (wt > 10) { rows.push(["Fat mass", fmt(wt * bf / 100, 1) + " kg"], ["Lean mass", fmt(wt * (1 - bf / 100), 1) + " kg"]); if (ag > 10) { var bmi = wt / Math.pow(h / 100, 2), alt = 1.2 * bmi + 0.23 * ag - (v.s === "m" ? 10.8 : 0) - 5.4; rows.push(["BMI-based estimate", fmt(alt, 1) + "%"]); } }
      var tb = v.s === "m" ? [["Essential fat", "2 to 5%"], ["Athletes", "6 to 13%"], ["Fitness", "14 to 17%"], ["Average", "18 to 24%"], ["Obese", "25% and over"]] : [["Essential fat", "10 to 13%"], ["Athletes", "14 to 20%"], ["Fitness", "21 to 24%"], ["Average", "25 to 31%"], ["Obese", "32% and over"]];
      return { hero: ["Body fat", fmt(bf, 1) + "%", cat], rows: rows, tables: [{ title: "Body fat ranges", head: ["Range", "Body fat"], rows: tb }], note: "Estimated with the US Navy tape method. It can be a few percent out, so use the same method each time to track change." };
    }
  };

  CALCS["ideal-weight"] = {
    fields: [{ id: "s", label: "Sex", t: "sel", opts: [["f", "Female"], ["m", "Male"]], def: "f" }].concat(bodyFields(true), [
      { g: "Frame and current weight", id: "fr", label: "Frame size", t: "sel", opts: [["s", "Small (10% lower)"], ["m", "Medium"], ["l", "Large (10% higher)"]], def: "m" },
      { g: "Frame and current weight", id: "cw", label: function (v) { return v.u === "i" ? "Your weight now (pounds)" : "Your weight now (kg)"; }, def: "", ph: "Optional" }]),
    run: function (v) {
      var m = bodyMetric({ u: v.u, h1: v.h1, h2: v.h2, w1: 70, w2: 0 }), inch = m.h / 2.54, over = Math.max(0, inch - 60), male = v.s === "m", fk = v.fr === "s" ? 0.9 : v.fr === "l" ? 1.1 : 1;
      if (!(m.h > 120 && m.h < 230)) return { err: "Enter a height between about 4 ft and 7 ft 6 in (120 to 230 cm)." };
      var F = [["Devine", ((male ? 50 : 45.5) + 2.3 * over) * fk], ["Robinson", ((male ? 52 : 49) + (male ? 1.9 : 1.7) * over) * fk], ["Miller", ((male ? 56.2 : 53.1) + (male ? 1.41 : 1.36) * over) * fk], ["Hamwi", ((male ? 48 : 45.4) + (male ? 2.7 : 2.2) * over) * fk]];
      var avg = F.reduce(function (a, x) { return a + x[1]; }, 0) / 4, hm = m.h / 100;
      var rows = F.map(function (x) { return [x[0], fmt(x[1], 1) + " kg · " + stLb(x[1])]; }); rows.push(["Healthy BMI range", fmt(18.5 * hm * hm, 1) + " to " + fmt(24.9 * hm * hm, 1) + " kg"]);
      var cw = v.cw === "" ? NaN : num(v.cw) * (v.u === "i" ? 0.45359237 : 1);
      if (cw > 10) { var d = cw - avg; rows.push(["You are", d > 0.05 ? fmt(d, 1) + " kg above the average" : d < -0.05 ? fmt(-d, 1) + " kg below the average" : "at the average"]); }
      return { hero: ["Ideal weight, average of four formulas", fmt(avg, 1) + " kg", stLb(avg)], rows: rows, note: "Formulas give a rough target only. Build, age and muscle all matter." };
    }
  };

  function hms(sec) { sec = Math.round(sec); var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return (h ? h + ":" + pad2(m) : m) + ":" + pad2(s); }
  CALCS.pace = {
    fields: [
      { id: "k", label: "Work out my", t: "sel", opts: [["pace", "Pace"], ["time", "Finish time"], ["dist", "Distance"]], def: "pace", wide: true },
      { id: "d", label: "Distance", def: "10", show: function (v) { return v.k !== "dist"; } },
      { id: "u", label: "Distance unit", t: "sel", opts: [["k", "Kilometres"], ["m", "Miles"]], def: "k" },
      { id: "h", label: "Hours", def: "0", show: function (v) { return v.k !== "time"; } }, { id: "mi", label: "Minutes", def: "50", show: function (v) { return v.k !== "time"; } }, { id: "s", label: "Seconds", def: "0", show: function (v) { return v.k !== "time"; } },
      { id: "pm", label: "Pace minutes", def: "5", show: function (v) { return v.k !== "pace"; } }, { id: "ps", label: "Pace seconds", def: "0", show: function (v) { return v.k !== "pace"; } },
      { id: "pu", label: "Pace is per", t: "sel", opts: [["k", "Kilometre"], ["m", "Mile"]], def: "k", show: function (v) { return v.k !== "pace"; } }],
    run: function (v) {
      var d = num(v.d), sec = opt(v.h) * 3600 + opt(v.mi) * 60 + opt(v.s), pace = opt(v.pm) * 60 + opt(v.ps), M = 1.609344, km;
      if (v.k === "pace") { if (!(d > 0) || !(sec > 0)) return { err: "Enter a distance and a time." }; km = v.u === "k" ? d : d * M; pace = sec / km; }
      else { var pk = v.pu === "k" ? pace : pace / M; if (!(pk > 0)) return { err: "Enter a pace." }; pace = pk;
        if (v.k === "time") { if (!(d > 0)) return { err: "Enter a distance." }; km = v.u === "k" ? d : d * M; sec = pace * km; }
        else { if (!(sec > 0)) return { err: "Enter a time." }; km = sec / pace; } }
      var spd = km / (sec / 3600);
      var rows = [["Pace per kilometre", hms(sec / km)], ["Pace per mile", hms(sec / km * M)], ["Speed", fmt(spd, 2) + " km/h"], ["Speed in mph", fmt(spd / M, 2) + " mph"], ["Distance", fmt(km, 2) + " km · " + fmt(km / M, 2) + " miles"], ["Finish time", hms(sec)]];
      var races = [["1 mile", M], ["5K", 5], ["10K", 10], ["10 miles", 10 * M], ["Half marathon", 21.0975], ["Marathon", 42.195]];
      var pred = km >= 1 ? { title: "Predicted times at the same effort", head: ["Race", "Time", "Pace per km"], rows: races.map(function (r) { var t = sec * Math.pow(r[1] / km, 1.06); return [r[0], hms(t), hms(t / r[1])]; }) } : null;
      return { hero: [v.k === "pace" ? "Pace" : v.k === "time" ? "Finish time" : "Distance", v.k === "pace" ? hms(sec / km) + " per km" : v.k === "time" ? hms(sec) : fmt(km / (v.u === "k" ? 1 : M), 2) + (v.u === "k" ? " km" : " miles")], rows: rows, tables: pred ? [pred] : [], note: "Predictions use the Riegel formula and assume you have trained for the longer distance." };
    }
  };

  CALCS["due-date"] = {
    fields: [
      { id: "me", label: "Work it out from", t: "sel", opts: [["lmp", "First day of last period"], ["con", "Conception date"], ["ivf5", "IVF day 5 embryo transfer"], ["ivf3", "IVF day 3 embryo transfer"]], def: "lmp", wide: true },
      { id: "l", label: function (v) { return v.me === "lmp" ? "First day of your last period" : v.me === "con" ? "Date of conception" : "Transfer date"; }, t: "date", def: "today", wide: true },
      { id: "c", label: "Cycle length (days)", def: "28", show: function (v) { return v.me === "lmp"; } }],
    run: function (v) {
      var l = parseDate(v.l), c = num(v.c), due;
      if (!l) return { err: "Choose a date." };
      if (v.me === "lmp") { if (!(c >= 21 && c <= 45)) return { err: "Enter a cycle length between 21 and 45 days." }; due = addDays(l, 280 + c - 28); }
      else if (v.me === "con") due = addDays(l, 266); else if (v.me === "ivf5") due = addDays(l, 261); else due = addDays(l, 263);
      var lmp = addDays(due, -280), today = parseDate(todayISO()), ga = Math.round((today - lmp) / 864e5), togo = Math.round((due - today) / 864e5);
      var rows = [["Estimated conception", dstr(addDays(lmp, v.me === "lmp" ? c - 14 : 14))], ["First trimester ends (13 weeks)", dstr(addDays(lmp, 91))]];
      if (ga >= 0 && ga <= 300) rows.unshift(["Today", plural(Math.floor(ga / 7), "week") + ", " + plural(ga % 7, "day")], [togo >= 0 ? "Days to go" : "Days past the due date", String(Math.abs(togo))], ["Trimester", ga < 91 ? "First" : ga < 189 ? "Second" : "Third"]);
      var mile = [[6, "Heartbeat can usually be seen"], [12, "Dating scan window opens"], [13, "End of the first trimester"], [20, "Anomaly scan (18 to 21 weeks)"], [24, "Baby reaches viability"], [28, "Third trimester begins"], [37, "Full term"], [40, "Due date"]];
      return { hero: ["Estimated due date", dstr(due)], rows: rows, tables: [{ title: "Pregnancy milestones", head: ["Week", "Date", "What happens"], rows: mile.map(function (m) { return [String(m[0]), dstr(addDays(lmp, m[0] * 7), true), m[1]]; }) }],
        note: "Only about 1 in 20 babies arrive on the due date. Your midwife or doctor will confirm your dates, often with a scan." };
    }
  };


  /* ================= DATES, TIME AND EVERYDAY ================= */
  var WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function dim(y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); }
  function ymd(a, b) {   /* whole years, months and days from a to b (a <= b) */
    var y = b.getUTCFullYear() - a.getUTCFullYear(), m = b.getUTCMonth() - a.getUTCMonth(), d = b.getUTCDate() - a.getUTCDate();
    if (d < 0) { m--; var pm = b.getUTCMonth() - 1, py = b.getUTCFullYear(); if (pm < 0) { pm = 11; py--; } d += dim(py, pm); }
    if (m < 0) { y--; m += 12; }
    return [y, m, d];
  }
  function plural(n, w) { return n + " " + w + (n === 1 ? "" : "s"); }
  function ymdStr(t) { return plural(t[0], "year") + ", " + plural(t[1], "month") + ", " + plural(t[2], "day"); }
  function zodiac(m, d) {
    var z = [["Capricorn", 1, 19], ["Aquarius", 2, 18], ["Pisces", 3, 20], ["Aries", 4, 19], ["Taurus", 5, 20], ["Gemini", 6, 20], ["Cancer", 7, 22], ["Leo", 8, 22], ["Virgo", 9, 22], ["Libra", 10, 22], ["Scorpio", 11, 21], ["Sagittarius", 12, 21], ["Capricorn", 13, 31]];
    for (var i = 0; i < z.length; i++) if (m < z[i][1] || (m === z[i][1] && d <= z[i][2])) return z[i][0];
    return "Capricorn";
  }
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function weekdaysBetween(a, b) {   /* inclusive of a, exclusive of b */
    var n = Math.round((b - a) / 864e5), c = 0, w = a.getUTCDay(), full = Math.floor(n / 7), rem = n % 7;
    c = full * 5; for (var i = 0; i < rem; i++) { var x = (w + i) % 7; if (x !== 0 && x !== 6) c++; }
    return c;
  }

  CALCS.age = {
    fields: [{ id: "b", label: "Date of birth", t: "date", def: "1990-06-15" }, { id: "t", label: "Age at the date of", t: "date", def: "today" }],
    run: function (v) {
      var b = parseDate(v.b), t = parseDate(v.t);
      if (!b || !t) return { err: "Choose both dates." };
      if (t < b) return { err: "The date of birth must be before the other date." };
      var a = ymd(b, t), days = Math.round((t - b) / 864e5), nb = new Date(Date.UTC(t.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()));
      if (b.getUTCMonth() === 1 && b.getUTCDate() === 29 && !isLeap(t.getUTCFullYear())) nb = new Date(Date.UTC(t.getUTCFullYear(), 2, 1));
      if (nb < t) { var y = t.getUTCFullYear() + 1; nb = (b.getUTCMonth() === 1 && b.getUTCDate() === 29 && !isLeap(y)) ? new Date(Date.UTC(y, 2, 1)) : new Date(Date.UTC(y, b.getUTCMonth(), b.getUTCDate())); }
      var tod = nb.getTime() === t.getTime(), left = Math.round((nb - t) / 864e5), months = a[0] * 12 + a[1];
      var ms = [["10,000 days old", addDays(b, 10000)], ["20,000 days old", addDays(b, 20000)], ["1 billion seconds old", addDays(b, 11574.074074)], ["Your 18th birthday", addMonths(b, 216)], ["Your 30th birthday", addMonths(b, 360)], ["Your 50th birthday", addMonths(b, 600)], ["Your 65th birthday", addMonths(b, 780)]];
      return { hero: ["Age", plural(a[0], "year"), plural(a[1], "month") + ", " + plural(a[2], "day")],
        rows: [["Born on a", WD[b.getUTCDay()]], ["Star sign", zodiac(b.getUTCMonth() + 1, b.getUTCDate())], ["Next birthday", tod ? "Today, happy birthday!" : dstr(nb) + " (in " + plural(left, "day") + ")"]],
        sections: [["Your age in other units", [["Months", fmtg(months, 0)], ["Weeks", fmtg(Math.floor(days / 7), 0)], ["Days", fmtg(days, 0)], ["Hours", fmtg(days * 24, 0)], ["Minutes", fmtg(days * 1440, 0)]]]],
        tables: [{ title: "Milestones", head: ["Milestone", "Date"], rows: ms.map(function (m) { return [m[0], dstr(m[1], true) + (m[1] < t ? " (passed)" : "")]; }) }], note: "Ages roll over on the anniversary of the birth date. 29 February birthdays move to 1 March in other years." };
    }
  };

  CALCS["date-calculator"] = {
    multi: [
      { title: "Days between two dates", fields: [{ id: "a", label: "From", t: "date", def: "today" }, { id: "b", label: "To", t: "date", def: "2026-12-25" }, { id: "inc", label: "Count the end date too", t: "chk", def: "" }],
        run: function (v) {
          var a = parseDate(v.a), b = parseDate(v.b); if (!a || !b) return { err: "Choose both dates." };
          var rev = b < a; if (rev) { var t = a; a = b; b = t; }
          var n = Math.round((b - a) / 864e5) + (v.inc ? 1 : 0), end = v.inc ? addDays(b, 1) : b, wd = weekdaysBetween(a, end), ymdv = ymd(a, b);
          return { hero: ["Difference", plural(n, "day"), ymdStr(ymdv)], rows: [["Weeks and days", plural(Math.floor(n / 7), "week") + ", " + plural(n % 7, "day")], ["Months (approx.)", fmt(n / 30.4375, 1)], ["Weekdays (Mon to Fri)", fmtg(wd, 0)], ["Weekend days", fmtg(n - wd, 0)], ["Hours", fmtg(n * 24, 0)]], note: rev ? "The dates were the wrong way round, so they were swapped." : "Holidays are not excluded from the weekday count." };
        } },
      { title: "Add or subtract from a date", fields: [{ id: "s", label: "Start date", t: "date", def: "today" }, { id: "o", label: "Operation", t: "sel", opts: [["+", "Add"], ["-", "Subtract"]], def: "+" }, { id: "y", label: "Years", def: "0" }, { id: "m", label: "Months", def: "0" }, { id: "w", label: "Weeks", def: "0" }, { id: "d", label: "Days", def: "30" }, { id: "bd", label: "Count working days only (Mon to Fri)", t: "chk", def: "" }],
        run: function (v) {
          var s = parseDate(v.s); if (!s) return { err: "Choose a start date." };
          var k = v.o === "-" ? -1 : 1, y = opt(v.y), m = opt(v.m), w = opt(v.w), d = opt(v.d);
          if ([y, m, w, d].some(function (x) { return x !== Math.round(x) || x < 0; }) || y > 500 || m > 6000 || w > 50000 || d > 200000) return { err: "Use whole, positive numbers." };
          var r;
          if (v.bd) { var n = d + w * 5 + (y * 12 + m) * 0, step = k, cur = s, left = d + w * 5; if (y || m) cur = addMonths(s, k * (y * 12 + m)); while (left > 0) { cur = addDays(cur, step); var x = cur.getUTCDay(); if (x !== 0 && x !== 6) left--; } r = cur; }
          else r = addDays(addMonths(s, k * (y * 12 + m)), k * (w * 7 + d));
          return { hero: [v.o === "-" ? "Date before" : "Date after", dstr(r)], rows: [["Start", dstr(s)], ["Days apart", fmtg(Math.round(Math.abs(r - s) / 864e5), 0)], ["Day of the year", String(Math.round((r - new Date(Date.UTC(r.getUTCFullYear(), 0, 0))) / 864e5))]] };
        } },
      { title: "Facts about a date", fields: [{ id: "f", label: "Date", t: "date", def: "today" }],
        run: function (v) {
          var f = parseDate(v.f); if (!f) return { err: "Choose a date." };
          var Y = f.getUTCFullYear(), doy = Math.round((f - new Date(Date.UTC(Y, 0, 0))) / 864e5), th = new Date(f.getTime() + (4 - (f.getUTCDay() || 7)) * 864e5), wk = Math.ceil(((th - new Date(Date.UTC(th.getUTCFullYear(), 0, 1))) / 864e5 + 1) / 7);
          return { hero: ["Day of the week", WD[f.getUTCDay()]], rows: [["Day of the year", doy + " of " + (isLeap(Y) ? 366 : 365)], ["ISO week number", String(wk)], ["Days in the month", String(dim(Y, f.getUTCMonth()))], ["Leap year", isLeap(Y) ? "Yes" : "No"], ["Days left in the year", String((isLeap(Y) ? 366 : 365) - doy)]] };
        } }
    ]
  };

  function hmsStr(sec) { var neg = sec < 0; sec = Math.round(Math.abs(sec)); var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return (neg ? "-" : "") + (d ? d + "d " : "") + pad2(h) + ":" + pad2(m) + ":" + pad2(s); }
  function tf(id, lab) { return { id: id, label: lab, def: "0" }; }
  CALCS.time = {
    multi: [
      { title: "Add or subtract times", fields: [tf("h1", "Hours"), tf("m1", "Minutes"), tf("s1", "Seconds"), { id: "o", label: "Operation", t: "sel", opts: [["+", "Add"], ["-", "Subtract"]], def: "+", wide: true }, { id: "h2", label: "Hours", def: "1" }, tf("m2", "Minutes"), tf("s2", "Seconds")],
        run: function (v) {
          var a = opt(v.h1) * 3600 + opt(v.m1) * 60 + opt(v.s1), b = opt(v.h2) * 3600 + opt(v.m2) * 60 + opt(v.s2), r = v.o === "-" ? a - b : a + b;
          return { hero: ["Result", hmsStr(r)], rows: [["Total hours", fmtg(r / 3600, 4)], ["Total minutes", fmtg(r / 60, 2)], ["Total seconds", fmtg(r, 0)]], note: r < 0 ? "A minus sign means the second time is longer than the first." : null };
        } },
      { title: "Convert a time", fields: [{ id: "v", label: "Amount", def: "90" }, { id: "u", label: "Unit", t: "sel", opts: [["1", "Seconds"], ["60", "Minutes"], ["3600", "Hours"], ["86400", "Days"], ["604800", "Weeks"]], def: "60" }],
        run: function (v) {
          var n = num(v.v); if (isNaN(n)) return { err: "Enter an amount." };
          var s = n * +v.u; return { hero: ["That is", hmsStr(s), "days, hours, minutes and seconds"], rows: [["Seconds", fmtg(s, 4)], ["Minutes", fmtg(s / 60, 4)], ["Hours", fmtg(s / 3600, 4)], ["Days", fmtg(s / 86400, 4)], ["Weeks", fmtg(s / 604800, 4)]] };
        } }
    ]
  };

  function tmin(s) { var m = /^(\d{1,2}):(\d{2})/.exec(s || ""); return m ? +m[1] * 60 + +m[2] : null; }
  function span(s, e) { var a = tmin(s), b = tmin(e); if (a == null || b == null) return null; var d = b - a; return d < 0 ? d + 1440 : d; }
  function hrs(min) { return Math.floor(min / 60) + "h " + pad2(Math.round(min % 60)) + "m"; }
  var DAYS = [["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"], ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"]];
  var tsf = [{ id: "br", label: "Unpaid break each day (minutes)", def: "30" }];
  DAYS.forEach(function (d, i) { tsf.push({ g: "Times worked", id: "s" + d[0], label: d[1] + " start", t: "time", def: i < 5 ? "09:00" : "" }, { g: "Times worked", id: "e" + d[0], label: d[1] + " finish", t: "time", def: i < 5 ? "17:30" : "" }); });
  tsf.push({ g: "Pay and overtime", id: "c", label: "Currency", t: "sel", opts: CUR.opts, def: "£" }, { g: "Pay and overtime", id: "r", label: "Hourly rate", def: "", ph: "Optional" }, { g: "Pay and overtime", id: "ot", label: "Overtime after (hours a week)", def: "40" }, { g: "Pay and overtime", id: "om", label: "Overtime rate", t: "sel", opts: [["1", "Normal rate"], ["1.25", "1.25 times"], ["1.5", "1.5 times"], ["2", "2 times"]], def: "1.5" });
  CALCS.hours = {
    multi: [
      { title: "One shift", fields: [{ id: "s", label: "Start", t: "time", def: "09:00" }, { id: "e", label: "Finish", t: "time", def: "17:30" }, { id: "b", label: "Unpaid break (minutes)", def: "30" }, { id: "c", label: "Currency", t: "sel", opts: CUR.opts, def: "£" }, { id: "r", label: "Hourly rate", def: "", ph: "Optional" }],
        run: function (v) {
          var sp = span(v.s, v.e); if (sp == null) return { err: "Choose a start and finish time." };
          var b = opt(v.b); if (b < 0 || b >= sp) return { err: "The break must be shorter than the shift." };
          var w = sp - b, rows = [["Shift length", hrs(sp)], ["Break", b + " minutes"], ["Decimal hours", fmt(w / 60, 2)]], rate = num(v.r);
          if (rate > 0) rows.push(["Pay for the shift", money(w / 60 * rate, v.c)]);
          return { hero: ["Time worked", hrs(w), fmt(w / 60, 2) + " hours"], rows: rows, note: "If the finish is earlier than the start, the shift is treated as running past midnight." };
        } },
      { title: "Weekly timesheet", fields: tsf,
        run: function (v) {
          var br = opt(v.br), tot = 0, rows = [], days = 0;
          for (var i = 0; i < 7; i++) { var k = DAYS[i][0], s = v["s" + k], e = v["e" + k]; if (!s && !e) continue; var sp = span(s, e); if (sp == null) return { err: "Fill in both the start and finish for " + DAYS[i][1] + ", or clear both." }; if (br >= sp) return { err: "The break is longer than " + DAYS[i][1] + "'s shift." }; var w = sp - br; tot += w; days++; rows.push([DAYS[i][1], hrs(w) + " (" + fmt(w / 60, 2) + ")"]); }
          if (!days) return { err: "Enter at least one day." };
          var ot = Math.max(0, tot - opt(v.ot, 40) * 60), reg = tot - ot, rate = num(v.r), om = +v.om, out = [["Regular hours", fmt(reg / 60, 2)], ["Overtime hours", fmt(ot / 60, 2)]];
          if (rate > 0) { out.push(["Regular pay", money(reg / 60 * rate, v.c)], ["Overtime pay", money(ot / 60 * rate * om, v.c)], ["Total pay", money(reg / 60 * rate + ot / 60 * rate * om, v.c)]); }
          return { hero: ["Hours this week", hrs(tot), fmt(tot / 60, 2) + " hours over " + plural(days, "day")], rows: out, sections: [["Each day", rows]] };
        } }
    ]
  };

  var GP = { "A+": 4, "A": 4, "A-": 3.7, "B+": 3.3, "B": 3, "B-": 2.7, "C+": 2.3, "C": 2, "C-": 1.7, "D+": 1.3, "D": 1, "D-": 0.7, "F": 0 };
  function gpaParse(txt, scale, weighted) {
    var lines = String(txt).split(/\n/).map(function (s) { return s.trim(); }).filter(Boolean), pts = 0, cr = 0, n = 0;
    for (var i = 0; i < lines.length; i++) {
      var t = lines[i].replace(/,/g, " ").split(/\s+/), g = t[0].toUpperCase(), c = num(t[1]), p;
      if (GP.hasOwnProperty(g)) { p = GP[g]; if (g === "A+" && scale === "43") p = 4.3; } else { p = num(g); if (isNaN(p) || p < 0 || p > 5) return { err: "Line " + (i + 1) + ": start with a letter grade such as B+ or a number such as 3.5." }; }
      if (!(c > 0)) return { err: "Line " + (i + 1) + ": add the credits after the grade, for example B+ 3." };
      var x = (t[2] || "").toUpperCase(); if (weighted && p > 0) { if (x === "H" || x === "HONORS" || x === "HONOURS") p += 0.5; else if (x === "AP" || x === "IB") p += 1; }
      pts += p * c; cr += c; n++;
    }
    if (!n) return { err: "Enter at least one course." };
    return { pts: pts, cr: cr, n: n };
  }
  CALCS.gpa = {
    multi: [
      { title: "Work out your GPA", fields: [
        { id: "t", label: "One course per line: grade, credits (and H or AP if weighted)", t: "area", rows: 6, def: "A 3\nB+ 4\nA- 3\nB 2 H", wide: true },
        { id: "sc", label: "Scale", t: "sel", opts: [["40", "4.0 scale (A+ = 4.0)"], ["43", "4.3 scale (A+ = 4.3)"]], def: "40", wide: true },
        { id: "w", label: "Weight honours (+0.5) and AP/IB (+1.0)", t: "chk", def: "" },
        { g: "Earlier results (optional)", id: "pg", label: "GPA so far", def: "", ph: "Optional" }, { g: "Earlier results (optional)", id: "pc", label: "Credits so far", def: "", ph: "Optional" }],
        run: function (v) {
          var r = gpaParse(v.t, v.sc, v.w); if (r.err) return r;
          var g = r.pts / r.cr, rows = [["Courses", String(r.n)], ["Credits this term", fmtg(r.cr, 2)], ["Quality points", fmt(r.pts, 2)]], pg = num(v.pg), pc = num(v.pc);
          var hero = ["This term's GPA", fmt(g, 2)];
          if (pg >= 0 && pc > 0) { var cum = (pg * pc + r.pts) / (pc + r.cr); rows.push(["Cumulative GPA", fmt(cum, 2)], ["Total credits", fmtg(pc + r.cr, 2)]); hero = ["Cumulative GPA", fmt(cum, 2), "This term " + fmt(g, 2)]; }
          return { hero: hero, rows: rows, note: "Schools differ on how they scale grades, so check yours." };
        } },
      { title: "GPA you need", fields: [{ id: "cg", label: "Current GPA", def: "3.2" }, { id: "cc", label: "Credits completed", def: "60" }, { id: "tg", label: "Target GPA", def: "3.5" }, { id: "nc", label: "Credits still to take", def: "60" }],
        run: function (v) {
          var cg = num(v.cg), cc = num(v.cc), tg = num(v.tg), nc = num(v.nc);
          if (isNaN(cg) || !(cc >= 0) || isNaN(tg) || !(nc > 0)) return { err: "Fill in all four boxes." };
          var need = (tg * (cc + nc) - cg * cc) / nc;
          return { hero: ["GPA needed from now", need > 4.3 ? "Out of reach" : fmt(Math.max(need, 0), 2)], rows: [["Total credits at the end", fmtg(cc + nc, 2)], ["Best possible final GPA", fmt((cg * cc + 4 * nc) / (cc + nc), 2)]], warn: need > 4 ? "Even straight A grades would not reach that target." : null };
        } }
    ]
  };

  function letter(p) { return p >= 97 ? "A+" : p >= 93 ? "A" : p >= 90 ? "A-" : p >= 87 ? "B+" : p >= 83 ? "B" : p >= 80 ? "B-" : p >= 77 ? "C+" : p >= 73 ? "C" : p >= 70 ? "C-" : p >= 67 ? "D+" : p >= 63 ? "D" : p >= 60 ? "D-" : "F"; }
  CALCS.grade = {
    multi: [
      { title: "Weighted course grade", fields: [{ id: "t", label: "One item per line: score %, weight %", t: "area", rows: 6, def: "88 20\n92 15\n75 25", wide: true }],
        run: function (v) {
          var L = String(v.t).split(/\n/).map(function (s) { return s.trim(); }).filter(Boolean), sw = 0, tw = 0;
          if (!L.length) return { err: "Enter at least one item." };
          for (var i = 0; i < L.length; i++) { var t = L[i].replace(/%/g, "").split(/[\s,]+/), s = num(t[0]), w = num(t[1]); if (isNaN(s) || !(w > 0) || s < 0) return { err: "Line " + (i + 1) + ": enter a score then a weight, for example 85 30." }; sw += s * w; tw += w; }
          var cur = sw / tw, rows = [["Weight counted so far", fmtg(tw, 2) + "%"]];
          if (tw < 100) rows.push(["Best case if the rest is 100%", fmt((sw + 100 * (100 - tw)) / 100, 2) + "%"], ["Worst case if the rest is 0%", fmt(sw / 100, 2) + "%"]);
          if (tw > 100) return { err: "The weights add up to " + fmtg(tw, 2) + "%. They should be 100% or less." };
          return { hero: ["Grade so far", fmt(cur, 2) + "%", letter(cur)], rows: rows, note: "The letter uses a common scale (90 A, 80 B, 70 C, 60 D). Your school may differ." };
        } },
      { title: "Grade needed in the final", fields: [{ id: "cg", label: "Current grade (%)", def: "82" }, { id: "w", label: "Final exam weight (%)", def: "30" }, { id: "tg", label: "Grade you want (%)", def: "85" }],
        run: function (v) {
          var cg = num(v.cg), w = num(v.w), tg = num(v.tg);
          if (isNaN(cg) || !(w > 0 && w <= 100) || isNaN(tg)) return { err: "Enter your grade, the final's weight (1 to 100) and your target." };
          var need = (tg - cg * (1 - w / 100)) / (w / 100);
          var rows = [90, 80, 70, 60].map(function (t) { var n = (t - cg * (1 - w / 100)) / (w / 100); return [t + "% (" + letter(t) + ")", n <= 0 ? "Already secured" : n > 100 ? "Not possible" : fmt(n, 1) + "%"]; });
          return { hero: ["Score needed on the final", need <= 0 ? "Already there" : fmt(need, 1) + "%"], rows: rows, warn: need > 100 ? "You would need more than 100%, so that target is out of reach." : null };
        } },
      { title: "Points to percentage", fields: [{ id: "e", label: "Points earned", def: "43" }, { id: "p", label: "Points possible", def: "50" }],
        run: function (v) { var e = num(v.e), p = num(v.p); if (isNaN(e) || !(p > 0) || e < 0) return { err: "Enter the points earned and the total." }; var x = e / p * 100; return { hero: ["Percentage", fmt(x, 2) + "%", letter(x)], rows: [["Points missed", fmtg(p - e, 2)]] }; } }
    ]
  };

  var FUEL = { uk: ["Miles and UK mpg", "miles", "UK mpg", "Fuel price (pence per litre)", 145, 35], us: ["Miles and US mpg", "miles", "US mpg", "Fuel price (per US gallon)", 3.5, 28], met: ["Kilometres and L/100 km", "kilometres", "L/100 km", "Fuel price (per litre)", 1.6, 7.5] };
  CALCS["fuel-cost"] = {
    fields: [{ id: "sy", label: "Units", t: "sel", opts: [["uk", FUEL.uk[0]], ["us", FUEL.us[0]], ["met", FUEL.met[0]]], def: "uk", wide: true },
      { id: "d", label: function (v) { return "Trip distance (" + FUEL[v.sy][1] + ")"; }, def: "120" },
      { id: "e", label: function (v) { return "Fuel economy (" + FUEL[v.sy][2] + ")"; }, def: "40" },
      { id: "p", label: function (v) { return FUEL[v.sy][3]; }, def: "145" },
      { id: "c", label: "Currency", t: "sel", opts: CUR.opts, def: "£" },
      { g: "Trip details", id: "rt", label: "Return trip", t: "chk", def: "" }, { g: "Trip details", id: "np", label: "People sharing the cost", def: "1" }, { g: "Trip details", id: "tr", label: "Tolls and parking", def: "0" }, { g: "Trip details", id: "n", label: "Number of trips", def: "1" },
      { g: "Fuel and range", id: "ft", label: "Fuel type", t: "sel", opts: [["2.31", "Petrol"], ["2.68", "Diesel"]], def: "2.31" }, { g: "Fuel and range", id: "tk", label: "Tank size (litres, optional)", def: "", ph: "Optional" }],
    run: function (v) {
      var sy = v.sy, d = num(v.d), e = num(v.e), p = num(v.p), tr = opt(v.tr), np = opt(v.np, 1), n = opt(v.n, 1);
      if (!(d > 0) || !(e > 0) || isNaN(p) || p < 0) return { err: "Enter the distance, fuel economy and fuel price." };
      if (np < 1 || np !== Math.round(np) || n < 1) return { err: "People and trips must be whole numbers of 1 or more." };
      var dist = d * (v.rt ? 2 : 1) * n, litres, cost, unit;
      if (sy === "uk") { litres = dist / e * 4.54609; cost = litres * p / 100; }
      else if (sy === "us") { var g = dist / e; litres = g * 3.785411784; cost = g * p; }
      else { litres = dist * e / 100; cost = litres * p; }
      var total = cost + tr * n * (v.rt ? 1 : 1), co2 = litres * +v.ft, km = sy === "met" ? dist : dist * 1.609344, rows = [["Distance", fmtg(dist, 1) + " " + FUEL[sy][1]], [sy === "us" ? "Fuel used" : "Fuel used", sy === "us" ? fmt(litres / 3.785411784, 2) + " US gallons (" + fmt(litres, 1) + " litres)" : fmt(litres, 1) + " litres"], ["Fuel cost", money(cost, v.c)], ["Tolls and parking", money(tr * n, v.c)], ["Cost per " + (sy === "met" ? "km" : "mile"), money(total / dist, v.c)]];
      if (np > 1) rows.push(["Cost per person", money(total / np, v.c)]);
      rows.push(["CO₂ emitted", fmt(co2, 1) + " kg"]);
      var tk = num(v.tk); if (tk > 0) rows.push(["Range on a full tank", fmtg(Math.round(km / litres * tk), 0) + " km · " + fmtg(Math.round(km / litres * tk / 1.609344), 0) + " miles"]);
      return { hero: ["Trip cost", money(total, v.c), np > 1 ? money(total / np, v.c) + " each" : null], rows: rows, note: "Assumes steady driving at your stated fuel economy. Real figures vary with speed, load and traffic." };
    }
  };

  CALCS["speed-distance-time"] = {
    fields: [{ id: "k", label: "Work out", t: "sel", opts: [["spd", "Speed"], ["dist", "Distance"], ["time", "Time"]], def: "spd" }, { id: "u", label: "Units", t: "sel", opts: [["m", "Miles and mph"], ["k", "Kilometres and km/h"]], def: "m", wide: true },
      { id: "d", label: "Distance", def: "150", show: function (v) { return v.k !== "dist"; } }, { id: "s", label: "Speed", def: "60", show: function (v) { return v.k !== "spd"; } },
      { id: "h", label: "Hours", def: "2", show: function (v) { return v.k !== "time"; } }, { id: "mi", label: "Minutes", def: "30", show: function (v) { return v.k !== "time"; } }, { id: "se", label: "Seconds", def: "0", show: function (v) { return v.k !== "time"; } },
      { g: "Arrival time (optional)", id: "dep", label: "Leave at", t: "time", def: "" }],
    run: function (v) {
      var d = num(v.d), s = num(v.s), t = opt(v.h) * 3600 + opt(v.mi) * 60 + opt(v.se), un = v.u === "m" ? "mi" : "km";
      if (v.k === "spd") { if (!(d > 0) || !(t > 0)) return { err: "Enter a distance and a time." }; s = d / (t / 3600); }
      else if (v.k === "dist") { if (!(s > 0) || !(t > 0)) return { err: "Enter a speed and a time." }; d = s * t / 3600; }
      else { if (!(d > 0) || !(s > 0)) return { err: "Enter a distance and a speed." }; t = d / s * 3600; }
      var kmh = v.u === "m" ? s * 1.609344 : s, rows = [["Distance", fmtg(+d.toFixed(3), 3) + " " + un], ["Speed", fmt(s, 2) + (v.u === "m" ? " mph" : " km/h")], ["Time", hmsStr(t)], ["Speed in km/h", fmt(kmh, 2)], ["Speed in mph", fmt(kmh / 1.609344, 2)], ["Speed in m/s", fmt(kmh / 3.6, 2)], ["Speed in knots", fmt(kmh / 1.852, 2)], ["Pace per " + un, hmsStr(t / d)]];
      var dm = tmin(v.dep); if (dm != null) { var arr = Math.round(dm + t / 60), day = Math.floor(arr / 1440); rows.push(["Arrive at", pad2(Math.floor(arr % 1440 / 60)) + ":" + pad2(arr % 60) + (day ? " (+" + day + (day === 1 ? " day)" : " days)") : "")]); }
      return { hero: [v.k === "spd" ? "Speed" : v.k === "dist" ? "Distance" : "Time", v.k === "spd" ? fmt(s, 2) + (v.u === "m" ? " mph" : " km/h") : v.k === "dist" ? fmtg(+d.toFixed(3), 3) + " " + un : hmsStr(t)], rows: rows };
    }
  };

  CALCS.concrete = {
    fields: [{ id: "sh", label: "Shape", t: "sel", opts: [["rect", "Slab, path or footing"], ["round", "Round slab or column"]], def: "rect", wide: true }, { id: "u", label: "Units", t: "sel", opts: [["m", "Metric (m, cm)"], ["i", "Imperial (ft, in)"]], def: "m", wide: true },
      { id: "l", label: function (v) { return "Length (" + (v.u === "i" ? "ft" : "m") + ")"; }, def: "4", show: function (v) { return v.sh === "rect"; } }, { id: "w", label: function (v) { return "Width (" + (v.u === "i" ? "ft" : "m") + ")"; }, def: "3", show: function (v) { return v.sh === "rect"; } },
      { id: "dm", label: function (v) { return "Diameter (" + (v.u === "i" ? "ft" : "m") + ")"; }, def: "2", show: function (v) { return v.sh === "round"; } },
      { id: "t", label: function (v) { return "Thickness or depth (" + (v.u === "i" ? "in" : "cm") + ")"; }, def: "10" }, { id: "q", label: "How many", def: "1" },
      { g: "Allowances and mix", id: "ws", label: "Extra for waste and spillage (%)", def: "10" }, { g: "Allowances and mix", id: "mx", label: "Mix (cement : sand : gravel)", t: "sel", opts: [["1:2:4", "1 : 2 : 4 general use"], ["1:1.5:3", "1 : 1.5 : 3 strong"], ["1:3:6", "1 : 3 : 6 light duty"]], def: "1:2:4" },
      { g: "Allowances and mix", id: "pr", label: function (v) { return "Price per " + (v.u === "i" ? "cubic yard" : "cubic metre") + " (optional)"; }, def: "", ph: "Optional" }, { g: "Allowances and mix", id: "c", label: "Currency", t: "sel", opts: CUR.opts, def: "£" }],
    run: function (v) {
      var im = v.u === "i", q = opt(v.q, 1), ws = opt(v.ws), t = num(v.t), area;
      if (!(t > 0) || !(q >= 1) || ws < 0) return { err: "Enter the thickness, how many, and a waste allowance of 0 or more." };
      if (v.sh === "rect") { var l = num(v.l), w = num(v.w); if (!(l > 0) || !(w > 0)) return { err: "Enter the length and width." }; area = l * w; }
      else { var d = num(v.dm); if (!(d > 0)) return { err: "Enter the diameter." }; area = Math.PI * d * d / 4; }
      var m3 = im ? area * 0.09290304 * t * 0.0254 : area * t / 100; m3 *= q;
      var tot = m3 * (1 + ws / 100), yd = tot / 0.764554858, ft3 = tot * 35.3146667, sp = v.mx.split(":").map(Number), parts = sp[0] + sp[1] + sp[2], dry = tot * 1.54;
      var cem = dry * sp[0] / parts * 1440, san = dry * sp[1] / parts * 1600, gra = dry * sp[2] / parts * 1500, KG = 2.20462262;
      var rows = [["Volume needed", fmt(tot, 3) + " m³ · " + fmt(yd, 2) + " yd³ · " + fmt(ft3, 1) + " ft³"], ["Without the extra allowance", fmt(m3, 3) + " m³"]];
      var mat = im ? [["Cement", fmtg(Math.ceil(cem * KG), 0) + " lb · " + Math.ceil(cem * KG / 94) + " bags (94 lb)"], ["Sand", fmtg(Math.ceil(san * KG), 0) + " lb"], ["Gravel", fmtg(Math.ceil(gra * KG), 0) + " lb"]] : [["Cement", fmtg(Math.ceil(cem), 0) + " kg · " + Math.ceil(cem / 25) + " bags (25 kg)"], ["Sand", fmtg(Math.ceil(san), 0) + " kg"], ["Gravel", fmtg(Math.ceil(gra), 0) + " kg"]];
      var bags = [["40 lb bag (0.30 ft³)", 0.30], ["60 lb bag (0.45 ft³)", 0.45], ["80 lb bag (0.60 ft³)", 0.60]].map(function (b) { return [b[0], String(Math.ceil(ft3 / b[1])) + " bags"]; });
      var pr = num(v.pr), tr = [];
      if (pr > 0) rows.push(["Ready-mix cost", money(im ? yd * pr : tot * pr, v.c)]);
      return { hero: ["Concrete needed", im ? fmt(yd, 2) + " cubic yards" : fmt(tot, 2) + " cubic metres", im ? fmt(ft3, 1) + " cubic feet" : fmt(yd, 2) + " cubic yards"], rows: rows, sections: [["Mixing it yourself, by weight", mat], ["Bagged premix", bags]],
        note: "Dry volume is taken as 1.54 times the wet volume. Order a little extra, as uneven ground uses more." };
    }
  };

  function ip4(s) { var m = /^\s*(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\s*$/.exec(s || ""); if (!m) return null; var a = m.slice(1).map(Number); if (a.some(function (x) { return x > 255; })) return null; return ((a[0] * 16777216) + (a[1] << 16) + (a[2] << 8) + a[3]) >>> 0; }
  function ipS(n) { return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join("."); }
  function ipB(n) { return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].map(function (x) { return ("00000000" + x.toString(2)).slice(-8); }).join("."); }
  function maskOf(p) { return p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0; }
  CALCS.subnet = {
    fields: [{ id: "ip", label: "IP address", def: "192.168.1.130" }, { id: "m", label: "Prefix or mask", def: "24", hint: "For example 24, /24 or 255.255.255.0" },
      { g: "Split into smaller subnets", id: "sp", label: "New prefix length", def: "", ph: "e.g. 26" }],
    run: function (v) {
      var ip = ip4(v.ip); if (ip == null) return { err: "Enter an IPv4 address such as 192.168.1.10." };
      var ms = String(v.m || "").trim().replace(/^\//, ""), p;
      if (/^\d{1,2}$/.test(ms)) { p = +ms; if (p > 32) return { err: "A prefix must be between 0 and 32." }; }
      else { var mk = ip4(ms); if (mk == null) return { err: "Enter a prefix like 24 or a mask like 255.255.255.0." }; var b = mk.toString(2).padStart(32, "0"); if (!/^1*0*$/.test(b)) return { err: "That is not a valid subnet mask." }; p = b.indexOf("0") < 0 ? 32 : b.indexOf("0"); }
      var mask = maskOf(p), net = (ip & mask) >>> 0, wild = (~mask) >>> 0, bc = (net | wild) >>> 0, total = Math.pow(2, 32 - p), usable = p >= 31 ? (p === 31 ? 2 : 1) : total - 2;
      var first = p >= 31 ? net : net + 1, last = p >= 31 ? bc : bc - 1, a = ip >>> 24, cls = a < 128 ? "A" : a < 192 ? "B" : a < 224 ? "C" : a < 240 ? "D (multicast)" : "E (reserved)";
      var priv = (a === 10) || (a === 172 && ((ip >>> 16) & 255) >= 16 && ((ip >>> 16) & 255) <= 31) || (a === 192 && ((ip >>> 16) & 255) === 168), kind = a === 127 ? "Loopback" : (a === 169 && ((ip >>> 16) & 255) === 254) ? "Link-local" : priv ? "Private" : "Public";
      var rows = [["Network address", ipS(net) + "/" + p], ["Subnet mask", ipS(mask)], ["Wildcard mask", ipS(wild)], ["Broadcast address", ipS(bc)], ["First host", ipS(first)], ["Last host", ipS(last)], ["Total addresses", fmtg(total, 0)], ["Class", cls], ["Type", kind], ["Mask in binary", ipB(mask)], ["Address in binary", ipB(ip)]];
      var tables = [], sp = String(v.sp || "").trim().replace(/^\//, "");
      if (sp !== "") { var np = +sp; if (!/^\d{1,2}$/.test(sp) || np <= p || np > 32) return { err: "The new prefix must be larger than /" + p + " and no more than 32." };
        var cnt = Math.pow(2, np - p), sz = Math.pow(2, 32 - np), lim = Math.min(cnt, 64), rr = [];
        for (var i = 0; i < lim; i++) { var n0 = net + i * sz, b0 = n0 + sz - 1; rr.push([ipS(n0) + "/" + np, np >= 31 ? ipS(n0) + " to " + ipS(b0) : ipS(n0 + 1) + " to " + ipS(b0 - 1), ipS(b0)]); }
        tables.push({ title: fmtg(cnt, 0) + " subnets of /" + np + (cnt > lim ? " (first " + lim + " shown)" : ""), head: ["Network", "Hosts", "Broadcast"], rows: rr, tall: true }); }
      return { hero: ["Usable hosts", fmtg(usable, 0), ipS(net) + "/" + p], rows: rows, tables: tables };
    }
  };

  var WORDS = "able acid aged also area army away baby back ball band bank base bath bear beat bell belt bend best bike bird blue boat body bold bone book boot born boss both bowl bulb burn busy cafe cake calm came camp card care cart case cash cast cave chat chef chip city clay clip club coal coat code coin cold come cook cool cope copy cord core corn cost crew crop dark data dawn deal deer desk dial dice diet dish dive dock door dove down draw drop drum duck dust duty each earn east easy edge else even ever face fact fair fall farm fast fear feed feel fern file fill film find fine fire fish five flag flat flow foam fold folk food foot form fork four free frog fuel full fund gain game gate gear gift girl give glad glow goal goat gold golf good grab gray grew grid grin grow gulf hair half hall hand hard harp hawk head heat help herb hero hill hold hole home hood hope horn host hour hunt idea inch iron isle jade jazz join joke jump jury just keen keep kind king kite knee knot lake lamp land lane last lawn leaf lean left lend lens life lift lime line link lion list live load loaf lock loft long look loop lord loud love luck lung made mail main make mall many maps mark mask mass meal meat melt menu mild mile milk mill mind mint miss mode moon more moss most move much must myth nail name navy near neat neck nest news next nice nine node noon norm nose note oats oven pace pack page pair palm park part past path peak pear pine pink pipe plan play plot plum poem pond pool port post pour pure quiz race rack rain rank rare read real reed rest rice rich ride ring rise road rock roof room root rope rose ruby rule sack safe sail salt sand seal seed sell shed ship shop show silk sing sink site size skip slow snow soap soft soil sold song soup spin star stay stem step stop swim tail tale tank tape task team tent text thin tide tile time tiny tire toad tone tool town tree trip true tube tune turn twin unit vase vest view vine void wade wake walk wall warm wave weld west whip wide wild wind wing wire wise wolf wood wool word work yard yarn year zero zone zoom".split(" ");
  var SIM = /[Il1O0o]/g, SYMS = "!@#$%^&*()-_=+[]{};:,.?";
  function pickFrom(s) { return s.charAt(rnd(s.length)); }
  function genPw(v) {
    var mode = v.md, len = Math.max(4, Math.min(128, Math.round(opt(v.len, 16))));
    if (mode === "pin") { var p = ""; for (var i = 0; i < Math.min(len, 12); i++) p += rnd(10); return { s: p, bits: Math.min(len, 12) * Math.log2(10) }; }
    if (mode === "phrase") {
      var n = Math.max(3, Math.min(10, Math.round(opt(v.wn, 4)))), sep = v.sep === "space" ? " " : v.sep === "none" ? "" : v.sep === "dot" ? "." : "-", w = [];
      for (var j = 0; j < n; j++) { var x = WORDS[rnd(WORDS.length)]; w.push(v.cap ? x.charAt(0).toUpperCase() + x.slice(1) : x); }
      var s = w.join(sep), bits = n * Math.log2(WORDS.length); if (v.num) { s += sep + rnd(100); bits += Math.log2(100); }
      return { s: s, bits: bits };
    }
    var cls = []; if (v.lo) cls.push("abcdefghijklmnopqrstuvwxyz"); if (v.up) cls.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ"); if (v.di) cls.push("0123456789"); if (v.sy) cls.push(SYMS);
    if (v.ns) cls = cls.map(function (c) { return c.replace(SIM, ""); });
    if (!cls.length) return null;
    var all = cls.join(""), out = [];
    if (len >= cls.length) cls.forEach(function (c) { out.push(pickFrom(c)); });
    while (out.length < len) out.push(pickFrom(all));
    for (var k = out.length - 1; k > 0; k--) { var r = rnd(k + 1), tmp = out[k]; out[k] = out[r]; out[r] = tmp; }
    return { s: out.join(""), bits: len * Math.log2(all.length) };
  }
  CALCS.password = {
    again: "Generate new",
    fields: [{ id: "md", label: "Type", t: "sel", opts: [["rand", "Random characters"], ["phrase", "Passphrase of words"], ["pin", "Numeric PIN"]], def: "rand", wide: true },
      { id: "len", label: "Length", def: "16", show: function (v) { return v.md !== "phrase"; } }, { id: "wn", label: "Number of words", def: "6", show: function (v) { return v.md === "phrase"; } }, { id: "ct", label: "How many", def: "5" },
      { g: "Characters", id: "lo", label: "Lowercase a-z", t: "chk", def: "1", show: function (v) { return v.md === "rand"; } }, { g: "Characters", id: "up", label: "Uppercase A-Z", t: "chk", def: "1", show: function (v) { return v.md === "rand"; } }, { g: "Characters", id: "di", label: "Numbers 0-9", t: "chk", def: "1", show: function (v) { return v.md === "rand"; } }, { g: "Characters", id: "sy", label: "Symbols", t: "chk", def: "1", show: function (v) { return v.md === "rand"; } }, { g: "Characters", id: "ns", label: "Leave out look-alikes (I l 1 O 0 o)", t: "chk", def: "", show: function (v) { return v.md === "rand"; } },
      { g: "Passphrase options", id: "sep", label: "Separator", t: "sel", opts: [["dash", "Dash"], ["space", "Space"], ["dot", "Dot"], ["none", "None"]], def: "dash", show: function (v) { return v.md === "phrase"; } }, { g: "Passphrase options", id: "cap", label: "Capitalise each word", t: "chk", def: "1", show: function (v) { return v.md === "phrase"; } }, { g: "Passphrase options", id: "num", label: "Add a number on the end", t: "chk", def: "", show: function (v) { return v.md === "phrase"; } }],
    run: function (v) {
      var ct = Math.max(1, Math.min(20, Math.round(opt(v.ct, 5)))), L = [], f;
      if (v.md === "rand" && !(v.lo || v.up || v.di || v.sy)) return { err: "Tick at least one kind of character." };
      for (var i = 0; i < ct; i++) { f = genPw(v); if (!f) return { err: "Tick at least one kind of character." }; L.push(f); }
      var bits = L[0].bits, st = bits < 40 ? "Weak" : bits < 60 ? "Fair" : bits < 80 ? "Good" : bits < 110 ? "Strong" : "Very strong";
      return { hero: ["Your password", L[0].s, st + " · about " + Math.round(bits) + " bits"], rows: L.slice(1).map(function (x, i) { return ["Option " + (i + 2), x.s]; }), mono: true, note: "Made in your browser with secure random numbers. It is never sent anywhere or saved." };
    }
  };


  /* ================= MORE CALCULATORS: building, weather, electronics, web, vehicles ================= */
  var LEN = { ft: 0.3048, "in": 0.0254, yd: 0.9144, m: 1, cm: 0.01, mm: 0.001 };
  var LENOPT = [["ft", "Feet"], ["in", "Inches"], ["yd", "Yards"], ["m", "Metres"], ["cm", "Centimetres"]];
  function oh(v, d) { var a = Math.abs(v); return a >= 1e9 ? fmtg(v / 1e9, d) + " GΩ" : a >= 1e6 ? fmtg(v / 1e6, d) + " MΩ" : a >= 1e3 ? fmtg(v / 1e3, d) + " kΩ" : fmtg(v, d) + " Ω"; }
  function areaRows(m2) { return [["Square feet", fmtg(+(m2 / 0.09290304).toPrecision(8), 3)], ["Square yards", fmtg(+(m2 / 0.83612736).toPrecision(8), 3)], ["Square inches", fmtg(+(m2 / 0.00064516).toPrecision(8), 1)], ["Square metres", fmtg(+m2.toPrecision(8), 3)], ["Square centimetres", fmtg(+(m2 * 1e4).toPrecision(8), 1)], ["Acres", fmtg(+(m2 / 4046.8564224).toPrecision(6), 5)], ["Hectares", fmtg(+(m2 / 1e4).toPrecision(6), 5)]]; }

  CALCS["square-footage"] = {
    fields: [{ id: "sh", label: "Shape", t: "sel", opts: [["rect", "Rectangle or square"], ["tri", "Triangle"], ["circ", "Circle"]], def: "rect" }, { id: "u", label: "Measured in", t: "sel", opts: LENOPT, def: "ft" },
      { id: "l", label: function (v) { return v.sh === "tri" ? "Base" : v.sh === "circ" ? "Diameter" : "Length"; }, def: "12" }, { id: "w", label: function (v) { return v.sh === "tri" ? "Height" : "Width"; }, def: "10", show: function (v) { return v.sh !== "circ"; } },
      { id: "q", label: "How many of this shape", def: "1" },
      { g: "Cost (optional)", id: "c", label: "Currency", t: "sel", opts: CUR.opts, def: "£" }, { g: "Cost (optional)", id: "p", label: "Price per square foot", def: "", ph: "Optional" }],
    run: function (v) {
      var l = num(v.l), w = num(v.w), q = opt(v.q, 1), k = LEN[v.u];
      if (!(l > 0) || (v.sh !== "circ" && !(w > 0)) || !(q > 0)) return { err: "Enter the measurements as numbers above zero." };
      var a = (v.sh === "rect" ? l * w : v.sh === "tri" ? l * w / 2 : Math.PI * l * l / 4) * k * k * q, ft2 = a / 0.09290304, rows = areaRows(a).slice(1), p = num(v.p);
      if (p > 0) rows.unshift(["Cost at " + money(p, v.c) + " per sq ft", money(ft2 * p, v.c)]);
      return { hero: ["Area", fmtg(+ft2.toPrecision(8), 2) + " sq ft", fmtg(+a.toPrecision(8), 2) + " m²"], rows: rows };
    }
  };

  CALCS.stair = {
    fields: [{ id: "u", label: "Units", t: "sel", opts: [["i", "Inches"], ["c", "Centimetres"]], def: "i" }, { id: "rise", label: "Total rise (floor to floor)", def: "108" },
      { g: "Step sizes", id: "rs", label: "Ideal riser height", def: "7.5" }, { g: "Step sizes", id: "tr", label: "Tread depth", def: "10" }, { g: "Step sizes", id: "wd", label: "Stair width", def: "36" }],
    run: function (v) {
      var im = v.u === "i", rise = num(v.rise), rs = num(v.rs), tr = num(v.tr), wd = opt(v.wd);
      if (!(rise > 0) || !(rs > 0) || !(tr > 0)) return { err: "Enter the total rise, riser height and tread depth." };
      var n = Math.max(1, Math.round(rise / rs)), r = rise / n, run = (n - 1) * tr, len = Math.sqrt(rise * rise + run * run), ang = Math.atan2(rise, run) * 180 / Math.PI, bl = 2 * r + tr, lo = im ? 24 : 61, hi = im ? 25.5 : 65, u = im ? " in" : " cm";
      var rows = [["Number of risers", String(n)], ["Number of treads", String(n - 1)], ["Actual riser height", fmt(r, 2) + u], ["Tread depth", fmt(tr, 2) + u], ["Total run", fmt(run, 1) + u], ["Stringer length", fmt(len, 1) + u], ["Angle", fmt(ang, 1) + "°"]];
      if (wd > 0) rows.push(["Stair width", fmt(wd, 1) + u]);
      var warn = ang > 42 ? "That is a steep staircase. Most building rules allow around 42° at most." : (r > (im ? 7.75 : 19.7) ? "The riser is taller than many building codes allow. Choose a smaller ideal riser." : null);
      rows.push(["Comfort check (2 × riser + tread)", fmt(bl, 1) + u + (bl >= lo && bl <= hi ? " · comfortable" : " · outside " + lo + " to " + hi)]);
      return { hero: ["Stair steps", n + " risers of " + fmt(r, 2) + u, (n - 1) + " treads of " + fmt(tr, 2) + u], warn: warn, rows: rows, note: "Check your local building regulations for maximum riser, minimum tread and headroom." };
    }
  };

  CALCS.roofing = {
    fields: [{ id: "u", label: "Units", t: "sel", opts: [["f", "Feet"], ["m", "Metres"]], def: "f" }, { id: "l", label: "Building length", def: "40" }, { id: "w", label: "Building width", def: "26" }, { id: "o", label: "Overhang each side", def: "1" },
      { id: "pm", label: "Pitch given as", t: "sel", opts: [["r", "Rise in 12"], ["d", "Degrees"]], def: "r" }, { id: "p", label: function (v) { return v.pm === "d" ? "Pitch (degrees)" : "Pitch (rise in 12)"; }, def: "6" },
      { g: "Allowances", id: "ws", label: "Waste allowance (%)", def: "10" }, { g: "Allowances", id: "bp", label: "Bundles per square", def: "3" }],
    run: function (v) {
      var l = num(v.l), w = num(v.w), o = opt(v.o), p = num(v.p), ws = opt(v.ws), bp = opt(v.bp, 3), f = v.u === "m" ? 3.280839895 : 1;
      if (!(l > 0) || !(w > 0) || !(p > 0) || o < 0 || ws < 0) return { err: "Enter the building size and the roof pitch." };
      if (v.pm === "d" && p >= 80) return { err: "Enter a pitch under 80 degrees." };
      var slope = v.pm === "d" ? 1 / Math.cos(p * Math.PI / 180) : Math.sqrt(1 + Math.pow(p / 12, 2)), L = (l + 2 * o) * f, W = (w + 2 * o) * f, flat = L * W, area = flat * slope, tot = area * (1 + ws / 100), sq = tot / 100, raf = (W / 2) * slope;
      var deg = v.pm === "d" ? p : Math.atan(p / 12) * 180 / Math.PI;
      return { hero: ["Roof area", fmtg(Math.round(area), 0) + " sq ft", fmtg(+(area * 0.09290304).toFixed(1), 1) + " m²"], rows: [["Roof angle", fmt(deg, 1) + "°"], ["Slope factor", fmt(slope, 3)], ["Footprint with overhang", fmtg(Math.round(flat), 0) + " sq ft"], ["Area with " + ws + "% waste", fmtg(Math.round(tot), 0) + " sq ft"], ["Roofing squares to order", fmt(sq, 1)], ["Shingle bundles", fmtg(Math.ceil(sq * bp), 0)], ["Rafter length (gable, per side)", fmt(raf, 1) + " ft"]],
        note: "Based on a simple gable or hip roof of the same pitch. Dormers, valleys and cut-outs change the total, so ask your roofer to confirm." };
    }
  };

  CALCS.tile = {
    fields: [{ id: "u", label: "Units", t: "sel", opts: [["m", "Metric (m, cm, mm)"], ["i", "Imperial (ft, in)"]], def: "m", wide: true },
      { id: "l", label: function (v) { return "Area length (" + (v.u === "i" ? "ft" : "m") + ")"; }, def: "4" }, { id: "w", label: function (v) { return "Area width (" + (v.u === "i" ? "ft" : "m") + ")"; }, def: "3" },
      { id: "tl", label: function (v) { return "Tile length (" + (v.u === "i" ? "in" : "cm") + ")"; }, def: "30" }, { id: "tw", label: function (v) { return "Tile width (" + (v.u === "i" ? "in" : "cm") + ")"; }, def: "30" },
      { g: "Grout, waste and cost", id: "gr", label: function (v) { return "Grout joint (" + (v.u === "i" ? "in" : "mm") + ")"; }, def: "3" }, { g: "Grout, waste and cost", id: "ws", label: "Waste allowance (%)", def: "10" }, { g: "Grout, waste and cost", id: "pb", label: "Tiles per box (optional)", def: "", ph: "Optional" },
      { g: "Grout, waste and cost", id: "c", label: "Currency", t: "sel", opts: CUR.opts, def: "£" }, { g: "Grout, waste and cost", id: "pt", label: "Price per tile (optional)", def: "", ph: "Optional" }],
    run: function (v) {
      var im = v.u === "i", l = num(v.l), w = num(v.w), tl = num(v.tl), tw = num(v.tw), g = opt(v.gr), ws = opt(v.ws), pb = num(v.pb), pt = num(v.pt);
      if (!(l > 0) || !(w > 0) || !(tl > 0) || !(tw > 0) || g < 0 || ws < 0) return { err: "Enter the area and tile sizes as numbers above zero." };
      var A = im ? l * w * 144 : l * w * 1e4, gg = im ? g : g / 10, one = (tl + gg) * (tw + gg), net = Math.ceil(A / one), tot = Math.ceil(net * (1 + ws / 100)), rows = [["Area", im ? fmt(l * w, 2) + " sq ft" : fmt(l * w, 2) + " m²"], ["Tiles with no waste", fmtg(net, 0)], ["Tiles with " + ws + "% waste", fmtg(tot, 0)]];
      if (pb > 0) rows.push(["Boxes to buy", fmtg(Math.ceil(tot / pb), 0)]);
      if (pt > 0) rows.push(["Cost of tiles", money((pb > 0 ? Math.ceil(tot / pb) * pb : tot) * pt, v.c)]);
      return { hero: ["Tiles to buy", fmtg(tot, 0)], rows: rows, note: "Allow 10% extra for cuts and breakages, and 15% for diagonal or complex layouts." };
    }
  };

  function volSpec(kind) {
    var gravel = kind === "gravel";
    return { fields: [{ id: "sh", label: "Shape", t: "sel", opts: [["rect", "Rectangle"], ["circ", "Circle"]], def: "rect" }, { id: "u", label: "Units", t: "sel", opts: [["i", "Feet and inches"], ["m", "Metres and cm"]], def: "i" },
      { id: "l", label: function (v) { return (v.sh === "circ" ? "Diameter (" : "Length (") + (v.u === "i" ? "ft)" : "m)"); }, def: "10" }, { id: "w", label: function (v) { return "Width (" + (v.u === "i" ? "ft)" : "m)"); }, def: "8", show: function (v) { return v.sh === "rect"; } },
      { id: "d", label: function (v) { return "Depth (" + (v.u === "i" ? "in)" : "cm)"); }, def: gravel ? "3" : "2" },
      { g: "Material and cost", id: "mt", label: "Material", t: "sel", opts: gravel ? [["1.68", "Gravel"], ["1.6", "Crushed stone"], ["1.6", "Sand"], ["1.3", "Topsoil"]] : [["0.4", "Mulch or bark"]], def: gravel ? "1.68" : "0.4", wide: true },
      { g: "Material and cost", id: "ws", label: "Extra for settling (%)", def: "10" }, { g: "Material and cost", id: "c", label: "Currency", t: "sel", opts: CUR.opts, def: "£" }, { g: "Material and cost", id: "pr", label: function (v) { return "Price per " + (v.u === "i" ? "cubic yard" : "cubic metre") + " (optional)"; }, def: "", ph: "Optional" }],
      run: function (v) {
        var im = v.u === "i", l = num(v.l), w = num(v.w), d = num(v.d), ws = opt(v.ws), pr = num(v.pr), dens = +v.mt;
        if (!(l > 0) || (v.sh === "rect" && !(w > 0)) || !(d > 0) || ws < 0) return { err: "Enter the size and depth as numbers above zero." };
        var A = (v.sh === "rect" ? l * w : Math.PI * l * l / 4) * (im ? 0.09290304 : 1), m3 = A * d * (im ? 0.0254 : 0.01), tot = m3 * (1 + ws / 100), yd = tot / 0.764554858, ft3 = tot * 35.3146667, tn = tot * dens;
        var rows = [["Volume", fmt(tot, 2) + " m³ · " + fmt(yd, 2) + " yd³ · " + fmt(ft3, 1) + " ft³"], ["Area covered", fmt(A / 0.09290304, 1) + " sq ft · " + fmt(A, 1) + " m²"]];
        if (gravel) rows.push(["Weight", fmt(tn, 2) + " tonnes · " + fmt(tn * 1.10231, 2) + " US tons"]);
        else rows.push(["2 cu ft bags", fmtg(Math.ceil(ft3 / 2), 0)], ["50 litre bags", fmtg(Math.ceil(tot * 1000 / 50), 0)]);
        if (pr > 0) rows.push(["Cost", money((im ? yd : tot) * pr, v.c)]);
        return { hero: [(gravel ? "Material needed" : "Mulch needed"), im ? fmt(yd, 2) + " cubic yards" : fmt(tot, 2) + " cubic metres", im ? fmt(tot, 2) + " m³" : fmt(yd, 2) + " yd³"], rows: rows, note: gravel ? "Weights are typical. Bulk density varies by supplier and moisture." : "A 2 to 3 inch (5 to 7.5 cm) layer suppresses weeds well without smothering plants." };
      } };
  }
  CALCS.mulch = volSpec("mulch");
  CALCS.gravel = volSpec("gravel");

  CALCS.btu = {
    fields: [{ id: "u", label: "Units", t: "sel", opts: [["f", "Square feet"], ["m", "Square metres"]], def: "f" }, { id: "a", label: function (v) { return "Room area (" + (v.u === "m" ? "m²" : "sq ft") + ")"; }, def: "300" },
      { id: "h", label: function (v) { return "Ceiling height (" + (v.u === "m" ? "m" : "ft") + ")"; }, def: "8" }, { id: "sun", label: "Sunlight", t: "sel", opts: [["0.9", "Shaded"], ["1", "Average"], ["1.1", "Very sunny"]], def: "1" },
      { g: "People and heat sources", id: "pp", label: "People who use the room", def: "2" }, { g: "People and heat sources", id: "k", label: "It is a kitchen", t: "chk", def: "" },
      { g: "People and heat sources", id: "cl", label: "Climate", t: "sel", opts: [["0.9", "Cool"], ["1", "Moderate"], ["1.15", "Hot"]], def: "1" }],
    run: function (v) {
      var a = num(v.a) * (v.u === "m" ? 10.7639104 : 1), h = num(v.h) * (v.u === "m" ? 3.280839895 : 1), pp = opt(v.pp, 2);
      if (!(a > 0) || !(h > 0) || pp < 0) return { err: "Enter the room area and ceiling height." };
      var b = a * 20 * (h / 8) * (+v.sun) * (+v.cl) + Math.max(0, pp - 2) * 600 + (v.k ? 4000 : 0), r = Math.round(b / 500) * 500;
      return { hero: ["Cooling needed", fmtg(r, 0) + " BTU/h", fmt(r * 0.00029307107, 2) + " kW"], rows: [["Cooling capacity", fmt(r / 12000, 2) + " tons"], ["Base figure (20 BTU per sq ft)", fmtg(Math.round(a * 20), 0) + " BTU/h"], ["Room area", fmtg(Math.round(a), 0) + " sq ft"]], note: "A rule-of-thumb sizing. Insulation, windows and local climate matter, so ask an installer for important purchases." };
    }
  };

  CALCS["day-of-week"] = {
    fields: [{ id: "d", label: "Date", t: "date", def: "today", wide: true }],
    run: function (v) {
      var d = parseDate(v.d); if (!d) return { err: "Choose a date." };
      var t = parseDate(todayISO()), n = Math.round((d - t) / 864e5), Y = d.getUTCFullYear(), doy = Math.round((d - new Date(Date.UTC(Y, 0, 0))) / 864e5);
      return { hero: ["That date is a", WD[d.getUTCDay()], dstr(d, true)], rows: [[n === 0 ? "Compared with today" : n > 0 ? "Days from today" : "Days since", n === 0 ? "Today" : fmtg(Math.abs(n), 0)], ["Day of the year", doy + " of " + (isLeap(Y) ? 366 : 365)], ["Leap year", isLeap(Y) ? "Yes" : "No"], ["Weekday or weekend", (d.getUTCDay() === 0 || d.getUTCDay() === 6) ? "Weekend" : "Weekday"]] };
    }
  };

  var ZONES = [["London", "Europe/London"], ["UTC", "UTC"], ["Dublin", "Europe/Dublin"], ["Paris, Berlin, Rome", "Europe/Paris"], ["Athens, Helsinki", "Europe/Athens"], ["Istanbul", "Europe/Istanbul"], ["Moscow", "Europe/Moscow"], ["Cairo", "Africa/Cairo"], ["Lagos", "Africa/Lagos"], ["Nairobi", "Africa/Nairobi"], ["Johannesburg", "Africa/Johannesburg"], ["Dubai", "Asia/Dubai"], ["Karachi", "Asia/Karachi"], ["Mumbai, Delhi", "Asia/Kolkata"], ["Bangkok", "Asia/Bangkok"], ["Singapore", "Asia/Singapore"], ["Hong Kong", "Asia/Hong_Kong"], ["Beijing, Shanghai", "Asia/Shanghai"], ["Tokyo", "Asia/Tokyo"], ["Seoul", "Asia/Seoul"], ["Perth", "Australia/Perth"], ["Sydney, Melbourne", "Australia/Sydney"], ["Auckland", "Pacific/Auckland"], ["Honolulu", "Pacific/Honolulu"], ["Anchorage", "America/Anchorage"], ["Los Angeles", "America/Los_Angeles"], ["Denver", "America/Denver"], ["Chicago", "America/Chicago"], ["New York", "America/New_York"], ["Toronto", "America/Toronto"], ["Mexico City", "America/Mexico_City"], ["Sao Paulo", "America/Sao_Paulo"]];
  function tzOff(zone, ms) {
    var p = {}; new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" }).formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = +x.value; });
    return Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - ms) / 60000);
  }
  function tzFmt(zone, ms) { return new Intl.DateTimeFormat("en-GB", { timeZone: zone, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(ms)); }
  function offStr(m) { var s = m < 0 ? "-" : "+", a = Math.abs(m); return "UTC" + s + Math.floor(a / 60) + (a % 60 ? ":" + pad2(a % 60) : ""); }
  CALCS["time-zone"] = {
    fields: [{ id: "d", label: "Date", t: "date", def: "today" }, { id: "t", label: "Time", t: "time", def: "12:00" }, { id: "f", label: "From", t: "sel", opts: ZONES.map(function (z) { return [z[1], z[0]]; }), def: "Europe/London", wide: true }, { id: "to", label: "To", t: "sel", opts: ZONES.map(function (z) { return [z[1], z[0]]; }), def: "America/New_York", wide: true }],
    run: function (v) {
      var d = parseDate(v.d), tm = tmin(v.t); if (!d || tm == null) return { err: "Choose a date and a time." };
      try {
        var g = d.getTime() + tm * 60000, o1 = tzOff(v.f, g), ms = g - o1 * 60000, o2 = tzOff(v.f, ms); if (o2 !== o1) ms = g - o2 * 60000;
        var oa = tzOff(v.f, ms), ob = tzOff(v.to, ms), name = function (z) { return ZONES.filter(function (x) { return x[1] === z; })[0][0]; };
        var top = ["Europe/London", "America/New_York", "America/Los_Angeles", "Europe/Paris", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"];
        return { hero: ["Time in " + name(v.to), tzFmt(v.to, ms), offStr(ob) + (ob - oa === 0 ? ", same time" : ", " + hrs(Math.abs(ob - oa)).replace(" 00m", "") + " " + (ob > oa ? "ahead" : "behind"))],
          rows: [["Time in " + name(v.f), tzFmt(v.f, ms) + " (" + offStr(oa) + ")"]], tables: [{ title: "The same moment around the world", head: ["Place", "Time"], rows: top.map(function (z) { return [name(z), tzFmt(z, ms)]; }) }], note: "Daylight saving is applied for the date you choose." };
      } catch (e) { return { err: "This browser could not work out those time zones." }; }
    }
  };

  function clock(min) { min = ((min % 1440) + 1440) % 1440; var h = Math.floor(min / 60), m = min % 60; return pad2(h) + ":" + pad2(m); }
  CALCS.sleep = {
    fields: [{ id: "m", label: "I want to", t: "sel", opts: [["wake", "Wake up at a set time"], ["bed", "Go to bed at a set time"]], def: "wake", wide: true }, { id: "t", label: function (v) { return v.m === "wake" ? "Wake-up time" : "Bedtime"; }, t: "time", def: "07:00" }, { id: "fa", label: "Minutes to fall asleep", def: "15" }],
    run: function (v) {
      var t = tmin(v.t), fa = opt(v.fa, 15); if (t == null) return { err: "Choose a time." }; if (fa < 0 || fa > 120) return { err: "Minutes to fall asleep should be between 0 and 120." };
      var rows = [];
      if (v.m === "wake") for (var c = 6; c >= 3; c--) rows.push([clock(t - c * 90 - fa), c + " cycles · " + fmt(c * 1.5, 1) + " hours of sleep"]);
      else for (var c2 = 3; c2 <= 6; c2++) rows.push([clock(t + fa + c2 * 90), c2 + " cycles · " + fmt(c2 * 1.5, 1) + " hours of sleep"]);
      var best = rows[v.m === "wake" ? 0 : 3];
      return { hero: [v.m === "wake" ? "Best bedtime" : "Best time to wake", best[0], best[1]], tables: [{ title: v.m === "wake" ? "Go to bed at" : "Wake up at", head: [v.m === "wake" ? "Bedtime" : "Wake time", "Sleep"], rows: rows }], note: "A sleep cycle lasts about 90 minutes, and waking at the end of one tends to feel easier. Most adults need 7 to 9 hours." };
    }
  };

  CALCS.height = {
    fields: [{ id: "s", label: "Child's sex", t: "sel", opts: [["m", "Boy"], ["f", "Girl"]], def: "m" }, { id: "u", label: "Units", t: "sel", opts: [["c", "Centimetres"], ["i", "Feet and inches"]], def: "c" },
      { id: "f1", label: function (v) { return v.u === "i" ? "Father (feet)" : "Father (cm)"; }, def: "178" }, { id: "f2", label: "Father (inches)", def: "0", show: function (v) { return v.u === "i"; } },
      { id: "m1", label: function (v) { return v.u === "i" ? "Mother (feet)" : "Mother (cm)"; }, def: "165" }, { id: "m2", label: "Mother (inches)", def: "0", show: function (v) { return v.u === "i"; } }],
    run: function (v) {
      var f = v.u === "i" ? (num(v.f1) * 12 + opt(v.f2)) * 2.54 : num(v.f1), m = v.u === "i" ? (num(v.m1) * 12 + opt(v.m2)) * 2.54 : num(v.m1);
      if (!(f > 120 && f < 250) || !(m > 120 && m < 250)) return { err: "Enter both parents' heights." };
      var p = v.s === "m" ? (f + m + 13) / 2 : (f + m - 13) / 2, ft = function (c) { var i = c / 2.54; return Math.floor(i / 12) + " ft " + fmt(i % 12, 1) + " in"; };
      return { hero: ["Predicted adult height", fmt(p, 1) + " cm", ft(p)], rows: [["Likely range (±8.5 cm)", fmt(p - 8.5, 1) + " to " + fmt(p + 8.5, 1) + " cm"], ["In feet and inches", ft(p - 8.5) + " to " + ft(p + 8.5)], ["Mid-parent height", fmt((f + m) / 2, 1) + " cm"]], note: "The mid-parental method is only a rough guide. Nutrition, health and genetics all play a part. Ask a doctor if you are worried about growth." };
    }
  };

  var MASSU = [["kg", "Kilograms", 1], ["g", "Grams", 0.001], ["lb", "Pounds", 0.45359237], ["oz", "Ounces", 0.028349523125], ["t", "Tonnes", 1000]], VOLU = [["m3", "Cubic metres", 1], ["l", "Litres", 0.001], ["ml", "Millilitres", 1e-6], ["cm3", "Cubic centimetres", 1e-6], ["ft3", "Cubic feet", 0.028316846592], ["gal", "US gallons", 0.003785411784]];
  function pick(arr, id) { return arr.filter(function (x) { return x[0] === id; })[0][2]; }
  CALCS.density = {
    fields: [{ id: "k", label: "Work out", t: "sel", opts: [["d", "Density"], ["m", "Mass"], ["v", "Volume"]], def: "d", wide: true },
      { id: "d", label: "Density", def: "7850", show: function (v) { return v.k !== "d"; } }, { id: "du", label: "Density unit", t: "sel", opts: [["1", "kg/m³"], ["1000", "g/cm³"], ["16.01846337", "lb/ft³"]], def: "1", show: function (v) { return v.k !== "d"; } },
      { id: "m", label: "Mass", def: "10", show: function (v) { return v.k !== "m"; } }, { id: "mu", label: "Mass unit", t: "sel", opts: MASSU.map(function (x) { return [x[0], x[1]]; }), def: "kg", show: function (v) { return v.k !== "m"; } },
      { id: "v", label: "Volume", def: "0.002", show: function (v) { return v.k !== "v"; } }, { id: "vu", label: "Volume unit", t: "sel", opts: VOLU.map(function (x) { return [x[0], x[1]]; }), def: "m3", show: function (v) { return v.k !== "v"; } }],
    run: function (v) {
      var d = num(v.d) * +v.du, m = num(v.m) * pick(MASSU, v.mu), vo = num(v.v) * pick(VOLU, v.vu);
      if (v.k === "d") { if (!(m > 0) || !(vo > 0)) return { err: "Enter a mass and a volume." }; d = m / vo; }
      else if (v.k === "m") { if (!(d > 0) || !(vo > 0)) return { err: "Enter a density and a volume." }; m = d * vo; }
      else { if (!(d > 0) || !(m > 0)) return { err: "Enter a density and a mass." }; vo = m / d; }
      return { hero: [v.k === "d" ? "Density" : v.k === "m" ? "Mass" : "Volume", v.k === "d" ? fmtg(+d.toPrecision(6), 4) + " kg/m³" : v.k === "m" ? fmtg(+m.toPrecision(6), 4) + " kg" : fmtg(+vo.toPrecision(6), 6) + " m³"],
        rows: [["Density", fmtg(+d.toPrecision(6), 4) + " kg/m³ · " + fmtg(+(d / 1000).toPrecision(6), 5) + " g/cm³ · " + fmtg(+(d / 16.01846337).toPrecision(6), 4) + " lb/ft³"], ["Mass", fmtg(+m.toPrecision(6), 5) + " kg · " + fmtg(+(m / 0.45359237).toPrecision(6), 5) + " lb"], ["Volume", fmtg(+(vo * 1000).toPrecision(6), 6) + " litres · " + fmtg(+(vo / 0.028316846592).toPrecision(6), 6) + " ft³"]],
        tables: [{ title: "Typical densities", head: ["Material", "kg/m³"], rows: [["Water", "1,000"], ["Ice", "917"], ["Wood (oak)", "700 to 750"], ["Aluminium", "2,700"], ["Steel", "7,850"], ["Copper", "8,960"], ["Lead", "11,340"], ["Gold", "19,320"]] }] };
    }
  };

  function toRoman(n) { var m = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]], s = ""; m.forEach(function (x) { while (n >= x[0]) { s += x[1]; n -= x[0]; } }); return s; }
  function fromRoman(s) {
    if (!/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(s) || !s) return null;
    var t = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }, n = 0; for (var i = 0; i < s.length; i++) { var a = t[s[i]], b = t[s[i + 1]] || 0; n += a < b ? -a : a; } return n;
  }
  CALCS["roman-numeral"] = {
    multi: [
      { title: "Number to Roman numerals", fields: [{ id: "n", label: "Number (1 to 3,999)", def: "2026", wide: true }],
        run: function (v) { var n = num(v.n); if (!(n >= 1 && n <= 3999) || n !== Math.floor(n)) return { err: "Enter a whole number from 1 to 3,999." }; var r = toRoman(n); return { hero: [fmtg(n, 0) + " in Roman numerals", r], rows: [["Letters used", String(r.length)]] }; } },
      { title: "Roman numerals to number", fields: [{ id: "r", label: "Roman numerals", def: "MMXXVI", wide: true }],
        run: function (v) { var s = String(v.r || "").toUpperCase().replace(/\s+/g, ""), n = fromRoman(s); if (n == null) return { err: "That is not a valid Roman numeral. Use the letters I, V, X, L, C, D and M, written in the standard way, up to MMMCMXCIX." }; return { hero: [s + " is", fmtg(n, 0)] }; } }
    ]
  };

  CALCS["wind-chill"] = {
    fields: [{ id: "u", label: "Units", t: "sel", opts: [["us", "°F and mph"], ["me", "°C and km/h"]], def: "us", wide: true }, { id: "t", label: function (v) { return v.u === "us" ? "Air temperature (°F)" : "Air temperature (°C)"; }, def: "20" }, { id: "w", label: function (v) { return v.u === "us" ? "Wind speed (mph)" : "Wind speed (km/h)"; }, def: "15" }],
    run: function (v) {
      var us = v.u === "us", t = num(v.t), w = num(v.w); if (isNaN(t) || !(w >= 0)) return { err: "Enter a temperature and a wind speed." };
      var tf = us ? t : t * 9 / 5 + 32, wm = us ? w : w / 1.609344, wc;
      if (us) wc = 35.74 + 0.6215 * t - 35.75 * Math.pow(w, 0.16) + 0.4275 * t * Math.pow(w, 0.16); else wc = 13.12 + 0.6215 * t - 11.37 * Math.pow(w, 0.16) + 0.3965 * t * Math.pow(w, 0.16);
      var c = us ? (wc - 32) * 5 / 9 : wc, f = us ? wc : wc * 9 / 5 + 32, ok = tf <= 50 && wm >= 3;
      var risk = f > 0 ? "Low risk" : f > -19 ? "Cold. Frostbite is possible after 30 minutes or more" : f > -35 ? "Very cold. Frostbite is possible in 10 to 30 minutes" : "Extreme. Frostbite is possible in under 10 minutes";
      return { hero: ["Wind chill", fmt(us ? wc : wc, 1) + (us ? " °F" : " °C"), (us ? fmt(c, 1) + " °C" : fmt(f, 1) + " °F")], warn: ok ? null : "The wind chill formula is meant for temperatures of 50 °F (10 °C) or below and winds of 3 mph (5 km/h) or more, so treat this figure with care.", rows: [["Feels like", fmt(f, 1) + " °F · " + fmt(c, 1) + " °C"], ["Frostbite risk", risk]], note: "Uses the US National Weather Service formula." };
    }
  };

  CALCS["heat-index"] = {
    fields: [{ id: "u", label: "Units", t: "sel", opts: [["us", "°F"], ["me", "°C"]], def: "us", wide: true }, { id: "t", label: function (v) { return v.u === "us" ? "Air temperature (°F)" : "Air temperature (°C)"; }, def: "90" }, { id: "r", label: "Relative humidity (%)", def: "65" }],
    run: function (v) {
      var us = v.u === "us", t = num(v.t), R = num(v.r); if (isNaN(t) || !(R >= 0 && R <= 100)) return { err: "Enter a temperature and a humidity from 0 to 100." };
      var T = us ? t : t * 9 / 5 + 32, hi = 0.5 * (T + 61 + (T - 68) * 1.2 + R * 0.094);
      if ((hi + T) / 2 >= 80) {
        hi = -42.379 + 2.04901523 * T + 10.14333127 * R - 0.22475541 * T * R - 0.00683783 * T * T - 0.05481717 * R * R + 0.00122874 * T * T * R + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R;
        if (R < 13 && T >= 80 && T <= 112) hi -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
        else if (R > 85 && T >= 80 && T <= 87) hi += ((R - 85) / 10) * ((87 - T) / 5);
      }
      var risk = hi >= 125 ? "Extreme danger: heat stroke is highly likely" : hi >= 103 ? "Danger: heat cramps and exhaustion likely, heat stroke possible" : hi >= 91 ? "Extreme caution: heat exhaustion possible with prolonged activity" : hi >= 80 ? "Caution: fatigue possible with prolonged activity" : "Little heat risk";
      var C = (hi - 32) * 5 / 9;
      return { hero: ["Feels like", us ? fmt(hi, 1) + " °F" : fmt(C, 1) + " °C", us ? fmt(C, 1) + " °C" : fmt(hi, 1) + " °F"], warn: T < 80 ? "The heat index only matters from about 80 °F (27 °C). Below that the air temperature is a fair guide." : null, rows: [["Heat index", fmt(hi, 1) + " °F · " + fmt(C, 1) + " °C"], ["Risk level", risk]], note: "Uses the US National Weather Service regression, for shade and light wind. Direct sun can add up to 15 °F." };
    }
  };

  CALCS["dew-point"] = {
    fields: [{ id: "u", label: "Units", t: "sel", opts: [["c", "°C"], ["f", "°F"]], def: "c", wide: true }, { id: "t", label: function (v) { return v.u === "f" ? "Air temperature (°F)" : "Air temperature (°C)"; }, def: "24" }, { id: "r", label: "Relative humidity (%)", def: "60" }],
    run: function (v) {
      var f = v.u === "f", t = num(v.t), R = num(v.r); if (isNaN(t) || !(R > 0 && R <= 100)) return { err: "Enter a temperature and a humidity above 0 and up to 100." };
      var Tc = f ? (t - 32) * 5 / 9 : t, a = 17.625, b = 243.04, g = Math.log(R / 100) + a * Tc / (b + Tc), d = b * g / (a - g), df = d * 9 / 5 + 32;
      var dp = f ? df : d, cf = df < 50 ? "Dry and comfortable" : df < 60 ? "Comfortable" : df < 65 ? "Slightly sticky" : df < 70 ? "Humid and muggy" : df < 75 ? "Very humid and oppressive" : "Extremely humid";
      return { hero: ["Dew point", fmt(dp, 1) + (f ? " °F" : " °C"), fmt(f ? d : df, 1) + (f ? " °C" : " °F")], rows: [["Dew point", fmt(d, 1) + " °C · " + fmt(df, 1) + " °F"], ["How it feels", cf], ["Gap to air temperature", fmt(Tc - d, 1) + " °C"]], note: "The air must cool to the dew point before water vapour starts to condense. Uses the Magnus formula, accurate to about 0.4 °C." };
    }
  };

  CALCS["ohms-law"] = {
    fields: [{ id: "v", label: "Voltage (V)", def: "12", ph: "Volts" }, { id: "i", label: "Current (A)", def: "2", ph: "Amps" }, { id: "r", label: "Resistance (Ω)", def: "", ph: "Ohms" }, { id: "p", label: "Power (W)", def: "", ph: "Watts" }],
    run: function (x) {
      var V = num(x.v), I = num(x.i), R = num(x.r), P = num(x.p), set = [V, I, R, P].filter(function (n) { return !isNaN(n); }).length;
      if (set !== 2) return { err: set < 2 ? "Fill in any two of the four boxes and leave the other two empty." : "Fill in just two boxes and leave the other two empty." };
      if ([V, I, R, P].some(function (n) { return !isNaN(n) && !(n > 0); })) return { err: "Use numbers above zero." };
      if (!isNaN(V) && !isNaN(I)) { R = V / I; P = V * I; } else if (!isNaN(V) && !isNaN(R)) { I = V / R; P = V * V / R; } else if (!isNaN(V) && !isNaN(P)) { I = P / V; R = V * V / P; } else if (!isNaN(I) && !isNaN(R)) { V = I * R; P = I * I * R; } else if (!isNaN(I) && !isNaN(P)) { V = P / I; R = P / (I * I); } else { V = Math.sqrt(P * R); I = Math.sqrt(P / R); }
      var g = function (n) { return fmtg(+n.toPrecision(6), 6); };
      return { hero: ["Resistance", oh(R, 4), g(V) + " V · " + g(I) + " A · " + g(P) + " W"], rows: [["Voltage", g(V) + " V"], ["Current", g(I) + " A (" + g(I * 1000) + " mA)"], ["Resistance", oh(R, 4)], ["Power", g(P) + " W (" + g(P / 1000) + " kW)"]], note: "V = I × R, P = V × I. Leave two boxes empty and the calculator solves the rest." };
    }
  };

  var RC = [["black", "Black", 0, 1, null], ["brown", "Brown", 1, 10, 1], ["red", "Red", 2, 100, 2], ["orange", "Orange", 3, 1e3, null], ["yellow", "Yellow", 4, 1e4, null], ["green", "Green", 5, 1e5, 0.5], ["blue", "Blue", 6, 1e6, 0.25], ["violet", "Violet", 7, 1e7, 0.1], ["grey", "Grey", 8, 1e8, 0.05], ["white", "White", 9, 1e9, null]], RM = RC.map(function (c) { return [c[0], c[1] + " (× " + fmtg(c[3], 0) + ")"]; }).concat([["gold", "Gold (× 0.1)"], ["silver", "Silver (× 0.01)"]]);
  var RD = RC.map(function (c) { return [c[0], c[1] + " (" + c[2] + ")"]; }), RT = RC.filter(function (c) { return c[4] != null; }).map(function (c) { return [c[0], c[1] + " (±" + c[4] + "%)"]; }).concat([["gold", "Gold (±5%)"], ["silver", "Silver (±10%)"]]);
  function rdig(id) { return RC.filter(function (c) { return c[0] === id; })[0][2]; }
  CALCS.resistor = {
    fields: [{ id: "n", label: "Bands", t: "sel", opts: [["4", "4 bands"], ["5", "5 bands"]], def: "4", wide: true }, { id: "a", label: "Band 1", t: "sel", opts: RD.slice(1), def: "brown" }, { id: "b", label: "Band 2", t: "sel", opts: RD, def: "black" }, { id: "c", label: "Band 3", t: "sel", opts: RD, def: "black", show: function (v) { return v.n === "5"; } },
      { id: "m", label: "Multiplier", t: "sel", opts: RM, def: "red" }, { id: "t", label: "Tolerance", t: "sel", opts: RT, def: "gold" }],
    run: function (v) {
      var d = rdig(v.a) * 10 + rdig(v.b); if (v.n === "5") d = d * 10 + rdig(v.c);
      var mu = v.m === "gold" ? 0.1 : v.m === "silver" ? 0.01 : RC.filter(function (c) { return c[0] === v.m; })[0][3], tol = v.t === "gold" ? 5 : v.t === "silver" ? 10 : RC.filter(function (c) { return c[0] === v.t; })[0][4], R = d * mu;
      return { hero: ["Resistance", oh(R, 3) + " ±" + tol + "%"], rows: [["Value in ohms", fmtg(+R.toPrecision(6), 6) + " Ω"], ["Lowest it could be", oh(R * (1 - tol / 100), 4)], ["Highest it could be", oh(R * (1 + tol / 100), 4)]], note: "Read the bands from the end with the bands closest together. The tolerance band is usually gold or silver." };
    }
  };

  var WIRES = [["14", 14], ["12", 12], ["10", 10], ["8", 8], ["6", 6], ["4", 4], ["2", 2], ["1", 1], ["1/0", 0], ["2/0", -1], ["3/0", -2], ["4/0", -3]].map(function (w) { var d = 0.127 * Math.pow(92, (36 - w[1]) / 39), a = Math.PI * d * d / 4; return [String(a), w[0] + " AWG (" + fmt(a, 2) + " mm²)"]; }).concat([1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95].map(function (a) { return [String(a), fmtg(a, 1) + " mm²"]; }));
  CALCS["voltage-drop"] = {
    fields: [{ id: "sy", label: "Circuit", t: "sel", opts: [["dc", "DC or single phase"], ["3p", "Three phase"]], def: "dc", wide: true }, { id: "vt", label: "Supply voltage (V)", def: "230" }, { id: "i", label: "Current (A)", def: "20" },
      { id: "u", label: "Length unit", t: "sel", opts: [["m", "Metres"], ["f", "Feet"]], def: "m" }, { id: "l", label: "One-way cable length", def: "30" },
      { id: "w", label: "Wire size", t: "sel", opts: WIRES, def: "4", wide: true }, { g: "Material and temperature", id: "mt", label: "Conductor", t: "sel", opts: [["c", "Copper"], ["a", "Aluminium"]], def: "c" }, { g: "Material and temperature", id: "tp", label: "Temperature (°C)", def: "20" }],
    run: function (v) {
      var V = num(v.vt), I = num(v.i), L = num(v.l) * (v.u === "f" ? 0.3048 : 1), A = num(v.w), T = opt(v.tp, 20);
      if (!(V > 0) || !(I > 0) || !(L > 0)) return { err: "Enter the voltage, current and cable length." };
      var rho = (v.mt === "c" ? 1.724e-8 : 2.82e-8) * (1 + (v.mt === "c" ? 0.00393 : 0.0039) * (T - 20)), R = rho * L / (A * 1e-6), k = v.sy === "3p" ? Math.sqrt(3) : 2, drop = k * I * R, pc = drop / V * 100, loss = k === 2 ? 2 * I * I * R : 3 * I * I * R;
      return { hero: ["Voltage drop", fmt(drop, 2) + " V", fmt(pc, 2) + "% of supply"], warn: pc > 5 ? "That is over 5%. Choose a larger wire or a shorter run." : pc > 3 ? "Over 3% is more than usually recommended for a branch circuit." : null, rows: [["Voltage at the far end", fmt(V - drop, 2) + " V"], ["Cable resistance (one way)", fmtg(+(R * 1000).toPrecision(4), 4) + " mΩ"], ["Power lost in the cable", fmt(loss, 1) + " W"], ["Wire area", fmt(A, 2) + " mm²"]],
        note: "A guide for resistive loads using copper or aluminium resistivity at your temperature. Check wiring rules and current ratings, and use a qualified electrician for installation." };
    }
  };

  CALCS.electricity = {
    fields: [{ id: "w", label: "Appliance power (watts)", def: "2000" }, { id: "h", label: "Hours used per day", def: "3" }, { id: "n", label: "How many appliances", def: "1" }, { id: "c", label: "Currency", t: "sel", opts: CUR.opts, def: "£" }, { id: "p", label: "Price per kWh", def: "0.27" },
      { g: "More detail", id: "sb", label: "Standby power (watts)", def: "0" }, { g: "More detail", id: "d", label: "Days used per week", def: "7" }],
    run: function (v) {
      var w = num(v.w), h = num(v.h), n = opt(v.n, 1), p = num(v.p), sb = opt(v.sb), d = opt(v.d, 7);
      if (!(w >= 0) || !(h >= 0 && h <= 24) || !(n > 0) || !(p >= 0) || !(d >= 0 && d <= 7) || sb < 0) return { err: "Enter the power, the hours per day (0 to 24) and the price per kWh." };
      var day = (w * h * d / 7 + sb * (24 - h)) * n / 1000, year = day * 365, mo = year / 12;   /* average kWh per day: running hours spread over the week, standby for the rest */
      var c = v.c; return { hero: ["Running cost per year", money(year * p, c), money(mo * p, c) + " a month"], rows: [["Energy per day", fmt(day, 3) + " kWh"], ["Energy per month", fmt(mo, 1) + " kWh"], ["Energy per year", fmt(year, 0) + " kWh"], ["Cost per day", money(day * p, c)], ["Cost per month", money(mo * p, c)], ["Cost per year", money(year * p, c)]], note: "Cost = kilowatts × hours × price per kWh. Check your bill for your actual unit rate." };
    }
  };

  var DSZ = [["1e3", "KB (kilobytes)"], ["1e6", "MB (megabytes)"], ["1e9", "GB (gigabytes)"], ["1e12", "TB (terabytes)"]], SPD = [["1e3", "kbps"], ["1e6", "Mbps"], ["1e9", "Gbps"], ["8e6", "MB/s"]];
  CALCS.bandwidth = {
    multi: [
      { title: "Download time", fields: [{ id: "s", label: "File size", def: "4.7" }, { id: "su", label: "Size unit", t: "sel", opts: DSZ, def: "1e9" }, { id: "sp", label: "Connection speed", def: "100" }, { id: "spu", label: "Speed unit", t: "sel", opts: SPD, def: "1e6" }, { id: "ov", label: "Network overhead (%)", def: "5", wide: true }],
        run: function (v) {
          var sz = num(v.s) * +v.su * 8, sp = num(v.sp) * +v.spu, ov = opt(v.ov); if (!(sz > 0) || !(sp > 0) || ov < 0 || ov > 90) return { err: "Enter a file size and a speed, with overhead from 0 to 90%." };
          var t = sz / (sp * (1 - ov / 100)); return { hero: ["Download time", hmsStr(t), t >= 86400 ? fmt(t / 86400, 2) + " days" : null], rows: [["Seconds", fmtg(Math.round(t * 10) / 10, 1)], ["Effective speed", fmt(sp * (1 - ov / 100) / 8e6, 2) + " MB/s"], ["File size", fmtg(+(sz / 8e6).toPrecision(6), 4) + " MB"]], note: "Real speeds move around, so treat this as a best estimate." };
        } },
      { title: "Data used", fields: [{ id: "sp", label: "Speed", def: "25" }, { id: "spu", label: "Speed unit", t: "sel", opts: SPD, def: "1e6" }, { id: "h", label: "Hours", def: "2" }, { id: "m", label: "Minutes", def: "0" }],
        run: function (v) {
          var sp = num(v.sp) * +v.spu, t = opt(v.h) * 3600 + opt(v.m) * 60; if (!(sp > 0) || !(t > 0)) return { err: "Enter a speed and a time." };
          var b = sp * t / 8; return { hero: ["Data transferred", fmt(b / 1e9, 2) + " GB", fmt(b / 1e6, 0) + " MB"], rows: [["Terabytes", fmtg(+(b / 1e12).toPrecision(4), 4)], ["Gigabytes", fmt(b / 1e9, 3)], ["Megabytes", fmt(b / 1e6, 1)]] };
        } }
    ]
  };

  CALCS.base64 = {
    fields: [{ id: "m", label: "Action", t: "sel", opts: [["e", "Encode text to Base64"], ["d", "Decode Base64 to text"]], def: "e", wide: true }, { id: "t", label: "Your text", t: "area", rows: 5, def: "Hello, GoUnscramble!" }, { id: "u", label: "URL-safe Base64 (uses - and _)", t: "chk", def: "" }],
    run: function (v) {
      var s = String(v.t); if (!s.trim()) return { err: "Enter some text." };
      try {
        if (v.m === "e") { var by = new TextEncoder().encode(s), bin = ""; for (var i = 0; i < by.length; i++) bin += String.fromCharCode(by[i]); var b = btoa(bin); if (v.u) b = b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); return { hero: ["Encoded", fmtg(b.length, 0) + " characters"], text: b, note: "Text is converted with UTF-8, so emoji and accents work." }; }
        var c = s.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/"); while (c.length % 4) c += "=";
        var raw = atob(c), arr = new Uint8Array(raw.length); for (var j = 0; j < raw.length; j++) arr[j] = raw.charCodeAt(j);
        var out = new TextDecoder("utf-8", { fatal: true }).decode(arr); return { hero: ["Decoded", fmtg(out.length, 0) + " characters"], text: out };
      } catch (e) { return { err: v.m === "e" ? "That text could not be encoded." : "That is not valid Base64 text, or it does not decode to readable text." }; }
    }
  };

  CALCS["url-encode"] = {
    fields: [{ id: "m", label: "Action", t: "sel", opts: [["c", "Encode text or a query value"], ["f", "Encode a whole URL"], ["d", "Decode"]], def: "c", wide: true }, { id: "t", label: "Your text or URL", t: "area", rows: 4, def: "https://example.com/search?q=word games & puzzles", wide: true }, { id: "p", label: "Treat + as a space when decoding", t: "chk", def: "", show: function (v) { return v.m === "d"; } }],
    run: function (v) {
      var s = String(v.t); if (!s.trim()) return { err: "Enter some text." };
      try {
        if (v.m === "c") return { hero: ["Encoded", fmtg(encodeURIComponent(s).length, 0) + " characters"], text: encodeURIComponent(s), note: "Every reserved character is encoded, which suits a single query value." };
        if (v.m === "f") return { hero: ["Encoded URL", fmtg(encodeURI(s).length, 0) + " characters"], text: encodeURI(s), note: "Characters that belong in a URL, like : / ? & and =, are kept." };
        var o = v.p ? s.replace(/\+/g, " ") : s; var r = decodeURIComponent(o); return { hero: ["Decoded", fmtg(r.length, 0) + " characters"], text: r };
      } catch (e) { return { err: "That text has an invalid percent sequence, so it cannot be decoded." }; }
    }
  };

  var MPG = [["us", "US miles per gallon"], ["uk", "UK miles per gallon"], ["l100", "Litres per 100 km"], ["kpl", "Kilometres per litre"]];
  function mpgRows(us) { return [["US miles per gallon", fmt(us, 2)], ["UK miles per gallon", fmt(us * 1.200949926, 2)], ["Litres per 100 km", fmt(235.214583 / us, 2)], ["Kilometres per litre", fmt(us * 0.425143707, 2)]]; }
  CALCS["gas-mileage"] = {
    multi: [
      { title: "Work out your fuel economy", fields: [{ id: "d", label: "Distance driven", def: "320" }, { id: "du", label: "Distance unit", t: "sel", opts: [["mi", "Miles"], ["km", "Kilometres"]], def: "mi" }, { id: "f", label: "Fuel used", def: "11" }, { id: "fu", label: "Fuel unit", t: "sel", opts: [["us", "US gallons"], ["uk", "UK gallons"], ["l", "Litres"]], def: "us" },
        { g: "Cost (optional)", id: "c", label: "Currency", t: "sel", opts: CUR.opts, def: "$" }, { g: "Cost (optional)", id: "p", label: "Fuel price per unit", def: "", ph: "Optional" }],
        run: function (v) {
          var d = num(v.d), f = num(v.f); if (!(d > 0) || !(f > 0)) return { err: "Enter the distance and the fuel used." };
          var mi = v.du === "mi" ? d : d / 1.609344, gal = v.fu === "us" ? f : v.fu === "uk" ? f * 1.200949926 : f / 3.785411784, us = mi / gal, rows = mpgRows(us).slice(1), p = num(v.p);
          if (p > 0) { var cost = f * p, dist = d; rows.push(["Fuel cost for the trip", money(cost, v.c)], ["Cost per " + (v.du === "mi" ? "mile" : "kilometre"), money(cost / dist, v.c)]); }
          return { hero: ["Fuel economy", fmt(us, 2) + " mpg (US)", fmt(235.214583 / us, 2) + " L/100 km"], rows: rows };
        } },
      { title: "Convert fuel economy", fields: [{ id: "v", label: "Value", def: "30" }, { id: "k", label: "Unit", t: "sel", opts: MPG, def: "us" }],
        run: function (v) {
          var n = num(v.v); if (!(n > 0)) return { err: "Enter a value above zero." };
          var us = v.k === "us" ? n : v.k === "uk" ? n / 1.200949926 : v.k === "l100" ? 235.214583 / n : n / 0.425143707;
          return { hero: ["That is", fmt(us, 2) + " mpg (US)"], rows: mpgRows(us) };
        } }
    ]
  };

  CALCS.horsepower = {
    multi: [
      { title: "From torque and engine speed", fields: [{ id: "t", label: "Torque", def: "300" }, { id: "tu", label: "Torque unit", t: "sel", opts: [["lb", "lb-ft"], ["nm", "N·m"]], def: "lb" }, { id: "r", label: "Engine speed (rpm)", def: "5000", wide: true }],
        run: function (v) {
          var t = num(v.t) * (v.tu === "nm" ? 0.737562149 : 1), r = num(v.r); if (!(t > 0) || !(r > 0)) return { err: "Enter the torque and the rpm." };
          var hp = t * r / 5252; return { hero: ["Horsepower", fmt(hp, 1) + " hp"], rows: [["Kilowatts", fmt(hp * 0.745699872, 1) + " kW"], ["Metric horsepower (PS)", fmt(hp * 1.01386967, 1)]], note: "hp = torque (lb-ft) × rpm ÷ 5,252." };
        } },
      { title: "Estimate from quarter-mile time", fields: [{ id: "w", label: "Vehicle weight", def: "3400" }, { id: "wu", label: "Weight unit", t: "sel", opts: [["lb", "Pounds"], ["kg", "Kilograms"]], def: "lb" }, { id: "e", label: "Quarter-mile time (seconds)", def: "13.5" }, { id: "s", label: "Trap speed (mph, optional)", def: "", ph: "Optional" }],
        run: function (v) {
          var w = num(v.w) * (v.wu === "kg" ? 2.20462262 : 1), e = num(v.e), s = num(v.s); if (!(w > 0) || !(e > 5 && e < 30)) return { err: "Enter the weight and a quarter-mile time between 5 and 30 seconds." };
          var hp = w / Math.pow(e / 5.825, 3), rows = [["Kilowatts", fmt(hp * 0.745699872, 0) + " kW"], ["Based on", "Elapsed time"]];
          if (s > 0) rows.push(["Estimate from trap speed", fmt(w * Math.pow(s / 234, 3), 0) + " hp"]);
          return { hero: ["Estimated power at the wheels", fmt(hp, 0) + " hp"], rows: rows, note: "A rough estimate of power at the crank using classic drag racing formulas. Traction, gearing and conditions change real times." };
        } }
    ]
  };

  CALCS.mileage = {
    fields: [{ id: "r", label: "Rate", t: "sel", opts: [["hc", "UK HMRC car or van (45p, then 25p)"], ["hm", "UK HMRC motorcycle (24p)"], ["hb", "UK HMRC bicycle (20p)"], ["cu", "My own rate"]], def: "hc", wide: true },
      { id: "m", label: "Miles for this claim", def: "180" }, { id: "so", label: "Miles already claimed this tax year", def: "0", show: function (v) { return v.r === "hc"; } }, { id: "cr", label: "Rate per mile (pence or cents)", def: "45", show: function (v) { return v.r === "cu"; } },
      { id: "c", label: "Currency", t: "sel", opts: CUR.opts, def: "£" }],
    run: function (v) {
      var m = num(v.m), so = opt(v.so); if (!(m > 0) || so < 0) return { err: "Enter the miles for this claim." };
      var tot = 0, rows = [];
      if (v.r === "hc") { var hi = Math.max(0, Math.min(m, 10000 - so)), lo = m - hi; tot = hi * 0.45 + lo * 0.25; rows.push(["Miles at 45p", fmtg(hi, 1)], ["Miles at 25p", fmtg(lo, 1)]); }
      else if (v.r === "hm") tot = m * 0.24; else if (v.r === "hb") tot = m * 0.2; else { var cr = num(v.cr); if (!(cr >= 0)) return { err: "Enter your rate per mile." }; tot = m * cr / 100; }
      rows.push(["Average per mile", money(tot / m, v.c)], ["Kilometres", fmt(m * 1.609344, 1)]);
      return { hero: ["Mileage allowance", money(tot, v.c)], rows: rows, note: "UK Approved Mileage Allowance Payment rates: 45p a mile for the first 10,000 business miles in a tax year and 25p after. Check HMRC for current rates." };
    }
  };

  function parseTire(s) { var m = /^\s*(\d{3})\s*\/\s*(\d{2})\s*[A-Za-z]{0,2}\s*(\d{2})\s*$/.exec(s || ""); return m ? { w: +m[1], a: +m[2], r: +m[3] } : null; }
  function tireInfo(t) { var side = t.w * t.a / 100, dia = t.r * 25.4 + 2 * side; return { side: side, dia: dia, circ: Math.PI * dia }; }
  CALCS["tire-size"] = {
    fields: [{ id: "a", label: "Current tyre size", def: "225/45R17", hint: "Printed on the sidewall, for example 225/45R17" }, { id: "b", label: "New tyre size", def: "235/40R18" }, { id: "s", label: "Speed shown on the speedometer", def: "60" }, { id: "u", label: "Speed unit", t: "sel", opts: [["mph", "mph"], ["kmh", "km/h"]], def: "mph" }],
    run: function (v) {
      var a = parseTire(v.a), b = parseTire(v.b), s = num(v.s); if (!a || !b) return { err: "Enter sizes like 225/45R17 (width, aspect ratio, rim size)." }; if (!(s > 0)) return { err: "Enter a speed." };
      var A = tireInfo(a), B = tireInfo(b), df = (B.dia / A.dia - 1) * 100, actual = s * B.dia / A.dia, u = v.u === "mph" ? " mph" : " km/h", pm = function (x) { return (x > 0 ? "+" : "") + fmt(x, 2) + "%"; };
      return { hero: ["Overall diameter change", pm(df), fmt(B.dia - A.dia, 1) + " mm"], warn: Math.abs(df) > 3 ? "A change of more than 3% can affect the speedometer, gearing and safety systems. Check your vehicle handbook." : null,
        tables: [{ head: ["", "Current", "New"], rows: [["Size", v.a.toUpperCase().trim(), v.b.toUpperCase().trim()], ["Width", a.w + " mm", b.w + " mm"], ["Sidewall height", fmt(A.side, 1) + " mm", fmt(B.side, 1) + " mm"], ["Overall diameter", fmt(A.dia, 1) + " mm · " + fmt(A.dia / 25.4, 2) + " in", fmt(B.dia, 1) + " mm · " + fmt(B.dia / 25.4, 2) + " in"], ["Circumference", fmt(A.circ, 0) + " mm", fmt(B.circ, 0) + " mm"], ["Revolutions per mile", fmt(1609344 / A.circ, 0), fmt(1609344 / B.circ, 0)]] }],
        rows: [["Speedometer shows " + fmtg(s, 1) + u, "You are really doing " + fmt(actual, 1) + u], ["Speedometer error", pm((actual / s - 1) * 100)]] };
    }
  };

  /* short explanations under the boxes, so every value and measurement is clear */
  var HINTS = {
    "square-footage": { l: "For a circle this is the full width across the middle.", w: "For a triangle this is the height from the base to the top point.", q: "Use more than 1 for several identical shapes.", p: "Price for one square foot of material, such as flooring." },
    stair: { rise: "Floor to floor, from the finished lower surface to the finished upper surface.", rs: "The height you would like each step to be. Many homes use about 7 to 7.75 in (18 to 19.5 cm).", tr: "The flat part you stand on, front to back. 10 in (25 cm) is common.", wd: "Side to side, for reference. Many codes ask for at least 36 in (91 cm)." },
    roofing: { l: "The long side of the house or outbuilding, wall to wall.", w: "The short side, wall to wall.", o: "How far the roof sticks out past the wall on each side.", p: "A pitch of 6 in 12 rises 6 inches for every 12 inches across (about 26.6°).", ws: "Extra for cuts, hips and ridges. 10 to 15% is usual.", bp: "Most shingle bundles cover one third of a square, so 3 per square." },
    tile: { l: "The room or wall length, not including skirting or trim.", w: "The room or wall width.", tl: "One tile's length, not including grout.", tw: "One tile's width, not including grout.", gr: "The gap between tiles. 2 to 5 mm (about 1/8 in) is typical.", ws: "Extra for cuts and breakages. 10% for straight lays, 15% for diagonal.", pb: "Printed on the box. Used to round up to whole boxes." },
    mulch: { d: "Thickness of the layer. 5 to 7.5 cm (2 to 3 in) is usual.", ws: "Extra because mulch compacts after it is laid." },
    gravel: { d: "Thickness of the layer. 10 to 15 cm (4 to 6 in) for a drive, less for a path.", mt: "Typical weights: gravel 1.68, crushed stone 1.6, sand 1.6, topsoil 1.3 tonnes per cubic metre." },
    btu: { a: "Floor area of the room to be cooled.", h: "Floor to ceiling. Standard is 8 ft (2.4 m).", sun: "Rooms in full sun gain more heat from the windows.", pp: "The first two people are already allowed for. Each extra adds about 600 BTU/h." },
    "time-zone": { d: "The date matters because daylight saving changes the offset.", t: "Enter the time in the place you are converting from, in 24-hour form." },
    sleep: { fa: "How long you usually take to fall asleep. 10 to 20 minutes is common." },
    height: { f1: "Use the biological parents' adult heights.", m1: "Use the biological parents' adult heights." },
    density: { d: "How heavy the material is for its size. Steel is about 7,850 kg/m³, water 1,000.", m: "How much the object weighs.", v: "How much space the object takes up." },
    "wind-chill": { t: "The shade air temperature.", w: "Wind speed at head height." },
    "heat-index": { t: "The shade air temperature.", r: "How saturated the air is. Humid days are above 60%." },
    "dew-point": { r: "Check a weather app. 50% is comfortable, above 70% is sticky." },
    "ohms-law": { v: "Volts. Mains is 230 V in the UK and 120 V in the US.", i: "Amps. 1 A = 1,000 mA.", r: "Ohms (Ω). 1 kΩ = 1,000 Ω.", p: "Watts. 1 kW = 1,000 W." },
    resistor: { a: "The first band is the first digit. It cannot be black.", m: "The multiplier band says how many zeros follow the digits.", t: "The last band. Gold means ±5% and silver ±10%." },
    "voltage-drop": { vt: "230 V in the UK, 120 or 240 V in the US.", i: "The current the circuit will carry.", l: "Distance from supply to load, not the round trip.", w: "Larger area means less drop. AWG numbers get smaller as the wire gets thicker.", tp: "Cable temperature. Hot cables resist more." },
    electricity: { w: "Written on the appliance label. A kettle is about 2,000 to 3,000 W.", h: "Hours of actual use each day.", p: "Check your bill. It is often shown in pence per kWh, so 27p is 0.27.", sb: "Power drawn while off but still plugged in." },
    bandwidth: { ov: "Network overhead lowers real speed. 5 to 10% is typical." },
    base64: { u: "URL-safe swaps + and / for - and _ and removes = padding." },
    "gas-mileage": { f: "Fuel added at the pump when you fill the tank after the trip." },
    mileage: { so: "Business miles already claimed since 6 April. The first 10,000 get the higher rate.", m: "Business miles only, not your normal commute." },
    "tire-size": { b: "The size you are thinking of fitting.", s: "What your speedometer reads, to compare with the real speed." }
  };
  Object.keys(HINTS).forEach(function (k) {
    var sp = CALCS[k]; if (!sp) return;
    (sp.multi ? sp.multi : [sp]).forEach(function (m) { m.fields.forEach(function (f) { if (HINTS[k][f.id] && !f.hint) f.hint = HINTS[k][f.id]; }); });
  });


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
    if (r.text != null) {
      var ta = el("textarea", "field cr-text"); ta.readOnly = true; ta.rows = 5; ta.value = r.text; ta.setAttribute("aria-label", "Result");
      var cp = el("button", "btn alt", "Copy"); cp.type = "button";
      cp.addEventListener("click", function () { ta.select(); try { navigator.clipboard.writeText(ta.value).then(function () { cp.textContent = "Copied"; }, function () { document.execCommand("copy"); }); } catch (e) { try { document.execCommand("copy"); } catch (e2) { /* ignore */ } } });
      out.appendChild(ta); var cb = el("div", "btns"); cb.appendChild(cp); out.appendChild(cb);
    }
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
    if (store.on() && window.GUP) GUP.sync().then(function (changed) { if (changed && !store.touched) { store.load(); restorers.forEach(function (f) { f(); }); } }).catch(function () {});
  } catch (e) { /* ignore */ }
  window.GUCalc = { CALCS: CALCS, run: function (slg, v) { return CALCS[slg].run(v); } };
})();
