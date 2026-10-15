import test from 'node:test'
import assert from 'node:assert/strict'
import { explainWithLLM } from '../src/lib/llm.js'

test('LLM disabled: offline fallback leaves findings unchanged', async () => {
  const input = [{ route: 'Ahmedabad-Mumbai', flagged: 'No (justified)', note: 'N002', reason: 'Original grounded reason' }]
  const got = await explainWithLLM(input, { apiKey: '' })
  assert.deepEqual(got.findings, input)
  assert.equal(got.stats.calls, 0)
  assert.equal(got.stats.enabled, false)
})

test('LLM can rewrite only accepted explanations and records actual usage', async t => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })
  globalThis.fetch = async () => new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify({ reason: 'Ahmedabad-Mumbai was affected according to note N002.' }) } }],
    usage: { prompt_tokens: 42, completion_tokens: 12 }
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  const input = [
    { route: 'Ahmedabad-Mumbai', flagged: 'No (justified)', note: 'N002', reason: 'Original grounded reason' },
    { route: 'Mumbai-Pune', flagged: 'Yes', note: '', reason: 'Unexplained' }
  ]
  const got = await explainWithLLM(input, { apiKey: 'test-key', model: 'test-model' })
  assert.equal(got.findings[0].reason, 'Ahmedabad-Mumbai was affected according to note N002.')
  assert.equal(got.findings[1].reason, 'Unexplained')
  assert.equal(got.stats.calls, 1)
  assert.equal(got.stats.inputTokens, 42)
  assert.equal(got.stats.outputTokens, 12)
})

test('LLM output that drops route or note ID is rejected', async t => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })
  globalThis.fetch = async () => new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify({ reason: 'Costs increased for unclear reasons.' }) } }], usage: {}
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  const input = [{ route: 'Ahmedabad-Mumbai', flagged: 'No (justified)', note: 'N002', reason: 'Original grounded reason' }]
  const got = await explainWithLLM(input, { apiKey: 'test-key' })
  assert.equal(got.findings[0].reason, 'Original grounded reason')
})
