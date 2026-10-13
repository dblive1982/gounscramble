/* Print and share buttons for calculator pages. Prints only the calculator with your values, no page background. */
(function () {
  "use strict";
  var root = document.getElementById("calc") || document.getElementById("sal-form");
  var pbtn = document.getElementById("cp-print"), sbtn = document.getElementById("cp-share");
  if (!root || !pbtn || !sbtn) return;
  var sheet = document.createElement("div"); sheet.id = "print-sheet"; document.body.appendChild(sheet);
  var title = (document.querySelector("main h1") || {}).textContent || document.title;

  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function span(cls, txt) { var s = document.createElement("span"); s.className = cls; s.textContent = txt; return s; }

  function changed(det) {
    var em = det.querySelector("summary em"); if (em && em.classList.contains("on")) return true;
    var any = false;
    [].forEach.call(det.querySelectorAll("input,select,textarea"), function (o) {
      if (o.tagName === "SELECT") { var d = false; [].forEach.call(o.options, function (op) { if (op.selected !== op.defaultSelected) d = true; }); if (d) any = true; }
      else if (o.type === "checkbox" || o.type === "radio") { if (o.checked !== o.defaultChecked) any = true; }
      else if (o.value !== o.defaultValue) any = true;
    });
    return any;
  }

  function build() {
    var c = root.cloneNode(true);
    var oc = root.querySelectorAll("input,select,textarea,details"), cc = c.querySelectorAll("input,select,textarea,details");
    var drop = [];
    [].forEach.call(oc, function (o, i) {
      var n = cc[i]; if (!n) return;
      if (o.tagName === "DETAILS") { if (changed(o)) n.setAttribute("open", ""); else drop.push(n); return; }
      var txt;
      if (o.tagName === "SELECT") txt = o.options[o.selectedIndex] ? o.options[o.selectedIndex].text : "";
      else if (o.type === "checkbox") txt = o.checked ? "Yes" : "No";
      else txt = o.value;
      if (o.type === "checkbox") { n.replaceWith(span("pv pv-c", txt + ": ")); }
      else n.replaceWith(span("pv", txt || "-"));
    });
    drop.forEach(function (n) { n.remove(); });
    [].forEach.call(c.querySelectorAll("[id]"), function (e) { e.removeAttribute("id"); });
    [].forEach.call(c.querySelectorAll("button,.btns,.sc-pad,.sal-chips,.cf-hint,summary em,[hidden],script"), function (e) { e.remove(); });
    var d = new Date(), ds = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    sheet.innerHTML = '<p class="pbrand"><img src="assets/logo.png" alt="" height="24"><img src="assets/wordmark.png" alt="gounscramble." height="14"></p>' + "<h1>" + esc(title) + "</h1><p class='pn'>Calculated on " + esc(ds) + "</p><div class='pc-body'></div>" +
      "<p class='pf'>Free calculators at gounscramble.com. For information only, not financial, tax, legal or medical advice.</p>";
    sheet.querySelector(".pc-body").appendChild(c);
    c.className = "pcalc";
    return true;
  }

  pbtn.addEventListener("click", function () { build(); window.print(); });
  window.addEventListener("beforeprint", build);

  sbtn.addEventListener("click", function () {
    var url = location.origin + location.pathname, hero = document.querySelector("#calc .cr-hero, #sal-out .cr-hero, .calc .cr-hero"), text = "Try the " + title + " free on GoUnscramble";
    if (hero) {
      var k = hero.querySelector(".cr-k"), v = hero.querySelector(".cr-v");
      if (k && v && v.textContent.trim()) text = title + ": " + k.textContent.trim() + " " + v.textContent.trim() + ". Try it free on GoUnscramble";
    }
    var data = { title: "GoUnscramble: " + title, text: text, url: url };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    var done = function () { (window.GUToast || function () {})("Link copied"); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { window.prompt("Copy this link", url); });
    else window.prompt("Copy this link", url);
  });
})();
