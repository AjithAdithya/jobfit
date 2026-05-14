-- Job Search Module — Phase 0 migration
-- Tables: curated_jobs, job_scores, user_job_preferences, scoring_queue
-- RPCs: list_user_jobs, top_candidate_jobs
-- Trigger: mark_scores_stale_on_jd_change

-- ─── curated_jobs ────────────────────────────────────────────────────────────

create table public.curated_jobs (
  id              uuid primary key default gen_random_uuid(),
  source          text not null check (source in ('greenhouse','lever','workable','ashby','rss','manual')),
  source_id       text not null,
  source_url      text not null,
  dedup_hash      text not null unique,
  description_hash text,
  company         text not null,
  job_title       text not null,
  job_description text not null,
  location        text,
  location_type   text check (location_type in ('remote','hybrid','onsite','unknown')),
  comp_min        int,
  comp_max        int,
  comp_currency   text default 'USD',
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

create index curated_jobs_active_posted_idx
  on public.curated_jobs (active, posted_at desc);

create index curated_jobs_embedding_ivf_idx
  on public.curated_jobs using ivfflat (job_embedding vector_cosine_ops)
  with (lists = 200);

create index curated_jobs_desc_hash_idx
  on public.curated_jobs (description_hash);

create index curated_jobs_role_family_idx
  on public.curated_jobs (role_family)
  where active = true;

alter table public.curated_jobs enable row level security;

create policy curated_jobs_read on public.curated_jobs
  for select
  using (auth.role() = 'authenticated' and active = true);

-- ─── job_scores ──────────────────────────────────────────────────────────────

create table public.job_scores (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  job_id            uuid not null references public.curated_jobs(id) on delete cascade,
  resume_id         uuid not null references public.resumes(id) on delete cascade,
  score             smallint not null check (score between 0 and 100),
  subscores         jsonb not null,
  caps_applied      text[] default '{}',
  confidence        text check (confidence in ('low','medium','high')),
  matches           jsonb not null default '[]'::jsonb,
  gaps              jsonb not null default '[]'::jsonb,
  keywords          jsonb not null default '[]'::jsonb,
  pre_filter_cosine numeric(5,4),
  scored_at         timestamptz not null default now(),
  hidden            boolean not null default false,
  saved             boolean not null default false,
  stale             boolean not null default false,
  digest_sent_at    timestamptz,
  unique (user_id, job_id, resume_id)
);

create index job_scores_user_score_idx
  on public.job_scores (user_id, score desc, scored_at desc);

create index job_scores_stale_idx
  on public.job_scores (job_id)
  where stale = true;

create index job_scores_saved_idx
  on public.job_scores (user_id, saved)
  where saved = true;

alter table public.job_scores enable row level security;

create policy job_scores_self_read   on public.job_scores
  for select using (auth.uid() = user_id);

create policy job_scores_self_update on public.job_scores
  for update using (auth.uid() = user_id);

-- ─── user_job_preferences ────────────────────────────────────────────────────

create table public.user_job_preferences (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  roles_of_interest    text[] not null default '{}',
  locations            text[] not null default '{}',
  remote_ok            boolean not null default true,
  hybrid_ok            boolean not null default true,
  onsite_ok            boolean not null default true,
  comp_min             int,
  seniority_floor      text,
  seniority_ceiling    text,
  excluded_companies   text[] not null default '{}',
  active_resume_id     uuid references public.resumes(id) on delete set null,
  profile_embedding    vector(1024),
  profile_embedding_at timestamptz,
  notify_email         boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.user_job_preferences enable row level security;

create policy ujp_self on public.user_job_preferences
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── scoring_queue ───────────────────────────────────────────────────────────

create table public.scoring_queue (
  id          bigserial primary key,
  user_id     uuid not null,
  job_id      uuid not null,
  resume_id   uuid not null,
  attempts    smallint not null default 0,
  enqueued_at timestamptz not null default now(),
  unique (user_id, job_id, resume_id)
);

-- ─── Trigger: stale-mark scores when JD body changes ─────────────────────────

create or replace function mark_scores_stale_on_jd_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if old.description_hash is distinct from new.description_hash then
    update public.job_scores
    set stale = true
    where job_id = new.id;
  end if;
  return new;
end;
$$;

create trigger curated_jobs_jd_change_trg
  after update on public.curated_jobs
  for each row
  execute function mark_scores_stale_on_jd_change();

-- ─── RPC: list_user_jobs ─────────────────────────────────────────────────────

create or replace function list_user_jobs(
  p_user_id        uuid,
  p_location_type  text     default null,   -- 'remote' | 'hybrid' | 'onsite' | null (any)
  p_score_floor    smallint default 0,
  p_role_family    text     default null,
  p_source         text     default null,
  p_max_age_days   int      default 35,
  p_include_hidden boolean  default false,
  p_include_saved  boolean  default null,   -- null = all, true = saved only
  p_limit          int      default 25,
  p_offset         int      default 0
)
returns table (
  job_id          uuid,
  source          text,
  source_url      text,
  company         text,
  job_title       text,
  location        text,
  location_type   text,
  comp_min        int,
  comp_max        int,
  comp_currency   text,
  role_family     text,
  seniority       text,
  posted_at       timestamptz,
  score           smallint,
  subscores       jsonb,
  caps_applied    text[],
  confidence      text,
  matches         jsonb,
  gaps            jsonb,
  keywords        jsonb,
  hidden          boolean,
  saved           boolean,
  scored_at       timestamptz
)
language sql
stable
security definer
as $$
  select
    j.id            as job_id,
    j.source,
    j.source_url,
    j.company,
    j.job_title,
    j.location,
    j.location_type,
    j.comp_min,
    j.comp_max,
    j.comp_currency,
    j.role_family,
    j.seniority,
    j.posted_at,
    s.score,
    s.subscores,
    s.caps_applied,
    s.confidence,
    s.matches,
    s.gaps,
    s.keywords,
    s.hidden,
    s.saved,
    s.scored_at
  from public.job_scores s
  join public.curated_jobs j on j.id = s.job_id
  join public.user_job_preferences ujp on ujp.user_id = s.user_id
  where
    s.user_id = p_user_id
    and s.resume_id = ujp.active_resume_id
    and s.stale = false
    and j.active = true
    and (p_include_hidden or not s.hidden)
    and (p_include_saved is null or s.saved = p_include_saved)
    and s.score >= p_score_floor
    and j.posted_at >= (now() - (p_max_age_days || ' days')::interval)
    and (p_location_type is null or j.location_type = p_location_type)
    and (p_role_family   is null or j.role_family   = p_role_family)
    and (p_source        is null or j.source        = p_source)
  order by s.score desc, j.posted_at desc
  limit  p_limit
  offset p_offset;
$$;

-- ─── RPC: top_candidate_jobs ─────────────────────────────────────────────────

create or replace function top_candidate_jobs(
  p_user_id      uuid,
  p_limit        int default 500,
  p_max_age_days int default 35
)
returns table (
  job_id    uuid,
  job_title text,
  company   text,
  cosine    float
)
language sql
stable
security definer
as $$
  select
    j.id        as job_id,
    j.job_title,
    j.company,
    1 - (j.job_embedding <=> ujp.profile_embedding) as cosine
  from public.curated_jobs j
  cross join public.user_job_preferences ujp
  where
    ujp.user_id = p_user_id
    and ujp.profile_embedding is not null
    and j.job_embedding is not null
    and j.active = true
    and j.posted_at >= (now() - (p_max_age_days || ' days')::interval)
    -- Exclude jobs already scored (and not stale) for this user+resume combo
    and not exists (
      select 1
      from public.job_scores s
      where s.job_id  = j.id
        and s.user_id = p_user_id
        and s.resume_id = ujp.active_resume_id
        and s.stale = false
    )
    -- Exclude jobs already in the queue
    and not exists (
      select 1
      from public.scoring_queue q
      where q.job_id  = j.id
        and q.user_id = p_user_id
        and q.resume_id = ujp.active_resume_id
    )
  order by j.job_embedding <=> ujp.profile_embedding
  limit p_limit;
$$;

-- ─── View: ingest_health_daily (admin dashboard) ─────────────────────────────

create or replace view public.ingest_health_daily as
select
  source,
  count(*) filter (where ingested_at >= now() - interval '24 hours')  as ingested_24h,
  count(*) filter (where ingested_at >= now() - interval '7 days')    as ingested_7d,
  count(*) filter (where not active)                                   as inactive_total,
  (
    select count(*)
    from public.job_scores s2
    where s2.stale = true
      and s2.scored_at >= now() - interval '24 hours'
      and s2.job_id in (select id from public.curated_jobs j2 where j2.source = j.source)
  )                                                                    as stale_scores_24h
from public.curated_jobs j
group by source;
