/* GoUnscramble calculators. Each calculator is a small spec rendered into [data-calc]. Everything runs in the browser. */
(function () {
  "use strict";
  /* UK income tax and employee National Insurance, 2026/27, England, Wales and Northern Ireland. Shared with the salary page. */
  window.GUTax = function (g) {
    var pa = g <= 100000 ? 12570 : Math.max(0, 12570 - (g - 100000) / 2), ti = Math.max(0, g - pa), tax = 0;
    tax += Math.min(ti, 37700) * 0.2;
    if (ti > 37700) tax += (Math.min(ti, 125140) - 37700) * 0.4;
    if (ti > 125140) tax += (ti - 125140) * 0.45;
    var ni = 0;
    if (g > 12570) ni += (Math.min(g, 50270) - 12570) * 0.08;
    if (g > 50270) ni += (g - 50270) * 0.02;
    return { pa: pa, tax: tax, ni: ni, net: g - tax - ni };
  };
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
  function todayISO() {
    var d = new Date(), m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    if (!m) return null;
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  }
  var CUR = { id: "c", label: "Currency", t: "sel", opts: [["£", "£ Pound"], ["$", "$ Dollar"], ["€", "€ Euro"]], def: "£" };
  var YES = function () { return true; };

  /* body measurements shared by BMI and calorie calculators */
  function bodyFields() {
    return [
      { id: "u", label: "Units", t: "sel", opts: [["m", "Metric (cm, kg)"], ["i", "Imperial (ft/in, st/lb)"]], def: "m" },
      { id: "h1", label: function (v) { return v.u === "i" ? "Height (feet)" : "Height (cm)"; }, def: "170" },
      { id: "h2", label: "Height (inches)", def: "0", show: function (v) { return v.u === "i"; } },
      { id: "w1", label: function (v) { return v.u === "i" ? "Weight (stone)" : "Weight (kg)"; }, def: "70" },
      { id: "w2", label: "Weight (pounds)", def: "0", show: function (v) { return v.u === "i"; } }
    ];
  }
  function bodyMetric(v) {
    var h1 = num(v.h1), h2 = num(v.h2) || 0, w1 = num(v.w1), w2 = num(v.w2) || 0;
    if (v.u === "i") return { h: (h1 * 12 + h2) * 2.54, w: (w1 * 14 + w2) * 0.45359237 };
    return { h: h1, w: w1 };
  }

  /* ---------- calculator specs ---------- */
  var CALCS = {};

  CALCS.mortgage = {
    fields: [CUR,
      { id: "p", label: "Property price", def: "300000" },
      { id: "d", label: "Deposit", def: "60000" },
      { id: "r", label: "Interest rate (% a year)", def: "4.5" },
      { id: "t", label: "Term (years)", def: "25" }],
    run: function (v) {
      var P = num(v.p), D = num(v.d) || 0, r = num(v.r), t = num(v.t), L = P - D;
      if (!(P > 0) || !(t > 0) || !(r >= 0) || !(L > 0) || D < 0) return { err: "Enter a price, a deposit smaller than the price, a rate and a term." };
      var n = Math.round(t * 12), i = r / 1200;
      var pmt = i ? L * i / (1 - Math.pow(1 + i, -n)) : L / n;
      return {
        hero: ["Monthly payment", money(pmt, v.c)],
        rows: [["Amount borrowed", money(L, v.c)], ["Loan to value", fmt(L / P * 100, 1) + "%"],
          ["Total you repay", money(pmt * n, v.c)], ["Total interest", money(pmt * n - L, v.c)]],
        note: "Repayment mortgage with a fixed rate. Fees and rate changes are not included."
      };
    }
  };

  CALCS.loan = {
    fields: [CUR,
      { id: "p", label: "Loan amount", def: "10000" },
      { id: "r", label: "Interest rate (% a year)", def: "7.9" },
      { id: "t", label: "Term", def: "5" },
      { id: "u", label: "Term in", t: "sel", opts: [["y", "Years"], ["m", "Months"]], def: "y" }],
    run: function (v) {
      var P = num(v.p), r = num(v.r), t = num(v.t);
      if (!(P > 0) || !(t > 0) || !(r >= 0)) return { err: "Enter a loan amount, a rate and a term." };
      var n = Math.round(v.u === "y" ? t * 12 : t), i = r / 1200;
      var pmt = i ? P * i / (1 - Math.pow(1 + i, -n)) : P / n;
      return {
        hero: ["Monthly payment", money(pmt, v.c)],
        rows: [["Total you repay", money(pmt * n, v.c)], ["Total interest", money(pmt * n - P, v.c)], ["Number of payments", String(n)]],
        note: "Fixed rate, equal monthly payments."
      };
    }
  };

  CALCS["compound-interest"] = {
    fields: [CUR,
      { id: "p", label: "Starting amount", def: "5000" },
      { id: "m", label: "Add each month", def: "200" },
      { id: "r", label: "Interest rate (% a year)", def: "5" },
      { id: "t", label: "Years", def: "10" },
      { id: "f", label: "Compounded", t: "sel", opts: [["1", "Yearly"], ["4", "Quarterly"], ["12", "Monthly"], ["365", "Daily"]], def: "12" }],
    run: function (v) {
      var P = num(v.p) || 0, C = num(v.m) || 0, r = num(v.r), t = num(v.t), f = +v.f;
      if (!(t > 0) || !(r >= 0) || P < 0 || C < 0 || P + C <= 0) return { err: "Enter an amount, a rate and a number of years." };
      var n = Math.round(t * 12), i = Math.pow(1 + r / 100 / f, f / 12) - 1;
      var growth = Math.pow(1 + i, n), fv = P * growth + (i ? C * (growth - 1) / i : C * n);
      var put = P + C * n;
      return {
        hero: ["Final balance", money(fv, v.c)],
        rows: [["Total you put in", money(put, v.c)], ["Interest earned", money(fv - put, v.c)], ["Starting amount", money(P, v.c)]],
        note: "Monthly additions are made at the end of each month."
      };
    }
  };

  CALCS["simple-interest"] = {
    fields: [CUR,
      { id: "p", label: "Amount", def: "2000" },
      { id: "r", label: "Interest rate (% a year)", def: "3.5" },
      { id: "t", label: "Years", def: "4" }],
    run: function (v) {
      var P = num(v.p), r = num(v.r), t = num(v.t);
      if (!(P > 0) || !(r >= 0) || !(t > 0)) return { err: "Enter an amount, a rate and a number of years." };
      var I = P * r / 100 * t;
      return { hero: ["Interest", money(I, v.c)], rows: [["Total with interest", money(P + I, v.c)], ["Per year", money(I / t, v.c)]] };
    }
  };

  CALCS.vat = {
    fields: [CUR,
      { id: "a", label: "Amount", def: "100" },
      { id: "r", label: "VAT rate (%)", def: "20" },
      { id: "m", label: "The amount is", t: "sel", opts: [["ex", "Without VAT"], ["inc", "With VAT included"]], def: "ex" }],
    run: function (v) {
      var a = num(v.a), r = num(v.r);
      if (!(a >= 0) || !(r >= 0)) return { err: "Enter an amount and a VAT rate." };
      var net = v.m === "ex" ? a : a / (1 + r / 100), vat = net * r / 100;
      return {
        hero: [v.m === "ex" ? "Price with VAT" : "Price without VAT", money(v.m === "ex" ? net + vat : net, v.c)],
        rows: [["Without VAT", money(net, v.c)], ["VAT", money(vat, v.c)], ["With VAT", money(net + vat, v.c)]],
        note: "The standard UK VAT rate is 20%. The reduced rate is 5%."
      };
    }
  };

  CALCS.tip = {
    fields: [CUR,
      { id: "b", label: "Bill", def: "60" },
      { id: "t", label: "Tip (%)", def: "12.5" },
      { id: "n", label: "People", def: "2" }],
    run: function (v) {
      var b = num(v.b), t = num(v.t), n = Math.max(1, Math.round(num(v.n) || 1));
      if (!(b >= 0) || !(t >= 0)) return { err: "Enter a bill and a tip percentage." };
      var tip = b * t / 100;
      return {
        hero: ["Each person pays", money((b + tip) / n, v.c)],
        rows: [["Tip", money(tip, v.c)], ["Total", money(b + tip, v.c)], ["Tip each", money(tip / n, v.c)]]
      };
    }
  };

  CALCS.discount = {
    fields: [CUR,
      { id: "p", label: "Original price", def: "80" },
      { id: "d", label: "Discount (%)", def: "25" },
      { id: "e", label: "Extra off (%)", def: "0" }],
    run: function (v) {
      var p = num(v.p), d = num(v.d), e = num(v.e) || 0;
      if (!(p >= 0) || !(d >= 0) || d > 100 || e < 0 || e > 100) return { err: "Enter a price and a discount between 0 and 100." };
      var after = p * (1 - d / 100) * (1 - e / 100);
      return {
        hero: ["You pay", money(after, v.c)],
        rows: [["You save", money(p - after, v.c)], ["Total discount", fmt(p ? (1 - after / p) * 100 : 0, 1) + "%"]]
      };
    }
  };

  CALCS["percentage-change"] = {
    fields: [
      { id: "a", label: "From", def: "80" },
      { id: "b", label: "To", def: "100" }],
    run: function (v) {
      var a = num(v.a), b = num(v.b);
      if (isNaN(a) || isNaN(b) || a === 0) return { err: "Enter two numbers. The first cannot be zero." };
      var c = (b - a) / Math.abs(a) * 100;
      return {
        hero: [c >= 0 ? "Increase" : "Decrease", fmtg(Math.abs(c), 2) + "%"],
        rows: [["Difference", fmtg(b - a, 4)], ["New value is", fmtg(b / a * 100, 2) + "% of the old"]]
      };
    }
  };

  CALCS.percentage = {
    multi: [
      { title: "What is X% of Y?", fields: [{ id: "x", label: "X (%)", def: "15" }, { id: "y", label: "Y", def: "240" }],
        run: function (v) { var x = num(v.x), y = num(v.y); if (isNaN(x) || isNaN(y)) return { err: "Enter two numbers." }; return { hero: ["Answer", fmtg(x / 100 * y, 6)] }; } },
      { title: "X is what percent of Y?", fields: [{ id: "x", label: "X", def: "36" }, { id: "y", label: "Y", def: "240" }],
        run: function (v) { var x = num(v.x), y = num(v.y); if (isNaN(x) || !y) return { err: "Enter two numbers. Y cannot be zero." }; return { hero: ["Answer", fmtg(x / y * 100, 4) + "%"] }; } },
      { title: "Increase or decrease Y by X%", fields: [{ id: "x", label: "X (%)", def: "10" }, { id: "y", label: "Y", def: "200" }],
        run: function (v) { var x = num(v.x), y = num(v.y); if (isNaN(x) || isNaN(y)) return { err: "Enter two numbers." }; return { hero: ["Increased", fmtg(y * (1 + x / 100), 6)], rows: [["Decreased", fmtg(y * (1 - x / 100), 6)]] }; } }
    ]
  };

  CALCS.average = {
    fields: [{ id: "l", label: "Numbers (separate with commas, spaces or new lines)", t: "area", def: "12, 7, 9, 15, 7, 20" }],
    run: function (v) {
      var a = String(v.l).split(/[\s,;]+/).filter(Boolean).map(num);
      if (!a.length || a.some(isNaN)) return { err: "Enter some numbers, separated by commas or spaces." };
      var s = a.reduce(function (x, y) { return x + y; }, 0), sorted = a.slice().sort(function (x, y) { return x - y; }), n = a.length;
      var med = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
      var cnt = {}, best = 0; a.forEach(function (x) { cnt[x] = (cnt[x] || 0) + 1; best = Math.max(best, cnt[x]); });
      var modes = best > 1 ? Object.keys(cnt).filter(function (k) { return cnt[k] === best; }).map(Number).sort(function (x, y) { return x - y; }) : [];
      return {
        hero: ["Mean (average)", fmtg(s / n, 6)],
        rows: [["Median", fmtg(med, 6)], ["Mode", modes.length ? modes.map(function (m) { return fmtg(m); }).join(", ") : "None"],
          ["Sum", fmtg(s, 6)], ["Count", String(n)], ["Smallest", fmtg(sorted[0])], ["Largest", fmtg(sorted[n - 1])], ["Range", fmtg(sorted[n - 1] - sorted[0])]]
      };
    }
  };

  CALCS.age = {
    fields: [
      { id: "b", label: "Date of birth", t: "date", def: "1990-06-15" },
      { id: "a", label: "Age at", t: "date", def: "today" }],
    run: function (v) {
      var b = parseDate(v.b), a = parseDate(v.a);
      if (!b || !a) return { err: "Choose both dates." };
      if (a < b) return { err: "The birth date must be before the other date." };
      var y = a.getUTCFullYear() - b.getUTCFullYear(), m = a.getUTCMonth() - b.getUTCMonth(), d = a.getUTCDate() - b.getUTCDate();
      if (d < 0) { m--; d += new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), 0)).getUTCDate(); }
      if (m < 0) { y--; m += 12; }
      var days = Math.round((a - b) / 864e5);
      var next = new Date(Date.UTC(a.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()));
      if (next <= a) next = new Date(Date.UTC(a.getUTCFullYear() + 1, b.getUTCMonth(), b.getUTCDate()));
      return {
        hero: ["Age", y + " years, " + m + " months, " + d + " days"],
        rows: [["In months", fmtg(y * 12 + m, 0)], ["In weeks", fmtg(Math.floor(days / 7), 0)], ["In days", fmtg(days, 0)],
          ["Next birthday in", fmtg(Math.round((next - a) / 864e5), 0) + " days"]]
      };
    }
  };

  var DATEDIFF;
  DATEDIFF = {
    title: "Days between two dates", fields: [
      { id: "a", label: "From", t: "date", def: "today" },
      { id: "b", label: "To", t: "date", def: "2027-01-01" }],
    run: function (v) {
      var a = parseDate(v.a), b = parseDate(v.b);
      if (!a || !b) return { err: "Choose both dates." };
      var swap = b < a; if (swap) { var t = a; a = b; b = t; }
      var days = Math.round((b - a) / 864e5);
      var y = b.getUTCFullYear() - a.getUTCFullYear(), m = b.getUTCMonth() - a.getUTCMonth(), d = b.getUTCDate() - a.getUTCDate();
      if (d < 0) { m--; d += new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 0)).getUTCDate(); }
      if (m < 0) { y--; m += 12; }
      var wk = 0; for (var i = 0, c = new Date(a); i < days; i++) { var w = c.getUTCDay(); if (w !== 0 && w !== 6) wk++; c = new Date(c.getTime() + 864e5); }
      return {
        hero: ["Difference", fmtg(days, 0) + (days === 1 ? " day" : " days")],
        rows: [["As years, months, days", y + "y " + m + "m " + d + "d"], ["Weeks", fmtg(days / 7, 2)], ["Working days (Mon to Fri)", fmtg(wk, 0)], ["Hours", fmtg(days * 24, 0)]]
      };
    }
  };

  CALCS["date-calculator"] = { multi: [DATEDIFF, {
    title: "Add or subtract days", fields: [
      { id: "a", label: "Start date", t: "date", def: "today" },
      { id: "o", label: "Operation", t: "sel", opts: [["+", "Add"], ["-", "Subtract"]], def: "+" },
      { id: "n", label: "Days", def: "90" }],
    run: function (v) {
      var a = parseDate(v.a), n = num(v.n);
      if (!a || isNaN(n) || n < 0 || n > 100000) return { err: "Choose a date and enter a number of days." };
      var r = new Date(a.getTime() + (v.o === "+" ? n : -n) * 864e5);
      return { hero: ["Result", r.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })] };
    } }] };

  CALCS.bmi = {
    fields: bodyFields(),
    run: function (v) {
      var m = bodyMetric(v);
      if (!(m.h > 50 && m.h < 260) || !(m.w > 10 && m.w < 400)) return { err: "Enter your height and weight." };
      var hm = m.h / 100, bmi = m.w / (hm * hm);
      var cat = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy weight" : bmi < 30 ? "Overweight" : "Obese";
      return {
        hero: ["Your BMI", fmt(bmi, 1) + " · " + cat],
        rows: [["Healthy weight range", fmt(18.5 * hm * hm, 1) + " to " + fmt(24.9 * hm * hm, 1) + " kg"],
          ["In stone and pounds", Math.floor(m.w / 6.35029318) + " st " + fmt(m.w / 0.45359237 - Math.floor(m.w / 6.35029318) * 14, 1) + " lb"]],
        note: "BMI is a rough guide. It does not account for muscle, age or build, so speak to a health professional about your weight."
      };
    }
  };

  CALCS.calorie = {
    fields: [{ id: "s", label: "Sex", t: "sel", opts: [["f", "Female"], ["m", "Male"]], def: "f" },
      { id: "g", label: "Age", def: "35" }].concat(bodyFields(), [
      { id: "x", label: "Activity", t: "sel", opts: [["1.2", "Little or no exercise"], ["1.375", "Light, 1 to 3 days a week"], ["1.55", "Moderate, 3 to 5 days a week"], ["1.725", "Hard, 6 to 7 days a week"], ["1.9", "Very hard or physical job"]], def: "1.375" }]),
    run: function (v) {
      var m = bodyMetric(v), age = num(v.g);
      if (!(m.h > 50 && m.h < 260) || !(m.w > 10 && m.w < 400) || !(age > 14 && age < 100)) return { err: "Enter your age, height and weight." };
      var bmr = 10 * m.w + 6.25 * m.h - 5 * age + (v.s === "m" ? 5 : -161), tdee = bmr * (+v.x);
      return {
        hero: ["Calories to maintain weight", fmtg(Math.round(tdee), 0) + " a day"],
        rows: [["Basal metabolic rate (BMR)", fmtg(Math.round(bmr), 0) + " a day"], ["To lose about 0.5 kg a week", fmtg(Math.round(tdee - 500), 0) + " a day"],
          ["To gain about 0.5 kg a week", fmtg(Math.round(tdee + 500), 0) + " a day"]],
        note: "Uses the Mifflin-St Jeor equation. It is an estimate, not medical advice."
      };
    }
  };

  CALCS["fuel-cost"] = {
    fields: [CUR,
      { id: "s", label: "Units", t: "sel", opts: [["u", "UK (miles, mpg)"], ["m", "Metric (km, L/100km)"]], def: "u" },
      { id: "d", label: function (v) { return v.s === "m" ? "Distance (km)" : "Distance (miles)"; }, def: "120" },
      { id: "e", label: function (v) { return v.s === "m" ? "Fuel use (L per 100 km)" : "Fuel economy (mpg)"; }, def: "45" },
      { id: "p", label: "Fuel price per litre", def: "1.45" }],
    run: function (v) {
      var d = num(v.d), e = num(v.e), p = num(v.p);
      if (!(d > 0) || !(e > 0) || !(p >= 0)) return { err: "Enter a distance, fuel economy and fuel price." };
      var litres = v.s === "m" ? d * e / 100 : d / e * 4.54609, cost = litres * p;
      return {
        hero: ["Fuel cost", money(cost, v.c)],
        rows: [["Fuel used", fmt(litres, 1) + " litres"], ["Cost per " + (v.s === "m" ? "km" : "mile"), money(cost / d, v.c)]]
      };
    }
  };

  CALCS["speed-distance-time"] = {
    fields: [
      { id: "k", label: "Work out", t: "sel", opts: [["s", "Speed"], ["d", "Distance"], ["t", "Time"]], def: "s" },
      { id: "d", label: "Distance (miles)", def: "150", show: function (v) { return v.k !== "d"; } },
      { id: "s", label: "Speed (mph)", def: "60", show: function (v) { return v.k !== "s"; } },
      { id: "h", label: "Time (hours)", def: "2", show: function (v) { return v.k !== "t"; } },
      { id: "m", label: "Time (minutes)", def: "30", show: function (v) { return v.k !== "t"; } }],
    run: function (v) {
      var d = num(v.d), s = num(v.s), hrs = (num(v.h) || 0) + (num(v.m) || 0) / 60;
      if (v.k === "s") { if (!(d >= 0) || !(hrs > 0)) return { err: "Enter a distance and a time." }; return { hero: ["Speed", fmtg(d / hrs, 2) + " mph"], rows: [["In km/h", fmtg(d / hrs * 1.609344, 2)]] }; }
      if (v.k === "d") { if (!(s >= 0) || !(hrs > 0)) return { err: "Enter a speed and a time." }; return { hero: ["Distance", fmtg(s * hrs, 2) + " miles"], rows: [["In kilometres", fmtg(s * hrs * 1.609344, 2)]] }; }
      if (!(d >= 0) || !(s > 0)) return { err: "Enter a distance and a speed." };
      var t = d / s, h = Math.floor(t), mm = Math.round((t - h) * 60);
      if (mm === 60) { h++; mm = 0; }
      return { hero: ["Time", h + " h " + mm + " min"], rows: [["In hours", fmtg(t, 3)]] };
    }
  };

  CALCS["random-number"] = {
    again: "Generate again",
    fields: [
      { id: "a", label: "Smallest", def: "1" },
      { id: "b", label: "Largest", def: "100" },
      { id: "n", label: "How many", def: "5" },
      { id: "u", label: "Repeats", t: "sel", opts: [["y", "Allow repeats"], ["n", "No repeats"]], def: "n" }],
    run: function (v) {
      var a = Math.ceil(num(v.a)), b = Math.floor(num(v.b)), n = Math.round(num(v.n));
      if (isNaN(a) || isNaN(b) || b < a || !(n >= 1) || n > 1000) return { err: "Enter a smallest and largest number, and how many to pick (up to 1000)." };
      if (v.u === "n" && n > b - a + 1) return { err: "There are not enough different numbers in that range." };
      var out = [], seen = {}, buf = new Uint32Array(1);
      function rnd(max) { var lim = Math.floor(4294967296 / max) * max, x; do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= lim); return x % max; }
      while (out.length < n) { var x = a + rnd(b - a + 1); if (v.u === "n") { if (seen[x]) continue; seen[x] = 1; } out.push(x); }
      return { hero: [n === 1 ? "Your number" : "Your numbers", out.join(", ")] };
    }
  };


  CALCS["sales-tax"] = { fields: CALCS.vat.fields.map(function (f) { return f.id === "r" ? { id: "r", label: "Sales tax rate (%)", def: "8" } : f.id === "m" ? { id: "m", label: "The amount is", t: "sel", opts: [["ex", "Before tax"], ["inc", "Tax included"]], def: "ex" } : f; }),
    run: function (v) {
      var a = num(v.a), r = num(v.r);
      if (!(a >= 0) || !(r >= 0)) return { err: "Enter an amount and a tax rate." };
      var net = v.m === "ex" ? a : a / (1 + r / 100), tax = net * r / 100;
      return { hero: [v.m === "ex" ? "Total with tax" : "Price before tax", money(v.m === "ex" ? net + tax : net, v.c)], rows: [["Before tax", money(net, v.c)], ["Tax", money(tax, v.c)], ["With tax", money(net + tax, v.c)]] };
    } };

  CALCS["auto-loan"] = {
    fields: [CUR,
      { id: "p", label: "Car price", def: "18000" },
      { id: "d", label: "Deposit or trade-in", def: "3000" },
      { id: "r", label: "Interest rate (% a year)", def: "8.9" },
      { id: "t", label: "Term (months)", def: "48" }],
    run: function (v) {
      var P = num(v.p), D = num(v.d) || 0, r = num(v.r), n = Math.round(num(v.t)), L = P - D;
      if (!(P > 0) || D < 0 || !(L > 0) || !(r >= 0) || !(n > 0)) return { err: "Enter a price, a deposit below the price, a rate and a number of months." };
      var i = r / 1200, pmt = i ? L * i / (1 - Math.pow(1 + i, -n)) : L / n;
      return { hero: ["Monthly payment", money(pmt, v.c)], rows: [["Amount financed", money(L, v.c)], ["Total interest", money(pmt * n - L, v.c)], ["Total cost including deposit", money(pmt * n + D, v.c)]] };
    }
  };

  CALCS["interest-rate"] = {
    fields: [CUR,
      { id: "p", label: "Loan amount", def: "10000" },
      { id: "m", label: "Monthly payment", def: "200" },
      { id: "t", label: "Term (months)", def: "60" }],
    run: function (v) {
      var P = num(v.p), M = num(v.m), n = Math.round(num(v.t));
      if (!(P > 0) || !(M > 0) || !(n > 0)) return { err: "Enter a loan amount, a monthly payment and a number of months." };
      if (M * n < P) return { err: "Those payments add up to less than the loan, so the rate would be negative." };
      var lo = 0, hi = 1, i;
      function pay(x) { return x ? P * x / (1 - Math.pow(1 + x, -n)) : P / n; }
      for (var k = 0; k < 200; k++) { i = (lo + hi) / 2; if (pay(i) < M) lo = i; else hi = i; }
      return { hero: ["Interest rate", fmt(i * 1200, 3) + "% a year"], rows: [["Total you repay", money(M * n, v.c)], ["Total interest", money(M * n - P, v.c)]], note: "Nominal annual rate, compounded monthly." };
    }
  };

  CALCS.amortization = {
    fields: [CUR,
      { id: "p", label: "Loan amount", def: "200000" },
      { id: "r", label: "Interest rate (% a year)", def: "4.5" },
      { id: "t", label: "Term (years)", def: "25" }],
    run: function (v) {
      var P = num(v.p), r = num(v.r), t = num(v.t);
      if (!(P > 0) || !(r >= 0) || !(t > 0) || t > 60) return { err: "Enter a loan amount, a rate and a term of up to 60 years." };
      var n = Math.round(t * 12), i = r / 1200, pmt = i ? P * i / (1 - Math.pow(1 + i, -n)) : P / n, bal = P, rows = [], yi = 0, yp = 0, tot = 0;
      for (var k = 1; k <= n; k++) {
        var it = bal * i, pr = Math.min(pmt - it, bal); bal -= pr; yi += it; yp += pr; tot += it;
        if (k % 12 === 0 || k === n) { rows.push(["" + Math.ceil(k / 12), money(yp, v.c), money(yi, v.c), money(Math.max(bal, 0), v.c)]); yi = 0; yp = 0; }
      }
      return { hero: ["Monthly payment", money(pmt, v.c)], rows: [["Total interest", money(tot, v.c)], ["Total you repay", money(P + tot, v.c)]],
        table: { head: ["Year", "Principal paid", "Interest paid", "Balance"], rows: rows } };
    }
  };

  CALCS.inflation = {
    fields: [CUR,
      { id: "a", label: "Amount today", def: "1000" },
      { id: "r", label: "Inflation rate (% a year)", def: "3" },
      { id: "t", label: "Years", def: "10" }],
    run: function (v) {
      var a = num(v.a), r = num(v.r), t = num(v.t);
      if (!(a >= 0) || isNaN(r) || !(t > 0)) return { err: "Enter an amount, an inflation rate and a number of years." };
      var f = Math.pow(1 + r / 100, t);
      return { hero: ["Cost in " + fmtg(t, 2) + " years", money(a * f, v.c)], rows: [["What " + money(a, v.c) + " will buy then (today's money)", money(a / f, v.c)], ["Total price rise", fmt((f - 1) * 100, 1) + "%"]] };
    }
  };

  CALCS.retirement = {
    fields: [CUR,
      { id: "a", label: "Your age now", def: "35" },
      { id: "z", label: "Retire at age", def: "67" },
      { id: "s", label: "Savings so far", def: "20000" },
      { id: "m", label: "Add each month", def: "400" },
      { id: "r", label: "Growth (% a year)", def: "5" }],
    run: function (v) {
      var a = num(v.a), z = num(v.z), S = num(v.s) || 0, C = num(v.m) || 0, r = num(v.r);
      if (!(a >= 16) || !(z > a) || z > 100 || S < 0 || C < 0 || isNaN(r)) return { err: "Enter your age, a later retirement age, and your savings." };
      var n = Math.round((z - a) * 12), i = Math.pow(1 + r / 100, 1 / 12) - 1, g = Math.pow(1 + i, n);
      var fv = S * g + (i ? C * (g - 1) / i : C * n), put = S + C * n;
      return { hero: ["Pot at " + fmtg(z, 0), money(fv, v.c)], rows: [["You paid in", money(put, v.c)], ["Growth", money(fv - put, v.c)], ["Income at a 4% yearly withdrawal", money(fv * 0.04 / 12, v.c) + " a month"]],
        note: "Not adjusted for inflation. The 4% figure is a common rule of thumb, not a guarantee." };
    }
  };

  CALCS["income-tax"] = {
    fields: [{ id: "g", label: "Yearly income (£)", def: "45000" }],
    run: function (v) {
      var g = num(v.g);
      if (!(g >= 0)) return { err: "Enter your yearly income." };
      var t = GUTax(g);
      return { hero: ["Take-home pay", money(t.net, "£") + " a year"],
        rows: [["Income tax", money(t.tax, "£")], ["National Insurance", money(t.ni, "£")], ["Tax-free allowance", money(t.pa, "£")], ["Per month", money(t.net / 12, "£")], ["Per week", money(t.net / 52, "£")], ["Overall rate", fmt(g ? (t.tax + t.ni) / g * 100 : 0, 1) + "%"]],
        note: "2026/27, England, Wales and Northern Ireland, for an employee. Pension, student loan, tax codes and Scottish rates are not included." };
    }
  };

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  CALCS.fraction = {
    fields: [
      { id: "a", label: "Top (numerator)", def: "3" }, { id: "b", label: "Bottom (denominator)", def: "4" },
      { id: "o", label: "Operation", t: "sel", opts: [["+", "Add (+)"], ["-", "Subtract (−)"], ["*", "Multiply (×)"], ["/", "Divide (÷)"]], def: "+" },
      { id: "c", label: "Top (numerator)", def: "2" }, { id: "d", label: "Bottom (denominator)", def: "3" }],
    run: function (v) {
      var a = num(v.a), b = num(v.b), c = num(v.c), d = num(v.d);
      if ([a, b, c, d].some(function (x) { return !isFinite(x) || Math.floor(x) !== x; })) return { err: "Use whole numbers in each box." };
      if (!b || !d) return { err: "A bottom number cannot be zero." };
      var n, m;
      if (v.o === "+") { n = a * d + c * b; m = b * d; } else if (v.o === "-") { n = a * d - c * b; m = b * d; }
      else if (v.o === "*") { n = a * c; m = b * d; } else { if (!c) return { err: "You cannot divide by zero." }; n = a * d; m = b * c; }
      if (m < 0) { n = -n; m = -m; }
      var g = gcd(n, m) || 1, sn = n / g, sm = m / g, whole = Math.trunc(sn / sm), rem = Math.abs(sn % sm);
      var out = sm === 1 ? String(sn) : sn + "/" + sm;
      return { hero: ["Answer", out], rows: [["As a decimal", fmtg(n / m, 8)], ["As a mixed number", rem && Math.abs(whole) ? whole + " " + rem + "/" + sm : out], ["Before simplifying", n + "/" + m]] };
    }
  };

  CALCS["standard-deviation"] = {
    fields: [{ id: "l", label: "Numbers (separate with commas, spaces or new lines)", t: "area", def: "4, 8, 6, 5, 3, 7, 9" }],
    run: function (v) {
      var a = String(v.l).split(/[\s,;]+/).filter(Boolean).map(num);
      if (a.length < 2 || a.some(isNaN)) return { err: "Enter at least two numbers." };
      var n = a.length, mean = a.reduce(function (x, y) { return x + y; }, 0) / n, ss = a.reduce(function (x, y) { return x + (y - mean) * (y - mean); }, 0);
      return { hero: ["Sample standard deviation", fmtg(Math.sqrt(ss / (n - 1)), 6)],
        rows: [["Population standard deviation", fmtg(Math.sqrt(ss / n), 6)], ["Sample variance", fmtg(ss / (n - 1), 6)], ["Population variance", fmtg(ss / n, 6)], ["Mean", fmtg(mean, 6)], ["Count", String(n)]],
        note: "Use the sample figure when your numbers are a sample of a bigger group. Use the population figure when they are the whole group." };
    }
  };

  CALCS.triangle = {
    fields: [{ id: "a", label: "Side a", def: "3" }, { id: "b", label: "Side b", def: "4" }, { id: "c", label: "Side c", def: "5" }],
    run: function (v) {
      var a = num(v.a), b = num(v.b), c = num(v.c);
      if (!(a > 0) || !(b > 0) || !(c > 0)) return { err: "Enter the length of all three sides." };
      if (a + b >= c + 1e-12 === false || a + c <= b || b + c <= a || a + b <= c) return { err: "Those sides cannot make a triangle. Any two sides must add up to more than the third." };
      var s = (a + b + c) / 2, area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
      function ang(x, y, z) { return Math.acos(Math.max(-1, Math.min(1, (y * y + z * z - x * x) / (2 * y * z)))) * 180 / Math.PI; }
      var A = ang(a, b, c), B = ang(b, a, c), C = 180 - A - B;
      var kind = (a === b && b === c) ? "Equilateral" : (a === b || b === c || a === c) ? "Isosceles" : "Scalene";
      var right = Math.abs(Math.max(a, b, c) * Math.max(a, b, c) * 2 - (a * a + b * b + c * c)) < 1e-9 * (a * a + b * b + c * c);
      return { hero: ["Area", fmtg(area, 6)], rows: [["Perimeter", fmtg(a + b + c, 6)], ["Angle A", fmt(A, 2) + "°"], ["Angle B", fmt(B, 2) + "°"], ["Angle C", fmt(C, 2) + "°"], ["Type", kind + (right ? ", right-angled" : "")]] };
    }
  };

  CALCS["body-fat"] = {
    fields: [{ id: "s", label: "Sex", t: "sel", opts: [["m", "Male"], ["f", "Female"]], def: "m" },
      { id: "u", label: "Measure in", t: "sel", opts: [["c", "Centimetres"], ["i", "Inches"]], def: "c" },
      { id: "h", label: "Height", def: "178" }, { id: "n", label: "Neck", def: "38" }, { id: "w", label: "Waist (at the navel)", def: "86" },
      { id: "p", label: "Hips (widest point)", def: "98", show: function (v) { return v.s === "f"; } }],
    run: function (v) {
      var k = v.u === "i" ? 2.54 : 1, h = num(v.h) * k, n = num(v.n) * k, w = num(v.w) * k, p = (num(v.p) || 0) * k;
      if (!(h > 100) || !(n > 10) || !(w > 30) || (v.s === "f" && !(p > 30))) return { err: "Enter your height and measurements." };
      var d = v.s === "m" ? w - n : w + p - n;
      if (!(d > 0)) return { err: "The waist must be larger than the neck. Check your measurements." };
      var bf = v.s === "m" ? 495 / (1.0324 - 0.19077 * Math.log10(d) + 0.15456 * Math.log10(h)) - 450 : 495 / (1.29579 - 0.35004 * Math.log10(d) + 0.221 * Math.log10(h)) - 450;
      if (!(bf > 0 && bf < 70)) return { err: "Those measurements give an unusual result. Check them and try again." };
      var cat;
      if (v.s === "m") cat = bf < 6 ? "Essential fat" : bf < 14 ? "Athletic" : bf < 18 ? "Fit" : bf < 25 ? "Average" : "Above average";
      else cat = bf < 14 ? "Essential fat" : bf < 21 ? "Athletic" : bf < 25 ? "Fit" : bf < 32 ? "Average" : "Above average";
      return { hero: ["Body fat", fmt(bf, 1) + "%"], rows: [["Range", cat]], note: "Estimated with the US Navy tape method. It is a guide, and can be off by a few percent." };
    }
  };

  CALCS.bmr = {
    fields: CALCS.calorie.fields.slice(0, 7),
    run: function (v) {
      var m = bodyMetric(v), age = num(v.g);
      if (!(m.h > 50 && m.h < 260) || !(m.w > 10 && m.w < 400) || !(age > 14 && age < 100)) return { err: "Enter your age, height and weight." };
      var bmr = 10 * m.w + 6.25 * m.h - 5 * age + (v.s === "m" ? 5 : -161);
      return { hero: ["Basal metabolic rate", fmtg(Math.round(bmr), 0) + " calories a day"], rows: [["In kilojoules", fmtg(Math.round(bmr * 4.184), 0) + " kJ a day"], ["Per hour", fmtg(Math.round(bmr / 24), 0) + " calories"]],
        note: "Calories your body burns at rest, using the Mifflin-St Jeor equation." };
    }
  };

  CALCS["ideal-weight"] = {
    fields: [{ id: "s", label: "Sex", t: "sel", opts: [["f", "Female"], ["m", "Male"]], def: "f" }].concat(bodyFields().slice(0, 3)),
    run: function (v) {
      var m = bodyMetric({ u: v.u, h1: v.h1, h2: v.h2, w1: 70, w2: 0 }), inch = m.h / 2.54, over = Math.max(0, inch - 60), male = v.s === "m";
      if (!(m.h > 120 && m.h < 230)) return { err: "Enter a height between about 4 ft and 7 ft 6 in (120 to 230 cm)." };
      var devine = (male ? 50 : 45.5) + 2.3 * over, robinson = (male ? 52 : 49) + (male ? 1.9 : 1.7) * over, miller = (male ? 56.2 : 53.1) + (male ? 1.41 : 1.36) * over, hamwi = (male ? 48 : 45.4) + (male ? 2.7 : 2.2) * over;
      var hm = m.h / 100, avg = (devine + robinson + miller + hamwi) / 4;
      function st(k) { return Math.floor(k / 6.35029318) + " st " + fmt(k / 0.45359237 - Math.floor(k / 6.35029318) * 14, 0) + " lb"; }
      return { hero: ["Ideal weight (average of four formulas)", fmt(avg, 1) + " kg · " + st(avg)],
        rows: [["Devine", fmt(devine, 1) + " kg"], ["Robinson", fmt(robinson, 1) + " kg"], ["Miller", fmt(miller, 1) + " kg"], ["Hamwi", fmt(hamwi, 1) + " kg"], ["Healthy BMI range", fmt(18.5 * hm * hm, 1) + " to " + fmt(24.9 * hm * hm, 1) + " kg"]],
        note: "Formulas give a rough target only. Build, age and muscle all matter." };
    }
  };

  CALCS.pace = {
    fields: [
      { id: "d", label: "Distance", def: "10" },
      { id: "u", label: "Distance unit", t: "sel", opts: [["k", "Kilometres"], ["m", "Miles"]], def: "k" },
      { id: "h", label: "Hours", def: "0" }, { id: "m", label: "Minutes", def: "50" }, { id: "s", label: "Seconds", def: "0" }],
    run: function (v) {
      var d = num(v.d), sec = (num(v.h) || 0) * 3600 + (num(v.m) || 0) * 60 + (num(v.s) || 0);
      if (!(d > 0) || !(sec > 0)) return { err: "Enter a distance and a time." };
      var km = v.u === "k" ? d : d * 1.609344;
      function mmss(x) { x = Math.round(x); return Math.floor(x / 60) + ":" + (x % 60 < 10 ? "0" : "") + (x % 60); }
      return { hero: ["Pace", mmss(sec / km) + " per km"], rows: [["Per mile", mmss(sec / (km / 1.609344))], ["Speed", fmt(km / (sec / 3600), 2) + " km/h"], ["Speed in mph", fmt(km / 1.609344 / (sec / 3600), 2) + " mph"]] };
    }
  };

  CALCS["due-date"] = {
    fields: [{ id: "l", label: "First day of your last period", t: "date", def: "today" },
      { id: "c", label: "Cycle length (days)", def: "28" }],
    run: function (v) {
      var l = parseDate(v.l), c = num(v.c);
      if (!l || !(c >= 21 && c <= 45)) return { err: "Choose a date and a cycle length between 21 and 45 days." };
      var due = new Date(l.getTime() + (280 + c - 28) * 864e5), conc = new Date(l.getTime() + (c - 14) * 864e5), tri = new Date(l.getTime() + 13 * 7 * 864e5);
      var today = parseDate(todayISO()), ga = Math.floor((today - l) / 864e5);
      function d(x) { return x.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }); }
      var rows = [["Likely conception", d(conc)], ["End of first trimester (13 weeks)", d(tri)]];
      if (ga >= 0 && ga <= 300) rows.push(["Today", Math.floor(ga / 7) + " weeks, " + (ga % 7) + " days"]);
      return { hero: ["Estimated due date", d(due)], rows: rows, note: "Only about 1 in 20 babies arrive on the due date. Your midwife or doctor will confirm yours." };
    }
  };

  CALCS.time = {
    fields: [
      { id: "o", label: "Operation", t: "sel", opts: [["+", "Add"], ["-", "Subtract"]], def: "+" },
      { id: "a", label: "First: days", def: "0" }, { id: "b", label: "hours", def: "5" }, { id: "c", label: "minutes", def: "45" }, { id: "d", label: "seconds", def: "0" },
      { id: "e", label: "Second: days", def: "0" }, { id: "f", label: "hours", def: "2" }, { id: "g", label: "minutes", def: "30" }, { id: "h", label: "seconds", def: "30" }],
    run: function (v) {
      var x = [v.a, v.b, v.c, v.d, v.e, v.f, v.g, v.h].map(function (q) { return num(q) || 0; });
      if (x.some(function (q) { return q < 0; })) return { err: "Use zero or positive numbers." };
      var t1 = x[0] * 86400 + x[1] * 3600 + x[2] * 60 + x[3], t2 = x[4] * 86400 + x[5] * 3600 + x[6] * 60 + x[7], r = v.o === "+" ? t1 + t2 : t1 - t2, neg = r < 0; r = Math.abs(Math.round(r));
      var dd = Math.floor(r / 86400), hh = Math.floor(r % 86400 / 3600), mm = Math.floor(r % 3600 / 60), ss = r % 60;
      return { hero: ["Result", (neg ? "-" : "") + dd + " d " + hh + " h " + mm + " m " + ss + " s"], rows: [["Total hours", (neg ? "-" : "") + fmtg(r / 3600, 4)], ["Total minutes", (neg ? "-" : "") + fmtg(r / 60, 2)], ["Total seconds", (neg ? "-" : "") + fmtg(r, 0)]] };
    }
  };

  CALCS.hours = {
    fields: [{ id: "a", label: "Start time", t: "time", def: "09:00" }, { id: "b", label: "End time", t: "time", def: "17:30" },
      { id: "k", label: "Unpaid break (minutes)", def: "30" }, { id: "r", label: "Pay per hour (optional)", def: "" }, CUR],
    run: function (v) {
      var m1 = /^(\d\d):(\d\d)$/.exec(v.a), m2 = /^(\d\d):(\d\d)$/.exec(v.b), k = num(v.k) || 0;
      if (!m1 || !m2) return { err: "Choose a start and an end time." };
      var s = +m1[1] * 60 + +m1[2], e = +m2[1] * 60 + +m2[2];
      if (e <= s) e += 1440;
      var mins = e - s - k;
      if (mins < 0) return { err: "The break is longer than the time worked." };
      var rate = num(v.r), rows = [["Decimal hours", fmt(mins / 60, 2)], ["Minutes", fmtg(mins, 0)]];
      if (rate > 0) rows.push(["Pay for the shift", money(rate * mins / 60, v.c)]);
      return { hero: ["Time worked", Math.floor(mins / 60) + " h " + (mins % 60) + " min"], rows: rows, note: "If the end time is earlier than the start, the shift runs past midnight." };
    }
  };

  var GRADES = { "A+": 4.0, A: 4.0, "A-": 3.7, "B+": 3.3, B: 3.0, "B-": 2.7, "C+": 2.3, C: 2.0, "C-": 1.7, "D+": 1.3, D: 1.0, "D-": 0.7, F: 0 };
  CALCS.gpa = {
    fields: [{ id: "l", label: "One course per line: grade, then credits (like  A- 3  or  B 4)", t: "area", def: "A 3\nB+ 4\nA- 3\nC 2" }],
    run: function (v) {
      var lines = String(v.l).split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean), pts = 0, cr = 0;
      for (var i = 0; i < lines.length; i++) {
        var m = /^([A-Fa-f][+-]?|\d(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/.exec(lines[i]);
        if (!m) return { err: "Line " + (i + 1) + " should look like A- 3 (grade, then credits)." };
        var g = isNaN(m[1]) ? GRADES[m[1].toUpperCase()] : +m[1];
        if (g == null || g > 4.0) return { err: "Line " + (i + 1) + ": use a grade from A+ to F, or a number up to 4." };
        pts += g * +m[2]; cr += +m[2];
      }
      if (!(cr > 0)) return { err: "Enter at least one course with credits." };
      return { hero: ["GPA", fmt(pts / cr, 2)], rows: [["Total credits", fmtg(cr, 2)], ["Quality points", fmt(pts, 2)]], note: "On the US 4.0 scale." };
    }
  };

  CALCS.grade = {
    multi: [
      { title: "Weighted grade", fields: [{ id: "l", label: "One item per line: score, then weight % (like  85 30)", t: "area", def: "88 20\n76 30\n91 50" }],
        run: function (v) {
          var lines = String(v.l).split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean), s = 0, w = 0;
          for (var i = 0; i < lines.length; i++) {
            var m = /^(\d+(?:\.\d+)?)\s*%?\s+(\d+(?:\.\d+)?)\s*%?$/.exec(lines[i]);
            if (!m) return { err: "Line " + (i + 1) + " should look like 85 30 (score, then weight)." };
            s += +m[1] * +m[2]; w += +m[2];
          }
          if (!(w > 0)) return { err: "Enter at least one score and its weight." };
          return { hero: ["Weighted grade", fmt(s / w, 2) + "%"], rows: [["Weight counted so far", fmtg(w, 2) + "%"]] };
        } },
      { title: "What do I need on the final?", fields: [{ id: "c", label: "Current grade (%)", def: "78" }, { id: "w", label: "Final counts for (%)", def: "30" }, { id: "t", label: "Grade you want (%)", def: "85" }],
        run: function (v) {
          var c = num(v.c), w = num(v.w), t = num(v.t);
          if (isNaN(c) || !(w > 0 && w <= 100) || isNaN(t)) return { err: "Enter your current grade, the final's weight and your target." };
          var need = (t - c * (1 - w / 100)) / (w / 100);
          return { hero: ["Score needed on the final", fmt(need, 1) + "%"], rows: [], note: need > 100 ? "That is above 100%, so the target may not be reachable." : need < 0 ? "You already meet your target." : "" };
        } }
    ]
  };

  CALCS.concrete = {
    fields: [{ id: "l", label: "Length (m)", def: "4" }, { id: "w", label: "Width (m)", def: "3" }, { id: "d", label: "Depth (cm)", def: "10" }, { id: "x", label: "Extra for waste (%)", def: "10" }],
    run: function (v) {
      var l = num(v.l), w = num(v.w), d = num(v.d), x = num(v.x) || 0;
      if (!(l > 0) || !(w > 0) || !(d > 0) || x < 0) return { err: "Enter a length, width and depth." };
      var vol = l * w * d / 100, tot = vol * (1 + x / 100);
      return { hero: ["Concrete needed", fmt(tot, 2) + " m³"], rows: [["Exact volume", fmt(vol, 2) + " m³"], ["Weight (about)", fmt(tot * 2.4, 2) + " tonnes"], ["20 kg bags of mix (about)", fmtg(Math.ceil(tot / 0.009), 0)]],
        note: "Bags assume about 0.009 m³ each. Always check the yield on the bag and order a little extra." };
    }
  };

  CALCS.subnet = {
    fields: [{ id: "i", label: "IPv4 address", def: "192.168.1.10" }, { id: "p", label: "Prefix length (0 to 32)", def: "24" }],
    run: function (v) {
      var m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(String(v.i).trim()), p = num(v.p);
      if (!m || m.slice(1).some(function (o) { return +o > 255; }) || !(p >= 0 && p <= 32) || Math.floor(p) !== p) return { err: "Enter a valid IPv4 address and a prefix from 0 to 32." };
      var ip = ((+m[1] << 24) >>> 0) + (+m[2] << 16) + (+m[3] << 8) + +m[4], mask = p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0;
      var net = (ip & mask) >>> 0, bc = (net | (~mask >>> 0)) >>> 0;
      function q(n) { return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join("."); }
      var hosts = p >= 31 ? (p === 32 ? 1 : 2) : Math.pow(2, 32 - p) - 2;
      return { hero: ["Network address", q(net) + "/" + p], rows: [["Subnet mask", q(mask)], ["Broadcast address", q(bc)], ["First usable", q(p >= 31 ? net : net + 1)], ["Last usable", q(p >= 31 ? bc : bc - 1)], ["Usable hosts", fmtg(hosts, 0)]] };
    }
  };

  CALCS.password = {
    again: "Generate new password",
    fields: [{ id: "n", label: "Length", def: "16" },
      { id: "o", label: "Characters", t: "sel", opts: [["all", "Letters, numbers and symbols"], ["alnum", "Letters and numbers"], ["letters", "Letters only"], ["digits", "Numbers only"]], def: "all" }],
    run: function (v) {
      var n = Math.round(num(v.n));
      if (!(n >= 4 && n <= 128)) return { err: "Choose a length from 4 to 128." };
      var sets = { all: ["abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "0123456789", "!@#$%^&*()-_=+[]{};:,.?"], alnum: ["abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "0123456789"], letters: ["abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"], digits: ["0123456789"] }[v.o];
      var all = sets.join(""), buf = new Uint32Array(1);
      function rnd(max) { var lim = Math.floor(4294967296 / max) * max, x; do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= lim); return x % max; }
      var out = []; sets.forEach(function (s) { if (out.length < n) out.push(s[rnd(s.length)]); });
      while (out.length < n) out.push(all[rnd(all.length)]);
      for (var i = out.length - 1; i > 0; i--) { var j = rnd(i + 1), t = out[i]; out[i] = out[j]; out[j] = t; }
      return { hero: ["Your password", out.join("")], rows: [["Strength", fmt(n * Math.log2(all.length), 0) + " bits"]], note: "Made in your browser with secure random numbers. It is never sent anywhere." };
    }
  };

  /* ---------- generic renderer ---------- */
  function buildForm(box, spec, onChange) {
    var fields = spec.fields, vals = {}, nodes = {};
    var grid = el("div", "cf-grid");
    fields.forEach(function (f) {
      var wrap = el("div", "cf" + (f.t === "area" ? " cf-wide" : "")), lab = el("label", null, ""), ctl;
      var id = "cf-" + (spec._k || "x") + "-" + f.id;
      lab.setAttribute("for", id);
      if (f.t === "sel") {
        ctl = el("select", "field");
        f.opts.forEach(function (o) { var op = el("option", null, o[1]); op.value = o[0]; ctl.appendChild(op); });
      } else if (f.t === "area") { ctl = el("textarea", "field"); ctl.rows = 3; ctl.spellcheck = false; }
      else if (f.t === "date" || f.t === "time") { ctl = el("input", "field"); ctl.type = f.t; }
      else { ctl = el("input", "field"); ctl.type = "text"; ctl.inputMode = "decimal"; ctl.autocomplete = "off"; }
      ctl.id = id;
      var def = f.def === "today" ? todayISO() : f.def;
      ctl.value = def; vals[f.id] = def;
      ctl.addEventListener("input", onChange); ctl.addEventListener("change", onChange);
      wrap.appendChild(lab); wrap.appendChild(ctl); grid.appendChild(wrap);
      nodes[f.id] = { wrap: wrap, lab: lab, ctl: ctl, f: f };
    });
    box.appendChild(grid);
    return {
      read: function () {
        var v = {};
        fields.forEach(function (f) { v[f.id] = nodes[f.id].ctl.value; });
        fields.forEach(function (f) {
          var n = nodes[f.id];
          n.wrap.hidden = !!(f.show && !f.show(v));
          n.lab.textContent = typeof f.label === "function" ? f.label(v) : f.label;
        });
        return v;
      }
    };
  }
  function paint(out, r) {
    out.textContent = "";
    if (r.err) { var e = el("p", "cr-err", r.err); out.appendChild(e); return; }
    var hero = el("div", "cr-hero");
    hero.appendChild(el("span", "cr-k", r.hero[0]));
    hero.appendChild(el("b", "cr-v", r.hero[1]));
    out.appendChild(hero);
    if (r.rows && r.rows.length) {
      var dl = el("dl", "cr-rows");
      r.rows.forEach(function (x) { var row = el("div", "cr-row"); row.appendChild(el("dt", null, x[0])); row.appendChild(el("dd", null, x[1])); dl.appendChild(row); });
      out.appendChild(dl);
    }
    if (r.table) {
      var w = el("div", "cr-tw"), t = el("table", "cr-t"), th = el("thead"), tr = el("tr");
      r.table.head.forEach(function (h) { tr.appendChild(el("th", null, h)); }); th.appendChild(tr); t.appendChild(th);
      var tb = el("tbody"); r.table.rows.forEach(function (rw) { var x = el("tr"); rw.forEach(function (c) { x.appendChild(el("td", null, c)); }); tb.appendChild(x); });
      t.appendChild(tb); w.appendChild(t); out.appendChild(w);
    }
    if (r.note) out.appendChild(el("p", "hint", r.note));
  }
  function mountSpec(box, spec, key) {
    spec._k = key;
    var out = el("div", "cr"); out.setAttribute("aria-live", "polite");
    var form;
    function go() { paint(out, spec.run(form.read())); }
    form = buildForm(box, spec, go);
    if (spec.again) {
      var b = el("button", "btn", spec.again); b.type = "button"; b.addEventListener("click", go);
      var bar = el("div", "btns"); bar.appendChild(b); box.appendChild(bar);
    }
    box.appendChild(out); go();
  }

  /* ---------- scientific calculator ---------- */
  function sci(box) {
    var deg = true, last = "", hist = [];
    var screen = el("div", "sc-screen");
    var inp = el("input", "sc-in"); inp.type = "text"; inp.autocomplete = "off"; inp.spellcheck = false; inp.setAttribute("aria-label", "Expression"); inp.inputMode = "none";
    var res = el("div", "sc-res", "0"); res.setAttribute("aria-live", "polite");
    var mode = el("button", "sc-mode", "DEG"); mode.type = "button"; mode.title = "Switch between degrees and radians";
    screen.appendChild(mode); screen.appendChild(inp); screen.appendChild(res);
    var pad = el("div", "sc-pad");
    var keys = [
      ["sin", "sin(", "fn"], ["cos", "cos(", "fn"], ["tan", "tan(", "fn"], ["ln", "ln(", "fn"], ["log", "log(", "fn"],
      ["asin", "asin(", "fn"], ["acos", "acos(", "fn"], ["atan", "atan(", "fn"], ["π", "π", "fn"], ["e", "e", "fn"],
      ["x²", "^2", "fn"], ["xʸ", "^", "fn"], ["√", "sqrt(", "fn"], ["n!", "!", "fn"], ["Ans", "Ans", "fn"],
      ["AC", "AC", "clr"], ["(", "(", "op"], [")", ")", "op"], ["%", "%", "op"], ["÷", "÷", "op"],
      ["7", "7"], ["8", "8"], ["9", "9"], ["⌫", "BK", "clr"], ["×", "×", "op"],
      ["4", "4"], ["5", "5"], ["6", "6"], ["1/x", "1/(", "op"], ["−", "−", "op"],
      ["1", "1"], ["2", "2"], ["3", "3"], ["±", "NEG", "op"], ["+", "+", "op"],
      ["0", "0"], [".", "."], ["EXP", "E", "op"], ["=", "=", "eq"]
    ];
    keys.forEach(function (k) {
      var b = el("button", "sc-k " + (k[2] || "num"), k[0]); b.type = "button"; b.setAttribute("data-k", k[1]);
      if (k[0] === "=") b.style.gridColumn = "span 2";
      pad.appendChild(b);
    });
    box.appendChild(screen); box.appendChild(pad);
    var histBox = el("ol", "sc-hist"); box.appendChild(histBox);

    function ins(t) {
      var s = inp.selectionStart == null ? inp.value.length : inp.selectionStart, e = inp.selectionEnd == null ? s : inp.selectionEnd;
      inp.value = inp.value.slice(0, s) + t + inp.value.slice(e);
      var p = s + t.length; try { inp.setSelectionRange(p, p); } catch (x) {}
      preview();
    }
    function back() {
      var s = inp.selectionStart, e = inp.selectionEnd;
      if (s === e) { if (s === 0) return; inp.value = inp.value.slice(0, s - 1) + inp.value.slice(e); s--; }
      else inp.value = inp.value.slice(0, s) + inp.value.slice(e);
      try { inp.setSelectionRange(s, s); } catch (x) {}
      preview();
    }
    function show(n) { return fmtg(n, 10).replace(/ /g, " "); }
    function preview() {
      var t = inp.value.trim();
      if (!t) { res.textContent = "0"; res.classList.remove("bad"); return; }
      try { var r = evalExpr(t, deg, last); res.textContent = show(r); res.classList.remove("bad"); } catch (e) { res.textContent = ""; }
    }
    function equals() {
      var t = inp.value.trim(); if (!t) return;
      try {
        var r = evalExpr(t, deg, last); res.textContent = show(r); res.classList.remove("bad");
        hist.unshift([t, show(r)]); hist = hist.slice(0, 8); last = r;
        histBox.textContent = ""; hist.forEach(function (h) { var li = el("li"); li.appendChild(el("span", null, h[0])); li.appendChild(el("b", null, "= " + h[1])); histBox.appendChild(li); });
        inp.value = String(+r.toPrecision(12)); try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch (x) {}
      } catch (e) { res.textContent = e.message || "Error"; res.classList.add("bad"); }
    }
    pad.addEventListener("click", function (ev) {
      var b = ev.target.closest("button"); if (!b) return;
      var k = b.getAttribute("data-k");
      if (k === "AC") { inp.value = ""; preview(); }
      else if (k === "BK") back();
      else if (k === "=") equals();
      else if (k === "NEG") { inp.value = inp.value.indexOf("−") === 0 ? inp.value.slice(1) : "−" + inp.value; preview(); }
      else ins(k);
      inp.focus({ preventScroll: true });
    });
    mode.addEventListener("click", function () { deg = !deg; mode.textContent = deg ? "DEG" : "RAD"; preview(); });
    inp.addEventListener("input", preview);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); equals(); } });
    inp.value = "(12.5 + 7.5) × 3 ÷ 4"; preview();
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
    function isName(t) { return t && /^[a-zA-Z]+$/.test(t); }
    function rad(x) { return deg ? x * Math.PI / 180 : x; }
    function irad(x) { return deg ? x * 180 / Math.PI : x; }
    var F = {
      sin: function (x) { var r = Math.sin(rad(x)); return Math.abs(r) < 1e-15 ? 0 : r; },
      cos: function (x) { var r = Math.cos(rad(x)); return Math.abs(r) < 1e-15 ? 0 : r; },
      tan: function (x) { if (deg && Math.abs(((x % 180) + 180) % 180 - 90) < 1e-12) throw new Error("Undefined"); return Math.tan(rad(x)); },
      asin: function (x) { return irad(Math.asin(x)); }, acos: function (x) { return irad(Math.acos(x)); }, atan: function (x) { return irad(Math.atan(x)); },
      ln: Math.log, log: Math.log10, sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp, cbrt: Math.cbrt
    };
    function fact(n) {
      if (n < 0 || Math.floor(n) !== n || n > 170) throw new Error("Factorial needs a whole number from 0 to 170");
      var r = 1; for (var k = 2; k <= n; k++) r *= k; return r;
    }
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
        if (F[n]) {
          if (peek() !== "(") throw new Error("Use brackets, like " + n + "(30)");
          i++; var a = expr(); if (peek() !== ")") throw new Error("Missing )"); i++;
          var r = F[n](a); if (!isFinite(r)) throw new Error("Not a real number"); return r;
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

  /* ---------- unit converter ---------- */
  var UNITS = {
    Length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mile: 1609.344, yard: 0.9144, foot: 0.3048, inch: 0.0254 },
    Weight: { kg: 1, g: 0.001, mg: 1e-6, tonne: 1000, pound: 0.45359237, ounce: 0.028349523125, stone: 6.35029318 },
    Volume: { litre: 1, ml: 0.001, "UK pint": 0.56826125, "UK gallon": 4.54609, "US gallon": 3.785411784, "US cup": 0.2365882365, "tablespoon": 0.0147867648, teaspoon: 0.0049289216 },
    Area: { "m²": 1, "km²": 1e6, "cm²": 1e-4, hectare: 1e4, acre: 4046.8564224, "sq mile": 2589988.110336, "sq foot": 0.09290304, "sq inch": 0.00064516 },
    Speed: { "m/s": 1, "km/h": 1 / 3.6, mph: 0.44704, knot: 0.514444 },
    Temperature: { "°C": 1, "°F": 1, K: 1 },
    Time: { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, year: 31557600 }
  };
  function units(box) {
    var cat = el("select", "field"), from = el("select", "field"), to = el("select", "field"), val = el("input", "field");
    val.type = "text"; val.inputMode = "decimal"; val.value = "1"; val.setAttribute("aria-label", "Value");
    Object.keys(UNITS).forEach(function (k) { var o = el("option", null, k); o.value = k; cat.appendChild(o); });
    var out = el("div", "cr"); out.setAttribute("aria-live", "polite");
    function mk(lbl, ctl) { var w = el("div", "cf"); var l = el("label", null, lbl); w.appendChild(l); w.appendChild(ctl); return w; }
    var grid = el("div", "cf-grid");
    grid.appendChild(mk("Type", cat)); grid.appendChild(mk("Value", val)); grid.appendChild(mk("From", from)); grid.appendChild(mk("To", to));
    box.appendChild(grid); box.appendChild(out);
    function fill() {
      from.textContent = ""; to.textContent = "";
      Object.keys(UNITS[cat.value]).forEach(function (u, i) {
        var a = el("option", null, u); a.value = u; from.appendChild(a);
        var b = el("option", null, u); b.value = u; to.appendChild(b);
      });
      from.selectedIndex = 0; to.selectedIndex = Math.min(1, to.options.length - 1);
      if (cat.value === "Length") { from.value = "mile"; to.value = "km"; }
      if (cat.value === "Weight") { from.value = "kg"; to.value = "pound"; }
      if (cat.value === "Temperature") { from.value = "°C"; to.value = "°F"; }
      go();
    }
    function conv(x, f, t, c) {
      if (c === "Temperature") {
        var k = f === "°C" ? x + 273.15 : f === "°F" ? (x - 32) * 5 / 9 + 273.15 : x;
        return t === "°C" ? k - 273.15 : t === "°F" ? (k - 273.15) * 9 / 5 + 32 : k;
      }
      return x * UNITS[c][f] / UNITS[c][t];
    }
    function go() {
      var x = num(val.value);
      if (isNaN(x)) { paint(out, { err: "Enter a number to convert." }); return; }
      var c = cat.value, r = conv(x, from.value, to.value, c);
      var rows = Object.keys(UNITS[c]).filter(function (u) { return u !== to.value && u !== from.value; }).slice(0, 5).map(function (u) { return [u, fmtg(conv(x, from.value, u, c), 6)]; });
      paint(out, { hero: [fmtg(x, 6) + " " + from.value + " =", fmtg(r, 8) + " " + to.value], rows: rows });
    }
    cat.addEventListener("change", fill);
    [from, to].forEach(function (s) { s.addEventListener("change", go); });
    val.addEventListener("input", go);
    fill();
  }

  /* ---------- mount ---------- */
  if (slug === "scientific") { sci(root); return; }
  if (slug === "unit-converter") { units(root); return; }
  var spec = CALCS[slug];
  if (!spec) return;
  if (spec.multi) {
    spec.multi.forEach(function (m, i) {
      var card = el("div", "cm"); card.appendChild(el("h2", "cm-h", m.title)); root.appendChild(card);
      mountSpec(card, m, slug + i);
    });
  } else mountSpec(root, spec, slug);
})();
