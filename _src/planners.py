"""Free printable planner pages. PDFs and previews are made by mkplanners.py."""
import html

IC = '<svg class="ic" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>'
DL = IC % '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>'

P = [
 dict(slug="weekly-planner", file="weekly-planner.html", name="Weekly planner", land=False,
  short="Plan your week day by day, with space for priorities and a weekly focus.",
  title="Free Printable Weekly Planner (PDF) | gounscramble./",
  desc="Free printable weekly planner in PDF. Top 3 priorities, a weekly focus and a box for every day. Download in A4 or US Letter and print at home. No sign-up.",
  lede="A clean one-page weekly planner you can print at home. Write down your top three priorities, pick a focus for the week, then plan each day.",
  has=["A \"Top 3 priorities\" box with tick boxes", "A weekly focus section for your main goal or theme", "A ruled box for each day, Monday to Sunday", "A notes box for anything that does not fit a day", "A \"Week of\" date line at the top"],
  how=["Print the planner on A4 or US Letter paper. Standard 80 to 100 gsm paper works well, and a heavier paper is nicer for pens and highlighters.", "At the start of the week write the date and pick up to three priorities. Fewer, clearer priorities get done more often than a long list.", "Fill in each day with appointments first, then tasks. Add anything left over to the notes box.", "At the end of each day tick off what you finished and move the rest forward."],
  faq=[("Is this weekly planner really free?", "Yes. You can download and print as many copies as you like for your own use. Please do not sell it or share it as your own work."),
       ("Does it start on Monday or Sunday?", "Monday to Sunday is the order shown. If you prefer a Sunday start, write the day names in your own order in the day boxes."),
       ("What paper size should I choose?", "Use A4 in the UK, Europe and most of the world, and US Letter in the US and Canada. Print at 100% or Actual size so nothing is cut off.")]),
 dict(slug="monthly-budget-planner", file="monthly-budget-planner.html", name="Monthly budget planner", land=False,
  short="Track income, bills and everyday spending so you know what is left to save.",
  title="Free Printable Monthly Budget Planner (PDF) | gounscramble./",
  desc="Free printable monthly budget planner in PDF. Track income, bills, spending and savings on one page. Download in A4 or US Letter and print at home. No sign-up.",
  lede="A one-page monthly budget you can print and fill in by hand. List your income, tick off bills as you pay them, and see what is left to save at the end of the month.",
  has=["An income table with expected and actual amounts", "A summary box for total income, bills, spending and money left to save", "A bills table with due date, budgeted and actual amounts and a paid tick box", "An everyday spending table with starter categories such as groceries and transport", "Space for a savings goal and notes"],
  how=["Print the planner and write the month and a savings goal at the top.", "List every source of income in the income table. Use the expected column when you plan and the actual column as money arrives.", "Add your regular bills with their due dates and tick each one as it is paid.", "Set a budget for each spending category, then fill in the actual amount as the month goes on.", "At the end of the month fill in the summary box. Total income minus total bills and spending is the amount you have left to save."],
  faq=[("Which currency does it use?", "None is printed, so you can write amounts in pounds, dollars, euros or any currency you use."),
       ("Can I use it for a different budgeting method?", "Yes. The blank rows let you add your own categories, so it works with envelope budgeting, the 50/30/20 rule or plain tracking."),
       ("Is it financial advice?", "No. It is a simple worksheet for your own records. Our calculators and planners are for information only, not financial advice."),
       ("Is there a calculator to go with it?", "Yes. Try our free <a href=\"salary-calculator.html\">salary calculator</a> to work out your take-home pay, or the <a href=\"mortgage-calculator.html\">mortgage calculator</a> if housing is your biggest bill.")]),
 dict(slug="monthly-habit-tracker", file="monthly-habit-tracker.html", name="Monthly habit tracker", land=True,
  short="Tick off up to 12 habits across the month and watch your streaks build.",
  title="Free Printable Monthly Habit Tracker (PDF) | gounscramble./",
  desc="Free printable monthly habit tracker in PDF. Track up to 12 habits across 31 days and build streaks. Download in A4 or US Letter landscape and print at home.",
  lede="A landscape habit tracker with a column for every day of the month. Write your habits down the side and tick each square as you go.",
  has=["Space for 12 habits", "A column for each day, 1 to 31, with a darker line between weeks", "A month line at the top", "A reflection area for notes on what worked"],
  how=["Print the tracker in landscape on A4 or US Letter paper.", "Write the month, then your habits in the left column. Start with three to five so the page does not feel overwhelming.", "Each day, tick or colour the square for every habit you did.", "At the end of the month use the reflection lines to note what worked and which habits to keep, change or drop."],
  faq=[("How many habits should I track?", "Start small. Three to five habits is easier to keep up than twelve. You can add more once the first ones feel automatic."),
       ("What about months with fewer than 31 days?", "Just leave the extra day columns empty or cross them out."),
       ("What paper orientation is it?", "Landscape. Choose landscape when you print, or let your printer pick it automatically.")]),
]
BY = {x["slug"]: x for x in P}


def _pdfs(x, cls="pl-dl"):
    base = "downloads/" + x["slug"]
    return ('<a class="pl-btn" href="%s-a4.pdf" download>%s Download PDF (A4)</a>'
            '<a class="pl-btn alt" href="%s-us-letter.pdf" download>%s US Letter</a>') % (base, DL, base, DL)


def card(x):
    return ('<article class="pl-card"><a class="pl-thumb" href="%s" aria-label="%s"><img src="assets/planners/%s.webp" alt="%s printable planner preview" width="%d" height="%d" loading="lazy"></a>'
            '<h2><a href="%s">%s</a></h2><p>%s</p><div class="pl-acts">%s</div></article>') % (
        x["file"], html.escape(x["name"]), x["slug"], html.escape(x["name"]), 1053 if x["land"] else 745, 745 if x["land"] else 1053,
        x["file"], x["name"], x["short"], _pdfs(x))


def hub():
    return ('<main><div class="wrap"><section class="prose"><h1>Free printable planners</h1>'
            '<p>Print-at-home planners to organise your week, your money and your habits. Every planner is a free PDF in A4 or US Letter, with no sign-up. Open one to see a preview and tips for using it.</p></section>'
            '<section class="pl-grid">%s</section>'
            '<section class="prose pl-note"><h2>How to print</h2><p>Open the PDF and choose Print. Set the scale to 100%% or Actual size, and pick the paper size that matches the file you downloaded. For a tidier result, print single-sided on plain white paper.</p>'
            '<p>The planners are free for your own personal use. Please do not sell them or share them as your own work. More planners are on the way.</p></section>'
            '</div></main>\n') % "".join(card(x) for x in P)


def page(slug):
    x = BY[slug]
    others = [o for o in P if o["slug"] != slug]
    faq = "\n".join("<h3>%s</h3><p>%s</p>" % (html.escape(q), a) for q, a in x["faq"])
    rel = "".join('<li><a href="%s">%s</a></li>' % (o["file"], o["name"]) for o in others)
    w, h = (1053, 745) if x["land"] else (745, 1053)
    return ('<main><div class="wrap"><article class="prose pl-page"><p class="crumbs"><a href="planners.html">Planners</a></p><h1>%s</h1><p class="lede">%s</p>'
            '<div class="pl-top"><div class="pl-acts">%s</div><p class="pl-meta">Free PDF. A4 and US Letter%s. For personal use.</p></div>'
            '<div class="pl-hero"><figure><img src="assets/planners/%s.webp" alt="%s printable planner preview" width="%d" height="%d"></figure></div>'
            '<h2>What is on this planner</h2><ul>%s</ul><h2>How to use it</h2><ol>%s</ol>'
            '<h2>Questions</h2>%s<h2>More free planners</h2><ul>%s<li><a href="calculators.html">Free calculators</a></li></ul></article></div></main>\n') % (
        x["name"], x["lede"], _pdfs(x), ", landscape" if x["land"] else "", x["slug"], html.escape(x["name"]), w, h,
        "".join("<li>%s</li>" % t for t in x["has"]), "".join("<li>%s</li>" % t for t in x["how"]), faq, rel)
