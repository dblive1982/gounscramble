/* GoUnscramble page wiring. Everything runs in the visitor's browser; nothing they type is sent anywhere. */
(function () {
  'use strict';
  var page = document.body.getAttribute('data-page');
  var cache = {};
  var DICTS = { enable: 'words/enable.txt' };
  var MAX_SHOWN = 3000;
  var EXAMPLES = [["planet",["planet","platen"]],["garden",["garden","danger","gander"]],["orange",["orange","onager"]],["school",["school","cholos"]],["window",["window","widow"]],["bridge",["bridge","begird"]],["flower",["flower","fowler","reflow"]],["monkey",["monkey","money","keno"]],["castle",["castle","cleats","eclats"]],["silver",["silver","ervils","livers"]],["market",["market","armet","maker"]],["purple",["purple","pulper"]],["yellow",["yellow","lowly","welly"]],["winter",["winter","twiner"]],["summer",["summer","mures","muser"]],["doctor",["doctor","coot","cord"]],["family",["family","filmy","flamy"]],["island",["island","anils","dials"]],["jungle",["jungle","lunge","genu"]],["pocket",["pocket","coke","cope"]],["basket",["basket","abets","bakes"]],["candle",["candle","lanced"]],["dragon",["dragon","adorn","argon"]],["forest",["forest","fetors","fortes"]],["guitar",["guitar","tragi","airt"]],["hammer",["hammer","harem","herma"]],["insect",["insect","incest","nicest"]],["jacket",["jacket","cake","cate"]],["kitten",["kitten","kent","kine"]],["ladder",["ladder","larded","raddle"]],["magnet",["magnet","agent","ament"]],["nature",["nature","antre","tuner"]],["oyster",["oyster","storey","toyers"]],["pencil",["pencil","cline","ceil"]],["rabbit",["rabbit","rabbi","abri"]],["sister",["sister","resist"]],["tomato",["tomato","motto","atom"]],["valley",["valley","alley","leavy"]],["wizard",["wizard","arid","draw"]],["anchor",["anchor","archon","rancho"]],["beach",["beach","ache","bach"]],["cloud",["cloud","could"]],["dance",["dance","acned","caned"]],["eagle",["eagle","aglee"]],["fruit",["fruit","frit","rift"]],["grape",["grape","gaper","pager"]],["house",["house","hoes","hose"]]];

  function $(id) { return document.getElementById(id); }
  function val(id) { var el = $(id); return el ? el.value : ''; }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function note(box, text, cls) { clear(box); box.appendChild(el('p', 'note' + (cls ? ' ' + cls : ''), text)); }

  function dictKey() { var s = $('dictionary'); return s && s.value ? s.value : 'enable'; }

  function loadWords(key) {
    if (cache[key]) return Promise.resolve(cache[key]);
    var file = DICTS[key];
    if (!file) return Promise.reject(new Error('unknown dictionary'));
    return fetch(file).then(function (r) {
      if (!r.ok) throw new Error('missing word list');
      return r.text();
    }).then(function (text) {
      var words = GU.parseWords(text);
      if (!words.length) throw new Error('empty word list');
      cache[key] = words;
      return words;
    });
  }

  // Chip for a word, with the letters matched by Starts with / Ends with / Contains picked out.
  function wordChip(w, f) {
    var chip = el('button', 'chip');
    chip.type = 'button';
    chip.setAttribute('data-word', w);
    chip.setAttribute('aria-pressed', selectedWord === w ? 'true' : 'false');
    if (selectedWord === w) chip.className += ' sel';
    chip.addEventListener('click', function () { selectWord(w); });
    if (canHover) {
      chip.addEventListener('mouseenter', function () { clearTimeout(popTimer); popTimer = setTimeout(function () { showPop(chip, w); }, 200); });
      chip.addEventListener('mouseleave', schedulePopHide);
    }
    var mask = [], i;
    for (i = 0; i < w.length; i++) mask.push(false);
    if (f.starts && w.indexOf(f.starts) === 0) for (i = 0; i < f.starts.length; i++) mask[i] = true;
    if (f.ends && w.slice(-f.ends.length) === f.ends) for (i = w.length - f.ends.length; i < w.length; i++) mask[i] = true;
    if (f.contains) { var at = w.indexOf(f.contains); if (at > -1) for (i = at; i < at + f.contains.length; i++) mask[i] = true; }
    var run = '', on = false;
    function flush() { if (run) { chip.appendChild(on ? el('span', 'hl', run) : document.createTextNode(run)); run = ''; } }
    for (i = 0; i < w.length; i++) { if (mask[i] !== on) { flush(); on = mask[i]; } run += w.charAt(i); }
    flush();
    return chip;
  }

  function cleanFilter(s) { return String(s || '').toLowerCase().replace(/[^a-z]/g, ''); }

  var scoreGame = 'scrabble';
  try { var saved = localStorage.getItem('gu-score-game'); if (saved === 'scrabble' || saved === 'wwf' || saved === 'none') scoreGame = saved; } catch (err) { /* storage unavailable */ }
  var lastRender = null;

  var LOOKUPS = [
    ['Collins Dictionary (UK)', 'https://www.collinsdictionary.com/dictionary/english/'],
    ['Oxford Learner\'s Dictionaries (UK)', 'https://www.oxfordlearnersdictionaries.com/search/english/?q='],
    ['Cambridge Dictionary (UK)', 'https://dictionary.cambridge.org/dictionary/english/'],
    ['Merriam-Webster (US)', 'https://www.merriam-webster.com/dictionary/'],
    ['Dictionary.com (US)', 'https://www.dictionary.com/browse/']
  ];
  var selectedWord = '';
  var lookupPanel = null;

  function linkList(word) {
    var list = el('div', 'lookup-links');
    LOOKUPS.forEach(function (d) {
      var link = el('a', null, d[0] + ' \u2197');
      link.href = d[1] + encodeURIComponent(word);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      list.appendChild(link);
    });
    return list;
  }

  // On computers (devices that can hover), show the dictionary links in a small card when the pointer rests on a word.
  var canHover = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  var pop = null, popTimer = null;

  function hidePop() { if (pop) { pop.hidden = true; } }
  function schedulePopHide() { clearTimeout(popTimer); popTimer = setTimeout(hidePop, 250); }

  function showPop(chip, word) {
    clearTimeout(popTimer);
    if (!pop) {
      pop = el('div', 'lookup-pop');
      pop.setAttribute('role', 'dialog');
      pop.addEventListener('mouseenter', function () { clearTimeout(popTimer); });
      pop.addEventListener('mouseleave', schedulePopHide);
      document.body.appendChild(pop);
    }
    clear(pop);
    pop.appendChild(el('p', 'lookup-title', 'Look up \u201C' + word + '\u201D'));
    pop.appendChild(linkList(word));
    pop.hidden = false;
    var r = chip.getBoundingClientRect();
    var left = Math.max(8, Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 8));
    pop.style.left = left + 'px';
    pop.style.top = (r.bottom + window.scrollY + 6) + 'px';
  }

  function fillLookup() {
    if (!lookupPanel) return;
    clear(lookupPanel);
    lookupPanel.appendChild(el('p', 'lookup-title', 'Look up a word'));
    if (!selectedWord) {
      lookupPanel.appendChild(el('p', 'lookup-hint', (canHover ? 'Hover over any word above, or click it, to see where to look it up.' : 'Tap any word above to see where to look it up.')));
      return;
    }
    lookupPanel.appendChild(el('p', 'lookup-hint', 'Look up \u201C' + selectedWord + '\u201D in a dictionary:'));
    var list = linkList(selectedWord);
    lookupPanel.appendChild(list);
    lookupPanel.appendChild(el('p', 'lookup-note', 'Opens in a new tab. A few Scrabble-only words may not be in a general dictionary.'));
  }

  function selectWord(w) {
    selectedWord = w;
    Array.prototype.forEach.call(document.querySelectorAll('.results .chip'), function (c) {
      var on = c.getAttribute('data-word') === w;
      c.classList.toggle('sel', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    fillLookup();
  }

  function segBar(label, options, current, onPick) {
    var bar = el('div', 'scorebar');
    bar.appendChild(el('span', 'scorelabel', label));
    options.forEach(function (o) {
      var b = el('button', 'seg' + (current === o[0] ? ' on' : ''), o[1]);
      b.type = 'button';
      b.setAttribute('aria-pressed', current === o[0] ? 'true' : 'false');
      b.addEventListener('click', function () {
        onPick(o[0]);
        if (lastRender) renderWords(lastRender.box, lastRender.words, lastRender.letters);
      });
      bar.appendChild(b);
    });
    return bar;
  }

  function scoreBar() {
    return segBar('Points:', [['scrabble', 'Scrabble'], ['wwf', 'Words With Friends'], ['none', 'Off']], scoreGame, function (v) {
      scoreGame = v;
      try { localStorage.setItem('gu-score-game', v); } catch (err) { /* ignore */ }
    });
  }

  function renderWords(box, words, letters) {
    if (!lastRender || lastRender.words !== words) selectedWord = '';
    lastRender = { box: box, words: words, letters: letters || '' };
    var f = { starts: cleanFilter(val('starts')), ends: cleanFilter(val('ends')), contains: cleanFilter(val('contains')) };
    clear(box);
    if (!words.length) {
      note(box, 'No words found. Try different letters, add a blank (?) or remove a filter.');
      return;
    }
    box.appendChild(el('p', 'note strong', 'Found ' + words.length.toLocaleString() + (words.length === 1 ? ' word' : ' words')));
    box.appendChild(scoreBar());
    var shown = words.length > MAX_SHOWN ? words.slice(0, MAX_SHOWN) : words;
    GU.groupByLength(shown).forEach(function (g) {
      var sec = el('section', 'group');
      var h = el('h3', null, g.length + ' letters');
      h.appendChild(el('span', 'count', ' (' + g.words.length + ')'));
      sec.appendChild(h);
      var chips = el('div', 'chips');
      g.words.forEach(function (w) {
        var chip = wordChip(w, f);
        if (scoreGame !== 'none') chip.appendChild(el('sub', 'pts', String(GU.scoreWord(w, scoreGame, lastRender.letters))));
        chips.appendChild(chip);
      });
      sec.appendChild(chips);
      box.appendChild(sec);
    });
    lookupPanel = el('section', 'lookup');
    lookupPanel.setAttribute('aria-live', 'polite');
    fillLookup();
    if (shown.length < words.length) {
      box.appendChild(el('p', 'note', 'Showing the longest ' + MAX_SHOWN.toLocaleString() + ' words. Add a filter to narrow the list.'));
    }
    box.appendChild(lookupPanel);
  }

  function submitForm(form) {
    if (form.requestSubmit) form.requestSubmit();
    else form.dispatchEvent(new Event('submit', { cancelable: true }));
  }

  function shuffleWord(w) {
    var a = w.split(''), s = w, tries = 0;
    while (s === w && tries++ < 20) {
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      s = a.join('');
    }
    return s;
  }

  function setupUnscramble(mode) {
    var form = $('tool-form'), input = $('letters'), out = $('results');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var letters = input.value.trim();
      var opts = { mode: mode, starts: val('starts'), ends: val('ends'), contains: val('contains'), length: val('length') };
      var haveLetters = GU.parseLetters(letters).total >= 2;
      var filtersOnly = !letters && GU.hasFilters(opts);
      if (!haveLetters && !filtersOnly) {
        note(out, GU.hasFilters(opts) || $('starts')
          ? 'Type at least two letters, or fill in one of the options (starts with, ends with, contains or word length).'
          : 'Type at least two letters to get started.', 'error');
        input.focus();
        return;
      }
      note(out, 'Searching…');
      loadWords(dictKey()).then(function (words) {
        renderWords(out, filtersOnly ? GU.findByFilters(words, opts) : GU.find(words, letters, opts), filtersOnly ? '' : letters);
      }).catch(function () {
        note(out, 'The word list could not be loaded. Please try again later.', 'error');
      });
    });
    var example = $('example');
    if (example) {
      // A different example word each time the page loads.
      var pick = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
      var jumble = shuffleWord(pick[0]);
      var tiles = $('ex-letters'), pills = $('ex-pills');
      if (tiles && pills) {
        clear(tiles); clear(pills);
        jumble.split('').forEach(function (c) {
          var tile = el('span', 'ltile', c.toUpperCase());
          tile.appendChild(el('span', 'pt', String(GU.scoreWord(c, 'scrabble'))));
          tiles.appendChild(tile);
        });
        pick[1].forEach(function (w) { pills.appendChild(el('span', 'pill', w)); });
        example.setAttribute('aria-label', 'Try the example: letters ' + jumble.toUpperCase().split('').join(' '));
        input.placeholder = 'e.g. ' + jumble;
      }
      example.addEventListener('click', function () { input.value = jumble; submitForm(form); });
    }
  }

  function setupRandom() {
    var form = $('tool-form'), out = $('results');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var count = Math.min(20, Math.max(1, parseInt(val('count'), 10) || 5));
      var length = parseInt(val('length'), 10) || 0;
      note(out, 'Picking…');
      loadWords(dictKey()).then(function (words) {
        var picks = GU.pickRandom(words, count, length);
        if (!picks.length) { note(out, 'No words of that length. Try a different length.'); return; }
        clear(out);
        var chips = el('div', 'chips');
        picks.forEach(function (w) { chips.appendChild(el('span', 'chip', w)); });
        out.appendChild(chips);
      }).catch(function () {
        note(out, 'The word list could not be loaded. Please try again later.', 'error');
      });
    });
  }

  function setupCounter() {
    var ta = $('text');
    function update() {
      var s = GU.countText(ta.value);
      $('s-words').textContent = s.words.toLocaleString();
      $('s-chars').textContent = s.characters.toLocaleString();
      $('s-nospace').textContent = s.charactersNoSpaces.toLocaleString();
      $('s-sentences').textContent = s.sentences.toLocaleString();
      $('s-paragraphs').textContent = s.paragraphs.toLocaleString();
      $('s-reading').textContent = GU.formatReading(s.readingMinutes);
    }
    ta.addEventListener('input', update);
    update();
  }

  function setupCase() {
    var ta = $('text'), status = $('status');
    function say(t) { status.textContent = t; }
    Array.prototype.forEach.call(document.querySelectorAll('[data-case]'), function (b) {
      b.addEventListener('click', function () {
        ta.value = GU.convertCase(ta.value, b.getAttribute('data-case'));
        say('Converted.');
      });
    });
    $('copy').addEventListener('click', function () {
      function fallback() {
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        say(ok ? 'Copied.' : 'Copy did not work. Select the text and copy it yourself.');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ta.value).then(function () { say('Copied.'); }, fallback);
      } else {
        fallback();
      }
    });
  }

  function setupClear() {
    var b = $('clear-all');
    if (!b) return;
    // On the home page, sit Clear all right beside the More options button.
    var sum = document.querySelector('.more-row .more > summary');
    function place() { if (sum && sum.offsetWidth) b.style.left = (sum.offsetLeft + sum.offsetWidth + 12) + 'px'; }
    if (sum) { place(); window.addEventListener('resize', place); if (document.fonts && document.fonts.ready) document.fonts.ready.then(place); }
    b.addEventListener('click', function () {
      var scope = b.closest('form') || b.closest('.panel') || document;
      var fields = scope.querySelectorAll('input[type=text], input[type=number], textarea');
      Array.prototype.forEach.call(fields, function (f) {
        f.value = f.getAttribute('data-default') || '';
        f.dispatchEvent(new Event('input', { bubbles: true }));
      });
      var out = $('results'); if (out) clear(out);
      var st = $('status'); if (st) st.textContent = '';
      // On phones and tablets, focusing a field pops up the keyboard, so only refocus with a mouse.
      var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      if (touch) { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }
      else if (fields.length) fields[0].focus();
    });
  }

  function setupTheme() {
    var b = $('theme-toggle');
    if (!b) return;
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    function isDark() {
      var t = document.documentElement.getAttribute('data-theme');
      return t ? t === 'dark' : !!(mq && mq.matches);
    }
    function paint() {
      var d = isDark();
      b.textContent = d ? 'Light mode' : 'Dark mode';
      b.setAttribute('aria-label', d ? 'Switch to light mode' : 'Switch to dark mode');
      b.title = d ? 'Light mode' : 'Dark mode';
      var m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute('content', d ? '#15171C' : '#F4F5F7');
    }
    b.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('gu-theme', next); } catch (err) { /* ignore */ }
      paint();
    });
    if (mq && mq.addEventListener) mq.addEventListener('change', paint);
    b.hidden = false;
    paint();
  }

  function setupMenu() {
    var d = document.querySelector('.main-nav .menu');
    if (!d) return;
    document.addEventListener('click', function (e) { if (d.open && !d.contains(e.target)) d.open = false; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && d.open) { d.open = false; d.querySelector('summary').focus(); } });
  }

  setupMenu();
  setupTheme();
  setupClear();
  if (page === 'home') setupUnscramble('subset');
  else if (page === 'anagram') setupUnscramble('exact');
  else if (page === 'random') setupRandom();
  else if (page === 'counter') setupCounter();
  else if (page === 'case') setupCase();
})();
