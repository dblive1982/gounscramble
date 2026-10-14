#!/usr/bin/env python3
"""Builds every GoUnscramble page from ONE shared layout, so header, footer and head always match.
Run: python3 build.py   (writes the .html files into ./site, leaves assets/ and words/ alone)"""
import os
import re
import json
import datetime
import sys
import hashlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import guides as G

import calcs as CALC
import planners as PL
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("GU_OUT") or os.path.join(ROOT, "site")
SITE = "https://gounscramble.com"

CHEVRON = ('<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6l5 5 5-5" fill="none" '
           'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>')


def logo(size):
    return '<span class="go-tag" aria-hidden="true">GO</span>'


HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>@@TITLE@@</title>
<meta name="description" content="@@DESC@@">
<link rel="canonical" href="@@CANON@@">
@@SEO@@
<meta name="theme-color" content="#7c48b8">
<meta name="google-adsense-account" content="ca-pub-6517978259411056">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6517978259411056" crossorigin="anonymous"></script>
<link rel="icon" href="favicon.png" type="image/png">
<link rel="icon" href="favicon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Albert+Sans:wght@400;500;700;800&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/styles.css">
@@HOMECSS@@
<link rel="stylesheet" href="assets/minimal.css">
<link rel="stylesheet" href="assets/dark.css">
<script>try{if(localStorage.getItem("gu-theme")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}</script>
</head>
<body data-page="@@PAGE@@">
"""

HEADER = """<!--header-->
<header class="site-header"><div class="wrap">
<nav class="nav main-nav" aria-label="Main">
<details class="menu">
<summary aria-label="Menu"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"></path></svg></summary>
<div class="menu-list">
<a class="menu-brand" href="/" aria-label="GoUnscramble home"><img class="mark" src="assets/logo.png" width="34" height="34" alt="" decoding="async"></a>
<button type="button" class="menu-x" aria-label="Close menu"><svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M4 4l14 14M18 4L4 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path></svg></button>
<a href="/"@@CUR_home@@><svg class="mi" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>Word unscrambler</a>
<p class="menu-h">Word tools</p>
<a href="anagram-solver.html"@@CUR_anagram@@><svg class="mi" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M4 12h16M4 17h7M17 5l3 2-3 2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>Anagram solver</a>
<a href="word-counter.html"@@CUR_counter@@><svg class="mi" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V9M12 19V5M19 19v-7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>Word counter</a>
<a href="case-converter.html"@@CUR_case@@><svg class="mi" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18l5-12 5 12M5.8 14h6.4M16 18l2.5-6 2.5 6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>Case converter</a>
<a href="random-word-picker.html"@@CUR_random@@><svg class="mi" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4zM9 9h.01M15 15h.01M12 12h.01M9 15h.01M15 9h.01" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>Random word picker</a>
<p class="menu-h">Play</p>
<a href="games.html"@@CUR_games@@><svg class="mi" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9h12a4 4 0 0 1 4 4v1a3 3 0 0 1-5 2l-1-1H8l-1 1a3 3 0 0 1-5-2v-1a4 4 0 0 1 4-4zM8 11v4M6 13h4M16 12h.01M18 14h.01" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>Puzzles &amp; games</a>
<p class="menu-h">Calculators</p>
<a href="calculators.html"@@CUR_calculators@@><svg class="mi" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 8h8M8 12h2M12 12h2M16 12h.01M8 16h2M12 16h2M16 16h.01" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>All calculators</a>
<a href="salary-calculator.html" class="sub"><svg class="mi" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 8h8M8 12h2M12 12h2M16 12h.01M8 16h2M12 16h2M16 16h.01" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>Salary</a>
<a href="mortgage-calculator.html" class="sub"><svg class="mi" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 8h8M8 12h2M12 12h2M16 12h.01M8 16h2M12 16h2M16 16h.01" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>Mortgage</a>
<a href="scientific-calculator.html" class="sub"><svg class="mi" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 8h8M8 12h2M12 12h2M16 12h.01M8 16h2M12 16h2M16 16h.01" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>Scientific</a>
<a href="percentage-calculator.html" class="sub"><svg class="mi" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 8h8M8 12h2M12 12h2M16 12h.01M8 16h2M12 16h2M16 16h.01" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>Percentage</a>
<p class="menu-h">More</p>
<a href="planners.html"@@CUR_planners@@><svg class="mi" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v17H6zM9 4V3h6v1M9.5 11l1.8 1.8L15 9M9.5 16.5h5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>Planners</a>
<a href="guides.html"@@CUR_guides@@><svg class="mi" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4zM9 9h6M9 13h6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>Guides</a>
<a href="tools.html"@@CUR_tools@@><svg class="mi" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 6a4 4 0 0 0 5 5l-9 9-3-3 9-9a4 4 0 0 0-2-2zM4 20l3-3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>All tools</a>
<a href="about.html"@@CUR_about@@><svg class="mi" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5h.01" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>About</a>
<hr>
<a href="account.html"@@CUR_account@@><svg class="mi" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4.5 20c.8-4 3.8-6 7.5-6s6.7 2 7.5 6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>Sign in</a>
<a href="account.html" class="menu-out" id="menu-out" hidden>Sign out</a>
<div class="theme-opts" id="theme-opts" role="group" aria-label="Colour mode"><button type="button" data-t="light" aria-pressed="true"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Light</button><button type="button" data-t="dark" aria-pressed="false"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg> Dark</button></div>
</div>
</details>
</nav>
<a class="brand" href="/" aria-label="GoUnscramble home"><img class="mark" src="assets/logo.png" width="22" height="22" alt="" decoding="async"><img class="wmimg" src="assets/wordmark.png" width="116" height="17" alt="gounscramble." decoding="async"></a>
<div class="user-wrap"><a class="user-btn" href="account.html" aria-label="Sign in or your account"><svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="17" r="7" fill="currentColor"/><path d="M6 40c0-9 6-14.5 14-14.5S34 31 34 40z" fill="currentColor"/></svg><span class="ub-t">Sign in</span></a><div class="user-pop" id="user-pop" role="menu" hidden><p class="up-n" id="up-n">Hi there</p><a href="account.html" role="menuitem">Your account</a><button type="button" id="up-out" role="menuitem">Sign out</button></div></div>

</div></header>
<!--/header-->
"""

# Social accounts: put the full profile URL here when the account exists. Until then the icon
# shows as a plain (unlinked) badge, so there are no dead links.
SOCIAL = [
    ("Facebook", "", '<path d="M13.5 21v-7.5h2.6l.4-3h-3V8.7c0-.9.3-1.5 1.6-1.5h1.5V4.5c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.2H7.9v3h2.6V21z" fill="currentColor"/>'),
    ("Instagram", "", '<rect x="4.5" y="4.5" width="15" height="15" rx="4.5" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="16.6" cy="7.4" r="1.1" fill="currentColor"/>'),
    ("X", "", '<path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'),
    ("TikTok", "", '<path d="M14 4v10.2a3.2 3.2 0 1 1-3.2-3.2M14 4c.3 2.3 1.8 3.7 4 3.9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
    ("YouTube", "", '<rect x="3.5" y="6.5" width="17" height="11" rx="3.2" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M10.4 9.6v4.8l4.2-2.4z" fill="currentColor"/>'),
]


def social_html():
    out = []
    for name, url, icon in SOCIAL:
        svg = '<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">%s</svg>' % icon
        if url:
            out.append('<a class="social" href="%s" target="_blank" rel="noopener me" aria-label="GoUnscramble on %s">%s</a>' % (url, name, svg))
        else:
            out.append('<span class="social" title="%s, coming soon">%s</span>' % (name, svg))
    return '<div class="socials">' + "".join(out) + "</div>"


FOOTER = """<!--footer-->
<footer class="site-footer"><div class="wrap">
<div class="foot-brand"><span class="foot-c">&copy; 2026</span><a class="foot-logo" href="/" aria-label="GoUnscramble home"><img class="mark" src="assets/logo.png" width="19" height="19" alt="" decoding="async"><img class="wmimg" src="assets/wordmark.png" width="100" height="15" alt="gounscramble." decoding="async"></a></div>
<p class="foot-secure"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 018 0v3"/></svg><span>Site secured using Encrypted HTTPS connection.</span></p>
<p class="foot-legal"><b>Disclaimer:</b> everything on this site, including calculator results, word lists and tips, is for general information and entertainment only. It is not financial, tax, investment, legal, medical or other professional advice, and results may contain errors. We accept no responsibility for any loss or decision that comes from using it, so please check with a qualified professional before acting. See our <a href="terms.html">terms</a>.</p>
<p class="foot-legal">We are not affiliated with SCRABBLE&reg;, Mattel, Spear, Hasbro, or Zynga with Friends in any way.</p>
<nav class="nav" aria-label="Footer">
<a href="credits.html">Credits</a>
<a href="faq.html">FAQ</a>
<a href="privacy.html">Privacy</a>
<a href="terms.html">Terms</a>
<a href="contact.html">Contact</a>
</nav>
@@SOCIAL@@
</div></footer>
<!--/footer-->
<script src="assets/engine.js"></script>
<script src="assets/app.js"></script>
<script>(function(){var g=document.getElementById("theme-opts");if(!g)return;var bs=g.querySelectorAll("button");function d(){return document.documentElement.getAttribute("data-theme")==="dark"}function p(){bs.forEach(function(x){x.setAttribute("aria-pressed",String((x.getAttribute("data-t")==="dark")===d()))})}bs.forEach(function(x){x.addEventListener("click",function(){var n=x.getAttribute("data-t");document.documentElement.setAttribute("data-theme",n);try{localStorage.setItem("gu-theme",n)}catch(e){}p()})});p()})();</script>
<script>(function(){var m=document.querySelector(".menu");if(!m)return;function c(){if(!m.hasAttribute("open")||m.classList.contains("closing"))return;m.classList.add("closing");setTimeout(function(){m.removeAttribute("open");m.classList.remove("closing")},230)}m.addEventListener("click",function(e){if(e.target===m||e.target.closest(".menu-x"))c()});document.addEventListener("keydown",function(e){if(e.key==="Escape")c()});var sm=m.querySelector("summary");if(sm)sm.addEventListener("click",function(e){if(m.hasAttribute("open")){e.preventDefault();c()}});})();(function(){var o=document.getElementById("menu-out"),a=document.querySelector('.menu-list a[href="account.html"]'),u=document.querySelector(".user-btn");
function on(){try{return localStorage.getItem("gu-in")==="1"}catch(e){return false}}
window.guMenu=function(){var s=on(),v=null;try{v=localStorage.getItem("gu-av")}catch(e){}
if(o)o.hidden=!s;if(a)a.textContent=s?"Your account":"Sign in";if(!s){try{sessionStorage.removeItem("gu-nm")}catch(e){}}
if(u){var ut=u.querySelector(".ub-t");if(ut)ut.textContent=s?"Account":"Sign in";u.setAttribute("aria-label",s?"Your account":"Sign in or your account");u.classList.toggle("pic",!!(s&&v));if(s&&v)u.style.setProperty("background-image","url("+v+")","important");else u.style.removeProperty("background-image")}};
function out(e){if(e)e.preventDefault();var d=function(){try{localStorage.removeItem("gu-in");localStorage.removeItem("gu-av");localStorage.removeItem("gu-progress");localStorage.removeItem("gu-ws");sessionStorage.removeItem("gu-nm")}catch(x){}location.href="account.html"};fetch("api/logout.php",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json","X-GU":"1"},body:"{}"}).then(d,d)}
if(o)o.addEventListener("click",out);
var pop=document.getElementById("user-pop"),wrap=document.querySelector(".user-wrap"),po=document.getElementById("up-out"),pn=document.getElementById("up-n");
function nm(){var n=null;try{n=sessionStorage.getItem("gu-nm")}catch(e){}if(n){pn.textContent="Hi, "+n.split(" ")[0];return}
if(!on())return;fetch("api/me.php",{credentials:"same-origin"}).then(function(r){return r.json()}).then(function(d){if(d&&d.user&&d.user.name){try{sessionStorage.setItem("gu-nm",d.user.name)}catch(e){}pn.textContent="Hi, "+d.user.name.split(" ")[0]}}).catch(function(){})}
function show(v){if(!pop)return;pop.hidden=!(v&&on());if(!pop.hidden)nm()}
if(po)po.addEventListener("click",out);
if(wrap&&u&&pop){var hov=window.matchMedia&&matchMedia("(hover:hover)").matches,t=null;
wrap.addEventListener("mouseenter",function(){if(!hov)return;clearTimeout(t);show(true)});
wrap.addEventListener("mouseleave",function(){if(!hov)return;t=setTimeout(function(){show(false)},200)});
wrap.addEventListener("focusin",function(e){try{if(e.target.matches(":focus-visible"))show(true)}catch(x){}});
wrap.addEventListener("focusout",function(){setTimeout(function(){if(!wrap.contains(document.activeElement))show(false)},0)});
u.addEventListener("click",function(e){if(!on()||hov)return;if(pop.hidden){e.preventDefault();show(true)}});
document.addEventListener("click",function(e){if(!wrap.contains(e.target))show(false)});
document.addEventListener("keydown",function(e){if(e.key==="Escape")show(false)})}
window.guMenu()})();</script>
</body>
</html>
"""

TOOLS = [
    ("unscrambler", "/", "Wu", "Word unscrambler", "Turn jumbled letters into every word they can make."),
    ("anagram", "anagram-solver.html", "As", "Anagram solver", "Find words that use every one of your letters."),
    ("counter", "word-counter.html", "123", "Word counter", "Count words, characters, sentences and reading time."),
    ("case", "case-converter.html", "Cc", "Case converter", "Switch text between upper, lower, title and sentence case."),
    ("random", "random-word-picker.html", "Rnd", "Random word picker", "Pull random words, with an optional length."),
    ("calculators", "calculators.html", "123", "Calculators", "Free money, maths, health and everyday calculators."),
]


TOOL_ICONS = {
    "unscrambler": '<path d="M4 7h4v4H4zM10 7h4v4h-4zM16 7h4v4h-4z"/><path d="M5 17h14M15 14l4 3-4 3"/>',
    "anagram": '<path d="M4 8h13M13 4l4 4-4 4"/><path d="M20 16H7M11 12l-4 4 4 4"/>',
    "counter": '<path d="M4 6h16M4 11h16M4 16h9"/><path d="M16 19l1.6-4 1.6 4M16.5 18h2.2"/>',
    "case": '<path d="M3 17l4-10 4 10M4.5 13.5h5"/><path d="M14 17v-6.5M14 12.8a2.6 2.6 0 112.6 3.9c-1.4 0-2.6-1-2.6-3.9z"/>',
    "random": '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 8.5v.01M15.5 8.5v.01M12 12v.01M8.5 15.5v.01M15.5 15.5v.01"/>',
    "calculators": '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01"/>',
}


def tool_icon(key, size=26):
    return '<svg class="ic" viewBox="0 0 24 24" width="%d" height="%d" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>' % (size, size, TOOL_ICONS[key])


def cards(skip=None):
    out = ['<div class="cards">']
    for key, href, tile, name, text in TOOLS:
        if key == skip:
            continue
        out.append('<a class="card" href="%s"><div class="tile ct">%s</div><h3>%s</h3><p>%s</p></a>' % (href, tool_icon(key), name, text))
    out.append("</div>")
    return "\n".join(out)


DICT_ROW = """<div class="dict-row">
<label for="dictionary">Dictionary</label>
<select id="dictionary" class="field">
<option value="enable" selected>US Scrabble (about 173,000 words)</option>
<option value="extended">UK Scrabble (about 245,000 words)</option>
</select>
<label class="check"><input type="checkbox" id="hide-rude"> Hide offensive words</label>
<p class="dict-note">US Scrabble has about 173,000 words and UK Scrabble about 245,000. Playing Words With Friends? Use US Scrabble. Neither is an official game list, so check disputed words against your own game.</p>
</div>"""

FILTERS = """<div class="filters">
<div class="fgroup"><label for="starts">Starts with</label><input id="starts" class="field" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="e.g. t"></div>
<div class="fgroup"><label for="ends">Ends with</label><input id="ends" class="field" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="e.g. ar"></div>
<div class="fgroup"><label for="contains">Contains</label><input id="contains" class="field" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="e.g. ea"></div>
<div class="fgroup"><label for="length">Word length</label><input id="length" class="field" type="number" inputmode="numeric" min="2" max="15" placeholder="Any"></div>
</div>"""


def letters_input(button_text):
    return """<label for="letters">Your letters</label>
<div class="row">
<input id="letters" class="field big" type="text" maxlength="15" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="e.g. aertp" aria-describedby="letters-hint">
<button class="btn" type="submit">%s</button>
</div>
<p id="letters-hint" class="hint">Up to 15 letters. Use ? or * for a blank tile.</p>""" % button_text


HUB = """<div class="hub">
<hr class="hb-rule">
<nav class="hb-cats" aria-label="Browse by category"><div class="dir-col"><h3><svg class="ci" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 4a2 2 0 114 0v1.5h3.5V9H19a2 2 0 110 4h-1.5v6.5H4V13h1.5a2 2 0 100-4H4V5.5h6z"/></svg>Puzzles</h3><ul><li><a href="games.html#wordsearch">Word search</a></li><li><a href="games.html#wordle">Wordle Global</a></li><li><a href="games.html#crossword">Mini Crossword</a></li><li><a href="games.html#sudoku">Sudoku</a></li><li class="dir-more"><a href="games.html">More&hellip;</a></li></ul></div><div class="dir-col"><h3><svg class="ci" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 3v3M15 3v3M8.5 11l1.8 1.8L14 9.5M8.5 17h7"/></svg>Planners</h3><ul><li><a href="weekly-planner.html">Weekly planner</a></li><li><a href="monthly-budget-planner.html">Monthly budget planner</a></li><li><a href="monthly-habit-tracker.html">Monthly habit tracker</a></li><li class="dir-more"><a href="planners.html">More&hellip;</a></li></ul></div><div class="dir-col"><h3><svg class="ci" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="7" width="19" height="11" rx="5"/><path d="M7.5 10.5v4M5.5 12.5h4M15.5 11.5v.01M18 13.5v.01"/></svg>Games</h3><ul><li><a href="games.html#hangman">Hangman</a></li><li><a href="games.html#connect4">Connect 4</a></li><li><a href="games.html#memory">Memory match</a></li><li><a href="games.html#maze">Maze</a></li><li class="dir-more"><a href="games.html">More&hellip;</a></li></ul></div><div class="dir-col"><h3><svg class="ci" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></svg>Retro games</h3><ul><li><a href="games.html#retrosnake">Snake</a></li><li><a href="games.html#blaster">Space Invaders</a></li><li><a href="games.html#bricks">Brick Smash</a></li><li><a href="games.html#runner">Offline Runner</a></li><li class="dir-more"><a href="games.html#arcade">More&hellip;</a></li></ul></div><div class="dir-col"><h3><svg class="ci" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7.5h7M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15h.01M8.5 18h.01M12 18h.01"/></svg>Calculators</h3><ul><li><a href="salary-calculator.html">Salary calculator</a></li><li><a href="mortgage-calculator.html">Mortgage calculator</a></li><li><a href="percentage-calculator.html">Percentage calculator</a></li><li><a href="bmi-calculator.html">BMI calculator</a></li><li class="dir-more"><a href="calculators.html">More&hellip;</a></li></ul></div><div class="dir-col"><h3><svg class="ci" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5h14M5 10h14M5 15h9M5 20h6"/></svg>Word lists</h3><ul><li><a href="two-letter-words.html">2-letter words</a></li><li><a href="three-letter-words.html">3-letter words</a></li><li><a href="five-letter-words.html">5-letter words</a></li><li><a href="words-with-z.html">Words with Z</a></li><li class="dir-more"><a href="word-lists.html">More&hellip;</a></li></ul></div></nav>
<nav class="hb-jump" aria-label="Jump to a section"><a href="#s-games">Puzzles</a><a href="#s-retro">Retro games</a><a href="#s-lists">Word lists</a><a href="#s-tools">Word tools</a><a href="#s-calc">Calculators</a><a href="#s-guides">Guides</a><a href="#hb-prog">Your progress</a></nav>
<section class="hb-sec" id="s-games" aria-labelledby="hb-games"><div class="hb-head"><div><h2 id="hb-games">Puzzles &amp; Games</h2><p class="hb-sub">Free puzzles you can play right here.</p></div><a class="hb-arrow" href="games.html" aria-label="See all games"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></a></div>
<div class="hb-grid">
<a class="hb-card c-teal" data-pop="300!" href="games.html#wordsearch"><span class="hb-ic">Ws</span><b>Word search</b><span>10 categories and 300 puzzles. Your progress is saved as you go.</span><em>1 player</em></a>
<a class="hb-card c-green" data-pop="DAILY" href="games.html#wordle"><span class="hb-ic">W5</span><b>Wordle Global</b><span>Guess the five-letter word in six tries. A new word every day, plus unlimited play.</span><em>1 player</em></a>
<a class="hb-card c-pink" data-pop="DAILY" href="games.html#crossword"><span class="hb-ic">5x5</span><b>Mini Crossword</b><span>A quick crossword with clues across and down. A new puzzle every day, and you can print them.</span><em>1 player</em></a>
<a class="hb-card c-yellow" href="games.html#sudoku"><span class="hb-ic">9&times;9</span><b>Sudoku</b><span>Three levels, from a gentle warm-up to a proper head-scratcher.</span><em>1 player</em></a>
<a class="hb-card c-pink" href="games.html#connect4"><span class="hb-ic">4</span><b>Connect 4</b><span>Drop discs and line up four. Beat the computer or a friend.</span><em>1-2 players</em></a>
<a class="hb-card c-lilac" data-pop="2 PLAYERS" href="games.html#hangman"><span class="hb-ic">A_</span><b>Hangman</b><span>Guess the word one letter at a time, or set a secret word for a friend.</span><em>1-2 players</em></a>
<a class="hb-card c-green" href="games.html#memory"><span class="hb-ic">??</span><b>Memory match</b><span>Flip the cards and find every pair in as few moves as you can.</span><em>1-2 players</em></a>
<a class="hb-card c-orange" href="games.html#snakes"><span class="hb-ic">1-100</span><b>Snakes and ladders</b><span>Climb the ladders, dodge the snakes and race to 100.</span><em>1-2 players</em></a>
<a class="hb-card c-teal" href="games.html#ttt"><span class="hb-ic">XO</span><b>Tic tac toe</b><span>Three in a row wins. Easy, hard, or two players on one device.</span><em>1-2 players</em></a>
<a class="hb-card c-lilac" href="games.html#maze"><span class="hb-ic">&#9638;</span><b>Maze</b><span>Find your way from the dot to the flag. Three sizes, and you can print them.</span><em>1 player</em></a>
<a class="hb-card hb-more" data-pop="FREE!" href="account.html"><span class="hb-ic">&#9733;</span><b>Save your progress</b><span>Sign in free to keep your games and scores on every device.</span><em>Free account</em></a>
</div></section>
<section class="hb-sec" id="s-retro" aria-labelledby="hb-retro"><div class="hb-head"><div><h2 id="hb-retro">Retro games</h2><p class="hb-sub">Simple games to play in your browser.</p></div><a class="hb-arrow" href="games.html#arcade" aria-label="See all games"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></a></div>
<div class="hb-grid">
<a class="hb-card c-teal" href="games.html#runner"><span class="hb-ic">Rn</span><b>Offline Runner</b><span>Jump the cactuses and run as far as you can.</span><em>Arcade</em></a>
<a class="hb-card c-teal" href="games.html#retrosnake"><span class="hb-ic">Sn</span><b>Snake</b><span>Eat, grow and don't hit the walls or yourself.</span><em>Arcade</em></a>
<a class="hb-card c-teal" href="games.html#bricks"><span class="hb-ic">Br</span><b>Brick Smash</b><span>Bounce the ball and smash every brick.</span><em>Arcade</em></a>
<a class="hb-card c-teal" href="games.html#blaster"><span class="hb-ic">Si</span><b>Space Invaders</b><span>Shoot the invaders before they reach you.</span><em>Arcade</em></a>
</div></section>
<section class="hb-sec" id="s-lists" aria-labelledby="hb-lists"><div class="hb-head"><div><h2 id="hb-lists">Word Lists</h2><p class="hb-sub">Browse words by length and first letter.</p></div><a class="hb-arrow" href="word-lists.html" aria-label="All word lists"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></a></div>
<div class="hb-links">
<a href="two-letter-words.html">2-letter words</a><a href="three-letter-words.html">3-letter words</a><a href="four-letter-words.html">4-letter words</a><a href="five-letter-words.html">5-letter words</a><a href="six-letter-words.html">6-letter words</a><a href="seven-letter-words.html">7-letter words</a><a href="eight-letter-words.html">8-letter words</a><a href="words-with-z.html">Words with Z</a><a href="words-with-q-without-u.html">Q without U</a><a href="words-with-j-and-x.html">Words with J and X</a>
</div></section>
<section class="hb-sec" id="s-tools" aria-labelledby="hb-tools"><div class="hb-head"><div><h2 id="hb-tools">Word Tools</h2><p class="hb-sub">Free helpers for writing and word games.</p></div><a class="hb-arrow" href="tools.html" aria-label="All tools"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></a></div>
<div class="hb-grid">
<a class="hb-card c-yellow" href="anagram-solver.html"><span class="hb-ic">ABC</span><b>Anagram solver</b><span>Find the words that use every one of your letters.</span></a>
<a class="hb-card c-teal" href="word-counter.html"><span class="hb-ic">123</span><b>Word counter</b><span>Count words, characters and sentences as you type.</span></a>
<a class="hb-card c-pink" href="case-converter.html"><span class="hb-ic">Aa</span><b>Case converter</b><span>Switch text to upper, lower, title or sentence case.</span></a>
<a class="hb-card c-lilac" href="random-word-picker.html"><span class="hb-ic">?!</span><b>Random word picker</b><span>Pull random words for games, prompts and spelling tests.</span></a>
</div></section>
<section class="hb-sec" id="s-calc" aria-labelledby="hb-calc"><div class="hb-head"><div><h2 id="hb-calc">Calculators</h2><p class="hb-sub">70+ free calculators for money, maths, health, home and more.</p></div><a class="hb-arrow" href="calculators.html" aria-label="All calculators"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div>
<div class="hb-grid">
<a class="hb-card c-orange" href="salary-calculator.html"><span class="hb-ic"><svg class="ic" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v.01M18 14.5v.01"/></svg></span><b>Salary calculator</b><span>Hourly, monthly and yearly pay, plus UK take-home.</span></a>
<a class="hb-card c-green" href="mortgage-calculator.html"><span class="hb-ic"><svg class="ic" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7.5 9 7.5"/><path d="M5.5 9.5V20.5h13V9.5M10 20.5v-6h4v6"/></svg></span><b>Mortgage calculator</b><span>Monthly payment and total interest.</span></a>
<a class="hb-card c-teal" href="scientific-calculator.html"><span class="hb-ic"><svg class="ic" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15h.01M8.5 18h.01M12 18h.01"/></svg></span><b>Scientific calculator</b><span>Trig, logs, powers and brackets.</span></a>
<a class="hb-card c-pink" href="percentage-calculator.html"><span class="hb-ic"><svg class="ic" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 5L5 19"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg></span><b>Percentage calculator</b><span>Percent of, change, increase and decrease.</span></a>
<a class="hb-card c-lilac" href="bmi-calculator.html"><span class="hb-ic"><svg class="ic" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4" width="17" height="16" rx="3"/><path d="M8 11a4 4 0 018 0"/><path d="M12 11l2-2.5"/></svg></span><b>BMI calculator</b><span>Body mass index and a healthy range.</span></a>
<a class="hb-card c-yellow" href="calculators.html"><span class="hb-ic"><svg class="ic" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01"/></svg></span><b>All calculators</b><span>Over 40 free calculators in one place.</span></a>
</div></section>
<section class="hb-sec" id="s-guides" aria-labelledby="hb-guides"><div class="hb-head"><div><h2 id="hb-guides">Tips &amp; Guides</h2><p class="hb-sub">Short guides to help you score more.</p></div><a class="hb-arrow" href="guides.html" aria-label="All guides"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></a></div>
<div class="hb-grid">
<a class="hb-card c-green" href="scrabble-tips.html"><b>Scrabble tips</b><span>Score more with short words, hooks and smart tile swaps.</span></a>
<a class="hb-card c-yellow" href="wordle-tips.html"><b>Five-letter puzzle tips</b><span>Pick better starting words and narrow it down fast.</span></a>
<a class="hb-card c-teal" href="crossword-help.html"><b>Crossword help</b><span>Fill the gaps with patterns, lengths and known letters.</span></a>
<a class="hb-card c-pink" href="what-is-an-anagram.html"><b>What is an anagram?</b><span>How rearranged letters make new words, with examples.</span></a>
</div></section>
<section class="hb-sec" aria-labelledby="hb-try"><h2 id="hb-try">Try a scramble</h2>
<p class="hb-sub">Tap a jumble and watch <b>go</b>unscramble crack it, or roll a new set.</p>
<div class="hb-chips" id="hb-chips"><button type="button" data-rack="lesnit">LESNIT</button><button type="button" data-rack="rnaedg">RNAEDG</button><button type="button" data-rack="asrtem">ASRTEM</button><button type="button" data-rack="mektra">MEKTRA</button><button type="button" data-rack="oerangs">OERANGS</button><button type="button" data-rack="scrambl?">SCRAMBL?</button></div><div class="hb-rollrow"><button type="button" class="hb-roll" id="hb-roll" aria-label="Show new scrambles"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 11-2.4-5.7"/><path d="M20 4v5h-5"/></svg><span>New scrambles</span></button></div>
</section>
</div>
"""

_PLCOL='<h3>Planners</h3><ul><li><a href="planners.html">All planners</a></li>'+"".join('<li><a href="%s">%s</a></li>'%(x["file"],x["name"]) for x in PL.P)+"</ul>"

def _hub_dir(hub):
    cols=[]
    for sid,title in (("s-games","Puzzles"),("s-retro","Retro games"),("s-tools","Word tools"),("s-lists","Word lists"),("s-calc","Calculators"),("s-guides","Tips &amp; guides")):
        m=re.search(r'<section class="hb-sec" id="%s".*?</section>'%sid,hub,re.S)
        if not m: continue
        seg=m.group(0); items=[]
        for a in re.finditer(r'<a ([^>]*)>(.*?)</a>',seg,re.S):
            attrs,inner=a.group(1),a.group(2)
            if "hb-more" in attrs or "hb-all" in attrs or "hb-arrow" in attrs: continue
            h=re.search(r'href="([^"]+)"',attrs)
            b=re.search(r'<b>(.*?)</b>',inner)
            label=b.group(1) if b else re.sub(r'<[^>]+>','',inner).strip()
            if h and label: items.append('<li><a href="%s">%s</a></li>'%(h.group(1),label))
        cols.append((sid,'<h3>%s</h3><ul>%s</ul>'%(title,"".join(items))))
    d=dict(cols)
    blk=lambda sid: '<div class="hd-col">%s</div>'%d[sid] if sid in d else ""
    pl='<div class="hd-col">%s</div>'%_PLCOL
    # three even columns: puzzles / word lists + calculators / the rest
    g1=["@@ABOUT@@",blk("s-games"),pl]
    g2=[blk("s-lists"),blk("s-calc")]
    g3=[blk("s-retro"),blk("s-tools"),blk("s-guides")]
    cols=["<div class=\"hd-grp\">%s</div>"%"".join(g) for g in (g1,g2,g3)]
    return '<nav class="hb-dir" aria-label="All games, tools and guides">'+"".join(cols)+'</nav>\n'
_ABOUT='<div class="hd-col"><h3>About</h3><ul><li><a href="about.html">About us</a></li><li><a href="contact.html">Contact</a></li><li><a href="privacy.html">Privacy</a></li><li><a href="terms.html">Terms</a></li><li><a href="credits.html">Credits</a></li><li><a href="faq.html">FAQ</a></li></ul></div>'
FOOT_DIR=_hub_dir(HUB).replace('<nav class="hb-dir" aria-label="All games, tools and guides">','<nav class="hb-dir" aria-label="Site directory">',1).replace("@@ABOUT@@",_ABOUT,1)
FOOTER=FOOTER.replace('<footer class="site-footer"><div class="wrap">','<footer class="site-footer"><div class="wrap">'+FOOT_DIR,1)

HOME = """<main>
<section class="hero-band"><div class="board hm hm-top">
<h1 class="vh">Word unscrambler: unscramble letters into words</h1>
<a class="hero-brand" href="/" aria-label="GoUnscramble home"><img class="mark" src="assets/logo.png" width="61" height="61" alt="" decoding="async"><img class="wmimg" src="assets/wordmark.png" width="260" height="38" alt="gounscramble." decoding="async"></a>
<form id="f" class="box" autocomplete="off">
<svg class="sico" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#9aa1ae" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>
<input id="rack" type="text" inputmode="text" enterkeyhint="search" maxlength="15" spellcheck="false" autocapitalize="off" placeholder="e.g. read?" aria-label="Your letters">
<button class="x" id="clr" type="button" aria-label="Clear letters" hidden><svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="#000" stroke-width="2.6" stroke-linecap="round"/></svg></button>
<button class="go" type="submit" aria-label="Unscramble">GO</button>
</form>
<p class="hint">Enter letters (use <i>?</i> or <i>*</i> as a wildcard). Max letters 15.</p>
<div class="optrow"><span class="free-badge" aria-label="Free to use, no sign-up needed">FREE!</span>
<button class="optbtn" id="optbtn" type="button" aria-expanded="false" aria-controls="opts"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>Options<svg class="chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
<div class="opts" id="opts" hidden>
<div class="og"><span class="og-t">Narrow your results</span>
<div class="og-grid">
<label class="opt">Starts with<input id="o-starts" type="text" maxlength="8" placeholder="sc" autocapitalize="off"></label>
<label class="opt">Ends with<input id="o-ends" type="text" maxlength="8" placeholder="le" autocapitalize="off"></label>
<label class="opt">Contains<input id="o-has" type="text" maxlength="8" placeholder="ram" autocapitalize="off"></label>
<label class="opt">Word length<span class="len-row"><select id="o-len"><option value="">Any</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option><option value="15">15</option></select><button class="x-clr" id="clrf" type="button" aria-label="Clear options" title="Clear options">×</button></span></label>
</div></div>
<div class="og og-foot"><span class="dict-grp"><span class="dict-lbl">Dictionary</span><label class="sw sw-dict"><span class="sw-side on" data-side="enable">US</span><input class="sw-in" id="o-uk" type="checkbox" aria-label="Dictionary: switch on for UK, off for US"><span class="sw-tr" aria-hidden="true"></span><span class="sw-side" data-side="extended">UK</span></label><input type="hidden" id="o-dict" value="enable"></span><label class="sw"><input class="sw-in" id="o-safe" type="checkbox" checked><span class="sw-tr" aria-hidden="true"></span><span>Hide offensive words</span></label></div>
</div></div>
</div></section>
<div class="hm home-res"><div id="out" aria-live="polite"></div></div>
<div class="home-extra">
@@HUB@@
<div class="hm hm-after">
<section class="about" aria-labelledby="ab-h"><h2 id="ab-h">What is <b>go</b>unscramble?</h2>
<p><b>go</b>unscramble is a free home for word tools, puzzles, calculators and printable planners. Its word unscrambler turns a jumble of letters into every word they can make, which is handy for Scrabble, Words With Friends, Wordle, crosswords and anagram games. Alongside it you will find word games and puzzles to play, and 70+ easy calculators for money, maths, health and everyday sums.</p>
<h3>How to use it</h3>
<p>Type your letters, then press GO. Use <b>?</b> or <b>*</b> for a blank tile. Tap any word to look up its meaning. Use the options to narrow results by length, start, end or letters inside.</p>
<h3>Scores and word list</h3>
<p>Each word shows its tile score, with the highest scoring words first. Every tile shows its Scrabble letter value, and a blue number appears above it when Words With Friends scores that letter differently. Each word shows its Scrabble total in grey and, when different, its Words With Friends total in blue. Words come from our US or UK Scrabble list, explained under Our dictionary below.</p>
<p>Looking for more? Open the menu for the anagram solver, word games and puzzles, the <a href="calculators.html">calculators</a> and the free <a href="planners.html">printable planners</a>. <a href="about.html">Read more about <b>go</b>unscramble</a>.</p></section>
<p class="fine">If a letter in Starts with, Ends with or Contains is missing from your tiles, it is added. A wildcard tile scores 0.</p>
</div>
<div class="hub hub-prog">
<section class="hb-sec" id="hb-prog" aria-labelledby="hb-me"><div class="hb-head"><h2 id="hb-me">Your progress</h2><button type="button" class="hb-dyhint" id="hb-dyhint" hidden aria-label="Write in your daily journal"><svg class="dh-ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1z"/><path d="M14 7l3 3"/></svg><span class="dh-t">Daily journal</span></button><span class="hb-doodle" id="hb-doodle" aria-hidden="true"><svg viewBox="0 0 450 78" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 24h86M34 38h76M20 52h82"/><g class="dd-a"><path d="M126 22H330V6L432 38 330 70V54H126Z" transform="translate(5 5)" fill="#000" stroke="#000"/><path d="M126 22H330V6L432 38 330 70V54H126Z" fill="#ffd23f"/><text x="226" y="47" text-anchor="middle" font-family="Fredoka,Nunito,system-ui,sans-serif" font-weight="700" font-size="28" fill="#000" stroke="none" letter-spacing="1">LET'S GO!</text></g><path class="dd-s" fill="#ff6b6b" stroke-width="3" d="M196 1l2.6 5.2 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/><path class="dd-s" fill="#bfe6ee" stroke-width="3" d="M262 63l2.6 5.2 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg></span><a id="hb-acc" href="account.html">Sign in to save it &rsaquo;</a></div>
<div class="hb-me">
<div class="hb-mine"><p id="hb-hi" class="hb-hi">Play a game or unscramble some letters and your days light up on the calendar.</p>
<ul class="hb-nums" id="hb-nums"></ul>
<div id="hb-go" class="hb-go"></div>
<div class="hb-diary" id="hb-diary" aria-label="Diary"></div></div>
<div class="hb-cal" id="hb-cal" aria-label="Days you played and diary"></div>
<div class="hb-lock" id="hb-lock" hidden><span class="free-badge lock-free" aria-hidden="true">FREE!</span><b>Your progress is waiting</b><p>Sign in to see your activity, play calendar and saved games. Signed out, nothing is saved on this device.</p><div class="hb-lockbtns"><a class="hb-btn" href="account.html">Sign in</a><a class="hb-btn alt" href="account.html">Create free account</a></div></div>
</div></section>
</div>
@@HOME_EXTRA@@
</div>
</main>
"""

ANAGRAM = """<main><div class="wrap">
<section class="hero">
<h1>Anagram solver</h1>
<p class="lede">Find the words that use every one of your letters.</p>
<form id="tool-form" class="panel" novalidate>
@@LETTERS@@
@@DICT@@
<div class="row end"><button type="button" class="btn alt clear-btn" id="clear-all">Clear all</button></div>
</form>
<section id="results" class="results" aria-live="polite"></section>
</section>
<section class="block narrow">
<h2>How it works</h2>
<p>An anagram uses all of the letters you give it, once each. Type your letters and the solver lists every word of exactly that length. Add a ? or * for a blank tile that can stand for any letter. To see shorter words too, use the <a href="/">word unscrambler</a>.</p>
</section>
@@ANAGRAM_EXTRA@@
<section class="block">
<h2>More free tools</h2>
@@CARDS@@
</section>
</div></main>
"""

RANDOM = """<main><div class="wrap">
<section class="hero">
<h1>Random word picker</h1>
<p class="lede">Pull a handful of random words. Leave the length blank for any length.</p>
<form id="tool-form" class="panel" novalidate>
<div class="filters" style="border-top:0;padding-top:0">
<div class="fgroup"><label for="count">How many words</label><input id="count" class="field" type="number" inputmode="numeric" min="1" max="20" value="5" data-default="5"></div>
<div class="fgroup"><label for="length">Word length</label><input id="length" class="field" type="number" inputmode="numeric" min="2" max="15" placeholder="Any"></div>
</div>
@@DICT@@
<div class="row"><button class="btn" type="submit">Pick words</button><button type="button" class="btn alt clear-btn" id="clear-all">Clear all</button></div>
</form>
<section id="results" class="results" aria-live="polite"></section>
</section>
@@RANDOM_EXTRA@@
<section class="block">
<h2>More free tools</h2>
@@CARDS@@
</section>
</div></main>
"""

COUNTER = """<main><div class="wrap">
<section class="hero">
<h1>Word counter</h1>
<p class="lede">Paste or type your text. The counts update as you go.</p>
<div class="panel">
<label for="text">Your text</label>
<textarea id="text" class="field area" spellcheck="true" placeholder="Start typing or paste your text here"></textarea>
<div class="btns"><button type="button" class="btn alt clear-btn" id="clear-all">Clear all</button></div>
<dl class="stats">
<div class="stat"><dt>Words</dt><dd id="s-words">0</dd></div>
<div class="stat"><dt>Characters</dt><dd id="s-chars">0</dd></div>
<div class="stat"><dt>Characters (no spaces)</dt><dd id="s-nospace">0</dd></div>
<div class="stat"><dt>Sentences</dt><dd id="s-sentences">0</dd></div>
<div class="stat"><dt>Paragraphs</dt><dd id="s-paragraphs">0</dd></div>
<div class="stat"><dt>Reading time</dt><dd id="s-reading">0 min</dd></div>
</dl>
<p class="hint">Reading time assumes about 200 words a minute.</p>
</div>
</section>
@@COUNTER_EXTRA@@
<section class="block">
<h2>More free tools</h2>
@@CARDS@@
</section>
</div></main>
"""

CASE = """<main><div class="wrap">
<section class="hero">
<h1>Case converter</h1>
<p class="lede">Paste your text, then pick a case.</p>
<div class="panel">
<label for="text">Your text</label>
<textarea id="text" class="field area" spellcheck="true" placeholder="Start typing or paste your text here"></textarea>
<div class="btns">
<button type="button" class="btn alt" data-case="upper">UPPER CASE</button>
<button type="button" class="btn alt" data-case="lower">lower case</button>
<button type="button" class="btn alt" data-case="title">Title Case</button>
<button type="button" class="btn alt" data-case="sentence">Sentence case</button>
<button type="button" class="btn" id="copy" style="min-height:48px;padding:0 20px;font-size:18px">Copy</button>
<button type="button" class="btn alt clear-btn" id="clear-all">Clear all</button>
</div>
<p id="status" class="status" aria-live="polite"></p>
</div>
</section>
@@CASE_EXTRA@@
<section class="block">
<h2>More free tools</h2>
@@CARDS@@
</section>
</div></main>
"""

TOOLS_PAGE = """<main><div class="wrap">
<section class="prose">
<h1>Free tools</h1>
<p>Everything here runs in your browser. You do not need an account.</p>
</section>
<section class="block" style="margin-top:32px">
@@CARDS@@
</section>
@@TOOLS_EXTRA@@
</div></main>
"""

ABOUT = """<main><div class="wrap"><article class="prose">
<h1>About <b>go</b>unscramble</h1>
<p><b>go</b>unscramble is a free home for word tools, puzzles and calculators. Its unscrambler turns jumbled letters into real words: type the letters you have, add a ? or * for any blank tile, and it lists every word they can make, longest first. You will also find word games and puzzles to play, and more than 70 simple calculators for money, maths, health and everyday sums.</p>
<div class="cards guide-cards">
<div class="card"><h3>Narrow the list</h3><p>Open <em>More options</em> on the home page to choose a dictionary, or to filter by the letters a word starts with, ends with or contains, and by its length.</p></div>
<div class="card"><h3>Dictionaries</h3><p>Two word lists are available: US Scrabble (ENABLE, about 173,000 words) and UK Scrabble (about 245,000 words, built from open sources). Words With Friends players should use US Scrabble. The official US (NWL) and UK (CSW) lists are not included.</p></div>
<div class="card"><h3>Your privacy</h3><p>The tools run in your browser. The letters and text you type stay on your device. See the <a href="privacy.html">privacy page</a> for details.</p></div>
<div class="card"><h3>Get in touch</h3><p>Spotted a missing word or a bug? Use the <a href="contact.html">contact page</a>.</p></div>
</div>
</article></div></main>
"""

def cardify(body):
    """Turn each <h2> section of a text page into a card, like the Guides page."""
    head, _, rest = body.partition("\n<h2>")
    if not rest:
        return body
    rest, _, tail = ("<h2>" + rest).rpartition("</article>")
    parts = re.split(r"(?=<h2>)", rest)
    cards = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        m = re.match(r"<h2>(.*?)</h2>\s*(.*)", part, re.S)
        cards.append('<div class="card"><h3>%s</h3>%s</div>' % (m.group(1), m.group(2).strip()))
    return head + '\n<div class="cards guide-cards">\n' + "\n".join(cards) + "\n</div>\n</article>" + tail

PRIVACY = """<main><div class="wrap"><article class="prose">
<h1>Privacy</h1>
<p>Last updated 12 October 2026.</p>
<h2>What you type</h2>
<p>The unscrambler and the other tools run in your browser. The letters and text you type are not sent to our server.</p>
<h2>Accounts</h2>
<p>An account is optional. If you create one, we store your email address, your display name and a hashed version of your password (we never keep the password itself). If you sign in with Google, we receive your name and email address from Google instead. We use your email to sign you in, to send you a welcome message and to send password reset links. We do not send marketing email.</p>
<h2>Your profile</h2>
<p>On your account page you can add a profile picture, a short bio, a location and a favourite game. All of these are optional, are only visible to you, and are stored with your account. You can change or remove them at any time. The picture is resized in your browser before it is saved.</p>
<h2>Saved progress</h2>
<p>Your game progress and activity, plus any short diary notes you write on the calendar, such as word search puzzles you have started or finished, your Sudoku game, your Wordle Global and Mini Crossword streaks and stats, your best Maze times, your scores and your play calendar, is saved to your account while you are signed in, so it follows you between devices. When you sign out, it is removed from your device, and signed-out play is not saved. You can reset it, or delete your account, from the account page at any time.</p>
<h2>Cookies and browser storage</h2>
<p>When you sign in we set one session cookie to keep you signed in. While you are signed in we also use your browser's local storage to keep your game progress and remember that you are signed in. Signing out clears it. These are needed for the features you ask for. Advertising cookies are covered below.</p>
<h2>Deleting your account</h2>
<p>You can delete your account yourself at any time from the account page. Deleting it permanently removes your account, profile and saved progress. You can also reset just your game and activity data there, and your account and profile stay. If you cannot sign in, email <a href="mailto:hello@gounscramble.com">hello@gounscramble.com</a> from the address you signed up with and we will delete it for you.</p>
<h2>Weather, history and news tile</h2>
<p>The home page shows a small weather tile and an on this day fact. To do this, your browser asks Open-Meteo for the weather for the city in your time zone, and asks Wikipedia for a fact about today's date. Those services can see your IP address, as any website you visit would. We do not send them anything you type, and we do not store the result.</p>
<h2>Server logs</h2>
<p>Our hosting provider may keep standard server logs, such as your IP address and the pages requested, to keep the site running and secure.</p>
<h2>Fonts</h2>
<p>Pages load the Inter font from Google Fonts, so your browser contacts Google to fetch them.</p>
<h2>Advertising and analytics</h2>
<p>This site is set up to show advertising from Google AdSense. Google and its advertising partners may use cookies and similar technologies to show ads, measure them and, where you allow it, personalise them. In the UK and the European Economic Area you will be asked for your choice through a consent message. You can learn how Google uses data from sites that use its services at <a href="https://policies.google.com/technologies/partner-sites">policies.google.com/technologies/partner-sites</a>, and manage ad personalisation at <a href="https://adssettings.google.com">adssettings.google.com</a>.</p>
<p>We do not use any other analytics tools at present. If that changes, we will update this page first.</p>
<h2>Your choices</h2>
<p>If you are in the UK, the European Economic Area or Switzerland, a message asks for your consent before personal data is used for advertising, and you can refuse or change your choice at any time through that message.</p>
<p>If you live in a US state with a privacy law that lets you opt out of the sale or sharing of personal information, you can use the opt-out message shown on this site. You can also manage ad personalisation at <a href="https://adssettings.google.com">adssettings.google.com</a>. To ask about your data, email <a href="mailto:hello@gounscramble.com">hello@gounscramble.com</a>.</p>
<h2>Questions</h2>
<p>Ask through the <a href="contact.html">contact page</a> or email <a href="mailto:hello@gounscramble.com">hello@gounscramble.com</a>.</p>
</article></div></main>
"""

TERMS = """<main><div class="wrap"><article class="prose">
<h1>Terms and conditions</h1>
<p>Last updated 11 October 2026.</p>
<p>These terms apply when you use gounscramble.com (the "site"). By using the site or creating an account you agree to them. If you do not agree, please do not use the site.</p>
<h2>Who we are</h2>
<p><b>go</b>unscramble is an independent website. You can reach us through the <a href="contact.html">contact page</a> or at <a href="mailto:hello@gounscramble.com">hello@gounscramble.com</a>.</p>
<h2>Using the site</h2>
<p>The word tools, games and calculators are free to use for personal, non-commercial purposes. Please do not misuse the site, for example by trying to break or overload it, scraping it at scale, probing it for weaknesses or using it for anything unlawful.</p>
<h2>Your account</h2>
<p>An account is optional. You must give accurate details, keep your password safe and tell us if you think someone else has used your account. You are responsible for what happens under your account. You can ask us to delete your account at any time by emailing us from the address you signed up with. We may suspend or remove accounts that break these terms.</p>
<h2>Your profile and content</h2>
<p>Your profile picture, bio and other details are yours. Only upload a picture you have the right to use, and do not add anything unlawful, offensive or misleading. We may remove content that breaks these rules.</p>
<h2>For information only, not advice</h2>
<p>Everything on the site, including calculator results, word lists, tips, guides and any other content, is provided for general information and entertainment only. It is <b>not</b> financial, tax, investment, mortgage, pension, legal, medical, health, nutrition, fitness, engineering or other professional advice, and it should not be relied on as such. We are not financial advisers, lawyers, doctors or other regulated professionals, and nothing here creates an adviser and client relationship. Before you make any decision that matters, such as taking out a loan or mortgage, changing your pension, filing a tax return, starting a diet or exercise plan, or buying materials for a build, speak to a suitably qualified professional.</p>
<h2>Calculators and results</h2>
<p>The calculators give estimates based on the numbers you enter and on rates, thresholds and formulas that we have built in, such as UK tax and National Insurance figures for the 2026/27 tax year. Rules and rates change, the real world is more complicated than any form, and we may make mistakes or leave out details that apply to you. Results can differ from what your employer, lender, tax authority, doctor or other provider works out, and theirs is the one that counts. Please check anything important against official sources before acting on it. You are responsible for the accuracy of what you type in and for how you use the results.</p>
<h2>Word lists and accuracy</h2>
<p>Our word lists and results are provided as a guide. They may not match the dictionary or rules of a particular game or competition, so please check important words against the official list. Word meanings and scores are shown for convenience and may contain mistakes.</p>
<h2>Our content</h2>
<p>The site design, logo, text and code belong to us or are used with permission. Word list sources are credited on the <a href="credits.html">credits page</a>. You may not copy or resell the site or its content without our written permission.</p>
<h2>Advertising and links</h2>
<p>The site may show advertising and may link to other websites. We do not control other websites and are not responsible for their content or practices.</p>
<h2>Availability and changes</h2>
<p>We try to keep the site running but cannot promise it will always be available or error free. We may change, pause or remove features, including saved progress, at any time.</p>
<h2>Our responsibility</h2>
<p>The site is provided "as is" and "as available", without any promise that it is accurate, complete, up to date or suitable for your purpose. To the fullest extent the law allows, we accept no responsibility and are not liable for any loss, cost or damage, whether direct or indirect, arising from using the site or relying on its calculators, results or other content, including any financial, legal, tax, health or other decision you make. Nothing in these terms limits any right you have as a consumer or excludes liability that cannot lawfully be excluded, such as for death or personal injury caused by negligence or for fraud.</p>
<h2>Privacy</h2>
<p>How we handle your data is explained on the <a href="privacy.html">privacy page</a>.</p>
<h2>Changes and governing law</h2>
<p>We may update these terms and will change the date above when we do. Continuing to use the site means you accept the updated terms. These terms are governed by the laws of England and Wales, and the courts of England and Wales will have jurisdiction, unless your local consumer law says otherwise.</p>
<h2>Questions</h2>
<p>Ask through the <a href="contact.html">contact page</a> or email <a href="mailto:hello@gounscramble.com">hello@gounscramble.com</a>.</p>
</article></div></main>
"""

CONTACT = """<main><div class="wrap"><article class="prose">
<h1>Contact</h1>
<p>Questions, corrections or word suggestions? We would like to hear from you.</p>
<div class="cards guide-cards">
<div class="card"><h3>Email us</h3><p>Send an email to <a href="mailto:hello@gounscramble.com">hello@gounscramble.com</a>.</p></div>
<div class="card"><h3>Missing or wrong word?</h3><p>If you think a word is missing or wrong, tell us the word and the game or dictionary you are using, and we will take a look. We read every message, but we cannot promise a reply to each one.</p></div>
</div>
</article></div></main>
"""

CREDITS = """<main><div class="wrap"><article class="prose">
<h1>Credits</h1>
<h2>Word lists</h2>
<p>The standard word list is ENABLE, the Enhanced North American Benchmark Lexicon, which is in the public domain.</p>
<p>The extended word list combines ENABLE with words from the English Speller Database (ESDB, formerly SCOWL), including spelling variants for American, British and Canadian English. Offensive words are flagged using the same database. Both are used under the notices below.</p>
<p>The official US (NWL) and UK (CSW) tournament lists are not used, and the extended list is not a copy of any of them.</p>
<h3>English Speller Database notice</h3>
<pre class="notice">Copyright 2000-2026 by Kevin Atkinson

Permission to use, copy, modify, distribute, and sell any part of the English
Speller Database (ESDB, previously known as SCOWLv2), or word lists
created from it, is hereby granted without fee, provided that the above
copyright notice appears in all copies and that both the above copyright
notice and this notice appear in supporting documentation.  Kevin Atkinson
makes no representations about the suitability of this database for any
purpose.  It is provided "as is" without express or implied warranty.

ESDB is derived from many sources, most of which are in the Public Domain.
Data from the Corpus of Contemporary American English (COCA) was also used.

All data from COCA comes from 3-gram data that is not freely available;
however, the usage is within the rights given by the NDA that was signed when
purchasing the data.  More information on COCA is available at
https://www.english-corpora.org/coca/.

The primary source of words for ESDB comes from 12dicts and ENABLE2K.  Both
are in the Public Domain, but Alan Beale &lt;biljir@pobox.com&gt; deserves special
credit as he is the author of 12dicts and a major contributor to ENABLE2K.  In
addition, he gave me an incredible amount of feedback and created a number of
special lists in order to help improve the overall quality of ESDB.</pre>
<h3>UK Advanced Cryptics Dictionary notice</h3>
<pre class="notice">' applies.

If you are distributing the database or results from the 
database that is not a speller dictionary or generated word list, then both
copyrights may apply depending on the parts you use.  In addition, the WordNet
copyright MIGHT apply as WordNet was one of many sources used for the initial
POS assignment.

=== AU

The initial information for Australian English comes from Benjamin Titze:

  Copyright 2016 by Benjamin Titze

  Permission to use, copy, modify, distribute and sell this array, the
  associated software, and its documentation for any purpose is hereby
  granted without fee, provided that the above copyright notice appears
  in all copies and that both that copyright notice and this permission
  notice appear in supporting documentation. Benjamin Titze makes no
  representations about the suitability of this array for any
  purpose. It is provided "as is" without express or implied warranty.</pre>
<h2>Fonts</h2>
<p>The site uses Inter, released under the SIL Open Font License and served by Google Fonts.</p>
</article></div></main>
"""

ACCOUNT = open(os.path.join(ROOT, "account_body.html"), encoding="utf-8").read()
GAMES = open(os.path.join(ROOT, "games_body.html"), encoding="utf-8").read()

PAGES = [
    dict(file="calculators.html", page="calculators", nav="calculators", body=CALC.hub(),
         title="Free Online Calculators | GoUnscramble",
         desc="Free online calculators: salary, mortgage, loan, compound interest, percentage, scientific, BMI, calorie, age, date and more. Simple, fast and private."),
    dict(file="index.html", page="home", nav="home", body=HOME,
         title="GoUnscramble: Word Unscrambler, Puzzles, Calculators & Planners",
         desc="Free word unscrambler and anagram solver, plus word games, puzzles, 70+ calculators and free printable planners. Fast, free and private."),
    dict(file="anagram-solver.html", page="anagram", nav="anagram", body=ANAGRAM, skip="anagram",
         title="Anagram Solver | GoUnscramble",
         desc="Find the words that use every one of your letters. A free anagram solver with blank tile support."),
    dict(file="random-word-picker.html", page="random", nav="random", body=RANDOM, skip="random",
         title="Random Word Picker | GoUnscramble",
         desc="Pull random words from the dictionary, with an optional word length."),
    dict(file="word-counter.html", page="counter", nav="counter", body=COUNTER, skip="counter",
         title="Word Counter | GoUnscramble",
         desc="Count words, characters, sentences and paragraphs, and see the reading time. Free and private."),
    dict(file="case-converter.html", page="case", nav="case", body=CASE, skip="case",
         title="Case Converter | GoUnscramble",
         desc="Switch text between upper case, lower case, title case and sentence case."),
    dict(file="account.html", page="account", nav="account", body=ACCOUNT, noindex=True,
         title="Sign in | GoUnscramble",
         desc="Sign in or create a free GoUnscramble account."),
    dict(file="games.html", page="games", nav="games", body=GAMES,
         title="Free Puzzles & Games: Wordle Global, Mini Crossword | GoUnscramble",
         desc="Free puzzles and games you can play in your browser: Wordle Global (a daily five-letter word game), a daily Mini Crossword, word search, Sudoku, Snakes and ladders, Connect 4, Tic tac toe, Maze, Memory match and Hangman, plus retro arcade games like Retro Snake, Brick Smash and Star Blaster."),
    dict(file="tools.html", page="tools", nav="tools", body=TOOLS_PAGE,
         title="Free Word Tools | GoUnscramble",
         desc="Free word and text tools: word unscrambler, anagram solver, word counter, case converter and random word picker."),
    dict(file="planners.html", page="planners", nav="planners", body=PL.hub(),
         title="Free Printable Planners (PDF) | GoUnscramble",
         desc="Free printable planners: weekly planner, monthly budget planner and habit tracker. Download a PDF in A4 or US Letter and print at home. No sign-up."),
    dict(file="weekly-planner.html", page="planner", nav="planners", body=PL.page("weekly-planner"), title=PL.BY["weekly-planner"]["title"], desc=PL.BY["weekly-planner"]["desc"]),
    dict(file="monthly-budget-planner.html", page="planner", nav="planners", body=PL.page("monthly-budget-planner"), title=PL.BY["monthly-budget-planner"]["title"], desc=PL.BY["monthly-budget-planner"]["desc"]),
    dict(file="monthly-habit-tracker.html", page="planner", nav="planners", body=PL.page("monthly-habit-tracker"), title=PL.BY["monthly-habit-tracker"]["title"], desc=PL.BY["monthly-habit-tracker"]["desc"]),
    dict(file="about.html", page="about", nav="about", body=ABOUT,
         title="About | GoUnscramble",
         desc="About GoUnscramble, a free home for a word unscrambler, word tools, puzzles and games, 70+ everyday calculators and free printable planners."),
    dict(file="privacy.html", page="privacy", nav=None, body=cardify(PRIVACY),
         title="Privacy | GoUnscramble",
         desc="How GoUnscramble handles what you type and what your browser sends."),
    dict(file="terms.html", page="terms", nav=None, body=cardify(TERMS),
         title="Terms and Conditions | GoUnscramble",
         desc="The terms for using GoUnscramble and its free word tools, games, calculators and optional accounts. Information only, not financial, legal or medical advice."),
    dict(file="contact.html", page="contact", nav=None, body=CONTACT,
         title="Contact | GoUnscramble",
         desc="Get in touch with GoUnscramble."),
    dict(file="credits.html", page="credits", nav=None, body=cardify(CREDITS),
         title="Credits | GoUnscramble",
         desc="Word list and font credits for GoUnscramble."),
]


GUIDE_WRAP = '<main><div class="wrap"><article class="prose">\n%s\n</article></div></main>\n'


def fill_extras(body):
    faq_home = G.faq_html(G.FAQ_ITEMS[:5])
    return (body
            .replace("@@HUB@@", HUB).replace("@@HOME_EXTRA@@", G.HOME_EXTRA.replace("@@FAQ@@", faq_home))
            .replace("@@ANAGRAM_EXTRA@@", G.ANAGRAM_EXTRA)
            .replace("@@RANDOM_EXTRA@@", G.RANDOM_EXTRA)
            .replace("@@COUNTER_EXTRA@@", G.COUNTER_EXTRA)
            .replace("@@CASE_EXTRA@@", G.CASE_EXTRA)
            .replace("@@TOOLS_EXTRA@@", G.TOOLS_EXTRA))


def asset_version(name):
    path = os.path.join(OUT, "assets", name)
    try:
        with open(path, "rb") as f:
            return hashlib.md5(f.read()).hexdigest()[:8]
    except OSError:
        return "0"


def seo_tags(p, url):
    """Open Graph, Twitter card and JSON-LD structured data for one page."""
    esc = lambda t: t.replace("&", "&amp;").replace('"', "&quot;")
    img = SITE + "/assets/og.png?v=4"
    tags = [
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="GoUnscramble">',
        '<meta property="og:title" content="%s">' % esc(p["title"]),
        '<meta property="og:description" content="%s">' % esc(p["desc"]),
        '<meta property="og:url" content="%s">' % url,
        '<meta property="og:image" content="%s">' % img,
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta property="og:image:alt" content="GoUnscramble: word tools, puzzles, calculators and planners">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="twitter:title" content="%s">' % esc(p["title"]),
        '<meta name="twitter:description" content="%s">' % esc(p["desc"]),
        '<meta name="twitter:image" content="%s">' % img,
    ]
    graph = []
    if p["file"] == "index.html":
        graph.append({"@type": "WebSite", "name": "GoUnscramble", "url": SITE + "/", "inLanguage": "en", "description": "Free word unscrambler, word tools, puzzles, games, calculators and printable planners."})
    else:
        crumbs = [("Home", SITE + "/"), (p["title"].replace(" | GoUnscramble", ""), url)]
        graph.append({"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(crumbs)]})
    tools = {"index.html", "anagram-solver.html", "random-word-picker.html", "word-counter.html", "case-converter.html"}
    if p["file"] in tools or p.get("app"):
        graph.append({"@type": "WebApplication", "name": p["title"].split(" | ")[0].split(":")[0], "url": url,
                      "description": p["desc"], "applicationCategory": "UtilitiesApplication",
                      "operatingSystem": "Any", "browserRequirements": "Requires JavaScript",
                      "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}})
    if p["file"] == "faq.html":
        graph.append({"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", a)}}
            for q, a in G.FAQ_ITEMS]})
    ld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(",", ":"))
    tags.append('<script type="application/ld+json">%s</script>' % ld.replace("</", "<\\/"))
    return "\n".join(tags)


def build_page(p):
    body = (fill_extras(p["body"])
            .replace("@@LETTERS@@", letters_input("GO"))
            .replace("@@DICT@@", DICT_ROW)
            .replace("@@FILTERS@@", FILTERS)
            .replace("@@CHEVRON@@", CHEVRON)
            .replace("@@CARDS@@", cards(p.get("skip"))))
    header = HEADER.replace("@@LOGO52@@", logo(52))
    for key in ("home", "anagram", "games", "counter", "case", "random", "calculators", "planners", "tools", "guides", "about", "account"):
        header = header.replace("@@CUR_%s@@" % key, ' aria-current="page"' if p["nav"] == key else "")
    footer = FOOTER.replace("@@LOGO32@@", logo(32)).replace("@@SOCIAL@@", social_html())
    path = "" if p["file"] == "index.html" else p["file"]
    head = (HEAD.replace("@@TITLE@@", p["title"].replace("&","&amp;")).replace("@@DESC@@", p["desc"].replace("&","&amp;").replace(chr(34),"&quot;"))
            .replace("@@CANON@@", SITE + "/" + path).replace("@@PAGE@@", p["page"]))
    head = head.replace("@@SEO@@", seo_tags(p, SITE + "/" + path))
    home = p["file"] == "index.html"
    games = p["file"] == "games.html"
    acct = p["file"] == "account.html"
    extra_css = ('<link rel="stylesheet" href="assets/home.css">' if home else
                 '<link rel="stylesheet" href="assets/games.css">' if games else
                 '<link rel="stylesheet" href="assets/account.css">\n<meta name="robots" content="noindex">' if acct else "")
    head = head.replace("@@HOMECSS@@", extra_css)
    if games:
        head = head.replace("family=Inter:", "family=Press+Start+2P&amp;family=Inter:")
    page = head + header + body + footer
    if home:
        page = page.replace('<script src="assets/app.js"></script>', '<script src="assets/progress.js"></script><script src="assets/home.js"></script><script src="assets/hub.js"></script>')
    if games:
        page = page.replace('<script src="assets/app.js"></script>', '<script src="assets/progress.js"></script><script src="assets/games.js"></script><script src="assets/arcade.js"></script><script src="assets/print.js"></script>')
    if acct:
        page = page.replace('<script src="assets/app.js"></script>', '<script src="assets/progress.js"></script><script src="assets/account.js"></script>')
    for name in ("styles.css", "engine.js", "app.js", "home.css", "home.js", "games.css", "games.js", "arcade.js", "print.js", "progress.js", "hub.js", "account.css", "account.js", "calc.js", "calcprint.js", "salary.js", "minimal.css", "dark.css", "logo.png", "wordmark.png"):
        page = page.replace("assets/%s\"" % name, "assets/%s?v=%s\"" % (name, asset_version(name)))
    for fav in ("favicon.png", "favicon-192.png", "apple-touch-icon.png"):
        try:
            v = hashlib.md5(open(os.path.join(OUT, fav), "rb").read()).hexdigest()[:8]
        except OSError:
            v = "0"
        page = page.replace('href="%s"' % fav, 'href="%s?v=%s"' % (fav, v))
    def _ver_file(m):
        try:
            v = hashlib.md5(open(os.path.join(OUT, m.group(1)), "rb").read()).hexdigest()[:8]
        except OSError:
            return m.group(0)
        return m.group(1) + "?v=" + v + '"'
    page = re.sub(r'((?:assets/planners/[a-z0-9-]+\.webp)|(?:downloads/[a-z0-9-]+\.pdf))"', _ver_file, page)
    return page


def guide_pages():
    words_path = os.path.join(OUT, "words", "enable.txt")
    words = G.load_words(words_path)
    pages = []
    for fname, article in G.guide_bodies(words).items():
        title, desc = G.PAGE_META[fname]
        pages.append(dict(file=fname, page="guide", nav="guides", body=GUIDE_WRAP % article,
                          title=title + " | GoUnscramble", desc=desc))
    import wordpages as W
    for fname, (title, desc, article) in W.build(W.load(os.path.dirname(OUT) if False else OUT)).items():
        pages.append(dict(file=fname, page="guide", nav="guides", body=GUIDE_WRAP % article,
                          title=title + " | GoUnscramble", desc=desc))
    return pages


def sitemap(pages):
    urls = [SITE + "/" if p["file"] == "index.html" else SITE + "/" + p["file"] for p in pages if not p.get("noindex")]
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "".join("  <url><loc>%s</loc><lastmod>%s</lastmod></url>\n" % (u, datetime.date.today().isoformat()) for u in urls) + "</urlset>\n")


def main():
    os.makedirs(OUT, exist_ok=True)
    calc_pages = [dict(file=c["file"], page="calc", nav="calculators", body=CALC.body(c["slug"]), app=True,
                       title=c["name"] + " | GoUnscramble", desc=c["lede"]) for c in CALC.C]
    pages = PAGES + calc_pages + guide_pages()
    for p in pages:
        with open(os.path.join(OUT, p["file"]), "w", encoding="utf-8") as f:
            f.write(build_page(p))
    with open(os.path.join(OUT, "ads.txt"), "w", encoding="utf-8") as f:
        f.write("google.com, pub-6517978259411056, DIRECT, f08c47fec0942fa0\n")
    with open(os.path.join(OUT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write(sitemap(pages))
    print("built %d pages into %s" % (len(pages), OUT))


if __name__ == "__main__":
    main()
