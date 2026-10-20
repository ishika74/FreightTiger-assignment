# Freight Watch — Freight Cost Anomaly Detection

Freight Watch is a freight cost analysis application that identifies unusual changes in shipping costs across routes and weeks. It calculates cost per tonne-kilometre, compares current costs with historical and peer-route baselines, and evaluates contextual notes to determine whether a detected increase has a plausible explanation.

The application uses deterministic JavaScript for its core calculations and rule-based verification. An optional language model can rewrite explanations for findings that have already passed verification. Numerical calculations and justification decisions are handled by the application's rules rather than the language model.

## Live Demo

**Application:** https://freight-tiger-assignment-nmvl.vercel.app/

**GitHub repository:** https://github.com/ishika74/FreightTiger-assignment

## Features

- **Weekly freight metrics:** Calculates cost per tonne-kilometre for each route and week.
- **Historical baseline:** Compares weekly costs with previous observations for the same route.
- **Peer comparison:** Compares a route against other routes of the same type in the same week.
- **Anomaly detection:** Identifies route-week records that meet the configured investigation thresholds.
- **Contextual note retrieval:** Retrieves potentially relevant notes using text similarity.
- **Rule-based verification:** Checks route scope, cost-increase direction, date coverage, peer differences, and stated magnitude.
- **Interactive dashboard:** Displays findings, explanations, route charts, and a question-and-answer interface.
- **Automated testing:** Includes tests and evaluation scripts for checking application behavior.
- **Reproducibility checks:** Compares generated outputs across repeated runs.
- **Optional LLM integration:** Rewrites explanations for findings that have already passed the verification rules.
- **Offline analysis:** Core analysis can run without an API key.

## Technology Stack

- JavaScript (ES modules)
- React
- Vite
- Node.js
- Node.js built-in test runner
- CSV-based data processing
- Optional OpenAI-compatible API

## Project Structure

```text
FreightTiger-assignment/
├── data/                         # Input datasets
├── outputs/                      # Analysis and evaluation outputs
├── public/sample/                 # Sample assets
├── scripts/                      # Pipeline and evaluation scripts
├── src/                           # Application source code
│   └── lib/                       # Metrics, retrieval and verification logic
├── tests/                         # Automated tests
├── freight-watch-standalone.html  # Standalone browser demo
├── index.html                     # Web application entry point
├── package.json                   # Dependencies and npm scripts
├── package-lock.json              # Locked dependency versions
├── run_all.bat                    # Windows execution script
└── README.md
```

## Requirements

- Node.js 18 or later
- npm
- A modern web browser

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ishika74/FreightTiger-assignment.git
cd FreightTiger-assignment
```

### 2. Install dependencies

On Windows PowerShell, use:

```powershell
npm.cmd install
```

Using `npm.cmd` avoids PowerShell execution-policy issues that can prevent the `npm.ps1` script from running.

### 3. Start the development server

```powershell
npm.cmd run dev
```

Open the local URL displayed in the terminal, usually `http://localhost:5173`.

### 4. Build the application

```powershell
npm.cmd run build
```

This creates a production build if the configured build script completes successfully.

## Running the Analysis Pipeline

Run the available scripts from the project root.

### Run the pipeline

```powershell
npm.cmd run pipeline
```

The pipeline calculates freight metrics, evaluates flagged route-week records, and generates analysis outputs according to the project configuration.

### Run automated tests

```powershell
npm.cmd test
```

### Run the evaluation suite

```powershell
npm.cmd run eval
```

### Check reproducibility

```powershell
npm.cmd run repro
```

### Compare JavaScript results with the reference implementation

```powershell
npm.cmd run parity
```

### Run the combined workflow

```powershell
npm.cmd run all
```

These commands assume that the corresponding scripts exist in `package.json`. Review the terminal output and exit status to confirm that each command succeeds.

## How It Works

### 1. Weekly aggregation

Shipment records are grouped into Monday-to-Sunday weeks. The application calculates cost per tonne-kilometre using:

`cost_per_tonne_km = total_freight_cost / total_tonne_km`

Records that fail the implemented input-validation checks are excluded.

### 2. Historical comparison

The system compares each route's weekly cost metric with the mean of up to eight preceding weekly observations. The current week is excluded from its own historical baseline.

### 3. Peer comparison

The system compares a route against other routes of the same type during the same week, excluding the route being evaluated.

### 4. Anomaly detection

Configured thresholds identify route-week records that warrant further investigation based on historical changes and peer comparisons.

A flagged increase is a signal for review, not proof of fraud or an incorrect invoice.

### 5. Contextual note retrieval

The retrieval component ranks potentially relevant notes using text-similarity techniques, including dense hashed text features and sparse TF-IDF features.

Retrieved notes are candidates for verification; similarity alone does not establish that a note explains an increase.

### 6. Rule-based verification

The verification layer checks whether a candidate note:

- Applies to the route.
- Describes a cost increase.
- Covers the relevant period.
- Is consistent with the peer comparison.
- States a magnitude compatible with the observed increase, subject to the configured tolerance.

Only notes that pass the implemented checks can be accepted as justifications. Findings without an accepted explanation remain flagged for human review.

### 7. Explanation generation

The application generates explanations from calculated metrics and contextual notes. An optional language-model integration can rewrite explanations for findings that have already passed verification.

The core analysis and verification logic does not depend on the language model.

## Output Files

Depending on the scripts executed and their configuration, the project generates or uses files such as:

| File | Purpose |
|---|---|
| `outputs/output.csv` | Flagged route-week findings and explanations |
| `outputs/weekly_metrics.csv` | Calculated weekly route metrics |
| `outputs/eval_report.md` | Evaluation results |
| `outputs/reproducibility_check.txt` | Reproducibility results |
| `outputs/token_cost_log.md` | Recorded model usage and cost information |

## Testing and Evaluation

The repository includes automated tests and evaluation artifacts covering metric calculations, historical baselines, peer comparisons, retrieval, and verification rules.

Recorded evaluation results should be interpreted in the context of the dataset and test cases used. They do not guarantee correct behavior for every possible input or note phrasing.

For the current results, run the test, evaluation, and reproducibility commands and inspect their outputs.

## Limitations

- Rule-based note interpretation can struggle with unfamiliar wording.
- Text similarity does not establish causation.
- Thresholds and verification tolerances are assumptions that may require adjustment for different datasets.
- Missing, malformed, or incomplete shipment records can affect analysis.
- An unexplained cost increase requires investigation rather than an automatic conclusion.
- Language-model-generated wording may require human review.
- Reproducible outputs demonstrate consistency under tested conditions, not universal correctness.

## Security

- Never commit API keys or credentials.
- Store optional API credentials in environment variables.
- Review generated files before sharing data that may contain confidential information.

## License

Check the repository for an existing license before redistributing or reusing the project.

