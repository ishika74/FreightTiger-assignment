import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseCSV, day, iso, mon } from '../src/lib/shared.js'
import { weekly } from '../src/lib/metrics.js'
import { parseNote } from '../src/lib/notes.js'
import { findings } from '../src/lib/verify.js'

const rd = p => readFileSync(new URL('../data/' + p, import.meta.url), 'utf8')
const rows = parseCSV(rd('shipment_records.csv'))
const notes = parseCSV(rd('context_notes.csv')).map(parseNote)
const A = weekly(rows), F = findings(A, notes)
const ship = (route, type, date, t, km, c) => { const [origin, destination] = route.split('-'); return { origin, destination, route_type: type, quantity_tonnes: t, distance_km: km, freight_cost_inr: c, shipment_date: date } }

test('weeks run Monday-Sunday (Sunday maps back, year boundary ok)', () => {
  const got = ['2024-01-01', '2024-01-07', '2024-01-08', '2024-12-29', '2025-01-01'].map(d => iso(mon(day(d))))
  assert.deepEqual(got, ['2024-01-01', '2024-01-01', '2024-01-08', '2024-12-23', '2024-12-30'])
})

test('weekly cost per tonne-km is total cost / total tonne-km', () => {
  const w = weekly([ship('A-B', 'Short', '2024-01-01', 10, 100, 2000), ship('A-B', 'Short', '2024-01-07', 20, 200, 12000)])
  assert.equal(w.length, 1); assert.ok(Math.abs(w[0].cpt - 2.8) < 1e-12) // 14000 / 5000
})

test('baselines: strictly prior 8 weeks, fewer-than-8 uses all, peers exclude self', () => {
  const vals = [2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 5.0], rs = []
  vals.forEach((v, i) => { const d = iso(day('2024-01-01') + 7 * i); rs.push(ship('A-B', 'Medium', d, 10, 100, v * 1000), ship('C-D', 'Medium', d, 10, 100, 3000), ship('E-F', 'Medium', d, 10, 100, 4000)) })
  const ab = weekly(rs).filter(x => x.route === 'A-B'), avg = a => a.reduce((s, x) => s + x, 0) / a.length
  assert.ok(Number.isNaN(ab[0].base))
  assert.ok(Math.abs(ab[3].base - avg(vals.slice(0, 3))) < 1e-9); assert.equal(ab[3].n, 3)
  assert.ok(Math.abs(ab[9].base - avg(vals.slice(1, 9))) < 1e-9); assert.equal(ab[9].n, 8) // excludes the spike itself
  assert.ok(Math.abs(ab[9].peer - 3.5) < 1e-9); assert.ok(Math.abs(ab[9].sim - (5 / 3.5 - 1)) < 1e-9)
})

test('independent recomputation matches every one of the route-weeks', () => {
  const agg = new Map(), type = {}
  for (const r of rows) { const route = r.origin + '-' + r.destination, w = mon(day(r.shipment_date)), k = route + '|' + w, e = agg.get(k) ?? [0, 0]; e[0] += +r.freight_cost_inr; e[1] += r.quantity_tonnes * r.distance_km; agg.set(k, e); type[route] = r.route_type }
  const cpt = (route, w) => { const e = agg.get(route + '|' + w); return e && e[0] / e[1] }
  const routes = Object.keys(type), weeks = [...new Set(A.map(a => a.w))].sort((a, b) => a - b)
  for (const a of A) {
    assert.ok(Math.abs(a.cpt - cpt(a.route, a.w)) < 1e-9)
    const prior = weeks.filter(w => w < a.w && cpt(a.route, w)).slice(-8).map(w => cpt(a.route, w))
    if (prior.length) assert.ok(Math.abs(a.base - prior.reduce((s, x) => s + x, 0) / prior.length) < 1e-9)
    const peers = routes.filter(r => r !== a.route && type[r] === type[a.route] && cpt(r, a.w)).map(r => cpt(r, a.w))
    assert.ok(Math.abs(a.peer - peers.reduce((s, x) => s + x, 0) / peers.length) < 1e-9)
  }
  assert.equal(A.length, 728)
})

test("reproduces the brief's three sample rows exactly (numbers, verdict, note id)", () => {
  // the sample has unquoted commas in `reason` on row 3, so split each line on the first 7 commas only
  const lines = rd('sample_output_format.csv').split(/\r?\n/).filter(Boolean), cols = lines[0].split(',')
  for (const ln of lines.slice(1)) {
    const p = ln.split(','), s = Object.fromEntries(cols.map((c, i) => [c, i < 7 ? p[i] : p.slice(7).join(',')]))
    const m = F.find(r => r.route === s.route && r.week_of === s.week_of)
    assert.ok(m, `${s.route} ${s.week_of} not produced`)
    assert.equal(Number(m.cost), Number(s.cost_per_tonne_km)); assert.equal(m.own, s.vs_own_history); assert.equal(m.sim, s.vs_similar_routes)
    assert.equal(m.flagged, s.flagged); assert.equal(m.note, s.matched_note_id)
  }
})
