"""Calculator pages for GoUnscramble. The maths lives in assets/calc.js; this file holds names, copy and page markup."""
import html

CATS = ["Financial", "Math", "Fitness & Health", "Other"]

# slug, file, category, name, tile glyph, short card text, lede, about paragraphs, faqs
C = []
def add(slug, file, cat, name, glyph, short, lede, about, faq):
    C.append(dict(slug=slug, file=file, cat=cat, name=name, glyph=glyph, short=short, lede=lede, about=about, faq=faq))

add("salary", "salary-calculator.html", "Financial", "Salary calculator", "£",
    "Hourly, weekly, monthly and yearly pay, plus UK take-home.",
    "Turn your pay into hourly, daily, weekly, monthly and yearly figures, and see an estimate of your UK take-home pay.",
    ["Enter what you earn and how often you are paid, then say how many hours and days you work in a week. The calculator turns your pay into a yearly figure using 52 weeks, then splits that figure into every other pay period. Hourly pay is yearly pay divided by 52 weeks of your weekly hours, weekly pay is a 52nd, and monthly pay is a 12th.",
     "If some of your days off are unpaid, add them in the box. The adjusted column takes those days out of your yearly pay using your daily rate. For the 2026/27 tax year in England, Wales and Northern Ireland the first £12,570 of income is tax free, then 20% to £50,270, 40% to £125,140 and 45% above that. The tax-free amount shrinks by £1 for every £2 over £100,000. Employee National Insurance is 8% from £12,570 to £50,270 and 2% above. Pension, student loan, tax codes and Scottish rates are not included."],
    [("How do I work out my hourly rate from a yearly salary?", "Divide the yearly salary by 52, then divide that by the hours you work each week. For £35,000 and a 40-hour week that is about £16.83 an hour."),
     ("Why are there two columns?", "The unadjusted column assumes you are paid for every working day. The adjusted column removes the unpaid days off you entered.")])

add("income-tax", "income-tax-calculator.html", "Financial", "Income tax calculator", "Tax",
    "UK income tax and National Insurance for 2026/27.",
    "See how much income tax and National Insurance come out of your yearly income, and what you take home.",
    ["This calculator uses the 2026/27 rates for employees in England, Wales and Northern Ireland. The first £12,570 is tax free, income up to £50,270 is taxed at 20%, up to £125,140 at 40%, and anything above at 45%. If you earn over £100,000 the tax-free amount falls by £1 for every £2. Employee National Insurance is 8% between £12,570 and £50,270, and 2% above that.",
     "Pension contributions, student loans, benefits in kind, tax codes and Scottish rates are not included, so your payslip may differ."],
    [("Is this the same as my payslip?", "It is a close guide for a standard tax code. Pension payments, student loan repayments and other deductions change the real figure."),
     ("Does it work for Scotland?", "No. Scotland sets its own income tax bands, so the result will differ for people who live there.")])

add("mortgage", "mortgage-calculator.html", "Financial", "Mortgage calculator", "Mtg",
    "Monthly payment, total interest and loan to value.",
    "Work out your monthly mortgage payment from the price, deposit, interest rate and term.",
    ["Enter the property price and your deposit. The calculator borrows the difference and works out a fixed monthly repayment over the term you choose, using the standard repayment formula. It also shows your loan to value, which lenders use to set the rates they offer.",
     "Real mortgages change when a fixed deal ends, and they come with fees, so use this as a guide when comparing options."],
    [("What is loan to value?", "It is the amount you borrow as a percentage of the property price. A bigger deposit means a lower loan to value, and usually a cheaper rate."),
     ("Does this include fees or insurance?", "No. It covers the loan repayments only.")])

add("loan", "loan-calculator.html", "Financial", "Loan calculator", "Loan",
    "Monthly payment and total interest on any loan.",
    "See the monthly payment, total interest and total cost of a personal loan.",
    ["Enter the amount, the yearly interest rate and the term. The calculator assumes equal monthly payments at a fixed rate, which is how most personal loans work. A longer term makes each payment smaller, but you pay more interest overall.",
     "Check the rate you are offered is the one the lender calls APR, and remember arrangement fees are not included here."],
    [("Why does a longer term cost more?", "You owe money for longer, so more interest builds up, even though each monthly payment is smaller."),
     ("Is the rate APR?", "Use the rate your lender quotes. This calculator treats it as a yearly rate compounded monthly.")])

add("auto-loan", "auto-loan-calculator.html", "Financial", "Car loan calculator", "Car",
    "Monthly payment for a car, with deposit.",
    "Work out the monthly payment for a car loan, taking off your deposit or trade-in.",
    ["Enter the price of the car, how much you can put down, the interest rate and the number of months. The calculator finances the rest at a fixed rate and shows the monthly payment, the interest you will pay, and the true total cost including your deposit.",
     "Dealer finance can include balloon payments or fees that are not covered here, so check the full agreement."],
    [("Should I put down a bigger deposit?", "A bigger deposit means you borrow less and pay less interest, as long as it does not leave you without savings."),
     ("What is a good loan term?", "Shorter terms cost less interest overall. Many people choose 36 to 60 months.")])

add("interest-rate", "interest-rate-calculator.html", "Financial", "Interest rate calculator", "Rate",
    "Find the interest rate from a loan and payment.",
    "Find out what interest rate you are paying from the loan amount, monthly payment and term.",
    ["Sometimes you know what you borrowed and what you pay each month, but not the rate. This calculator works backwards from those figures to find the yearly rate that produces your payment, compounded monthly.",
     "It is handy for checking a finance deal, or comparing offers that only show monthly payments."],
    [("Why does it say the rate would be negative?", "If your payments add up to less than the loan, there is no interest at all. Check the amount, payment and number of months."),
     ("Is this the APR?", "It is the nominal yearly rate. The APR can be slightly higher once fees are included.")])

add("amortization", "amortization-calculator.html", "Financial", "Amortisation calculator", "Amort",
    "Year by year loan schedule showing interest and balance.",
    "See how a loan is paid off year by year, with the interest, principal and balance left.",
    ["Early payments on a loan are mostly interest, and later payments are mostly the money you borrowed. This calculator shows that split for every year of the term, so you can see how quickly the balance falls.",
     "It assumes a fixed rate and equal monthly payments."],
    [("What does amortisation mean?", "It is paying off a loan gradually with regular payments that cover both interest and part of the amount you borrowed."),
     ("Why is the balance slow to drop at first?", "Interest is charged on what you still owe, so at the start more of each payment goes to interest.")])

add("compound-interest", "compound-interest-calculator.html", "Financial", "Compound interest calculator", "Cmp",
    "Watch savings grow with interest and monthly additions.",
    "See how your savings grow when interest is added on top of interest, with optional monthly deposits.",
    ["Compound interest means you earn interest on your interest as well as on your original money. Enter a starting amount, how much you add each month, the yearly rate and the number of years, and choose how often the interest is compounded.",
     "The longer you leave money, the bigger the effect, which is why starting early matters. The figures are not adjusted for inflation or tax."],
    [("How often is interest compounded?", "It depends on the account. Savings are often compounded monthly or yearly, so check yours."),
     ("Does it include tax?", "No. Interest may be taxable, though ISAs shelter it in the UK.")])

add("simple-interest", "simple-interest-calculator.html", "Financial", "Simple interest calculator", "Int",
    "Interest on an amount over a number of years.",
    "Work out simple interest on an amount, with no compounding.",
    ["Simple interest is calculated only on the original amount: amount × rate × years. Unlike compound interest, it does not grow on itself. It is used for some short loans and bonds.",
     "Enter the amount, the yearly rate and the number of years to see the interest and the total."],
    [("What is the formula?", "Interest = amount × yearly rate ÷ 100 × years."),
     ("How is it different from compound interest?", "Compound interest is also earned on past interest, so it grows faster over long periods.")])

add("retirement", "retirement-calculator.html", "Financial", "Retirement calculator", "Ret",
    "Estimate your pension pot and monthly income.",
    "Estimate how big your pot could be at retirement and what it could pay each month.",
    ["Enter your age, the age you plan to retire, what you have saved and what you add each month, along with an expected yearly growth rate. The calculator grows your savings month by month and shows the final pot.",
     "The monthly income figure uses a 4% yearly withdrawal, a common rule of thumb. Real growth varies, and the figures are not adjusted for inflation."],
    [("What growth rate should I use?", "Many people try 4% to 6% a year. Use a lower figure to be cautious, since returns are never guaranteed."),
     ("Does this include a state pension?", "No. Add your expected state pension separately.")])

add("inflation", "inflation-calculator.html", "Financial", "Inflation calculator", "Infl",
    "What prices and money are worth after years of inflation.",
    "See what an amount will cost, and what it will be worth, after years of inflation.",
    ["Prices rise over time, so the same money buys less. Enter an amount, a yearly inflation rate and a number of years. The calculator shows what the same goods will cost then, and what your amount will really buy in today's money.",
     "Use a rate close to the recent average, such as 2% to 4%."],
    [("What is a normal inflation rate?", "The Bank of England aims for 2% a year. Real figures move up and down."),
     ("Why does my money buy less?", "Because prices rise faster than the money sits still. Savings need to earn at least the inflation rate to keep their value.")])

add("vat", "vat-calculator.html", "Financial", "VAT calculator", "VAT",
    "Add or remove VAT from any price.",
    "Add VAT to a price, or take it out of a price that already includes it.",
    ["Enter an amount and the VAT rate, and say whether the amount already includes VAT. The calculator shows the price without VAT, the VAT itself and the price with VAT.",
     "The standard UK VAT rate is 20%, and the reduced rate is 5%. Some things, such as most food and children's clothes, are zero rated."],
    [("How do I take VAT out of a price?", "Divide the price including VAT by 1.2 for the 20% rate. This calculator does that for you."),
     ("Is VAT 20%?", "The standard UK rate is 20%. A reduced 5% rate applies to things like home energy.")])

add("sales-tax", "sales-tax-calculator.html", "Financial", "Sales tax calculator", "Tax%",
    "Add or remove sales tax at any rate.",
    "Work out the total with sales tax, or find the price before tax.",
    ["Enter an amount and your local sales tax rate. The calculator shows the amount before tax, the tax, and the total. You can also enter a tax-inclusive price to find what it was before tax.",
     "Sales tax rates vary by state and city, so use the rate that applies to you."],
    [("How do I find the price before tax?", "Divide the tax-inclusive price by 1 plus the rate. At 8% that is dividing by 1.08."),
     ("Which rate should I use?", "Use the combined state and local rate where you shop.")])

add("tip", "tip-calculator.html", "Financial", "Tip calculator", "Tip",
    "Split the bill and work out the tip.",
    "Work out the tip and split the bill between friends.",
    ["Enter the bill, the tip you want to leave, and how many of you are sharing. The calculator shows the tip, the total, and what each person pays.",
     "In the UK a 10% to 12.5% tip is typical in restaurants, and many places add a service charge already, so check your bill first."],
    [("How much should I tip?", "In UK restaurants 10% to 12.5% is usual. In the US 15% to 20% is common."),
     ("What if service is already included?", "Then a tip is optional. Set the tip to zero to split the bill only.")])

add("discount", "discount-calculator.html", "Financial", "Discount calculator", "Sale",
    "Sale price and how much you save.",
    "Find the sale price after a discount, and see how much you save.",
    ["Enter the original price and the discount. If the shop takes an extra percentage off, such as a further 10% at the till, add that too. The calculator applies the discounts one after the other, which is how shops do it.",
     "Two discounts of 20% and 10% do not make 30%. They make 28%."],
    [("Why isn't 20% and 10% off the same as 30% off?", "The second discount applies to the already reduced price, so the total saving is a little smaller."),
     ("How do I find the original price?", "Divide the sale price by one minus the discount. A 25% discount means dividing by 0.75.")])

add("scientific", "scientific-calculator.html", "Math", "Scientific calculator", "fx",
    "Trig, logs, powers, roots and brackets.",
    "A full scientific calculator with brackets, powers, roots, trig, logs and factorials.",
    ["Tap the keys or type on your keyboard. It follows the usual order of operations, so brackets first, then powers, then multiply and divide, then add and subtract. Switch between degrees and radians with the DEG button.",
     "Use Ans to bring back your last result, and % to turn a number into a percentage, for example 50% is 0.5. Recent calculations appear below the keys."],
    [("How do I switch between degrees and radians?", "Tap the DEG button to change to RAD. Trig functions use the mode shown."),
     ("Can I type instead of tapping?", "Yes. Type into the display and press Enter to get the answer.")])

add("percentage", "percentage-calculator.html", "Math", "Percentage calculator", "%",
    "Percent of a number, percent change, increase or decrease.",
    "Work out percentages three ways: a percent of a number, one number as a percent of another, and increases or decreases.",
    ["Use the first box to find a percentage of a number, such as 15% of 240. Use the second to find what percent one number is of another. Use the third to raise or lower a number by a percentage.",
     "To find a percent by hand, divide by 100 and multiply. So 15% of 240 is 0.15 × 240 = 36."],
    [("How do I work out a percentage of a number?", "Divide the percentage by 100, then multiply by the number."),
     ("How do I increase a number by a percentage?", "Multiply by 1 plus the percentage as a decimal. To add 10%, multiply by 1.1.")])

add("percentage-change", "percentage-change-calculator.html", "Math", "Percentage change calculator", "Δ%",
    "Percent increase or decrease between two numbers.",
    "Find the percentage change between two numbers.",
    ["Enter the starting value and the new value. The calculator shows whether it went up or down and by what percentage. The formula is (new − old) ÷ old × 100.",
     "A rise from 80 to 100 is a 25% increase, but a fall from 100 to 80 is only a 20% decrease, because the starting number is different."],
    [("What is the formula for percentage change?", "Subtract the old value from the new value, divide by the old value, then multiply by 100."),
     ("Why can it be more than 100%?", "A number that more than doubles has risen by more than 100%.")])

add("average", "average-calculator.html", "Math", "Average calculator", "Avg",
    "Mean, median, mode and range of a list.",
    "Find the mean, median, mode and range of a list of numbers.",
    ["Type or paste your numbers, separated by commas, spaces or new lines. The calculator shows the mean (the average), the median (the middle value), the mode (the most common value), plus the sum, count, smallest, largest and range.",
     "The mean adds the numbers and divides by how many there are. The median is the middle number once they are in order."],
    [("What is the difference between mean and median?", "The mean is the sum divided by the count. The median is the middle value, and is less affected by a few very large or small numbers."),
     ("What if there is no mode?", "If every number appears once, there is no mode.")])

add("standard-deviation", "standard-deviation-calculator.html", "Math", "Standard deviation calculator", "σ",
    "Standard deviation, variance and mean.",
    "Find the standard deviation and variance of a set of numbers.",
    ["Paste your numbers and the calculator shows both the sample and population standard deviation. Standard deviation tells you how spread out the numbers are around the mean.",
     "Use the sample figure when your numbers are only part of a bigger group, and the population figure when you have every value."],
    [("Sample or population?", "Use sample for a selection from a larger group, which is the common case. Use population when you have the whole group."),
     ("What does a high standard deviation mean?", "That the numbers are spread far from the average.")])

add("fraction", "fraction-calculator.html", "Math", "Fraction calculator", "a/b",
    "Add, subtract, multiply and divide fractions.",
    "Add, subtract, multiply and divide fractions, with the answer simplified.",
    ["Enter two fractions and choose an operation. The answer is shown in its simplest form, as a mixed number when it is bigger than one, and as a decimal.",
     "To add or subtract, fractions need the same bottom number. The calculator does that for you."],
    [("How do I divide fractions?", "Flip the second fraction and multiply."),
     ("How do I simplify a fraction?", "Divide the top and bottom by their greatest common factor. The calculator does this automatically.")])

add("triangle", "triangle-calculator.html", "Math", "Triangle calculator", "△",
    "Area, perimeter and angles from three sides.",
    "Enter the three sides of a triangle to get its area, perimeter, angles and type.",
    ["The area comes from Heron's formula, and the angles from the law of cosines. The calculator also tells you if the triangle is equilateral, isosceles, scalene or right-angled.",
     "Any two sides must add up to more than the third, otherwise the triangle cannot exist."],
    [("What is Heron's formula?", "It finds the area from the three sides: with s as half the perimeter, area = √(s(s−a)(s−b)(s−c))."),
     ("Why does it say the triangle cannot exist?", "The two shorter sides must be longer together than the longest side.")])

add("random-number", "random-number-generator.html", "Math", "Random number generator", "Rnd",
    "Pick random numbers in any range.",
    "Pick one or many random numbers in any range, with or without repeats.",
    ["Choose the smallest and largest number, how many you want, and whether numbers can repeat. Tap generate to roll again.",
     "Numbers are drawn with your browser's secure random generator, so every number in the range is equally likely."],
    [("Can I draw lottery style numbers?", "Yes. Choose no repeats, for example 6 numbers from 1 to 59."),
     ("Is it truly random?", "It uses your device's cryptographic random source, which is suitable for draws and games.")])

add("bmi", "bmi-calculator.html", "Fitness & Health", "BMI calculator", "BMI",
    "Body mass index and a healthy weight range.",
    "Work out your body mass index and see the weight range that is healthy for your height.",
    ["BMI is your weight in kilograms divided by your height in metres squared. A BMI from 18.5 to 24.9 is usually called a healthy weight, under 18.5 underweight, 25 to 29.9 overweight and 30 or more obese.",
     "BMI is only a rough guide. It does not know about muscle, age or body shape, so talk to a doctor or nurse about what is right for you."],
    [("Can I use stone and pounds?", "Yes. Switch the units to imperial and enter feet, inches, stone and pounds."),
     ("Is BMI accurate for everyone?", "Not always. Athletes and older people can get misleading results.")])

add("calorie", "calorie-calculator.html", "Fitness & Health", "Calorie calculator", "Cal",
    "Daily calories to maintain, lose or gain weight.",
    "Estimate how many calories you need each day to keep, lose or gain weight.",
    ["The calculator first works out your basal metabolic rate with the Mifflin-St Jeor equation, then multiplies it by your activity level to estimate the calories you burn in a day. Eating about 500 fewer a day is roughly half a kilo of loss each week, and about 500 more is roughly half a kilo of gain.",
     "It is an estimate, not medical advice. Do not eat very low calorie diets without medical support."],
    [("How accurate is it?", "It is a good starting point. Real needs vary, so adjust based on how your weight changes over a few weeks."),
     ("How many calories are in half a kilo?", "Roughly 3,500, which is where the 500 a day figure comes from.")])

add("bmr", "bmr-calculator.html", "Fitness & Health", "BMR calculator", "BMR",
    "Calories your body burns at rest.",
    "Find your basal metabolic rate, the calories your body burns at rest.",
    ["Your BMR is the energy your body needs just to stay alive, such as breathing and keeping warm. The calculator uses the Mifflin-St Jeor equation, which is considered one of the most reliable for adults.",
     "To find your total daily burn, use the calorie calculator, which adds your activity."],
    [("What is BMR?", "Basal metabolic rate is the number of calories you would burn lying still all day."),
     ("Does BMR change?", "It falls slowly with age and rises with more muscle.")])

add("body-fat", "body-fat-calculator.html", "Fitness & Health", "Body fat calculator", "Fat",
    "Estimate body fat with a tape measure.",
    "Estimate your body fat percentage from simple tape measurements.",
    ["This uses the US Navy method. Measure your neck and waist, plus your hips if you are female, and enter your height. Measure at the navel for the waist and the widest point for the hips, standing relaxed.",
     "It is an estimate and can be a few percent out. Use the same method each time to track change."],
    [("Where do I measure my waist?", "Level with the navel, after breathing out, without pulling the tape tight."),
     ("Is it as good as a scan?", "No. Scans are more accurate, but this is free and useful for tracking trends.")])

add("ideal-weight", "ideal-weight-calculator.html", "Fitness & Health", "Ideal weight calculator", "Wt",
    "Target weight from four classic formulas.",
    "See a target weight for your height from four well-known formulas.",
    ["The Devine, Robinson, Miller and Hamwi formulas each estimate an ideal weight from height and sex. The calculator shows all four with their average, next to the healthy BMI range for your height.",
     "These formulas are guides from the last century. Muscle, bone structure and age mean a healthy weight can be higher or lower."],
    [("Which formula is best?", "None is perfect. The healthy BMI range is usually the more useful target."),
     ("Can I use stone?", "Yes. Switch to imperial units. The result is shown in kilograms and stone.")])

add("pace", "pace-calculator.html", "Fitness & Health", "Pace calculator", "Pace",
    "Running pace per mile and per kilometre.",
    "Work out your running pace and speed from a distance and time.",
    ["Enter the distance of your run and how long it took. The calculator gives your pace per kilometre and per mile, plus your speed in km/h and mph.",
     "It works for a 5k, a 10k, a half marathon or any distance."],
    [("How do I convert pace to speed?", "Divide 60 by the pace in minutes per kilometre to get km/h."),
     ("What is a good 5k time?", "Many beginners finish in 30 to 40 minutes. It improves quickly with practice.")])

add("due-date", "due-date-calculator.html", "Fitness & Health", "Pregnancy due date calculator", "Due",
    "Estimated due date from your last period.",
    "Estimate your due date from the first day of your last period.",
    ["The due date is counted as 280 days, or 40 weeks, from the first day of your last period, adjusted if your cycle is longer or shorter than 28 days. The calculator also estimates conception and the end of the first trimester.",
     "Only a small share of babies arrive on the day. Your midwife or doctor will confirm your dates, often with a scan."],
    [("What if my cycle is not 28 days?", "Enter your usual cycle length and the date is adjusted."),
     ("Is a scan more accurate?", "Yes. A dating scan can refine the date.")])

add("age", "age-calculator.html", "Other", "Age calculator", "Age",
    "Exact age in years, months and days.",
    "Find your exact age in years, months and days, and how long until your next birthday.",
    ["Enter a date of birth and the date to measure to, which starts as today. You get the age in years, months and days, and also in total months, weeks and days.",
     "It also counts the days until the next birthday."],
    [("Can I find someone's age on a past date?", "Yes. Change the second date."),
     ("How are months counted?", "By calendar months from the birth date, adjusting for shorter months.")])

add("date-calculator", "date-calculator.html", "Other", "Date calculator", "Date",
    "Days between dates, or add days to a date.",
    "Count the days between two dates, or add or subtract days from a date.",
    ["The first tool counts the days between two dates and breaks the gap into years, months, days, weeks and working days. The second adds or subtracts a number of days from a date and tells you the weekday.",
     "Working days count Monday to Friday and do not remove bank holidays."],
    [("Is the end date included?", "No. The count is the number of days from the first date to the second."),
     ("Can I count backwards?", "Yes. Choose subtract in the second tool.")])

add("time", "time-calculator.html", "Other", "Time calculator", "Time",
    "Add or subtract days, hours, minutes and seconds.",
    "Add or subtract two lengths of time in days, hours, minutes and seconds.",
    ["Enter two durations and choose add or subtract. The answer is shown in days, hours, minutes and seconds, and also as total hours, minutes and seconds.",
     "Use it for adding up video lengths, shifts or journey times."],
    [("What if the answer is negative?", "A minus sign shows the second time was longer than the first."),
     ("Can I add more than two?", "Add two, then use the result as the first time for the next.")])

add("hours", "hours-calculator.html", "Other", "Hours calculator", "Hrs",
    "Hours worked between two times, with breaks and pay.",
    "Work out the hours worked between a start and end time, minus breaks, with optional pay.",
    ["Enter when you started, when you finished and any unpaid break. You get the time worked as hours and minutes and in decimal hours, which payroll often needs. Add your hourly rate to see the pay for the shift.",
     "If you finish after midnight, the calculator treats the end time as the next day."],
    [("What are decimal hours?", "Hours with the minutes as a fraction. 7 hours 30 minutes is 7.5."),
     ("Does it handle night shifts?", "Yes. An end time earlier than the start time is treated as after midnight.")])

add("gpa", "gpa-calculator.html", "Other", "GPA calculator", "GPA",
    "Grade point average on the 4.0 scale.",
    "Work out your GPA from your grades and credits on the US 4.0 scale.",
    ["Enter one course per line, with the grade and then the credits, such as A- 3. Grades from A+ to F are worth 4.0 down to 0, and each is weighted by its credits.",
     "GPA is the total quality points divided by the total credits."],
    [("How are plus and minus grades counted?", "A is 4.0, A- is 3.7, B+ is 3.3 and so on down to F at 0."),
     ("Can I enter numbers instead?", "Yes. Use a number from 0 to 4 in place of a letter.")])

add("grade", "grade-calculator.html", "Other", "Grade calculator", "Grade",
    "Weighted grade and the score you need on the final.",
    "Find your weighted course grade, and the score you need on the final to reach your target.",
    ["The first tool takes each score with its weight and works out your overall grade. The second tells you what score you need on the final exam to reach the grade you want.",
     "Enter weights as percentages of the course, such as 30 for a test worth 30%."],
    [("How is a weighted grade worked out?", "Multiply each score by its weight, add them up, and divide by the total weight."),
     ("What if I need more than 100%?", "Then the target may not be reachable, and you may want to aim a little lower.")])

add("fuel-cost", "fuel-cost-calculator.html", "Other", "Fuel cost calculator", "Fuel",
    "Cost of a journey from distance and mpg.",
    "Work out what a journey will cost in fuel.",
    ["Enter the distance, your car's fuel economy and the price of fuel. In UK units that is miles and miles per gallon, which the calculator converts using the imperial gallon of 4.546 litres. Metric users can enter kilometres and litres per 100 km.",
     "Use the figure on your dashboard for the most realistic economy."],
    [("What is an imperial gallon?", "4.546 litres. A US gallon is smaller, at 3.785 litres."),
     ("Why is my real cost higher?", "Economy figures are often better than real driving, especially in towns or with heavy loads.")])

add("speed-distance-time", "speed-distance-time-calculator.html", "Other", "Speed distance time calculator", "mph",
    "Find speed, distance or time.",
    "Find any one of speed, distance or time from the other two.",
    ["Choose what you want to work out and fill in the other two. Speed is distance divided by time, distance is speed times time, and time is distance divided by speed.",
     "Results are shown in miles and miles per hour, with kilometres alongside."],
    [("What are the formulas?", "Speed = distance ÷ time. Distance = speed × time. Time = distance ÷ speed."),
     ("How do I enter minutes?", "Use the hours and minutes boxes together, for example 2 hours and 30 minutes.")])

add("unit-converter", "unit-converter.html", "Other", "Unit converter", "Unit",
    "Length, weight, volume, area, speed, temperature and time.",
    "Convert between metric and imperial units of length, weight, volume, area, speed, temperature and time.",
    ["Pick a type, enter a value, and choose the units to convert from and to. The result updates as you type, and the other units in that type are listed underneath.",
     "It covers UK and US measures, such as the UK pint and gallon and the US cup and gallon."],
    [("Are UK and US gallons different?", "Yes. A UK gallon is 4.546 litres and a US gallon is 3.785 litres."),
     ("How do I convert Celsius to Fahrenheit?", "Multiply by 9, divide by 5, then add 32. The tool does this for you.")])

add("concrete", "concrete-calculator.html", "Other", "Concrete calculator", "Conc",
    "Volume and bags of concrete for a slab.",
    "Work out how much concrete you need for a slab, path or base.",
    ["Enter the length, width and depth of the area. The calculator gives the volume in cubic metres, adds an allowance for waste, and estimates the weight and the number of 20 kg bags of mix.",
     "Always order a little extra, since ground is never perfectly level."],
    [("How much extra should I allow?", "About 10% covers spills, uneven ground and settling."),
     ("How many bags make a cubic metre?", "Roughly 110 bags of 20 kg mix, depending on the brand. Check the bag.")])

add("subnet", "subnet-calculator.html", "Other", "Subnet calculator", "IP",
    "Network, mask, broadcast and hosts for IPv4.",
    "Find the network address, mask, broadcast and host range for an IPv4 subnet.",
    ["Enter an IPv4 address and a prefix length such as 24. The calculator gives the network address, subnet mask, broadcast address, first and last usable address and the number of hosts.",
     "A /24 has 256 addresses, of which 254 can be given to devices."],
    [("What is a prefix length?", "The number of bits in the network part of the address. /24 means a mask of 255.255.255.0."),
     ("Why are two addresses not usable?", "The first is the network address and the last is the broadcast address.")])

add("password", "password-generator.html", "Other", "Password generator", "Pwd",
    "Strong random passwords, made in your browser.",
    "Create strong random passwords, made in your browser and never sent anywhere.",
    ["Choose a length and which characters to use, and tap generate. Passwords are made with your device's secure random generator, and include at least one of each chosen type.",
     "Longer is stronger. Sixteen characters or more is a good habit, and each account should have its own."],
    [("Is it safe to use a website for this?", "This one makes the password on your device and sends nothing. Even so, a password manager is the best place to keep them."),
     ("How long should a password be?", "At least 14 to 16 characters for important accounts.")])

BY = {c["slug"]: c for c in C}


def esc(s):
    return html.escape(s, quote=True)


def card(c):
    return '<a class="card" href="%s"><div class="tile">%s</div><h3>%s</h3><p>%s</p></a>' % (c["file"], c["glyph"], c["name"], c["short"])


def related(slug):
    me = BY[slug]
    same = [c for c in C if c["cat"] == me["cat"] and c["slug"] != slug]
    other = [c for c in C if c["cat"] != me["cat"]]
    pick = (same + other)[:6]
    return '<div class="cards">' + "".join(card(c) for c in pick) + "</div>"


SALARY_FORM = """<form class="panel calc sal" id="sal-form" autocomplete="off" onsubmit="return false">
<div class="cf-grid">
<div class="cf"><label for="sal-amount">Pay</label><input id="sal-amount" class="field" type="text" inputmode="decimal" value="35000"></div>
<div class="cf"><label for="sal-per">Paid per</label><select id="sal-per" class="field"><option value="hour">Hour</option><option value="day">Day</option><option value="week">Week</option><option value="2week">2 weeks</option><option value="month">Month</option><option value="year" selected>Year</option></select></div>
<div class="cf"><label for="sal-cur">Currency</label><select id="sal-cur" class="field"><option value="&pound;">&pound; Pound</option><option value="$">$ Dollar</option><option value="&euro;">&euro; Euro</option></select></div>
<div class="cf"><label for="sal-hours">Hours per week</label><input id="sal-hours" class="field" type="text" inputmode="decimal" value="40"></div>
<div class="cf"><label for="sal-days">Days per week</label><input id="sal-days" class="field" type="text" inputmode="decimal" value="5"></div>
<div class="cf"><label for="sal-off">Unpaid days off a year</label><input id="sal-off" class="field" type="text" inputmode="decimal" value="0"></div>
</div>
<label class="cf-chk"><input type="checkbox" id="sal-uk" checked> Estimate UK take-home pay</label>
<p class="cr-err" id="sal-err" role="alert" hidden></p>
<div class="cr" id="sal-out">
<div class="cr-tw"><table class="cr-t sal-t" id="sal-tbl"><thead><tr><th scope="col">Pay period</th><th scope="col">Pay</th><th scope="col" class="sal-adj" hidden>Adjusted for days off</th></tr></thead><tbody></tbody></table></div>
<div id="sal-uk-out"><h2 class="cm-h">Estimated UK take-home pay</h2><dl class="cr-rows" id="sal-uk-stats"></dl>
<p class="hint">For 2026/27 in England, Wales and Northern Ireland. Pension, student loan, tax codes and Scottish rates are not included.</p></div>
</div>
<div class="btns"><button type="button" class="btn alt" id="sal-reset">Reset</button></div>
</form>"""


def body(slug):
    c = BY[slug]
    form = SALARY_FORM if slug == "salary" else '<div class="panel calc" data-calc="%s" id="calc"></div>' % slug
    about = "".join("<p>%s</p>" % p for p in c["about"])
    faq = "".join("<h3>%s</h3><p>%s</p>" % (q, a) for q, a in c["faq"])
    return ('<main><div class="wrap">\n<section class="hero calc-hero">\n<h1>%s</h1>\n<p class="lede">%s</p>\n%s\n</section>\n'
            '<section class="block narrow calc-about">\n<h2>About this calculator</h2>\n%s\n<h2>Common questions</h2>\n%s\n</section>\n'
            '<section class="block">\n<h2>More free calculators</h2>\n%s\n<p class="calc-all"><a href="calculators.html">See all calculators</a></p>\n</section>\n</div></main>\n'
            '<script src="assets/calc.js"></script>%s\n') % (
        esc(c["name"]), esc(c["lede"]), form, about, faq, related(slug),
        '\n<script src="assets/salary.js"></script>' if slug == "salary" else "")


def hub():
    parts = ['<main><div class="wrap">\n<section class="hero calc-hero">\n<h1>Free online calculators</h1>\n'
             '<p class="lede">Simple, fast calculators for money, maths, health and everyday life. Everything runs in your browser, with no sign-up.</p>\n</section>']
    icons = {"Financial": "Money", "Math": "Maths", "Fitness & Health": "Fitness and health", "Other": "Everyday"}
    for cat in CATS:
        items = [c for c in C if c["cat"] == cat]
        parts.append('<section class="block calc-cat">\n<h2>%s</h2>\n<div class="cards">%s</div>\n</section>' % (esc(cat), "".join(card(c) for c in items)))
    parts.append("</div></main>\n")
    return "\n".join(parts)
