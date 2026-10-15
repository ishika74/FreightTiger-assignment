import { useState } from 'react'
import { answer } from '../lib/qa.js'

export default function Ask({ A, F }) {
  const [q, setQ] = useState('')
  const [ans, setAns] = useState('')
  const submit = () => setAns(answer(q, F, A))
  return (
    <div className="panel">
      <div className="row">
        <input type="text" aria-label="Question" value={q} placeholder="Why did Chennai-Bangalore get pricier in March?"
          onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
        <button onClick={submit}>Ask</button>
      </div>
      <pre>{ans}</pre>
    </div>
  )
}
