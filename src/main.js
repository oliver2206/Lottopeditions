import './style.css';
import { SEED, SEED55, SEED58 } from './seed.js';
import { parseDraws } from './parse.js';
import { SEED3 } from './seed3.js';
import { parseSwertres } from './parse3.js';
import { SEED4 } from './seed4.js';
import { parse4D } from './parse4.js';
import { SEED6 } from './seed6.js';
import { parse6D } from './parse6.js';
import { SEED2 } from './seed2.js';
import { parse2D } from './parse2.js';
import { createStage } from './scene3d.js';
import { parseQuery, findMatches, inMonth, monthGrid, monthSummary, commonInMonth, straightScan, straightGroups, sharedGroups, pairPredict, parseTargets, targetScan, monthPool, makeCombos } from './search.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const flat = (slots) => slots.flatMap((x) => x || [null, null, null]);
const flat4 = (slots) => slots.flatMap((x) => x || [null, null, null, null]);
const flat2 = (slots) => slots.flatMap((x) => x || [null, null]);
const flat6 = (slots) => slots.flatMap((x) => x || [null, null, null, null, null, null]);
const GAMES = {
  lotto: {
    name: '6/42 Lotto', sub: 'PCSO results, January 2023 to today. Pick a year, then a month, then a day.',
    START: 2023, store: 'lotto642.draws', seed: SEED, parse: parseDraws, digit: false, max: 42,
    size: () => 1, nums: (v) => v,
    placeholder: 'Paste results here, one draw per line, like Tuesday, August 04, 2026 01-26-42-15-34-19 or 2026-08-04,1,26,42,15,34,19.',
    daysHint: 'Each row is one draw. Tap any ball to highlight the same number across this month. Press Esc to go back.',
  },
  lotto55: {
    name: '6/55 Grand Lotto', sub: 'PCSO Grand Lotto 6/55 results, January 2024 to today (Mon, Wed, Sat). Pick a year, then a month, then a day.',
    START: 2024, store: 'lotto655.draws', seed: SEED55, parse: (t) => parseDraws(t, 55), digit: false, max: 55,
    size: () => 1, nums: (v) => v,
    placeholder: 'Paste results here, one draw per line, like 2026-11-07 22-43-34-12-06-27 (6 numbers from 1 to 55).',
    daysHint: 'Each row is one draw. Tap any ball to highlight the same number across this month. Press Esc to go back.',
  },
  lotto58: {
    name: '6/58 Ultra Lotto', sub: 'PCSO Ultra Lotto 6/58 results, January 2024 to today (Tue, Fri, Sun). Pick a year, then a month, then a day.',
    START: 2024, store: 'lotto658.draws', seed: SEED58, parse: (t) => parseDraws(t, 58), digit: false, max: 58,
    size: () => 1, nums: (v) => v,
    placeholder: 'Paste results here, one draw per line, like 2026-11-06 02-04-09-10-26-47 (6 numbers from 1 to 58).',
    daysHint: 'Each row is one draw. Tap any ball to highlight the same number across this month. Press Esc to go back.',
  },
  swertres: {
    name: 'Swertres', sub: 'PCSO Swertres (3D Lotto), 2PM, 5PM and 9PM draws. Pick a year, then a month, then a day.',
    START: 2020, store: 'lotto3d.draws', seed: SEED3, parse: parseSwertres, digit: true,
    size: (v) => v.filter(Boolean).length, nums: flat, digits: 3, slotted: true, group: 3, joiner: '', times: ['2PM', '5PM', '9PM'],
    qph: 'e.g. 305', help: 'Type 3 digits to find every time they came out (305 or 3-0-5). Type 1 or 2 digits to find draws that contain them.', qerr: 'Enter 1 to 3 digits, like 305.',
    placeholder: 'Paste results here, one day per line: 2026-08-04 305 329 655 (2PM 5PM 9PM, use --- for a missing draw). A line like 2026-08-04 5PM 3-2-9 adds a single draw.',
    daysHint: 'Each row is one day: 2PM, 5PM, 9PM from left to right. Tap a ball to highlight that digit across this month. Press Esc to go back.',
  },
  lotto4d: {
    name: '4D Lotto', sub: 'PCSO 4D Lotto results, January 2026 to today (Mon, Wed, Fri 9PM). Pick a year, then a month, then a day.',
    START: 2026, store: 'lotto4d.draws', seed: SEED4, parse: parse4D, digit: true,
    size: (v) => v.filter(Boolean).length, nums: flat4, digits: 4, slotted: true, group: 4, joiner: '', times: ['9PM'],
    qph: 'e.g. 2505', help: 'Type 4 digits to find every time they came out (2505 or 2-5-0-5). Type 1 to 3 digits to find draws that contain them.', qerr: 'Enter 1 to 4 digits, like 2505.',
    placeholder: 'Paste results here, one draw per line, like 2026-11-06 2-5-0-5 or November 6, 2026 2505.',
    daysHint: 'Each row is one draw (4 digits, in order). Tap a ball to highlight that digit across this month. Press Esc to go back.',
  },
  lotto6d: {
    name: '6D Lotto', sub: 'PCSO 6D Lotto results, January 2021 to today (Tue, Thu, Sat 9PM). Pick a year, then a month, then a day.',
    START: 2021, store: 'lotto6d.draws', seed: SEED6, parse: parse6D, digit: true,
    size: (v) => v.filter(Boolean).length, nums: flat6, digits: 6, slotted: true, group: 6, joiner: '', times: ['9PM'],
    qph: 'e.g. 626764', help: 'Type 6 digits to find every time they came out (626764 or 6-2-6-7-6-4). Type 1 to 5 digits to find draws that contain them in a row. Choose Any order to ignore the order.', qerr: 'Enter 1 to 6 digits, like 626764.',
    placeholder: 'Paste results here, one draw per line, like 2026-11-10 5-8-9-9-6-4 or November 10, 2026 589964.',
    daysHint: 'Each row is one draw (6 digits, in order). Tap a ball to highlight that digit across this month. Press Esc to go back.',
  },
  ez2: {
    name: '2D Lotto', sub: 'PCSO 2D Lotto (EZ2) results, January 2025 to today, 2PM, 5PM and 9PM. Pick a year, then a month, then a day.',
    START: 2025, store: 'lotto2d.draws', seed: SEED2, parse: parse2D, digit: false, max: 31,
    size: (v) => v.filter(Boolean).length, nums: flat2, digits: 2, slotted: true, group: 2, joiner: '-', qmax: 2, times: ['2PM', '5PM', '9PM'],
    qph: 'e.g. 13 26', help: 'Type 2 numbers (1 to 31) like 13 26 or 13-26 to find every time that pair came out. Choose Exact order or Any order (Rambolito). Type 1 number to find draws that contain it.', qerr: 'Enter 1 or 2 numbers from 1 to 31, like 13 26.',
    placeholder: 'Paste results here, one day per line: 2026-11-07 05-07 18-29 02-16 (2PM 5PM 9PM, use --- for a missing draw). A line like 2026-11-07 5PM 18-29 adds a single draw.',
    daysHint: 'Each row is one day: 2PM, 5PM, 9PM from left to right, two numbers each in the order drawn. Tap a ball to highlight that number across this month. Press Esc to go back.',
  },
};
let gameId = 'lotto';
try { gameId = GAMES[localStorage.getItem('lotto.game')] ? localStorage.getItem('lotto.game') : 'lotto'; } catch { /* storage unavailable */ }
const G = () => GAMES[gameId];
const START = () => G().START;
// Last year shown in the year view. Most games run to the current year; a game with `end` stops there unless newer draws were added.
const END = () => (G().end === undefined ? NOW : Math.max(G().end, ...allDraws().map(([d]) => +d.slice(0, 4))));
const cnt = (list) => list.reduce((a, [, v]) => a + G().size(v), 0);
const NOW = new Date().getFullYear();
const pad = (n) => String(n).padStart(2, '0');
const $ = (id) => document.getElementById(id);
const state = { y: null, m: null };
const VIEW_KEY = 'lotto642.view';

const load = () => { try { return JSON.parse(localStorage.getItem(G().store)) || {}; } catch { return {}; } };
let user = load();
const save = () => { try { localStorage.setItem(G().store, JSON.stringify(user)); } catch { /* storage unavailable */ } };
const merged = () => ({ ...G().seed, ...user });
const allDraws = () => Object.entries(merged()).sort((a, b) => b[0].localeCompare(a[0]));

const ball = (n) => (n === null ? '<span class="ball gap">–</span>' : `<span class="ball${G().digit ? ' dg' : ''}">${G().digit ? n : pad(n)}</span>`);
const blank = () => Array(G().digits || 3).fill(null);
const rowBalls = (v) => (G().slotted
  ? v.map((slot, i) => `<span class="slot"><em>${G().times[i]}</em>${(slot || blank()).map(ball).join('')}</span>`).join('')
  : v.map(ball).join(''));
const plural = (n) => `${n} draw${n === 1 ? '' : 's'}`;

function heatDigits(list) {
  const f = Array(10).fill(0);
  list.forEach(([, v]) => v.forEach((slot) => slot && slot.forEach((n) => f[n]++)));
  const max = Math.max(1, ...f);
  const hot = [...Array(10).keys()].filter((n) => f[n] > 0).sort((a, b) => f[b] - f[a] || a - b).slice(0, 4);
  const cells = f.map((c, n) => `<div class="cell" style="--h:${(c / max).toFixed(2)}" title="${n}: drawn ${c}x"><b>${n}</b><span>${c}</span></div>`).join('');
  return `<section class="panel">
    <h2>How often each digit came out</h2>
    ${hot.length ? `<p class="hint">Most drawn: ${hot.map(ball).join('')}</p>` : ''}
    <div class="heat digits">${cells}</div>
  </section>`;
}

function heat(list) {
  if (G().digit) return heatDigits(list);
  const N = G().max;
  const f = Array(N + 1).fill(0);
  list.forEach(([, v]) => (G().slotted ? G().nums(v) : v).forEach((n) => { if (n !== null) f[n]++; }));
  const max = Math.max(1, ...f.slice(1));
  const hot = [...Array(N).keys()].map((i) => i + 1).filter((n) => f[n] > 0).sort((a, b) => f[b] - f[a] || a - b).slice(0, 6);
  const cells = Array.from({ length: N }, (_, i) => {
    const n = i + 1;
    return `<div class="cell" style="--h:${(f[n] / max).toFixed(2)}" title="${pad(n)}: drawn ${f[n]}x"><b>${pad(n)}</b><span>${f[n]}</span></div>`;
  }).join('');
  return `<section class="panel">
    <h2>How often each number came out</h2>
    ${list.length ? `<p class="hint">Most drawn: ${hot.map(ball).join('')}</p>` : ''}
    <div class="heat">${cells}</div>
  </section>`;
}

const stage = createStage($('stage'), { onPick });
let view = 'list';
if (stage) { try { view = localStorage.getItem(VIEW_KEY) || '3d'; } catch { view = '3d'; } }
else { $('v3d').disabled = true; $('v3d').title = 'WebGL is not available in this browser'; }

function onPick(p) {
  if (p.y) { state.y = p.y; state.m = null; }
  else if (p.m) state.m = p.m;
  render();
}

const HINTS = {
  years: 'Tap a tower to open that year. Taller means more draws. Drag to rotate, scroll or pinch to zoom.',
  months: 'Tap a month tower. Taller and darker means more draws that month.',
  days: 'Each row is one draw. Tap any ball to highlight the same number across this month. Press Esc to go back.',
};

function listBody(scope) {
  if (!state.y) {
    return `<div class="grid">${Array.from({ length: END() - START() + 1 }, (_, i) => {
      const y = START() + i;
      const c = cnt(allDraws().filter(([d]) => d.startsWith(`${y}-`)));
      return `<button class="tile ${c ? '' : 'empty'}" data-y="${y}"><strong>${y}</strong><span>${c ? plural(c) : 'No draws yet'}</span></button>`;
    }).join('')}</div>`;
  }
  if (!state.m) {
    return `<div class="grid">${MONTHS.map((name, i) => {
      const c = cnt(allDraws().filter(([d]) => d.startsWith(`${state.y}-${pad(i + 1)}-`)));
      return `<button class="tile ${c ? '' : 'empty'}" data-m="${i + 1}"><strong>${name}</strong><span>${c ? plural(c) : 'No draws yet'}</span></button>`;
    }).join('')}</div>`;
  }
  return scope.length
    ? `<ul class="days">${scope.map(([d, nums]) => {
        const [yy, mm, dd] = d.split('-').map(Number);
        return `<li><div class="date"><strong>${dd}</strong><span>${WEEK[new Date(yy, mm - 1, dd).getDay()]}</span></div><div class="balls">${rowBalls(nums)}</div></li>`;
      }).join('')}</ul>`
    : '';
}

function stageData(all, scope) {
  if (!state.y) {
    return { level: 'years', items: Array.from({ length: END() - START() + 1 }, (_, i) => {
      const y = START() + i;
      const c = cnt(all.filter(([d]) => d.startsWith(`${y}-`)));
      return { title: String(y), sub: c ? plural(c) : 'No draws', count: c, pick: { y } };
    }) };
  }
  if (!state.m) {
    return { level: 'months', items: MONTHS.map((name, i) => {
      const c = cnt(all.filter(([d]) => d.startsWith(`${state.y}-${pad(i + 1)}-`)));
      return { title: name, sub: c ? plural(c) : 'No draws', count: c, pick: { m: i + 1 } };
    }) };
  }
  return { level: 'days', items: [...scope].reverse().map(([d, nums]) => {
    const [yy, mm, dd] = d.split('-').map(Number);
    return { day: dd, dow: DOW[new Date(yy, mm - 1, dd).getDay()], nums: G().nums(nums), digit: G().digit, group: G().slotted ? G().group : undefined };
  }) };
}
function render() {
  const all = allDraws();
  const prefix = state.y ? (state.m ? `${state.y}-${pad(state.m)}-` : `${state.y}-`) : '';
  const scope = all.filter(([d]) => d.startsWith(prefix));
  const use3d = view === '3d' && stage;

  const crumbs = ['<button class="crumb" data-go="root">All years</button>'];
  if (state.y) crumbs.push(state.m ? `<button class="crumb" data-go="year">${state.y}</button>` : `<span class="crumb on">${state.y}</span>`);
  if (state.m) crumbs.push(`<span class="crumb on">${MONTHS[state.m - 1]}</span>`);
  $('crumbs').innerHTML = crumbs.join('<i>/</i>');
  $('count').textContent = `${plural(cnt(scope))} ${state.y ? 'in this view' : 'saved in total'}`;
  $('v3d').setAttribute('aria-pressed', String(!!use3d));
  $('vlist').setAttribute('aria-pressed', String(!use3d));

  const emptyMonth = state.m && !scope.length
    ? `<p class="none">No draws saved for ${MONTHS[state.m - 1]} ${state.y}. Open "Add or export results" below to add them.</p>`
    : '';
  const list = $('list');
  list.innerHTML = use3d ? emptyMonth : listBody(scope) || emptyMonth;
  list.hidden = !list.innerHTML;
  $('stage-wrap').hidden = !use3d;

  if (use3d) {
    const data = stageData(all, scope);
    $('stage').dataset.level = data.level;
    $('hint').textContent = data.level === 'days' ? G().daysHint : HINTS[data.level];
    stage.show(data);
  }
  $('heat').innerHTML = heat(scope);
}

function up() {
  if (state.m) state.m = null;
  else if (state.y) state.y = null;
  else return;
  render();
}

const GAME_BTNS = { lotto: 'g642', lotto55: 'g655', lotto58: 'g658', swertres: 'g3d', lotto4d: 'g4d', lotto6d: 'g6d', ez2: 'g2d' };
function applyGame() {
  const g = G();
  document.title = `${g.name} Tracker 3D`;
  $('title').firstChild.textContent = `${g.name} Tracker `;
  $('sub').textContent = g.sub;
  $('paste').placeholder = g.placeholder;
  for (const [id, btn] of Object.entries(GAME_BTNS)) $(btn).setAttribute('aria-pressed', String(gameId === id));
  $('straight').hidden = gameId !== 'lotto6d';
  $('xresult').innerHTML = '';
  const sixNum = !g.slotted && !g.digit;
  $('smode').hidden = !g.slotted && !sixNum;
  for (const o of $('smode').querySelectorAll('option[value=last],option[value=first]')) { o.hidden = gameId !== 'lotto6d'; o.disabled = gameId !== 'lotto6d'; }
  for (const o of $('smode').querySelectorAll('option[value=seq],option[value=row]')) { o.hidden = !sixNum; o.disabled = !sixNum; }
  for (const o of $('smode').querySelectorAll('option[value=exact]')) { o.hidden = sixNum; o.disabled = sixNum; }
  $('smode').querySelector('option[value=any]').textContent = sixNum ? 'Any order, any place' : 'Any order (Rambolito)';
  $('smode').value = sixNum ? 'any' : 'exact';
  $('shared').hidden = !sixNum;
  $('target').hidden = !sixNum;
  $('combo').hidden = !sixNum;
  $('cresult').innerHTML = '';
  $('tresult').innerHTML = '';
  $('pairs').hidden = !sixNum;
  $('presult').innerHTML = '';
  $('shresult').innerHTML = '';
  $('fpart').hidden = gameId !== 'lotto6d';
  $('fpart').value = '0';
  $('stime').hidden = !g.slotted || g.times.length < 2;
  $('stime').value = 'all';
  $('sq').placeholder = g.slotted ? g.qph : 'e.g. 7 12 23';
  $('shelp').textContent = g.slotted
    ? g.help
    : `Type 1 to 6 numbers (1 to ${g.max}) separated by spaces, like 7 12 23. Any order finds every draw that has all of them. In sequence finds draws where they come out in the order you typed, with other numbers allowed between. In a row needs them side by side in that order. Draws are read in the order the balls were drawn.`;
}
function setGame(id) {
  if (id === gameId) return;
  gameId = id;
  try { localStorage.setItem('lotto.game', id); } catch { /* storage unavailable */ }
  user = load();
  state.y = null;
  state.m = null;
  say('');
  clearSearch();
  applyGame();
  setupFinder();
  render();
}
for (const [id, btn] of Object.entries(GAME_BTNS)) $(btn).addEventListener('click', () => setGame(id));

function setView(v) {
  view = v;
  try { localStorage.setItem(VIEW_KEY, v); } catch { /* storage unavailable */ }
  render();
}
$('v3d').addEventListener('click', () => stage && setView('3d'));
$('vlist').addEventListener('click', () => setView('list'));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !e.target.closest('textarea, input')) up();
});

function nav(e) {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.y) { state.y = +t.dataset.y; state.m = null; }
  else if (t.dataset.m) state.m = +t.dataset.m;
  else if (t.dataset.go === 'root') { state.y = null; state.m = null; }
  else if (t.dataset.go === 'year') state.m = null;
  else return;
  render();
}
$('crumbs').addEventListener('click', nav);
$('list').addEventListener('click', nav);

const say = (s) => { $('msg').textContent = s; };

function addText(text) {
  let found;
  if (text.trim().startsWith('{')) {
    try {
      const obj = JSON.parse(text);
      const lines = Object.entries(obj).map(([d, n]) => (G().slotted ? `${d} ${n.map((s) => (s ? s.join(G().joiner) : '---')).join(' ')}` : `${d},${n.join(',')}`));
      found = G().parse(lines.join('\n'));
    } catch { say('That JSON could not be read.'); return; }
  } else found = G().parse(text);
  const n = Object.keys(found.draws).length;
  const draws = found.draws;
  if (!n) { say(`No draws found. ${found.skipped} line(s) skipped. Each line needs a date and ${G().slotted ? (G().digit ? `draws of ${G().digits} digits` : 'draws of 2 numbers from 1 to 31') : `6 numbers from 1 to ${G().max}`}.`); return; }
  Object.assign(user, found.draws);
  save();
  say(`Added ${n} day${n === 1 ? '' : 's'}.${found.skipped ? ` Skipped ${found.skipped} line(s).` : ''}`);
  render();
}

$('add').addEventListener('click', () => { addText($('paste').value); $('paste').value = ''; });
$('file').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (f) addText(await f.text());
  e.target.value = '';
});
$('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(merged(), null, 2)], { type: 'application/json' }));
  a.download = { lotto: 'lotto-642-results.json', lotto55: 'lotto-655-results.json', lotto58: 'lotto-658-results.json', swertres: 'swertres-results.json', lotto4d: '4d-results.json', lotto6d: '6d-results.json', ez2: '2d-results.json' }[gameId];
  a.click();
  URL.revokeObjectURL(a.href);
});
$('clear').addEventListener('click', () => {
  if (!confirm('Remove all draws you added in this browser? Built-in draws stay.')) return;
  user = {};
  save();
  say('Added draws removed.');
  render();
});

// ---- Search a number ----
const SEARCH_LIMIT = 100;
const sstate = { q: null, mode: 'exact', time: 'all', month: 0, all: false };
const fmtLong = (d) => {
  const [y, m, dd] = d.split('-').map(Number);
  return `${MONTHS[m - 1].slice(0, 3)} ${dd}, ${y}`;
};
const hitBalls = (r) => (G().slotted
  ? r.v.map((slot, i) => `<span class="slot ${r.hits.includes(i) ? 'hit' : 'dim'}"><em>${G().times[i]}</em>${(slot || blank()).map(ball).join('')}</span>`).join('')
  : r.v.map((n) => ball(n).replace('class="ball', `class="ball ${r.hits.includes(n) ? 'hit' : 'dim'}`)).join(''));

function clearSearch() {
  sstate.q = null;
  $('sq').value = '';
  $('smonth').value = '0';
  $('sresult').innerHTML = '';
}

// Year x month table for the searched number, plus a plain sentence for the chosen month.
function monthPanel(grid, label) {
  if (!grid.years.length) return '';
  const m = sstate.month;
  let line = '';
  if (m) {
    const { withData, hit, always } = monthSummary(grid, m);
    const per = grid.years.map((y) => {
      const c = grid.cells[y][m];
      if (!c.data) return `<li class="mrow nodata"><strong>${MONTHS[m - 1]} ${y}</strong><span>no results saved</span></li>`;
      const days = c.dates.slice().reverse().map((d) => `${MONTHS[m - 1].slice(0, 3)} ${+d.slice(8)}`).join(', ');
      return c.count
        ? `<li class="mrow yes"><strong>${MONTHS[m - 1]} ${y}</strong><span>✔ drawn ×${c.count} (${days})</span></li>`
        : `<li class="mrow no"><strong>${MONTHS[m - 1]} ${y}</strong><span>✘ not drawn</span></li>`;
    }).join('');
    line = `<p class="sum"><strong>${label}</strong> came out in ${MONTHS[m - 1]} in <strong>${hit.length} of ${withData.length}</strong> year${withData.length === 1 ? '' : 's'}${always ? ', so every year' : ''}${hit.length ? ` (${hit.join(', ')})` : ''}.</p><ul class="mlist">${per}</ul>`;
  }
  const head = MONTHS.map((n) => `<th scope="col">${n.slice(0, 3)}</th>`).join('');
  const body = grid.years.map((y) => `<tr><th scope="row">${y}</th>${MONTHS.map((n, i) => {
    const c = grid.cells[y][i + 1];
    const cls = !c.data ? 'nd' : c.count ? 'y' : 'n';
    const txt = !c.data ? '·' : c.count ? `✔${c.count > 1 ? ` ×${c.count}` : ''}` : '–';
    const tip = !c.data ? 'no results saved' : c.count ? `${n} ${y}: drawn ${c.count}x` : `${n} ${y}: not drawn`;
    return `<td class="${cls}${m === i + 1 ? ' sel' : ''}" title="${tip}">${txt}</td>`;
  }).join('')}</tr>`).join('');
  return `${line}<div class="mgrid-wrap"><table class="mgrid"><caption>Which months <strong>${label}</strong> came out (✔ drawn, – not drawn, · no results saved)</caption><thead><tr><th></th>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderSearch() {
  const g = G();
  const q = sstate.q;
  const entries = allDraws();
  const timeIdx = sstate.time === 'all' || g.times?.length < 2 ? null : g.times.indexOf(sstate.time);
  const foundAll = findMatches(entries, q, { digit: g.slotted, mode: sstate.mode, timeIdx });
  const found = inMonth(foundAll, sstate.month);
  const grid = monthGrid(entries, foundAll, { digit: g.slotted });
  const mName = sstate.month ? MONTHS[sstate.month - 1] : '';
  const label = g.slotted ? (g.digit ? q.join('') : q.map(pad).join('-')) : q.map(pad).join(' ');
  const how = g.slotted
    ? `${sstate.mode === 'any' ? 'any order' : sstate.mode === 'last' && q.length < g.digits ? 'last digits' : sstate.mode === 'first' && q.length < g.digits ? 'first digits' : q.length === g.digits ? 'exact order' : 'in sequence'}${timeIdx === null ? '' : `, ${sstate.time} only`}`
    : sstate.mode === 'seq' ? 'in sequence, same order as typed' : sstate.mode === 'row' ? 'in a row, same order as typed' : 'all in the same draw, any order';
  const howM = sstate.month ? `${how}, ${mName} only` : how;
  const total = g.slotted ? found.reduce((a, r) => a + r.hits.length, 0) : found.length;
  const span = entries.length ? `${fmtLong(entries[entries.length - 1][0])} to ${fmtLong(entries[0][0])}` : 'no saved results';
  const searched = g.slotted ? `${entries.length.toLocaleString()} days` : `${entries.length.toLocaleString()} draws`;

  if (!total) {
    $('sresult').innerHTML = `<p class="none"><strong>${label}</strong> (${howM}) has not come out in the saved results (${span}, ${searched}).</p>${monthPanel(grid, label)}`;
    return;
  }
  const byYear = {};
  found.forEach((r) => { const y = r.d.slice(0, 4); byYear[y] = (byYear[y] || 0) + (g.slotted ? r.hits.length : 1); });
  const years = Object.keys(byYear).sort().map((y) => `${y} ×${byYear[y]}`).join(' · ');
  const slots = g.slotted && g.times.length > 1
    ? g.times.map((t, i) => `${t} ×${found.filter((r) => r.hits.includes(i)).length}`).join(' · ')
    : '';
  const last = found[0].d;
  const [ly, lm, ld] = last.split('-').map(Number);
  const now = new Date();
  const ago = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(ly, lm - 1, ld)) / 86400000);
  const shown = sstate.all ? found : found.slice(0, SEARCH_LIMIT);
  const rows = shown.map((r) => {
    const [yy, mm, dd] = r.d.split('-').map(Number);
    return `<li><button type="button" class="date jump" data-jump="${yy}-${mm}" title="Open ${MONTHS[mm - 1]} ${yy}"><strong>${dd}</strong><span>${WEEK[new Date(yy, mm - 1, dd).getDay()].slice(0, 3)} · ${MONTHS[mm - 1].slice(0, 3)} ${yy}</span></button><div class="balls">${hitBalls(r)}</div></li>`;
  }).join('');
  $('sresult').innerHTML = `<p class="sum"><strong>${label}</strong> (${howM}) came out <strong>${total} time${total === 1 ? '' : 's'}</strong> in ${searched} of saved results (${span}).</p>
    <p class="smeta">${slots ? `${slots}<br>` : ''}By year: ${years}<br>Last drawn: ${fmtLong(last)}${ago > 0 ? `, ${ago} day${ago === 1 ? '' : 's'} ago` : ', today'}.</p>
    ${monthPanel(grid, label)}
    <ul class="days sres">${rows}</ul>
    ${!sstate.all && found.length > SEARCH_LIMIT ? `<div class="row"><button type="button" id="smore">Show all ${found.length} results</button></div>` : ''}`;
}

function runSearch() {
  const q = parseQuery($('sq').value, G().digit ? G().digits : false, G().max, G().qmax || 6);
  if (!q) {
    sstate.q = null;
    $('sresult').innerHTML = `<p class="none">${G().slotted ? G().qerr : `Enter 1 to 6 different numbers from 1 to ${G().max}, separated by spaces.`}</p>`;
    return;
  }
  sstate.q = q;
  sstate.mode = $('smode').value;
  sstate.time = $('stime').value;
  sstate.month = +$('smonth').value;
  sstate.all = false;
  renderSearch();
}

$('sform').addEventListener('submit', (e) => { e.preventDefault(); runSearch(); });
$('sclear').addEventListener('click', clearSearch);
$('smode').addEventListener('change', () => { if ($('sq').value.trim()) runSearch(); });
$('stime').addEventListener('change', () => { if ($('sq').value.trim()) runSearch(); });
$('smonth').addEventListener('change', () => { if ($('sq').value.trim()) runSearch(); });
$('sresult').addEventListener('click', (e) => {
  if (e.target.closest('#smore')) { sstate.all = true; renderSearch(); return; }
  const j = e.target.closest('[data-jump]');
  if (!j) return;
  const [y, m] = j.dataset.jump.split('-').map(Number);
  state.y = y;
  state.m = m;
  render();
  document.querySelector('.bar').scrollIntoView();
});

// ---- Find numbers by month ----
function setupFinder() {
  const ys = allDraws().map(([d]) => +d.slice(0, 4));
  const lo = ys.length ? Math.min(...ys) : START();
  const hi = ys.length ? Math.max(...ys) : NOW;
  const opts = Array.from({ length: hi - lo + 1 }, (_, i) => `<option value="${lo + i}">${lo + i}</option>`).join('');
  const f = +$('ffrom').value;
  const t = +$('fto').value;
  $('ffrom').innerHTML = opts;
  $('fto').innerHTML = opts;
  $('ffrom').value = f >= lo && f <= hi ? f : lo;
  $('fto').value = t >= lo && t <= hi ? t : Math.min(hi, lo + 1);
  $('fresult').innerHTML = '';
  setupStraight(lo, hi);
  const sf = +$('shfrom').value;
  const st = +$('shto').value;
  $('shfrom').innerHTML = opts;
  $('shto').innerHTML = opts;
  $('shfrom').value = sf >= lo && sf <= hi ? sf : lo;
  $('shto').value = st >= lo && st <= hi ? st : hi;
  $('shresult').innerHTML = '';
  setupTarget(lo, hi);
  setupCombo(lo, hi);
}
const chipKey = (k) => (G().slotted ? String(k).split(G().joiner).map((n) => ball(+n)).join('') : ball(+k));
const timesTxt = (counts, years) => years.map((y) => `${y} ×${counts[y] || 0}`).join(' · ');

function runFinder() {
  const month = +$('fmonth').value;
  const from = +$('ffrom').value;
  const to = +$('fto').value;
  const pv = gameId === 'lotto6d' ? $('fpart').value : '0';
  const part = pv === '0' ? null : { mode: pv.slice(0, -1), n: +pv.slice(-1) };
  if (part) { runGroups(month, from, to, part); return; }
  const r = commonInMonth(allDraws(), { digit: G().slotted, month, from, to, join: G().joiner, part });
  const mn = month ? MONTHS[month - 1] : 'any month';
  const range = `${Math.min(from, to)} to ${Math.max(from, to)}`;
  const kind = part ? `${part.mode === 'last' ? 'endings' : 'beginnings'} (${part.mode} ${part.n} digits)` : G().slotted ? 'results' : 'numbers';
  if (!r.years.length) {
    $('fresult').innerHTML = `<p class="none">No ${mn} results are saved for ${range}.</p>`;
    return;
  }
  const chip = (i) => `<button type="button" class="fchip" data-find="${i.key}" title="${timesTxt(i.counts, r.years)}. Click to see these draws."><span class="fb">${chipKey(i.key)}</span><small>${r.years.length > 1 ? timesTxt(i.counts, r.years) : `×${i.total}`}</small></button>`;
  const note = r.missing.length ? `<p class="smeta">No ${mn} results saved for ${r.missing.join(', ')}, so ${r.missing.length === 1 ? 'that year was' : 'those years were'} not counted.</p>` : '';
  const yrs = r.years.join(', ');
  const head = r.years.length === 1
    ? `${r.all.length} ${kind} came out in ${mn} ${yrs}.`
    : r.all.length
      ? `<strong>${r.all.length} ${kind}</strong> came out in ${mn} of every year (${yrs}).`
      : `No ${part ? `${part.mode} ${part.n} digits` : G().slotted ? 'result' : 'number'} came out in ${mn} of every year (${yrs}).`;
  $('fresult').innerHTML = `<p class="sum">${head}</p>${note}
    ${r.all.length ? `<div class="fchips">${r.all.map(chip).join('')}</div>` : ''}
    ${!G().slotted && !G().digit && r.all.length ? `<div class="row"><button type="button" data-target="${r.all.map((i) => i.key).join(' ')}" data-tmonth="${month}">Use these ${r.all.length} numbers as my target list</button></div>` : ''}
    ${r.years.length > 1 && r.some.length ? `<details class="fsome"><summary>Came out in only some of those years (${r.some.length})</summary><div class="fchips">${r.some.slice(0, 200).map(chip).join('')}</div></details>` : ''}`;
}
const GROUP_LIMIT = 60;
function runGroups(month, from, to, part) {
  const mn = month ? MONTHS[month - 1] : 'saved';
  const k = part.n;
  const r = straightGroups(allDraws(), { month, from, to, k, mode: part.mode });
  const range = `${Math.min(from, to)} to ${Math.max(from, to)}`;
  if (!r.years.length) { $('fresult').innerHTML = `<p class="none">No ${mn} results are saved for ${range}.</p>`; return; }
  const where = { first: `the first ${k} digits`, last: `the last ${k} digits`, any: `any ${k} digits in a row` }[part.mode];
  const every = r.years.length > 1 ? r.groups.filter((g) => g.hits === r.years.length) : [];
  const yrs = r.years.join(', ');
  const note = r.missing.length ? `<p class="smeta">No ${mn} results saved for ${r.missing.join(', ')}, so ${r.missing.length === 1 ? 'that year was' : 'those years were'} not counted.</p>` : '';
  const head = r.groups.length
    ? `<strong>${r.groups.length}</strong> group${r.groups.length === 1 ? '' : 's'} of ${mn} draws share the same straight ${k} digits (${where}, ${yrs}).${r.years.length > 1 ? ` ${every.length ? `<strong>${every.length}</strong> appear in every year.` : 'None appears in every year.'}` : ''}`
    : `No two ${mn} draws share the same straight ${k} digits (${where}, ${yrs}).`;
  const card = (g) => {
    const pos = Array.from({ length: k }, (_, i) => g.start + i);
    const mask = Array.from({ length: 6 }, (_, i) => (pos.includes(i) ? ball(g.digits[i - g.start]) : ball(null))).join('');
    const rows = g.draws.map((x) => {
      const [yy, mm, dd] = x.d.split('-').map(Number);
      const balls = x.v.map((n, i) => ball(n).replace('class="ball', `class="ball ${pos.includes(i) ? 'hit' : 'dim'}`)).join('');
      return `<li><button type="button" class="date jump" data-jump="${yy}-${mm}" title="Open ${MONTHS[mm - 1]} ${yy}"><strong>${dd}</strong><span>${WEEK[new Date(yy, mm - 1, dd).getDay()].slice(0, 3)} · ${MONTHS[mm - 1].slice(0, 3)} ${yy}</span></button><div class="balls">${balls}</div></li>`;
    }).join('');
    return `<div class="grp"><div class="grph"><span class="balls">${mask}</span><small>${g.draws.length} draws · ${g.years.join(', ')}</small></div><ul class="days sres">${rows}</ul></div>`;
  };
  const shown = r.groups.slice(0, GROUP_LIMIT);
  $('fresult').innerHTML = `<p class="sum">${head}</p>${note}${shown.map(card).join('')}${r.groups.length > GROUP_LIMIT ? `<p class="smeta">Showing the first ${GROUP_LIMIT} of ${r.groups.length} groups (most years first).</p>` : ''}`;
}
$('fresult').addEventListener('click', (e) => {
  const j = e.target.closest('[data-jump]');
  if (!j) return;
  const [y, m] = j.dataset.jump.split('-').map(Number);
  state.y = y;
  state.m = m;
  render();
  document.querySelector('.bar').scrollIntoView();
});
$('fpart').addEventListener('change', () => { if ($('fresult').innerHTML) runFinder(); });
$('fform').addEventListener('submit', (e) => { e.preventDefault(); runFinder(); });
$('fresult').addEventListener('click', (e) => {
  const t = e.target.closest('[data-target]');
  if (!t) return;
  $('tq').value = t.dataset.target;
  $('tmonth').value = t.dataset.tmonth || '0';
  runTarget();
  $('target').scrollIntoView();
});
$('fresult').addEventListener('click', (e) => {
  const b = e.target.closest('[data-find]');
  if (!b) return;
  $('sq').value = b.dataset.find;
  $('smonth').value = $('fmonth').value;
  const pv = gameId === 'lotto6d' ? $('fpart').value : '0';
  $('smode').value = !G().slotted && !G().digit ? 'any' : pv === '0' ? 'exact' : pv.slice(0, -1);
  $('stime').value = 'all';
  runSearch();
  $('search').scrollIntoView();
});

// ---- Lotto: draws that share 3 or 4 numbers ----
function runShared() {
  const month = +$('shmonth').value;
  const from = +$('shfrom').value;
  const to = +$('shto').value;
  const kv = $('shk').value;
  const minK = +kv[0];
  const exact = !kv.endsWith('+');
  const r = sharedGroups(allDraws(), { month, from, to, minK, exact });
  const mn = month ? MONTHS[month - 1] : 'saved';
  const range = `${Math.min(from, to)} to ${Math.max(from, to)}`;
  if (!r.years.length) { $('shresult').innerHTML = `<p class="none">No ${mn} results are saved for ${range}.</p>`; return; }
  const what = exact ? `exactly ${minK}` : `${minK} or more`;
  const yrs = r.years.join(', ');
  const note = r.missing.length ? `<p class="smeta">No ${mn} results saved for ${r.missing.join(', ')}, so ${r.missing.length === 1 ? 'that year was' : 'those years were'} not counted.</p>` : '';
  const every = r.years.length > 1 ? r.groups.filter((g) => g.hits === r.years.length) : [];
  const head = r.groups.length
    ? `<strong>${r.groups.length}</strong> group${r.groups.length === 1 ? '' : 's'} of ${mn} draws share ${what} numbers (${yrs}, ${r.checked} draws checked).${r.years.length > 1 ? ` ${every.length ? `<strong>${every.length}</strong> appear in every year.` : 'None appears in every year.'}` : ''}`
    : `No two ${mn} draws share ${what} numbers (${yrs}, ${r.checked} draws checked).`;
  const card = (g) => {
    const rows = g.draws.map((x) => {
      const [yy, mm, dd] = x.d.split('-').map(Number);
      const balls = x.v.map((n) => ball(n).replace('class="ball', `class="ball ${g.nums.includes(n) ? 'hit' : 'dim'}`)).join('');
      return `<li><button type="button" class="date jump" data-jump="${yy}-${mm}" title="Open ${MONTHS[mm - 1]} ${yy}"><strong>${dd}</strong><span>${WEEK[new Date(yy, mm - 1, dd).getDay()].slice(0, 3)} · ${MONTHS[mm - 1].slice(0, 3)} ${yy}</span></button><div class="balls">${balls}</div></li>`;
    }).join('');
    return `<div class="grp"><div class="grph"><span class="balls">${g.nums.map((n) => ball(n)).join('')}</span><small>${g.nums.length} shared · ${g.draws.length} draws · ${g.years.join(', ')}</small></div><ul class="days sres">${rows}</ul></div>`;
  };
  const shown = r.groups.slice(0, GROUP_LIMIT);
  $('shresult').innerHTML = `<p class="sum">${head}</p>${note}${shown.map(card).join('')}${r.groups.length > GROUP_LIMIT ? `<p class="smeta">Showing the first ${GROUP_LIMIT} of ${r.groups.length} groups (most shared numbers first).</p>` : ''}`;
}
$('shform').addEventListener('submit', (e) => { e.preventDefault(); runShared(); });
for (const id of ['shmonth', 'shfrom', 'shto', 'shk']) $(id).addEventListener('change', () => { if ($('shresult').innerHTML) runShared(); });
$('shresult').addEventListener('click', (e) => {
  const j = e.target.closest('[data-jump]');
  if (!j) return;
  const [y, m] = j.dataset.jump.split('-').map(Number);
  state.y = y;
  state.m = m;
  render();
  document.querySelector('.bar').scrollIntoView();
});

// ---- Lotto: pair predictor ----
function runPairs() {
  const g = G();
  const q = parseQuery($('pq').value, false, g.max, 6);
  if (!q) {
    $('presult').innerHTML = `<p class="none">Enter 1 to 6 different numbers from 1 to ${g.max}, like ${g.max >= 48 ? '16 48 40' : '16 30 40'}.${g.max < 48 ? ' 6/42 only goes up to 42; numbers like 48 are on 6/55 and 6/58.' : ''}</p>`;
    return;
  }
  const r = pairPredict(allDraws(), q, g.max);
  const lab = (a) => a.map(pad).join(' ');
  const chips = (list, n) => list.slice(0, n);
  const togetherTxt = q.length > 1
    ? `<p class="smeta">Your numbers together: ${q.length > 2 ? `all ${q.length} in the same draw ×${r.together.all} · ` : ''}${r.together.pairs.map((p) => `${pad(p.a)}+${pad(p.b)} ×${p.count}`).join(' · ')}.</p>`
    : '';
  const own = `<p class="smeta">How often each came out: ${q.map((e) => `${pad(e)} ×${r.counts[e]}`).join(' · ')} (of ${r.total.toLocaleString()} draws).</p>`;
  if (!r.topPairs.length) { $('presult').innerHTML = `<p class="none">None of ${lab(q)} came out in the saved results.</p>`; return; }
  const pairChip = (p) => `<button type="button" class="fchip" data-pfind="${p.a} ${p.b}" title="Click to see the draws where ${pad(p.a)} and ${pad(p.b)} came out together"><span class="fb">${ball(p.a)}${ball(p.b)}</span><small>together ×${p.count}</small></button>`;
  const partnerChip = (p) => `<button type="button" class="fchip" data-pfind="${[...q, p.n].join(' ')}" title="Click to see the draws that have your numbers and ${pad(p.n)}"><span class="fb">${ball(p.n)}</span><small>${q.length > 1 ? q.map((e) => `${pad(e)} ×${p.by[e]}`).join(' · ') : `×${p.total}`}</small></button>`;
  const best = r.partners[0];
  $('presult').innerHTML = `<p class="sum">Best pair for <strong>${lab(q)}</strong>: <strong>${pad(r.topPairs[0].a)} + ${pad(r.topPairs[0].b)}</strong> came out together ${r.topPairs[0].count} times${q.length > 1 ? `. Best partner overall: <strong>${pad(best.n)}</strong> (came out with your numbers ${best.total} times in total)` : ''}.</p>
    ${own}${togetherTxt}
    <p class="slabel">Top pairs</p>
    <div class="fchips">${chips(r.topPairs, 8).map(pairChip).join('')}</div>
    ${q.length > 1 ? `<p class="slabel">Best partners for all of your numbers</p><div class="fchips">${chips(r.partners, 8).map(partnerChip).join('')}</div>` : ''}
    <p class="smeta">Click a chip to open the normal search for it. Counts come from the saved draws only.</p>`;
}
$('pform').addEventListener('submit', (e) => { e.preventDefault(); runPairs(); });
$('presult').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pfind]');
  if (!b) return;
  $('sq').value = b.dataset.pfind;
  $('smode').value = 'any';
  $('smonth').value = '0';
  $('stime').value = 'all';
  runSearch();
  $('search').scrollIntoView();
});

// ---- 6D straight match ----
function setupStraight(lo, hi) {
  const cur = $('xyear').value;
  $('xyear').innerHTML = '<option value="0">All years</option>' + Array.from({ length: hi - lo + 1 }, (_, i) => `<option value="${hi - i}">${hi - i}</option>`).join('');
  $('xyear').value = [...$('xyear').options].some((o) => o.value === cur) ? cur : '0';
  $('xresult').innerHTML = '';
}
const TIER_NAME = { 6: 'Jackpot, 6 straight', 5: '5 straight', 4: '4 straight', 3: '3 straight', 2: '2 straight' };

function runStraight() {
  const digits = $('xq').value.replace(/\D/g, '');
  if (digits.length !== 6) {
    $('xresult').innerHTML = '<p class="none">Enter your 6 digits, like 626764 or 6-2-6-7-6-4.</p>';
    return;
  }
  const pick = digits.split('').map(Number);
  const mode = $('xmode').value;
  const month = +$('xmonth').value;
  const year = +$('xyear').value;
  const r = straightScan(allDraws(), pick, { mode, month, year, min: 2 });
  const where = `${month ? MONTHS[month - 1] : 'all months'}${year ? ` ${year}` : month ? ' of every year' : ''}`;
  const modeTxt = { last: 'last digits', first: 'first digits', run: 'any straight stretch', multi: 'any order' }[mode];
  if (!r.checked) {
    $('xresult').innerHTML = `<p class="none">No 6D results are saved for ${where}.</p>`;
    return;
  }
  const chips = [6, 5, 4, 3, 2].map((k) => `<div class="fchip tier${r.tiers[k] ? ' on' : ''}"><span class="tn">${r.tiers[k]}</span><small>${k} ${mode === 'multi' ? 'digits' : 'straight'}</small></div>`).join('');
  const rows = r.rows.slice(0, 200).map((x) => {
    const [yy, mm, dd] = x.d.split('-').map(Number);
    const balls = x.v.map((n, i) => ball(n).replace('class="ball', `class="ball ${x.pos.includes(i) ? 'hit' : 'dim'}`)).join('');
    return `<li><button type="button" class="date jump" data-jump="${yy}-${mm}" title="Open ${MONTHS[mm - 1]} ${yy}"><strong>${dd}</strong><span>${WEEK[new Date(yy, mm - 1, dd).getDay()].slice(0, 3)} · ${MONTHS[mm - 1].slice(0, 3)} ${yy}</span></button><div class="balls">${balls}<span class="kbadge k${x.k}">${x.k} ${mode === 'multi' ? 'digits' : 'straight'}</span></div></li>`;
  }).join('');
  const best = r.rows.length ? Math.max(...r.rows.map((x) => x.k)) : 0;
  const head = r.rows.length
    ? `<strong>${digits.split('').join('-')}</strong> had a ${mode === 'multi' ? 'match (any order) of' : 'straight match of'} 2 or more digits in <strong>${r.rows.length}</strong> of ${r.checked} draws (${where}, ${modeTxt}). Best: ${mode === 'multi' ? `${best} digits` : TIER_NAME[best]}.`
    : `<strong>${digits.split('').join('-')}</strong> had no straight match of 2 or more digits in ${r.checked} draws (${where}, ${modeTxt}).`;
  $('xresult').innerHTML = `<p class="sum">${head}</p>
    <div class="fchips">${chips}</div>
    <p class="smeta">Each draw is counted once, under its best match. Highlighted balls are the matching positions.</p>
    ${rows ? `<ul class="days sres">${rows}</ul>` : ''}
    ${r.rows.length > 200 ? `<p class="smeta">Showing the newest 200 of ${r.rows.length}.</p>` : ''}`;
}
$('xform').addEventListener('submit', (e) => { e.preventDefault(); runStraight(); });
for (const id of ['xmode', 'xmonth', 'xyear']) $(id).addEventListener('change', () => { if ($('xq').value.trim()) runStraight(); });
$('xresult').addEventListener('click', (e) => {
  const j = e.target.closest('[data-jump]');
  if (!j) return;
  const [y, m] = j.dataset.jump.split('-').map(Number);
  state.y = y;
  state.m = m;
  render();
  document.querySelector('.bar').scrollIntoView();
});

// ---- Combination generator (6/42, 6/55, 6/58) ----
function setupCombo(lo, hi) {
  const opts = Array.from({ length: hi - lo + 1 }, (_, i) => `<option value="${lo + i}">${lo + i}</option>`).join('');
  const f = +$('cfrom').value;
  const t = +$('cto').value;
  $('cfrom').innerHTML = opts;
  $('cto').innerHTML = opts;
  $('cfrom').value = f >= lo && f <= hi ? f : lo;
  $('cto').value = t >= lo && t <= hi ? t : Math.min(hi, lo + 1);
}
let lastCombos = [];
function runCombos() {
  const g = G();
  const month = +$('cmonth').value;
  const from = +$('cfrom').value;
  const to = +$('cto').value;
  const mode = $('cmode').value;
  const info = monthPool(allDraws(), { month, from, to, max: g.max, mode });
  const mn = month ? MONTHS[month - 1] : 'any month';
  const range = `${Math.min(from, to)} to ${Math.max(from, to)}`;
  if (!info.draws) { $('cresult').innerHTML = `<p class="none">No ${mn} draws are saved for ${range}.</p>`; lastCombos = []; return; }
  const r = makeCombos(info, { count: +$('ccount').value, max: g.max });
  lastCombos = r.combos;
  const yrs = info.years.join(', ');
  const modeTxt = { all: 'all numbers that came out', every: `numbers that came out in every year (${yrs})`, top: 'the 15 most frequent numbers' }[mode];
  const poolBalls = info.pool.map((n) => `<span class="ball">${pad(n)}</span>`).join('');
  const note = !info.pool.length
    ? `<p class="smeta">No number came out in every one of those years, so the combinations use the most frequent ${mn} numbers instead.</p>`
    : r.toppedUp.length
      ? `<p class="smeta">Only ${info.pool.length} number${info.pool.length === 1 ? '' : 's'} qualified, so ${r.toppedUp.length} more (${r.toppedUp.map(pad).join(', ')}) were added to make full combinations.</p>`
      : '';
  const rows = r.combos.map((c, i) => `<li><div class="date"><strong>${i + 1}</strong><span>combo</span></div><div class="balls">${c.map((n) => `<span class="ball${info.counts[n] ? '' : ' dim'}" title="${info.counts[n] ? `came out ${info.counts[n]}x` : 'did not come out in those draws'}">${pad(n)}</span>`).join('')}</div></li>`).join('');
  $('cresult').innerHTML = `<p class="sum"><strong>${r.combos.length}</strong> combination${r.combos.length === 1 ? '' : 's'} from ${mn} ${range} (${info.draws} ${g.name.split(' ')[0]} draws), using ${modeTxt}.</p>
    <p class="smeta">Number pool (${info.pool.length}), most frequent first:</p>
    <div class="balls pool">${poolBalls || '<span class="smeta">none</span>'}</div>${note}
    <ul class="days sres">${rows}</ul>
    <div class="row"><button type="button" id="ccopy">Copy all</button><button type="button" id="cagain" class="ghost">Generate again</button><button type="button" id="ctarget" class="ghost">Use the pool as my target list</button></div>
    <p class="smeta" id="cmsg" role="status"></p>`;
}
$('cform').addEventListener('submit', (e) => { e.preventDefault(); runCombos(); });
for (const id of ['cmonth', 'cfrom', 'cto', 'cmode', 'ccount']) $(id).addEventListener('change', () => { if ($('cresult').innerHTML) runCombos(); });
$('cresult').addEventListener('click', async (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.id === 'cagain') { runCombos(); return; }
  if (b.id === 'ctarget') {
    const info = monthPool(allDraws(), { month: +$('cmonth').value, from: +$('cfrom').value, to: +$('cto').value, max: G().max, mode: $('cmode').value });
    $('tq').value = info.pool.join(' ');
    $('tmonth').value = $('cmonth').value;
    tstate.tier = 0;
    runTarget();
    $('target').scrollIntoView();
    return;
  }
  if (b.id === 'ccopy') {
    const text = lastCombos.map((c) => c.map(pad).join('-')).join('\n');
    try { await navigator.clipboard.writeText(text); $('cmsg').textContent = 'Copied.'; } catch { $('cmsg').textContent = 'Could not copy automatically. Select the numbers and copy them by hand.'; }
  }
});

// ---- Target list: match 1 to 6 of your numbers (6/42, 6/55, 6/58) ----
const TARGET_KEY = 'lotto.target';
const TARGET_GAMES = [['lotto', '6/42'], ['lotto55', '6/55'], ['lotto58', '6/58']];
const tstate = { tier: 0 };
function setupTarget(lo, hi) {
  const cur = $('tyear').value;
  $('tyear').innerHTML = '<option value="0">All years</option>' + Array.from({ length: hi - lo + 1 }, (_, i) => `<option value="${hi - i}">${hi - i}</option>`).join('');
  $('tyear').value = [...$('tyear').options].some((o) => o.value === cur) ? cur : '0';
  if (!$('tq').value) { try { $('tq').value = localStorage.getItem(TARGET_KEY) || ''; } catch { /* storage unavailable */ } }
}
// Draws of another 6-number game: built-in seed plus anything added in this browser.
function drawsOf(id) {
  if (id === gameId) return allDraws();
  const g = GAMES[id];
  let extra = {};
  try { extra = JSON.parse(localStorage.getItem(g.store)) || {}; } catch { /* storage unavailable */ }
  return Object.entries({ ...g.seed, ...extra }).sort((a, b) => b[0].localeCompare(a[0]));
}
function runTarget() {
  const targets = parseTargets($('tq').value, 58);
  if (!targets.length) {
    $('tresult').innerHTML = '<p class="none">Enter at least one number from 1 to 58, like 19 23 28 04 08 18 21.</p>';
    return;
  }
  try { localStorage.setItem(TARGET_KEY, targets.join(' ')); } catch { /* storage unavailable */ }
  const month = +$('tmonth').value;
  const year = +$('tyear').value;
  const g = G();
  const r = targetScan(allDraws(), targets, { month, year, min: 1 });
  const where = `${month ? MONTHS[month - 1] : 'all months'}${year ? ` ${year}` : month ? ' of every year' : ''}`;
  const lab = targets.map(pad).join(' ');
  const out = targets.filter((n) => n > g.max);
  const outNote = out.length ? `<p class="smeta">${out.map(pad).join(', ')} can't come out in ${g.name.split(' ')[0]} (top number is ${g.max}), so only ${targets.length - out.length} of your ${targets.length} numbers count here.</p>` : '';
  if (!r.checked) { $('tresult').innerHTML = `<p class="none">No ${g.name.split(' ')[0]} draws are saved for ${where}.</p>`; return; }

  const chips = [6, 5, 4, 3, 2, 1].map((k) => `<button type="button" class="fchip tier${r.tiers[k] ? ' on' : ''}${tstate.tier === k ? ' sel' : ''}" data-tier="${k}" title="Show only draws with ${k} match${k === 1 ? '' : 'es'}"><span class="tn">${r.tiers[k]}</span><small>${k} match${k === 1 ? '' : 'es'}</small></button>`).join('');
  const shownRows = tstate.tier ? r.rows.filter((x) => x.k === tstate.tier) : r.rows;
  const ordered = shownRows.slice().sort((a, b) => b.k - a.k || b.d.localeCompare(a.d));
  const rows = ordered.slice(0, 200).map((x) => {
    const [yy, mm, dd] = x.d.split('-').map(Number);
    const balls = x.v.map((n) => ball(n).replace('class="ball', `class="ball ${x.hits.includes(n) ? 'hit' : 'dim'}`)).join('');
    return `<li><button type="button" class="date jump" data-jump="${yy}-${mm}" title="Open ${MONTHS[mm - 1]} ${yy}"><strong>${dd}</strong><span>${WEEK[new Date(yy, mm - 1, dd).getDay()].slice(0, 3)} · ${MONTHS[mm - 1].slice(0, 3)} ${yy}</span></button><div class="balls">${balls}<span class="kbadge k${x.k}">${x.k} match${x.k === 1 ? '' : 'es'}</span></div></li>`;
  }).join('');
  const best = r.rows.length ? Math.max(...r.rows.map((x) => x.k)) : 0;
  const head = r.rows.length
    ? `Your ${targets.length} target number${targets.length === 1 ? '' : 's'} (<strong>${lab}</strong>) matched at least 1 number in <strong>${r.rows.length}</strong> of ${r.checked} ${g.name.split(' ')[0]} draws (${where}). Best: ${best} of 6.`
    : `None of your target numbers (<strong>${lab}</strong>) came out in ${r.checked} ${g.name.split(' ')[0]} draws (${where}).`;

  // Side-by-side table for 6/42, 6/55 and 6/58 with the same month and year.
  const table = TARGET_GAMES.map(([id, name]) => {
    const t = targetScan(drawsOf(id), targets, { month, year, min: 1 });
    const cells = [6, 5, 4, 3, 2, 1].map((k) => `<td class="${t.tiers[k] ? 'y' : 'n'}">${t.tiers[k]}</td>`).join('');
    return `<tr${id === gameId ? ' class="cur"' : ''}><th scope="row">${name}</th><td>${t.checked}</td>${cells}</tr>`;
  }).join('');

  const per = Object.keys(r.perNumber).map(Number).sort((a, b) => r.perNumber[b] - r.perNumber[a] || a - b)
    .map((n) => `${pad(n)} ×${r.perNumber[n]}`).join(' · ');
  $('tresult').innerHTML = `<p class="sum">${head}</p>${outNote}
    <div class="fchips">${chips}</div>
    <p class="smeta">${tstate.tier ? `Showing only draws with ${tstate.tier} match${tstate.tier === 1 ? '' : 'es'}. Click the same count again to show all.` : 'Each draw is counted once, under the number of your targets it has. Highlighted balls are your targets. Click a count to filter.'}</p>
    <div class="mgrid-wrap"><table class="mgrid tgrid"><caption>Same target list in all three 6-number games (${where})</caption><thead><tr><th></th><th scope="col">Draws</th><th scope="col">6</th><th scope="col">5</th><th scope="col">4</th><th scope="col">3</th><th scope="col">2</th><th scope="col">1</th></tr></thead><tbody>${table}</tbody></table></div>
    ${rows ? `<ul class="days sres">${rows}</ul>` : ''}
    ${ordered.length > 200 ? `<p class="smeta">Showing the first 200 of ${ordered.length} (most matches first, then newest).</p>` : ''}
    ${per ? `<p class="smeta">Times each target came out here: ${per}.</p>` : ''}`;
}
$('tform').addEventListener('submit', (e) => { e.preventDefault(); tstate.tier = 0; runTarget(); });
$('tclear').addEventListener('click', () => {
  $('tq').value = '';
  $('tresult').innerHTML = '';
  tstate.tier = 0;
  try { localStorage.removeItem(TARGET_KEY); } catch { /* storage unavailable */ }
});
for (const id of ['tmonth', 'tyear']) $(id).addEventListener('change', () => { if ($('tq').value.trim()) { tstate.tier = 0; runTarget(); } });
$('tresult').addEventListener('click', (e) => {
  const c = e.target.closest('[data-tier]');
  if (c) { const k = +c.dataset.tier; tstate.tier = tstate.tier === k ? 0 : k; runTarget(); return; }
  const j = e.target.closest('[data-jump]');
  if (!j) return;
  const [y, m] = j.dataset.jump.split('-').map(Number);
  state.y = y;
  state.m = m;
  render();
  document.querySelector('.bar').scrollIntoView();
});

applyGame();
setupFinder();
render();
