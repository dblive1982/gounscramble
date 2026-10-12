"""Writes assets/wg-words.js for the Wordle Global game.
Answers: hand-picked common 5-letter words (kept in _src/wg_answers.txt), shuffled in a fixed order so the daily word is the same for everyone.
Guesses: every 5-letter word in the dictionary except the offensive list."""
import os, random
H = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(H)
en = set(open(os.path.join(R, "words/enable.txt")).read().split())
off = set(open(os.path.join(R, "words/offensive.txt")).read().split())
ans = sorted({w for w in open(os.path.join(H, "wg_answers.txt")).read().split() if len(w) == 5 and w.isalpha() and w in en and w not in off})
random.Random(20261012).shuffle(ans)
guess = sorted({w for w in en if len(w) == 5 and w not in off} | set(ans))
open(os.path.join(R, "assets/wg-words.js"), "w").write('window.WGD={a:"%s",g:"%s"};\n' % ("".join(ans), "".join(guess)))
print(len(ans), len(guess))
