/* UK salary and take-home pay calculator, tax year 2026/27. Everything runs in the browser. */
(function () {
  "use strict";
  var PA = 12570, NI_LO = 12570, NI_HI = 50270;
  var RUK = [[37700, 0.2], [125140, 0.4], [Infinity, 0.45]];            /* taxable-income limits */
  var SCO = [[3967, 0.19], [16956, 0.2], [31092, 0.21], [62430, 0.42], [125140, 0.45], [Infinity, 0.48]];
  var LOAN = { "1": 26900, "2": 29385, "4": 33795, "5": 25000 }, PG = 21000;

  function num(s) { s = String(s == null ? "" : s).replace(/[,\s£]/g, ""); return s === "" ? 0 : Number(s); }
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
  function bandTax(ti, bands, ext) {
    var tax = 0, prev = 0;
    for (var i = 0; i < bands.length; i++) {
      var lim = bands[i][0] + ext; if (ti > prev) tax += (Math.min(ti, lim) - prev) * bands[i][1]; prev = lim; if (ti <= lim) break;
    }
    return tax;
  }
  function calc(o) {
    var daily = o.annual / (52 * o.days), base = Math.max(0, o.annual - o.off * daily);
    var gross = base + o.bonus + o.overtime;
    var pen = o.penUnit === "pct" ? base * o.pen / 100 : o.pen * 12;
    var sac = o.penMethod === "sac" ? pen : 0, net = o.penMethod === "net" ? pen : 0, ras = o.penMethod === "ras" ? pen : 0;
    var niPay = Math.max(0, gross - sac - o.ss), taxPay = Math.max(0, gross + o.benefits - sac - net - o.ss);
    var code = parseCode(o.code), sco = o.region === "sco" || (code && code.sco), tax = 0, allowance = PA;
    if (code && code.nt) tax = 0;
    else if (code && code.flat != null) tax = taxPay * code.flat;
    else {
      if (!code || code.std) { var ani = taxPay - ras; allowance = ani > 100000 ? Math.max(0, PA - (ani - 100000) / 2) : PA; }
      else allowance = code.allowance;
      tax = bandTax(Math.max(0, taxPay - allowance), sco ? SCO : RUK, ras);
    }
    var ni = 0;
    if (!o.spa) { if (niPay > NI_LO) ni += (Math.min(niPay, NI_HI) - NI_LO) * 0.08; if (niPay > NI_HI) ni += (niPay - NI_HI) * 0.02; }
    var sl = 0; if (LOAN[o.loan]) sl += Math.max(0, niPay - LOAN[o.loan]) * 0.09; if (o.pg) sl += Math.max(0, niPay - PG) * 0.06;
    var penOut = o.penMethod === "ras" ? pen * 0.8 : pen;
    var take = gross - penOut - o.ss - tax - ni - sl - o.other;
    return { base: base, gross: gross, pen: penOut, ss: o.ss, tax: tax, ni: ni, sl: sl, other: o.other, take: take, allowance: allowance, sco: sco, daily: daily, benefits: o.benefits };
  }
  window.GUSal = { calc: calc, parseCode: parseCode };

  var $ = function (id) { return document.getElementById(id); };
  var form = $("sal-form"); if (!form) return;
  function fmt(n) { return (n < 0 ? "-" : "") + "£" + Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  var PERIODS = [["year", "Yearly", 1], ["month", "Monthly", 12], ["4week", "4-weekly", 13], ["2week", "Fortnightly", 26], ["week", "Weekly", 52], ["day", "Daily", 0], ["hour", "Hourly", 0]];
  var sel = "month", last = null;
  function div(p, o) { return p[2] || (p[0] === "day" ? 52 * o.days : 52 * o.hours); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function read() {
    var per = $("sal-per").value, amt = num($("sal-amount").value), hours = num($("sal-hours").value), days = num($("sal-days").value);
    var mult = { hour: hours * 52, day: days * 52, week: 52, "2week": 26, "4week": 13, month: 12, year: 1 }[per];
    return { amt: amt, per: per, hours: hours, days: days, annual: amt * mult,
      region: $("sal-region").value, code: $("sal-code").value.trim(), loan: $("sal-loan").value, pg: $("sal-pg").checked,
      pen: num($("sal-pen").value), penUnit: $("sal-penunit").value, penMethod: $("sal-penm").value,
      bonus: num($("sal-bonus").value), overtime: num($("sal-ot").value), benefits: num($("sal-ben").value), ss: num($("sal-ss").value), other: num($("sal-oth").value) * 12,
      off: num($("sal-off").value), spa: $("sal-spa").checked };
  }
  function summaries(o, code) {
    $("acc-tax-m").textContent = (o.region === "sco" || (code && code.sco) ? "Scotland" : "Standard") + " · " + (code ? code.label : "check code");
    $("acc-loan-m").textContent = (o.loan === "0" ? "None" : "Plan " + o.loan) + (o.pg ? " + postgraduate" : "");
    $("acc-pen-m").textContent = o.pen > 0 ? (o.penUnit === "pct" ? o.pen + "%" : "£" + o.pen + " a month") : "None";
    $("acc-bo-m").textContent = o.bonus || o.overtime ? "Added" : "None";
    $("acc-be-m").textContent = o.benefits || o.ss || o.other ? "Added" : "None";
    $("acc-mo-m").textContent = (o.off ? o.off + " unpaid days" : "") + (o.spa ? (o.off ? " · " : "") + "No NI" : "") || "Default";
  }
  function go() {
    var o = read(), err = $("sal-err"), out = $("sal-out"), code = parseCode(o.code);
    summaries(o, code);
    var bad = null;
    if (!(o.amt >= 0) || !isFinite(o.annual)) bad = "Enter your pay.";
    else if (!(o.hours > 0 && o.hours <= 168) || !(o.days > 0 && o.days <= 7)) bad = "Hours per week must be 1 to 168 and days per week 1 to 7.";
    else if (!code) bad = "That tax code is not recognised. Try something like 1257L, BR, D0, K475 or S1257L, or leave it blank.";
    else if ([o.pen, o.bonus, o.overtime, o.benefits, o.ss, o.other, o.off].some(function (x) { return !isFinite(x) || x < 0; })) bad = "Use zero or positive numbers in the extra boxes.";
    else if (o.penUnit === "pct" && o.pen > 100) bad = "Pension percentage cannot be over 100.";
    if (bad) { err.textContent = bad; err.hidden = false; out.hidden = true; return; }
    err.hidden = true; out.hidden = false;
    var r = calc(o); last = { o: o, r: r }; render();
  }
  function render() {
    if (!last) return; var o = last.o, r = last.r, p = PERIODS.filter(function (x) { return x[0] === sel; })[0], d = div(p, o);
    var k = function (v) { return v / d; };
    $("sal-k").textContent = "Take-home pay · " + p[1].toLowerCase();
    $("sal-v").textContent = fmt(k(r.take));
    document.querySelectorAll("#sal-chips button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-p") === sel ? "true" : "false"); });
    var rows = [["Gross pay", r.gross, 1], ["Pension", -r.pen, r.pen > 0], ["Salary sacrifice", -r.ss, r.ss > 0], ["Income tax", -r.tax, 1], ["National Insurance", -r.ni, 1], ["Student loan", -r.sl, r.sl > 0], ["Other deductions", -r.other, r.other > 0], ["Take-home pay", r.take, 1, 1]];
    var dl = $("sal-rows"); dl.textContent = "";
    rows.forEach(function (x) { if (!x[2]) return; var row = el("div", "cr-row" + (x[3] ? " cr-total" : "")); row.appendChild(el("dt", null, x[0])); row.appendChild(el("dd", null, fmt(k(x[1])))); dl.appendChild(row); });
    var segs = [["take", r.take, "Take-home"], ["tax", r.tax, "Income tax"], ["ni", r.ni, "National Insurance"], ["sl", r.sl, "Student loan"], ["pen", r.pen + r.ss + r.other, "Pension and other"]], tot = segs.reduce(function (a, s) { return a + Math.max(0, s[1]); }, 0);
    var bar = $("sal-bar"), leg = $("sal-leg"); bar.textContent = ""; leg.textContent = "";
    segs.forEach(function (s) {
      if (!(s[1] > 0) || !(tot > 0)) return; var pc = s[1] / tot * 100;
      var b = el("span", "sb-" + s[0]); b.style.width = pc + "%"; b.title = s[2] + " " + pc.toFixed(1) + "%"; bar.appendChild(b);
      var li = el("li"); li.appendChild(el("i", "sb-" + s[0])); li.appendChild(el("span", null, s[2] + " " + pc.toFixed(0) + "%")); leg.appendChild(li);
    });
    var note = []; if (r.sco) note.push("Scottish income tax rates applied."); note.push("Tax allowance used: " + fmt(r.allowance).replace(".00", "") + ".");
    if (r.benefits) note.push("Taxable benefits of " + fmt(r.benefits).replace(".00", "") + " were added to taxable pay.");
    $("sal-note").textContent = note.join(" ") + " 2026/27 rates. An estimate: your payslip may differ.";
    /* conversion table */
    var tb = $("sal-tbl").tBodies[0]; tb.textContent = ""; var adj = o.off > 0;
    [["Hourly", 52 * o.hours], ["Daily", 52 * o.days], ["Weekly", 52], ["Fortnightly", 26], ["Monthly", 12], ["Quarterly", 4], ["Yearly", 1]].forEach(function (q, i) {
      var tr = el("tr"), th = el("th", null, q[0]); th.scope = "row"; tr.appendChild(th);
      tr.appendChild(el("td", null, fmt(o.annual / q[1])));
      if (adj) tr.appendChild(el("td", "sal-adj", fmt((i < 2 ? o.annual : r.base) / q[1])));
      tb.appendChild(tr);
    });
    document.querySelectorAll("#sal-tbl .sal-adj").forEach(function (n) { n.hidden = !adj; });
    var th = document.querySelector("#sal-tbl thead .sal-adj"); if (th) th.hidden = !adj;
  }
  /* chips */
  var chips = $("sal-chips");
  PERIODS.forEach(function (p) { var b = el("button", null, p[1]); b.type = "button"; b.setAttribute("data-p", p[0]); b.addEventListener("click", function () { sel = p[0]; render(); }); chips.appendChild(b); });
  form.addEventListener("input", go); form.addEventListener("change", go);
  $("sal-reset").addEventListener("click", function () {
    form.reset(); document.querySelectorAll("#sal-form details").forEach(function (d) { d.open = false; }); sel = "month"; go();
  });
  go();
})();
