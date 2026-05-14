# Plan — Build the "Job Search" Module in JobFit

> A planning document for a new website-only module that surfaces curated, pre-scored job leads ranked against each user's resume. Lives alongside `plan.md`, `decisions.md`, `WEBSITE_PLAN.md`, and `jobfit-ai-v2-infrastructure.md`.

---

## Context

JobFit today is a Chrome MV3 side-panel extension that scores a single, browser-tab-extracted JD against the user's resume and generates tailored docs. The companion website ([website/](website/), Next.js 14 App Router on Vercel, shared Supabase) currently surfaces only **private**, user-initiated analyses — there is no way to *discover* jobs.

The new **Job Search** module changes that: it ingests **curated job leads from public job-board APIs**, scores every lead against each authenticated user's resume using the existing 9-dimension JobFit algorithm, and serves them as a **ranked feed** on the website. This brings JobFit from "tailor a resume to this one job" to "show me roles I'd actually win, then tailor for them in one click."

The module is **website-only** by design — the extension's value is point-of-need analysis, while discovery wants a dashboard surface, persistence, and email digests.

---

## Goals

1. A `/dashboard/jobs` feed where signed-in users see jobs **ranked by their fit score** (10-tier color ramp), with filters and one-click tailoring.
2. Ingestion from at least 4 public-API job boards (Greenhouse, Lever, Workable, Ashby) plus generic RSS — **no scraping of LinkedIn/Indeed in v1** (ToS risk).
3. Reuse the existing scoring algorithm ([src/lib/agents.ts](src/lib/agents.ts)) **server-side, headlessly** in a cron worker.
4. Strict per-user privacy: a score row is visible only to its owner (RLS).
5. Bounded LLM cost: pre-filter by cosine pre-check, full Synthesizer only on top-N per user.
6. **Zero redundant work**: no posting embedded twice, no `(user, job, resume)` triple scored twice, no stale row surfaced after the user changes resume or the employer edits the JD.

## Non-goals (v1)

- Scraping LinkedIn/Indeed/Glassdoor (deferred).
- Real-time scoring webhook (nightly fan-out is sufficient).
- Mobile push notifications.
- Recruiter-side surfaces.
- Auto-apply.

---

## Architecture

```
INGESTION             SCORING                 SERVING
───────────           ───────────             ───────────
Greenhouse  ─┐
Lever       ─┤ cron/jobs-ingest (2h)
Workable    ─┤   normalize + dedup
Ashby       ─┘   UPSERT curated_jobs
RSS feeds  ──→
                 │
                 ▼
        cron/jobs-embed (30m)
          voyage-3-large → job_embedding
                 │
                 ▼
        cron/jobs-score-fanout (daily 02:00 UTC)
          refresh user profile_embedding
          RPC top_candidate_jobs(user, 500)   ← cosine pre-filter
          enqueue ≤100 (user, job) pairs
                 │
                 ▼
        cron/jobs-score-drain (5m, batch 25)
          runJobMatchAnalysis(jd, deps)
          UPSERT job_scores
                                            │
                                            ▼
                                 /dashboard/jobs (RSC)
                                   RPC list_user_jobs
                                   <JobRow/>, <FilterBar/>
                                            │
                                            ▼
                                 /dashboard/jobs/[id]
                                   sub-score breakdown
                                   "Tailor resume" → SSE
                                     reuses website/lib/graph/
```

Cleanup: `cron/jobs-cleanup` (daily 04:00 UTC) deactivates jobs older than 35d; deletes after 90d. Cascade purges `job_scores`.

---

## Database schema (new objects)

All migrations land in `website/supabase/migrations/`. Three tables, two RPCs, one queue table, RLS on each. (Schema deltas for the redundancy story are listed in the **Redundancy & idempotency** section below.)

### `curated_jobs`

```sql
create table public.curated_jobs (
  id              uuid primary key default gen_random_uuid(),
  source          text not null check (source in ('greenhouse','lever','workable','ashby','rss','manual')),
  source_id       text not null,
  source_url      text not null,
  dedup_hash      text not null unique,
  company         text not null,
  job_title       text not null,
  job_description text not null,
  description_hash text,                    -- sha1(job_description); see Redundancy section
  location        text,
  location_type   text check (location_type in ('remote','hybrid','onsite','unknown')),
  comp_min        int, comp_max int, comp_currency text default 'USD',
  role_family     text,
  seniority       text check (seniority in ('intern','junior','mid','senior','staff','principal','exec','unknown')),
  posted_at       timestamptz not null,
  ingested_at     timestamptz not null default now(),
  expires_at      timestamptz,
  job_embedding   vector(1024),
  guardrail_flags text[] default '{}',
  active          boolean not null default true,
  unique (source, source_id)
);

create index curated_jobs_active_posted_idx on public.curated_jobs (active, posted_at desc);
create index curated_jobs_desc_hash_idx     on public.curated_jobs (description_hash);
create index curated_jobs_embedding_ivf_idx on public.curated_jobs
  using ivfflat (job_embedding vector_cosine_ops) with (lists = 200);

alter table public.curated_jobs enable row level security;
create policy curated_jobs_read on public.curated_jobs
  for select using (auth.role() = 'authenticated' and active = true);
```

### `job_scores` (per-user)

```sql
create table public.job_scores (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  job_id        uuid not null references public.curated_jobs(id) on delete cascade,
  resume_id     uuid not null references public.resumes(id) on delete cascade,
  score         smallint not null check (score between 0 and 100),
  subscores     jsonb not null,
  caps_applied  text[] default '{}',
  confidence    text check (confidence in ('low','medium','high')),
  matches       jsonb not null default '[]'::jsonb,
  gaps          jsonb not null default '[]'::jsonb,
  keywords      jsonb not null default '[]'::jsonb,
  pre_filter_cosine numeric(5,4),
  scored_at     timestamptz not null default now(),
  hidden        boolean not null default false,
  saved         boolean not null default false,
  stale         boolean not null default false,     -- set true when JD changes upstream
  digest_sent_at timestamptz,                       -- nulled until a digest references this row
  unique (user_id, job_id, resume_id)
);

create index job_scores_user_score_idx on public.job_scores (user_id, score desc, scored_at desc);
create index job_scores_stale_idx      on public.job_scores (job_id) where stale = true;

alter table public.job_scores enable row level security;
create policy job_scores_self_read   on public.job_scores for select using (auth.uid() = user_id);
create policy job_scores_self_update on public.job_scores for update using (auth.uid() = user_id);
```

### `user_job_preferences`

```sql
create table public.user_job_preferences (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  roles_of_interest    text[] not null default '{}',
  locations            text[] not null default '{}',
  remote_ok            boolean not null default true,
  hybrid_ok            boolean not null default true,
  onsite_ok            boolean not null default true,
  comp_min             int,
  seniority_floor      text, seniority_ceiling text,
  excluded_companies   text[] not null default '{}',
  active_resume_id     uuid references public.resumes(id) on delete set null,
  profile_embedding    vector(1024),
  profile_embedding_at timestamptz,
  notify_email         boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_job_preferences enable row level security;
create policy ujp_self on public.user_job_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### `scoring_queue` (Postgres-backed; upgrade to Upstash if >5k pairs/day)

```sql
create table public.scoring_queue (
  id          bigserial primary key,
  user_id     uuid not null,
  job_id      uuid not null,
  resume_id   uuid not null,
  attempts    smallint not null default 0,
  enqueued_at timestamptz not null default now(),
  unique (user_id, job_id, resume_id)
);
```

Drainer uses `FOR UPDATE SKIP LOCKED` to pop ≤25 rows per invocation.

### RPCs

- **`list_user_jobs(p_user_id, p_location_type, p_score_floor, p_role_family, p_source, p_max_age_days, p_include_hidden, p_limit, p_offset)`** — paginated, filtered, sorted (score desc, posted_at desc). Joins `user_job_preferences` and filters `resume_id = active_resume_id AND stale = false`.
- **`top_candidate_jobs(p_user_id, p_limit, p_max_age_days)`** — cosine pre-filter; returns the N most semantically-similar unscored jobs.

---

## Server-side scoring port

The extension's [src/lib/agents.ts](src/lib/agents.ts) is headless-safe at the algorithm level but its I/O deps ([src/lib/voyage.ts](src/lib/voyage.ts) reads `chrome.storage`; [src/lib/search.ts](src/lib/search.ts) uses the user's session) are not. Strategy:

Create a fresh module at `website/lib/scoring/` (do **not** monorepo-share — runtime contracts differ):

- `website/lib/scoring/types.ts` — `SubScores`, `AnalysisResult`, `SCORING_WEIGHTS`, `computeFinalScore`, `NotJobDescriptionError`. Pure.
- `website/lib/scoring/prompts.ts` — `ANALYZER_SYSTEM_PROMPT`, `ANALYZER_TOOL`, `SYNTHESIZER_SYSTEM_PROMPT`, `SYNTHESIZER_TOOL`. Pure string constants.
- `website/lib/scoring/guardrails.ts` — `sanitizeJD`, `wrapInXML`, `applyInputGuardrails(jd, deps)`. Layer-3 takes injected `claudeHaikuClassify`.
- `website/lib/scoring/runJobMatchAnalysis.ts` — top-level entry with **dependency injection**:

  ```ts
  runJobMatchAnalysis(jd: string, deps: {
    supabase: SupabaseClient;
    userId: string;
    embed: (texts: string[]) => Promise<number[][]>;
    callClaude: typeof callClaudeWithTool;
  }, opts?: { skipGuardrails?: boolean }): Promise<AnalysisResult>
  ```

  Reuses [website/lib/graph/voyage.ts](website/lib/graph/voyage.ts) and [website/lib/graph/anthropic.ts](website/lib/graph/anthropic.ts) for the injected I/O.

**Parity check:** `scripts/check-scoring-parity.ts` reads `src/lib/agents.ts` and `website/lib/scoring/*`, diffs prompt strings and the `SCORING_WEIGHTS` literal, fails CI on drift. Run in `npm run lint`.

---

## Cron jobs

Registered in `website/vercel.json` (alongside the existing `beta-digest`). All routes gated on `Authorization: Bearer ${CRON_SECRET}`.

| Path | Schedule (UTC) | Purpose |
|---|---|---|
| `app/api/cron/jobs-ingest/route.ts` | `0 */2 * * *` | Walk `config/job-sources.ts`; fetch postings from each source adapter; normalize; dedup-hash; UPSERT into `curated_jobs`. Resilient: one source failing does not block others. |
| `app/api/cron/jobs-embed/route.ts` | `*/30 * * * *` | `select id, job_description from curated_jobs where job_embedding is null limit 500` → batched Voyage call → UPDATE. |
| `app/api/cron/jobs-score-fanout/route.ts` | `0 2 * * *` | For each active user (has prefs + active resume + recent login): refresh `profile_embedding` if stale (>7d); RPC `top_candidate_jobs(user, 500)`; INSERT ≤100 triples into `scoring_queue`. |
| `app/api/cron/jobs-score-drain/route.ts` | `*/5 * * * *` | Pop ≤25 queued triples with `FOR UPDATE SKIP LOCKED`; `runJobMatchAnalysis(jd, deps)`; UPSERT `job_scores`. Promise pool concurrency = 5. Retry 5xx up to 3×. |
| `app/api/cron/jobs-cleanup/route.ts` | `0 4 * * *` | Deactivate jobs older than 35d; delete after 90d. |
| `app/api/cron/jobs-digest/route.ts` (phase 5) | `0 13 * * 1` | Send Resend email of top-5 new jobs to users with `notify_email=true`. Filters `digest_sent_at IS NULL`; stamps on send. |

## Source adapters

Under `website/lib/jobs/sources/`:

- `greenhouse.ts` — `https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true` (no key).
- `lever.ts` — `https://api.lever.co/v0/postings/{org}?mode=json` (no key).
- `workable.ts` — `https://apply.workable.com/api/v3/accounts/{subdomain}/jobs`.
- `ashby.ts` — `https://api.ashbyhq.com/posting-api/job-board/{org}` (no key).
- `rss.ts` — generic Atom/RSS parser via `fast-xml-parser` (new dep).
- `index.ts` — `runAllSources()` → `NormalizedJob[]`.
- `dedup.ts` — `dedupHash(company, title, location)` = sha1 of normalized concatenation; titles strip level prefixes ("Sr." ≡ "Senior").
- `inferRoleFamily.ts` — regex bucket first, fallback to nearest-cluster cosine against pre-stored family centroids.

Source seed list: `website/config/job-sources.ts` — start with ~50 hand-picked YC/Greenhouse/Lever boards. Cheap and high signal; ToS-clean.

---

## Redundancy & idempotency

Every layer of the pipeline guards against re-processing data that's already been handled. The matrix below lists each axis of redundancy, the mechanism preventing it, and whether the original schema already covered it or needs a delta.

| Axis | Risk | Mechanism | Status |
|---|---|---|---|
| Same posting re-fetched from the same source | duplicate `curated_jobs` row | `unique (source, source_id)` + `ON CONFLICT … DO UPDATE` | ✅ in schema |
| Same posting on multiple boards | "Senior BE @ Acme" appearing 3× across Greenhouse/Lever/Ashby | `dedup_hash UNIQUE` over sha1(normalized `company`, `title`, `location`) | ✅ in schema |
| Posting re-embedded | wasted Voyage call | `WHERE job_embedding IS NULL` predicate in `jobs-embed` cron | ✅ |
| Same `(user, job, resume)` triple re-scored | wasted Claude call + duplicate row | `unique (user_id, job_id, resume_id)` on `job_scores` + pre-existence check in drainer | ✅ + US-14 |
| Same triple re-enqueued | duplicate queue rows | `unique (user_id, job_id, resume_id)` on `scoring_queue` | ✅ |
| Parallel drainers pop the same row | double-scoring | `FOR UPDATE SKIP LOCKED` on pop | ✅ |
| Fan-out re-enqueues already-scored jobs | wasted scoring | `top_candidate_jobs` excludes via `NOT EXISTS (SELECT 1 FROM job_scores …)` | ✅ |
| User-dismissed jobs reappear | UX regression | `job_scores.hidden = true` + default-exclude in `list_user_jobs` | ✅ |
| **User swaps active resume** | stale scores against the prior resume surface in feed | `list_user_jobs` filters `job_scores.resume_id = user_job_preferences.active_resume_id`. Old rows stay for audit; fan-out enqueues new triples next cycle | **adds RPC filter** |
| **Employer edits a posting upstream** | cached embedding + scores silently stale | Add `curated_jobs.description_hash` (sha1 of JD body). On UPSERT, if hash differs: null `job_embedding` and mark `job_scores.stale = true` for all rows referencing this job. Embed + drain pick the work up next cycle | **schema add: `description_hash`, `job_scores.stale`** |
| User clicks "Tailor resume" twice on the same job | two `analysis_history` rows for the same `(user, job)` | Tailor route does lookup-or-create on `(user_id, job_url)` before insert | **route logic** |
| Digest re-emails the same job to the same user | spammy digests | Add `job_scores.digest_sent_at`. Digest cron filters `digest_sent_at IS NULL`; stamps on successful send | **schema add: `digest_sent_at`** |

### Schema deltas implied by this section

The `curated_jobs` and `job_scores` blocks above already include these columns and indexes; reproduced here for clarity if applying as a follow-up migration on a pre-existing schema:

```sql
alter table public.curated_jobs
  add column description_hash text;
create index curated_jobs_desc_hash_idx on public.curated_jobs (description_hash);

alter table public.job_scores
  add column stale boolean not null default false,
  add column digest_sent_at timestamptz;

create index job_scores_stale_idx on public.job_scores (job_id) where stale = true;
```

### Resume-aware `list_user_jobs` filter

The RPC body gains an inner-join + two predicates:

```sql
join public.user_job_preferences ujp on ujp.user_id = s.user_id
where s.resume_id = ujp.active_resume_id
  and s.stale = false
  and not s.hidden                          -- unless p_include_hidden
  …
```

The moment a user picks a new active resume, their feed re-rallies behind the new triples that fan-out enqueues; the old rows quietly disappear from view without being deleted.

### Ingest UPSERT — concrete pattern

```sql
insert into curated_jobs (source, source_id, dedup_hash, company, job_title,
                          job_description, description_hash, …)
values (…)
on conflict (source, source_id) do update set
  job_title        = excluded.job_title,
  job_description  = excluded.job_description,
  description_hash = excluded.description_hash,
  job_embedding    = case
                       when curated_jobs.description_hash is distinct from excluded.description_hash
                       then null
                       else curated_jobs.job_embedding
                     end,
  ingested_at      = now();

-- Trigger: when description_hash changes, stale-mark every score against this job.
create or replace function mark_scores_stale_on_jd_change()
returns trigger language plpgsql as $$
begin
  if old.description_hash is distinct from new.description_hash then
    update job_scores set stale = true where job_id = new.id;
  end if;
  return new;
end $$;

create trigger curated_jobs_jd_change_trg
  after update on curated_jobs
  for each row execute function mark_scores_stale_on_jd_change();
```

### Drainer pre-check — concrete pattern

```ts
// After popping a (user_id, job_id, resume_id) triple in jobs-score-drain:
const { data: existing } = await supabase
  .from('job_scores')
  .select('id, stale')
  .eq('user_id', userId).eq('job_id', jobId).eq('resume_id', resumeId)
  .maybeSingle();

if (existing && !existing.stale) return;   // already scored, drop queue row, skip LLM
// else: runJobMatchAnalysis(jd, deps) + UPSERT job_scores set stale = false
```

A re-enqueued triple costs one cheap SELECT, not a full Claude pass.

---

## New API routes

Under `website/app/api/jobs/`:

| Route | Purpose |
|---|---|
| `GET /api/jobs?score=&loc=&role=&source=&age=&cursor=` | List endpoint — wraps `list_user_jobs` RPC. |
| `GET /api/jobs/[id]` | Joined `curated_jobs` + caller's `job_scores` row. 404 if no score (don't leak unscored jobs). |
| `POST /api/jobs/[id]/save` / `DELETE` | Toggle `saved`. |
| `POST /api/jobs/[id]/hide` | Set `hidden=true`. |
| `POST /api/jobs/[id]/tailor` | Loads JD, **lookup-or-create** on `(user_id, job_url)` in `analysis_history`, delegates to existing `buildResumeGraph` in `website/lib/graph/`. Returns the same SSE stream the editor already speaks. |
| `GET /api/jobs/preferences` / `PATCH` | Read/upsert `user_job_preferences`. PATCH invalidates `profile_embedding_at`. |

New helper: `website/lib/supabase/admin.ts` returning a service-role client. Cron routes must use this — never the cookie-bound [website/lib/supabase/server.ts](website/lib/supabase/server.ts).

---

## New UI routes & components

Route tree under `website/app/dashboard/jobs/`:

- `page.tsx` (RSC) — feed. Calls `list_user_jobs` server-side; streams first 25 rows.
- `loading.tsx` — skeleton matching row pattern.
- `JobsFeedClient.tsx` — owns filter state, infinite scroll (`react-intersection-observer`).
- `JobRow.tsx` — reuses the score-dot/title/company/level layout from [website/app/dashboard/page.tsx:174-231](website/app/dashboard/page.tsx#L174-L231). Adds: source pill, location-type pill, bookmark icon.
- `FilterBar.tsx` — sticky bar (location_type, score band, source, role_family, age). URL-state driven so filters are shareable.
- `EmptyState.tsx` — three branches: no prefs / not yet scored / filters too tight.
- `[id]/page.tsx` — detail; full JD as `whitespace-pre-wrap` text (sanitized), 9-dimension sub-score bars using [website/lib/matchLevel.ts](website/lib/matchLevel.ts) colors, matches/gaps/keywords pills.
- `[id]/TailorPanel.tsx` — "tailor resume" / "generate cover letter" CTAs. SSE consumer.
- `preferences/page.tsx` + `PreferencesForm.tsx` — chips, sliders, toggles, resume picker.

Navigation: add "Jobs" tab to [website/components/Navbar.tsx](website/components/Navbar.tsx) and the dashboard layout. Add a "Recommended jobs" top-3 teaser to [website/app/dashboard/page.tsx](website/app/dashboard/page.tsx).

Design tokens (all already in [website/tailwind.config.ts](website/tailwind.config.ts)):
- `crimson-500` — score-band selector
- `citrus` — Elite/Excellent pills
- `flare` — hide button
- `sky` — source pills
- `font-chunk` — section headings
- `font-mono uppercase tracking-caps` — filter labels

---

## Reused assets

- [src/lib/agents.ts](src/lib/agents.ts) — source of `SCORING_WEIGHTS`, prompt strings, `computeFinalScore` (port target).
- [src/lib/voyage.ts](src/lib/voyage.ts) — Voyage embedding contract (port target).
- [src/lib/guardrails.ts](src/lib/guardrails.ts) — sanitization functions (port target).
- [src/lib/matchLevel.ts](src/lib/matchLevel.ts) — 10-tier color/label mapping.
- [website/lib/graph/anthropic.ts](website/lib/graph/anthropic.ts) — server-side Claude wrapper, reused as scoring injected dep.
- [website/lib/graph/voyage.ts](website/lib/graph/voyage.ts) — server-side Voyage wrapper, reused as scoring injected dep.
- [website/lib/graph/nodes.ts](website/lib/graph/nodes.ts) — `buildResumeGraph` referenced by the tailor route.
- [website/lib/supabase/server.ts](website/lib/supabase/server.ts) — auth-aware client for user-facing routes.
- [website/app/api/cron/beta-digest/route.ts](website/app/api/cron/beta-digest/route.ts) — cron auth pattern to mirror.

---

## Phased delivery

| Phase | Scope | Approx. effort |
|---|---|---|
| **0 — Foundations** | Migrations (3 tables, 2 RPCs, queue, redundancy deltas, JD-change trigger), `lib/scoring/` port, parity script, `lib/supabase/admin.ts`, `/api/jobs/preferences` + `preferences/` UI. | ~5 days |
| **1 — Ingest** | Greenhouse + Lever adapters, `jobs-ingest` + `jobs-embed` + `jobs-cleanup` crons, source seed file (20 boards), admin debug page. | ~5 days |
| **2 — Scoring** | `scoring_queue`, `jobs-score-fanout` + `jobs-score-drain`, drainer pre-check, cost logging in `generations` table. | ~5 days |
| **3 — Feed UI** | `/dashboard/jobs` feed, `JobRow`, `FilterBar`, `EmptyState`, `GET /api/jobs`, `GET /api/jobs/[id]`, dashboard teaser. | ~5 days |
| **4 — Detail + tailor** | `[id]/page.tsx`, `TailorPanel`, `/api/jobs/[id]/tailor` (delegates to existing graph, lookup-or-create on `analysis_history`), save/hide endpoints. | ~5 days |
| **5 — Sources + polish** | Workable + Ashby + RSS adapters, weekly digest cron (digest_sent_at filter), filter analytics. | ~5 days |

Total: ~6 weeks at single-developer pace.

---

## User stories (17)

### Persona: Active Job Seeker (Maya)

**US-1 — Daily ranked feed**
*As Maya, I want jobs sorted by my match score so I focus on roles I'm likely to land.*
- Given prefs saved + resume uploaded, visiting `/dashboard/jobs` shows ≥25 rows sorted score desc.
- Each row: score dot (10-tier color), title, company, posted-relative-date, location-type pill.
- Keyboard-focusable; Enter opens detail.

**US-2 — Filter by remote**
*As Maya, I want to filter to remote-only postings.*
- Selecting "Remote" updates URL to `?loc=remote`, list refreshes, every visible row's pill reads "remote".

**US-3 — One-click resume tailoring**
*As Maya, I want to tailor my resume to a posting without recopying the JD.*
- On detail page "Tailor resume" triggers SSE; a `resume_versions` row referencing this job is created within 60 s; SSE `done` event delivers final LaTeX/HTML.

**US-4 — Save for later**
*As Maya, I can bookmark a posting and return to it.*
- Click bookmark → `job_scores.saved=true`. "Saved" filter shows it. Persists across sessions and devices.

### Persona: Career Explorer (Jordan)

**US-5 — Discover adjacent roles**
*As Jordan, I want jobs in adjacent role families (eng-backend → platform/devops).*
- Preferences allow multi-select roles; `top_candidate_jobs` weights adjacent families at 0.5 in the cosine pre-filter.

**US-6 — Browse by score band**
*As Jordan, I want to see "stretch" jobs (60-75), not just elite fits.*
- Score-band pills: "Elite 85+", "Strong 70+", "Stretch 50+", "Any". Default "Strong 70+".

### Persona: New Grad (Sam)

**US-7 — Entry-level visibility**
*As Sam, I want to see junior/intern roles without YoE-gap penalties dominating the score.*
- `user_job_preferences.seniority_ceiling = 'junior'` triggers `assumeEntryLevel: true` in `runJobMatchAnalysis`; the `yoe_short_3plus` hard cap is suppressed (sub-score still captured).

**US-8 — Visible match reasoning**
*As Sam, I want to know WHY a job scored 72 vs 85.*
- Detail page shows 9 sub-score bars with the `matchLevel.ts` gradient. Each bar has a tooltip describing the dimension.

### Persona: Senior Operator (Priya)

**US-9 — Exclude past employers**
*As Priya, I don't want to see jobs at companies I've already left.*
- `excluded_companies` array filters `curated_jobs.company` case-insensitively in `list_user_jobs`.

**US-10 — Comp transparency**
*As Priya, I want only postings that disclose comp ≥ floor.*
- `comp_min` preference drops rows with `comp_max < floor`. Undisclosed rows show a "comp undisclosed" pill, hidden by an opt-in toggle.

**US-11 — Weekly email digest**
*As Priya, I want a Monday morning email of the top 5 new jobs.*
- `notify_email=true` opts in. `jobs-digest` cron Monday 13:00 UTC sends via Resend (same pattern as `beta-digest/route.ts`). Filters `digest_sent_at IS NULL` and stamps it on send so the same `(user, job)` never appears in two digests.

### System role: Curation Worker

**US-12 — Resilient ingest**
*As the ingest worker, I continue even when one source is down.*
- Each adapter wrapped in `try/catch`; failures log to console + Sentry but don't block siblings. Cron route returns `{ sources: [{name, ok, count, error?}] }`.

**US-13 — Deterministic dedup**
*As the ingest worker, I merge cross-board duplicates into a single row.*
- `dedup_hash` UNIQUE enforces at DB; UPSERT prefers earliest `posted_at`. Test: 3 identical listings from 3 boards → 1 row.

**US-14 — Idempotent scoring**
*As the scoring worker, repeated runs don't double-bill the LLM.*
- `unique (user_id, job_id, resume_id)` + pre-existence check before LLM call. Queue row deleted only after successful UPSERT.
- Negative test: enqueue same triple 5×, drain twice → exactly 1 row in `job_scores`, exactly 1 row in `generations`.

**US-15 — Resume-swap binding**
*As Maya, when I set a new active resume, my feed reflects that resume — not stale scores against the prior one.*
- `list_user_jobs` filters `job_scores.resume_id = user_job_preferences.active_resume_id`. Old rows remain in DB (audit trail) but never surface.
- The next fan-out cycle enqueues `(user, job, new_resume_id)` triples for the cosine-pre-filter top 500. Feed re-populates within one cycle.
- Acceptance: upload resume B and activate it → feed empty within 1 s (RPC filter), feed re-populates within 24 h (next fan-out).

**US-16 — JD-edit detection**
*As the ingest worker, when a posting's description changes upstream, I re-embed and re-score rather than serving stale data.*
- Ingest stores `description_hash = sha1(job_description)`. UPSERT nulls `job_embedding` when the hash diverges.
- `curated_jobs_jd_change_trg` flips `job_scores.stale = true` for every row referencing the job.
- `jobs-embed` cron picks up null embeddings; drainer treats `stale=true` as eligible to re-score (single pre-existence pass per triple).
- Negative test: simulate JD edit on a posting that already has 100 scored users → embedding nulled, all 100 score rows marked stale, all re-scored within one drainer cycle.

### System role: Admin

**US-17 — Source health dashboard**
*As an admin, I see ingest health per source for the last 7 days.*
- `/dashboard/jobs/admin` (gated to founder email): table of `source, ingested_24h, ingested_7d, errors_24h, stale_scores_24h`. Backed by view `ingest_health_daily`.

---

## Verification (per phase)

**Phase 0** — `npm run lint:scoring-parity` exits 0 on baseline; flips to non-zero when a weight or prompt diverges. `/preferences` POST round-trips to `user_job_preferences`.

**Phase 1** — `curl -H "Authorization: Bearer $CRON_SECRET" $URL/api/cron/jobs-ingest` returns `{ ingested, deduped }`. Embeds backfill to zero within 30 min. Dedup test: insert the same posting from two boards → exactly one row survives. **JD-edit test:** UPDATE a posting's `job_description`; verify `job_embedding` is nulled and `job_scores.stale=true` for every row referencing it.

**Phase 2** — Seed test user; trigger fanout + drain; assert `select count(*) from job_scores where user_id=$TEST` lands between 50 and 100. Cost telemetry written to `generations`. **Idempotency test:** re-run drain over the same queue rows → row count and `generations` count both unchanged.

**Phase 3** — Two-browser RLS test: user A cannot fetch user B's score. Filter "remote" matches every visible row. Pagination cursor works without offset drift when new rows arrive mid-scroll. **Resume-swap test:** upload resume B and set it active → `/dashboard/jobs` empties within one request → re-populates with B-bound scores after the next fan-out.

**Phase 4** — "Tailor resume" emits the same SSE event names as the editor flow. A fresh `analysis_history` row references the source URL **only on first click**; a second click reuses the same row. Hide → row leaves default view; reappears under admin filter.

**Phase 5** — Per-source: ingest 1 posting from each board; verify normalized fields. Digest: trigger manually; verify Resend send and top-5 render. **Digest-dedup test:** trigger digest twice on the same Monday → second run sends zero emails (all candidates have `digest_sent_at` set).

---

## Open questions

1. **MVP shape** — ship phases 0–4 (no email, 2 sources) as v1, or pursue the full 6-week scope?
2. **Source list for launch** — ~50 hand-picked Greenhouse/Lever boards, or enumerate Greenhouse's full board list (~3k boards, much noisier)?
3. **Cost ceiling** — top-N=100/user/day ≈ $0.30/user/day at current Claude rates. Acceptable, or cap at 50?
4. **Active-user definition for fanout** — score everyone with a resume + prefs, or restrict to users logged in within 30 days?
5. **Queue infra** — start with Postgres `FOR UPDATE SKIP LOCKED` (recommended) and upgrade to Upstash Redis at >5k pairs/day, or wire Upstash from day 1?
6. **Extension parity** — should jobs analyzed via the extension also appear under "Jobs > My history", or keep `analysis_history` and `job_scores` separate?
7. **Hidden behavior** — soft-hide forever, or auto-unhide after 30 days?
8. **Right-to-work filter** — honor a `country` preference and infer "work auth needed" from JD text? Today's `logistics` sub-score handles this only as a per-analysis cap.
9. **Vercel tier** — Hobby caps Node functions at 60 s. Confirming Pro for production?
10. **Cover-letter graph** — does `buildResumeGraph` already produce a cover-letter variant, or does that need a new graph (gates US-3 second CTA)?

---

## Critical files to be created or modified

**New:**
- `website/supabase/migrations/2026XXXXXX_jobs_module.sql` (tables, RPCs, redundancy deltas, JD-change trigger)
- `website/lib/scoring/{types,prompts,guardrails,runJobMatchAnalysis}.ts`
- `website/lib/supabase/admin.ts`
- `website/lib/jobs/sources/{greenhouse,lever,workable,ashby,rss,index,dedup,inferRoleFamily}.ts`
- `website/config/job-sources.ts`
- `website/app/api/cron/jobs-{ingest,embed,score-fanout,score-drain,cleanup,digest}/route.ts`
- `website/app/api/jobs/{route,[id]/route,[id]/save/route,[id]/hide/route,[id]/tailor/route,preferences/route}.ts`
- `website/app/dashboard/jobs/{page,loading,JobsFeedClient,JobRow,FilterBar,EmptyState}.tsx`
- `website/app/dashboard/jobs/[id]/{page,TailorPanel}.tsx`
- `website/app/dashboard/jobs/preferences/{page,PreferencesForm}.tsx`
- `scripts/check-scoring-parity.ts`

**Modified:**
- [website/components/Navbar.tsx](website/components/Navbar.tsx) — add Jobs link
- [website/app/dashboard/page.tsx](website/app/dashboard/page.tsx) — add "Recommended jobs" top-3 card
- `website/vercel.json` — register new cron schedules
- `website/package.json` — `fast-xml-parser`, `react-intersection-observer`, `@upstash/redis` (phase 2+ only if queue is upgraded)
- `package.json` (root) — `npm run lint:scoring-parity` script
