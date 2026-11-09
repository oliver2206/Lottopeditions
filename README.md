# 6/42 Lotto Tracker 3D

    npm install
    npm run dev

Year > month > day drill-down for PCSO Lotto 6/42, rendered in 3D with Three.js, covering January 2023 to today (6/42; 6/55 and 6/58 start in January 2024).

- **Years**: one tower per year (2023 to now for 6/42). Taller means more draws.
- **Months**: 12 towers for the chosen year.
- **Days**: one row per draw with glossy 3D balls. Tap a ball to highlight that number across the month.
- Drag to rotate, scroll or pinch to zoom, Esc goes up a level. A **List** button switches to the plain version, which is also the automatic fallback when WebGL is unavailable.

Data: `src/data/draws.txt` (Jan 3, 2023 to Nov 7, 2026, 595 draws; Jan 1, 2024 was a Monday and has no 6/42 draw; Apr 6 and 8, 2023 (Holy Week) have no draw; the 2023 table listed Aug 2 but it was a Wednesday, so it is saved as Aug 3). One draw per line: `YYYY-MM-DD n-n-n-n-n-n`.
Spot-checked against GMA Network and Philstar result pages (21 draws, all matching). Missing Tue/Thu/Sat dates are Holy Week, when PCSO does not draw.
To show earlier years, lower `START` in `src/main.js` and add the draws.

## Swertres 3D (added)
Use the game switch at the top to flip between 6/42 and Swertres 3D. Swertres data lives in `src/data/swertres.txt`
(`YYYY-MM-DD <2PM> <5PM> <9PM>`, `---` for a missing draw). 2023 (from Jan 2), 2024, 2025 and 2026 (to Nov 8) are built in (1,391 draw days, 4,172 draws; Holy Week and Dec 25, 2023 have no draws, and 2026-11-08 has no 9PM result yet).
Add other years with "Add or export results" or by appending lines to that file.

## 6/55 and 6/58 (added)
Game switch: 6/42, 6/55, 6/58, Swertres. Data files: `src/data/draws.txt` (6/42), `draws55.txt` (6/55), `draws58.txt` (6/58),
`swertres.txt`. Format per line: `YYYY-MM-DD n-n-n-n-n-n`. 6/55: 443 draws and 6/58: 442 draws, Jan 2024 to Nov 7, 2026
(from lottopcso.com year summaries, cross-checked against GMA Network; known source typos corrected in the data).

## Search a number (added)
The panel at the top of the page works in every game.
- **Swertres**: type 3 digits (`305` or `3-0-5`) to list every time it came out. Choose **Exact order** or **Any order (Rambolito)**, and optionally limit it to the 2PM, 5PM or 9PM draw. Type 1 or 2 digits to find draws that contain them.
- **6/42, 6/55, 6/58**: type 1 to 6 numbers (like `7 12 23`) to list every draw that has all of them.
- Results show how many times it came out, a count per draw time and per year, when it last came out, and each matching draw with the hit highlighted. Click a date to open that month. Logic lives in `src/search.js`.

## Month check (added)
In the search panel, pick a month (like June) next to the number. Besides the matching draws, you get a line for each year (June 2024, 2025, 2026) saying whether the number was drawn that month and on which days, plus a one-sentence verdict ("07 came out in June in 2 of 3 years"). A year x month table under it shows every month at once (✔ drawn, – not drawn, · no results saved yet). Leave the month on "Any month" to see just the table. Works for all four games. Logic: `inMonth`, `monthGrid` and `monthSummary` in `src/search.js`.

## Find numbers by month (added)
The panel above the search box answers "which numbers came out in November in every year from 2024 to 2025?". Pick a month and a from/to year, press **Find numbers**. You get every number that appeared in that month in each of those years, with how many times per year, sorted by most frequent. Numbers that missed some years sit in a collapsed list. Click a number to open the normal search for it, already set to that month. For Swertres it lists whole 3-digit results (exact order, any draw time). Years with nothing saved for that month are skipped and mentioned. Logic: `commonInMonth` in `src/search.js`.

## 4D Lotto (added)
New **4D** button in the game switch. Data: `src/data/draws4d.txt` (`YYYY-MM-DD d-d-d-d`), January 2 to November 6, 2026 (132 draws, Mon/Wed/Fri 9PM; Apr 3 was Good Friday, no draw).
Source: the 2026 table on pinoyswertres.net (https://www.pinoyswertres.net/4d-pcso-lotto-results/ links to it). That table had mislabeled dates, which were fixed after checking GMA Network: Jan 2, 5, 7 and 9 were labeled 2025, and Apr 11, May 2, May 5, Aug 30, Sep 5 and Oct 18 were one or two days off (true dates Apr 10, May 4, May 6, Aug 31, Sep 4, Oct 19). Its Nov 8 row ("*", no result yet) and Apr 3 ("N/D") were left out.
27 draws were spot-checked digit by digit against GMA Network (all match). Jan 9 (8-8-4-6) is the one corrected row not checked against a second source.
Search: type 1 to 4 digits (`2505`, `2-5-0-5`), exact order or any order. The month check and "Find numbers by month" work too (the 4D data only covers 2026, so the finder shows a single year). Paste or load more draws with "Add or export results" (`2026-11-09 1-2-3-4`). Parser: `src/parse4.js`.

## 2D Lotto / EZ2 (added)
New **2D** button in the game switch. Data: `src/data/draws2d.txt` (`YYYY-MM-DD <2PM> <5PM> <9PM>`, each draw is two numbers 1 to 31 like `13-26`, `---` = missing), January 1, 2025 to November 8, 2026: 671 days, 2,012 draws (Nov 8's 9PM draw is not out yet). Holy Week had no draws (Apr 17-19, 2025 and Apr 2-4, 2026).
Sources: pcsodailyresults.com 2D summary covers only Aug 29 to Nov 8, 2026, so earlier months come from the pinoyswertres.net 2D history pages (2025 and 2026). The overlap between the two sources was compared row by row. Fixes after checking GMA Network and The Summit Express: 2025-05-19 2PM (25-01), 2025-09-05 5PM (13-10), 2026-01-12 9PM (26-13), 2026-09-02 2PM (20-17); on pcsodailyresults, 2026-09-17 9PM (23-12, not a repeat of 13-03) and 2026-10-01 9PM (23-21, not "04-02-09"). 2026-08-29 2PM (18-01) is missing on pcsodailyresults but confirmed on GMA. 20 other draw days were spot-checked against GMA (all match).
Search: type 1 or 2 numbers (`13 26`, `13-26`), Exact order or Any order (Rambolito), optionally one draw time. The month check and "Find numbers by month" work too (the finder lists whole pairs). Paste more with "Add or export results" (`2026-11-09 05-07 18-29 02-16`). Parser: `src/parse2.js`.

## 6D Lotto (added)
New **6D** button in the game switch. Data: `src/data/draws6d.txt` (`YYYY-MM-DD d-d-d-d-d-d`), January 9, 2021 to November 7, 2026 (899 draws) (Tue, Thu, Sat 9PM, six digits 0-9, order matters). Holy Week had no draws (Apr 6 and 8, 2023; Mar 28 and 30, 2024). Jan 1 and 2, 2023 had no draw (the first 2023 draw is Tue Jan 3).
Source: the 2023 and 2024 pages of the pinoyswertres.net 6D Lotto Result History (https://www.pinoyswertres.net/6d-lotto-result-history-2025/ links to both). Six rows on the 2024 page had wrong labels and were fixed: Jan 2 and Jan 4 were labeled 2023 (2023-01-04 was a Wednesday, so there is no draw that day), May 26 is really May 25, Aug 18 is Aug 17, "Sept 1" is Oct 1 and "Sept 2" is Nov 2. All of those except Jan 4 were confirmed against GMA Network (which has no 6D draw on May 26 or Aug 18).
49 draws were spot-checked digit by digit against GMA Network (10 in 2023, 39 in 2024, all match). They cover Jan, Feb, May, Aug, Oct and Nov 2024 and scattered 2023 dates; the other months were only checked for valid Tue/Thu/Sat dates, no duplicates and no gaps other than Holy Week.
2025 and 2026 (Jan 2, 2025 to Nov 7, 2026, 286 draws) came from a pasted results table and were checked for Tue/Thu/Sat dates, duplicates and gaps. Three 2025 rows were labeled a day early (Mondays) and moved to the Tuesday: May 5 to May 6, Aug 25 to Aug 26, Sep 22 to Sep 23. These 286 draws were not digit-checked against a second source. Holy Week 2025 (Apr 17, 19) and 2026 (Apr 2, 4) had no draws. 2021 and 2022 (Jan 9, 2021 to Dec 31, 2022, 304 draws) were added the same way and are also not digit-checked against a second source. Fixes: the first "Feb 5, 2022" row (6-0-8-2-0-7, a duplicate label between Mar 8 and Mar 3) is Mar 5; Aug 3, 2022 (a Wednesday) is Aug 4; Jan 19, 2022 (a Wednesday) is Jan 20; Dec 11, 2021 had an en dash; Nov 27, 2021 was typed 11/272021. Holy Week had no draws (Apr 1, 2021; Apr 14 and 16, 2022). Apr 3 2021, Dec 25 2021 and Jan 1 2022 have no row in the source and are treated as no draw. Add newer draws with "Add or export results" (`2026-11-10 1-2-3-4-5-6`).
Search: type 1 to 6 digits (`626764`, `6-2-6-7-6-4`, `933`), exact order or any order. The month check and "Find numbers by month" work too (the finder lists whole 6-digit results). Parser: `src/parse6.js`.

## 6D straight match (added)
On the **6D** game there is a "Straight match" panel above the month finder. Type your 6 digits, pick a month (default: the current one) and a year (or all years), and press **Check**. Every draw that matches your digits straight (same digit, same position) in 2, 3, 4, 5 or 6 places is listed, with a count per level (2, 3, 4, 5, 6 straight) and the matching balls highlighted. Each draw is counted once, under its longest match. Choose which digits count:
- **Last digits (ending)**: counted from the right, so a 4 straight means your last 4 digits equal the draw's last 4.
- **First digits (starting)**: counted from the left.
- **Any straight stretch**: the longest run of neighbouring positions that match (for example positions 2 to 5).
Pick the month and "All years" to see how often a number matched in, say, every November. Click a date to open that month. Logic: `straightRun` and `straightScan` in `src/search.js`.

## 6D: compare last or first digits (added)
On 6D, the "Find numbers that came out in the same month every year" box has a new dropdown next to the month: **Whole 6 digits** (as before), **Last 5 / 4 / 3 digits** or **First 5 / 4 / 3 digits**. The finder then compares only that part of every 6-digit result, so you see which endings (for example the last 4 digits) came out in the chosen month in every year, or in only some. Click an ending to open the normal search for it, set to the same month and to the new match mode **Ends with (last digits)** or **Starts with (first digits)**, which are also available by hand in the search panel on 6D. Logic: the `part` option of `commonInMonth` and the `last` and `first` modes of `slotHas` in `src/search.js`.

## 6D: draws that share the same straight digits (added)
In the 6D finder, choosing **First / Last 5, 4 or 3 digits** or **Any 5 / 4 / 3 straight** no longer lists only the shared digits. It lists groups of whole draws from the chosen month (years from to) that share the same digits in the same positions, for example 5-5-7-8-3-2 and 5-5-7-8-3-7 share a straight 5 (the first five digits). Each group shows its shared digits with the other positions blank, then every draw in it with the shared balls highlighted, and the years it covers. Only groups with two or more draws are shown, groups that appear in more years come first, and the page says how many appear in every year. "Any" checks every stretch of neighbouring positions (for 5 digits: positions 1 to 5 and 2 to 6). Click a date to open that month. Logic: `straightGroups` in `src/search.js`. "Whole 6 digits" keeps the old chip view.

Both 6D tools now also support 2 digits: First 2, Last 2 and Any 2 straight in the finder, and a 2 straight level in the Straight match panel.

Extra: the 6D Straight match panel has an **Any order (not straight)** mode that counts how many of your digits appear in the draw in any order (2 to 6), and the finder has an **Any month** choice, so the shared-digit groups can cover every month instead of one.

## Target list: match 1 to 6 of your numbers (added)
On **6/42, 6/55 and 6/58** there is a new **Target list** panel (under the "Find numbers by month" box). Type any amount of numbers (1 to 58, spaces or commas), optionally pick a month and a year, and press **Check target list**. Every draw is compared with your list in any order and any place, and counted once under how many of its 6 numbers are in your list (1, 2, 3, 4, 5 or 6 matches).
- The count chips (6, 5, 4, 3, 2, 1 matches) show how many draws hit each level. Click one to show only those draws; click again to show all.
- Matching balls are highlighted in each draw, with a "N matches" badge. Draws are sorted by most matches, then newest.
- A table compares the same list in **6/42, 6/55 and 6/58** side by side for the same month and year (draws added in this browser are included).
- Numbers above a game's top number (like 48 on 6/42) cannot come out there and are noted.
- After **Find numbers** in the month finder, press **Use these N numbers as my target list** to send those numbers (and that month) straight into the panel.
- The last list is remembered in this browser. Logic: `parseTargets` and `targetScan` in `src/search.js`.

## Combination generator (added)
On **6/42, 6/55 and 6/58** the **Make combinations** panel builds 6-number combinations from the draws of a month in a range of years (for example November, 2024 to 2025). Choose the numbers to use: **All numbers drawn** (numbers that came out more often are picked more often), **Only numbers in every year**, or the **Top 15 most frequent**, and 5, 10, 20 or 50 combinations. It shows the number pool, each combination (sorted, no repeats), a **Copy all** button, **Generate again**, and **Use the pool as my target list** to send the pool to the Target list panel. If the pool has fewer than 6 numbers it is topped up with the next most frequent numbers (the page says so). This is a way to pick numbers from history, not a prediction. Logic: `monthPool` and `makeCombos` in `src/search.js`.
