# Freight Tiger: shipping-cost assistant

**Live demo:** https://freight-tiger-assignment.vercel.app/  
**Source repository:** https://github.com/ishika74/FreightTiger-assignment

Watches cost per tonne-km for every route, week by week. It flags weeks where cost is rising and looks out of the
ordinary, then checks the notes for a real reason. **A rise counts as "justified" only if a note passes a strict,
deterministic check; otherwise it is reported as unexplained.** The numeric pipeline and verdict gate are deterministic JavaScript. The CLI can optionally use an OpenAI-compatible LLM to rewrite explanations for already-verified, justified rows; the LLM cannot alter metrics, flags, or matched note IDs. The browser demo remains offline.

```bash
npm.cmd install                # only needed for the web app (react, vite)
npm.cmd run pipeline           # -> outputs/output.csv + weekly_metrics.csv + token_cost_log.md
# Optional LLM-written explanations (set OPENAI_API_KEY first):
# macOS/Linux: export OPENAI_API_KEY="..." && npm run pipeline
# PowerShell: $env:OPENAI_API_KEY="..."; npm run pipeline
# Optional: set OPENAI_MODEL (default gpt-4o-mini) and OPENAI_BASE_URL
npm.cmd test                   # 18 tests (Node's built-in runner, no install needed)
npm.cmd run eval               # labelled-set + injection eval -> outputs/eval_report.md
npm.cmd run repro              # 3 fresh runs, byte-compared -> outputs/reproducibility_check.txt
npm.cmd run all                # all four above in order
node scripts/ask.mjs "why did Chennai-Bangalore get pricier in March?"   # ask about the findings
npm.cmd run dev                # React web app at http://localhost:5173 (click "Use sample data")
npm.cmd run build              # static site in dist/
npm.cmd run parity             # JS output vs the Python version's output (data/python_output.csv)
```
Requires Node 18+ (developed on Node 22). `pipeline`, `test`, `eval` and `repro` need no `npm install`.

## Quick start (Windows or any OS, no npm needed)
1. **See it:** double-click `freight-watch-standalone.html`. It opens in your browser with the sample data already analysed (no server, no internet, no install).
   Use "Analyse my file" to try your own shipment CSV.
2. **Produce every required file:** double-click `run_all.bat` (or run the four `node` commands in it). Needs only Node 18+.
   It writes `outputs/output.csv`, `weekly_metrics.csv`, `eval_report.md`, `reproducibility_check.txt` and `token_cost_log.md`.
3. **React dev version (optional):** `npm install` then `npm run dev`. On PowerShell, if scripts are blocked, use `npm.cmd install` and `npm.cmd run dev`.
   `index.html` is the React entry page and looks like a short instruction page if opened directly (that is expected); the React version needs the dev server. Do not delete it. For a double-click demo use `freight-watch-standalone.html`.

## What to hand in
| Required | File |
|---|---|
| Working code | `src/`, `scripts/`, `tests/` |
| Output CSV (sample format) | `outputs/output.csv` |
| README | this file |
| Reproducibility check (3 runs) | `outputs/reproducibility_check.txt` |
| Token / cost log | `outputs/token_cost_log.md` |
| How I checked it | `outputs/eval_report.md`, `tests/` |
| Demo | `freight-watch-standalone.html` |

## Result on the supplied data (728 route-weeks scanned, 19 rows output)
| route | weeks | verdict | note |
|---|---|---|---|
| Ahmedabad-Mumbai | 2025-01-20 | justified | N002 (festival surcharge) |
| Chennai-Bangalore | 2025-02-24, 03-03 | justified | N001 (flood window 24 Feb - 8 Mar) |
| Chennai-Bangalore | 2025-03-10, 03-17 | **unexplained** | flood window had ended; N009 only says "back to normal" |
| Delhi-Jaipur | 2024-11-11, 11-18 | **unexplained** | no note in range |
| Mumbai-Delhi | 2025-05-12 | justified | N003 (diesel, 5-7%, all routes) |
| Mumbai-Pune | 2025-06-23 and 10 more weeks to 2025-12-22 | **unexplained** | slow creep, ~+39% vs peers; N003/N006/N010 rejected with reasons |

## How it works
1. **Weekly metrics** (`src/lib/metrics.js`). Shipments go into Monday-Sunday weeks; per route
   `cost_per_tonne_km = sum(cost) / sum(tonnes x km)`, grouped by route and the provided `route_type`.
2. **Baselines**, as the brief defines them. *vs own history*: mean of the route's weekly values over the trailing 8 weeks
   **strictly before** the current week (no look-ahead); with fewer than 8 prior weeks it uses all of them, nothing is padded.
   *vs similar routes*: same-week mean over the other routes with the same `route_type`, excluding the route itself.
3. **Detection**, thresholds in `CFG` (`src/lib/shared.js`). A candidate needs at least 4 prior weeks and either
   Rule A (>= +10% vs own history) or Rule B (>= +20% vs similar routes and >= +3% vs own history).
4. **Retrieval** (`retrieval.js`). A small vector store: every note is embedded two ways, a dense 1024-d hashed sub-word embedding (word + character-trigram features, cosine search in `VectorStore`) and sparse TF-IDF; the two similarity scores are averaged. For each candidate the notes whose scope covers the route are ranked by similarity to a "why did freight cost rise" query. Free-text retrieval is scored separately: 8/8 labelled queries return the right note first (`outputs/eval_report.md`).
5. **Verification gate** (`verify.js`). Retrieval only proposes. A note may justify a flag only if it passes every check:
   *scope* (names this route or All Routes), *polarity* (positively says costs went **up**), *window* (the week overlaps the dates it states),
   *peers* (a market-wide note cannot explain a route >= 20% above peers), *magnitude* (a stated 5-7% must roughly match the observed rise, +/- 5 points).
6. **Explanation**. The deterministic fallback assembles text from note words and measured numbers. When `OPENAI_API_KEY` is configured, the CLI may use an LLM to rewrite explanations only for rows already justified by the deterministic verifier. The LLM cannot choose the verdict or note ID; its rewrite is accepted only when it includes the exact route and note ID, otherwise the original explanation is retained. Unexplained rows always stay deterministic.
7. **Web app** (`src/`). Upload or load sample data, then a findings table with "Read why", a per-route SVG chart (baseline dashed, flags as dots) and an Ask tab that answers questions (e.g. "why did Chennai-Bangalore get pricier in March?") using only the findings.

### Judgement calls
- Weekly value is pooled (total cost / total tonne-km); baselines are plain means of weekly values. This reproduces the brief's sample rows exactly.
- The note parser **fails closed**: a note justifies only if it has an explicit cost-increase phrase and none of the "no impact / back to normal / no rate change" phrases. N004 ("not part of this dataset") has empty scope.
- N003 ("starting this week", no end date) may explain rises for 8 weeks (the baseline length); after that the trailing average has absorbed the step. The 8 is my reading, not stated in the note.
- Chennai-Bangalore 03-10 and 03-17 are the hardest call: costs stayed high, but N001's window ended 8 Mar and N009 does not say costs were affected, so they are unexplained by the brief's rule.
- Only anomalous weeks are written to `output.csv` (as in the sample). Every route-week is in `weekly_metrics.csv`.
- The brief's sample file has unquoted commas in `reason` on row 3, so it is not strictly valid CSV. My output is correctly quoted with the same columns and order.

## How I convinced myself it was right
| check | result |
|---|---|
| Independent recomputation of all 728 route-weeks (separate code path) | matches to 1e-9 |
| Hand-computed toy cases: week edges, no look-ahead, <8 prior weeks, peer excludes self | pass |
| The brief's 3 sample rows (numbers, verdict, note id) | exact match |
| Adversarial matrix: every note x every route x every week (7,280 attempts) | accepted set = exactly N001 (2 weeks, Chennai-Bangalore), N002 (1 week, Ahmedabad-Mumbai), N003 (7 routes x 8 weeks) |
| Same matrix with a route far above peers, or a rise far above 5-7% | N003 rejected in both |
| Every justified row in the output cites a note that covers route and week, says costs rose, and is quoted | pass |
| Hand-labelled events | 7/7 |
| False flags in the clean period before 2024-11-04 | 0 of 308 route-weeks |
| Injection of +m% cost into 21 clean weeks (seeded) | +5%: 2/21, +10%: 10/21, +15%: 19/21, +20% and up: 21/21; 0 false flags; 0 injected weeks "justified" |
| Retrieval: 8 free-text queries, no route filter | right note first 8/8 |
| Note reader (rules) on 22 labelled notes | 10/10 supplied notes correct; 5/12 on new phrasings (a known limit, see trade-offs) |
| JS vs the earlier Python implementation | 19 of 19 rows identical in all 8 columns |

Full tables: `outputs/eval_report.md`.

## Reproducibility

The metric and verdict path is deterministic. `npm run repro` runs the offline pipeline three times in fresh Node processes and compares SHA-256 hashes of `output.csv` and `weekly_metrics.csv`. The checked-in report at `outputs/reproducibility_check.txt` records identical hashes for all three runs. The check was rerun while preparing this submission and all three runs matched byte-for-byte. Per-run artifacts are saved under `outputs/repro/run1/`, `run2/`, and `run3/`.

To repeat the check yourself:

```bash
node scripts/repro.mjs
```

## Output format verification

`outputs/output.csv` uses the same eight column names and order as `data/sample_output_format.csv`:

```text
route,week_of,cost_per_tonne_km,vs_own_history,vs_similar_routes,flagged,matched_note_id,reason
```

The output contains 19 flagged route-week rows. The template contains three example rows; the generated output contains the same eight-column schema and CSV quoting is used for fields containing commas or quotes. All 19 output data rows were checked to have eight fields. `outputs/weekly_metrics.csv` contains the full set of 728 route-week calculations.

## Token and cost log

`outputs/token_cost_log.md` records one complete run over the supplied shipment file. The checked-in run used the deterministic offline fallback: LLM enabled `false`, LLM calls `0`, input tokens `0`, output tokens `0`, LLM errors `0`, and reported LLM cost `$0.00`. This means no external model was called and no model-token charges were incurred for that run. It is **not** a measurement of the cost of an API-enabled run. If an API-enabled run is required, configure `OPENAI_API_KEY`, run `npm run pipeline`, and retain the newly generated log; actual provider billing should be calculated using the configured model's current rate. Never commit API keys.

## 10-minute Round 2 walkthrough

Suggested demo sequence (keep the screen share focused and show the actual files/results):

| Time | What to show | Key point |
|---|---|---|
| 0:00–1:00 | Open the live demo or `freight-watch-standalone.html` | Introduce the problem: identify unusual freight costs and avoid unsupported explanations. |
| 1:00–2:00 | Load sample data and run analysis | Show the findings table and the justified/unexplained distinction. |
| 2:00–3:30 | Expand “Read why” for one justified finding and one unexplained finding | A nearby note is not automatically accepted; route, dates, increase wording, and magnitude must fit. |
| 3:30–5:00 | Explain `src/lib/metrics.js` and `src/lib/verify.js` | Describe weekly cost per tonne-km, historical baseline, peer comparison, and deterministic verification. |
| 5:00–6:00 | Open `outputs/output.csv` beside `data/sample_output_format.csv` | Show matching column names/order and the generated flagged rows. |
| 6:00–7:00 | Run `npm test` | The recorded test suite passes 18/18 tests. |
| 7:00–8:00 | Open `outputs/eval_report.md` | Summarize labelled-event, clean-period, retrieval, and injection evaluation results, including known note-reader limitations. |
| 8:00–9:00 | Open `outputs/reproducibility_check.txt` and `outputs/repro/run1`–`run3` | Show the identical SHA-256 hashes and byte-for-byte reproducibility. |
| 9:00–10:00 | Open `outputs/token_cost_log.md` and close with limitations | Be transparent that this logged run made zero LLM calls; explain fallback behavior and what an API-enabled run would require. |

## How I checked it before submitting

The checks performed for this package include:

- `node --test tests/core.test.mjs tests/guardrails.test.mjs tests/retrieval.test.mjs tests/llm.test.mjs`: **18 passed, 0 failed**.
- `node scripts/repro.mjs`: **three fresh runs matched** for both `output.csv` and `weekly_metrics.csv`, byte-for-byte.
- CSV schema check: the output and sample template have the same eight columns in the same order; generated rows have eight fields.
- Independent recomputation and toy cases are covered by the core tests.
- `outputs/eval_report.md` contains the recorded labelled, clean-period, retrieval, and synthetic-injection evaluation results.
- `npm run build` succeeded in the prior local development check.

These checks increase confidence but do not guarantee that unfamiliar real-world notes will always be interpreted correctly. In the recorded evaluation, the rule-based note reader handled all 10 supplied notes correctly but only 5 of 12 new phrasings correctly; ambiguous or unfamiliar wording should remain subject to human review.

## Live deployment


For the Vite app, the production build command is `npm.cmd run build` and the output directory is `dist`. After pushing changes to the connected GitHub repository, Vercel can build and deploy the updated version.
