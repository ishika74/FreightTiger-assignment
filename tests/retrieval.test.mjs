import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseCSV } from '../src/lib/shared.js'
import { parseNote, covers } from '../src/lib/notes.js'
import { searchText, index, embed } from '../src/lib/retrieval.js'
import { QUERIES } from './retrieval_queries.mjs'
const notes = parseCSV(readFileSync(new URL('../data/context_notes.csv', import.meta.url), 'utf8')).map(parseNote)

test('embeddings are unit length and deterministic', () => {
  const a = embed('diesel prices rose'), b = embed('diesel prices rose')
  assert.deepEqual([...a], [...b]); assert.ok(Math.abs(a.reduce((s, x) => s + x * x, 0) - 1) < 1e-9)
})
test('free-text retrieval puts the right note first for every labelled query', () => {
  const s = searchText(notes)
  for (const [q, want] of QUERIES) assert.equal(s(q, 1)[0].n.id, want, q)
})
test('route-scoped retrieval only returns notes whose scope covers the route', () => {
  const idx = index(notes)
  for (const r of ['Chennai-Bangalore', 'Mumbai-Pune']) { const hits = idx(r); assert.ok(hits.length > 0 && hits.every(h => covers(h.n, r))) }
  assert.ok(index(notes)('Chennai-Bangalore').some(h => h.n.id === 'N001'))
})
