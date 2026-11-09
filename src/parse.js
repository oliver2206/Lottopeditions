const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n) => String(n).padStart(2, '0');

function validDate(y, m, d) {
  const t = new Date(y, m - 1, d);
  return t.getFullYear() === +y && t.getMonth() === m - 1 && t.getDate() === +d;
}

// Returns { draws: {date: [6 numbers]}, skipped: number }
export function parseDraws(text, max = 42) {
  const draws = {};
  let skipped = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    let y, m, d, rest, x;
    if ((x = line.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[\s,;]+(.*)$/))) {
      [, y, m, d, rest] = x;
    } else if ((x = line.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[\s,;]+(.*)$/))) {
      [, m, d, y, rest] = x;
    } else if ((x = line.match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s*(\d{4})(.*)$/)) && MON[x[1].toLowerCase()]) {
      m = MON[x[1].toLowerCase()];
      [, , d, y, rest] = x;
    } else {
      skipped++;
      continue;
    }
    const nums = (rest.match(/\d{1,2}/g) || []).slice(0, 6).map(Number);
    const ok = nums.length === 6 && new Set(nums).size === 6 && nums.every((n) => n >= 1 && n <= max);
    if (!ok || !validDate(+y, +m, +d)) {
      skipped++;
      continue;
    }
    draws[`${y}-${pad(m)}-${pad(d)}`] = nums;
  }
  return { draws, skipped };
}
