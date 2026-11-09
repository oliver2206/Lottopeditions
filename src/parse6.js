const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n) => String(n).padStart(2, '0');

function validDate(y, m, d) {
  const t = new Date(y, m - 1, d);
  return t.getFullYear() === +y && t.getMonth() === m - 1 && t.getDate() === +d;
}

// One 6D draw: six digits 0-9, written 6-2-6-7-6-4, 626764 or "6 2 6 7 6 4".
const DRAW = /^(\d)[-.\s]?(\d)[-.\s]?(\d)[-.\s]?(\d)[-.\s]?(\d)[-.\s]?(\d)$/;

// Returns { draws: { 'YYYY-MM-DD': [[d, d, d, d, d, d]] }, skipped }
// 6D has one draw a day (Tue, Thu, Sat 9PM), stored as a single slot so it shares the Swertres/4D display and search code.
// Accepted lines:
//   2024-12-31 5-8-9-9-6-4      2024-12-31,5,8,9,9,6,4      2024-12-31 589964
//   December 31, 2024 5 8 9 9 6 4
export function parse6D(text) {
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
