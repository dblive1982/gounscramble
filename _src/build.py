#!/usr/bin/env python3
"""Builds every GoUnscramble page from ONE shared layout, so header, footer and head always match.
Run: python3 build.py   (writes the .html files into ./site, leaves assets/ and words/ alone)"""
import os
import re
import sys
import hashlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import guides as G

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("GU_OUT") or os.path.join(ROOT, "site")
SITE = "https://gounscramble.com"

CHEVRON = ('<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6l5 5 5-5" fill="none" '
           'stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>')


def logo(size):
    return (
        '<svg width="%d" height="%d" viewBox="0 0 100 100" aria-hidden="true">'
        '<g transform="rotate(9 68 46)"><rect x="44" y="22" width="48" height="48" rx="12" fill="#2FBF71" stroke="#111111" stroke-width="5"></rect>'
        '<text x="68" y="57" text-anchor="middle" font-family="Fredoka, Arial Rounded MT Bold, sans-serif" font-weight="700" font-size="34" fill="#111111">O</text></g>'
        '<g transform="rotate(-10 31 52)"><rect x="6" y="27" width="50" height="50" rx="13" fill="#FFD23F" stroke="#111111" stroke-width="5"></rect>'
        '<text x="31" y="63" text-anchor="middle" font-family="Fredoka, Arial Rounded MT Bold, sans-serif" font-weight="700" font-size="35" fill="#111111">G</text></g>'
        '</svg>' % (size, size)
    )


HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>@@TITLE@@</title>
<meta name="description" content="@@DESC@@">
<link rel="canonical" href="@@CANON@@">
<meta name="theme-color" content="#F4F5F7">
<meta name="google-adsense-account" content="ca-pub-6517978259411056">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6517978259411056" crossorigin="anonymous"></script>
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&amp;family=Nunito:wght@400;600;700&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/styles.css">
</head>
<body data-page="@@PAGE@@">
"""

HEADER = """<!--header-->
<header class="site-header"><div class="wrap">
<a class="brand" href="index.html" aria-label="GoUnscramble home">@@LOGO52@@<span>Unscramble</span></a>
<nav class="nav" aria-label="Main">
<a href="index.html"@@CUR_home@@>GoUnscramble</a>
<a href="tools.html"@@CUR_tools@@>Tools</a>
<a href="guides.html"@@CUR_guides@@>Guides</a>
<a href="about.html"@@CUR_about@@>About</a>
</nav>
</div></header>
<!--/header-->
"""

FOOTER = """<!--footer-->
<footer class="site-footer"><div class="wrap">
<div class="foot-brand">@@LOGO32@@<span>&copy; 2026 GoUnscramble</span></div>
<nav class="nav" aria-label="Footer">
<a href="credits.html">Credits</a>
<a href="faq.html">FAQ</a>
<a href="privacy.html">Privacy</a>
<a href="contact.html">Contact</a>
</nav>
</div></footer>
<!--/footer-->
<script src="assets/engine.js"></script>
<script src="assets/app.js"></script>
</body>
</html>
"""

TOOLS = [
    ("unscrambler", "index.html", "Un", "Word unscrambler", "Turn jumbled letters into every word they can make."),
    ("anagram", "anagram-solver.html", "AB", "Anagram solver", "Find words that use every one of your letters."),
    ("counter", "word-counter.html", "123", "Word counter", "Count words, characters, sentences and reading time."),
    ("case", "case-converter.html", "Aa", "Case converter", "Switch text between upper, lower, title and sentence case."),
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


HOME = """<main><div class="wrap">
<section class="hero">
<h1>Unscramble any word in seconds</h1>
<p class="lede">Type your jumbled letters and see every word they can make.</p>
<form id="tool-form" class="panel" novalidate>
@@LETTERS@@
<div class="more-row">
<details class="more">
<summary>More options@@CHEVRON@@</summary>
<div class="opts">
@@DICT@@
@@FILTERS@@
</div>
</details>
<button type="button" class="btn alt clear-btn" id="clear-all">Clear all</button>
</div>
</form>
<button type="button" id="example" class="example" aria-label="Try the example: letters T E A R">
<span class="letters" id="ex-letters" aria-hidden="true"><span class="ltile">T</span><span class="ltile">E</span><span class="ltile">A</span><span class="ltile">R</span></span>
<span class="arrow" aria-hidden="true">&rarr;</span>
<span class="pills" id="ex-pills" aria-hidden="true"><span class="pill">rate</span><span class="pill">tear</span><span class="pill">tare</span></span>
</button>
<section id="results" class="results" aria-live="polite"></section>
</section>
<section class="block">
<h2>More free tools</h2>
@@CARDS@@
</section>
<section class="block narrow">
<h2>About GoUnscramble</h2>
<p>GoUnscramble turns jumbled letters into real words, and adds a few handy text tools alongside. Use ? or * for a blank tile, then narrow the list by the letters a word starts with, ends with or contains, or by its length. It works well for word games, crosswords and anagram puzzles. <a href="about.html">Read more</a>.</p>
</section>
@@HOME_EXTRA@@
</div></main>
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
<p>Everything here runs in your browser, with no sign-up.</p>
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
<p>Last updated 9 October 2026.</p>
<h2>What you type</h2>
<p>The unscrambler and the other tools run in your browser. The letters and text you type are not sent to our server.</p>
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
<p>Headings use Fredoka and body text uses Nunito, both released under the SIL Open Font License and served by Google Fonts.</p>
</article></div></main>
"""

PAGES = [
    dict(file="index.html", page="home", nav="home", body=HOME,
         title="GoUnscramble: Unscramble Letters Into Words",
         desc="Free word unscrambler. Type your jumbled letters and see every word they can make, with filters for starts with, ends with, contains and length."),
    dict(file="anagram-solver.html", page="anagram", nav="tools", body=ANAGRAM, skip="anagram",
         title="Anagram Solver | GoUnscramble",
         desc="Find the words that use every one of your letters. A free anagram solver with blank tile support."),
    dict(file="random-word-picker.html", page="random", nav="tools", body=RANDOM, skip="random",
         title="Random Word Picker | GoUnscramble",
         desc="Pull random words from the dictionary, with an optional word length."),
    dict(file="word-counter.html", page="counter", nav="tools", body=COUNTER, skip="counter",
         title="Word Counter | GoUnscramble",
         desc="Count words, characters, sentences and paragraphs, and see the reading time. Free and private."),
    dict(file="case-converter.html", page="case", nav="tools", body=CASE, skip="case",
         title="Case Converter | GoUnscramble",
         desc="Switch text between upper case, lower case, title case and sentence case."),
    dict(file="tools.html", page="tools", nav="tools", body=TOOLS_PAGE,
         title="Free Word Tools | GoUnscramble",
         desc="Free word and text tools: word unscrambler, anagram solver, word counter, case converter and random word picker."),
    dict(file="about.html", page="about", nav="about", body=ABOUT,
         title="About | GoUnscramble",
         desc="About GoUnscramble, a free word unscrambler with a few handy text tools."),
    dict(file="privacy.html", page="privacy", nav=None, body=cardify(PRIVACY),
         title="Privacy | GoUnscramble",
         desc="How GoUnscramble handles what you type and what your browser sends."),
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
            .replace("@@HOME_EXTRA@@", G.HOME_EXTRA.replace("@@FAQ@@", faq_home))
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


def build_page(p):
    body = (fill_extras(p["body"])
            .replace("@@LETTERS@@", letters_input("Find anagrams" if p["page"] == "anagram" else "GoUnscramble"))
            .replace("@@DICT@@", DICT_ROW)
            .replace("@@FILTERS@@", FILTERS)
            .replace("@@CHEVRON@@", CHEVRON)
            .replace("@@CARDS@@", cards(p.get("skip"))))
    header = HEADER.replace("@@LOGO52@@", logo(52))
    for key in ("home", "tools", "guides", "about"):
        header = header.replace("@@CUR_%s@@" % key, ' aria-current="page"' if p["nav"] == key else "")
    footer = FOOTER.replace("@@LOGO32@@", logo(32))
    path = "" if p["file"] == "index.html" else p["file"]
    head = (HEAD.replace("@@TITLE@@", p["title"]).replace("@@DESC@@", p["desc"])
            .replace("@@CANON@@", SITE + "/" + path).replace("@@PAGE@@", p["page"]))
    page = head + header + body + footer
    for name in ("styles.css", "engine.js", "app.js"):
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
    return pages


def sitemap(pages):
    urls = [SITE + "/" if p["file"] == "index.html" else SITE + "/" + p["file"] for p in pages]
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "".join("  <url><loc>%s</loc></url>\n" % u for u in urls) + "</urlset>\n")


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
