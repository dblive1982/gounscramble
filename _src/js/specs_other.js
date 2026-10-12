
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
