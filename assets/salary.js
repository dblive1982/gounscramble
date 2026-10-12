/* Salary calculator: converts pay between periods, optional UK take-home estimate (uses GUTax from calc.js). */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var form = $("sal-form"); if (!form) return;
  function num(s) { s = String(s == null ? "" : s).replace(/[,\s£$€]/g, ""); return s === "" ? NaN : Number(s); }
  function fmt(n) { return n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function row(a, b, c) {
    var tr = document.createElement("tr"), th = document.createElement("th"); th.scope = "row"; th.textContent = a; tr.appendChild(th);
    [b, c].forEach(function (x, i) { if (i === 1 && x == null) return; var td = document.createElement("td"); td.textContent = x; if (i === 1) td.className = "sal-adj"; tr.appendChild(td); });
    return tr;
  }
  function go() {
    var cur = $("sal-cur").value, amt = num($("sal-amount").value), hrs = num($("sal-hours").value), days = num($("sal-days").value), off = num($("sal-off").value) || 0, per = $("sal-per").value;
    var err = $("sal-err"), out = $("sal-out");
    if (!(amt >= 0) || !(hrs > 0 && hrs <= 168) || !(days > 0 && days <= 7) || off < 0 || off > 366) {
      err.textContent = "Enter your pay, hours per week (1 to 168), days per week (1 to 7) and unpaid days off (0 or more)."; err.hidden = false; out.hidden = true; return;
    }
    err.hidden = true; out.hidden = false;
    var annual = { hour: amt * hrs * 52, day: amt * days * 52, week: amt * 52, "2week": amt * 26, month: amt * 12, year: amt }[per];
    var daily = annual / (52 * days), adjA = Math.max(0, annual - off * daily), adj = off > 0;
    var P = [["Hourly", 52 * hrs, 0], ["Daily", 52 * days, 0], ["Weekly", 52, 1], ["Bi-weekly (every 2 weeks)", 26, 1], ["Semi-monthly (twice a month)", 24, 1], ["Monthly", 12, 1], ["Quarterly", 4, 1], ["Yearly", 1, 1]];
    var tb = $("sal-tbl").tBodies[0]; tb.textContent = "";
    P.forEach(function (p) { tb.appendChild(row(p[0], cur + fmt(annual / p[1]), adj ? cur + fmt((p[2] ? adjA : annual) / p[1]) : null)); });
    document.querySelectorAll("#sal-tbl .sal-adj").forEach(function (n) { n.hidden = !adj; });
    var thAdj = document.querySelector("#sal-tbl thead .sal-adj"); if (thAdj) thAdj.hidden = !adj;
    var uk = $("sal-uk").checked && cur === "£", box = $("sal-uk-out"); box.hidden = !uk;
    if (uk) {
      var base = adj ? adjA : annual, t = window.GUTax(base), dl = $("sal-uk-stats"); dl.textContent = "";
      [["Take-home pay (yearly)", t.net], ["Take-home pay (monthly)", t.net / 12], ["Take-home pay (weekly)", t.net / 52], ["Income tax", t.tax], ["National Insurance", t.ni]].forEach(function (r) {
        var d = document.createElement("div"); d.className = "cr-row"; var a = document.createElement("dt"), b = document.createElement("dd"); a.textContent = r[0]; b.textContent = "£" + fmt(r[1]); d.appendChild(a); d.appendChild(b); dl.appendChild(d);
      });
    }
  }
  ["sal-amount", "sal-per", "sal-hours", "sal-days", "sal-off", "sal-cur", "sal-uk"].forEach(function (id) { $(id).addEventListener("input", go); $(id).addEventListener("change", go); });
  $("sal-reset").addEventListener("click", function () {
    $("sal-amount").value = "35000"; $("sal-per").value = "year"; $("sal-hours").value = "40"; $("sal-days").value = "5"; $("sal-off").value = "0"; $("sal-cur").value = "£"; $("sal-uk").checked = true; go();
  });
  go();
})();
