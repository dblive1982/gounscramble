(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var VIEWS = ["signin", "signup", "forgot", "sent", "reset", "account"];
  var TITLES = { signin: "Sign in", signup: "Create account", forgot: "Reset password", sent: "Check your email", reset: "New password", account: "Your account" };
  var user = null, enabled = true, token = "";
  var okMail = function (s) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s); };

  function show(v) {
    if (!VIEWS.includes(v)) v = "signin";
    if (user && v !== "account" && v !== "sent") v = "account";
    if (!user && v === "account") v = "signin";
    VIEWS.forEach(function (x) { $("v-" + x).hidden = x !== v; });
    $("ac-ttl").textContent = TITLES[v];
    window.scrollTo(0, 0);
  }
  function setUser(u) {
    user = u;
    try { if (u) localStorage.setItem("gu-in", "1"); else { localStorage.removeItem("gu-in"); localStorage.removeItem("gu-progress"); } } catch (e) { /* storage unavailable */ }
    if (window.guMenu) window.guMenu();
    if (u) {
      paint(u); loadProfile(); progressSummary();
    }
    show(u ? "account" : "signin");
  }
  var prof = null;
  function face(el, name, img) {
    el.style.backgroundImage = img ? "url(" + img + ")" : "";
    el.textContent = img ? "" : (name || "?").charAt(0).toUpperCase();
    el.classList.toggle("has", !!img);
  }
  function paint(u) {
    $("nm").textContent = u.name; $("em").textContent = u.email;
    var img = prof && prof.avatar;
    face($("av"), u.name, img); face($("av2"), u.name, img);
    $("av-rm").hidden = !img;
    try { if (img) localStorage.setItem("gu-av", img); else localStorage.removeItem("gu-av"); } catch (e) { /* ignore */ }
    if (window.guMenu) window.guMenu();
  }
  function loadProfile() {
    fetch("api/profile.php", { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d.profile) return;
      prof = d.profile; user.name = prof.name;
      $("pr-n").value = prof.name; $("pr-b").value = prof.bio; $("pr-l").value = prof.location; $("pr-f").value = prof.fav;
      $("since").textContent = prof.since ? "Member since " + prof.since : "";
      paint(user);
    }).catch(function () { /* ignore */ });
  }
  function progressSummary() {
    var L = $("plist"), g = window.GUP; if (!g) return;
    function draw() {
      var ws = g.get("ws") || {}, sd = g.get("sd") || {}, done = 0, started = 0, k;
      Object.keys(ws.done || {}).forEach(function (c) { done += ws.done[c].length; });
      for (k in (ws.cur || {})) { var p = k.split("|"); if (!((ws.done || {})[p[0]] || []).includes(+p[1])) started++; }
      var st = sd.stats || {}, solved = (st.easy || 0) + (st.medium || 0) + (st.hard || 0);
      L.innerHTML = "";
      [["Word searches finished", done], ["Word searches in progress", started], ["Sudokus solved", solved],
       ["Sudoku in progress", sd.sol && !sd.done ? "Yes" : "No"]].concat((function () {
        var gs = g.get("gs") || {}, rows = [];
        function run(k) { var v = g.get(k); return v && !v.over; }
        var live = [["sl", "Snakes and ladders"], ["c4", "Connect 4"], ["tt", "Tic tac toe"], ["mm", "Memory match"], ["hm", "Hangman"]]
          .filter(function (x) { return run(x[0]); }).map(function (x) { return x[1]; });
        rows.push(["Games in progress", live.length ? live.join(", ") : "None"]);
        var won = (gs.slW || 0) + (gs.c4W || 0) + (gs.hmW || 0);
        rows.push(["Games won (snakes, Connect 4, Hangman)", won]);
        if (gs.mmb) rows.push(["Memory match best", gs.mmb + " moves"]);
        [["runner", "Offline Runner"], ["retrosnake", "Snake"], ["rally", "Paddle Rally (wins)"], ["bricks", "Brick Smash"], ["blaster", "Space Invaders"], ["muncher", "Maze Muncher"], ["blocks", "Falling Blocks"], ["hopper", "Road Hopper"], ["rocks", "Rock Blaster"], ["flap", "Sky Flap"], ["moles", "Mole Pop"], ["echo", "Colour Echo"], ["merge", "Number Merge"], ["mines", "Mine Finder (wins)"]].forEach(function (a) { if (gs["b_" + a[0]]) rows.push([a[1] + " best", gs["b_" + a[0]]]); });
        return rows;
      })()).forEach(function (r) {
        var li = document.createElement("li"); li.textContent = r[0] + ": " + r[1]; L.appendChild(li);
      });
    }
    draw(); g.onChange(draw); g.sync();
  }
  function shrink(file, cb) {
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      var S = 192, c = document.createElement("canvas"); c.width = c.height = S;
      var m = Math.min(img.width, img.height), x = (img.width - m) / 2, y = (img.height - m) / 2;
      c.getContext("2d").drawImage(img, x, y, m, m, 0, 0, S, S);
      URL.revokeObjectURL(url); cb(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(null); };
    img.src = url;
  }
  function api(name, body) {
    return fetch("api/" + name + ".php", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-GU": "1" },
      body: JSON.stringify(body || {})
    }).then(function (r) {
      return r.json().catch(function () { return { error: "Something went wrong. Please try again." }; })
        .then(function (d) { d._ok = r.ok; return d; });
    }).catch(function () { return { error: "Could not reach the server. Check your connection and try again." }; });
  }
  function startGoogle(cid) {
    var sc = document.createElement("script"); sc.src = "https://accounts.google.com/gsi/client"; sc.async = true;
    sc.onload = function () {
      if (!window.google || !google.accounts) return;
      google.accounts.id.initialize({ client_id: cid, callback: function (r) {
        api("google", { credential: r.credential }).then(function (d) {
          if (d.user) setUser(d.user); else { var e = $("in-err"); e.textContent = d.error || "Google sign-in failed."; show("signin"); }
        });
      } });
      var w = Math.min(320, Math.max(220, ($("v-signin").clientWidth || 300)));
      google.accounts.id.renderButton($("g-in"), { theme: "outline", size: "large", text: "continue_with", shape: "pill", width: w });
      google.accounts.id.renderButton($("g-up"), { theme: "outline", size: "large", text: "signup_with", shape: "pill", width: w });
    };
    document.head.appendChild(sc);
  }
  function busy(form, on) { var b = form.querySelector(".go"); if (b) b.disabled = on; }

  document.querySelectorAll("[data-v]").forEach(function (a) {
    a.addEventListener("click", function () { show(a.dataset.v); });
  });
  document.querySelectorAll(".showpw").forEach(function (b) {
    b.addEventListener("click", function () {
      var i = b.previousElementSibling, s = i.type === "password";
      i.type = s ? "text" : "password"; b.textContent = s ? "Hide" : "Show";
    });
  });

  $("f-in").addEventListener("submit", function (e) {
    e.preventDefault();
    var m = $("in-e").value.trim(), p = $("in-p").value, er = $("in-err");
    if (!okMail(m)) { er.textContent = "Please enter a valid email address."; return; }
    if (!p) { er.textContent = "Please enter your password."; return; }
    er.textContent = ""; busy(this, true);
    var f = this;
    api("login", { email: m, password: p }).then(function (d) {
      busy(f, false);
      if (d.user) { $("in-p").value = ""; setUser(d.user); } else er.textContent = d.error || "Could not sign in.";
    });
  });
  $("f-up").addEventListener("submit", function (e) {
    e.preventDefault();
    var n = $("up-n").value.trim(), m = $("up-e").value.trim(), p = $("up-p").value, er = $("up-err");
    if (!n) { er.textContent = "Please tell us what to call you."; return; }
    if (!okMail(m)) { er.textContent = "Please enter a valid email address."; return; }
    if (p.length < 8) { er.textContent = "Your password needs at least 8 characters."; return; }
    if (!$("up-c").checked) { er.textContent = "Please tick the box to agree."; return; }
    er.textContent = ""; busy(this, true);
    var f = this;
    api("register", { name: n, email: m, password: p }).then(function (d) {
      busy(f, false);
      if (d.user) { $("up-p").value = ""; setUser(d.user); } else er.textContent = d.error || "Could not create the account.";
    });
  });
  $("f-fg").addEventListener("submit", function (e) {
    e.preventDefault();
    var m = $("fg-e").value.trim(), er = $("fg-err");
    if (!okMail(m)) { er.textContent = "Please enter a valid email address."; return; }
    er.textContent = ""; busy(this, true);
    var f = this;
    api("forgot", { email: m }).then(function (d) {
      busy(f, false);
      if (d.ok) { $("sent-t").textContent = "If an account exists for " + m + ", a reset link is on its way. It works for one hour."; show("sent"); }
      else er.textContent = d.error || "Could not send the email.";
    });
  });
  $("f-rs").addEventListener("submit", function (e) {
    e.preventDefault();
    var p = $("rs-p").value, er = $("rs-err");
    if (p.length < 8) { er.textContent = "Your password needs at least 8 characters."; return; }
    er.textContent = ""; busy(this, true);
    var f = this;
    api("reset", { token: token, password: p }).then(function (d) {
      busy(f, false);
      if (d.ok) { history.replaceState(null, "", "account.html"); $("rs-p").value = ""; $("sent-t").textContent = "Your password is changed. You can sign in now."; show("sent"); }
      else er.textContent = d.error || "Could not change the password.";
    });
  });
  $("f-pr").addEventListener("submit", function (e) {
    e.preventDefault(); var er = $("pr-err"); er.textContent = "";
    var n = $("pr-n").value.trim(); if (!n) { er.textContent = "Please enter a display name."; return; }
    busy(this, true); var f = this;
    api("profile", { name: n, bio: $("pr-b").value, location: $("pr-l").value, fav: $("pr-f").value }).then(function (d) {
      busy(f, false);
      if (d.profile) { prof = d.profile; user.name = prof.name; paint(user); er.textContent = "Saved."; } else er.textContent = d.error || "Could not save.";
    });
  });
  $("av-file").addEventListener("change", function () {
    var file = this.files && this.files[0]; this.value = ""; if (!file) return;
    var er = $("pr-err"); er.textContent = "";
    shrink(file, function (data) {
      if (!data) { er.textContent = "That file isn't a picture we can use."; return; }
      api("profile", { name: user.name, bio: $("pr-b").value, location: $("pr-l").value, fav: $("pr-f").value, avatar: data }).then(function (d) {
        if (d.profile) { prof = d.profile; paint(user); } else er.textContent = d.error || "Could not save the picture.";
      });
    });
  });
  $("av-rm").addEventListener("click", function () {
    api("profile", { name: user.name, bio: $("pr-b").value, location: $("pr-l").value, fav: $("pr-f").value, avatar: null }).then(function (d) {
      if (d.profile) { prof = d.profile; paint(user); }
    });
  });
  function box(id, on) { $(id).hidden = !on; }
  $("rs-open").addEventListener("click", function () { $("rs-done").textContent = ""; box("rs-box", true); this.hidden = true; });
  $("rs-no").addEventListener("click", function () { box("rs-box", false); $("rs-open").hidden = false; });
  $("rs-yes").addEventListener("click", function () {
    if (window.GUP) GUP.reset();
    box("rs-box", false); $("rs-open").hidden = false; $("rs-done").textContent = "Done. Your game and activity data has been reset.";
  });
  $("del-open").addEventListener("click", function () { $("del-pw-w").hidden = !user.pw; $("del-err").textContent = ""; box("f-del", true); this.hidden = true; });
  $("del-no").addEventListener("click", function () { box("f-del", false); $("del-open").hidden = false; $("del-pw").value = ""; $("del-ok").value = ""; });
  $("f-del").addEventListener("submit", function (e) {
    e.preventDefault(); var er = $("del-err"), f = this; er.textContent = "";
    if ($("del-ok").value.trim() !== "DELETE") { er.textContent = "Please type DELETE in capitals to confirm."; return; }
    if (user.pw && !$("del-pw").value) { er.textContent = "Please enter your password."; return; }
    busy(f, true);
    api("delete", { confirm: "DELETE", password: $("del-pw").value }).then(function (d) {
      busy(f, false);
      if (!d.ok) { er.textContent = d.error || "Could not delete the account."; return; }
      try { localStorage.removeItem("gu-in"); localStorage.removeItem("gu-av"); localStorage.removeItem("gu-progress"); localStorage.removeItem("gu-ws"); localStorage.removeItem("gu-progress"); } catch (x) { /* ignore */ }
      prof = null; user = null;
      var ub = document.querySelector(".user-btn"); if (ub) { ub.classList.remove("pic"); ub.style.backgroundImage = ""; }
      if (window.guMenu) window.guMenu();
      $("sent-t").textContent = "Your account and everything saved with it has been deleted."; show("sent");
    });
  });
  $("out").addEventListener("click", function () {
    api("logout", {}).then(function () { if (window.GUP) GUP.clear(); prof = null; try { localStorage.removeItem("gu-av"); } catch (e) { /* ignore */ } var ub = document.querySelector(".user-btn"); if (ub) { ub.classList.remove("pic"); ub.style.backgroundImage = ""; } var mo = document.getElementById("menu-out"); if (mo) mo.hidden = true; setUser(null); });
  });

  var m = /[?&]reset=([a-f0-9]{64})/.exec(location.search);
  if (m) token = m[1];

  fetch("api/me.php", { credentials: "same-origin" })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      enabled = !!d.enabled;
      if (!enabled) $("ac-off").hidden = false;
      var g = !!d.google;
      ["g-in", "or-in", "g-up", "or-up"].forEach(function (id) { $(id).hidden = !g; });
      if (g && d.google_id) startGoogle(d.google_id);
      if (d.user) setUser(d.user);
      else { try { localStorage.removeItem("gu-in"); localStorage.removeItem("gu-av"); localStorage.removeItem("gu-progress"); localStorage.removeItem("gu-ws"); } catch (e) { /* ignore */ } var ub = document.querySelector(".user-btn"); if (ub) { ub.classList.remove("pic"); ub.style.backgroundImage = ""; } var mo = document.getElementById("menu-out"); if (mo) mo.hidden = true; show(token ? "reset" : (location.hash === "#signup" ? "signup" : "signin")); }
    })
    .catch(function () { $("ac-off").hidden = false; show(token ? "reset" : "signin"); });
})();
