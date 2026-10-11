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
<meta name="theme-color" content="#0099b5">
<meta name="google-adsense-account" content="ca-pub-6517978259411056">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6517978259411056" crossorigin="anonymous"></script>
<link rel="icon" href="favicon.png" type="image/png">
<link rel="icon" href="favicon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&amp;family=Nunito:wght@600;700;800&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/styles.css">
@@HOMECSS@@
</head>
<body data-page="@@PAGE@@">
"""

HEADER = """<!--header-->
<header class="site-header"><div class="wrap">
<a class="brand" href="index.html" aria-label="GoUnscramble home"><img class="logo-img" src="assets/logo.png" width="352" height="300" alt="GO! Unscramble!"></a>
<a class="user-btn" href="account.html" aria-label="Sign in or your account"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2.6"></circle><path d="M4.5 20c.8-4 3.8-6 7.5-6s6.7 2 7.5 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"></path></svg></a>
<nav class="nav main-nav" aria-label="Main">
<details class="menu">
<summary aria-label="Menu"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"></path></svg></summary>
<div class="menu-list">
<button type="button" class="menu-x" aria-label="Close menu"><svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M4 4l14 14M18 4L4 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path></svg></button>
<a href="index.html"@@CUR_home@@>Word unscrambler</a>
<a href="anagram-solver.html"@@CUR_anagram@@>Anagram solver</a>
<a href="games.html"@@CUR_games@@>Puzzles &amp; games</a>
<hr>
<a href="word-counter.html"@@CUR_counter@@>Word counter</a>
<a href="case-converter.html"@@CUR_case@@>Case converter</a>
<a href="random-word-picker.html"@@CUR_random@@>Random word picker</a>
<hr>
<a href="guides.html"@@CUR_guides@@>Guides</a>
<a href="tools.html"@@CUR_tools@@>All tools</a>
<a href="about.html"@@CUR_about@@>About</a>
<hr>
<a href="account.html"@@CUR_account@@>Sign in</a>
<a href="account.html" class="menu-out" id="menu-out" hidden>Sign out</a>
<button type="button" class="theme-toggle" id="theme-toggle" aria-label="Switch to dark mode" title="Dark mode" hidden></button>
</div>
</details>
</nav>
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
<div class="foot-brand"><span>&copy; 2026 GoUnscramble</span></div>
<p class="foot-secure"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 018 0v3"/></svg><span><b>Secure site.</b> Encrypted HTTPS connection. Passwords are stored scrambled, never in plain text.</span></p>
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
<script>(function(){var m=document.querySelector(".menu");if(!m)return;function c(){m.removeAttribute("open")}m.addEventListener("click",function(e){if(e.target===m||e.target.closest(".menu-x"))c()});document.addEventListener("keydown",function(e){if(e.key==="Escape")c()})})();(function(){var o=document.getElementById("menu-out"),a=document.querySelector('.menu-list a[href="account.html"]'),u=document.querySelector(".user-btn");
function on(){try{return localStorage.getItem("gu-in")==="1"}catch(e){return false}}
window.guMenu=function(){var s=on(),v=null;try{v=localStorage.getItem("gu-av")}catch(e){}
if(o)o.hidden=!s;if(a)a.textContent=s?"Your account":"Sign in";
if(u){u.setAttribute("aria-label",s?"Your account":"Sign in or your account");u.classList.toggle("pic",!!(s&&v));u.style.backgroundImage=(s&&v)?"url("+v+")":""}};
if(o)o.addEventListener("click",function(e){e.preventDefault();var d=function(){try{localStorage.removeItem("gu-in");localStorage.removeItem("gu-av")}catch(x){}location.href="account.html"};fetch("api/logout.php",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json","X-GU":"1"},body:"{}"}).then(d,d)});
window.guMenu()})();</script>
</body>
</html>
"""

TOOLS = [
    ("unscrambler", "index.html", "Wu", "Word unscrambler", "Turn jumbled letters into every word they can make."),
    ("anagram", "anagram-solver.html", "As", "Anagram solver", "Find words that use every one of your letters."),
    ("counter", "word-counter.html", "123", "Word counter", "Count words, characters, sentences and reading time."),
    ("case", "case-converter.html", "Cc", "Case converter", "Switch text between upper, lower, title and sentence case."),
    ("random", "random-word-picker.html", "Rnd", "Random word picker", "Pull random words, with an optional length."),
]


def cards(skip=None):
    out = ['<div class="cards">']
    for key, href, tile, name, text in TOOLS:
        if key == skip:
            continue
        out.append('<a class="card" href="%s"><div class="tile">%s</div><h3>%s</h3><p>%s</p></a>' % (href, tile, name, text))
    out.append("</div>")
    return "\n".join(out)


DICT_ROW = """<div class="dict-row">
<label for="dictionary">Dictionary</label>
<select id="dictionary" class="field">
<option value="enable" selected>ENABLE (general English)</option>
<option value="nwl" disabled>US and Canada (NWL), coming soon</option>
<option value="csw" disabled>UK (CSW), coming soon</option>
</select>
<label class="check"><input type="checkbox" id="hide-rude"> Hide offensive words</label>
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
<section class="hb-stats" aria-label="GoUnscramble at a glance">
<div><b>172,823</b><span>words in the list</span></div>
<div><b>7</b><span>free games</span></div>
<div><b>300</b><span>word searches</span></div>
<div><b>$0</b><span>always free</span></div>
</section>
<section class="hb-sec" aria-labelledby="hb-me"><div class="hb-head"><h2 id="hb-me">Your progress</h2><a id="hb-acc" href="account.html">Sign in to save it &rsaquo;</a></div>
<div class="hb-me">
<div class="hb-mine"><p id="hb-hi" class="hb-hi">Play a game or unscramble some letters and your days light up on the calendar.</p>
<ul class="hb-nums" id="hb-nums"></ul>
<div id="hb-go" class="hb-go"></div></div>
<div class="hb-cal" id="hb-cal" aria-label="Days you played"></div>
</div></section>
<section class="hb-sec" aria-labelledby="hb-try"><h2 id="hb-try">Try a scramble</h2>
<p class="hb-sub">Tap a jumble and watch GoUnscramble crack it.</p>
<div class="hb-chips"><button type="button" data-rack="lesnit">LESNIT</button><button type="button" data-rack="rnaedg">RNAEDG</button><button type="button" data-rack="asrtem">ASRTEM</button><button type="button" data-rack="mektra">MEKTRA</button><button type="button" data-rack="oerangs">OERANGS</button><button type="button" data-rack="scrambl?">SCRAMBL?</button></div>
</section>
<section class="hb-sec" aria-labelledby="hb-games"><div class="hb-head"><h2 id="hb-games">Play free games</h2><a href="games.html">See all games &rsaquo;</a></div>
<div class="hb-grid">
<a class="hb-card c-teal" data-pop="300!" href="games.html#wordsearch"><span class="hb-ic">Ws</span><b>Word search</b><span>10 categories and 300 puzzles. Your progress is saved as you go.</span><em>1 player</em></a>
<a class="hb-card c-yellow" href="games.html#sudoku"><span class="hb-ic">9&times;9</span><b>Sudoku</b><span>Three levels, from a gentle warm-up to a proper head-scratcher.</span><em>1 player</em></a>
<a class="hb-card c-pink" href="games.html#connect4"><span class="hb-ic">4</span><b>Connect 4</b><span>Drop discs and line up four. Beat the computer or a friend.</span><em>1-2 players</em></a>
<a class="hb-card c-lilac" data-pop="2P!" href="games.html#hangman"><span class="hb-ic">A_</span><b>Hangman</b><span>Guess the word one letter at a time, or set a secret word for a friend.</span><em>1-2 players</em></a>
<a class="hb-card c-green" href="games.html#memory"><span class="hb-ic">??</span><b>Memory match</b><span>Flip the cards and find every pair in as few moves as you can.</span><em>1-2 players</em></a>
<a class="hb-card c-orange" href="games.html#snakes"><span class="hb-ic">1-100</span><b>Snakes and ladders</b><span>Climb the ladders, dodge the snakes and race to 100.</span><em>1-2 players</em></a>
<a class="hb-card c-teal" href="games.html#ttt"><span class="hb-ic">XO</span><b>Tic tac toe</b><span>Three in a row wins. Easy, hard, or two players on one device.</span><em>1-2 players</em></a>
<a class="hb-card hb-more" data-pop="FREE!" href="account.html"><span class="hb-ic">&#9733;</span><b>Save your progress</b><span>Sign in free to keep your games and scores on every device.</span><em>Free account</em></a>
</div></section>
<section class="hb-sec" aria-labelledby="hb-tools"><div class="hb-head"><h2 id="hb-tools">Free word tools</h2><a href="tools.html">All tools &rsaquo;</a></div>
<div class="hb-grid">
<a class="hb-card c-yellow" href="anagram-solver.html"><span class="hb-ic">ABC</span><b>Anagram solver</b><span>Find the words that use every one of your letters.</span></a>
<a class="hb-card c-teal" href="word-counter.html"><span class="hb-ic">123</span><b>Word counter</b><span>Count words, characters and sentences as you type.</span></a>
<a class="hb-card c-pink" href="case-converter.html"><span class="hb-ic">Aa</span><b>Case converter</b><span>Switch text to upper, lower, title or sentence case.</span></a>
<a class="hb-card c-lilac" href="random-word-picker.html"><span class="hb-ic">?!</span><b>Random word picker</b><span>Pull random words for games, prompts and spelling tests.</span></a>
</div></section>
<section class="hb-sec" aria-labelledby="hb-facts"><h2 id="hb-facts">Did you know?</h2>
<div class="hb-facts">
<div class="hb-fact"><b>28</b><span>letters in the longest word in our list: <i>ethylenediaminetetraacetates</i>.</span></div>
<div class="hb-fact"><b>12</b><span>different words hide in the letters A, E, P, R and S, including <i>spare</i>, <i>pears</i> and <i>reaps</i>.</span></div>
<div class="hb-fact"><b>5</b><span>words from LISTEN: <i>silent</i>, <i>enlist</i>, <i>tinsel</i>, <i>inlets</i> and <i>listen</i> itself.</span></div>
<div class="hb-fact"><b>0</b><span>vowels in <i>rhythms</i>. The Y does all the work.</span></div>
<div class="hb-fact"><b>10</b><span>letters in <i>typewriter</i>, the longest word you can type on the top row of a keyboard.</span></div>
<div class="hb-fact"><b>A-Z</b><span><i>Almost</i> has its letters in alphabetical order. So does <i>billowy</i>.</span></div>
<div class="hb-fact"><b>96</b><span>two-letter words in the list. Learn them and your Scrabble score will thank you.</span></div>
<div class="hb-fact"><b>8,636</b><span>five-letter words, which is why Wordle can keep surprising you.</span></div>
</div></section>
<section class="hb-sec" aria-labelledby="hb-lists"><div class="hb-head"><h2 id="hb-lists">Browse word lists</h2><a href="word-lists.html">All word lists &rsaquo;</a></div>
<div class="hb-links">
<a href="two-letter-words.html">2-letter words</a><a href="three-letter-words.html">3-letter words</a><a href="four-letter-words.html">4-letter words</a><a href="five-letter-words.html">5-letter words</a><a href="six-letter-words.html">6-letter words</a><a href="seven-letter-words.html">7-letter words</a><a href="eight-letter-words.html">8-letter words</a><a href="words-with-z.html">Words with Z</a><a href="words-with-q-without-u.html">Q without U</a><a href="words-with-j-and-x.html">Words with J and X</a>
</div></section>
<section class="hb-sec" aria-labelledby="hb-guides"><div class="hb-head"><h2 id="hb-guides">Tips and guides</h2><a href="guides.html">All guides &rsaquo;</a></div>
<div class="hb-grid">
<a class="hb-card c-green" href="scrabble-tips.html"><b>Scrabble tips</b><span>Score more with short words, hooks and smart tile swaps.</span></a>
<a class="hb-card c-yellow" href="wordle-tips.html"><b>Five-letter puzzle tips</b><span>Pick better starting words and narrow it down fast.</span></a>
<a class="hb-card c-teal" href="crossword-help.html"><b>Crossword help</b><span>Fill the gaps with patterns, lengths and known letters.</span></a>
<a class="hb-card c-pink" href="what-is-an-anagram.html"><b>What is an anagram?</b><span>How rearranged letters make new words, with examples.</span></a>
</div></section>
</div>
"""

HOME = """<main class="board hm">
<h1 class="vh">Word unscrambler: unscramble letters into words</h1>
<form id="f" class="box" autocomplete="off">
<svg class="mag" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3.2" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="M15 15l6 6"/></svg>
<input id="rack" type="text" inputmode="text" enterkeyhint="search" maxlength="15" spellcheck="false" autocapitalize="off" placeholder="e.g. scrambl?" aria-label="Your letters">
<button class="x" id="clr" type="button" aria-label="Clear letters" hidden><svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="#000" stroke-width="2.6" stroke-linecap="round"/></svg></button>
<button class="go" type="submit">GO!</button>
</form>
<p class="hint">Enter letters (use <i>?</i> or <i>*</i> as a wildcard). Max letters 15.</p>
<div class="optrow"><button class="chip" id="optbtn" type="button" aria-expanded="false" aria-controls="opts">Options <span class="car" aria-hidden="true">&#9662;</span></button></div>
<div class="opts" id="opts" hidden>
<label class="opt chk"><input class="chk-box" id="o-safe" type="checkbox" checked><span>Hide offensive words</span></label>
<label class="opt" style="grid-column:1/-1">Scoring<select id="o-dict" aria-label="Scoring"><option value="ena">Scrabble scores (ENABLE list)</option><option value="wwf">Words With Friends scores (ENABLE list)</option></select></label>
<label class="opt">Length<select id="o-len"><option value="">Any</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option><option value="15">15</option></select></label>
<label class="opt">Starts with<input id="o-starts" type="text" maxlength="8" placeholder="sc" autocapitalize="off"></label>
<label class="opt">Ends with<input id="o-ends" type="text" maxlength="8" placeholder="le" autocapitalize="off"></label>
<label class="opt">Contains<input id="o-has" type="text" maxlength="8" placeholder="ram" autocapitalize="off"></label>
<button class="reset" id="clrf" type="button">Clear</button>
</div>
<div id="out" aria-live="polite"></div>
</main>
<div class="home-extra">
@@HUB@@
<div class="hm hm-after">
<section class="about" aria-labelledby="ab-h"><h2 id="ab-h">What is GoUnscramble?</h2>
<p>GoUnscramble turns a jumble of letters into every word they can make. It is handy for Scrabble, Words With Friends, Wordle, crosswords and anagram games.</p>
<h3>How to use it</h3>
<p>Type your letters, then press GO. Use <b>?</b> or <b>*</b> for a blank tile. Tap any word to look up its meaning. Open Options to pick a scoring or narrow results by length, start, end or letters inside.</p>
<h3>Scores and word list</h3>
<p>Each word shows its tile score, with the highest scoring words first. Choose Scrabble or Words With Friends scores to match your game. Words come from the ENABLE list, which is public domain.</p>
<p>Looking for more? Open the menu for the anagram solver and other free word tools. <a href="about.html">Read more about GoUnscramble</a>.</p></section>
<p class="fine">ENABLE and Words With Friends use the ENABLE word list (public domain). Words With Friends changes letter scores; Scrabble uses Scrabble scores. Scrabble US, UK and Collins lists are not included. If a letter in Starts with, Ends with or Contains is missing from your tiles, it is added. A wildcard tile scores 0.</p>
</div>
@@HOME_EXTRA@@
</div>
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
<p>An anagram uses all of the letters you give it, once each. Type your letters and the solver lists every word of exactly that length. Add a ? or * for a blank tile that can stand for any letter. To see shorter words too, use the <a href="index.html">word unscrambler</a>.</p>
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
<h1>About GoUnscramble</h1>
<p>GoUnscramble turns jumbled letters into real words. Type the letters you have, add a ? or * for any blank tile, and the unscrambler lists every word they can make, longest first.</p>
<div class="cards guide-cards">
<div class="card"><h3>Narrow the list</h3><p>Open <em>More options</em> on the home page to choose a dictionary, or to filter by the letters a word starts with, ends with or contains, and by its length.</p></div>
<div class="card"><h3>Dictionaries</h3><p>The unscrambler currently uses the ENABLE word list. US and Canada (NWL) and UK (CSW) dictionaries are planned.</p></div>
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
<p>Last updated 11 October 2026.</p>
<h2>What you type</h2>
<p>The unscrambler and the other tools run in your browser. The letters and text you type are not sent to our server.</p>
<h2>Accounts</h2>
<p>An account is optional. If you create one, we store your email address, your display name and a hashed version of your password (we never keep the password itself). If you sign in with Google, we receive your name and email address from Google instead. We use your email to sign you in, to send you a welcome message and to send password reset links. We do not send marketing email.</p>
<h2>Your profile</h2>
<p>On your account page you can add a profile picture, a short bio, a location and a favourite game. All of these are optional, are only visible to you, and are stored with your account. You can change or remove them at any time. The picture is resized in your browser before it is saved.</p>
<h2>Saved progress</h2>
<p>Your game progress, such as word search puzzles you have started or finished and your Sudoku game, is saved in your browser. If you are signed in, a copy is also saved to your account so it follows you between devices. Signed-out progress stays only on your device.</p>
<h2>Cookies and browser storage</h2>
<p>When you sign in we set one session cookie to keep you signed in. We also use your browser's local storage to remember game progress and whether you are signed in. These are needed for the features you ask for. Advertising cookies are covered below.</p>
<h2>Deleting your account</h2>
<p>To delete your account and everything stored with it, email <a href="mailto:hello@gounscramble.com">hello@gounscramble.com</a> from the address you signed up with.</p>
<h2>Server logs</h2>
<p>Our hosting provider may keep standard server logs, such as your IP address and the pages requested, to keep the site running and secure.</p>
<h2>Fonts</h2>
<p>Pages load the Fredoka and Nunito fonts from Google Fonts, so your browser contacts Google to fetch them.</p>
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
<p>GoUnscramble is an independent website. You can reach us through the <a href="contact.html">contact page</a> or at <a href="mailto:hello@gounscramble.com">hello@gounscramble.com</a>.</p>
<h2>Using the site</h2>
<p>The word tools and games are free to use for personal, non-commercial purposes. Please do not misuse the site, for example by trying to break or overload it, scraping it at scale, probing it for weaknesses or using it for anything unlawful.</p>
<h2>Your account</h2>
<p>An account is optional. You must give accurate details, keep your password safe and tell us if you think someone else has used your account. You are responsible for what happens under your account. You can ask us to delete your account at any time by emailing us from the address you signed up with. We may suspend or remove accounts that break these terms.</p>
<h2>Your profile and content</h2>
<p>Your profile picture, bio and other details are yours. Only upload a picture you have the right to use, and do not add anything unlawful, offensive or misleading. We may remove content that breaks these rules.</p>
<h2>Word lists and accuracy</h2>
<p>Our word lists and results are provided as a guide. They may not match the dictionary or rules of a particular game or competition, so please check important words against the official list. Word meanings and scores are shown for convenience and may contain mistakes.</p>
<h2>Our content</h2>
<p>The site design, logo, text and code belong to us or are used with permission. Word list sources are credited on the <a href="credits.html">credits page</a>. You may not copy or resell the site or its content without our written permission.</p>
<h2>Advertising and links</h2>
<p>The site may show advertising and may link to other websites. We do not control other websites and are not responsible for their content or practices.</p>
<h2>Availability and changes</h2>
<p>We try to keep the site running but cannot promise it will always be available or error free. We may change, pause or remove features, including saved progress, at any time.</p>
<h2>Our responsibility</h2>
<p>The site is provided "as is". To the fullest extent the law allows, we are not liable for any loss arising from using the site. Nothing in these terms limits any right you have as a consumer or excludes liability that cannot lawfully be excluded, such as for death or personal injury caused by negligence or for fraud.</p>
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
<h2>Word list</h2>
<p>The unscrambler uses ENABLE, the Enhanced North American Benchmark Lexicon, which is in the public domain.</p>
<p>No other word lists are used at present. If licensed lists such as NWL or CSW are added, they will be credited here.</p>
<h2>Fonts</h2>
<p>The site uses Fredoka for headings and Nunito for text, both released under the SIL Open Font License and served by Google Fonts.</p>
</article></div></main>
"""

ACCOUNT = open(os.path.join(ROOT, "account_body.html"), encoding="utf-8").read()
GAMES = open(os.path.join(ROOT, "games_body.html"), encoding="utf-8").read()

PAGES = [
    dict(file="index.html", page="home", nav="home", body=HOME,
         title="GoUnscramble: Unscramble Letters Into Words",
         desc="Free word unscrambler. Type your jumbled letters and see every word they can make, with filters for starts with, ends with, contains and length."),
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
         title="Free Puzzles & Games | GoUnscramble",
         desc="Free puzzles and games you can play in your browser: word search, Sudoku, Snakes and ladders, Connect 4, Tic tac toe, Memory match and Hangman."),
    dict(file="tools.html", page="tools", nav="tools", body=TOOLS_PAGE,
         title="Free Word Tools | GoUnscramble",
         desc="Free word and text tools: word unscrambler, anagram solver, word counter, case converter and random word picker."),
    dict(file="about.html", page="about", nav="about", body=ABOUT,
         title="About | GoUnscramble",
         desc="About GoUnscramble, a free word unscrambler with a few handy text tools."),
    dict(file="privacy.html", page="privacy", nav=None, body=cardify(PRIVACY),
         title="Privacy | GoUnscramble",
         desc="How GoUnscramble handles what you type and what your browser sends."),
    dict(file="terms.html", page="terms", nav=None, body=cardify(TERMS),
         title="Terms and Conditions | GoUnscramble",
         desc="The terms for using GoUnscramble and its free word tools, games and optional accounts."),
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
    img = SITE + "/assets/og.png"
    tags = [
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="GoUnscramble">',
        '<meta property="og:title" content="%s">' % esc(p["title"]),
        '<meta property="og:description" content="%s">' % esc(p["desc"]),
        '<meta property="og:url" content="%s">' % url,
        '<meta property="og:image" content="%s">' % img,
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta property="og:image:alt" content="GoUnscramble: free word unscrambler">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="twitter:title" content="%s">' % esc(p["title"]),
        '<meta name="twitter:description" content="%s">' % esc(p["desc"]),
        '<meta name="twitter:image" content="%s">' % img,
    ]
    graph = []
    if p["file"] == "index.html":
        graph.append({"@type": "WebSite", "name": "GoUnscramble", "url": SITE + "/", "inLanguage": "en"})
    else:
        crumbs = [("Home", SITE + "/"), (p["title"].replace(" | GoUnscramble", ""), url)]
        graph.append({"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(crumbs)]})
    tools = {"index.html", "anagram-solver.html", "random-word-picker.html", "word-counter.html", "case-converter.html"}
    if p["file"] in tools:
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
            .replace("@@LETTERS@@", letters_input("GO!"))
            .replace("@@DICT@@", DICT_ROW)
            .replace("@@FILTERS@@", FILTERS)
            .replace("@@CHEVRON@@", CHEVRON)
            .replace("@@CARDS@@", cards(p.get("skip"))))
    header = HEADER.replace("@@LOGO52@@", logo(52))
    for key in ("home", "anagram", "games", "counter", "case", "random", "tools", "guides", "about", "account"):
        header = header.replace("@@CUR_%s@@" % key, ' aria-current="page"' if p["nav"] == key else "")
    footer = FOOTER.replace("@@LOGO32@@", logo(32)).replace("@@SOCIAL@@", social_html())
    path = "" if p["file"] == "index.html" else p["file"]
    head = (HEAD.replace("@@TITLE@@", p["title"]).replace("@@DESC@@", p["desc"])
            .replace("@@CANON@@", SITE + "/" + path).replace("@@PAGE@@", p["page"]))
    head = head.replace("@@SEO@@", seo_tags(p, SITE + "/" + path))
    home = p["file"] == "index.html"
    games = p["file"] == "games.html"
    acct = p["file"] == "account.html"
    extra_css = ('<link rel="stylesheet" href="assets/home.css">' if home else
                 '<link rel="stylesheet" href="assets/games.css">' if games else
                 '<link rel="stylesheet" href="assets/account.css">\n<meta name="robots" content="noindex">' if acct else "")
    head = head.replace("@@HOMECSS@@", extra_css)
    page = head + header + body + footer
    if home:
        page = page.replace('<script src="assets/app.js"></script>', '<script src="assets/progress.js"></script><script src="assets/home.js"></script><script src="assets/hub.js"></script>')
    if games:
        page = page.replace('<script src="assets/app.js"></script>', '<script src="assets/progress.js"></script><script src="assets/games.js"></script>')
    if acct:
        page = page.replace('<script src="assets/app.js"></script>', '<script src="assets/progress.js"></script><script src="assets/account.js"></script>')
    for name in ("styles.css", "engine.js", "app.js", "home.css", "home.js", "games.css", "games.js", "progress.js", "hub.js", "account.css", "account.js"):
        page = page.replace("assets/%s\"" % name, "assets/%s?v=%s\"" % (name, asset_version(name)))
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
    pages = PAGES + guide_pages()
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
