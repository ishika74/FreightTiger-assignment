import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseCSV, day, iso } from '../src/lib/shared.js'
import { weekly } from '../src/lib/metrics.js'
import { parseNote, covers } from '../src/lib/notes.js'
import { findings, check } from '../src/lib/verify.js'

const rd = p => readFileSync(new URL('../data/' + p, import.meta.url), 'utf8')
const notes = parseCSV(rd('context_notes.csv')).map(parseNote), byId = Object.fromEntries(notes.map(n => [n.id, n]))
const A = weekly(parseCSV(rd('shipment_records.csv'))), F = findings(A, notes)
const routes = [...new Set(A.map(a => a.route))].sort(), weeks = [...new Set(A.map(a => a.w))].sort((a, b) => a - b)

test('note parsing: only N001, N002, N003 say costs went UP; N004 is out of scope', () => {
  assert.equal(iso(byId.N001.s) + ' ' + iso(byId.N001.e), '2025-02-24 2025-03-08')
  assert.deepEqual(byId.N003.mag, [0.05, 0.07]); assert.equal(byId.N003.kind, 'open_ended'); assert.equal(byId.N004.scope.size, 0)
  assert.deepEqual(notes.filter(n => n.raises).map(n => n.id), ['N001', 'N002', 'N003'])
})

const accepted = (own, sim) => { const s = new Set(); for (const n of notes) for (const r of routes) for (const w of weeks) if (check(n, r, w, own, sim).ok) s.add(`${n.id}|${r}|${iso(w)}`); return s }

test('adversarial matrix: every note x every route x every week (7,280 attempts) - only real causes pass', () => {
  const exp = new Set(['N001|Chennai-Bangalore|2025-02-24', 'N001|Chennai-Bangalore|2025-03-03', 'N002|Ahmedabad-Mumbai|2025-01-20'])
  for (const r of routes) for (let i = 0; i < 8; i++) exp.add(`N003|${r}|${iso(day('2025-05-05') + 7 * i)}`)
  assert.equal(notes.length * routes.length * weeks.length, 7280)
  assert.deepEqual([...accepted(0.08, 0)].sort(), [...exp].sort())
})
test('a market-wide note cannot explain a route far above its peers', () => {
  const a = [...accepted(0.08, 0.3)]; assert.ok(!a.some(x => x.startsWith('N003'))); assert.ok(a.some(x => x.startsWith('N001')))
})
test('a note cannot explain a rise far above its stated 5-7% magnitude', () => assert.ok(![...accepted(0.3, 0)].some(x => x.startsWith('N003'))))

test('every justified row cites a note that covers the route, the week, says costs rose, and is quoted', () => {
  const j = F.filter(r => r.flagged !== 'Yes'); assert.ok(j.length > 0)
  for (const r of j) { const n = byId[r.note], w = day(r.week_of)
    assert.ok(covers(n, r.route) && n.s <= w + 6 && w <= n.e && n.raises); assert.ok(r.reason.includes(n.id) && r.reason.includes(n.text)) }
})
test('unexplained rows have a blank note id and say they need review', () => {
  for (const r of F.filter(r => r.flagged === 'Yes')) { assert.equal(r.note, ''); assert.match(r.reason, /flagged for review|human review/) }
})
test('flood-aftermath weeks (outside the stated window) are not laundered into "justified"', () => {
  for (const w of ['2025-03-10', '2025-03-17']) assert.equal(F.find(r => r.route === 'Chennai-Bangalore' && r.week_of === w).flagged, 'Yes')
})
