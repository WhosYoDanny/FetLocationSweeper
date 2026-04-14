# FetLocationSweeper — CLAUDE.md

## What This Is
A Playwright-based scraper for FetLife that sweeps location-based user data and exports results to CSV. Tracks scrape progress so runs can be resumed.

## Stack
- Node.js / Playwright
- CSV output
- JSON-based progress persistence

## Files
```
scrape.js               # Main scraper — Playwright automation logic
playwright.config.js    # Playwright configuration
login.bat               # Windows batch script to handle login flow
scrape_progress.json    # Resume checkpoint — tracks where the scrape left off
idaho_users.csv         # Example output — Idaho users
*.csv                   # Other output CSVs (various event/group scrapes)
session/                # Persistent Chromium session (large, gitignored)
```

## Running
```bash
npm install
node scrape.js
```

## Notes
- `session/` stores a persistent Chromium user data directory — keep gitignored, large
- `scrape_progress.json` is the resume checkpoint — don't delete mid-scrape
- Output CSVs are committed to the repo as data artifacts
- Tracked under the `WhosYoDanny` GitHub account, not DanielMadden
