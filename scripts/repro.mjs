// Three untouched runs in fresh processes, then byte-compare every output file.
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'
const root = fileURLToPath(new URL('..', import.meta.url))
rmSync(root + 'outputs/repro', { recursive: true, force: true })
const files = ['output.csv', 'weekly_metrics.csv'], hash = {}, lines = ['Reproducibility check: 3 runs, each a fresh `node` process', '']
for (const i of [1, 2, 3]) {
  const dir = `${root}outputs/repro/run${i}`; mkdirSync(dir, { recursive: true })
  execFileSync('node', [root + 'scripts/run.mjs', '--out-dir', dir, ...process.argv.slice(2)], { stdio: 'ignore' })
  for (const f of files) { const h = createHash('sha256').update(readFileSync(`${dir}/${f}`)).digest('hex'); (hash[f] ??= []).push(h); lines.push(`${h}  run${i}/${f}`) }
}
lines.push('')
let ok = true
for (const f of files) { const same = new Set(hash[f]).size === 1; ok &&= same; lines.push(`${f}: ${same ? 'run1 == run2 == run3 (byte-identical, including reason text)' : 'DIFFERENCE FOUND'}`) }
writeFileSync(root + 'outputs/reproducibility_check.txt', lines.join('\n') + '\n')
console.log(lines.join('\n')); process.exit(ok ? 0 : 1)
