"""Long-form content for GoUnscramble: guides, glossary, FAQ and extra sections for the tool pages.
Word lists on the data pages are computed from the ENABLE list at build time, so they are always accurate."""
import html


def chips(words):
    return '<div class="chips">' + "".join('<span class="chip">%s</span>' % html.escape(w) for w in words) + "</div>"


def load_words(path):
    out = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            w = line.strip().lower()
            if w.isalpha():
                out.append(w)
    return sorted(set(out))


# ---------------------------------------------------------------- guide articles (hand written)

HOW_TO = """<h1>How to unscramble words</h1>
<p>Unscrambling is the skill of spotting a real word inside a jumble of letters. Computers do it by checking every word in a list, but you can get quicker at it by hand, and a good method helps even when you use a tool. These are the habits that work best.</p>
<h2>1. Write the letters out, then move them around</h2>
<p>Letters in a straight line tempt you to read them in the order given. Write them in a circle, or on separate tiles, and shuffle them. Seeing a fresh order is often enough to make a word jump out.</p>
<h2>2. Look for common endings first</h2>
<p>A large share of English words end in a small set of patterns. If your letters include <em>I</em>, <em>N</em> and <em>G</em>, try <em>-ing</em> at the back. Other useful endings are <em>-ed</em>, <em>-er</em>, <em>-est</em>, <em>-ly</em>, <em>-s</em>, <em>-es</em>, <em>-tion</em> and <em>-ness</em>. Set those letters aside and the rest of the jumble becomes shorter and easier. The <a href="prefixes-and-suffixes.html">prefixes and suffixes guide</a> lists the most useful ones.</p>
<h2>3. Look for common beginnings</h2>
<p>The same trick works at the front. Letters that can form <em>re-</em>, <em>un-</em>, <em>in-</em>, <em>dis-</em>, <em>pre-</em> or <em>over-</em> are worth pulling out first. If the remaining letters spell a word on their own, you have found the answer.</p>
<h2>4. Keep letter pairs together</h2>
<p>Some pairs of letters appear together far more often than they appear apart: <em>TH</em>, <em>CH</em>, <em>SH</em>, <em>PH</em>, <em>WH</em>, <em>CK</em>, <em>NG</em> and <em>QU</em>. If you have a <em>Q</em>, look for a <em>U</em> straight away, and treat the pair as one tile. Double letters such as <em>LL</em>, <em>SS</em>, <em>EE</em> and <em>OO</em> are also common.</p>
<h2>5. Count your vowels</h2>
<p>Most English words need a vowel, and words usually alternate between consonants and vowels more often than they bunch. With only one vowel, the word is likely short or built on a consonant cluster (<em>strength</em> has a single vowel). With many vowels, try to separate them with consonants. Remember that <em>Y</em> can act as a vowel in words like <em>rhythm</em> and <em>gym</em>.</p>
<h2>6. Work from short to long, or long to short</h2>
<p>Finding any word is a start. Once you have a short word, check whether you can extend it: add an <em>S</em>, an <em>-ED</em>, or a letter in the middle. If you are hunting for the longest word, start by trying to use every tile, and only then step down one letter at a time.</p>
<h2>7. Use blanks and patterns when you have partial information</h2>
<p>In many puzzles you know some of the letters but not all of them. The <a href="index.html">word unscrambler</a> accepts <strong>?</strong> or <strong>*</strong> for an unknown letter, and the filters under <em>More options</em> let you say what a word starts with, ends with or contains, and how long it is. That turns a huge list into a short one.</p>
<h2>Try it on a real jumble</h2>
<p>Take the letters <strong>A E L P P</strong>. There is a double letter in <em>P</em>, so keep <em>PP</em> together. Common endings include <em>-LE</em>, which leaves <em>A</em>, <em>P</em>, <em>P</em>: that spells <em>apple</em>. The method turned five scattered tiles into a word in two steps.</p>
<p>When you are stuck, type your letters into the <a href="index.html">unscrambler</a> and compare your own guesses with the full list. Over time you will start to notice which patterns you missed.</p>
"""

WHAT_IS_ANAGRAM = """<h1>What is an anagram?</h1>
<p>An anagram is a word or phrase made by rearranging the letters of another word or phrase, using every letter exactly once. The new arrangement must also be a real word or phrase. <em>Listen</em> and <em>silent</em> are anagrams of each other: both use the letters E, I, L, N, S and T, once each.</p>
<h2>Examples</h2>
<ul>
<li><strong>listen</strong>, <strong>silent</strong>, <strong>enlist</strong>, <strong>tinsel</strong> and <strong>inlets</strong> all share the same six letters.</li>
<li><strong>evil</strong>, <strong>vile</strong>, <strong>live</strong> and <strong>veil</strong> are four anagrams of one another.</li>
<li><strong>stressed</strong> and <strong>desserts</strong> use the same eight letters.</li>
<li><strong>the eyes</strong> and <strong>they see</strong> are an example of a phrase anagram, where spaces do not count as letters.</li>
</ul>
<h2>Anagram, unscramble and permutation</h2>
<p>These words are close, but they are not the same.</p>
<ul>
<li>An <strong>anagram</strong> uses all of the letters, so the new word has the same length.</li>
<li>To <strong>unscramble</strong> usually means finding any word hidden in a set of letters. Most word games let you use some of your tiles, not all of them, so unscrambling covers shorter words too. That is why the <a href="index.html">word unscrambler</a> lists words of every length, while the <a href="anagram-solver.html">anagram solver</a> lists only words that use every letter.</li>
<li>A <strong>permutation</strong> is any ordering of the letters, whether or not it makes a word. Most permutations are nonsense.</li>
</ul>
<h2>How many arrangements are there?</h2>
<p>For a word with no repeated letters, the number of orderings is the factorial of its length. Four distinct letters can be ordered in 24 ways (4 x 3 x 2 x 1). Ten distinct letters can be ordered in 3,628,800 ways. When letters repeat, divide by the factorial of each repeated count, which is why a word like <em>letter</em> has fewer distinct orderings than six different letters would. Only a tiny share of those orderings are real words, which is why a computer checks a dictionary rather than trying every ordering by eye.</p>
<h2>Anagrams in puzzles and writing</h2>
<p>Cryptic crosswords use anagrams constantly. The clue contains the letters to rearrange plus an <em>anagram indicator</em>, a word that signals disorder, such as <em>mixed</em>, <em>broken</em>, <em>confused</em>, <em>wild</em> or <em>out</em>. Spotting those indicator words is half the battle. Writers also use anagrams for pen names, character names and hidden messages.</p>
<h2>Finding anagrams</h2>
<p>Type your letters into the <a href="anagram-solver.html">anagram solver</a>. It lists every word in its dictionary that uses all of them. Add a <strong>?</strong> for a letter you are unsure of and it will try every possibility.</p>
"""

SCRABBLE = """<h1>Scrabble tips: score more with the tiles you have</h1>
<p>Scrabble rewards vocabulary, but also tile awareness and board sense. These tips apply to the standard English game. Always check the rules and the word list used where you play, because they differ between countries and between apps.</p>
<h2>Know the tile values</h2>
<p>In the standard English tile set, letters are worth the following points.</p>
<ul>
<li><strong>1 point:</strong> A, E, I, O, U, L, N, S, T, R</li>
<li><strong>2 points:</strong> D, G</li>
<li><strong>3 points:</strong> B, C, M, P</li>
<li><strong>4 points:</strong> F, H, V, W, Y</li>
<li><strong>5 points:</strong> K</li>
<li><strong>8 points:</strong> J, X</li>
<li><strong>10 points:</strong> Q, Z</li>
<li><strong>0 points:</strong> the two blank tiles</li>
</ul>
<h2>Place high tiles on premium squares</h2>
<p>A letter on a double or triple letter square is multiplied before the word score is added, and a word square then multiplies the whole word. A <em>J</em> or <em>X</em> on a triple letter square scores far more than the same tile placed plainly. Better still, place an <em>X</em> so that it forms two words at once, such as in a two-letter word that crosses a longer word, so the tile scores twice.</p>
<h2>Aim for a bingo</h2>
<p>Using all seven of your tiles in one turn earns a 50-point bonus. That is often worth more than several average turns together. To make bingos more likely, keep a balanced rack: a mix of vowels and consonants, and favour tiles such as <em>E</em>, <em>R</em>, <em>S</em>, <em>T</em>, <em>A</em> and <em>I</em>, which combine into many long words. Plan around common endings like <em>-ING</em>, <em>-ED</em> and <em>-ER</em>. Paste your rack into the <a href="index.html">unscrambler</a> after the game, with a <strong>?</strong> for any blank, to see which long words you missed.</p>
<h2>Learn the short words</h2>
<p>Knowing the valid two- and three-letter words lets you play tiles in tight spots, make parallel plays, and score multiple words at once. See the <a href="two-letter-words.html">two-letter words</a> and <a href="three-letter-words.html">three-letter words</a> lists, and the lists of <a href="words-with-q-without-u.html">words with Q but no U</a>, <a href="words-with-z.html">words with Z</a>, and <a href="words-with-j-and-x.html">words with J and X</a> for your most awkward tiles.</p>
<h2>Swap when your rack is poor</h2>
<p>A rack with five vowels or no vowels rarely scores well. Swapping tiles costs you a turn, but it can be better than playing a low-scoring word that leaves a bad rack behind. A good play often scores less than the maximum but keeps the better tiles for next time.</p>
<h2>Watch what you open up</h2>
<p>Every word you place creates new lines for your opponent. Putting a word next to a triple word square gives them a chance at a big score. Think about the hooks, the letters that can be added to the front or back of your word, before you play.</p>
<h2>Which word list?</h2>
<p>Official tournament lists exist for different regions, and a word that is valid in one may not be valid in another. This site currently uses the free ENABLE list, so use it for practice and learning, and check disputed words against the list your game uses. <a href="word-lists-explained.html">Word lists explained</a> has more.</p>
"""

WORDLE = """<h1>Tips for five-letter word puzzles</h1>
<p>Games where you guess a hidden five-letter word in a limited number of tries reward a systematic approach more than luck. These tips work for Wordle-style games in general.</p>
<h2>Pick a strong first guess</h2>
<p>A good opening word uses common letters and different letters in every position. Words made of letters such as <em>E</em>, <em>A</em>, <em>R</em>, <em>O</em>, <em>T</em>, <em>L</em>, <em>I</em>, <em>S</em> and <em>N</em> tend to reveal the most information. Avoid openers with double letters, since a repeated letter tells you less. Whatever word you choose, keep using it or a small set: you will learn how it tends to reveal vowels and common consonants.</p>
<h2>Use your second guess to cover new letters</h2>
<p>If the first guess leaves you with little, play a second word that uses five fresh letters, even if you know it cannot be the answer. Covering ten common letters in two guesses narrows the answer a lot.</p>
<h2>Track positions, not just letters</h2>
<p>Yellow letters tell you a letter is present but in a different place. Use that to rule out positions. If <em>R</em> was yellow in the third position, try it first, second, fourth or fifth next time. Green letters are locked in.</p>
<h2>Think about common patterns</h2>
<p>Many five-letter words end in <em>-S</em>, <em>-ED</em>, <em>-ER</em>, <em>-LY</em> or <em>-Y</em>. Common start patterns include <em>ST-</em>, <em>CH-</em>, <em>TR-</em>, <em>BL-</em> and <em>GR-</em>. Words rarely have three vowels in a row.</p>
<h2>Beware of the near-miss trap</h2>
<p>Sometimes your clues fit many words that differ in only one letter, such as <em>_IGHT</em>, which could be <em>light</em>, <em>might</em>, <em>night</em>, <em>right</em>, <em>sight</em> or <em>tight</em>. If you keep guessing one at a time, you can run out of tries. Instead, play a word that tests several of the candidate first letters at once, even if it is not itself a candidate.</p>
<h2>Use a helper to review, not to cheat</h2>
<p>After a puzzle, you can paste letters into the <a href="index.html">unscrambler</a>, set <em>Word length</em> to 5 under More options, and set <em>Contains</em> to a letter you know. It helps you learn which words you overlooked. Whether to use a helper during a puzzle is up to you and the rules of the game you play.</p>
"""

CROSSWORD = """<h1>Crossword and word-search help</h1>
<p>Crosswords reward a mix of vocabulary, pattern recognition and lateral thinking. These approaches help with both quick (straight) crosswords and the cryptic kind.</p>
<h2>Start with the easy clues</h2>
<p>Fill in the short answers and the clues you are sure of first. Each letter you add helps the clues that cross it. Work around the grid rather than finishing one corner.</p>
<h2>Use the crossing letters</h2>
<p>When you know some letters of an answer, you have a pattern, such as <strong>T _ A _ E</strong>. That is where a pattern search helps. In the <a href="index.html">word unscrambler</a>, use <em>Starts with</em>, <em>Ends with</em>, <em>Contains</em> and <em>Word length</em>. For pattern-based searching of this kind, set the length, then use the starts-with and ends-with boxes for the known end letters.</p>
<h2>Learn crossword conventions</h2>
<ul>
<li>A question mark at the end of a clue often means the answer involves wordplay or a pun.</li>
<li>Abbreviations in the clue suggest abbreviations in the answer.</li>
<li>A foreign word in the clue usually means a foreign word in the answer.</li>
<li>Plural clues have plural answers, and past-tense clues have past-tense answers.</li>
</ul>
<h2>Cryptic crosswords</h2>
<p>A cryptic clue has two parts: a plain definition, usually at the start or end, and a piece of wordplay that also produces the answer. Common wordplay types include anagrams (look for indicator words such as <em>mixed</em>, <em>broken</em> or <em>wild</em>), hidden words (the answer sits inside the clue text), reversals, and charades (smaller words joined together). Use the <a href="anagram-solver.html">anagram solver</a> on the letters of the fodder to check your idea quickly. Read <a href="what-is-an-anagram.html">what is an anagram</a> for background.</p>
<h2>Word-search puzzles</h2>
<p>Look for unusual letters first, such as <em>Q</em>, <em>Z</em>, <em>X</em> and <em>J</em>, because they appear less often and limit where a word can sit. Scan for the first and last letter of each word in the list, and remember that words can run in any direction, including backwards and diagonally.</p>
"""

PREFIXES = """<h1>Common prefixes and suffixes</h1>
<p>Many English words are built from a root with a piece added to the front (a prefix) or the back (a suffix). Recognising these pieces makes unscrambling, spelling and vocabulary building much easier. If you can spot a prefix or suffix inside a jumble, you can set those letters aside and work on a shorter problem.</p>
<h2>Useful prefixes</h2>
<ul>
<li><strong>re-</strong> means again or back: <em>replay</em>, <em>return</em>, <em>rebuild</em>.</li>
<li><strong>un-</strong> means not or the opposite of: <em>unhappy</em>, <em>undo</em>, <em>unlock</em>.</li>
<li><strong>in-, im-, il-, ir-</strong> mean not: <em>inactive</em>, <em>impossible</em>, <em>illegal</em>, <em>irregular</em>.</li>
<li><strong>dis-</strong> means apart or not: <em>disagree</em>, <em>disconnect</em>.</li>
<li><strong>pre-</strong> means before: <em>preview</em>, <em>prepay</em>.</li>
<li><strong>mis-</strong> means wrongly: <em>mislead</em>, <em>misplace</em>.</li>
<li><strong>over-</strong> and <strong>under-</strong> mean too much or too little, or above and below: <em>overcook</em>, <em>underpay</em>.</li>
<li><strong>sub-</strong> means under: <em>submarine</em>, <em>subway</em>.</li>
<li><strong>inter-</strong> means between: <em>interact</em>, <em>international</em>.</li>
<li><strong>anti-</strong> means against: <em>antifreeze</em>.</li>
</ul>
<h2>Useful suffixes</h2>
<ul>
<li><strong>-s, -es</strong> make plurals and third-person verbs: <em>cats</em>, <em>boxes</em>, <em>runs</em>.</li>
<li><strong>-ed</strong> makes many past tenses: <em>walked</em>, <em>jumped</em>.</li>
<li><strong>-ing</strong> makes the continuous form: <em>walking</em>, <em>jumping</em>.</li>
<li><strong>-er, -est</strong> compare things: <em>faster</em>, <em>fastest</em>. <strong>-er</strong> also names a person who does something: <em>teacher</em>, <em>painter</em>.</li>
<li><strong>-ly</strong> usually turns an adjective into an adverb: <em>quick</em> to <em>quickly</em>.</li>
<li><strong>-ness</strong> makes a noun from an adjective: <em>kindness</em>, <em>darkness</em>.</li>
<li><strong>-tion, -sion</strong> make nouns from verbs: <em>action</em>, <em>decision</em>.</li>
<li><strong>-ful</strong> means full of: <em>helpful</em>, <em>careful</em>. <strong>-less</strong> means without: <em>hopeless</em>, <em>careless</em>.</li>
<li><strong>-able, -ible</strong> mean able to be: <em>readable</em>, <em>visible</em>.</li>
<li><strong>-ment</strong> makes a noun: <em>movement</em>, <em>payment</em>.</li>
</ul>
<h2>Using this in word games</h2>
<p>In Scrabble-style games, adding an <em>S</em>, <em>ED</em> or <em>ING</em> to a word already on the board is a classic way to score on both lines at once. When you have a long rack, try to spot a suffix first. Our <a href="index.html">unscrambler</a> has an <em>Ends with</em> filter: set it to <em>ing</em> to see only words that finish that way.</p>
<p>Not every word follows the rules, and spelling can change when a suffix is added (<em>happy</em> becomes <em>happiness</em>, <em>run</em> becomes <em>running</em>). Treat these patterns as clues, not guarantees.</p>
"""

WORD_COUNT = """<h1>Word count guide: how long should your writing be?</h1>
<p>Length targets are guides, not laws, and they vary by publisher, school and platform. Always check the instructions you were given. These are common rules of thumb, and you can measure your own text with the <a href="word-counter.html">word counter</a>.</p>
<h2>Common limits and rough lengths</h2>
<ul>
<li><strong>Short posts on social networks</strong> are often limited by characters rather than words. The standard post limit on X is 280 characters. Characters include spaces, so use the counter's character figure.</li>
<li><strong>Text messages (SMS)</strong> fit 160 characters in a single standard message. Longer messages are split into several parts, and messages with emoji or some non-Latin characters fit fewer.</li>
<li><strong>Search result descriptions</strong> are often cut off at around 150 to 160 characters, though the exact point varies with the width of the characters used.</li>
<li><strong>Common App personal essay</strong> for US college applications has a limit of 650 words.</li>
<li><strong>Blog posts</strong> that aim to cover a topic in depth often run to 1,000 to 2,000 words, but shorter posts can work well when the topic is narrow.</li>
<li><strong>School essays</strong> are set by the teacher. A page of double-spaced typed text is often about 250 to 300 words, but font size and margins change this.</li>
</ul>
<h2>Words, characters and sentences</h2>
<p>This site counts a word as any run of characters separated by spaces or line breaks. Different programs count in slightly different ways: for example, whether a hyphenated word like <em>well-known</em> counts as one word or two, or whether a standalone number counts. If an exact figure matters, such as in an exam or a contest entry, check which tool the organiser uses.</p>
<h2>Reading time</h2>
<p>The reading time shown by the counter assumes about 200 words a minute. Adults commonly read silently at around 200 to 250 words a minute for ordinary text, though reading speed depends on the reader, the topic and the difficulty. Technical text and reading on a screen are usually slower. Speaking is slower than reading: for a talk, plan roughly 125 to 150 words a minute, and add time for pauses, slides and questions.</p>
<h2>How to trim a text that is too long</h2>
<ol>
<li>Cut repeated points. If two paragraphs say the same thing, keep the stronger one.</li>
<li>Replace phrases with single words: <em>due to the fact that</em> becomes <em>because</em>.</li>
<li>Remove filler words such as <em>really</em>, <em>very</em>, <em>just</em> and <em>that</em> where the sentence works without them.</li>
<li>Prefer active voice: <em>The team wrote the report</em> is shorter than <em>The report was written by the team</em>.</li>
<li>Check your count again after each pass.</li>
</ol>
<h2>How to expand a text that is too short</h2>
<p>Add an example, a definition, a reason or a counter-argument. Padding with empty phrases makes writing worse, so add substance.</p>
"""

TITLE_CASE = """<h1>Title case, sentence case and other letter cases</h1>
<p>The <a href="case-converter.html">case converter</a> switches text between four styles. This guide explains what each one is for, and how the tool behaves so that you can fix any edge cases by hand.</p>
<h2>UPPER CASE</h2>
<p>Every letter is a capital. It is useful for short labels, acronyms and warnings, but long passages in capitals are slow to read and can feel like shouting.</p>
<h2>lower case</h2>
<p>Every letter is small. It is handy for tidying text copied from a source that capitalised everything, and for creating web addresses, file names or tags that should be consistent.</p>
<h2>Title Case</h2>
<p>Used for headings, book titles and headlines. Style guides disagree on the details. Most agree that the first and last words are capitalised, and most lowercase short words such as <em>a</em>, <em>an</em>, <em>the</em>, <em>and</em>, <em>but</em> and <em>or</em> in the middle of a title. They differ on short prepositions. One common newspaper style lowercases prepositions of three letters or fewer, whereas another widely used style lowercases all prepositions regardless of length. If a particular style guide applies to you, follow it.</p>
<p><strong>How this tool works:</strong> it capitalises the first letter of every word and lowercases the rest. That is a simple and predictable rule, but it does not know the small-word exceptions, so after converting you may want to lowercase words like <em>of</em> or <em>the</em> yourself. Hyphenated words get a capital after each hyphen.</p>
<h2>Sentence case</h2>
<p>The first letter of each sentence is a capital and the rest of the text is lowercase. Sentence case is the usual style for body text and is increasingly common for headings too, because it reads naturally. <strong>How this tool works:</strong> it lowercases everything, then capitalises the first letter after a full stop, question mark or exclamation mark. Proper nouns, such as the names of people and places, and the word <em>I</em>, will be lowercased, so check these after converting.</p>
<h2>Which should I use?</h2>
<ul>
<li>Headline or book title: Title Case, following your style guide.</li>
<li>Body text, emails and most web headings: sentence case.</li>
<li>Text copied from a PDF with strange capitals: convert to lowercase, then to sentence case.</li>
<li>Button labels and menu items: follow the style used by the rest of your interface and keep it consistent.</li>
</ul>
<h2>Tips</h2>
<p>Your text stays in your browser. It is not uploaded, so you can use the converter for private drafts. Always read the result before you send or publish it.</p>
"""

WORD_LISTS = """<h1>Word lists explained: ENABLE, NWL and CSW</h1>
<p>A word game or word tool is only as good as the list of words it checks against. Different lists include different words, which is why an unscrambler, a dictionary and a game can sometimes disagree about whether something is a word.</p>
<h2>Why different lists exist</h2>
<p>A general dictionary tries to describe the language. A game word list tries to settle disputes: it is a fixed list that says which strings are allowed in play. Game lists include inflected forms (plurals and verb forms), exclude words that need capital letters or hyphens, and may include very rare words that appear in long dictionaries.</p>
<h2>ENABLE</h2>
<p>ENABLE stands for Enhanced North American Benchmark Lexicon. It is a free word list that is in the public domain, which means anyone can use it. It was created for use in word games and software. It contains about 173,000 words and is the list this site currently uses.</p>
<h2>NWL</h2>
<p>NWL is the NASPA Word List, the official word list for tournament Scrabble in the United States and Canada. It is maintained by an organisation and is licensed, so it cannot be copied into a tool without permission. The unscrambler shows it as <em>coming soon</em>.</p>
<h2>CSW</h2>
<p>CSW stands for Collins Scrabble Words, the list used for tournament play in the United Kingdom and most other countries outside North America. It is published by Collins and also licensed. It is generally larger than the North American list and has some different words. It is also shown as <em>coming soon</em>.</p>
<h2>What this means for you</h2>
<ul>
<li>Most common words appear in every list, so for everyday puzzles the differences are small.</li>
<li>For competitive play, confirm any unusual word in the exact list your game or tournament uses.</li>
<li>A word being missing from this site does not mean it is invalid elsewhere, and a word shown here may not be playable in your game.</li>
</ul>
<p>The <a href="credits.html">credits page</a> lists the sources of the data used on this site.</p>
"""

# ---------------------------------------------------------------- glossary and FAQ

GLOSSARY_TERMS = [
    ("Anagram", "A word or phrase made by rearranging all the letters of another word or phrase."),
    ("Blank tile", "A tile that can stand for any letter. Use ? or * in the unscrambler."),
    ("Bingo", "In Scrabble-style games, playing all seven tiles from your rack in one turn, which earns a 50-point bonus."),
    ("Consonant", "A letter that is not A, E, I, O or U. Y can act as either."),
    ("Dictionary (word list)", "The list of words a tool or game accepts as valid."),
    ("Hook", "A letter that can be added to the front or back of a word on the board to form a new word, such as S on the end of a noun."),
    ("Inflection", "A changed form of a word, such as a plural or a past tense."),
    ("Letter tile", "A single lettered piece used in word games."),
    ("Prefix", "A group of letters added to the front of a word, such as un- in unhappy."),
    ("Rack", "The set of tiles a player holds in Scrabble-style games."),
    ("Suffix", "A group of letters added to the end of a word, such as -ing in running."),
    ("Unscramble", "To find words hidden in a set of letters, using some or all of them."),
    ("Vowel", "The letters A, E, I, O and U, and sometimes Y."),
]

FAQ_ITEMS = [
    ("How does the word unscrambler work?",
     "You type the letters you have. The tool checks every word in its dictionary and keeps the ones you can spell using those letters, with each letter used at most as many times as you typed it. Results are grouped by length, longest first."),
    ("What is the difference between the unscrambler and the anagram solver?",
     "The unscrambler shows words of every length that can be made from some or all of your letters. The anagram solver shows only the words that use every one of your letters."),
    ("How do I use a blank tile?",
     "Type ? or * in place of the unknown letter. A blank can stand for any letter, but it counts as a tile, so it is used up when it fills a place."),
    ("How many letters can I enter?",
     "Up to 15 letters, including blanks."),
    ("Can I search without typing any letters?",
     "Yes. Leave the letters box empty, open More options, and fill in Starts with, Ends with, Contains or Word length. The tool then lists every word that matches, for example all five-letter words that start with a and end with e."),
    ("Where do the filters go?",
     "Press More options on the home page. There you can pick a dictionary and set starts with, ends with, contains and word length."),
    ("Which dictionary does the site use?",
     "At present it uses ENABLE, a public-domain word list of about 173,000 words. US and Canada (NWL) and UK (CSW) lists are planned but need licences. See word lists explained."),
    ("A word I know is missing. Why?",
     "No list contains every word. Proper nouns, hyphenated words and very new words are often left out, and each game list makes different choices. You can tell us through the contact page."),
    ("Is every word the tool shows valid in my game?",
     "Not always. Check unusual words against the list your game uses."),
    ("Are the letters I type saved or sent anywhere?",
     "No. The tools run in your browser, so what you type is not sent to our server. See the privacy page for details."),
    ("Does it work on a phone?",
     "Yes. The pages adapt to small screens."),
    ("Is the site free?",
     "Yes. All the tools are free and need no sign-up."),
    ("How does the word counter count words?",
     "It counts runs of characters separated by spaces or line breaks. Other programs may treat hyphens, numbers or symbols differently."),
    ("What does the random word picker do?",
     "It picks words at random from the dictionary. You choose how many, and optionally a length. It is useful for games, writing prompts and vocabulary practice."),
]


def faq_html(items=None, heading=True):
    items = items or FAQ_ITEMS
    out = []
    for q, a in items:
        out.append("<h3>%s</h3><p>%s</p>" % (html.escape(q), a))
    return "\n".join(out)


FAQ_PAGE = """<h1>Frequently asked questions</h1>
<p>Quick answers about how GoUnscramble works. If yours is not here, use the <a href="contact.html">contact page</a>.</p>
@@FAQ@@
"""

GLOSSARY_PAGE = """<h1>Word game glossary</h1>
<p>Short definitions of terms used in word games and on this site.</p>
<dl class="gloss">
@@TERMS@@
</dl>
<p>For longer explanations see <a href="what-is-an-anagram.html">what is an anagram</a>, <a href="scrabble-tips.html">Scrabble tips</a> and <a href="prefixes-and-suffixes.html">prefixes and suffixes</a>.</p>
"""


def glossary_html():
    return "\n".join("<dt>%s</dt><dd>%s</dd>" % (html.escape(t), html.escape(d)) for t, d in GLOSSARY_TERMS)


# ---------------------------------------------------------------- data pages (computed)

def two_letter_page(words):
    w2 = [w for w in words if len(w) == 2]
    return """<h1>Two-letter words</h1>
<p>Short words are the glue of word games. They let you play a tile beside tiles that are already on the board and score on two lines at once. This page lists all %d two-letter words in the ENABLE word list used by this site.</p>
<div class="notice"><p>Valid two-letter words differ between word lists and games. Always check the list your game uses before relying on an unusual one.</p></div>
%s
<h2>How to use this list</h2>
<ul>
<li><strong>Parallel plays:</strong> place a word alongside another word so that each pair of touching letters forms a valid two-letter word.</li>
<li><strong>Dumping awkward tiles:</strong> several words here use high-value or difficult letters. Words such as <em>ax</em>, <em>ex</em>, <em>ox</em>, <em>xi</em> and <em>xu</em> make good use of an X, and <em>jo</em> is an easy home for a J.</li>
<li><strong>Vowel dumps:</strong> words such as <em>ae</em>, <em>ai</em>, <em>oe</em> and <em>aa</em> help when your rack has too many vowels.</li>
</ul>
<h2>Two-letter words without a vowel</h2>
<p>A few valid words contain no vowel at all, such as %s. These are worth remembering when you hold only consonants.</p>
<p>Continue with the <a href="three-letter-words.html">three-letter words</a>, or use the <a href="index.html">unscrambler</a> with <em>Word length</em> set to 2 to find which of these your own tiles can make.</p>
""" % (len(w2), chips(w2), ", ".join("<em>%s</em>" % w for w in w2 if not any(c in "aeiouy" for c in w)))


def three_letter_page(words):
    w3 = [w for w in words if len(w) == 3]
    groups = {}
    for w in w3:
        groups.setdefault(w[0], []).append(w)
    secs = []
    for letter in sorted(groups):
        secs.append('<h3 id="l-%s">%s (%d)</h3>%s' % (letter, letter.upper(), len(groups[letter]), chips(groups[letter])))
    jump = " ".join('<a href="#l-%s">%s</a>' % (l, l.upper()) for l in sorted(groups))
    return """<h1>Three-letter words</h1>
<p>There are %d three-letter words in the ENABLE word list used by this site, grouped below by first letter. Three-letter words are the workhorses of short plays: they fit into tight spaces and make good hooks.</p>
<div class="notice"><p>Different word lists include different three-letter words. Check unusual ones against your own game's list.</p></div>
<p class="jump">Jump to: %s</p>
%s
<h2>Tips</h2>
<ul>
<li>Learn the three-letter words that start with the awkward letters first, such as those with <em>Q</em>, <em>X</em>, <em>Z</em> and <em>J</em>.</li>
<li>Many three-letter words are hooks: add <em>S</em> to the end of a noun, or a letter at the front, to make a longer word.</li>
<li>See also the <a href="two-letter-words.html">two-letter words</a>.</li>
</ul>
""" % (len(w3), jump, "\n".join(secs))


def q_page(words):
    q = [w for w in words if "q" in w and "qu" not in w]
    return """<h1>Words with Q but no U</h1>
<p>The letter <em>Q</em> is worth 10 points in standard Scrabble, but it is usually followed by <em>U</em>. When you draw a Q and no U, these words are your way out. The ENABLE list used by this site has %d of them, shown below.</p>
<div class="notice"><p>Many of these are loanwords from other languages. Some are not valid in every word list or game, so check the one you play.</p></div>
%s
<h2>The ones worth memorising</h2>
<ul>
<li><strong>qat</strong> and <strong>suq</strong> are the shortest, at three letters each.</li>
<li><strong>qi</strong> appears in some modern word lists but is not in ENABLE, so check your game.</li>
<li><strong>faqir</strong>, <strong>qaid</strong>, <strong>qoph</strong> and <strong>suq</strong> are other short ones.</li>
<li><strong>qwerty</strong>, the name of the standard keyboard layout, is on this list, and it needs no U.</li>
</ul>
<h2>Plan ahead</h2>
<p>If you hold a Q early in a game, keep a U in your rack, or aim for a word with <em>QU</em> in it. The <a href="index.html">unscrambler</a> with a <em>Contains</em> filter set to <em>qu</em> shows words that use both. See <a href="scrabble-tips.html">Scrabble tips</a> for more on awkward tiles.</p>
""" % (len(q), chips(q))


def z_page(words):
    z = [w for w in words if "z" in w and len(w) <= 5]
    by_len = {}
    for w in z:
        by_len.setdefault(len(w), []).append(w)
    secs = "".join("<h2>%d-letter words with Z (%d)</h2>%s" % (n, len(by_len[n]), chips(by_len[n])) for n in sorted(by_len))
    return """<h1>Words with Z</h1>
<p>Z is worth 10 points in standard Scrabble, so a good Z play can swing a game. This page lists every word with a Z of up to five letters in the ENABLE word list used by this site, grouped by length.</p>
<div class="notice"><p>Check unusual words against the list your game uses.</p></div>
%s
<h2>Playing the Z</h2>
<ul>
<li>A short Z word on a double or triple letter square usually scores more than a long plain word.</li>
<li>Look for places where your Z can sit on a premium square and also form a second word.</li>
<li>For longer options, try the <a href="index.html">unscrambler</a> with your tiles plus the Z, and set <em>Contains</em> to <em>z</em>.</li>
</ul>
<p>Related lists: <a href="words-with-q-without-u.html">words with Q but no U</a> and <a href="words-with-j-and-x.html">words with J and X</a>.</p>
""" % secs


def jx_page(words):
    j = [w for w in words if "j" in w and len(w) <= 4]
    x = [w for w in words if "x" in w and len(w) <= 4]
    return """<h1>Words with J and X</h1>
<p>J and X are each worth 8 points in standard Scrabble. They are strong tiles when you know the short words that use them. Below are all words of up to four letters with a J or an X in the ENABLE list used by this site.</p>
<div class="notice"><p>Check unusual words against the list your game uses.</p></div>
<h2>Short words with J (%d)</h2>
%s
<h2>Short words with X (%d)</h2>
%s
<h2>Tips</h2>
<ul>
<li>X is easy to place: <em>ax</em>, <em>ex</em>, <em>ox</em> and <em>xi</em> let you drop an X beside many vowels and score in two directions.</li>
<li>J is harder because it needs a vowel next to it. Keep <em>jo</em> and three-letter words such as <em>jab</em>, <em>jam</em> and <em>jar</em> in mind.</li>
<li>Do not hold J too long. It is heavy and hard to place on a crowded board.</li>
</ul>
<p>Related: <a href="words-with-z.html">words with Z</a>, <a href="words-with-q-without-u.html">words with Q but no U</a>.</p>
""" % (len(j), chips(j), len(x), chips(x))


# ---------------------------------------------------------------- tool page extras

HOME_EXTRA = """<section class="block narrow">
<h2>How to use the word unscrambler</h2>
<ol>
<li>Type your letters into the box. You can enter up to 15, and use <strong>?</strong> or <strong>*</strong> for a blank tile.</li>
<li>Press <em>Unscramble</em>. Words are grouped by length, with the longest first.</li>
<li>Open <em>More options</em> to pick a dictionary or to narrow the list with <em>Starts with</em>, <em>Ends with</em>, <em>Contains</em> and <em>Word length</em>.</li>
<li>No letters? Leave the letters box empty and use only those options to list every word that starts with, ends with or contains something, or has a certain length.</li>
</ol>
<p>Each letter can be used only as many times as you typed it, so <em>TEAR</em> can make <em>rate</em> but not <em>tree</em>, which needs two <em>E</em>s. Words do not have to use every letter. To find only words that use all of them, use the <a href="anagram-solver.html">anagram solver</a>.</p>
</section>
<section class="block narrow">
<h2>Good for</h2>
<ul class="plain">
<li><strong>Scrabble-style games.</strong> Find the best word for your rack. See <a href="scrabble-tips.html">Scrabble tips</a>.</li>
<li><strong>Five-letter puzzles.</strong> Set the length and a letter you know. See <a href="wordle-tips.html">tips for five-letter puzzles</a>.</li>
<li><strong>Crosswords and word searches.</strong> Use the filters for patterns. See <a href="crossword-help.html">crossword help</a>.</li>
<li><strong>Learning.</strong> Teachers and parents can use it for spelling and vocabulary practice.</li>
</ul>
</section>
<section class="block narrow">
<h2>Common questions</h2>
@@FAQ@@
<p><a href="faq.html">See all questions</a></p>
</section>
"""

ANAGRAM_EXTRA = """<section class="block narrow">
<h2>Anagram or unscramble?</h2>
<p>An anagram uses every letter you have, exactly once. The unscrambler is wider: it also shows shorter words that use only some of your letters. If you are solving a cryptic crossword clue or a puzzle that says <em>rearrange all the letters</em>, you want an anagram. If you are playing a tile game, you probably want the <a href="index.html">unscrambler</a>.</p>
<h2>Examples</h2>
<p>The letters <strong>LISTEN</strong> give <em>silent</em>, <em>enlist</em>, <em>tinsel</em> and <em>inlets</em>. The letters <strong>EVIL</strong> give <em>live</em>, <em>veil</em> and <em>vile</em>. A blank can fill a missing letter: <strong>LIS?EN</strong> tries every letter in the blank place.</p>
<p>Read more in <a href="what-is-an-anagram.html">what is an anagram</a> and <a href="crossword-help.html">crossword help</a>.</p>
</section>
"""

RANDOM_EXTRA = """<section class="block narrow">
<h2>What is a random word picker for?</h2>
<ul class="plain">
<li><strong>Games.</strong> Draw words for charades, Pictionary-style drawing or word-association games.</li>
<li><strong>Writing prompts.</strong> Pick three words and write a story or poem that uses all of them.</li>
<li><strong>Vocabulary and spelling.</strong> Pull words of a chosen length for practice or a spelling test.</li>
<li><strong>Passphrases and names.</strong> Random words can inspire usernames, project names or team names. Do not rely on a random word picker for passwords, which should be created by a password manager.</li>
</ul>
<h2>Tips</h2>
<p>Set <em>Word length</em> to match your activity. Short words are good for young learners, and long ones are good for challenges. Press <em>Pick words</em> again for a fresh set.</p>
<p>The words come from the ENABLE list, which includes plurals and verb forms, and some unusual words. See <a href="word-lists-explained.html">word lists explained</a>.</p>
</section>
"""

COUNTER_EXTRA = """<section class="block narrow">
<h2>What the counter measures</h2>
<ul class="plain">
<li><strong>Words:</strong> runs of characters separated by spaces or line breaks.</li>
<li><strong>Characters:</strong> every character, including spaces and line breaks. <strong>Characters (no spaces)</strong> leaves out spaces and line breaks.</li>
<li><strong>Sentences:</strong> pieces of text ended by a full stop, question mark or exclamation mark.</li>
<li><strong>Paragraphs:</strong> blocks of text separated by a blank line.</li>
<li><strong>Reading time:</strong> words divided by 200, rounded up.</li>
</ul>
<h2>Your text stays private</h2>
<p>The counting happens in your browser. Nothing you type is uploaded.</p>
<p>For typical length targets for essays, posts and messages, see the <a href="word-count-guide.html">word count guide</a>.</p>
</section>
"""

CASE_EXTRA = """<section class="block narrow">
<h2>The four cases</h2>
<ul class="plain">
<li><strong>UPPER CASE</strong> makes every letter a capital.</li>
<li><strong>lower case</strong> makes every letter small.</li>
<li><strong>Title Case</strong> capitalises the first letter of every word.</li>
<li><strong>Sentence case</strong> capitalises the first letter of each sentence and lowercases the rest.</li>
</ul>
<h2>Things to check afterwards</h2>
<p>Title Case here does not leave small words such as <em>of</em> and <em>the</em> in lower case, and Sentence case lowercases names and the word <em>I</em>. Read the result and fix those by hand. The <a href="title-case-guide.html">case guide</a> explains the differences between styles. Your text stays in your browser and is never uploaded.</p>
</section>
"""

TOOLS_EXTRA = """<section class="block narrow">
<h2>About these tools</h2>
<p>Everything here runs in your browser, so the letters and text you type stay on your device. There is nothing to install and no account to create.</p>
<p>The <strong>word unscrambler</strong> and <strong>anagram solver</strong> share a dictionary of about 173,000 words and support blank tiles. The <strong>random word picker</strong> draws from the same list. The <strong>word counter</strong> and <strong>case converter</strong> work on any text you paste in.</p>
<p>Want to learn more? Read our <a href="guides.html">guides</a>, or look up a term in the <a href="glossary.html">glossary</a>.</p>
</section>
"""

# ---------------------------------------------------------------- guides index

GUIDE_LIST = [
    ("how-to-unscramble-words.html", "How to unscramble words", "A step-by-step method for spotting words in a jumble of letters."),
    ("what-is-an-anagram.html", "What is an anagram?", "Definitions, examples and the difference between an anagram and an unscramble."),
    ("scrabble-tips.html", "Scrabble tips", "Tile values, bingos, premium squares and what to do with a poor rack."),
    ("wordle-tips.html", "Tips for five-letter puzzles", "Opening guesses, tracking clues and avoiding near-miss traps."),
    ("crossword-help.html", "Crossword and word-search help", "Using patterns, conventions and the basics of cryptic clues."),
    ("prefixes-and-suffixes.html", "Common prefixes and suffixes", "Word beginnings and endings that make unscrambling easier."),
    ("two-letter-words.html", "Two-letter words", "Every two-letter word in the ENABLE list."),
    ("three-letter-words.html", "Three-letter words", "Every three-letter word in the ENABLE list, by first letter."),
    ("words-with-q-without-u.html", "Words with Q but no U", "The words to know when you draw a Q and no U."),
    ("words-with-z.html", "Words with Z", "Short words that use a Z, grouped by length."),
    ("words-with-j-and-x.html", "Words with J and X", "Short words that use a J or an X."),
    ("word-count-guide.html", "Word count guide", "Typical lengths, reading time and how to trim or expand a text."),
    ("title-case-guide.html", "Title case, sentence case and more", "When to use each case and how the converter behaves."),
    ("word-lists-explained.html", "Word lists explained", "ENABLE, NWL and CSW, and why word lists differ."),
    ("glossary.html", "Glossary", "Short definitions of word game terms."),
    ("faq.html", "Frequently asked questions", "Quick answers about the tools."),
]


def guides_page():
    cards = "".join('<a class="card" href="%s"><h3>%s</h3><p>%s</p></a>' % (h, html.escape(t), html.escape(d)) for h, t, d in GUIDE_LIST)
    return """<h1>Guides</h1>
<p>Plain-English articles, reference lists and answers to common questions about word games and the tools on this site.</p>
<div class="cards guide-cards">%s</div>
""" % cards


def guide_bodies(words):
    """Return {filename: article_html} for every content page."""
    return {
        "how-to-unscramble-words.html": HOW_TO,
        "what-is-an-anagram.html": WHAT_IS_ANAGRAM,
        "scrabble-tips.html": SCRABBLE,
        "wordle-tips.html": WORDLE,
        "crossword-help.html": CROSSWORD,
        "prefixes-and-suffixes.html": PREFIXES,
        "two-letter-words.html": two_letter_page(words),
        "three-letter-words.html": three_letter_page(words),
        "words-with-q-without-u.html": q_page(words),
        "words-with-z.html": z_page(words),
        "words-with-j-and-x.html": jx_page(words),
        "word-count-guide.html": WORD_COUNT,
        "title-case-guide.html": TITLE_CASE,
        "word-lists-explained.html": WORD_LISTS,
        "glossary.html": GLOSSARY_PAGE.replace("@@TERMS@@", glossary_html()),
        "faq.html": FAQ_PAGE.replace("@@FAQ@@", faq_html()),
        "guides.html": guides_page(),
    }


PAGE_META = {
    "how-to-unscramble-words.html": ("How to Unscramble Words", "A step-by-step method for unscrambling words: endings, beginnings, letter pairs, vowels and blank tiles."),
    "what-is-an-anagram.html": ("What Is an Anagram?", "What an anagram is, with examples, how it differs from unscrambling, and how many arrangements a word can have."),
    "scrabble-tips.html": ("Scrabble Tips", "Scrabble tips: tile values, premium squares, bingos, short words and what to do with a poor rack."),
    "wordle-tips.html": ("Tips for Five-Letter Word Puzzles", "Tips for five-letter word puzzles: strong first guesses, tracking clues and avoiding near-miss traps."),
    "crossword-help.html": ("Crossword and Word-Search Help", "Crossword help: using patterns, conventions, cryptic clue basics and word-search tips."),
    "prefixes-and-suffixes.html": ("Common Prefixes and Suffixes", "Common English prefixes and suffixes, with examples, and how they help you unscramble words."),
    "two-letter-words.html": ("Two-Letter Words", "A complete list of two-letter words in the ENABLE word list, with tips for word games."),
    "three-letter-words.html": ("Three-Letter Words", "A complete list of three-letter words in the ENABLE word list, grouped by first letter."),
    "words-with-q-without-u.html": ("Words With Q but No U", "Words with Q but no U in the ENABLE word list, and how to use them in word games."),
    "words-with-z.html": ("Words With Z", "Short words with Z up to five letters, from the ENABLE word list."),
    "words-with-j-and-x.html": ("Words With J and X", "Short words with J or X up to four letters, from the ENABLE word list."),
    "word-count-guide.html": ("Word Count Guide", "Typical word and character limits, reading time, and how to trim or expand your writing."),
    "title-case-guide.html": ("Title Case, Sentence Case and More", "When to use upper, lower, title and sentence case, and how the case converter behaves."),
    "word-lists-explained.html": ("Word Lists Explained", "ENABLE, NWL and CSW word lists explained, and why different games accept different words."),
    "glossary.html": ("Word Game Glossary", "Definitions of word game terms such as anagram, blank tile, bingo, hook, prefix and suffix."),
    "faq.html": ("Frequently Asked Questions", "Answers to common questions about the word unscrambler, anagram solver and other tools."),
    "guides.html": ("Guides", "Guides, word lists and answers about word games, anagrams, Scrabble, crosswords and writing tools."),
}
