"""Writes assets/cw-data.js for the Mini Crossword game.
Each puzzle is a 5x5 grid: three five-letter words across (rows 1, 3, 5) and three down (columns 1, 3, 5),
with black squares at the four inner cells. Words and clues come from _src/cw_clues.txt."""
import os, random, json, itertools
H = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(H)
en = set(open(os.path.join(R, "words/enable.txt")).read().split())
off = set(open(os.path.join(R, "words/offensive.txt")).read().split())
SKIP = set("begun drawn known given shown taken sized hoped spied dried tried tries taxes needs times women leapt swept going doing being dying".split())
clue = {}
for line in open(os.path.join(H, "cw_clues.txt")):
    line = line.strip()
    if "|" in line:
        w, c = line.split("|", 1)
        assert len(w) == 5 and w in en and w not in off, w
        assert w not in c.lower().split(), (w, c)
        if w not in SKIP: clue[w] = c
W = sorted(clue)
print("words", len(W))
T = {}; P = set(); T2 = {}
for w in W:
    T.setdefault((w[0], w[2], w[4]), []).append(w); P.add((w[0], w[2])); T2.setdefault((w[0], w[2]), set()).add(w[4])
rng = random.Random(7)
sols = []
LA = W[:]; rng.shuffle(LA)
for A in LA:
    if len(sols) > 90000: break
    for B in W:
        if A == B: continue
        if not all((A[c], B[c]) in P for c in (0, 2, 4)): continue
        L = [T2[(A[c], B[c])] for c in (0, 2, 4)]
        for C in W:
            if C in (A, B) or C[0] not in L[0] or C[2] not in L[1] or C[4] not in L[2]: continue
            ds = []
            for c in (0, 2, 4):
                ds.append([d for d in T.get((A[c], B[c], C[c]), []) if d not in (A, B, C)])
            if all(ds):
                sols.append((A, B, C, ds))
print("raw solutions", len(sols))
rng.shuffle(sols)
use = {}; out = []; LIM = 6
for A, B, C, ds in sols:
    D = []
    for opts in ds:
        opts = [d for d in opts if use.get(d, 0) < LIM and d not in D]
        if not opts: break
        D.append(rng.choice(opts))
    else:
        ws = [A, B, C] + D
        if len(set(ws)) < 6 or any(use.get(w, 0) >= LIM for w in ws): continue
        for w in ws: use[w] = use.get(w, 0) + 1
        g = [["#"] * 5 for _ in range(5)]
        for r, w in ((0, A), (2, B), (4, C)):
            for i in range(5): g[r][i] = w[i]
        for c, d in zip((0, 2, 4), D):
            for r in range(5): g[r][c] = d[r]
        grid = "".join("".join(r) for r in g).upper()
        out.append([grid, [clue[A], clue[B], clue[C]], [clue[d] for d in D]])
    if len(out) >= 420: break
print("puzzles", len(out), "words used", len(use))
open(os.path.join(R, "assets/cw-data.js"), "w").write("window.CWD=" + json.dumps(out, separators=(",", ":"), ensure_ascii=False) + ";\n")
