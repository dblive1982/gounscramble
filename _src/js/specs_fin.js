
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
