import raw from './data/draws2d.txt?raw';
import { parse2D } from './parse2.js';

// Source: pinoyswertres.net 2D history, cross-checked with pcsodailyresults.com and GMA Network. Jan 1, 2025 to Nov 8, 2026.
export const SEED2 = parse2D(raw).draws;
