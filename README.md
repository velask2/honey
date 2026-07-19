# honey
The flight radar agent

A daily agent that checks MAD → MIA round-trip fares via Duffel, compares
them against a running price history, has Claude pick the 3-5 best deals,
and emails the shortlist via Resend. Runs on a schedule via GitHub Actions
— nothing books anything, it's read-only search and notify.

See [SETUP.md](SETUP.md) for the full setup guide.

## Local development

```
npm install
export DUFFEL_API_KEY=your_test_key
export ANTHROPIC_API_KEY=your_key
export RESEND_API_KEY=your_key
export TO_EMAIL=you@example.com
node index.js
```

## Files

- `fetch.js` — queries Duffel for MAD → MIA fares across the next 3 months
- `history.js` / `history.json` — tracks the lowest fare seen per date
- `analyze.js` — asks Claude to pick the best deals from today's fares
- `email.js` — sends the shortlist via Resend
- `index.js` — runs the pipeline end to end
- `.github/workflows/daily.yml` — the daily cron (plus manual trigger)
