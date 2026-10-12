
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
