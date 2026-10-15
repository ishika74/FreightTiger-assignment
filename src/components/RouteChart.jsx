import { useMemo, useState } from 'react'
import { iso } from '../lib/shared.js'

const W = 700, H = 300, P = 36

export default function RouteChart({ A, F }) {
  const routes = useMemo(() => [...new Set(A.map(a => a.route))], [A])
  const [route, setRoute] = useState(routes[0])
  const d = A.filter(a => a.route === route)
  const flags = new Map(F.filter(r => r.route === route).map(r => [r.week_of, r]))
  const vals = d.flatMap(a => [a.cpt, a.base]).filter(v => !isNaN(v))
  const lo = Math.min(...vals) * 0.97, hi = Math.max(...vals) * 1.03
  const x0 = d[0].w, x1 = d[d.length - 1].w
  const X = w => P + ((w - x0) / (x1 - x0)) * (W - 2 * P)
  const Y = v => H - P - ((v - lo) / (hi - lo)) * (H - 2 * P)
  const line = k => d.filter(a => !isNaN(a[k])).map(a => `${X(a.w).toFixed(1)},${Y(a[k]).toFixed(1)}`).join(' ')
  return (
    <div className="panel">
      <select value={route} onChange={e => setRoute(e.target.value)} aria-label="Route">{routes.map(r => <option key={r}>{r}</option>)}</select>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Weekly cost per tonne-km">
        {[0, 1, 2, 3, 4].map(i => { const v = lo + ((hi - lo) * i) / 4; return (
          <g key={i}><line x1={P} x2={W - P} y1={Y(v)} y2={Y(v)} stroke="var(--ln)" /><text x={P - 6} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="var(--mu)">{v.toFixed(2)}</text></g>) })}
        <text x={P} y={H - 10} fontSize="11" fill="var(--mu)">{iso(x0)}</text>
        <text x={W - P} y={H - 10} textAnchor="end" fontSize="11" fill="var(--mu)">{iso(x1)}</text>
        <polyline points={line('base')} fill="none" stroke="var(--mu)" strokeDasharray="4 3" />
        <polyline points={line('cpt')} fill="none" stroke="var(--ink)" strokeWidth="1.6" />
        {d.filter(a => flags.has(iso(a.w))).map(a => (
          <circle key={a.w} cx={X(a.w)} cy={Y(a.cpt)} r="5" fill={flags.get(iso(a.w)).flagged === 'Yes' ? 'var(--bad)' : 'var(--ok)'}><title>{`${iso(a.w)}: ${a.cpt.toFixed(2)}`}</title></circle>
        ))}
      </svg>
      <small>Line: weekly cost. Dashed: trailing 8-week baseline. Red dots: unexplained. Green dots: justified.</small>
    </div>
  )
}
