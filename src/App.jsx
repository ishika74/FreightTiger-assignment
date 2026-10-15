import { useState } from 'react'
import { parseCSV, SAMPLE_NOTES } from './lib/shared.js'
import { weekly } from './lib/metrics.js'
import { parseNote } from './lib/notes.js'
import { findings } from './lib/verify.js'
import Findings from './components/Findings.jsx'
import RouteChart from './components/RouteChart.jsx'
import Ask from './components/Ask.jsx'

const REQUIRED = ['origin', 'destination', 'route_type', 'quantity_tonnes', 'distance_km', 'freight_cost_inr', 'shipment_date']
const TABS = [['f', 'Findings'], ['c', 'Route chart'], ['a', 'Ask']]

export default function App() {
  const [shipFile, setShipFile] = useState(null)
  const [noteFile, setNoteFile] = useState(null)
  const [result, setResult] = useState(null) // { A: weekly rows, F: findings }
  const [msg, setMsg] = useState({ text: '', error: false })
  const [tab, setTab] = useState('f')

  async function analyse(shipText, notesText) {
    try {
      const rows = parseCSV(shipText)
      for (const c of REQUIRED) if (!(c in rows[0])) throw new Error(`Shipment file is missing column: ${c}`)
      const notes = parseCSV(notesText).map(parseNote)
      const A = weekly(rows)
      setResult({ A, F: findings(A, notes) })
      setMsg({ text: 'Done.', error: false })
    } catch (e) {
      setMsg({ text: e.message || 'Could not read that file.', error: true })
    }
  }
  const notesText = async () => (noteFile ? noteFile.text() : SAMPLE_NOTES)
  const onAnalyse = async () => {
    if (!shipFile) return setMsg({ text: 'Choose the shipment records CSV first, or use the sample data.', error: true })
    analyse(await shipFile.text(), await notesText())
  }
  const onSample = async () => analyse(await (await fetch(import.meta.env.BASE_URL + 'sample/shipment_records.csv')).text(), await notesText())
  const unexplained = result ? result.F.filter(r => r.flagged === 'Yes').length : 0

  return (
    <>
      <header>
        <h1>Freight Watch</h1>
        <p>Finds routes whose cost per tonne-km is rising for no good reason, and cites the exact note when there is one. Everything runs in your browser.</p>
      </header>
      <main>
        <div className="drop">
          <div><label htmlFor="fs">Shipment records (CSV)</label><br /><input id="fs" type="file" accept=".csv" onChange={e => setShipFile(e.target.files[0])} /></div>
          <div><label htmlFor="fn">Context notes (CSV)</label><br /><input id="fn" type="file" accept=".csv" onChange={e => setNoteFile(e.target.files[0])} /><br /><small>Optional: the 10 sample notes are built in.</small></div>
          <button onClick={onAnalyse}>Analyse</button>
          <button className="ghost" onClick={onSample}>Use sample data</button>
          <span role="status" className={msg.error ? 'err' : ''}>{msg.text}</span>
        </div>
        {result && (
          <>
            <div className="stats">
              <div className="stat"><b>{result.A.length}</b>route-weeks scanned</div>
              <div className="stat bad"><b>{unexplained}</b>unexplained</div>
              <div className="stat ok"><b>{result.F.length - unexplained}</b>justified by a note</div>
            </div>
            <nav role="tablist">
              {TABS.map(([k, label]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{label}</button>)}
            </nav>
            {tab === 'f' && <Findings F={result.F} />}
            {tab === 'c' && <RouteChart A={result.A} F={result.F} />}
            {tab === 'a' && <Ask A={result.A} F={result.F} />}
          </>
        )}
      </main>
    </>
  )
}
