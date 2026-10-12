
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
