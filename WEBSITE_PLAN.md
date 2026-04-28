# JobFit Website — Feature Parity Plan

Last updated: 2026-04-28

---

## Extension nav vs. website nav

| Extension view | Route on website | Status |
|---|---|---|
| Dashboard (analyze JD) | `/dashboard` | Partial — has stats, not JD input |
| Analysis (match results) | `/dashboard/history/[id]` | Done |
| Vault (resume manager) | `/dashboard/vault` | Not built |
| History (analytics + list) | `/dashboard/history` | Not built |
| Cover Letter | `/dashboard/history/[id]/cover-letter` | Not built |
| Settings | `/dashboard/settings` | Not built |

---

## Done in this session (2026-04-28)

- [x] Logged-in users redirected from marketing pages (`/`, `/features`, `/how-it-works`, `/login`) → `/dashboard` (middleware)
- [x] Navbar shows app nav (dashboard, vault, history, settings) when logged in; marketing nav when logged out
- [x] LangGraph multi-node resume generation backend (`POST /api/resume/generate`) with streaming SSE
  - Nodes: retrieve_context → write_resume → critique → guardian → polish
  - Critique loop: retries writer up to 3× when coverage score < 0.70
  - Guardian loop: retries writer up to 2× on HIGH-confidence violations
- [x] Claude native tool use for all structured agent outputs (eliminates extractJSON fragility)
- [x] Parallel pgvector searches across requirements
- [x] `withRetry` (3 attempts, exponential backoff) on critical LLM calls
- [x] Company context passed into Writer agent

---

## Phase 1 — Core app pages (build these first)

### 1A. Stub pages — unblock nav links (1 day)
Vault, history list, and settings are in the nav but don't exist → 404.
Create minimal placeholder pages so nav links work:
- `website/app/dashboard/vault/page.tsx` — "Resume vault coming soon"
- `website/app/dashboard/history/page.tsx` — basic list (reuse analysis_history query from dashboard)
- `website/app/dashboard/settings/page.tsx` — profile + sign out only

---

### 1B. History overview — `/dashboard/history`
Mirror of extension "History" tab with analytics.

**Features:**
- Analytics strip: avg match score, top-5 gaps bar, total jobs tracked
- Table: all `analysis_history` rows — score, job title, company, date, status
- Status dropdown per row (Evaluating → Applied → Interviewing → Offer / Rejected)
- Click row → `/dashboard/history/[id]`
- Delete row

**Key files to create:**
- `website/app/dashboard/history/page.tsx`
- `website/components/HistoryTable.tsx`
- `website/components/AnalyticsStrip.tsx`

**Effort:** 1–2 days

---

### 1C. Resume Vault — `/dashboard/vault`
Mirror of extension "Vault" tab.

**Features:**
- List uploaded PDFs: name, date, size — click to set active
- Upload new PDF → server: parse → chunk → Voyage embed → insert to `resume_chunkies`
- Delete uploaded resume (cascades to chunks)
- List AI-generated resumes: job title, date, score — link to editor, download DOCX

**Key files to create:**
- `website/app/dashboard/vault/page.tsx`
- `website/components/VaultPage.tsx`
- `website/app/api/resume/upload/route.ts` (PDF ingestion pipeline)

**Effort:** 3–4 days (PDF parsing + embedding pipeline is the hard part)

---

### 1D. Settings — `/dashboard/settings`
Mirror of extension "Settings" tab (adapted — no browser-stored API keys on website).

**Features:**
- Profile card: email, avatar initial, plan
- Usage analytics: AI calls, cost, per-model breakdown (from `ai_usage_logs` or derived from history)
- Data section: what's stored, last analysis date, resume count
- Delete all data button → `DELETE /api/account/delete` (wipes `analysis_history` + `resume_chunkies` for user)
- Sign out

**Key files to create:**
- `website/app/dashboard/settings/page.tsx`
- `website/app/api/account/delete/route.ts`

**Effort:** 1 day

---

## Phase 2 — Job analysis from website

The extension pulls JD from the active browser tab. The website needs its own entry point.

### 2A. New Analysis form — on `/dashboard`
Add to the existing dashboard page.

**Features:**
- Textarea: paste raw JD text
- OR URL input: paste job posting URL → server fetches + Readability parses the page text
- Active resume selector (shows current resume, warns if none)
- "Analyze" button → `POST /api/analysis/run`
  - Guardrails → Analyzer (tool use) → Voyage embeddings → pgvector → Synthesizer (tool use)
  - Saves result to `analysis_history`
  - Redirects to `/dashboard/history/[id]`
- Loading state with step indicators ("Extracting requirements…", "Searching resume…", "Scoring fit…")

**Key files to create:**
- `website/components/NewAnalysisForm.tsx`
- `website/app/api/analysis/run/route.ts`
- `website/app/api/analysis/extract-url/route.ts` (URL fetch + parse)

**Effort:** 2–3 days

---

### 2B. Cover Letter page — `/dashboard/history/[id]/cover-letter`
Full cover letter generation, mirroring the extension's Cover Letter view.

**Features:**
- Job context header (title, company)
- Company intelligence card (auto-fetched: stage, tech stack, culture, recent news)
- Tone selector: Professional / Warm / Direct / Enthusiastic
- "Generate" button → streams SSE from `POST /api/cover-letter/generate`
- Streaming output with word count
- Actions: copy, download DOCX, download PDF
- Regenerate

**Reuse:** `fetchCompanyResearch` from `website/lib/graph/nodes.ts`

**Key files to create:**
- `website/app/dashboard/history/[id]/cover-letter/page.tsx`
- `website/components/CoverLetterView.tsx`
- `website/app/api/cover-letter/generate/route.ts` (streaming SSE, Opus 4.7)

**Effort:** 1–2 days

---

## Phase 3 — Generate resume from website

Currently resumes are only generated by the extension. The website should support full generation.

### 3A. Generate button on detail page
On `/dashboard/history/[id]`, add "Generate Resume" when gaps/keywords are selected.

- `POST /api/resume/generate` (the LangGraph endpoint built in this session)
- SSE progress UI: per-node status ("Writing…", "Critiquing — score 0.64, retrying…", "Running safety check…")
- On completion → save to `analysis_history.generated_resume`, show preview
- Link to `/dashboard/history/[id]/edit`

**Key files to modify:**
- `website/app/dashboard/history/[id]/page.tsx` — add generate button + SSE stream consumer

**Effort:** 1 day

---

## Phase 4 — Web-only features

No extension equivalent, but natural for the website.

| Feature | Description | Effort |
|---|---|---|
| Application tracker | Kanban board (Evaluating / Applied / Interviewing / Offer / Rejected) | 2 days |
| Gap trends chart | Frequency of each gap across all analyzed jobs over time | 1 day |
| Bulk export | Download all generated resumes as a ZIP | 1 day |
| Resume comparison | Side-by-side diff between two generated versions | 2–3 days |

---

## Build order

| Priority | Item | Estimated effort |
|---|---|---|
| Now | Stub pages for vault, history, settings | 1 day |
| Next | 1B — History overview | 1–2 days |
| Next | 2A — New Analysis form | 2–3 days |
| Soon | 1C — Resume Vault | 3–4 days |
| Soon | 2B — Cover Letter page | 1–2 days |
| Soon | 3A — Generate from website (wire LangGraph) | 1 day |
| Later | 1D — Settings | 1 day |
| Later | Phase 4 extras | varies |

---

## Current nav state

**Logged-out navbar:** features → how it works → privacy | sign in, join the beta
**Logged-in navbar:** dashboard → vault → history → settings | sign out

> Vault, history (list), and settings currently 404 — stub pages needed as first step.
