# Freight Watch: shipping-cost assistant (JavaScript / React)

**Live demo:** https://freight-tiger-assignment-nmvl.vercel.app/

**Source repository:** https://github.com/ishika74/FreightTiger-assignment

## 1. Project Overview

Freight Watch is a freight-cost anomaly detection project developed for the FreightTiger assignment.

It analyses shipment records by route and week, identifies unusual increases in freight cost, compares each route against its historical performance and similar routes, and checks whether supplied context notes provide a plausible explanation for an anomaly.

The system separates numerical detection from explanation verification. A context note is not accepted merely because it mentions a similar route, date, or topic. It must pass the implemented verification checks.

The project combines deterministic data processing, custom text retrieval, context-note verification, automated tests, and an optional Gemini API integration.

## 2. Key Features

- Weekly route-level freight-cost analysis.
- Historical cost comparison using prior observations.
- Same-week comparison against routes with the same route type.
- Context-note retrieval and verification.
- Separate treatment of explained and unexplained anomalies.
- CSV output following the supplied sample format.
- Automated testing and reproducibility checks.
- Optional Gemini-assisted rewriting of verified explanations.
- Offline fallback when the external LLM is unavailable or not configured.

## 3. Technology Stack

- JavaScript and Node.js for the analysis pipeline.
- React and Vite for the web application.
- CSV files for input data and generated results.
- Custom text retrieval combining TF-IDF and hashed word and character-trigram features.
- Google Gemini API for optional LLM-assisted explanation rewriting.
- Node.js testing tools for automated checks.

The retrieval component is a lightweight, custom implementation. It should not be described as a hosted embedding model or a fully semantic retrieval system.

## 4. Input Data

The project uses the shipment records, route information, context notes, and sample output format provided for the assignment.

The analysis uses the available shipment dates, routes, route types, quantities, distances, and freight costs. Context notes are considered as possible explanations for flagged route-weeks.

Results depend on the supplied data, data quality, and configured detection rules.

## 5. Methodology

### 5.1 Weekly aggregation

Shipment records are grouped by route and Monday-starting calendar week. Each week covers Monday through Sunday.

The weekly cost per tonne-kilometre is calculated as:

`cost_per_tonne_km = total freight cost / total tonne-kilometres`

where:

`total tonne-kilometres = sum(quantity in tonnes × distance in kilometres)`

The program aggregates freight costs and tonne-kilometres before calculating the ratio, rather than taking a simple average of individual shipment rates.

### 5.2 Historical baseline

The historical baseline is calculated using up to eight available prior weekly cost-per-tonne-kilometre observations for the same route.

- The current week is excluded from its historical baseline.
- When fewer than eight prior observations are available, the available prior observations are used.
- Missing weeks are not automatically filled with synthetic values.
- The implementation requires at least four prior observations for anomaly detection.

This is the project's implemented interpretation of the historical comparison requirement.

### 5.3 Peer baseline

The peer baseline is the average cost per tonne-kilometre for other routes of the same `route_type` in the same week.

The route being evaluated is excluded from its own peer baseline. This prevents the current route from influencing its comparison group.

### 5.4 Anomaly detection

The current implementation uses the following configured rules:

- **Historical rule:** The current cost is at least 10% above the route's historical baseline.
- **Peer rule:** The current cost is at least 20% above the peer baseline and at least 3% above its own historical baseline.

A route-week is flagged if either rule is satisfied and sufficient historical observations are available.

These thresholds are project-specific heuristics. They are not universal definitions of a freight-cost anomaly, and their suitability depends on the data and assignment requirements.

### 5.5 Context-note retrieval

The retrieval component ranks candidate context notes using a combination of:

- TF-IDF text similarity.
- Hashed word features.
- Character-trigram features.

The retrieval stage proposes potentially relevant notes. Retrieval relevance alone does not establish that a note explains an observed increase.

### 5.6 Context-note verification

Candidate notes are checked against the implemented rules, including:

1. **Route scope:** Whether the note applies to the route or to all routes.
2. **Timing:** Whether the note applies to the relevant week.
3. **Direction of impact:** Whether the note describes a relevant cost increase rather than no impact or an improvement.
4. **Consistency:** Whether the note is compatible with the observed route and peer behaviour under the implemented checks.
5. **Magnitude:** Where applicable, whether the stated increase is consistent with the observed change.

A note that fails verification is not accepted as an explanation.

If no note passes verification, the finding remains unexplained. The system does not invent a cause to fill missing context.

### 5.7 Gemini API integration

The project includes an optional Google Gemini API integration for rewriting explanations after the numerical analysis and context-note verification stages.

The deterministic pipeline remains responsible for calculating metrics and determining anomaly verdicts. Gemini is not treated as the source of the underlying numerical results.

If the API is not configured, unavailable, or its output fails the implemented safeguards, the pipeline can use its deterministic fallback.

The recorded token and cost log must be interpreted according to the run it describes. A run that uses the fallback without making API requests must not be reported as a successful Gemini-enabled run.

## 6. Output Format

The primary findings CSV is `outputs/output.csv`.

It follows the eight-column schema supplied for the assignment:

| Column | Description |
|---|---|
| `route` | Route being evaluated |
| `week_of` | Monday starting the week |
| `cost_per_tonne_km` | Weekly freight cost per tonne-kilometre |
| `vs_own_history` | Comparison with the route's historical baseline |
| `vs_similar_routes` | Comparison with the same-week peer baseline |
| `flagged` | Whether the route-week meets the configured anomaly rules |
| `matched_note_id` | ID of the context note accepted by verification, when applicable |
| `reason` | Explanation or classification of the result |

The project also includes supporting metrics, evaluation, token/cost, and reproducibility artifacts under `outputs/`.

## 7. Setup and Execution

### Requirements

- Node.js 18 or newer.
- npm.
- A Gemini API key only when an API-enabled run is required.

### Install dependencies

```bash
npm install
```

### Run the analysis pipeline

Use the pipeline command defined in the repository's `package.json`:

```bash
npm run pipeline
```

The pipeline generates the findings and supporting output files.

### Run tests and evaluation

```bash
npm test
npm run eval
npm run repro
```

These commands test the implementation, evaluate the configured retrieval and verification behaviour, and check output reproducibility. The exact results should be taken from the latest generated reports.

### Run the web application

```bash
npm run dev
```

Open the local URL printed by Vite.

The repository also includes a standalone HTML demo, which can be opened in a browser if it is supported by the checked-in version.

## 8. Gemini API Configuration

The project uses Gemini configuration variables as implemented in `src/lib/llm.js`.

Configure the key locally rather than placing it in source code or committing it to GitHub.

**Windows PowerShell**

```powershell
$env:GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
npm run pipeline
```

**macOS/Linux**

```bash
export GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
npm run pipeline
```

If supported by the implementation, the model and base URL can be configured using:

- `GEMINI_MODEL`
- `GEMINI_BASE_URL`

Use the model and endpoint expected by the current code. Do not assume that setting the environment variable alone proves the API was called successfully.

After an API-enabled run, inspect the logs and outputs to verify that a real request occurred and that the recorded token usage and cost correspond to that run.

Never commit API keys, tokens, or other secrets to the repository.

## 9. Testing and Evaluation

The repository contains automated tests and evaluation artifacts for the data pipeline, retrieval behaviour, verification rules, and reproducibility.

The checked-in evaluation report records the following results for the evaluated version:

- 728 route-weeks analysed.
- 19 flagged route-week rows in the generated output.
- 18 automated tests passed.
- 7 of 7 hand-labelled events classified correctly in the recorded evaluation.
- 8 of 8 labelled retrieval queries returned the expected note first.
- Correct handling of 5 of 12 additional note phrasings in the reported note-reader evaluation.
- Identical output hashes across three recorded offline runs.

These are results from the documented evaluation, not guarantees of accuracy on unseen data. They should be regenerated if the source code, input data, or configuration changes.

## 10. Token Usage and Cost Reporting

The token and cost log records usage for a specific pipeline run.

The checked-in offline run reports zero LLM calls, zero input tokens, zero output tokens, and zero LLM cost. Those figures describe that recorded run only.

They must not be interpreted as evidence that a Gemini-enabled execution was performed. An API-enabled run should have its actual request count, token usage, and cost recorded when that information is available.

If the API does not return token usage or the provider's pricing information is not available to the logging implementation, the README and cost log should explicitly identify those values as unavailable or estimated rather than inventing exact numbers.

## 11. Reproducibility

The project includes a reproducibility script and saved run artifacts.

The checked-in report records matching output hashes across three offline runs. This supports the claim that the tested offline pipeline produced identical outputs for those runs.

Reproducibility does not, by itself, prove that every anomaly classification or context-note match is correct.

If source code, data, or configuration changes, regenerate the output files and reproducibility report so they describe the same version.

## 12. Limitations

- The anomaly thresholds are heuristics and may require calibration for different datasets.
- The results depend on the completeness and quality of the supplied shipment data and context notes.
- The custom retrieval system may not understand every paraphrase or unfamiliar wording.
- The reported note-reader evaluation indicates that additional wording variations remain a weakness.
- Conservative verification can leave genuine anomalies unexplained when supporting notes are ambiguous or do not match the implemented rules.
- The offline pipeline's zero-LLM-call cost log does not establish the cost of an API-enabled Gemini run.
- Results on the supplied dataset do not guarantee accuracy on future or unseen data.
- A matching hash across repeated runs establishes output consistency, not analytical correctness.

## 13. Suggested Demonstration

A short walkthrough can cover:

1. The purpose of weekly freight-cost anomaly detection.
2. The supplied shipment data and weekly aggregation formula.
3. The historical and peer baselines.
4. An example of a flagged route-week with an accepted context note.
5. An example of a flagged route-week that remains unexplained.
6. The generated CSV and its agreement with the supplied output schema.
7. The automated tests and evaluation report.
8. The reproducibility report and token/cost log.
9. The distinction between the deterministic offline pipeline and optional Gemini-assisted explanation rewriting.

## 14. Conclusion

Freight Watch provides a reproducible workflow for analysing weekly freight costs, identifying unusual increases, and evaluating potential explanations using supplied context notes.

The main design principle is to separate numerical detection from explanation verification. A context note is accepted only when it passes the implemented checks; otherwise, the finding remains unexplained.

The project includes automated tests and recorded evaluation evidence, while retaining documented limitations in note interpretation, threshold selection, and generalisation to unseen data.
