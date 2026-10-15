/** Optional OpenAI Chat Completions integration. The LLM rewrites explanations only for
 * rows already justified by the deterministic verifier; it cannot choose verdicts/note IDs. */
export async function explainWithLLM(findings, { apiKey = process.env.OPENAI_API_KEY,
  model = process.env.OPENAI_MODEL || 'gpt-4o-mini',
  baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1' } = {}) {
  const stats = { enabled: Boolean(apiKey), model: apiKey ? model : '', calls: 0, inputTokens: 0, outputTokens: 0, errors: 0 }
  if (!apiKey) return { findings, stats }
  const out = []
  for (const row of findings) {
    if (row.flagged === 'Yes' || !row.note) { out.push(row); continue }
    const payload = { route: row.route, week_of: row.week_of, cost_per_tonne_km: row.cost,
      own_comparison: row.own, peer_comparison: row.sim, accepted_note_id: row.note, verified_reason: row.reason }
    try {
      stats.calls++
      const res = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, temperature: 0,
          messages: [
            { role: 'system', content: 'Rewrite a concise explanation for a freight-cost anomaly. Use ONLY facts in the supplied JSON. Keep the exact accepted_note_id. Do not add causes, dates, amounts, or claims not present in the JSON. Return JSON only: {"reason":"..."}.' },
            { role: 'user', content: JSON.stringify(payload) }
          ], response_format: { type: 'json_object' } })
      })
      if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
      const data = await res.json()
      stats.inputTokens += data.usage?.prompt_tokens || 0
      stats.outputTokens += data.usage?.completion_tokens || 0
      const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}')
      const reason = String(parsed.reason || '').trim()
      if (reason && reason.length <= 900 && reason.includes(row.note) && reason.toLowerCase().includes(row.route.toLowerCase())) out.push({ ...row, reason })
      else out.push(row)
    } catch { stats.errors++; out.push(row) }
  }
  return { findings: out, stats }
}
