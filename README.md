# JobFit AI

A Chrome extension that analyzes job postings against your resume, scores your fit on a 9-dimension rubric, and generates a tailored LaTeX resume and cover letter — all from the browser side panel.

📘 **[Product Wiki on Notion](https://www.notion.so/JobFit-AI-Product-Wiki-358a26bbfbf981a6b04fc80eba69270a)**

---

## What it does

Open any job posting on LinkedIn, Indeed, Greenhouse, Lever, or a company careers page. Click **Analyze**. JobFit pulls the JD out of the page, scores how well your resume matches (0–100) across nine weighted dimensions, surfaces matches/gaps/keywords, and on demand generates a fully tailored LaTeX resume and a 4-paragraph cover letter.

**Core loop:**
1. Upload a resume PDF and complete your profile (one-time)
2. Navigate to a job posting → click **Analyze**
3. Review your match score, hard-requirements ribbon, strengths, and gaps
4. Select which gaps and keywords to address
5. Generate a tailored LaTeX resume and cover letter
6. Preview the LaTeX in-panel, download as `.tex` / `.docx` / PDF, or push to Google Docs

---

## Features

### Resume Matching
- **9-dimension weighted score** (0–100): hard skills, experience years, domain, seniority, responsibility, soft skills, education, impact, logistics
- **Hard caps** for missing must-haves, missing certs, visa blockers, YoE shortfalls
- **Hard-requirements ribbon** that re-runs an explicit checker against your resume chunks for each must-have requirement
- **Vector recall** over your resume chunks via Voyage embeddings and Supabase pgvector
- 10-tier match classification from *No Fit* to *Elite*
- Confidence flag (low/medium/high) when JDs are too short or signal is sparse

### Tailored Resume Generation
- Claude rewrites bullet points to address the selected gaps and keywords — without fabricating experience
- **LaTeX output** with ATS-safe formatting and a fixed single-page document class
- Live preview rendered in-panel via `latex.js`
- Style presets: `classic`, `modern`, `compact` — custom fonts, colors, spacing, columns
- Extract a style from any existing PDF resume (font, sizes, margins, line spacing) and replicate it
- Regenerate with revision notes ("more leadership focus", "shorten the summary")
- Versioned: every regeneration is saved to `resume_versions`

### Cover Letter Generation
- 4-paragraph structure, 450–550 words, **streaming output**
- Four tones: Professional, Warm, Direct, Enthusiastic
- **Company Intelligence**: a research agent pulls a DuckDuckGo Instant Answer summary, then Claude Sonnet compiles structured research (stage, mission, products, tech stack, culture, recent developments, investors, competitors) and weaves specific details into the letter
- Versioned to `cover_letter_versions`

### Smart Extraction
- Job title and company extracted via JSON-LD structured data, microdata, site-specific selectors (LinkedIn, Indeed, Glassdoor, Greenhouse, Lever, Workday), and Open Graph tags before any heuristics
- Body extracted with Mozilla Readability + Turndown
- An analyzer pass validates the page is actually a JD — won't waste tokens on news articles or homepages

### Security
- **3-layer input guardrails**: Unicode normalization, invisible-character stripping, XML isolation with `<untrusted_job_description>` tags, plus a Haiku-based prompt-injection classifier
- **Output guardian** scans generated resumes for fabricated credentials or leaked system prompts (non-blocking, surfaced as a warning)
- API keys live in `chrome.storage.local`. Claude / Voyage / Supabase calls go direct from the browser — no JobFit-owned proxy

### Profile & Onboarding
- Onboarding overlay walks new users through resume upload and profile fields
- Profile auto-extraction from the first uploaded resume (name, headline, bio, LinkedIn/GitHub, target roles, seniority, YoE)
- Profile completeness scoring drives the dashboard prompt

### History & Vault
- Every analysis is saved with score, sub-scores, caps, matches, gaps, keywords, hard-requirements check, generated resume, and cover letter
- Application status tracking: Evaluating → Applied → Interviewing → Offer / Rejected
- Cost & token usage logged per generation to `generations`

---

## Tech Stack

| Layer            | Technology |
|------------------|-----------|
| Extension        | Chrome MV3, `@crxjs/vite-plugin` |
| Frontend         | React 18, TypeScript, Framer Motion |
| Styling          | Tailwind CSS v4 |
| UI State         | Zustand |
| Server State     | TanStack Query |
| AI               | Anthropic Claude (Haiku 4.5 + Sonnet 4.6) |
| Embeddings       | Voyage AI (`voyage-3-large`, 1024 dims) |
| Database         | Supabase (PostgreSQL + pgvector) |
| Auth             | Supabase Google OAuth via `chrome.identity` PKCE |
| PDF parsing      | `pdfjs-dist` (runs in the side panel) |
| LaTeX preview    | `latex.js` |
| JD extraction    | Mozilla Readability + Turndown |
| Company search   | DuckDuckGo Instant Answer API |

---

## Project Structure

```
src/
├── SidePanel.tsx              # Main app shell — all views and flows
├── components/
│   ├── MatchCircle.tsx           # Animated 0–100 match meter
│   ├── HardRequirementsRibbon.tsx # Pass/fail strip for must-have requirements
│   ├── CoverLetter.tsx           # Tone picker, streaming output, company research panel
│   ├── LatexPreview.tsx          # latex.js renderer for generated resumes
│   ├── ResumeManager.tsx         # Upload/manage resumes, view generated versions
│   ├── MatchHistory.tsx          # Past analyses, status tracking, downloads
│   ├── ProfileView.tsx           # User profile editor with completeness score
│   ├── OnboardingOverlay.tsx     # First-run flow
│   ├── Settings.tsx              # API key configuration and usage stats
│   └── StylePresets.tsx          # Style picker and PDF style extractor
├── lib/
│   ├── agents.ts                 # All AI agents + 9-dimension scoring math
│   ├── anthropic.ts              # Claude API wrapper with model fallback chain
│   ├── voyage.ts                 # Voyage embedding client
│   ├── search.ts                 # match_resume_chunkies RPC wrapper
│   ├── processor.ts              # Resume chunking with section detection
│   ├── guardrails.ts             # Input sanitization + injection detection
│   ├── guardian.ts               # Output validation
│   ├── hardRequirementsChecker.ts# Per-requirement pass/fail against resume chunks
│   ├── profileExtractor.ts       # Auto-fill profile from a parsed resume
│   ├── matchLevel.ts             # 10-tier scoring thresholds and colors
│   ├── ats_guidelines.ts         # Static ATS rules injected into the writer prompt
│   ├── styleUtils.ts             # PDF style metadata extraction, A4 fitting
│   ├── keyValidator.ts           # Validate Anthropic / Voyage keys before save
│   ├── logger.ts                 # Token + cost logging to `generations` table
│   ├── gdrive.ts                 # Google Drive integration
│   ├── supabase.ts               # DB client with Chrome storage auth adapter
│   └── types.ts                  # Shared types (ResumeStyle, DEFAULT_RESUME_STYLE)
├── hooks/
│   ├── useAuth.ts                # Google OAuth + session persistence
│   ├── useProfile.ts             # User profile CRUD + completeness score
│   └── useResumes.ts             # PDF → parse → chunk → embed → store pipeline
├── store/
│   └── useUIStore.ts             # Global UI state (Zustand)
├── content/
│   └── index.ts                  # Content script — Readability + structured-data extraction
├── offscreen/                    # Reserved offscreen document
└── background/
    └── index.ts                  # Service worker (opens side panel on action click)
```

---

## Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with `pgvector` enabled
- An [Anthropic](https://console.anthropic.com) API key
- A [Voyage AI](https://www.voyageai.com) API key

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
```

Anthropic and Voyage keys are entered at runtime via the **Settings** panel — they're stored in `chrome.storage.local` and never leave the browser. (`VITE_ANTHROPIC_API_KEY` / `VITE_VOYAGE_API_KEY` are not used at runtime; the Settings panel is the source of truth.)

### Supabase Schema

Minimum tables required (column lists are non-exhaustive — see the source for full usage):

```sql
create extension if not exists vector;

-- Uploaded resumes
create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  file_name text not null,
  created_at timestamptz default now()
);

-- Resume chunks with Voyage embeddings (1024 dims)
create table resume_chunkies (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes on delete cascade,
  user_id uuid references auth.users not null,
  content text not null,
  section text,
  embedding vector(1024),
  created_at timestamptz default now()
);

-- Vector similarity RPC
create or replace function match_resume_chunkies(
  query_embedding vector(1024),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (id uuid, content text, section text, similarity float)
language sql stable as $$
  select id, content, section,
    1 - (embedding <=> query_embedding) as similarity
  from resume_chunkies
  where user_id = p_user_id
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- User profile (drives header, summary, hard-requirement checks)
create table user_profiles (
  user_id uuid primary key references auth.users,
  email text,
  full_name text,
  headline text,
  bio text,
  professional_summary text,
  target_roles text[] default '{}',
  target_industries text[] default '{}',
  job_type text,
  remote_preference text,
  seniority_level text,
  years_of_experience int,
  location text,
  willing_to_relocate boolean default false,
  visa_status text,
  salary_min int,
  salary_currency text default 'USD',
  salary_period text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  onboarding_completed boolean default false
);

-- Analysis history (one row per Analyze click)
create table analysis_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  resume_id uuid references resumes,
  job_title text,
  job_url text,
  site_name text,
  score int,
  subscores jsonb,
  caps_applied text[],
  confidence text,
  matches text[],
  gaps text[],
  keywords text[],
  selected_gaps text[],
  selected_keywords text[],
  hard_requirements jsonb,
  generated_resume text,    -- LaTeX
  cover_letter text,
  cover_letter_tone text,
  status text default 'Evaluating',
  created_at timestamptz default now()
);

-- Versioned resume + cover letter snapshots
create table resume_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  analysis_id uuid references analysis_history on delete cascade,
  version_number int,
  latex text,
  created_at timestamptz default now()
);

create table cover_letter_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  analysis_id uuid references analysis_history on delete cascade,
  version_number int,
  body text,
  tone text,
  created_at timestamptz default now()
);

-- Style presets
create table style_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  instruction text,
  style_json jsonb,
  created_at timestamptz default now()
);

-- Token + cost log (one row per Claude call)
create table generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  agent text,
  model text,
  input_tokens int,
  output_tokens int,
  cost_usd numeric,
  created_at timestamptz default now()
);
```

### Build & Install

```bash
# Install dependencies
npm install

# Development build (with watch)
npm run dev

# Production build
npm run build

# Build + package as zip
npm run zip
```

**Load in Chrome:**
1. `npm run build`
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. **Load unpacked** → select the `dist/` folder
5. Pin the extension, open the side panel on any job posting, and click the icon

---

## How Analysis Works

```
Resume PDF
    │ pdfjs-dist (side panel)
    ▼
Plain text
    │ processor.ts — 512-char chunks with section tags
    ▼
Chunks
    │ Voyage AI voyage-3-large → 1024-dim vectors
    ▼
Supabase pgvector (resume_chunkies)

Job Posting (any site)
    │ content/index.ts — JSON-LD + site-specific selectors + Readability + Turndown
    ▼
Job description text
    │ guardrails.ts — sanitize + XML-wrap + Haiku injection classifier
    ▼
Sanitized JD
    │ Claude Haiku ANALYZER (tool use)
    │   → validates it's a real JD
    │   → extracts top-5 critical requirements
    ▼
    │ Voyage embeds requirements (parallel) → pgvector recall
    ▼
Matched resume contexts
    │ Claude Haiku SYNTHESIZER (tool use)
    │   → 9 sub-scores + caps + matches + gaps + keywords + confidence
    ▼
computeFinalScore() — weighted composite, applies caps
    │
    └─▶ Hard-requirements checker (Haiku, per-requirement pass/fail)
```

---

## AI Agents

All agents live in [src/lib/agents.ts](src/lib/agents.ts) (plus standalone modules for guardrails, guardian, hard-requirements, and profile extraction).

| Agent               | Model              | Purpose |
|---------------------|--------------------|---------|
| Guardrail classifier| Claude Haiku 4.5   | Detect prompt injection in scraped JDs |
| Analyzer            | Claude Haiku 4.5   | Validate JD, extract top-5 requirements (tool use) |
| Synthesizer         | Claude Haiku 4.5   | Score 9 dimensions, list caps + matches/gaps/keywords (tool use) |
| Hard-requirements   | Claude Haiku 4.5   | Per-requirement pass/fail against resume chunks |
| Writer              | Claude Sonnet 4.6  | Generate tailored single-page LaTeX resume |
| Guardian            | Claude Haiku 4.5   | Validate writer output for fabrication / prompt leakage |
| Cover Letter        | Claude Sonnet 4.6  | Stream 4-paragraph cover letter with company context |
| Company Researcher  | Claude Sonnet 4.6  | DuckDuckGo + training knowledge → structured company brief (tool use) |
| Stylist             | Claude Haiku 4.5   | Convert style description to `ResumeStyle` JSON |
| Style Extractor     | Claude Haiku 4.5   | Replicate style from uploaded PDF metadata |
| Profile Extractor   | Claude Haiku 4.5   | Auto-fill profile fields from a parsed resume |

The Anthropic wrapper in [src/lib/anthropic.ts](src/lib/anthropic.ts) falls back haiku → sonnet on retryable failures.

---

## Scoring Rubric

`computeFinalScore()` in [src/lib/agents.ts](src/lib/agents.ts) combines:

| Dimension          | Weight |
|--------------------|-------:|
| hard_skills        | 25%    |
| experience_years   | 15%    |
| responsibility     | 15%    |
| domain             | 10%    |
| seniority          | 10%    |
| impact             | 10%    |
| soft_skills        | 5%     |
| education          | 5%     |
| logistics          | 5%     |

**Caps** clamp the final score when blockers are present: `missing_must_have:<skill>` → ≤ 65, `missing_required_cert` → ≤ 70, `yoe_short_3plus` → ≤ 70, `visa_blocker` → ≤ 40, `no_metrics` → −5.

---

## License

MIT
