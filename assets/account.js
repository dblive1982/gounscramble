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
    if (u) {
      $("nm").textContent = u.name; $("em").textContent = u.email;
      $("av").textContent = (u.name || "?").charAt(0).toUpperCase();
    }
    show(u ? "account" : "signin");
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
  $("out").addEventListener("click", function () {
    api("logout", {}).then(function () { setUser(null); });
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
      if (d.user) setUser(d.user);
      else show(token ? "reset" : (location.hash === "#signup" ? "signup" : "signin"));
    })
    .catch(function () { $("ac-off").hidden = false; show(token ? "reset" : "signin"); });
})();
