import { useState } from 'react'
import { csvOut } from '../lib/shared.js'

export default function Findings({ F }) {
  const [filter, setFilter] = useState('')
  const [copied, setCopied] = useState('Copy CSV')
  const rows = F.filter(r => !filter || r.flagged === filter)
  const copy = async () => {
    try { await navigator.clipboard.writeText(csvOut(F)); setCopied('Copied') } catch { setCopied('Copy blocked by browser') }
  }
  const short = s => s.split(' vs')[0]
  return (
    <section>
      <div className="row" style={{ marginTop: 12 }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter">
          <option value="">All findings</option>
          <option value="Yes">Unexplained only</option>
          <option value="No (justified)">Justified only</option>
        </select>
        <button className="ghost" onClick={copy}>{copied}</button>
      </div>
      <div className="wrap">
        <table>
          <thead><tr><th>Route</th><th>Week of</th><th>₹/t-km</th><th>vs own history</th><th>vs similar</th><th>Verdict</th><th>Why</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.route + r.week_of}>
                <td>{r.route}</td><td>{r.week_of}</td><td>{r.cost}</td><td>{short(r.own)}</td><td>{short(r.sim)}</td>
                <td><span className={`pill ${r.flagged === 'Yes' ? 'bad' : 'ok'}`}>{r.flagged === 'Yes' ? 'Unexplained' : `Justified ${r.note}`}</span></td>
                <td><details><summary>Read why</summary><p>{r.reason}</p></details></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
