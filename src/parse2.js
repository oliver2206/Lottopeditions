const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n) => String(n).padStart(2, '0');
const SLOT = { '2': 0, '5': 1, '9': 2 };

function validDate(y, m, d) {
  const t = new Date(y, m - 1, d);
  return t.getFullYear() === +y && t.getMonth() === m - 1 && t.getDate() === +d;
}

// One 2D (EZ2) draw: two numbers from 1 to 31, order matters. Written 13-26, 13.26 or "13 26".
const PAIR = /^(\d{1,2})[-.](\d{1,2})$/;
const BLANK = /^(-+|[xX*?]+|n\/a|n\/d)$/i;
const okNum = (n) => n >= 1 && n <= 31;
const pairOf = (a, b) => {
  const p = [+a, +b];
  return p.every(okNum) ? p : undefined;
};

// Returns { draws: { 'YYYY-MM-DD': [slot2pm, slot5pm, slot9pm] }, skipped }
// Each slot is [n, n] or null (not drawn / not known).
// Accepted lines:
//   2026-11-07 05-07 18-29 02-16        (2PM 5PM 9PM, use --- for a missing draw)
//   2026-11-07,5-7,18-29,2-16
//   2026-11-07 5PM 18-29                (one labelled draw; several lines for a day merge)
//   November 7, 2026 2PM 05 07 5PM 18 29 9PM 02 16
// Lines starting with # are ignored.
export function parse2D(text) {
  const draws = {};
  let skipped = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    let y, m, d, rest, x;
    if ((x = line.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[\s,;]+(.*)$/))) [, y, m, d, rest] = x;
    else if ((x = line.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[\s,;]+(.*)$/))) [, m, d, y, rest] = x;
    else if ((x = line.match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s*(\d{4})(.*)$/)) && MON[x[1].toLowerCase()]) {
      m = MON[x[1].toLowerCase()];
      [, , d, y, rest] = x;
    } else { skipped++; continue; }
    if (!validDate(+y, +m, +d)) { skipped++; continue; }

    const toks = rest.split(/[\s,;|]+/).filter(Boolean);
    const slots = [null, null, null];
    let ok = true;
    let any = false;
    const labelled = toks.some((t) => /^[259]pm$/i.test(t));
    if (labelled) {
      for (let i = 0; i < toks.length; i++) {
        const lab = toks[i].match(/^([259])pm$/i);
        if (!lab) continue;
        const a = toks[i + 1];
        let v = null;
        if (a && PAIR.test(a)) v = pairOf(...a.match(PAIR).slice(1));
        else if (a && /^\d{1,2}$/.test(a) && /^\d{1,2}$/.test(toks[i + 2] || '')) v = pairOf(a, toks[i + 2]);
        else if (!a || BLANK.test(a)) v = null;
        else { ok = false; break; }
        if (v === undefined) { ok = false; break; }
        slots[SLOT[lab[1]]] = v;
        if (v) any = true;
      }
    } else if (toks.every((t) => /^\d{1,2}$/.test(t)) && [2, 4, 6].includes(toks.length)) {
      for (let g = 0; g < toks.length / 2; g++) {
        const v = pairOf(toks[g * 2], toks[g * 2 + 1]);
        if (!v) { ok = false; break; }
        slots[g] = v;
        any = true;
      }
    } else if (toks.length >= 1 && toks.length <= 3) {
      toks.forEach((t, i) => {
        if (PAIR.test(t)) {
          const v = pairOf(...t.match(PAIR).slice(1));
          if (v) { slots[i] = v; any = true; } else ok = false;
        } else if (!BLANK.test(t)) ok = false;
      });
    } else ok = false;
    if (!ok || !any) { skipped++; continue; }

    const key = `${y}-${pad(m)}-${pad(d)}`;
    const prev = draws[key] || [null, null, null];
    draws[key] = slots.map((s, i) => s || prev[i]);
  }
  return { draws, skipped };
}
