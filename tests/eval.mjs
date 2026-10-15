// Eval harness: node tests/eval.mjs -> outputs/eval_report.md (hand-labelled events + synthetic injection)
import { readFileSync, writeFileSync } from 'node:fs'
import { parseCSV, day, iso, mon } from '../src/lib/shared.js'
import { weekly } from '../src/lib/metrics.js'
import { parseNote } from '../src/lib/notes.js'
import { findings } from '../src/lib/verify.js'
import { searchText } from '../src/lib/retrieval.js'
import { QUERIES } from './retrieval_queries.mjs'
import { CASES } from './note_cases.mjs'
const rd = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const rows = parseCSV(rd('data/shipment_records.csv')), notes = parseCSV(rd('data/context_notes.csv')).map(parseNote)
const A = weekly(rows), F = findings(A, notes), Fm = new Map(F.map(r => [r.route + '|' + r.week_of, r]))
// Labels come from reading the raw series and notes by eye (few, and written by the builder: a stated limitation).
const LABELS = [['Delhi-Jaipur', '2024-11-11', 'Yes', ''], ['Delhi-Jaipur', '2024-11-18', 'Yes', ''], ['Ahmedabad-Mumbai', '2025-01-20', 'No (justified)', 'N002'],
  ['Chennai-Bangalore', '2025-02-24', 'No (justified)', 'N001'], ['Chennai-Bangalore', '2025-03-03', 'No (justified)', 'N001'],
  ['Chennai-Bangalore', '2025-03-10', 'Yes', ''], ['Chennai-Bangalore', '2025-03-17', 'Yes', '']]
const CLEAN = day('2024-11-04'), DRIFT = day('2025-06-16')
let ok = 0
const lab = LABELS.map(([r, w, f, n]) => { const g = Fm.get(r + '|' + w), good = g?.flagged === f && g?.note === n; ok += good; return `| ${r} | ${w} | ${f} ${n} | ${g ? g.flagged + ' ' + g.note : '-'} | ${good ? 'PASS' : 'FAIL'} |` })
const drift = F.filter(r => r.route === 'Mumbai-Pune' && day(r.week_of) >= DRIFT), driftWeeks = A.filter(a => a.route === 'Mumbai-Pune' && a.w >= DRIFT).length
const cleanFP = F.filter(r => day(r.week_of) < CLEAN).length, cleanN = A.filter(a => a.w < CLEAN).length
const labelled = new Set(LABELS.map(l => l[0] + '|' + l[1]))
const others = F.filter(r => !labelled.has(r.route + '|' + r.week_of) && !(r.route === 'Mumbai-Pune' && day(r.week_of) >= DRIFT))

// Synthetic injection with a seeded PRNG (so the eval itself is reproducible)
const rng = (s => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 })(7)
const weeks = [...new Set(A.map(a => a.w))].sort((a, b) => a - b), routes = [...new Set(A.map(a => a.route))].sort(), used = new Set(), cells = []
for (const r of routes) { const idx = []; for (let t = 0; t < 10000 && idx.length < 3; t++) { const i = 10 + Math.floor(rng() * 34); if (used.has(i) || idx.some(j => Math.abs(i - j) < 8)) continue; idx.push(i); used.add(i); cells.push([r, weeks[i]]) } }
const cellSet = new Set(cells.map(([r, w]) => r + '|' + iso(w)))
const inj = [0.05, 0.08, 0.10, 0.12, 0.15, 0.20, 0.30].map(m => {
  const mod = rows.map(r => cellSet.has(r.origin + '-' + r.destination + '|' + iso(mon(day(r.shipment_date)))) ? { ...r, freight_cost_inr: +r.freight_cost_inr * (1 + m) } : r)
  const f = findings(weekly(mod), notes), got = new Map(f.map(x => [x.route + '|' + x.week_of, x]))
  const hit = [...cellSet].filter(c => got.has(c)), fp = f.filter(x => day(x.week_of) < CLEAN && !cellSet.has(x.route + '|' + x.week_of)).length
  return `| +${m * 100}% | ${hit.length}/${cellSet.size} | ${fp} | ${hit.filter(c => got.get(c).flagged !== 'Yes').length} |`
})
const srch = searchText(notes)
const top1 = QUERIES.filter(([q, w]) => srch(q, 1)[0].n.id === w).length, top3 = QUERIES.filter(([q, w]) => srch(q, 3).some(x => x.n.id === w)).length
const noteOk = CASES.filter(([t, w], i) => parseNote({ note_id: 'C', date: '2025-03-03', applies_to: 'All Routes', note: t }).raises === w)
const noteSup = CASES.slice(0, 10).filter(([t, w]) => parseNote({ note_id: 'C', date: '2025-03-03', applies_to: 'All Routes', note: t }).raises === w).length
const md = `# Evaluation report

## 1. Hand-labelled events

| route | week | expected | got | |
|---|---|---|---|---|
${lab.join('\n')}

- **Labelled rows correct**: ${ok}/${LABELS.length}
- **False flags in clean period (before 2024-11-04)**: ${cleanFP} of ${cleanN} route-weeks
- **Mumbai-Pune drift weeks flagged (from 2025-06-16)**: ${drift.length} of ${driftWeeks}; wrongly justified: ${drift.filter(r => r.flagged !== 'Yes').length}
- **Other flags outside labelled events**: ${others.map(r => `${r.route} ${r.week_of} (${r.flagged} ${r.note})`).join('; ') || 'none'}

## 1b. Retrieval quality (free-text queries, no route filter, ${QUERIES.length} labelled)

- **Top-1 correct**: ${top1}/${QUERIES.length}; **top-3 correct**: ${top3}/${QUERIES.length}

## 1c. Rule-based note reader (does the note say costs went UP?)

- 10 supplied notes: **${noteSup}/10** correct. 12 new, differently worded notes: **${noteOk.length - noteSup}/12** correct (misses stay "unexplained"; a few can read a negated rise as a rise).
- This is a known limit: the parser is tuned to the supplied notes' phrasing. Unfamiliar wording should be reviewed by a person.

## 2. Synthetic injection (${cellSet.size} clean route-weeks per magnitude, seeded)

| injected rise | detected | false flags elsewhere in clean period | injected weeks wrongly "justified" |
|---|---|---|---|
${inj.join('\n')}

Injected rises sit on top of ~3% normal weekly noise, so recall rises with size. Thresholds favour precision over catching small rises.
`
writeFileSync(new URL('../outputs/eval_report.md', import.meta.url), md); console.log(md)
