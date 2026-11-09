import raw from './data/draws6d.txt?raw';
import { parse6D } from './parse6.js';

// Source: pinoyswertres.net 6D Lotto Result History 2023 and 2024, mislabeled dates corrected. Jan 9, 2021 to Nov 7, 2026.
export const SEED6 = parse6D(raw).draws;
