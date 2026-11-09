const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n) => String(n).padStart(2, '0');
const SLOT = { '2': 0, '5': 1, '9': 2 };

function validDate(y, m, d) {
  const t = new Date(y, m - 1, d);
  return t.getFullYear() === +y && t.getMonth() === m - 1 && t.getDate() === +d;
}

// One Swertres draw: three digits 0-9, written 3-0-5, 305 or "3 0 5".
const DRAW = /^(\d)[-.]?(\d)[-.]?(\d)$/;
const BLANK = /^(-+|[xX?]+|n\/a)$/i;

// Returns { draws: { 'YYYY-MM-DD': [slot2pm, slot5pm, slot9pm] }, skipped }
// Each slot is [d, d, d] or null (not drawn / not known).
// Accepted lines:
//   2025-12-20 305 329 655          (2PM 5PM 9PM, use --- for a missing draw)
//   2025-12-20,3-0-5,3-2-9,6-5-5
//   2025-12-20 5PM 3-2-9            (one labelled draw; several lines for a day merge)
//   December 20, 2025 2PM 3 0 5 5PM 3 2 9 9PM 6 5 5
export function parseSwertres(text) {
  const draws = {};
  let skipped = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
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
    const labelled = toks.some((t) => /^[259]\s?(pm)?$/i.test(t) && /pm/i.test(t));
    if (labelled) {
      // label then digits (either one token 305/3-0-5 or three single digits)
      for (let i = 0; i < toks.length; i++) {
        const lab = toks[i].match(/^([259])pm$/i);
        if (!lab) continue;
        let a = toks[i + 1], v = null;
        if (a && DRAW.test(a)) v = a.match(DRAW).slice(1).map(Number);
        else if (a && /^\d$/.test(a) && /^\d$/.test(toks[i + 2] || '') && /^\d$/.test(toks[i + 3] || '')) v = [a, toks[i + 2], toks[i + 3]].map(Number);
        else if (!a || BLANK.test(a)) v = null;
        else { ok = false; break; }
        slots[SLOT[lab[1]]] = v;
        if (v) any = true;
      }
    } else if (toks.every((t) => /^\d$/.test(t)) && [3, 6, 9].includes(toks.length)) {
      for (let g = 0; g < toks.length / 3; g++) slots[g] = toks.slice(g * 3, g * 3 + 3).map(Number);
      any = true;
    } else if (toks.length >= 1 && toks.length <= 3) {
      toks.forEach((t, i) => {
        if (DRAW.test(t)) { slots[i] = t.match(DRAW).slice(1).map(Number); any = true; }
        else if (!BLANK.test(t)) ok = false;
      });
    } else ok = false;
    if (!ok || !any) { skipped++; continue; }

    const key = `${y}-${pad(m)}-${pad(d)}`;
    const prev = draws[key] || [null, null, null];
    draws[key] = slots.map((s, i) => s || prev[i]);
  }
  return { draws, skipped };
}
