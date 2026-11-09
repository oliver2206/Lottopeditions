import raw from './data/swertres.txt?raw';
import { parseSwertres } from './parse3.js';

// Lines starting with # are comments; parseSwertres skips them (as non-dates).
export const SEED3 = parseSwertres(raw.split('\n').filter((l) => !l.startsWith('#')).join('\n')).draws;
