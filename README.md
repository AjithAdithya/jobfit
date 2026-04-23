# JobFit AI

A Chrome extension that analyzes job postings against your resume, scores your fit, and generates tailored resumes and cover letters — all from the browser side panel.

---

## What it does

Open any job posting on LinkedIn, Indeed, Greenhouse, Lever, or any company careers page. Click **Analyze**. JobFit extracts the job description, scores how well your resume matches (0–100), shows you exactly what's missing, and generates a tailored one-page resume and cover letter on demand.

**Core loop:**
1. Upload your resume PDF once
2. Navigate to a job posting → click Analyze
3. Review your match score, strengths, and gaps
4. Select which gaps to address
5. Generate a tailored resume + cover letter
6. Download as DOCX / PDF or open in Google Docs

---

## Features

### Resume Matching
- Semantic scoring (0–100) using vector embeddings across your resume chunks
- Identifies **matching strengths**, **skill gaps**, and **ATS keywords** to target
- 10-tier match classification from *No Fit* to *Elite*

### Tailored Resume Generation
- Claude rewrites your bullet points to address selected gaps — without fabricating experience
- ATS-compliant single-page HTML output
- Style presets: classic, modern, compact — with custom fonts, colors, and spacing
- Extract a style from any existing PDF resume and replicate it
- Regenerate with revision notes ("add more leadership focus", "shorten the summary")

### Cover Letter Generation
- 4-paragraph structure, 450–550 words, streaming output
- Four tones: Professional, Warm, Direct, Enthusiastic
- **Company Intelligence**: automatically researches the company (funding stage, mission, tech stack, culture, recent news) and weaves specific details into the letter

### Smart Extraction
- Extracts job title and company name using JSON-LD structured data, microdata, site-specific selectors (LinkedIn, Indeed, Glassdoor, Greenhouse, Lever, Workday), and Open Graph tags before falling back to heuristics
- Validates the page is actually a job description before running analysis — won't waste API calls on news articles or homepages

### Security
- 3-layer input guardrails: Unicode normalization, invisible character stripping, XML isolation, and Haiku-based prompt injection detection
- Output guardian validates generated resumes for fabricated credentials or leaked system prompts
- All API keys stored in `chrome.storage.local`, never sent to any third-party server

### History & Vault
- Every analysis is saved with score, matches, gaps, and generated documents
- Track application status: Evaluating → Applied → Interviewing → Offer / Rejected
- Resume vault with uploaded and generated resume tabs

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | Chrome MV3, `@crxjs/vite-plugin` |
| Frontend | React 18, TypeScript, Framer Motion |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| AI | Anthropic Claude (Haiku + Sonnet + Opus) |
| Embeddings | Voyage AI |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Google OAuth |
| PDF | pdfjs-dist (client-side) |
| Extraction | Mozilla Readability + Turndown |
| Company Search | DuckDuckGo Instant Answer API |

---

## Project Structure

```
src/
├── SidePanel.tsx          # Main app shell — all views and flows
├── components/
│   ├── MatchCircle.tsx    # Animated match score bar
│   ├── CoverLetter.tsx    # Tone picker, streaming output, company research panel
│   ├── ResumeManager.tsx  # Upload/manage resumes, view generated versions
│   ├── MatchHistory.tsx   # Past analyses, status tracking, downloads
│   ├── Settings.tsx       # API key configuration
│   └── StylePresets.tsx   # Resume style picker and PDF style extractor
├── lib/
│   ├── agents.ts          # All AI agents (analyzer, writer, stylist, researcher, cover letter)
│   ├── anthropic.ts       # Claude API wrapper with model fallback chain
│   ├── guardrails.ts      # Input sanitization + injection detection
│   ├── guardian.ts        # Output validation
│   ├── gdrive.ts          # Google Drive integration
│   ├── matchLevel.ts      # 10-tier scoring thresholds and colors
│   ├── processor.ts       # Resume chunking with section detection
│   ├── search.ts          # Vector similarity search
│   ├── styleUtils.ts      # PDF style extraction, A4 fitting
│   └── supabase.ts        # DB client with Chrome storage auth adapter
├── hooks/
│   ├── useAuth.ts         # Google OAuth + session persistence
│   └── useResumes.ts      # PDF → parse → chunk → embed pipeline
├── store/
│   └── useUIStore.ts      # Global UI state (Zustand)
├── content/
│   └── index.ts           # Content script — DOM extraction
└── background/
    └── index.ts           # Service worker
```

---

## Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with pgvector enabled
- An [Anthropic](https://console.anthropic.com) API key
- A [Voyage AI](https://www.voyageai.com) API key

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
VITE_VOYAGE_API_KEY=your_voyage_api_key
```

API keys can also be entered at runtime via the Settings panel — they're stored locally in `chrome.storage.local` and never leave the browser.

### Supabase Schema

You'll need the following tables:

```sql
-- Enable pgvector
create extension if not exists vector;

-- Uploaded resumes
create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  file_name text not null,
  created_at timestamptz default now()
);

-- Resume chunks with embeddings
create table resume_chunkies (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes on delete cascade,
  user_id uuid references auth.users not null,
  content text not null,
  section text,
  embedding vector(1024),
  created_at timestamptz default now()
);

-- Vector similarity search function
create or replace function match_resume_chunks(
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

-- Analysis history
create table analysis_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  resume_id uuid references resumes,
  job_title text,
  job_url text,
  site_name text,
  score int,
  matches text[],
  gaps text[],
  keywords text[],
  selected_gaps text[],
  selected_keywords text[],
  generated_resume text,
  cover_letter text,
  cover_letter_tone text,
  status text default 'Evaluating',
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
1. Run `npm run build`
2. Go to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** → select the `dist/` folder
5. Pin the extension and open the side panel on any job posting

---

## How Analysis Works

```
Resume PDF
    ↓ pdfjs-dist
Plain text
    ↓ processor.ts (512-char chunks, section tagging)
Chunks
    ↓ Voyage AI embeddings
Stored in Supabase pgvector

Job Posting (any site)
    ↓ content/index.ts (Readability + DOM extraction)
Job description text
    ↓ guardrails.ts (sanitize + XML wrap + injection check)
Sanitized JD
    ↓ Claude Haiku (ANALYZER)
      → validates it's a real JD
      → extracts 5 key requirements
    ↓ Voyage AI (embed requirements)
    ↓ pgvector similarity search against resume chunks
    ↓ Claude (SYNTHESIZER)
Score + Matches + Gaps + Keywords
```

---

## AI Agents

All agents live in `src/lib/agents.ts`:

| Agent | Model | Purpose |
|-------|-------|---------|
| Analyzer | Claude Haiku | Validate JD, extract top 5 requirements |
| Synthesizer | Claude Haiku | Score resume fit, identify matches/gaps/keywords |
| Writer | Claude Opus | Generate tailored single-page resume HTML |
| Cover Letter | Claude Opus | Stream 4-paragraph cover letter with company context |
| Company Researcher | Claude Sonnet | Research company via DuckDuckGo + training knowledge |
| Stylist | Claude Haiku | Convert style description to `ResumeStyle` JSON |
| Style Extractor | Claude Haiku | Replicate style from uploaded PDF metadata |

---

## License

MIT