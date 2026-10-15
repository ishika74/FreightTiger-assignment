@echo off
REM Runs everything with plain Node (no npm, no PowerShell permissions needed).
cd /d "%~dp0"
node scripts\run.mjs
node --test tests\core.test.mjs tests\guardrails.test.mjs tests\retrieval.test.mjs
node tests\eval.mjs
node scripts\repro.mjs
echo.
echo Done. Open the outputs folder, and double-click freight-watch-standalone.html
pause
