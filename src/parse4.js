const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n) => String(n).padStart(2, '0');

function validDate(y, m, d) {
  const t = new Date(y, m - 1, d);
  return t.getFullYear() === +y && t.getMonth() === m - 1 && t.getDate() === +d;
}

// One 4D draw: four digits 0-9, written 7-0-5-0, 7050 or "7 0 5 0".
const DRAW = /^(\d)[-.\s]?(\d)[-.\s]?(\d)[-.\s]?(\d)$/;

// Returns { draws: { 'YYYY-MM-DD': [[d, d, d, d]] }, skipped }
// 4D has one draw a day (Mon, Wed, Fri 9PM), stored as a single slot so it shares the Swertres display and search code.
// Accepted lines:
//   2026-11-06 2-5-0-5      2026-11-06,2,5,0,5      2026-11-06 2505
//   November 6, 2026 2 5 0 5
export function parse4D(text) {
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
    const digits = rest.trim().replace(/^[\s,;|]+/, '').replace(/[,;|]+/g, ' ');
    const hit = digits.match(DRAW);
    if (!hit || !validDate(+y, +m, +d)) { skipped++; continue; }
    draws[`${y}-${pad(m)}-${pad(d)}`] = [hit.slice(1).map(Number)];
  }
  return { draws, skipped };
}
