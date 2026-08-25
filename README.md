# Persistence Events

Automated event scraper → ICP relevance ranking → daily newsletter → filterable dashboard.
Built for Persistence (AI / voice-AI / founder ecosystem). Geography-configurable, starting with **Bengaluru**.

## What it does

1. **Scrapes** events from multiple platforms (Confs.tech, Eventbrite, 10times, Luma, Meetup, Partiful).
2. **Scores** each event 0–100 for Persistence ICP fit using Claude, and tags a category.
3. **Emails** a daily newsletter at **10:15 AM IST** via Kit (ConvertKit) Broadcast API, with a CTA to the dashboard.
4. **Dashboard** with filters, calendar, and newsletter history.

## Architecture

| Piece | Where it runs |
|---|---|
| `web/` — Next.js dashboard + settings + API | **Vercel** (git deploy) |
| `scraper/` — Playwright adapters + LLM scorer + newsletter sender | **GitHub Actions** (cron) |
| `shared/` — Drizzle schema, DB client, ICP definition, types | shared workspace |
| Postgres | **Neon** |

Scraping + newsletter run in GitHub Actions because headless Chromium isn't reliable on Vercel serverless.

## Setup

```bash
pnpm install
cp .env.example .env      # fill in DATABASE_URL, ANTHROPIC_API_KEY, KIT_API_KEY, etc.
pnpm db:push              # create tables in Neon
pnpm db:seed              # seed Bengaluru + sources + default settings
pnpm --filter @pe/scraper install-browsers   # local Playwright only
```

### Run locally

```bash
pnpm scrape                       # one full scrape + score pass
pnpm newsletter -- --dry-run      # render newsletter, no send
pnpm web:dev                      # dashboard at http://localhost:3000
```

## Deploy

- **Vercel**: import the repo, set **Root Directory = `web`**, add env vars
  (`DATABASE_URL`, `DASHBOARD_URL`, plus optional `GITHUB_REPO` + `GITHUB_DISPATCH_TOKEN` + `CRON_TRIGGER_SECRET` for the manual trigger).
- **GitHub Actions secrets**: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `EVENTBRITE_TOKEN`,
  `KIT_API_KEY`, `KIT_SUBSCRIBER_TAG_ID`, `DASHBOARD_URL`.
- Workflows: `.github/workflows/scrape.yml` (twice daily + manual) and `newsletter.yml` (10:15 IST + manual dry-run).

## Tuning ICP

Edit `shared/src/icp.ts` — it's the prompt Claude uses to score events. Re-scoring happens
automatically when event content changes.

## Notes on sources

- **Confs.tech** — fully working (open dataset).
- **Eventbrite / 10times / Luma / Meetup** — best-effort (no clean public APIs); each adapter
  is isolated so a broken selector degrades one source, never the whole run. Health shows in Settings.
- **Partiful** — placeholder (no public discovery feed).
