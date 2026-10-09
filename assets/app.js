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

  function renderWords(box, words) {
    clear(box);
    if (!words.length) {
      note(box, 'No words found. Try different letters, add a blank (?) or remove a filter.');
      return;
    }
    box.appendChild(el('p', 'note strong', 'Found ' + words.length.toLocaleString() + (words.length === 1 ? ' word' : ' words')));
    var shown = words.length > MAX_SHOWN ? words.slice(0, MAX_SHOWN) : words;
    GU.groupByLength(shown).forEach(function (g) {
      var sec = el('section', 'group');
      var h = el('h3', null, g.length + ' letters');
      h.appendChild(el('span', 'count', ' (' + g.words.length + ')'));
      sec.appendChild(h);
      var chips = el('div', 'chips');
      g.words.forEach(function (w) { chips.appendChild(el('span', 'chip', w)); });
      sec.appendChild(chips);
      box.appendChild(sec);
    });
    if (shown.length < words.length) {
      box.appendChild(el('p', 'note', 'Showing the longest ' + MAX_SHOWN.toLocaleString() + ' words. Add a filter to narrow the list.'));
    }
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
        out.classList.toggle('filter-mode', filtersOnly);
        renderWords(out, filtersOnly ? GU.findByFilters(words, opts) : GU.find(words, letters, opts));
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
        jumble.split('').forEach(function (c) { tiles.appendChild(el('span', 'ltile', c.toUpperCase())); });
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
      if (fields.length) fields[0].focus();
    });
  }

  setupClear();
  if (page === 'home') setupUnscramble('subset');
  else if (page === 'anagram') setupUnscramble('exact');
  else if (page === 'random') setupRandom();
  else if (page === 'counter') setupCounter();
  else if (page === 'case') setupCase();
})();
