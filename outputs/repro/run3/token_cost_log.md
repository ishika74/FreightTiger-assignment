# Token / cost log (one full run over the entire shipment file)

| metric | value |
|---|---|
| LLM enabled | **false** |
| Model | none (offline fallback) |
| LLM calls | **0** |
| Input tokens | **0** |
| Output tokens | **0** |
| LLM errors / fallback rows | **0** |
| Dollar cost | $0.00 |
| Route-weeks scanned / rows output | 728 / 19 |

No OPENAI_API_KEY was configured, so this run used the deterministic fallback and made no LLM calls. Set OPENAI_API_KEY and optionally OPENAI_MODEL to enable LLM-written explanations.

Safety design: numerical metrics, anomaly flags, and matched_note_id are determined before the LLM call. The model can only rewrite explanations for already-justified rows. Its output is accepted only if it retains the exact note ID and route; otherwise the deterministic explanation is retained. LLM errors never change verdicts or IDs.
