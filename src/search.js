// Pure helpers for the "Search a number" panel.

// Swertres: 1 to 3 digits, written 305, 3-0-5 or "3 0 5". 4D: 1 to 4 digits.
// Lotto games: 1 to 6 different numbers between 1 and max (2D: 1 or 2 numbers, so maxCount = 2), separated by spaces, commas or dashes.
// Returns an array of numbers, or null when the text is not a usable search.
// `digit` is false for lotto, or the number of digits in one result (3 for Swertres, 4 for 4D; true means 3).
export function parseQuery(text, digit, max, maxCount = 6) {
  if (digit) {
    const len = digit === true ? 3 : digit;
    const d = text.replace(/\D/g, '').split('').map(Number);
    return d.length >= 1 && d.length <= len ? d : null;
  }
  const nums = [...new Set(text.split(/[^0-9]+/).filter(Boolean).map(Number))];
  return nums.length >= 1 && nums.length <= maxCount && nums.every((n) => n >= 1 && n <= max) ? nums : null;
}

// Does one draw of a slotted game (Swertres 3 digits, 4D 4 digits, 2D two numbers) match? 'exact' = the digits in order (a shorter search must be
// consecutive digits), 'any' = the digits in any order (Rambolito style), 'last' = the search is the end of the result, 'first' = the start (6D).
export function slotHas(s, q, mode) {
  if (!s) return false;
  if (mode === 'any') {
    const c = {};
    s.forEach((n) => { c[n] = (c[n] || 0) + 1; });
    return q.every((n) => { c[n] = (c[n] || 0) - 1; return c[n] >= 0; });
  }
  if (mode === 'last') return q.length <= s.length && q.every((n, k) => s[s.length - q.length + k] === n);
  if (mode === 'first') return q.length <= s.length && q.every((n, k) => s[k] === n);
  for (let i = 0; i + q.length <= s.length; i++) if (q.every((n, k) => s[i + k] === n)) return true;
  return false;
}

// entries: [[date, value], ...] already in the order you want back.
// Swertres value = [slot2pm, slot5pm, slot9pm] (each [d,d,d] or null). Lotto value = [n, n, n, n, n, n].
// Returns [{ d, v, hits }]; hits = matching slot indexes (Swertres) or matching numbers (lotto).
export function findMatches(entries, q, { digit, mode = 'exact', timeIdx = null }) {
  const out = [];
  for (const [d, v] of entries) {
    if (digit) {
      const hits = [];
      v.forEach((s, i) => { if ((timeIdx === null || timeIdx === i) && slotHas(s, q, mode)) hits.push(i); });
      if (hits.length) out.push({ d, v, hits });
    } else if (lottoHas(v, q, mode)) out.push({ d, v, hits: q });
  }
  return out;
}

// Does one 6-number lotto draw (numbers in the order they were drawn) match a search?
// 'seq' = your numbers appear in the draw in the same order you typed them, anywhere, gaps allowed (12 ... 23 ... 41).
// 'row' = your numbers appear side by side in the draw in that order (12-23-41, no number between them).
// anything else = all your numbers are in the draw in any order and any place (the original search).
export function lottoHas(v, q, mode) {
  if (mode === 'seq') {
    let i = 0;
    for (const n of v) if (n === q[i] && ++i === q.length) return true;
    return false;
  }
  if (mode === 'row') {
    for (let i = 0; i + q.length <= v.length; i++) if (q.every((n, k) => v[i + k] === n)) return true;
    return false;
  }
  return q.every((n) => v.includes(n));
}

// ---- Month check ----
// Keeps only matches that fall in one calendar month (1 to 12). month = 0 or null keeps everything.
export function inMonth(found, month) {
  return month ? found.filter((r) => +r.d.slice(5, 7) === month) : found;
}

// Builds a year x month table for a search.
// entries = every saved draw [[date, value], ...]; found = result of findMatches (any month).
// cell = { data, count, dates }. data is false when nothing is saved for that month (not the same as "not drawn").
// count = times it came out (Swertres counts each matching draw time), dates = matching days, newest first.
export function monthGrid(entries, found, { digit }) {
  const ys = entries.map(([d]) => +d.slice(0, 4));
  if (!ys.length) return { years: [], cells: {} };
  const years = [];
  for (let y = Math.min(...ys); y <= Math.max(...ys); y++) years.push(y);
  const cells = {};
  for (const y of years) {
    cells[y] = {};
    for (let m = 1; m <= 12; m++) cells[y][m] = { data: false, count: 0, dates: [] };
  }
  for (const [d] of entries) cells[+d.slice(0, 4)][+d.slice(5, 7)].data = true;
  for (const r of found) {
    const c = cells[+r.d.slice(0, 4)][+r.d.slice(5, 7)];
    c.count += digit ? r.hits.length : 1;
    c.dates.push(r.d);
  }
  return { years, cells };
}

// For one month: in how many of the years with saved results did the search come out?
export function monthSummary(grid, month) {
  const withData = grid.years.filter((y) => grid.cells[y][month].data);
  const hit = withData.filter((y) => grid.cells[y][month].count > 0);
  return { withData, hit, always: withData.length > 0 && hit.length === withData.length };
}

// ---- Find numbers by month ----
// Which numbers came out in the given month in every year from..to?
// Lotto games: single numbers. Swertres, 4D and 2D: whole results (exact order, any draw time), keyed with `join` (2D uses '-').
// Years with nothing saved for that month are left out of the count (and listed in `missing`).
// Returns { years, missing, all, some }. Each item is { key, counts: {year: times}, hits, total }.
// `all` = came out in every year with data, `some` = came out in at least one but not all.
// part = { mode: 'last' | 'first', n } compares only the last or first n digits of each result (6D), otherwise the whole result.
export function commonInMonth(entries, { digit, month, from, to, join = '', part = null }) {
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const have = new Set();
  const map = new Map();
  for (const [d, v] of entries) {
    const y = +d.slice(0, 4);
    if (y < lo || y > hi || (month && +d.slice(5, 7) !== month)) continue;
    have.add(y);
    const keys = digit ? v.filter(Boolean).map((s) => (part ? (part.mode === 'last' ? s.slice(s.length - part.n) : s.slice(0, part.n)) : s).join(join)) : v;
    for (const k of keys) {
      if (!map.has(k)) map.set(k, {});
      map.get(k)[y] = (map.get(k)[y] || 0) + 1;
    }
  }
  const years = [...have].sort((a, b) => a - b);
  const missing = [];
  for (let y = lo; y <= hi; y++) if (!have.has(y)) missing.push(y);
  const items = [...map].map(([key, counts]) => {
    const hits = years.filter((y) => counts[y]).length;
    return { key, counts, hits, total: Object.values(counts).reduce((a, b) => a + b, 0) };
  }).sort((a, b) => b.total - a.total || String(a.key).localeCompare(String(b.key), undefined, { numeric: true }));
  return {
    years,
    missing,
    all: years.length ? items.filter((i) => i.hits === years.length) : [],
    some: items.filter((i) => i.hits < years.length),
  };
}

// ---- 6D straight match ----
// How many digits of a draw match a pick straight (same digit in the same position)?
// mode 'last' = digits counted from the end, 'first' = from the start, 'run' = the longest stretch of neighbouring positions that match, 'multi' = not straight: how many of the pick's digits are in the draw in any order.
// Returns { k, pos } where pos = matching positions (0 to 5).
export function straightRun(pick, draw, mode) {
  if (mode === 'multi') {
    const c = {};
    pick.forEach((x) => { c[x] = (c[x] || 0) + 1; });
    const pos = [];
    draw.forEach((x, i) => { if (c[x] > 0) { c[x]--; pos.push(i); } });
    return { k: pos.length, pos };
  }
  const eq = pick.map((n, i) => n === draw[i]);
  const n = eq.length;
  if (mode === 'last') {
    let k = 0;
    while (k < n && eq[n - 1 - k]) k++;
    return { k, pos: Array.from({ length: k }, (_, i) => n - 1 - i).reverse() };
  }
  if (mode === 'first') {
    let k = 0;
    while (k < n && eq[k]) k++;
    return { k, pos: Array.from({ length: k }, (_, i) => i) };
  }
  let best = { k: 0, pos: [] };
  for (let i = 0; i < n; i++) {
    if (!eq[i]) continue;
    let j = i;
    while (j < n && eq[j]) j++;
    if (j - i > best.k) best = { k: j - i, pos: Array.from({ length: j - i }, (_, x) => i + x) };
    i = j;
  }
  return best;
}

// Scans saved 6D draws (entries = [[date, [[d,d,d,d,d,d]]], ...]) for straight matches of at least `min` digits (default 2).
// month 0 = any month, year 0 = any year. Returns { checked, rows: [{ d, v, k, pos }], tiers: { 6: n, 5: n, 4: n, 3: n } } (rows keep the entries order).
export function straightScan(entries, pick, { mode = 'last', month = 0, year = 0, min = 2 } = {}) {
  const rows = [];
  const tiers = { 6: 0, 5: 0, 4: 0, 3: 0, 2: 0 };
  let checked = 0;
  for (const [d, v] of entries) {
    if (month && +d.slice(5, 7) !== month) continue;
    if (year && +d.slice(0, 4) !== year) continue;
    const slot = v && v[0];
    if (!slot) continue;
    checked++;
    const { k, pos } = straightRun(pick, slot, mode);
    if (k >= min) {
      rows.push({ d, v: slot, k, pos });
      tiers[k]++;
    }
  }
  return { checked, rows, tiers };
}

// ---- 6D: draws that share the same straight digits ----
// Groups the 6D draws of one month (years from..to) by a shared straight stretch of k digits (same digits in the same positions).
// mode 'first' = positions 1 to k, 'last' = the last k positions, 'any' = every stretch of k neighbouring positions.
// Only groups with at least two draws are returned. Each group = { key, start, digits, draws: [{ d, v }], years, hits }.
// Sorted by years covered, then draws, then newest first.
export function straightGroups(entries, { month, from, to, k, mode = 'first' }) {
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const have = new Set();
  const map = new Map();
  for (const [d, v] of entries) {
    const y = +d.slice(0, 4);
    if (y < lo || y > hi || (month && +d.slice(5, 7) !== month) || !v || !v[0]) continue;
    have.add(y);
    const slot = v[0];
    const starts = mode === 'first' ? [0] : mode === 'last' ? [slot.length - k] : Array.from({ length: slot.length - k + 1 }, (_, i) => i);
    for (const st of starts) {
      const digits = slot.slice(st, st + k);
      const key = `${st}:${digits.join('')}`;
      if (!map.has(key)) map.set(key, { key, start: st, digits, draws: [] });
      map.get(key).draws.push({ d, v: slot });
    }
  }
  const years = [...have].sort((a, b) => a - b);
  const missing = [];
  for (let y = lo; y <= hi; y++) if (!have.has(y)) missing.push(y);
  const groups = [...map.values()].filter((g) => g.draws.length > 1).map((g) => {
    g.draws.sort((a, b) => b.d.localeCompare(a.d));
    g.years = [...new Set(g.draws.map((x) => +x.d.slice(0, 4)))].sort((a, b) => a - b);
    g.hits = g.years.length;
    return g;
  }).sort((a, b) => b.hits - a.hits || b.draws.length - a.draws.length || b.draws[0].d.localeCompare(a.draws[0].d));
  return { years, missing, groups };
}

// ---- Lotto: draws of one month that share 3, 4 or more numbers ----
// Looks at the draws of one month (years from..to) and groups the ones that have the same numbers in common (any order, any place).
// A group = every draw that contains the same shared set; the set shown is everything those draws have in common.
// minK = fewest shared numbers to report (3 or 4). exact = true keeps only groups that share exactly minK numbers.
// Only groups with at least two draws are returned. Each group = { nums, draws: [{ d, v }], years, hits }.
// Sorted by how many numbers are shared, then years covered, then draws, then newest first.
export function sharedGroups(entries, { month, from, to, minK = 3, exact = false }) {
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const have = new Set();
  const list = [];
  for (const [d, v] of entries) {
    const y = +d.slice(0, 4);
    if (y < lo || y > hi || (month && +d.slice(5, 7) !== month) || !v) continue;
    have.add(y);
    list.push({ d, v });
  }
  const combos = (arr, k, start = 0, cur = [], out = []) => {
    if (cur.length === k) { out.push(cur.slice()); return out; }
    for (let i = start; i < arr.length; i++) { cur.push(arr[i]); combos(arr, k, i + 1, cur, out); cur.pop(); }
    return out;
  };
  const byCombo = new Map();
  list.forEach((x, i) => {
    for (const c of combos([...new Set(x.v)].sort((a, b) => a - b), minK)) {
      const key = c.join('-');
      if (!byCombo.has(key)) byCombo.set(key, []);
      byCombo.get(key).push(i);
    }
  });
  const sets = new Map();
  for (const idx of byCombo.values()) {
    if (idx.length < 2) continue;
    const key = idx.join(',');
    if (sets.has(key)) continue;
    const nums = idx.map((i) => list[i].v).reduce((a, b) => a.filter((n) => b.includes(n))).slice().sort((a, b) => a - b);
    if (exact && nums.length !== minK) continue;
    sets.set(key, { nums, draws: idx.map((i) => list[i]) });
  }
  const years = [...have].sort((a, b) => a - b);
  const missing = [];
  for (let y = lo; y <= hi; y++) if (!have.has(y)) missing.push(y);
  const groups = [...sets.values()].map((g) => {
    g.draws.sort((a, b) => b.d.localeCompare(a.d));
    g.years = [...new Set(g.draws.map((x) => +x.d.slice(0, 4)))].sort((a, b) => a - b);
    g.hits = g.years.length;
    return g;
  }).sort((a, b) => b.nums.length - a.nums.length || b.hits - a.hits || b.draws.length - a.draws.length || b.draws[0].d.localeCompare(a.draws[0].d));
  return { years, missing, groups, checked: list.length };
}

// ---- Lotto: pair predictor ----
// Given 1 to 6 numbers, looks through every saved draw for the numbers that most often came out in the same draw as them.
// Returns { total, counts, together, partners, topPairs }:
//   total = draws checked, counts[n] = how many draws each entered number is in,
//   together = { all: draws with every entered number, pairs: [{ a, b, count }] } (pairs among the entered numbers),
//   partners = other numbers ranked by how often they came out with the entered numbers (sum of pair counts), each { n, total, by: { entered: count } },
//   topPairs = single pairs (entered number + partner) ranked by pair count: [{ a, b, count }].
export function pairPredict(entries, q, max) {
  const counts = {};
  const co = {};
  let all = 0;
  const pairIn = {};
  for (const e of q) { counts[e] = 0; co[e] = new Array(max + 1).fill(0); }
  for (let i = 0; i < q.length; i++) for (let j = i + 1; j < q.length; j++) pairIn[`${q[i]}-${q[j]}`] = 0;
  for (const [, v] of entries) {
    if (!v) continue;
    const has = q.filter((e) => v.includes(e));
    if (has.length === q.length) all++;
    for (const e of has) {
      counts[e]++;
      for (const n of v) if (n !== e) co[e][n]++;
    }
    for (let i = 0; i < q.length; i++) for (let j = i + 1; j < q.length; j++) if (has.includes(q[i]) && has.includes(q[j])) pairIn[`${q[i]}-${q[j]}`]++;
  }
  const partners = [];
  const topPairs = [];
  for (let n = 1; n <= max; n++) {
    if (q.includes(n)) continue;
    const by = {};
    let total = 0;
    for (const e of q) { by[e] = co[e][n]; total += co[e][n]; if (co[e][n]) topPairs.push({ a: e, b: n, count: co[e][n] }); }
    partners.push({ n, total, by });
  }
  partners.sort((x, y) => y.total - x.total || x.n - y.n);
  topPairs.sort((x, y) => y.count - x.count || x.a - y.a || x.b - y.b);
  const pairs = Object.entries(pairIn).map(([k, count]) => ({ a: +k.split('-')[0], b: +k.split('-')[1], count })).sort((x, y) => y.count - x.count);
  return { total: entries.length, counts, together: { all, pairs }, partners, topPairs };
}

// Target list: for every draw of a 6-number game (6/42, 6/55, 6/58), count how many of the 6 drawn numbers
// are in the target list (any order, any place). Each draw is counted once, under its match count (1 to 6).
export function parseTargets(text, max = 58) {
  const seen = new Set();
  for (const m of String(text).match(/\d+/g) || []) {
    const n = Number(m);
    if (n >= 1 && n <= max) seen.add(n);
  }
  return [...seen].sort((a, b) => a - b);
}

export function targetScan(entries, targets, { month = 0, year = 0, min = 1 } = {}) {
  const set = new Set(targets);
  const rows = [];
  const tiers = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const perNumber = {};
  let checked = 0;
  for (const [d, v] of entries) {
    if (month && +d.slice(5, 7) !== month) continue;
    if (year && +d.slice(0, 4) !== year) continue;
    if (!Array.isArray(v) || v.length !== 6) continue;
    checked++;
    const hits = v.filter((n) => set.has(n));
    for (const n of hits) perNumber[n] = (perNumber[n] || 0) + 1;
    if (hits.length >= min) {
      rows.push({ d, v, hits, k: hits.length });
      tiers[hits.length]++;
    }
  }
  return { checked, rows, tiers, perNumber };
}

// Combination generator: numbers that came out in a month across a range of years, weighted by how often.
// mode "all": every number drawn in that month; "every": only numbers drawn in every year that has data;
// "top": the 15 most frequent. Returns the pool and counts so the page can show where combinations come from.
export function monthPool(entries, { month = 0, from, to, max, mode = 'all' }) {
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const counts = {};
  const yearsWith = {};
  const years = new Set();
  let draws = 0;
  for (const [d, v] of entries) {
    const y = +d.slice(0, 4);
    if (y < lo || y > hi) continue;
    if (month && +d.slice(5, 7) !== month) continue;
    if (!Array.isArray(v) || v.length !== 6) continue;
    draws++;
    years.add(y);
    for (const n of v) {
      if (n > max) continue;
      counts[n] = (counts[n] || 0) + 1;
      (yearsWith[n] ||= new Set()).add(y);
    }
  }
  const ys = [...years].sort((a, b) => a - b);
  let nums = Object.keys(counts).map(Number);
  if (mode === 'every') nums = nums.filter((n) => yearsWith[n].size === ys.length);
  nums.sort((a, b) => counts[b] - counts[a] || a - b);
  if (mode === 'top') nums = nums.slice(0, 15);
  return { years: ys, draws, counts, pool: nums };
}

// Makes `count` different combinations of 6 numbers (sorted). Numbers are picked from the pool, more often
// the ones that came out more. If the pool has fewer than 6 numbers it is topped up with the most frequent
// other numbers from the same month, then with any number up to max.
export function makeCombos(info, { count = 10, max, rng = Math.random }) {
  const { counts } = info;
  const rest = Object.keys(counts).map(Number).filter((n) => !info.pool.includes(n)).sort((a, b) => counts[b] - counts[a] || a - b);
  const anyRest = Array.from({ length: max }, (_, i) => i + 1).filter((n) => !info.pool.includes(n) && !(n in counts));
  const base = [...info.pool];
  const topUp = [];
  for (const n of [...rest, ...anyRest]) { if (base.length + topUp.length >= 6) break; topUp.push(n); }
  const pool = [...base, ...topUp];
  const total = (k) => (k in counts ? counts[k] : 0) + 1; // +1 so topped-up numbers can be picked too
  const out = [];
  const seen = new Set();
  const maxTries = count * 200;
  const possible = pool.length >= 6 ? Infinity : 0;
  for (let t = 0; t < maxTries && out.length < count && possible; t++) {
    const left = [...pool];
    const pick = [];
    while (pick.length < 6) {
      const w = left.reduce((a, n) => a + total(n), 0);
      let r = rng() * w;
      let i = 0;
      for (; i < left.length - 1; i++) { r -= total(left[i]); if (r < 0) break; }
      pick.push(left.splice(i, 1)[0]);
    }
    pick.sort((a, b) => a - b);
    const key = pick.join('-');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(pick);
  }
  return { combos: out, poolUsed: pool, toppedUp: topUp };
}
