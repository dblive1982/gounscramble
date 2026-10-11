"""Programmatic word-list pages built from the ENABLE list: words by length, by first letter, and by length + first letter.
Every page gets real, page-specific content (counts, top scorers, patterns) so none are thin copies of each other."""
import html, os
from collections import Counter

TILE = dict(zip("abcdefghijklmnopqrstuvwxyz", [1,3,3,2,1,4,2,4,1,8,5,1,3,1,1,3,10,1,1,1,1,4,4,8,4,10]))
NUM = {2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten"}
SUB_LENGTHS = (4, 5, 6, 7)          # lengths that get a page per first letter
HUB_LENGTHS = (4, 5, 6, 7, 8)       # lengths that get an overview page
MIN_WORDS = 15                      # skip combinations with fewer words than this


def score(w): return sum(TILE[c] for c in w)
def esc(s): return html.escape(s)
BAD = set()
def chips(ws): return '<div class="chips">' + "".join('<span class="chip%s">%s</span>' % (" rude" if w in BAD else "", esc(w)) for w in ws) + "</div>"
def fmt(n): return "{:,}".format(n)
def L(w): return w[0].upper()

def load(root):
    try:
        BAD.update(l.strip().lower() for l in open(os.path.join(root, "words", "offensive.txt"), encoding="utf-8"))
    except OSError:
        pass
    ws = []
    for l in open(os.path.join(root, "words", "enable.txt"), encoding="utf-8"):
        w = l.strip().lower()
        if w.isalpha():
            ws.append(w)
    return sorted(set(ws))

def f_len(n): return "%s-letter-words.html" % NUM.get(n, str(n))
def f_start(l): return "words-starting-with-%s.html" % l
def f_ls(n, l): return "%s-letter-words-starting-with-%s.html" % (NUM[n], l)

def top(ws, k=24):
    return sorted(ws, key=lambda w: (-score(w), w))[:k]

def top_list(ws, k=24):
    return '<ul class="scorelist">' + "".join('<li%s><strong>%s</strong> <span>%d points</span></li>' % (' class="rude"' if w in BAD else "", esc(w), score(w)) for w in top(ws, k)) + "</ul>"

def alpha_strip(cur, fn, avail):
    return '<p class="jump">' + " ".join(('<strong>%s</strong>' % l.upper()) if l == cur else ('<a href="%s">%s</a>' % (fn(l), l.upper())) for l in avail) + "</p>"

def footer_links(extra=""):
    return ('<h2>Keep going</h2><p>Have letters to unscramble? Use the <a href="index.html">word unscrambler</a> or the <a href="anagram-solver.html">anagram solver</a>. '
            'Browse every list on the <a href="word-lists.html">word lists</a> page.%s</p>' % extra)

def build(words):
    pages = {}
    by_len = {}
    by_start = {}
    by_ls = {}
    for w in words:
        by_len.setdefault(len(w), []).append(w)
        by_start.setdefault(w[0], []).append(w)
        by_ls.setdefault((len(w), w[0]), []).append(w)
    letters = sorted(by_start)
    total = len(words)

    # ----- per length + first letter
    for n in SUB_LENGTHS:
        avail = [l for l in letters if len(by_ls.get((n, l), [])) >= MIN_WORDS]
        for l in avail:
            ws = by_ls[(n, l)]
            c2 = Counter(w[1] for w in ws)
            common2 = ", ".join("<em>%s%s</em> (%d)" % (l, k, v) for k, v in c2.most_common(5))
            share = 100.0 * len(ws) / len(by_len[n])
            hi = top(ws, 1)[0]
            vow = sum(1 for w in ws if sum(c in "aeiou" for c in w) >= 3)
            body = """<h1>%s-letter words starting with %s</h1>
<p>There are %s %s-letter words that start with <strong>%s</strong> in the ENABLE word list used by this site. That is about %.1f%% of all %s-letter words. The highest-scoring is <strong>%s</strong>, worth %d points in standard Scrabble tile values.</p>
<div class="notice"><p>Different games use different word lists. Check unusual words against the list your game uses.</p></div>
<p class="jump">Jump to a first letter: %s</p>
<h2>All %s %s-letter words starting with %s</h2>
%s
<h2>Highest-scoring %s-letter words starting with %s</h2>
%s
<h2>Patterns in this list</h2>
<p>The most common second letters are %s. %s of these words contain three or more vowels, which can make them easier to spot when you are unscrambling.</p>
%s""" % (NUM[n].capitalize(), L(l), fmt(len(ws)), NUM[n], L(l), share, NUM[n], esc(hi), score(hi),
         " ".join('<a href="%s">%s</a>' % (f_ls(n, x), x.upper()) if x != l else "<strong>%s</strong>" % x.upper() for x in avail),
         fmt(len(ws)), NUM[n], L(l), chips(ws), NUM[n], L(l), top_list(ws), common2, fmt(vow),
         footer_links(' See all <a href="%s">%s-letter words</a> and all <a href="%s">words starting with %s</a>.' % (f_len(n), NUM[n], f_start(l), L(l))))
            ex = ", ".join(ws[:3])
            pages[f_ls(n, l)] = ("%s-Letter Words Starting With %s" % (NUM[n].capitalize(), L(l)),
                "All %s %s-letter words that start with %s, such as %s. Full list with highest-scoring words." % (fmt(len(ws)), NUM[n], L(l), ex),
                body)

    # ----- length hubs
    for n in HUB_LENGTHS:
        ws = by_len[n]
        avail = [l for l in letters if len(by_ls.get((n, l), [])) >= MIN_WORDS]
        counts = " ".join('<a href="%s">%s (%s)</a>' % (f_ls(n, l), l.upper(), fmt(len(by_ls[(n, l)]))) if n in SUB_LENGTHS else "%s (%s)" % (l.upper(), fmt(len(by_ls[(n, l)]))) for l in avail)
        cmn = Counter(w[0] for w in ws).most_common(3)
        last = Counter(w[-1] for w in ws).most_common(3)
        pal = [w for w in ws if w == w[::-1]][:8]
        body = """<h1>%s-letter words</h1>
<p>The ENABLE word list used by this site has %s %s-letter words. They make up about %.1f%% of the whole list. Choose a first letter below to see every %s-letter word that starts with it.</p>
<div class="notice"><p>Different games use different word lists. Check unusual words against the list your game uses.</p></div>
<h2>%s-letter words by first letter</h2>
<p class="jump">%s</p>
<h2>Highest-scoring %s-letter words</h2>
%s
<h2>Common starts and endings</h2>
<p>The most common first letters are %s. The most common last letters are %s.</p>
%s%s""" % (NUM[n].capitalize(), fmt(len(ws)), NUM[n], 100.0 * len(ws) / total, NUM[n], NUM[n].capitalize(), counts, NUM[n], top_list(ws),
            ", ".join("<strong>%s</strong> (%s)" % (a.upper(), fmt(b)) for a, b in cmn), ", ".join("<strong>%s</strong> (%s)" % (a.upper(), fmt(b)) for a, b in last),
            ("<h2>Palindromes</h2><p>%s-letter words that read the same backwards include %s.</p>" % (NUM[n].capitalize(), ", ".join("<em>%s</em>" % esc(p) for p in pal))) if pal else "",
            footer_links())
        pages[f_len(n)] = ("%s-Letter Words" % NUM[n].capitalize(),
            "%s %s-letter words from the ENABLE word list, with highest-scoring words and a list for each first letter." % (fmt(len(ws)), NUM[n]), body)

    # ----- first-letter hubs
    for l in letters:
        ws = by_start[l]
        lens = Counter(len(w) for w in ws)
        rows = []
        for n in sorted(lens):
            if n < 2 or n > 12: continue
            cnt = lens[n]
            if n in (2, 3):
                link = "two-letter-words.html" if n == 2 else "three-letter-words.html"
                rows.append('<li><a href="%s">%s-letter words starting with %s</a> (%s)</li>' % (link, NUM[n], L(l), fmt(cnt)))
            elif n in SUB_LENGTHS and cnt >= MIN_WORDS:
                rows.append('<li><a href="%s">%s-letter words starting with %s</a> (%s)</li>' % (f_ls(n, l), NUM[n], L(l), fmt(cnt)))
            else:
                rows.append("<li>%d-letter words starting with %s (%s)</li>" % (n, L(l), fmt(cnt)))
        short = [w for w in ws if len(w) <= 3]
        body = """<h1>Words starting with %s</h1>
<p>The ENABLE word list used by this site has %s words that start with <strong>%s</strong>, about %.1f%% of the list. Pick a word length below to see the full list. The shortest are listed here, and every longer length links to its own page where one exists.</p>
<div class="notice"><p>Different games use different word lists. Check unusual words against the list your game uses.</p></div>
<p class="jump">Jump to a letter: %s</p>
<h2>Short words starting with %s</h2>
%s
<h2>Words starting with %s by length</h2>
<ul>%s</ul>
<h2>Highest-scoring words starting with %s</h2>
%s
%s""" % (L(l), fmt(len(ws)), L(l), 100.0 * len(ws) / total, " ".join('<a href="%s">%s</a>' % (f_start(x), x.upper()) if x != l else "<strong>%s</strong>" % x.upper() for x in letters),
         L(l), chips(short), L(l), "".join(rows), L(l), top_list(ws), footer_links())
        pages[f_start(l)] = ("Words Starting With %s" % L(l),
            "%s words that start with %s, with short words listed and lists by length for four to seven letters." % (fmt(len(ws)), L(l)), body)

    # ----- master index
    sec = ["<h1>Word lists</h1>",
           "<p>Browse word lists built from the ENABLE word list used by this site. Pick a length, a first letter, or both.</p>",
           '<h2>By length</h2><div class="jump">' + " ".join('<a href="%s">%s-letter words</a>' % (f_len(n) if n > 3 else ("two-letter-words.html" if n == 2 else "three-letter-words.html"), NUM[n]) for n in range(2, 9)) + "</div>",
           '<h2>By first letter</h2><div class="jump">' + " ".join('<a href="%s">%s</a>' % (f_start(l), l.upper()) for l in letters) + "</div>"]
    for n in SUB_LENGTHS:
        sec.append('<h2>%s-letter words by first letter</h2><div class="jump">%s</div>' % (NUM[n].capitalize(), " ".join('<a href="%s">%s</a>' % (f_ls(n, l), l.upper()) for l in letters if len(by_ls.get((n, l), [])) >= MIN_WORDS)))
    sec.append('<h2>Special letters</h2><div class="jump"><a href="words-with-q-without-u.html">Words with Q but no U</a> <a href="words-with-z.html">Words with Z</a> <a href="words-with-j-and-x.html">Words with J and X</a></div>')
    sec.append('<p>Learn how the lists work on the <a href="word-lists-explained.html">word lists explained</a> page, or <a href="index.html">unscramble your own letters</a>.</p>')
    pages["word-lists.html"] = ("Word Lists by Length and First Letter",
        "Browse word lists by length and first letter: two to eight letter words and words starting with every letter, from the ENABLE list.", "\n".join(sec))
    return with_toggle(pages)


TOGGLE = ('<label class="check rude-toggle"><input type="checkbox" id="wl-rude" checked> Hide offensive words</label>'
          '<script>(function(){var c=document.getElementById("wl-rude"),d=document.documentElement,k="gu-wl-rude";'
          'function ap(){d.classList.toggle("show-rude",!c.checked)}'
          'try{if(localStorage.getItem(k)==="0")c.checked=false}catch(e){}ap();'
          'c.addEventListener("change",function(){try{localStorage.setItem(k,c.checked?"1":"0")}catch(e){}ap()})})();</script>')

def with_toggle(pages):
    """Add the hide-offensive-words switch to every page that lists at least one such word."""
    out = {}
    for f, (t, d, body) in pages.items():
        if 'class="chip rude"' in body or '<li class="rude">' in body:
            i = body.find("</h1>") + 5
            body = body[:i] + "\n" + TOGGLE + body[i:]
        out[f] = (t, d, body)
    return out
