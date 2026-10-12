
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
