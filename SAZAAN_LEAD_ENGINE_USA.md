# Sazaan Lead Engine — USA Edition

**Document type:** Full product + engineering spec for Google Antigravity
**Owner:** Baloch — Sazaan Studios
**Target market:** USA only (cafes + clinics)
**Architecture:** Scraping-based (Yelp + Yellow Pages), zero API costs
**Tech stack:** Next.js 14 + Supabase + Railway + Playwright + TypeScript

---

## 0. HOW TO USE THIS DOCUMENT (for the AI agent)

Read the entire document before writing any code. Build order is non-negotiable — execute Phase 1 → 7 in sequence. Self-check after each phase.

**Critical rules:**
1. This is a TWO-APP project: `apps/web` (Next.js dashboard on Vercel) + `apps/scraper` (Node.js worker on Railway). They share types via `packages/shared`. Use a pnpm monorepo.
2. Use the exact Supabase schema in Section 3. Run as-is.
3. USA-only — every default, query, and filter assumes USA.
4. TypeScript strict mode. No `any` without `// reason:` comment.
5. The scraper MUST sleep when idle (Railway billing is per-second of compute).
6. After every phase, run the self-check before continuing.

---

## 1. PRODUCT OVERVIEW

### 1.1 What This Is

Internal-only lead generation dashboard for Sazaan Studios. Targets cafes and clinics across the USA. Scrapes Yelp + Yellow Pages, qualifies leads (especially businesses with broken/missing websites), filters by state/city/ZIP, exports curated lists for cold outreach.

### 1.2 Single User

- One operator (Baloch)
- No multi-tenancy, no public signup
- Auth: Supabase email magic link

### 1.3 USA Targeting

- All 50 states + DC
- City-level granularity (~19,000 incorporated cities)
- ZIP code radius search (5/10/25/50 mile options)
- Metro area grouping (DFW, NYC, Bay Area, etc.)
- Timezone-aware (EST/CST/MST/PST + AKST/HST)

### 1.4 Success Metrics for MVP

- Ingest 500+ US leads in 24 hours of runtime (laptop + Railway combo)
- Filter by state + city + has-website + rating in under 200ms
- One-click CSV export with timezone-aware "best time to call" column
- Auto-flag leads with broken/missing websites

### 1.5 Out of Scope

- Email sending (handled externally via n8n + Zoho)
- Multi-user permissions
- Mobile UI (desktop only)
- Email enrichment
- Non-US targeting

---

## 2. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL (FREE)                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Next.js Dashboard (apps/web)                               │ │
│  │ - Login, leads table, filters, campaigns, export           │ │
│  │ - API routes: /api/jobs/trigger, /api/leads/export         │ │
│  └────────────────┬───────────────────────────────────────────┘ │
└───────────────────┼─────────────────────────────────────────────┘
                    │
                    ▼  (writes job, status=pending)
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (FREE)                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Postgres + Realtime + Auth                                 │ │
│  │ Tables: leads, ingestion_jobs, campaigns, geo_zips         │ │
│  └────────────────┬───────────────────────────────────────────┘ │
└───────────────────┼─────────────────────────────────────────────┘
                    │  (realtime: notify scraper of new job)
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│              RAILWAY ($5 FREE CREDIT, ~3 WEEKS)                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Scraper Worker (apps/scraper)                              │ │
│  │ - Listens via Supabase realtime for new jobs               │ │
│  │ - Wakes up, scrapes Yelp + Yellow Pages                    │ │
│  │ - Writes leads to Supabase                                 │ │
│  │ - Sleeps when queue empty (preserves credits)              │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Key design choice — Supabase Realtime as the queue:**
No need for Redis or BullMQ. The scraper subscribes to `INSERT` events on `ingestion_jobs` table. New job inserted = scraper wakes up. Empty queue = scraper idles (~$0.001/hour on Railway).

---

## 3. SUPABASE SCHEMA

### 3.1 Run This SQL

```sql
-- =========================================
-- TABLE: us_states (reference data)
-- =========================================
create table public.us_states (
  code text primary key,
  name text not null,
  timezone text not null,
  region text not null check (region in ('northeast', 'midwest', 'south', 'west'))
);

insert into public.us_states (code, name, timezone, region) values
  ('AL', 'Alabama', 'America/Chicago', 'south'),
  ('AK', 'Alaska', 'America/Anchorage', 'west'),
  ('AZ', 'Arizona', 'America/Phoenix', 'west'),
  ('AR', 'Arkansas', 'America/Chicago', 'south'),
  ('CA', 'California', 'America/Los_Angeles', 'west'),
  ('CO', 'Colorado', 'America/Denver', 'west'),
  ('CT', 'Connecticut', 'America/New_York', 'northeast'),
  ('DE', 'Delaware', 'America/New_York', 'south'),
  ('DC', 'District of Columbia', 'America/New_York', 'south'),
  ('FL', 'Florida', 'America/New_York', 'south'),
  ('GA', 'Georgia', 'America/New_York', 'south'),
  ('HI', 'Hawaii', 'Pacific/Honolulu', 'west'),
  ('ID', 'Idaho', 'America/Boise', 'west'),
  ('IL', 'Illinois', 'America/Chicago', 'midwest'),
  ('IN', 'Indiana', 'America/Indiana/Indianapolis', 'midwest'),
  ('IA', 'Iowa', 'America/Chicago', 'midwest'),
  ('KS', 'Kansas', 'America/Chicago', 'midwest'),
  ('KY', 'Kentucky', 'America/New_York', 'south'),
  ('LA', 'Louisiana', 'America/Chicago', 'south'),
  ('ME', 'Maine', 'America/New_York', 'northeast'),
  ('MD', 'Maryland', 'America/New_York', 'south'),
  ('MA', 'Massachusetts', 'America/New_York', 'northeast'),
  ('MI', 'Michigan', 'America/Detroit', 'midwest'),
  ('MN', 'Minnesota', 'America/Chicago', 'midwest'),
  ('MS', 'Mississippi', 'America/Chicago', 'south'),
  ('MO', 'Missouri', 'America/Chicago', 'midwest'),
  ('MT', 'Montana', 'America/Denver', 'west'),
  ('NE', 'Nebraska', 'America/Chicago', 'midwest'),
  ('NV', 'Nevada', 'America/Los_Angeles', 'west'),
  ('NH', 'New Hampshire', 'America/New_York', 'northeast'),
  ('NJ', 'New Jersey', 'America/New_York', 'northeast'),
  ('NM', 'New Mexico', 'America/Denver', 'west'),
  ('NY', 'New York', 'America/New_York', 'northeast'),
  ('NC', 'North Carolina', 'America/New_York', 'south'),
  ('ND', 'North Dakota', 'America/Chicago', 'midwest'),
  ('OH', 'Ohio', 'America/New_York', 'midwest'),
  ('OK', 'Oklahoma', 'America/Chicago', 'south'),
  ('OR', 'Oregon', 'America/Los_Angeles', 'west'),
  ('PA', 'Pennsylvania', 'America/New_York', 'northeast'),
  ('RI', 'Rhode Island', 'America/New_York', 'northeast'),
  ('SC', 'South Carolina', 'America/New_York', 'south'),
  ('SD', 'South Dakota', 'America/Chicago', 'midwest'),
  ('TN', 'Tennessee', 'America/Chicago', 'south'),
  ('TX', 'Texas', 'America/Chicago', 'south'),
  ('UT', 'Utah', 'America/Denver', 'west'),
  ('VT', 'Vermont', 'America/New_York', 'northeast'),
  ('VA', 'Virginia', 'America/New_York', 'south'),
  ('WA', 'Washington', 'America/Los_Angeles', 'west'),
  ('WV', 'West Virginia', 'America/New_York', 'south'),
  ('WI', 'Wisconsin', 'America/Chicago', 'midwest'),
  ('WY', 'Wyoming', 'America/Denver', 'west');

-- =========================================
-- TABLE: geo_zips (ZIP → lat/lng/city/state)
-- Loaded from a free public dataset (see Section 5.4)
-- =========================================
create table public.geo_zips (
  zip text primary key,
  city text not null,
  state_code text not null references public.us_states(code),
  county text,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  population integer,
  metro_area text
);

create index idx_zips_state on public.geo_zips(state_code);
create index idx_zips_city on public.geo_zips(city, state_code);
create index idx_zips_metro on public.geo_zips(metro_area);
-- For radius queries
create index idx_zips_geo on public.geo_zips using gist (
  ll_to_earth(latitude::float8, longitude::float8)
);

-- Enable earthdistance extension for radius queries
create extension if not exists cube;
create extension if not exists earthdistance;

-- =========================================
-- TABLE: ingestion_jobs
-- =========================================
create table public.ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  niche text not null check (niche in ('cafe', 'clinic')),

  -- Geo targeting (one of these must be set)
  state_code text references public.us_states(code),
  city text,
  zip_code text,
  zip_radius_miles integer check (zip_radius_miles in (5, 10, 25, 50)),

  -- Sources to scrape
  sources text[] not null default array['yelp', 'yellow_pages']::text[],

  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),

  total_found integer default 0,
  total_inserted integer default 0,
  total_skipped_duplicate integer default 0,
  total_errors integer default 0,
  error_message text,

  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),

  constraint geo_required check (
    state_code is not null or city is not null or zip_code is not null
  )
);

create index idx_jobs_status on public.ingestion_jobs(status);
create index idx_jobs_created on public.ingestion_jobs(created_at desc);

-- =========================================
-- TABLE: leads
-- =========================================
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.ingestion_jobs(id) on delete set null,

  -- Core data
  business_name text not null,
  niche text not null check (niche in ('cafe', 'clinic')),

  -- US Geo (always set for USA)
  street_address text,
  city text not null,
  state_code text not null references public.us_states(code),
  zip_code text,
  metro_area text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  timezone text,  -- denormalized from us_states for fast queries

  -- Contact
  phone text,
  phone_normalized text,  -- E.164 format (+15125551234) for dedup
  website_url text,

  -- Social
  instagram_url text,
  facebook_url text,

  -- Source tracking (key for dedup across sources)
  yelp_id text unique,
  yelp_url text,
  yellow_pages_id text unique,
  yellow_pages_url text,
  primary_source text not null check (primary_source in ('yelp', 'yellow_pages')),

  -- Ratings
  yelp_rating numeric(2, 1) check (yelp_rating between 0 and 5),
  yelp_review_count integer default 0,

  -- Website health
  website_status text check (website_status in
    ('valid', 'no_website', 'broken_404', 'broken_dns', 'slow', 'ssl_error', 'timeout', 'pending', 'error')),
  website_load_time_ms integer,
  website_last_checked_at timestamptz,
  website_tech_stack jsonb,

  -- Qualification
  qualification_score integer default 0 check (qualification_score between 0 and 100),
  qualification_reasons text[],

  -- Pipeline
  pipeline_status text not null default 'new'
    check (pipeline_status in ('new', 'qualified', 'contacted', 'replied', 'meeting_booked', 'closed_won', 'closed_lost', 'dead', 'do_not_contact')),
  contacted_at timestamptz,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Critical indexes
create index idx_leads_state_city on public.leads(state_code, city);
create index idx_leads_zip on public.leads(zip_code);
create index idx_leads_metro on public.leads(metro_area);
create index idx_leads_niche on public.leads(niche);
create index idx_leads_website_status on public.leads(website_status);
create index idx_leads_pipeline on public.leads(pipeline_status);
create index idx_leads_score on public.leads(qualification_score desc);
create index idx_leads_phone_norm on public.leads(phone_normalized);
-- For radius queries
create index idx_leads_geo on public.leads using gist (
  ll_to_earth(latitude::float8, longitude::float8)
) where latitude is not null;

-- Auto-update trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on public.leads
  for each row execute function update_updated_at();

-- Auto-set timezone from state_code
create or replace function set_lead_timezone()
returns trigger as $$
begin
  if new.timezone is null and new.state_code is not null then
    select timezone into new.timezone from public.us_states where code = new.state_code;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger leads_set_timezone
  before insert or update of state_code on public.leads
  for each row execute function set_lead_timezone();

-- =========================================
-- TABLE: campaigns
-- =========================================
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  niche text check (niche in ('cafe', 'clinic')),
  target_states text[],
  status text not null default 'draft'
    check (status in ('draft', 'active', 'completed', 'archived')),
  total_leads integer default 0,
  exported_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.campaign_leads (
  campaign_id uuid references public.campaigns(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (campaign_id, lead_id)
);

create index idx_campaign_leads_lead on public.campaign_leads(lead_id);

-- =========================================
-- FUNCTION: calculate_qualification_score
-- =========================================
create or replace function calculate_qualification_score(p_lead_id uuid)
returns integer as $$
declare
  score integer := 0;
  l record;
begin
  select * into l from public.leads where id = p_lead_id;
  if not found then return 0; end if;

  -- Website signals (highest priority)
  if l.website_status = 'no_website' then score := score + 40;
  elsif l.website_status in ('broken_404', 'broken_dns', 'ssl_error') then score := score + 35;
  elsif l.website_status = 'slow' then score := score + 25;
  elsif l.website_status = 'timeout' then score := score + 20;
  end if;

  -- Tech stack penalties (Wix/Squarespace = easier sell)
  if l.website_tech_stack ? 'wix' and (l.website_tech_stack->>'wix')::boolean then
    score := score + 15;
  elsif l.website_tech_stack ? 'squarespace' and (l.website_tech_stack->>'squarespace')::boolean then
    score := score + 10;
  end if;

  -- Review count = established
  if l.yelp_review_count >= 100 then score := score + 25;
  elsif l.yelp_review_count >= 50 then score := score + 15;
  elsif l.yelp_review_count >= 20 then score := score + 10;
  end if;

  -- Rating sweet spot
  if l.yelp_rating between 3.5 and 4.3 then score := score + 20;
  elsif l.yelp_rating between 4.4 and 4.7 then score := score + 10;
  end if;

  -- Reachability
  if l.phone is not null then score := score + 10; end if;
  if l.instagram_url is not null then score := score + 5; end if;

  return least(score, 100);
end;
$$ language plpgsql;

create or replace function trigger_recalc_score()
returns trigger as $$
begin
  new.qualification_score := calculate_qualification_score(new.id);
  return new;
end;
$$ language plpgsql;

create trigger leads_recalc_score
  before update of website_status, website_tech_stack, yelp_rating, yelp_review_count, phone, instagram_url
  on public.leads
  for each row execute function trigger_recalc_score();

-- =========================================
-- FUNCTION: leads_within_radius
-- For ZIP radius search
-- =========================================
create or replace function leads_within_radius(
  p_zip text,
  p_radius_miles integer
)
returns setof public.leads as $$
declare
  center_lat numeric;
  center_lng numeric;
begin
  select latitude, longitude into center_lat, center_lng
  from public.geo_zips where zip = p_zip;

  if center_lat is null then return; end if;

  return query
  select * from public.leads
  where latitude is not null
    and earth_distance(
      ll_to_earth(center_lat::float8, center_lng::float8),
      ll_to_earth(latitude::float8, longitude::float8)
    ) <= p_radius_miles * 1609.34;
end;
$$ language plpgsql;

-- =========================================
-- VIEW: leads_enriched
-- =========================================
create or replace view public.leads_enriched as
select
  l.*,
  s.name as state_name,
  s.region as state_region,
  array_agg(distinct cl.campaign_id) filter (where cl.campaign_id is not null) as campaign_ids,
  count(distinct cl.campaign_id) as campaign_count
from public.leads l
left join public.us_states s on s.code = l.state_code
left join public.campaign_leads cl on cl.lead_id = l.id
group by l.id, s.name, s.region;

-- =========================================
-- RLS
-- =========================================
alter table public.leads enable row level security;
alter table public.ingestion_jobs enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_leads enable row level security;
alter table public.geo_zips enable row level security;
alter table public.us_states enable row level security;

create policy "auth_all_leads" on public.leads for all using (auth.role() = 'authenticated');
create policy "auth_all_jobs" on public.ingestion_jobs for all using (auth.role() = 'authenticated');
create policy "auth_all_campaigns" on public.campaigns for all using (auth.role() = 'authenticated');
create policy "auth_all_campaign_leads" on public.campaign_leads for all using (auth.role() = 'authenticated');
create policy "read_geo_zips" on public.geo_zips for select using (true);
create policy "read_states" on public.us_states for select using (true);

-- =========================================
-- ENABLE REALTIME on ingestion_jobs
-- (so scraper can listen for new jobs)
-- =========================================
alter publication supabase_realtime add table public.ingestion_jobs;
alter publication supabase_realtime add table public.leads;
```

### 3.2 Generate TypeScript Types

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > packages/shared/src/database.types.ts
```

### 3.3 Loading geo_zips Data

The `geo_zips` table needs ~33,000 rows of US ZIP data. Use the free `simplemaps` US ZIPs basic dataset:

1. Download from `https://simplemaps.com/data/us-zips` (free version, ~1.5MB CSV)
2. Place at `apps/scraper/data/uszips.csv`
3. Run seed script (provided in Section 5.4)

This is a one-time setup. No API needed.

---

## 4. USER STORIES

| ID | Story | Priority |
|----|-------|----------|
| US-01 | Trigger scrape for niche + state OR city OR ZIP+radius | P0 |
| US-02 | View live job progress via realtime | P0 |
| US-03 | Filter leads by state, city, ZIP, metro area | P0 |
| US-04 | Filter leads by has-website, rating, score, pipeline | P0 |
| US-05 | Auto-detect broken/missing websites | P0 |
| US-06 | Multi-select leads, add to campaign | P0 |
| US-07 | One-click CSV export with timezone column | P0 |
| US-08 | See "best time to call" badge per lead (timezone-aware) | P1 |
| US-09 | Update pipeline status | P1 |
| US-10 | Dedup across Yelp + Yellow Pages by phone+name | P0 |
| US-11 | Re-check website health on demand | P1 |
| US-12 | View leads on a US state map (cluster view) | P2 |

---

## 5. PROJECT STRUCTURE

### 5.1 Monorepo Layout

```
sazaan-lead-engine/
├── apps/
│   ├── web/                              # Next.js dashboard (Vercel)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/login/page.tsx
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── leads/page.tsx
│   │   │   │   │   ├── leads/[id]/page.tsx
│   │   │   │   │   ├── campaigns/page.tsx
│   │   │   │   │   ├── campaigns/[id]/page.tsx
│   │   │   │   │   ├── jobs/page.tsx
│   │   │   │   │   └── settings/page.tsx
│   │   │   │   └── api/
│   │   │   │       ├── jobs/trigger/route.ts
│   │   │   │       ├── leads/route.ts
│   │   │   │       ├── leads/export/route.ts
│   │   │   │       └── geo/cities/route.ts
│   │   │   ├── components/
│   │   │   │   ├── ui/                   # shadcn primitives
│   │   │   │   ├── aceternity/           # Aceternity components
│   │   │   │   ├── leads/
│   │   │   │   │   ├── leads-table.tsx
│   │   │   │   │   ├── leads-filters.tsx
│   │   │   │   │   ├── lead-detail-drawer.tsx
│   │   │   │   │   ├── bulk-actions-bar.tsx
│   │   │   │   │   ├── qualification-badge.tsx
│   │   │   │   │   ├── website-status-pill.tsx
│   │   │   │   │   ├── timezone-call-time-badge.tsx
│   │   │   │   │   └── us-map-view.tsx
│   │   │   │   ├── jobs/
│   │   │   │   │   ├── job-trigger-form.tsx
│   │   │   │   │   ├── geo-target-selector.tsx
│   │   │   │   │   ├── job-progress-card.tsx
│   │   │   │   │   └── job-history-table.tsx
│   │   │   │   ├── geo/
│   │   │   │   │   ├── state-multiselect.tsx
│   │   │   │   │   ├── city-autocomplete.tsx
│   │   │   │   │   └── zip-radius-input.tsx
│   │   │   │   ├── campaigns/
│   │   │   │   ├── shell/
│   │   │   │   └── shared/
│   │   │   ├── lib/
│   │   │   │   ├── supabase/
│   │   │   │   ├── hooks/
│   │   │   │   └── utils/
│   │   │   └── styles/globals.css
│   │   ├── package.json
│   │   ├── tailwind.config.ts
│   │   ├── next.config.mjs
│   │   └── tsconfig.json
│   │
│   └── scraper/                          # Node.js worker (Railway)
│       ├── src/
│       │   ├── index.ts                  # Entry: subscribes to jobs
│       │   ├── job-runner.ts             # Processes one job
│       │   ├── scrapers/
│       │   │   ├── yelp.ts
│       │   │   └── yellow-pages.ts
│       │   ├── workers/
│       │   │   ├── url-collector.ts
│       │   │   ├── detail-scraper.ts
│       │   │   └── website-health.ts
│       │   ├── stealth/
│       │   │   ├── browser-pool.ts
│       │   │   ├── user-agents.ts
│       │   │   ├── delays.ts
│       │   │   └── fingerprint.ts
│       │   ├── geo/
│       │   │   ├── seed-zips.ts          # One-time ZIP loader
│       │   │   └── geo-utils.ts
│       │   ├── lib/
│       │   │   ├── supabase.ts
│       │   │   ├── normalize.ts
│       │   │   ├── dedup.ts
│       │   │   └── logger.ts
│       │   ├── tech-detect/
│       │   │   ├── checker.ts
│       │   │   └── patterns.ts
│       │   └── config.ts
│       ├── data/
│       │   └── uszips.csv                # Downloaded once
│       ├── package.json
│       ├── tsconfig.json
│       ├── Dockerfile
│       └── railway.toml
│
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── database.types.ts
│       │   ├── types.ts
│       │   └── constants.ts
│       └── package.json
│
├── pnpm-workspace.yaml
├── package.json
├── .gitignore
└── README.md
```

### 5.2 Root package.json

```json
{
  "name": "sazaan-lead-engine",
  "private": true,
  "scripts": {
    "dev:web": "pnpm --filter web dev",
    "dev:scraper": "pnpm --filter scraper dev",
    "build:web": "pnpm --filter web build",
    "build:scraper": "pnpm --filter scraper build",
    "types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > packages/shared/src/database.types.ts"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

### 5.3 pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 5.4 apps/scraper/package.json

```json
{
  "name": "scraper",
  "version": "0.1.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "seed:zips": "tsx src/geo/seed-zips.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "playwright": "^1.46.0",
    "playwright-extra": "^4.3.6",
    "puppeteer-extra-plugin-stealth": "^2.11.2",
    "p-queue": "^8.0.1",
    "p-retry": "^6.2.0",
    "undici": "^6.19.0",
    "csv-parse": "^5.5.6",
    "zod": "^3.23.8",
    "pino": "^9.3.2",
    "@sazaan/shared": "workspace:*"
  },
  "devDependencies": {
    "tsx": "^4.16.0",
    "@types/node": "^20.14.0",
    "typescript": "^5.5.0"
  }
}
```

### 5.5 apps/web/package.json

```json
{
  "name": "web",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/ssr": "^0.4.0",
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-table": "^8.20.0",
    "@tanstack/react-virtual": "^3.10.0",
    "framer-motion": "^11.3.0",
    "lucide-react": "^0.408.0",
    "tailwindcss": "^3.4.7",
    "tailwind-merge": "^2.4.0",
    "tailwindcss-animate": "^1.0.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "nuqs": "^1.17.0",
    "zod": "^3.23.8",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.9.0",
    "date-fns": "^3.6.0",
    "date-fns-tz": "^3.1.3",
    "sonner": "^1.5.0",
    "cmdk": "^1.0.0",
    "papaparse": "^5.4.1",
    "react-simple-maps": "^3.0.0",
    "@radix-ui/react-checkbox": "^1.1.1",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.1",
    "@radix-ui/react-popover": "^1.1.1",
    "@sazaan/shared": "workspace:*"
  }
}
```

### 5.6 .env Files

**apps/web/.env.local:**
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**apps/scraper/.env (Railway env vars):**
```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NODE_ENV=production
LOG_LEVEL=info
SCRAPER_CONCURRENCY=1
USE_PROXY=false
PROXY_URL=
```

### 5.7 ZIP Seeding Script

```typescript
// apps/scraper/src/geo/seed-zips.ts
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { createClient } from '@supabase/supabase-js';

const METRO_MAPPING: Record<string, string> = {
  // Add common metros — extend as needed
  'Dallas,TX': 'DFW', 'Fort Worth,TX': 'DFW', 'Plano,TX': 'DFW',
  'Houston,TX': 'Greater Houston', 'Sugar Land,TX': 'Greater Houston',
  'Austin,TX': 'Austin Metro', 'Round Rock,TX': 'Austin Metro',
  'New York,NY': 'NYC Metro', 'Brooklyn,NY': 'NYC Metro', 'Queens,NY': 'NYC Metro',
  'Newark,NJ': 'NYC Metro', 'Jersey City,NJ': 'NYC Metro',
  'Los Angeles,CA': 'LA Metro', 'Long Beach,CA': 'LA Metro', 'Anaheim,CA': 'LA Metro',
  'San Francisco,CA': 'Bay Area', 'Oakland,CA': 'Bay Area', 'San Jose,CA': 'Bay Area',
  'Chicago,IL': 'Chicagoland', 'Naperville,IL': 'Chicagoland',
  'Miami,FL': 'South Florida', 'Fort Lauderdale,FL': 'South Florida',
  'Boston,MA': 'Greater Boston', 'Cambridge,MA': 'Greater Boston',
  'Seattle,WA': 'Puget Sound', 'Bellevue,WA': 'Puget Sound',
  'Atlanta,GA': 'Metro Atlanta', 'Marietta,GA': 'Metro Atlanta',
  'Phoenix,AZ': 'Phoenix Metro', 'Scottsdale,AZ': 'Phoenix Metro', 'Tempe,AZ': 'Phoenix Metro',
  'Denver,CO': 'Denver Metro', 'Aurora,CO': 'Denver Metro',
  'Washington,DC': 'DC Metro', 'Arlington,VA': 'DC Metro', 'Alexandria,VA': 'DC Metro',
};

async function seedZips() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const csvPath = path.join(__dirname, '../../data/uszips.csv');
  const rows: any[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row) => {
        const cityState = `${row.city},${row.state_id}`;
        rows.push({
          zip: row.zip,
          city: row.city,
          state_code: row.state_id,
          county: row.county_name || null,
          latitude: parseFloat(row.lat),
          longitude: parseFloat(row.lng),
          population: row.population ? parseInt(row.population) : null,
          metro_area: METRO_MAPPING[cityState] || null,
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Loaded ${rows.length} ZIPs from CSV. Inserting in batches...`);

  const BATCH_SIZE = 1000;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('geo_zips')
      .upsert(batch, { onConflict: 'zip' });

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE} failed:`, error);
    } else {
      console.log(`Inserted batch ${i / BATCH_SIZE + 1} of ${Math.ceil(rows.length / BATCH_SIZE)}`);
    }
  }

  console.log('ZIP seed complete.');
}

seedZips().catch(console.error);
```

---

## 6. SCRAPER ARCHITECTURE

### 6.1 Entry Point — Realtime Job Listener

```typescript
// apps/scraper/src/index.ts
import { createClient } from '@supabase/supabase-js';
import { runJob } from './job-runner';
import { logger } from './lib/logger';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

let isProcessing = false;

async function processNextJob() {
  if (isProcessing) return;

  // Look for the next pending job
  const { data: jobs, error } = await supabase
    .from('ingestion_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    logger.error({ err: error }, 'Failed to fetch jobs');
    return;
  }

  if (!jobs || jobs.length === 0) {
    logger.debug('No pending jobs');
    return;
  }

  isProcessing = true;
  const job = jobs[0];
  logger.info({ jobId: job.id, niche: job.niche, state: job.state_code }, 'Starting job');

  try {
    await runJob(job);
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'Job failed');
  } finally {
    isProcessing = false;
    // Check immediately if more jobs are queued
    setImmediate(processNextJob);
  }
}

// Listen for new jobs via realtime
supabase
  .channel('jobs-channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'ingestion_jobs',
  }, () => {
    logger.info('New job detected via realtime');
    processNextJob();
  })
  .subscribe((status) => {
    logger.info({ status }, 'Realtime subscription status');
  });

// Also poll every 60 seconds as a fallback
setInterval(processNextJob, 60000);

// Run once on startup to catch any pending jobs from before the worker started
processNextJob();

logger.info('Scraper worker started, listening for jobs');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await supabase.removeAllChannels();
  process.exit(0);
});
```

### 6.2 Job Runner — Decomposes Geo Targets

```typescript
// apps/scraper/src/job-runner.ts
import { createClient } from '@supabase/supabase-js';
import { scrapeYelp } from './scrapers/yelp';
import { scrapeYellowPages } from './scrapers/yellow-pages';
import { dedupAndInsert } from './lib/dedup';
import { checkWebsiteHealth } from './workers/website-health';
import { logger } from './lib/logger';
import type { Database } from '@sazaan/shared';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function runJob(job: Database['public']['Tables']['ingestion_jobs']['Row']) {
  await supabase
    .from('ingestion_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', job.id);

  try {
    // Determine search targets based on geo input
    const searchTargets = await resolveSearchTargets(job);
    logger.info({ targetCount: searchTargets.length }, 'Resolved search targets');

    let allLeads: any[] = [];

    for (const target of searchTargets) {
      const sources = job.sources || ['yelp', 'yellow_pages'];

      for (const source of sources) {
        try {
          const leads = source === 'yelp'
            ? await scrapeYelp({ niche: job.niche, ...target })
            : await scrapeYellowPages({ niche: job.niche, ...target });

          allLeads.push(...leads.map(l => ({ ...l, job_id: job.id })));

          // Update progress
          await supabase
            .from('ingestion_jobs')
            .update({ total_found: allLeads.length })
            .eq('id', job.id);
        } catch (err) {
          logger.error({ err, source, target }, 'Source scrape failed');
        }
      }
    }

    // Dedup across sources (by phone+name normalized) and insert
    const { inserted, skipped } = await dedupAndInsert(allLeads);

    // Trigger health checks (in same process, run async after job)
    setImmediate(() => runHealthChecksForJob(job.id));

    await supabase
      .from('ingestion_jobs')
      .update({
        status: 'completed',
        total_found: allLeads.length,
        total_inserted: inserted,
        total_skipped_duplicate: skipped,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    logger.info({ jobId: job.id, inserted, skipped }, 'Job completed');
  } catch (err: any) {
    await supabase
      .from('ingestion_jobs')
      .update({
        status: 'failed',
        error_message: err.message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);
    throw err;
  }
}

async function resolveSearchTargets(
  job: Database['public']['Tables']['ingestion_jobs']['Row']
): Promise<Array<{ city: string; state_code: string; zip?: string }>> {
  // Case 1: ZIP + radius — get all cities within radius
  if (job.zip_code && job.zip_radius_miles) {
    const { data: centerZip } = await supabase
      .from('geo_zips')
      .select('latitude, longitude')
      .eq('zip', job.zip_code)
      .single();

    if (!centerZip) throw new Error(`ZIP ${job.zip_code} not found`);

    // Get cities within radius
    const { data: zips } = await supabase.rpc('zips_within_radius', {
      p_zip: job.zip_code,
      p_radius_miles: job.zip_radius_miles,
    });

    const uniqueCities = new Map<string, { city: string; state_code: string }>();
    (zips || []).forEach((z: any) => {
      const key = `${z.city},${z.state_code}`;
      if (!uniqueCities.has(key)) {
        uniqueCities.set(key, { city: z.city, state_code: z.state_code });
      }
    });
    return Array.from(uniqueCities.values()).slice(0, 20); // Cap to avoid runaway
  }

  // Case 2: City + State — single target
  if (job.city && job.state_code) {
    return [{ city: job.city, state_code: job.state_code }];
  }

  // Case 3: State only — get top cities by population
  if (job.state_code) {
    const { data: cities } = await supabase
      .from('geo_zips')
      .select('city, state_code, population')
      .eq('state_code', job.state_code)
      .order('population', { ascending: false })
      .limit(10);

    const unique = new Map<string, { city: string; state_code: string }>();
    (cities || []).forEach((c: any) => {
      if (!unique.has(c.city)) unique.set(c.city, { city: c.city, state_code: c.state_code });
    });
    return Array.from(unique.values());
  }

  throw new Error('No valid geo target on job');
}

async function runHealthChecksForJob(jobId: string) {
  const { data: leads } = await supabase
    .from('leads')
    .select('id, website_url')
    .eq('job_id', jobId)
    .eq('website_status', 'pending')
    .not('website_url', 'is', null)
    .limit(200);

  for (const lead of leads || []) {
    try {
      const result = await checkWebsiteHealth(lead.website_url!);
      await supabase
        .from('leads')
        .update({
          website_status: result.status,
          website_load_time_ms: 'loadTime' in result ? result.loadTime : null,
          website_tech_stack: 'techStack' in result ? result.techStack : null,
          website_last_checked_at: new Date().toISOString(),
        })
        .eq('id', lead.id);
    } catch (err) {
      logger.error({ err, leadId: lead.id }, 'Health check failed');
    }
  }
}
```

Add this Postgres function for ZIP radius lookups:

```sql
create or replace function zips_within_radius(p_zip text, p_radius_miles integer)
returns table (zip text, city text, state_code text, population integer) as $$
declare
  center_lat numeric;
  center_lng numeric;
begin
  select latitude, longitude into center_lat, center_lng
  from public.geo_zips where geo_zips.zip = p_zip;

  if center_lat is null then return; end if;

  return query
  select z.zip, z.city, z.state_code, z.population
  from public.geo_zips z
  where earth_distance(
    ll_to_earth(center_lat::float8, center_lng::float8),
    ll_to_earth(z.latitude::float8, z.longitude::float8)
  ) <= p_radius_miles * 1609.34
  order by z.population desc nulls last;
end;
$$ language plpgsql;
```

### 6.3 Stealth Browser Pool

```typescript
// apps/scraper/src/stealth/browser-pool.ts
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { US_USER_AGENTS } from './user-agents';

chromium.use(StealthPlugin());

export async function createStealthBrowser() {
  const useProxy = process.env.USE_PROXY === 'true';
  const proxyUrl = process.env.PROXY_URL;

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--disable-gpu',
    ],
    proxy: useProxy && proxyUrl ? { server: proxyUrl } : undefined,
  });

  const userAgent = US_USER_AGENTS[Math.floor(Math.random() * US_USER_AGENTS.length)];

  const context = await browser.newContext({
    userAgent,
    viewport: {
      width: 1280 + Math.floor(Math.random() * 200),
      height: 800 + Math.floor(Math.random() * 200),
    },
    locale: 'en-US',
    timezoneId: 'America/New_York',  // US timezone — critical when scraping US sites from Karachi
    geolocation: { latitude: 40.7128, longitude: -74.0060 }, // NYC
    permissions: [],
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
    },
  });

  // Block heavy assets
  await context.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (['image', 'media', 'font'].includes(type)) return route.abort();
    return route.continue();
  });

  return { browser, context };
}
```

```typescript
// apps/scraper/src/stealth/user-agents.ts
export const US_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
];
```

```typescript
// apps/scraper/src/stealth/delays.ts
export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Human-like reading delay
export function readingDelay() {
  return randomDelay(2500, 5500);
}

// Between page navigations
export function navigationDelay() {
  return randomDelay(3000, 7000);
}

// Inside a search results page (scrolling, etc.)
export function interactionDelay() {
  return randomDelay(800, 2200);
}
```

### 6.4 Yelp Scraper

```typescript
// apps/scraper/src/scrapers/yelp.ts
import { createStealthBrowser } from '../stealth/browser-pool';
import { readingDelay, navigationDelay, interactionDelay } from '../stealth/delays';
import { normalizePhone } from '../lib/normalize';
import { logger } from '../lib/logger';

interface ScrapeParams {
  niche: 'cafe' | 'clinic';
  city: string;
  state_code: string;
}

const NICHE_QUERY = {
  cafe: 'coffee+%26+cafes',
  clinic: 'medical+clinics',
};

export async function scrapeYelp(params: ScrapeParams) {
  const { browser, context } = await createStealthBrowser();
  const page = await context.newPage();
  const results: any[] = [];

  try {
    const searchQuery = NICHE_QUERY[params.niche];
    const location = `${params.city}, ${params.state_code}`.replace(/\s/g, '+');
    const url = `https://www.yelp.com/search?find_desc=${searchQuery}&find_loc=${location}`;

    logger.info({ url }, 'Yelp search');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await readingDelay();

    // Yelp uses pagination — scrape first 3 pages (~30 results per page)
    for (let pageNum = 0; pageNum < 3; pageNum++) {
      // Wait for results
      await page.waitForSelector('[data-testid="serp-ia-card"], div.businessName__09f24__EYSZE, h3 a', { timeout: 15000 }).catch(() => {});

      // Get all business URLs on current page
      const businessUrls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('h3 a[href*="/biz/"]'));
        return links.map(a => (a as HTMLAnchorElement).href).filter(h => h.includes('/biz/'));
      });

      logger.info({ pageNum, count: businessUrls.length }, 'Yelp page collected URLs');

      // Visit each business detail page
      for (const bizUrl of businessUrls.slice(0, 30)) {
        try {
          await navigationDelay();
          await page.goto(bizUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
          await readingDelay();

          const detail = await page.evaluate(() => {
            const getText = (sel: string) =>
              document.querySelector(sel)?.textContent?.trim() || null;

            const name = getText('h1') || getText('[data-testid="businessName"]');

            // Phone
            const phone = Array.from(document.querySelectorAll('p, span'))
              .map(el => el.textContent?.trim())
              .find(t => t && /^\(\d{3}\)\s?\d{3}-\d{4}$/.test(t)) || null;

            // Address
            const addressEl = document.querySelector('address');
            const address = addressEl?.textContent?.trim() || null;

            // Website
            const websiteLink = Array.from(document.querySelectorAll('a[href*="/biz_redir"]'))
              .find(a => (a as HTMLAnchorElement).href.includes('url='));
            let website: string | null = null;
            if (websiteLink) {
              const url = new URL((websiteLink as HTMLAnchorElement).href);
              website = url.searchParams.get('url');
            }

            // Rating + review count
            const ratingText = document.querySelector('[role="img"][aria-label*="star rating"]')?.getAttribute('aria-label') || '';
            const ratingMatch = ratingText.match(/([\d.]+)\s*star/);
            const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

            const reviewCountText = Array.from(document.querySelectorAll('a[href$="?sort_by=date_desc"]'))
              .map(el => el.textContent || '')
              .find(t => /\d+\s*reviews?/i.test(t)) || '';
            const reviewMatch = reviewCountText.match(/(\d+)/);
            const review_count = reviewMatch ? parseInt(reviewMatch[1]) : 0;

            // Yelp ID from URL
            const pathMatch = window.location.pathname.match(/\/biz\/([^/?]+)/);
            const yelp_id = pathMatch ? pathMatch[1] : null;

            return {
              name,
              phone,
              address,
              website,
              rating,
              review_count,
              yelp_id,
              yelp_url: window.location.href.split('?')[0],
            };
          });

          if (detail.name && detail.yelp_id) {
            results.push({
              business_name: detail.name,
              niche: params.niche,
              street_address: detail.address,
              city: params.city,
              state_code: params.state_code,
              phone: detail.phone,
              phone_normalized: normalizePhone(detail.phone),
              website_url: detail.website,
              yelp_id: detail.yelp_id,
              yelp_url: detail.yelp_url,
              yelp_rating: detail.rating,
              yelp_review_count: detail.review_count,
              primary_source: 'yelp' as const,
              website_status: detail.website ? 'pending' : 'no_website',
            });
          }
        } catch (err) {
          logger.error({ err, bizUrl }, 'Yelp detail scrape error');
        }
      }

      // Go to next page
      if (pageNum < 2) {
        const nextButton = await page.$('a[aria-label="Next"]:not([aria-disabled="true"])');
        if (nextButton) {
          await nextButton.click();
          await navigationDelay();
        } else {
          break;
        }
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}
```

### 6.5 Yellow Pages Scraper

```typescript
// apps/scraper/src/scrapers/yellow-pages.ts
import { createStealthBrowser } from '../stealth/browser-pool';
import { readingDelay, navigationDelay } from '../stealth/delays';
import { normalizePhone } from '../lib/normalize';
import { logger } from '../lib/logger';

interface ScrapeParams {
  niche: 'cafe' | 'clinic';
  city: string;
  state_code: string;
}

const NICHE_QUERY = {
  cafe: 'coffee-shops',
  clinic: 'medical-clinics',
};

export async function scrapeYellowPages(params: ScrapeParams) {
  const { browser, context } = await createStealthBrowser();
  const page = await context.newPage();
  const results: any[] = [];

  try {
    const search = NICHE_QUERY[params.niche];
    const geo = `${params.city.replace(/\s/g, '+')}%2C+${params.state_code}`;
    const url = `https://www.yellowpages.com/search?search_terms=${search}&geo_location_terms=${geo}`;

    logger.info({ url }, 'Yellow Pages search');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await readingDelay();

    // Yellow Pages: scrape first 3 pages
    for (let pageNum = 1; pageNum <= 3; pageNum++) {
      await page.waitForSelector('div.result, .v-card', { timeout: 15000 }).catch(() => {});

      const pageResults = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('div.result, .v-card'));
        return cards.map(card => {
          const getText = (sel: string) =>
            card.querySelector(sel)?.textContent?.trim() || null;

          const name = getText('a.business-name span') || getText('.business-name');
          const phone = getText('.phones.phone.primary') || getText('.phone');
          const address = getText('.adr .street-address') || getText('.street-address');
          const locality = getText('.adr .locality') || getText('.locality');
          const websiteLink = card.querySelector('a.track-visit-website') as HTMLAnchorElement | null;
          const website = websiteLink?.href || null;
          const ypLink = card.querySelector('a.business-name') as HTMLAnchorElement | null;
          const ypUrl = ypLink?.href || null;
          const ratingEl = card.querySelector('.result-rating');
          const ratingClass = ratingEl?.className || '';
          // YP encodes rating in class name like 'four half', 'three', etc.
          const ratingMap: Record<string, number> = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
          };
          let rating: number | null = null;
          for (const [word, val] of Object.entries(ratingMap)) {
            if (ratingClass.includes(word)) {
              rating = val + (ratingClass.includes('half') ? 0.5 : 0);
              break;
            }
          }
          const reviewCountText = getText('.count');
          const reviewMatch = reviewCountText?.match(/(\d+)/);
          const review_count = reviewMatch ? parseInt(reviewMatch[1]) : 0;

          return { name, phone, address, locality, website, ypUrl, rating, review_count };
        });
      });

      logger.info({ pageNum, count: pageResults.length }, 'Yellow Pages page collected');

      for (const r of pageResults) {
        if (!r.name || !r.phone) continue;

        // Extract YP ID from URL
        const ypIdMatch = r.ypUrl?.match(/-(\d+)$/);
        const ypId = ypIdMatch ? ypIdMatch[1] : (r.ypUrl ? Buffer.from(r.ypUrl).toString('base64').slice(0, 32) : null);

        results.push({
          business_name: r.name,
          niche: params.niche,
          street_address: r.address,
          city: r.locality || params.city,
          state_code: params.state_code,
          phone: r.phone,
          phone_normalized: normalizePhone(r.phone),
          website_url: r.website,
          yellow_pages_id: ypId,
          yellow_pages_url: r.ypUrl,
          yelp_rating: r.rating,
          yelp_review_count: r.review_count,
          primary_source: 'yellow_pages' as const,
          website_status: r.website ? 'pending' : 'no_website',
        });
      }

      // Next page
      if (pageNum < 3) {
        const nextLink = await page.$('a.next');
        if (nextLink) {
          await nextLink.click();
          await navigationDelay();
        } else break;
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}
```

### 6.6 Dedup Logic (Cross-Source)

```typescript
// apps/scraper/src/lib/dedup.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@sazaan/shared';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function dedupAndInsert(leads: any[]) {
  // Step 1: dedup within incoming batch by normalized phone
  const seen = new Map<string, any>();
  for (const lead of leads) {
    if (!lead.phone_normalized) {
      // No phone — fall back to name+city key
      const key = `name:${lead.business_name?.toLowerCase()}:${lead.city?.toLowerCase()}:${lead.state_code}`;
      if (!seen.has(key)) seen.set(key, lead);
      continue;
    }
    const key = `phone:${lead.phone_normalized}`;
    if (seen.has(key)) {
      // Merge: prefer record with more data
      const existing = seen.get(key);
      seen.set(key, mergeLeads(existing, lead));
    } else {
      seen.set(key, lead);
    }
  }

  const deduped = Array.from(seen.values());

  // Step 2: insert with upsert. Use yelp_id, yellow_pages_id, or phone_normalized as conflict key
  let inserted = 0;
  let skipped = 0;

  for (const lead of deduped) {
    // Determine conflict key
    let conflictColumn = 'yelp_id';
    if (!lead.yelp_id && lead.yellow_pages_id) conflictColumn = 'yellow_pages_id';

    if (!lead.yelp_id && !lead.yellow_pages_id) {
      // No external ID — check by phone first
      if (lead.phone_normalized) {
        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('phone_normalized', lead.phone_normalized)
          .maybeSingle();
        if (existing) {
          skipped++;
          continue;
        }
      }
      // Insert without conflict key
      const { error } = await supabase.from('leads').insert(lead);
      if (error) {
        if (error.code === '23505') skipped++;
        else console.error('Insert error:', error);
      } else {
        inserted++;
      }
      continue;
    }

    const { error } = await supabase
      .from('leads')
      .upsert(lead, { onConflict: conflictColumn, ignoreDuplicates: true });

    if (error) {
      if (error.code === '23505') skipped++;
      else console.error('Upsert error:', error);
    } else {
      inserted++;
    }
  }

  return { inserted, skipped };
}

function mergeLeads(a: any, b: any) {
  // Prefer non-null values, prefer Yelp data for ratings
  return {
    ...a,
    ...b,
    business_name: a.business_name || b.business_name,
    phone: a.phone || b.phone,
    website_url: a.website_url || b.website_url,
    street_address: a.street_address || b.street_address,
    yelp_id: a.yelp_id || b.yelp_id,
    yelp_url: a.yelp_url || b.yelp_url,
    yellow_pages_id: a.yellow_pages_id || b.yellow_pages_id,
    yellow_pages_url: a.yellow_pages_url || b.yellow_pages_url,
    yelp_rating: a.yelp_rating ?? b.yelp_rating,
    yelp_review_count: Math.max(a.yelp_review_count || 0, b.yelp_review_count || 0),
    primary_source: a.yelp_id ? 'yelp' : (b.yelp_id ? 'yelp' : a.primary_source),
  };
}
```

### 6.7 Phone Normalization (US E.164)

```typescript
// apps/scraper/src/lib/normalize.ts
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, '');
  // US format: 10 digits or 11 with leading 1
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null; // Invalid
}
```

### 6.8 Website Health Check

```typescript
// apps/scraper/src/workers/website-health.ts
import { request } from 'undici';

export async function checkWebsiteHealth(url: string) {
  if (!url) return { status: 'no_website' as const };

  try {
    const start = Date.now();
    const response = await request(url, {
      method: 'GET',
      headersTimeout: 10000,
      bodyTimeout: 10000,
      maxRedirections: 3,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SazaanBot/1.0)',
      },
    });

    const loadTime = Date.now() - start;
    const statusCode = response.statusCode;

    if (statusCode === 404) return { status: 'broken_404' as const, loadTime };
    if (statusCode >= 500) return { status: 'broken_500' as const, loadTime };
    if (loadTime > 5000) return { status: 'slow' as const, loadTime };

    const html = await response.body.text();
    const techStack = detectTechStack(html);

    return { status: 'valid' as const, loadTime, techStack };
  } catch (err: any) {
    if (err.code === 'ENOTFOUND') return { status: 'broken_dns' as const };
    if (err.message?.includes('CERT')) return { status: 'ssl_error' as const };
    if (err.code === 'UND_ERR_HEADERS_TIMEOUT') return { status: 'timeout' as const };
    return { status: 'error' as const };
  }
}

function detectTechStack(html: string) {
  return {
    wordpress: /wp-content|wp-includes|\/wp-json\//i.test(html),
    wix: /wix\.com|_wixCIDX|static\.wixstatic\.com/i.test(html),
    squarespace: /squarespace\.com|sqsp\.net/i.test(html),
    shopify: /cdn\.shopify\.com|myshopify\.com/i.test(html),
    webflow: /webflow\.com|webflow\.io/i.test(html),
    nextjs: /__NEXT_DATA__|_next\/static/i.test(html),
    godaddy: /godaddy|secureserver/i.test(html),
  };
}
```

### 6.9 Railway Configuration

**apps/scraper/Dockerfile:**
```dockerfile
FROM node:20-slim

# Install Playwright deps
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/scraper/package.json ./apps/scraper/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# Install Playwright browser
RUN pnpm --filter scraper exec playwright install chromium

# Copy source
COPY packages/shared ./packages/shared
COPY apps/scraper ./apps/scraper

# Build
RUN pnpm --filter shared build
RUN pnpm --filter scraper build

CMD ["pnpm", "--filter", "scraper", "start"]
```

**apps/scraper/railway.toml:**
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "apps/scraper/Dockerfile"

[deploy]
startCommand = "pnpm --filter scraper start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5

[deploy.healthcheck]
path = "/"
intervalSeconds = 60
timeoutSeconds = 10
```

**Cost optimization for Railway:**
- The scraper uses ~100MB RAM idle, scales to ~600MB during scrapes
- Idle cost on Railway: ~$0.000463/min = ~$0.67/day = ~$20/mo
- That's MORE than the $5 credit if always-on

**Solution:** Run the scraper as a Railway "cron job" that only wakes up when needed:
1. Set Railway service to "sleep when inactive"
2. Use a Vercel cron job to ping the scraper every 5 minutes IF there are pending jobs
3. Or accept ~$5/month cost when scraping is active

The simplest path: keep it running, accept Railway will charge ~$5–10/month after the credit. This is the realistic cost.

---

## 7. FRONTEND IMPLEMENTATION

### 7.1 Geo Target Selector (the key new component)

```typescript
// apps/web/src/components/jobs/geo-target-selector.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StateMultiselect } from '@/components/geo/state-multiselect';
import { CityAutocomplete } from '@/components/geo/city-autocomplete';
import { ZipRadiusInput } from '@/components/geo/zip-radius-input';

export type GeoTarget =
  | { kind: 'state'; state_code: string }
  | { kind: 'city'; city: string; state_code: string }
  | { kind: 'zip_radius'; zip_code: string; zip_radius_miles: 5 | 10 | 25 | 50 };

export function GeoTargetSelector({
  value,
  onChange,
}: {
  value: GeoTarget | null;
  onChange: (v: GeoTarget) => void;
}) {
  const [mode, setMode] = useState<'state' | 'city' | 'zip'>('state');

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="state">State</TabsTrigger>
          <TabsTrigger value="city">City + State</TabsTrigger>
          <TabsTrigger value="zip">ZIP + Radius</TabsTrigger>
        </TabsList>

        <TabsContent value="state" className="pt-4">
          <StateMultiselect
            single
            value={value?.kind === 'state' ? [value.state_code] : []}
            onChange={(codes) => {
              if (codes[0]) onChange({ kind: 'state', state_code: codes[0] });
            }}
          />
          <p className="text-xs text-text-muted mt-2">
            Will scrape top 10 cities in the state by population
          </p>
        </TabsContent>

        <TabsContent value="city" className="pt-4 space-y-3">
          <CityAutocomplete
            value={value?.kind === 'city' ? { city: value.city, state_code: value.state_code } : null}
            onChange={(c) => onChange({ kind: 'city', city: c.city, state_code: c.state_code })}
          />
        </TabsContent>

        <TabsContent value="zip" className="pt-4 space-y-3">
          <ZipRadiusInput
            value={value?.kind === 'zip_radius'
              ? { zip: value.zip_code, radius: value.zip_radius_miles }
              : null}
            onChange={(v) => onChange({
              kind: 'zip_radius',
              zip_code: v.zip,
              zip_radius_miles: v.radius,
            })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 7.2 City Autocomplete

```typescript
// apps/web/src/components/geo/city-autocomplete.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Command, CommandInput, CommandList, CommandItem } from 'cmdk';

export function CityAutocomplete({
  value,
  onChange,
}: {
  value: { city: string; state_code: string } | null;
  onChange: (v: { city: string; state_code: string }) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ city: string; state_code: string; population: number }>>([]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const fetchCities = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('geo_zips')
        .select('city, state_code, population')
        .ilike('city', `${query}%`)
        .order('population', { ascending: false })
        .limit(20);

      // Dedup by city+state
      const unique = new Map<string, { city: string; state_code: string; population: number }>();
      (data || []).forEach((r) => {
        const key = `${r.city},${r.state_code}`;
        if (!unique.has(key)) unique.set(key, r);
      });
      setResults(Array.from(unique.values()));
    };

    const timer = setTimeout(fetchCities, 200);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="glass rounded-lg p-2">
      <Command shouldFilter={false}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={value ? `${value.city}, ${value.state_code}` : 'Type a city name...'}
          className="w-full bg-transparent border-none outline-none px-3 py-2"
        />
        {results.length > 0 && (
          <CommandList className="max-h-60 overflow-y-auto mt-2">
            {results.map((r) => (
              <CommandItem
                key={`${r.city}-${r.state_code}`}
                onSelect={() => {
                  onChange({ city: r.city, state_code: r.state_code });
                  setQuery('');
                  setResults([]);
                }}
                className="px-3 py-2 hover:bg-white/[0.04] cursor-pointer rounded"
              >
                <span className="font-medium">{r.city}</span>
                <span className="text-text-muted ml-2">{r.state_code}</span>
                {r.population && (
                  <span className="text-text-muted ml-auto text-xs">
                    {r.population.toLocaleString()} pop.
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandList>
        )}
      </Command>
    </div>
  );
}
```

### 7.3 Filters with Geo Cascading

```typescript
// apps/web/src/lib/hooks/use-filters.ts
import { parseAsString, parseAsArrayOf, parseAsInteger, useQueryStates } from 'nuqs';

export function useLeadFilters() {
  return useQueryStates({
    niche: parseAsString.withDefault('all'),
    states: parseAsArrayOf(parseAsString).withDefault([]),
    cities: parseAsArrayOf(parseAsString).withDefault([]),
    metroAreas: parseAsArrayOf(parseAsString).withDefault([]),
    zipCenter: parseAsString.withDefault(''),
    zipRadius: parseAsInteger.withDefault(0),
    websiteStatus: parseAsArrayOf(parseAsString).withDefault([]),
    pipelineStatus: parseAsArrayOf(parseAsString).withDefault([]),
    minRating: parseAsInteger.withDefault(0),
    maxRating: parseAsInteger.withDefault(50),
    minScore: parseAsInteger.withDefault(0),
    minReviews: parseAsInteger.withDefault(0),
  });
}
```

### 7.4 "Best Time to Call" Badge

```typescript
// apps/web/src/components/leads/timezone-call-time-badge.tsx
import { format, utcToZonedTime } from 'date-fns-tz';

export function TimezoneCallTimeBadge({ timezone }: { timezone: string | null }) {
  if (!timezone) return null;

  const now = new Date();
  const localTime = utcToZonedTime(now, timezone);
  const hour = localTime.getHours();

  let label: string;
  let color: string;

  if (hour >= 9 && hour < 17) {
    label = `${format(localTime, 'h:mm a', { timeZone: timezone })} — call now`;
    color = 'bg-accent-success/15 text-accent-success border-accent-success/30';
  } else if (hour >= 7 && hour < 9) {
    label = `${format(localTime, 'h:mm a', { timeZone: timezone })} — too early`;
    color = 'bg-accent-warning/15 text-accent-warning border-accent-warning/30';
  } else if (hour >= 17 && hour < 20) {
    label = `${format(localTime, 'h:mm a', { timeZone: timezone })} — closing soon`;
    color = 'bg-accent-warning/15 text-accent-warning border-accent-warning/30';
  } else {
    label = `${format(localTime, 'h:mm a', { timeZone: timezone })} — closed`;
    color = 'bg-accent-danger/15 text-accent-danger border-accent-danger/30';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs border ${color}`}>
      {label}
    </span>
  );
}
```

### 7.5 CSV Export with Timezone

```typescript
// apps/web/src/app/api/leads/export/route.ts
import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { leadIds } = await req.json();
  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json({ error: 'No leads' }, { status: 400 });
  }

  const { data: leads, error } = await supabase
    .from('leads_enriched')
    .select(`
      business_name, niche, street_address, city, state_code, state_name,
      zip_code, metro_area, timezone, phone, phone_normalized,
      website_url, website_status, instagram_url, facebook_url,
      yelp_url, yelp_rating, yelp_review_count,
      qualification_score, pipeline_status, notes,
      latitude, longitude
    `)
    .in('id', leadIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const csv = Papa.unparse(leads || [], {
    header: true,
    columns: [
      'business_name', 'niche', 'street_address', 'city', 'state_code', 'state_name',
      'zip_code', 'metro_area', 'timezone',
      'phone', 'phone_normalized',
      'website_url', 'website_status',
      'instagram_url', 'facebook_url',
      'yelp_url', 'yelp_rating', 'yelp_review_count',
      'qualification_score', 'pipeline_status', 'notes',
      'latitude', 'longitude',
    ],
  });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="sazaan-leads-${Date.now()}.csv"`,
    },
  });
}
```

---

## 8. DESIGN SYSTEM

### 8.1 Tailwind Config (same as before, USA-themed accent)

```typescript
// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0A0A0F',
          surface: '#0F0F17',
          elevated: '#15151F',
          border: '#1F1F2E',
        },
        accent: {
          primary: '#6366F1',
          glow: '#818CF8',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#06B6D4',
        },
        text: {
          primary: '#F4F4F5',
          secondary: '#A1A1AA',
          muted: '#71717A',
        },
      },
      fontFamily: {
        sans: ['Object Sans', 'Montserrat', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Object Sans', 'Inter', 'sans-serif'],
        body: ['Montserrat', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(99, 102, 241, 0.3)',
        'glow-md': '0 0 24px rgba(99, 102, 241, 0.4)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.5)',
        'glow-success': '0 0 16px rgba(16, 185, 129, 0.4)',
        'glow-danger': '0 0 16px rgba(239, 68, 68, 0.4)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### 8.2 Aceternity Component Map

| Component | Where | Purpose |
|---|---|---|
| Sidebar (animated) | App shell | Hover-expand nav |
| Background Beams | Login page | Brand entry |
| Moving Border Button | "Run Scrape" CTA | Visual emphasis |
| Spotlight | Job progress modal | Focus during scrape |
| Bento Grid | Overview page | Stat cards |
| Animated Tabs | Niche filter, geo selector | Smooth state switches |

**DO NOT use:** Sparkles, Wavy Background, Lamp Effect, Tracing Beam, Card 3D — visual fatigue on a tool used for hours.

---

## 9. PHASED EXECUTION ROADMAP

### Phase 1 — Monorepo & Schema Setup

1. `pnpm init` at root, set up `pnpm-workspace.yaml`
2. Create `apps/web` (Next.js) and `apps/scraper` (Node) folders
3. Create `packages/shared` workspace package
4. Create Supabase project, run schema SQL from Section 3.1
5. Download `uszips.csv`, place in `apps/scraper/data/`
6. Generate types: `pnpm types`
7. Run `pnpm --filter scraper seed:zips`

**Self-check:** `select count(*) from geo_zips` returns ~33,000. `select count(*) from us_states` returns 51.

### Phase 2 — Web App Shell

1. Set up Next.js 14 app with Tailwind, shadcn primitives
2. Configure dark theme tokens from Section 8.1
3. Build login page with magic link auth
4. Build dashboard layout with Aceternity sidebar
5. Build empty pages (leads, jobs, campaigns, settings)
6. Add auth middleware

**Self-check:** Sign in via magic link, see dashboard shell.

### Phase 3 — Geo Targeting UI

1. Build `StateMultiselect` (loads from `us_states`)
2. Build `CityAutocomplete` (queries `geo_zips`)
3. Build `ZipRadiusInput` (validates ZIP, picks 5/10/25/50)
4. Build `GeoTargetSelector` combining all three
5. Build `JobTriggerForm` on `/jobs` page

**Self-check:** Can pick "Cafes in Texas" / "Cafes in Austin, TX" / "Cafes near 78701, 25 miles" — all submit successfully and create rows in `ingestion_jobs`.

### Phase 4 — Scraper Core

1. Set up `apps/scraper` with Playwright + stealth plugin
2. Build `browser-pool.ts` with US-aligned context (en-US, US timezone)
3. Build `scrapers/yelp.ts`
4. Build `scrapers/yellow-pages.ts`
5. Build `lib/dedup.ts`
6. Build `job-runner.ts` and `index.ts` (realtime listener)
7. Test locally: trigger job from dashboard → scraper picks up → leads appear

**Self-check:** Trigger "cafes in Austin, TX" — scraper completes, ≥30 leads in DB, dedup'd correctly.

### Phase 5 — Health Checks + Qualification

1. Build `workers/website-health.ts`
2. Wire health checks to run after each job
3. Verify Postgres trigger updates `qualification_score`
4. Build `WebsiteStatusPill` and `QualificationBadge` components

**Self-check:** All Phase 4 leads have `website_status` set. At least 5 have `qualification_score > 60`.

### Phase 6 — Leads Table + Filters

1. Build `LeadsFilters` with state/city/metro/ZIP cascading
2. Build `LeadsTable` with TanStack Table + virtualization
3. Build `BulkActionsBar` and `LeadDetailDrawer`
4. Build `TimezoneCallTimeBadge`
5. Wire pipeline status with optimistic updates

**Self-check:** Filter to "clinics in CA + no website + score > 60" → results render in <300ms → select 10 → bulk bar appears.

### Phase 7 — Export, Campaigns, Deploy

1. Build CSV export API
2. Build campaigns CRUD
3. Build `AddToCampaignDialog`
4. Deploy `apps/web` to Vercel
5. Deploy `apps/scraper` to Railway via Dockerfile
6. Set all env vars in both
7. Trigger end-to-end test in production

**Self-check:** Production URL loads, can trigger a US scrape, leads appear, CSV exports with all geo columns.

---

## 10. CRITICAL IMPLEMENTATION NOTES

### 10.1 Rate Limiting (Don't Get IP-Banned)

- **Yelp:** Strong Cloudflare protection. Max 1 detail page per 4–7 seconds. Max 30 detail pages per session, then close browser and create fresh context.
- **Yellow Pages:** Lighter protection. 1 page per 2–4 seconds is safe.
- **From Karachi IP:** Both will flag you faster than from US IPs. If you're getting CAPTCHAs within 20 requests, you need US residential proxies.

### 10.2 When to Add Proxies

Symptoms you need proxies:
- CAPTCHA pages appearing within first 20 requests
- HTTP 403 / "Access Denied" pages
- Empty result pages despite valid search
- Yelp showing the "Are you a robot?" interstitial

Recommended: **Bright Data** or **Oxylabs** residential US proxies. ~$15/mo for 1GB which is enough for this volume.

### 10.3 Railway Cost Management

- Idle scraper: ~$0.001/hour = ~$0.72/day = ~$22/month if always-on
- $5 free credit covers ~1 week always-on
- **For longer runtime:** Set Railway service to "scale to zero" and use a Vercel cron to ping it every 10 minutes ONLY when there are pending jobs in DB

### 10.4 Don't Do These Things

- Don't run the scraper from your laptop for production (your home IP gets banned, affecting browsing)
- Don't scrape during US business hours (9 AM – 5 PM EST) — bot traffic is more obvious then. Run overnight US time = morning Karachi time.
- Don't scrape >100 leads per session per source — rotate browser context after every 30
- Don't store passwords or sensitive data in the scraper repo
- Don't skip the dedup logic — Yelp + YP overlap is ~40%
- Don't add light mode

---

## 11. README.md (Generate This)

Generate `README.md` at root with:
- Monorepo structure overview
- Setup steps: clone, install, env vars, schema, seed ZIPs
- How to run locally: `pnpm dev:web` + `pnpm dev:scraper`
- How to deploy web (Vercel) and scraper (Railway)
- How to add a new niche (modify `NICHE_QUERY` in both scrapers)
- Troubleshooting: scraper getting blocked, Railway costs, type errors

---

## END OF SPEC

Build now. Phase 1 → Phase 7. Self-check after each phase.
