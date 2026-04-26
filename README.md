# Sazaan Lead Engine — USA Edition

Internal-only lead generation dashboard for Sazaan Studios. Targets cafes and clinics across the USA. Scrapes Yelp + Yellow Pages, qualifies leads based on website health and review data, and organizes them into campaigns for outreach.

## Monorepo Structure

- `apps/web`: Next.js 14 dashboard (deployed on Vercel).
- `apps/scraper`: Node.js worker with Playwright (deployed on Railway).
- `packages/shared`: Shared TypeScript types and constants.

## Setup Instructions

### 1. Prerequisites
- Node.js 20+
- pnpm 9+
- Supabase account
- Railway account (for scraper)
- Vercel account (for web)

### 2. Environment Variables

**apps/web/.env.local:**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**apps/scraper/.env:**
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NODE_ENV=development
LOG_LEVEL=info
SCRAPER_CONCURRENCY=1
```

### 3. Database Setup
1. Create a new Supabase project.
2. Run the SQL schema from `SAZAAN_LEAD_ENGINE_USA.md` Section 3.1 in the Supabase SQL Editor.
3. Generate types: `pnpm types` (requires `SUPABASE_PROJECT_ID` env var).

### 4. Seed Data
1. Download US ZIPs dataset from SimpleMaps (free version).
2. Place at `apps/scraper/data/uszips.csv`.
3. Run `pnpm --filter scraper seed:zips`.

## Running Locally

```bash
# Install dependencies
pnpm install

# Run web dashboard
pnpm dev:web

# Run scraper worker
pnpm dev:scraper
```

## Deployment

### Web (Vercel)
1. Connect this repo to Vercel.
2. Set Root Directory to `apps/web`.
3. Add all environment variables from `apps/web/.env.local`.

### Scraper (Railway)
1. Connect this repo to Railway.
2. Set Root Directory to `apps/scraper`.
3. Railway will automatically detect the `Dockerfile` and `railway.toml`.
4. Add all environment variables from `apps/scraper/.env`.
5. Ensure the service has enough RAM (~1GB recommended for Playwright).

## Adding a New Niche
Modify the `niche` check in `ingestion_jobs` table and `leads` table in Supabase, then update the UI selectors and scraper query logic.

## Troubleshooting
- **Scraper blocked:** Use US residential proxies if Yelp/YP trigger CAPTCHAs.
- **Railway costs:** Set to "scale to zero" and use a cron job to wake up if pending jobs exist.
- **Type errors:** Run `pnpm types` to sync with your Supabase schema.

---
Built with ❤️ by Baloch — Sazaan Studios.
Reference Section 11 of SAZAAN_LEAD_ENGINE_USA.md.
