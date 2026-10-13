"""Generate the printable planner PDFs (A4 + US Letter) and preview images.
Run: python3 _src/mkplanners.py   -> downloads/*.pdf, assets/planners/*.webp"""
import os, subprocess, tempfile
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, letter, landscape
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FD = "/usr/share/fonts/truetype/liberation/"
pdfmetrics.registerFont(TTFont("R", FD + "LiberationSans-Regular.ttf"))
pdfmetrics.registerFont(TTFont("B", FD + "LiberationSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("I", FD + "LiberationSans-Italic.ttf"))

BLUE = HexColor("#7c48b8"); SOFT = HexColor("#f1ebfa"); LINE = HexColor("#cfd6e4")
INK = HexColor("#1c2230"); MUT = HexColor("#667085"); WHITE = HexColor("#ffffff")
M = 14 * mm
URL = "gounscramble.com/planners.html"


def header(c, W, H, title, sub):
    c.setFillColor(BLUE); c.roundRect(M, H - M - 9 * mm, 10 * mm, 2.2 * mm, 1 * mm, stroke=0, fill=1)
    c.setFillColor(INK); c.setFont("B", 26); c.drawString(M, H - M - 21 * mm, title)
    c.setFillColor(MUT); c.setFont("R", 10.5); c.drawString(M, H - M - 28 * mm, sub)
    return H - M - 33 * mm  # y below header


def footer(c, W):
    c.setFillColor(MUT); c.setFont("R", 8)
    c.drawString(M, 8 * mm, "Free printable from " + URL)
    c.drawRightString(W - M, 8 * mm, "For personal use")


def field(c, x, y, w, label):
    c.setFillColor(MUT); c.setFont("B", 8.5); c.drawString(x, y + 1.6 * mm, label.upper())
    lw = c.stringWidth(label.upper(), "B", 8.5) + 2.5 * mm
    c.setStrokeColor(LINE); c.setLineWidth(0.8); c.line(x + lw, y, x + w, y)


def box(c, x, y, w, h, title=None, fill=None):
    """y is the bottom edge."""
    c.setStrokeColor(LINE); c.setLineWidth(0.9)
    if fill: c.setFillColor(fill)
    c.roundRect(x, y, w, h, 2.5 * mm, stroke=1, fill=1 if fill else 0)
    if title:
        c.setFillColor(SOFT); c.setStrokeColor(SOFT)
        p = c.beginPath()
        r = 2.5 * mm; th = 7 * mm
        c.saveState()
        c.clipPath(_rr(c, x, y, w, h, r), stroke=0, fill=0)
        c.rect(x, y + h - th, w, th, stroke=0, fill=1)
        c.restoreState()
        c.setStrokeColor(LINE); c.roundRect(x, y, w, h, r, stroke=1, fill=0)
        c.setFillColor(BLUE); c.setFont("B", 10); c.drawString(x + 3 * mm, y + h - 4.9 * mm, title)
        return y + h - th
    return y + h


def _rr(c, x, y, w, h, r):
    p = c.beginPath(); p.roundRect(x, y, w, h, r); return p


def rules(c, x, top, w, bottom, gap=7 * mm, pad=3 * mm):
    c.setStrokeColor(LINE); c.setLineWidth(0.5)
    y = top - gap
    while y > bottom + 1 * mm:
        c.line(x + pad, y, x + w - pad, y); y -= gap


def checkline(c, x, y, w):
    c.setStrokeColor(MUT); c.setLineWidth(0.8); c.roundRect(x, y - 0.5 * mm, 4 * mm, 4 * mm, 0.8 * mm, stroke=1, fill=0)
    c.setStrokeColor(LINE); c.setLineWidth(0.6); c.line(x + 6 * mm, y, x + w, y)


# ---------------------------------------------------------------- weekly
def weekly(c, W, H):
    top = header(c, W, H, "Weekly planner", "Plan your week, one day at a time.")
    field(c, W - M - 62 * mm, H - M - 24 * mm, 62 * mm, "Week of")
    gap = 5 * mm
    colw = (W - 2 * M - gap) / 2
    # priorities + focus
    ph = 33 * mm
    by = top - ph
    inner = box(c, M, by, colw, ph, "Top 3 priorities")
    for i in range(3):
        checkline(c, M + 4 * mm, inner - 7 * mm - i * 8 * mm, colw - 8 * mm)
    inner = box(c, M + colw + gap, by, colw, ph, "This week's focus")
    rules(c, M + colw + gap, inner, colw, by, gap=8 * mm)
    # days
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Notes"]
    area_top = by - gap
    area_bot = 15 * mm
    rows = 4
    rh = (area_top - area_bot - (rows - 1) * gap) / rows
    for i, d in enumerate(days):
        r, col = divmod(i, 2)
        x = M + col * (colw + gap)
        y = area_top - (r + 1) * rh - r * gap
        inner = box(c, x, y, colw, rh, d)
        rules(c, x, inner, colw, y, gap=7 * mm)
    footer(c, W)


# ---------------------------------------------------------------- budget
def table(c, x, ytop, w, cols, nrows, rh, total_label=None, title=None, rows_text=None, check_col=None):
    """cols = [(heading, frac)], draws header band + rows (+ total). returns bottom y."""
    n = nrows + (1 if total_label else 0)
    th = 7 * mm
    h = th + rh + n * rh if False else th + (nrows + (1 if total_label else 0)) * rh + rh
    # title band
    y = ytop
    c.setFillColor(BLUE); c.setFont("B", 11); c.drawString(x, y - 4 * mm, title or "")
    y -= 7 * mm
    hdr_h = 6.5 * mm
    c.setFillColor(SOFT); c.setStrokeColor(LINE); c.setLineWidth(0.8)
    total_h = hdr_h + n * rh
    c.roundRect(x, y - total_h, w, total_h, 2 * mm, stroke=1, fill=0)
    c.saveState(); c.clipPath(_rr(c, x, y - total_h, w, total_h, 2 * mm), stroke=0, fill=0)
    c.rect(x, y - hdr_h, w, hdr_h, stroke=0, fill=1)
    if total_label:
        c.setFillColor(SOFT); c.rect(x, y - total_h, w, rh, stroke=0, fill=1)
    c.restoreState()
    c.setStrokeColor(LINE); c.roundRect(x, y - total_h, w, total_h, 2 * mm, stroke=1, fill=0)
    # headings + vertical lines
    cx = x
    xs = []
    for hd, f in cols:
        xs.append(cx)
        c.setFillColor(INK); c.setFont("B", 8)
        c.drawString(cx + 2 * mm, y - 4.4 * mm, hd.upper())
        cx += w * f
    xs.append(x + w)
    c.setStrokeColor(LINE); c.setLineWidth(0.6)
    for xv in xs[1:-1]:
        c.line(xv, y, xv, y - total_h)
    # rows
    ry = y - hdr_h
    for i in range(n):
        ry -= rh
        c.setStrokeColor(LINE); c.setLineWidth(0.5)
        if i < n - 1:
            c.line(x, ry, x + w, ry)
        is_total = total_label and i == n - 1
        if is_total:
            c.setFillColor(INK); c.setFont("B", 8.5); c.drawString(x + 2 * mm, ry + rh / 2 - 1 * mm, total_label.upper())
        elif rows_text and i < len(rows_text) and rows_text[i]:
            c.setFillColor(INK); c.setFont("R", 9); c.drawString(x + 2 * mm, ry + rh / 2 - 1.2 * mm, rows_text[i])
        if check_col is not None and not is_total:
            cxm = xs[check_col] + (xs[check_col + 1] - xs[check_col]) / 2
            c.setStrokeColor(MUT); c.setLineWidth(0.8)
            c.roundRect(cxm - 1.8 * mm, ry + rh / 2 - 1.8 * mm, 3.6 * mm, 3.6 * mm, 0.7 * mm, stroke=1, fill=0)
    return y - total_h


def budget(c, W, H):
    top = header(c, W, H, "Monthly budget planner", "Know where your money is going before the month starts.")
    field(c, W - M - 62 * mm, H - M - 18 * mm, 62 * mm, "Month")
    field(c, W - M - 62 * mm, H - M - 26 * mm, 62 * mm, "Savings goal")
    gap = 6 * mm
    cw = (W - 2 * M - gap)
    left = cw * 0.56; right = cw - left
    # income (left) and summary (right)
    inc_bot = table(c, M, top, left, [("Income source", .5), ("Expected", .25), ("Actual", .25)], 4, 7.2 * mm, "Total income", "Income")
    sy = top - 7 * mm
    sh = top - 7 * mm - inc_bot
    sx = M + left + gap
    inner = box(c, sx, inc_bot, right, sh, None, fill=SOFT)
    c.setFillColor(BLUE); c.setFont("B", 11); c.drawString(sx, top - 4 * mm, "Summary")
    items = ["Total income", "Total bills", "Total spending", "Left to save"]
    yy = top - 7 * mm - 8 * mm
    for it in items:
        c.setFillColor(INK); c.setFont("B", 8.5); c.drawString(sx + 3.5 * mm, yy + 1.8 * mm, it.upper())
        c.setStrokeColor(MUT); c.setLineWidth(0.6); c.line(sx + 3.5 * mm, yy - 1.5 * mm, sx + right - 3.5 * mm, yy - 1.5 * mm)
        yy -= 9.5 * mm
    # bills (left) and spending (right)
    top2 = inc_bot - 8 * mm
    table(c, M, top2, left, [("Bill", .38), ("Due", .14), ("Budget", .19), ("Actual", .19), ("Paid", .10)], 17, 7.2 * mm, "Total bills", "Bills", check_col=4)
    cats = ["Groceries", "Transport", "Eating out", "Shopping", "Health", "Fun", "Gifts", "Other", "", "", "", "", "", "", "", "", ""]
    table(c, sx, top2, right, [("Spending", .44), ("Budget", .28), ("Actual", .28)], 17, 7.2 * mm, "Total spending", "Everyday spending", rows_text=cats)
    # notes
    ny = 15 * mm
    c.setFillColor(MUT); c.setFont("B", 8.5); c.drawString(M, ny + 6 * mm, "NOTES")
    c.setStrokeColor(LINE); c.setLineWidth(0.5)
    c.line(M + 14 * mm, ny + 6 * mm, W - M, ny + 6 * mm)
    footer(c, W)


# ---------------------------------------------------------------- habits
def habits(c, W, H):
    top = header(c, W, H, "Monthly habit tracker", "Tick off each day to build your streak.")
    field(c, W - M - 62 * mm, H - M - 18 * mm, 62 * mm, "Month")
    nrows = 12
    namew = 62 * mm
    days = 31
    gx = M + namew
    cell = (W - M - gx) / days
    rh = min(9.5 * mm, (top - 40 * mm - 6 * mm) / (nrows + 1))
    y = top - 2 * mm
    c.setFillColor(SOFT); c.setStrokeColor(LINE); c.setLineWidth(0.7)
    c.roundRect(M, y - rh, W - 2 * M, rh, 2 * mm, stroke=0, fill=1)
    c.setFillColor(BLUE); c.setFont("B", 9); c.drawString(M + 3 * mm, y - rh / 2 - 1.2 * mm, "HABIT")
    c.setFillColor(INK); c.setFont("B", 7)
    for d in range(days):
        c.drawCentredString(gx + cell * d + cell / 2, y - rh / 2 - 1 * mm, str(d + 1))
    ty = y - rh
    gh = nrows * rh
    c.setStrokeColor(LINE); c.setLineWidth(0.5)
    for r in range(nrows + 1):
        c.line(M, ty - r * rh, W - M, ty - r * rh)
    c.line(M, ty, M, ty - gh); c.line(W - M, ty, W - M, ty - gh); c.line(gx, ty, gx, ty - gh)
    for d in range(1, days):
        c.setStrokeColor(LINE if d % 7 else MUT)
        c.setLineWidth(0.4 if d % 7 else 0.6)
        c.line(gx + cell * d, ty, gx + cell * d, ty - gh)
    # notes strip
    ny = ty - gh - 12 * mm
    c.setFillColor(BLUE); c.setFont("B", 10); c.drawString(M, ny, "Reflection")
    c.setStrokeColor(LINE); c.setLineWidth(0.5)
    yy = ny - 7 * mm
    while yy > 14 * mm:
        c.line(M, yy, W - M, yy); yy -= 7 * mm
    footer(c, W)


PLANNERS = [("weekly-planner", weekly, False), ("monthly-budget-planner", budget, False), ("monthly-habit-tracker", habits, True)]
SIZES = [("a4", A4), ("us-letter", letter)]


def main():
    os.makedirs(os.path.join(root, "downloads"), exist_ok=True)
    os.makedirs(os.path.join(root, "assets/planners"), exist_ok=True)
    for slug, fn, land in PLANNERS:
        for sname, sz in SIZES:
            W, H = landscape(sz) if land else sz
            out = os.path.join(root, "downloads", "%s-%s.pdf" % (slug, sname))
            c = canvas.Canvas(out, pagesize=(W, H))
            c.setTitle({"weekly-planner": "Weekly planner", "monthly-budget-planner": "Monthly budget planner", "monthly-habit-tracker": "Monthly habit tracker"}[slug] + " | GoUnscramble")
            c.setAuthor("GoUnscramble"); c.setSubject("Free printable planner from gounscramble.com")
            fn(c, W, H); c.showPage(); c.save()
        # preview image from the A4 PDF
        pdf = os.path.join(root, "downloads", slug + "-a4.pdf")
        tmp = tempfile.mkdtemp()
        subprocess.run(["pdftoppm", "-r", "90", "-png", "-singlefile", pdf, os.path.join(tmp, "p")], check=True)
        from PIL import Image
        im = Image.open(os.path.join(tmp, "p.png")).convert("RGB")
        im.save(os.path.join(root, "assets/planners", slug + ".webp"), "WEBP", quality=82)
        print(slug, im.size)


if __name__ == "__main__":
    main()
