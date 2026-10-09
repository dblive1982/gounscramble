/* GoUnscramble engine: pure functions, no DOM. Works in the browser (window.GU) and in Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GU = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Count the usable letters and blanks (? or *) in what the visitor typed.
  function parseLetters(raw) {
    var counts = new Array(26).fill(0), blanks = 0, total = 0;
    var s = String(raw || '').toLowerCase();
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (ch === '?' || ch === '*') { blanks++; total++; }
      else if (ch >= 'a' && ch <= 'z') { counts[ch.charCodeAt(0) - 97]++; total++; }
    }
    return { counts: counts, blanks: blanks, total: total };
  }

  // Turn a word list file (one word per line) into an array of clean a-z words.
  function parseWords(text) {
    var lines = String(text || '').split(/\r?\n/), out = [];
    for (var i = 0; i < lines.length; i++) {
      var w = lines[i].trim().toLowerCase();
      if (w.length >= 2 && /^[a-z]+$/.test(w)) out.push(w);
    }
    return out;
  }

  function clean(s) { return String(s || '').toLowerCase().replace(/[^a-z]/g, ''); }

  // Find every word that can be made from the letters.
  // opts.mode: 'subset' (any words from some or all letters) or 'exact' (use every letter).
  // opts.starts / ends / contains: letters the word must start with, end with or contain.
  // opts.length: exact word length (0 or empty = any).
  function find(words, letters, opts) {
    opts = opts || {};
    var p = parseLetters(letters);
    var mode = opts.mode === 'exact' ? 'exact' : 'subset';
    var starts = clean(opts.starts), ends = clean(opts.ends), contains = clean(opts.contains);
    var length = parseInt(opts.length, 10) || 0;
    var tmp = new Array(26), out = [];
    for (var n = 0; n < words.length; n++) {
      var w = words[n], L = w.length;
      if (L > p.total) continue;
      if (mode === 'exact' && L !== p.total) continue;
      if (length && L !== length) continue;
      if (starts && w.lastIndexOf(starts, 0) !== 0) continue;
      if (ends && w.slice(-ends.length) !== ends) continue;
      if (contains && w.indexOf(contains) === -1) continue;
      for (var i = 0; i < 26; i++) tmp[i] = p.counts[i];
      var miss = 0, ok = true;
      for (var j = 0; j < L; j++) {
        var c = w.charCodeAt(j) - 97;
        if (tmp[c] > 0) tmp[c]--;
        else if (++miss > p.blanks) { ok = false; break; }
      }
      if (ok) out.push(w);
    }
    out.sort(function (a, b) { return b.length - a.length || (a < b ? -1 : a > b ? 1 : 0); });
    return out;
  }

  // True when at least one filter (starts, ends, contains, length) is filled in.
  function hasFilters(opts) {
    opts = opts || {};
    return !!(clean(opts.starts) || clean(opts.ends) || clean(opts.contains) || (parseInt(opts.length, 10) || 0));
  }

  // Filters only, no letters: every word that starts with, ends with or contains something, or has a given length.
  function findByFilters(words, opts) {
    opts = opts || {};
    if (!hasFilters(opts)) return [];
    var starts = clean(opts.starts), ends = clean(opts.ends), contains = clean(opts.contains);
    var length = parseInt(opts.length, 10) || 0, out = [];
    for (var n = 0; n < words.length; n++) {
      var w = words[n];
      if (length && w.length !== length) continue;
      if (starts && w.lastIndexOf(starts, 0) !== 0) continue;
      if (ends && w.slice(-ends.length) !== ends) continue;
      if (contains && w.indexOf(contains) === -1) continue;
      out.push(w);
    }
    out.sort(function (a, b) { return b.length - a.length || (a < b ? -1 : a > b ? 1 : 0); });
    return out;
  }

  // Tile values, A to Z, for Scrabble and for Words With Friends.
  var TILES = {
    scrabble: [1, 3, 3, 2, 1, 4, 2, 4, 1, 8, 5, 1, 3, 1, 1, 3, 10, 1, 1, 1, 1, 4, 4, 8, 4, 10],
    wwf:      [1, 4, 4, 2, 1, 4, 3, 3, 1, 10, 5, 2, 4, 2, 1, 4, 10, 1, 1, 1, 2, 5, 4, 8, 3, 10]
  };

  // Points for a word. If the player's letters are given, any letter they do not have must come from a blank tile, which scores 0.
  function scoreWord(word, game, letters) {
    var vals = TILES[game];
    if (!vals) return 0;
    var have = letters ? parseLetters(letters).counts.slice() : null, s = 0;
    for (var i = 0; i < word.length; i++) {
      var c = word.charCodeAt(i) - 97;
      if (c < 0 || c > 25) continue;
      if (have) { if (have[c] > 0) { have[c]--; s += vals[c]; } }
      else s += vals[c];
    }
    return s;
  }

  // [{length: 5, words: [...]}, ...] longest first. Input must already be sorted longest first.
  function groupByLength(list) {
    var groups = [], cur = null;
    for (var i = 0; i < list.length; i++) {
      if (!cur || cur.length !== list[i].length) { cur = { length: list[i].length, words: [] }; groups.push(cur); }
      cur.words.push(list[i]);
    }
    return groups;
  }

  // Pick `count` different random words, optionally of one length. `rng` is injectable for tests.
  function pickRandom(words, count, length, rng) {
    rng = rng || Math.random;
    var pool = [], len = parseInt(length, 10) || 0;
    for (var i = 0; i < words.length; i++) if (!len || words[i].length === len) pool.push(words[i]);
    var n = Math.min(Math.max(parseInt(count, 10) || 1, 1), pool.length);
    for (var k = 0; k < n; k++) {
      var r = k + Math.floor(rng() * (pool.length - k));
      var t = pool[k]; pool[k] = pool[r]; pool[r] = t;
    }
    return pool.slice(0, n);
  }

  // Word counter statistics.
  function countText(text) {
    var t = String(text || ''), trimmed = t.trim();
    var words = trimmed ? trimmed.split(/\s+/).length : 0;
    var chars = Array.from(t).length;
    var noSpaces = Array.from(t.replace(/\s/g, '')).length;
    var sentences = trimmed ? trimmed.split(/[.!?]+(?:\s+|$)/).filter(function (s) { return s.trim().length > 0; }).length : 0;
    var paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter(function (s) { return s.trim().length > 0; }).length : 0;
    return { words: words, characters: chars, charactersNoSpaces: noSpaces, sentences: sentences, paragraphs: paragraphs, readingMinutes: words / 200 };
  }

  function formatReading(minutes) {
    if (minutes <= 0) return '0 min';
    if (minutes < 1) return '< 1 min';
    return Math.ceil(minutes) + ' min';
  }

  // Case converter: mode is 'upper', 'lower', 'title' or 'sentence'.
  function convertCase(text, mode) {
    var s = String(text || '');
    if (mode === 'upper') return s.toUpperCase();
    if (mode === 'lower') return s.toLowerCase();
    if (mode === 'title') {
      return s.toLowerCase().replace(/(^|[\s\-(])([^\s\-(])/g, function (m, a, b) { return a + b.toUpperCase(); });
    }
    if (mode === 'sentence') {
      return s.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); });
    }
    return s;
  }

  return {
    parseLetters: parseLetters, parseWords: parseWords, find: find, findByFilters: findByFilters, hasFilters: hasFilters, scoreWord: scoreWord, groupByLength: groupByLength,
    pickRandom: pickRandom, countText: countText, formatReading: formatReading, convertCase: convertCase
  };
});
