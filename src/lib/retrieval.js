// Vector retrieval over the notes. Two vector spaces, fused:
//  (1) sparse TF-IDF cosine, (2) dense hashed sub-word embeddings (1024-d, word + character-trigram features).
// Both are deterministic and offline. `VectorStore` is where a different embedding could be swapped in.
import { covers } from './notes.js'

const STOP = new Set('the a an of on in to and or for by with was were is are as at from this that it its be been after due not no all new'.split(' '))
const words = s => (s.toLowerCase().match(/[a-z]{2,}/g) || []).filter(w => !STOP.has(w))
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 } return h }
const DIM = 1024

export function embed(text) {
  const v = new Float64Array(DIM)
  const put = (k, x) => { v[fnv(k) % DIM] += (fnv(k + '#') & 1 ? -1 : 1) * x }
  for (const w of words(text)) { put('w:' + w, 1); const p = `<${w}>`; for (let i = 0; i < p.length - 2; i++) put('c:' + p.slice(i, i + 3), 0.4) }
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
  return v.map(x => x / n)
}
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)

export class VectorStore {
  constructor(items) { this.items = items.map(it => ({ ...it, vec: embed(it.text) })) }
  search(text, k = 5) {
    const q = embed(text)
    return this.items.map(it => ({ id: it.id, meta: it.meta, s: dot(q, it.vec) })).sort((a, b) => b.s - a.s || (a.id < b.id ? -1 : 1)).slice(0, k)
  }
}

function tfidfIndex(docs) {
  const tok = docs.map(d => words(d).filter(w => w.length > 2)), df = {}
  tok.forEach(d => new Set(d).forEach(w => df[w] = (df[w] || 0) + 1))
  const idf = w => Math.log((1 + docs.length) / (1 + (df[w] || 0))) + 1
  const vec = d => { const v = {}; d.forEach(w => v[w] = (v[w] || 0) + 1); for (const w in v) v[w] = (1 + Math.log(v[w])) * idf(w); return v }
  const norm = v => Math.sqrt(Object.values(v).reduce((s, x) => s + x * x, 0)) || 1
  const V = tok.map(vec)
  return text => { const q = vec(words(text).filter(w => w.length > 2)), qn = norm(q); return V.map(d => Object.keys(q).reduce((a, w) => a + q[w] * (d[w] || 0), 0) / (qn * norm(d))) }
}

export const routeQuery = route => `${route} ${route.replace('-', ' ')} freight cost increase surcharge higher prices disruption delay`

function ranker(notes) {
  const docs = notes.map(n => `${n.applies}. ${n.text}`), store = new VectorStore(notes.map((n, i) => ({ id: n.id, text: docs[i] }))), sparse = tfidfIndex(docs)
  return text => {
    const dense = new Map(store.search(text, notes.length).map(x => [x.id, x.s])), sp = sparse(text)
    return notes.map((n, i) => ({ n, s: 0.5 * dense.get(n.id) + 0.5 * sp[i] })).sort((a, b) => b.s - a.s || (a.n.id < b.n.id ? -1 : 1))
  }
}

/** route -> notes whose scope covers it, ranked by similarity to a "why did freight cost rise" query. */
export function index(notes) {
  const rank = ranker(notes)
  return route => rank(routeQuery(route)).filter(x => covers(x.n, route)).slice(0, 5)
}
/** free-text search over all notes (no route filter): used to evaluate retrieval quality on its own. */
export function searchText(notes) { const rank = ranker(notes); return (text, k = 3) => rank(text).slice(0, k) }
