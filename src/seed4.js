import raw from './data/draws4d.txt?raw';
import { parse4D } from './parse4.js';

// Source: pinoyswertres.net 4D history 2026, with mislabeled dates corrected against GMA Network. Jan 2026 to Nov 6, 2026.
export const SEED4 = parse4D(raw).draws;
