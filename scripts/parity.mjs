// Proves the JS port gives the same answers as the Python project: node scripts/parity.mjs
import { readFileSync } from 'node:fs'
import { parseCSV, csvOut } from '../src/lib/shared.js'
import { weekly } from '../src/lib/metrics.js'
import { parseNote } from '../src/lib/notes.js'
import { findings } from '../src/lib/verify.js'
const rd = p => readFileSync(new URL(p, import.meta.url), 'utf8')
const A = weekly(parseCSV(rd('../data/shipment_records.csv')))
const F = findings(A, parseCSV(rd('../data/context_notes.csv')).map(parseNote))
const py = parseCSV(rd('../data/python_output.csv'))
const keys = [['route', 'route'], ['week_of', 'week_of'], ['cost_per_tonne_km', 'cost'], ['vs_own_history', 'own'], ['vs_similar_routes', 'sim'], ['flagged', 'flagged'], ['matched_note_id', 'note'], ['reason', 'reason']]
let bad = 0
if (F.length !== py.length) { console.log(`row count differs: js ${F.length} vs python ${py.length}`); bad++ }
py.forEach((p, i) => keys.forEach(([a, b]) => { const same = a === 'cost_per_tonne_km' ? Number(F[i]?.[b]) === Number(p[a]) : (F[i]?.[b] ?? '') === (p[a] ?? '')
  if (!same) { bad++; console.log(`row ${i} ${a}:\n js: ${F[i]?.[b]}\n py: ${p[a]}`) } }))
console.log(bad ? `PARITY FAILED (${bad} differences)` : `PARITY OK: ${F.length} rows identical to Python (all 8 columns, incl. reason text)`)
process.exit(bad ? 1 : 0)
