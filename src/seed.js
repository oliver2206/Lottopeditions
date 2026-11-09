import raw42 from './data/draws.txt?raw';
import raw55 from './data/draws55.txt?raw';
import raw58 from './data/draws58.txt?raw';
import { parseDraws } from './parse.js';

// Source: PCSO results as compiled by lottopcso.com (Jan 2024 to Nov 7, 2026), cross-checked with GMA Network.
// 6/42 also has 2023 (Jan 3 to Dec 30), added from a pasted results table.
// One draw per line: "YYYY-MM-DD n-n-n-n-n-n".
export const SEED = { ...parseDraws(raw42).draws };
export const SEED55 = { ...parseDraws(raw55, 55).draws };
export const SEED58 = { ...parseDraws(raw58, 58).draws };
