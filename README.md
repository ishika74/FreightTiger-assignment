# Freight Tiger — Shipping Cost Anomaly Detection

Freight Tiger is a freight cost analysis application that identifies unusual changes in shipping costs across routes and weeks. It calculates cost per tonne-kilometre, compares current costs with historical and peer-route baselines, and checks whether contextual notes provide a plausible explanation for detected increases.

The project uses deterministic JavaScript for its core calculations and justification rules. An optional OpenAI-compatible language model can rewrite explanations for findings that have already passed verification. The model does not determine the numerical results or the final justification verdict.

## Features

- **Weekly freight analysis:** Calculates freight cost per tonne-kilometre for each route and week.
- **Historical baseline:** Compares weekly costs with the route's preceding observations.
- **Peer comparison:** Compares a route with other routes of the same type during the same week.
- **Anomaly detection:** Flags unusual increases using configurable thresholds.
- **Contextual note retrieval:** Finds potentially relevant notes using text similarity.
- **Rule-based verification:** Checks route scope, direction of impact, date coverage, peer differences and stated magnitude.
- **Interactive interface:** Displays findings, explanations, route charts and a question-and-answer interface.
- **Evaluation and testing:** Includes automated tests, evaluation reports and reproducibility checks.
- **Optional LLM integration:** Rewrites eligible explanations while retaining the deterministic verdict.
- **Offline support:** The core analysis pipeline does not require an API key.

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
├── data/                         # Input data and sample output format
├── outputs/                      # Analysis and evaluation results
├── public/sample/                 # Sample assets
├── scripts/                      # Pipeline and evaluation scripts
├── src/                           # Application and analysis logic
├── tests/                         # Automated tests
├── freight-watch-standalone.html  # Standalone browser demo
├── index.html                     # Web application entry point
├── package.json                   # Dependencies and npm scripts
├── package-lock.json              # Locked dependency versions
├── run_all.bat                    # Windows execution script
├── vite.config.js                 # Vite configuration
└── README.md
```

## Requirements

- Node.js 18 or later
- npm for installing dependencies and running the web application
- A modern web browser

The offline pipeline and automated tests can run directly with Node.js without installing npm dependencies, according to the project configuration.

## Getting Started

### Option 1: Open the standalone demo

1. Clone or download this repository.
2. Open `freight-watch-standalone.html` in a browser.
3. Explore the sample analysis or use the file-upload feature to try your own shipment CSV.

This standalone version does not require the React development server.

### Option 2: Run the React application

Clone the repository:

```bash
git clone https://github.com/ishika74/FreightTiger-assignment.git
cd FreightTiger-assignment
```

Install dependencies on Windows PowerShell:

```powershell
npm.cmd install
```

Start the development server:

```powershell
npm.cmd run dev
```

Open the local URL printed in the terminal, usually `http://localhost:5173`.

To create a production build:

```powershell
npm.cmd run build
```

Using `npm.cmd` is a Windows PowerShell workaround for environments where the `npm.ps1` script is blocked by the execution policy.

## Running the Analysis

The following commands are intended for the project's configured npm scripts.

### Run the freight analysis pipeline

```powershell
npm.cmd run pipeline
```

The pipeline processes the supplied data and generates analysis artifacts, including `outputs/output.csv` and `outputs/weekly_metrics.csv`.

### Run automated tests

```powershell
npm.cmd test
```

The project uses Node.js's built-in test runner.

### Run the evaluation suite

```powershell
npm.cmd run eval
```

The evaluation script records results in `outputs/eval_report.md`.

### Check reproducibility

```powershell
npm.cmd run repro
```

The reproducibility check runs the offline pipeline multiple times and compares generated output hashes.

### Compare JavaScript and Python results

```powershell
npm.cmd run parity
```

This compares the JavaScript results with the reference Python output, when the required reference file is available.

### Run the configured combined workflow

```powershell
npm.cmd run all
```

This runs the combined workflow defined in `package.json`. Review the terminal output to confirm that each step succeeds.

## How It Works

### 1. Weekly metric calculation

Shipment records are grouped into Monday-to-Sunday weeks.

The principal metric is:

`cost_per_tonne_km = total_freight_cost / total_tonne_km`

Records that fail the implementation's input checks are excluded from the calculations.

### 2. Baseline calculation

The system compares a route's weekly metric with the mean of up to eight preceding weekly observations. The current week is excluded from its own historical baseline.

It also compares the route with other routes of the same type in the same week, excluding the route being evaluated.

### 3. Anomaly detection

The configured rules identify route-weeks that exceed the defined historical or peer-comparison thresholds. Candidates require sufficient historical observations.

A flagged increase is a signal for further investigation, not proof of fraud or an incorrect invoice.

### 4. Note retrieval

The retrieval component ranks potentially relevant contextual notes using dense hashed text features and sparse TF-IDF similarity.

Retrieval suggests candidate explanations; similarity alone does not establish that a note explains a cost increase.

### 5. Deterministic verification

The verification component checks whether a candidate note matches the route, explicitly indicates a cost increase, covers the relevant period, is consistent with the peer comparison and has a compatible stated magnitude.

Only notes that pass the configured rules can justify a finding. Otherwise, the increase remains unexplained.

### 6. Explanation generation

The system creates explanations from the findings and the relevant note.

If an API key is configured, the command-line pipeline can optionally use an OpenAI-compatible model to rewrite explanations for already-verified findings. The deterministic fallback remains available without an API key.

### 7. Web interface

The React application allows users to load sample data, inspect findings, view route charts, read explanations and ask questions about the analysis.

## Output Files

| File | Purpose |
|---|---|
| `outputs/output.csv` | Flagged route-week findings and their explanations |
| `outputs/weekly_metrics.csv` | Calculated weekly route metrics |
| `outputs/eval_report.md` | Evaluation results |
| `outputs/reproducibility_check.txt` | Recorded reproducibility results |
| `outputs/token_cost_log.md` | Recorded model usage and cost information |

The generated files depend on the scripts executed and the available input data.

## Testing and Evaluation

The repository includes tests for metric calculations, historical baselines, peer comparisons, retrieval, and guardrails.

The committed project documentation reports the following results:

- 728 route-week calculations in the supplied dataset.
- 19 flagged route-week rows in the recorded output.
- 18 automated tests reported as passing.
- Identical output hashes across three recorded pipeline runs.
- 19 of 19 output rows matching the reference Python implementation.
- Correct handling of 10 of 10 supplied notes in the recorded note-reader evaluation, but only 5 of 12 notes with new phrasings.

These figures describe the results recorded in the repository. They should not be interpreted as proof that the current code has been tested in every environment or that every real-world explanation will be classified correctly.

To verify the current checkout, run the commands in the previous section and inspect their exit codes and output files.

## Limitations

- The rule-based note reader has limited performance on unfamiliar wording.
- Text similarity does not prove causation.
- The configured thresholds may need adjustment for different freight datasets.
- Missing or malformed input data can affect the available comparisons.
- An unexplained increase requires investigation rather than an automatic conclusion.
- LLM-generated wording may require human review.
- Reproducibility confirms consistent output for the tested conditions, not universal correctness.

## Security

- Never commit API keys, passwords or other credentials.
- Configure optional API credentials through environment variables.
- Review generated output files before sharing data that may be confidential.

## License

No license is declared in this README. Check the repository for an existing license before redistributing or reusing the code.

---

**Repository:** https://github.com/ishika74/FreightTiger-assignment

**Live demo:** https://freight-tiger-assignment-nmvl.vercel.app/
