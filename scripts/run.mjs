// CLI pipeline: node scripts/run.mjs [--out-dir outputs] [--shipments data/shipment_records.csv] [--notes data/context_notes.csv]
import { fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { parseCSV, csvOut, iso } from '../src/lib/shared.js'
import { weekly } from '../src/lib/metrics.js'
import { parseNote } from '../src/lib/notes.js'
import { findings } from '../src/lib/verify.js'
import { explainWithLLM } from '../src/lib/llm.js'

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d }
const root = fileURLToPath(new URL('..', import.meta.url))
const outDir = arg('out-dir', root + 'outputs')
mkdirSync(outDir, { recursive: true })

const notes = parseCSV(readFileSync(arg('notes', root + 'data/context_notes.csv'), 'utf8')).map(parseNote)
const A = weekly(parseCSV(readFileSync(arg('shipments', root + 'data/shipment_records.csv'), 'utf8')))
const deterministicFindings = findings(A, notes)
const llmResult = await explainWithLLM(deterministicFindings)
const F = llmResult.findings

// output.csv: exact column contract of sample_output_format.csv
writeFileSync(outDir + '/output.csv', csvOut(F.map(r => ({ ...r, cost: String(+r.cost) }))))

const r6 = x => (Number.isNaN(x) ? '' : +x.toFixed(6))
const head = 'route,route_type,week_of,shipments_tonne_km,total_cost_inr,cost_per_tonne_km,prior_weeks_used,own_baseline,peer_baseline,vs_own,vs_similar,candidate'
writeFileSync(outDir + '/weekly_metrics.csv', [head, ...A.map(a => [a.route, a.type, iso(a.w), r6(a.tk), r6(a.c), r6(a.cpt), a.n, r6(a.base), r6(a.peer), r6(a.own), r6(a.sim), a.cand].join(','))].join('\n') + '\n')

// Token/cost log reports actual API usage, not estimates. Verdicts/note IDs remain deterministic.
const usage = llmResult.stats
const costNote = usage.enabled
  ? `Actual provider cost depends on the configured model's published rate; this log records usage but does not invent a dollar estimate.`
  : `No OPENAI_API_KEY was configured, so this run used the deterministic fallback and made no LLM calls. Set OPENAI_API_KEY and optionally OPENAI_MODEL to enable LLM-written explanations.`
writeFileSync(outDir + '/token_cost_log.md', `# Token / cost log (one full run over the entire shipment file)

| metric | value |
|---|---|
| LLM enabled | **${usage.enabled}** |
| Model | ${usage.model || 'none (offline fallback)'} |
| LLM calls | **${usage.calls}** |
| Input tokens | **${usage.inputTokens}** |
| Output tokens | **${usage.outputTokens}** |
| LLM errors / fallback rows | **${usage.errors}** |
| Dollar cost | ${usage.enabled ? 'Not estimated automatically; calculate from provider rate and recorded token usage.' : '$0.00'} |
| Route-weeks scanned / rows output | ${A.length} / ${F.length} |

${costNote}

Safety design: numerical metrics, anomaly flags, and matched_note_id are determined before the LLM call. The model can only rewrite explanations for already-justified rows. Its output is accepted only if it retains the exact note ID and route; otherwise the deterministic explanation is retained. LLM errors never change verdicts or IDs.
`)
console.log(`${A.length} route-weeks scanned, ${F.length} flagged rows -> ${outDir}/output.csv`)
