# MAD → MIA daily flight deal agent — setup guide

Repo: **honey** (private, already created on GitHub)

See `architecture.svg` for the pipeline diagram.

## Progress so far

- [x] **Step 1** — Duffel test key, Anthropic Console key, Resend key all created
- [x] **Step 2** — GitHub repo `honey` created (private)
- [x] **Step 3** — Secrets added to `honey`: `DUFFEL_API_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `TO_EMAIL`
- [ ] **Step 4** — Clone `honey` locally, open in VS Code, build with Claude Code ← **you are here**
- [ ] Step 5 — Test locally
- [ ] Step 6 — Test the GitHub Action manually
- [ ] Step 7 — Go live (swap in the live Duffel key)

## The goal, restated

A script that runs **automatically, once a day, with no laptop involved**:
1. Asks Duffel for MAD→MIA fares across the next few months
2. Compares today's prices to a running history file, so it knows what's actually a *good* price vs just a normal one
3. Has Claude pick the best 3–5 deals and explain why in plain language
4. Emails you that shortlist via Resend

Nothing here books anything — it's read-only, search and notify.

## Step 1 — Accounts ✅ done

## Step 2 — GitHub repo ✅ done (`honey`)

## Step 3 — Secrets ✅ done

## Step 4 — Clone `honey` and build it with Claude Code ← next

1. On your Mac, clone the repo:
   ```
   git clone https://github.com/YOUR_USERNAME/honey.git
   cd honey
   ```
2. Copy `architecture.svg` and this `SETUP.md` into the `honey` folder so they live with the code
3. Open the `honey` folder in VS Code
4. Launch Claude Code and give it the build prompt below

### Build prompt for Claude Code

Paste this into Claude Code once it's open in the `honey` folder:

```
Build a Node.js project that runs as a scheduled GitHub Action:

1. fetch.js — calls the Duffel Offer Requests API for round trips from
   MAD to MIA across the next 3 months (sample a handful of departure
   dates, not every single day, to keep it fast), and collects the
   lowest fare per date.

2. history.json — a file this script reads and updates each run,
   storing date -> lowest fare seen, so we can compare today's prices
   against recent history.

3. analyze.js — sends the day's fares plus history.json to the Claude
   API (model: claude-haiku-4-5-20251001) and asks it to pick the
   3-5 best deals, with a one-line reason for each (e.g. "30% below
   the 30-day average" or "cheapest date this month").

4. email.js — formats the result as a clean HTML email and sends it
   via the Resend API to the TO_EMAIL secret.

5. index.js — runs fetch -> analyze -> email -> save history.json, in order.

6. .github/workflows/daily.yml — a GitHub Actions workflow that runs
   index.js daily at 7am Madrid time, and also supports manual
   workflow_dispatch triggering for testing. It should commit the
   updated history.json back to the repo after each run.

Read all API keys from environment variables (DUFFEL_API_KEY,
ANTHROPIC_API_KEY, RESEND_API_KEY, TO_EMAIL) — never hardcode them.
Use Duffel's test API for now; I'll switch to a live key once it works.
```

Let Claude Code scaffold it, then review the files it creates before running anything.

## Step 5 — Test locally first

```
export DUFFEL_API_KEY=your_test_key
export ANTHROPIC_API_KEY=your_key
export RESEND_API_KEY=your_key
export TO_EMAIL=you@example.com
node index.js
```

Check your inbox. Iterate with Claude Code until the email looks right.

## Step 6 — Test the GitHub Action manually

Push your code, go to the **Actions** tab in GitHub, select the workflow, and click **Run workflow** (this is what `workflow_dispatch` enables). Confirm it runs clean and the email arrives.

## Step 7 — Go live

1. Swap `DUFFEL_API_KEY` in GitHub secrets for your **live** Duffel key
2. Let the daily cron take over — no need to touch your Mac again
3. Check in on `history.json` occasionally to see your price trend build up

## Troubleshooting notes

- If Duffel test mode data looks unrealistic (fake prices/schedules), that's expected — sandbox data isn't live. Switch to the live key to see real fares.
- If the Action's commit-back step fails, make sure the workflow has `permissions: contents: write` set.
- If emails aren't arriving, check Resend's dashboard logs before assuming the script is broken — it usually flags spam-filtering or unverified sender issues clearly.
