# FetLocationSweeper

A Playwright scraper that sweeps FetLife for location-based user data and exports results to CSV.

## Setup

```bash
npm install
```

## Usage

```bash
node scrape.js
```

Progress is saved to `scrape_progress.json` — if interrupted, re-running will resume from where it left off.

## Output

Results are written to `.csv` files in the project root.

## Notes

- Requires an active FetLife session — use `login.bat` to authenticate first
- `session/` stores a persistent Chromium profile and is gitignored
