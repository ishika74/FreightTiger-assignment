// Ask about the findings: node scripts/ask.mjs "why did Chennai-Bangalore get pricier in March?"
import { readFileSync } from 'node:fs'
import { parseCSV } from '../src/lib/shared.js'
import { weekly } from '../src/lib/metrics.js'
import { parseNote } from '../src/lib/notes.js'
import { findings } from '../src/lib/verify.js'
import { answer } from '../src/lib/qa.js'
const rd = p => readFileSync(new URL('../data/' + p, import.meta.url), 'utf8')
const A = weekly(parseCSV(rd('shipment_records.csv'))), F = findings(A, parseCSV(rd('context_notes.csv')).map(parseNote))
console.log(answer(process.argv.slice(2).join(' '), F, A))
