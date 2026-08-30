# Datasets, Papers, and Learn Reliability Design

## Goal

Make the remaining discovery workbenches dependable for daily use without changing the approved shared-card grid.

## Datasets

- Use Hugging Face's exact dataset task identifiers, grouped by modality.
- Use one exact `size_categories` bucket per option; do not invent combined ranges.
- Keep language, license, access, benchmark, and AI topic as independent filters.
- Request enough source rows before applying the local AI-topic filter.
- Decode HTML entities and bound long source descriptions for readable cards.
- Label created, updated, download, like, and trending metrics according to the selected sort.

## Papers

- Community mode fetches only the selected day, week, or month cohort, then applies Trending or Recent locally.
- Trending means community upvotes inside that cohort, never global Hugging Face trending.
- Raw arXiv uses submitted-date or relevance sorting and preserves the selected date/category query.
- Local preview requests arXiv through a fixed-upstream, GET-only proxy; the extension continues to request arXiv directly.
- Cards may expose validated arXiv PDF and GitHub code links in addition to the primary paper page.

## Learn

- Focus, format, level, and progress are independent filters.
- Every card exposes level and estimated effort in the shared card anatomy.
- The primary action reads Start, Resume, or Review from saved progress and always opens that resource.
- In-progress resources remain first so the daily continuation is immediately visible.

## Reliability Rules

- Source failures remain explicit; no unrelated fallback content is substituted.
- URLs are built from allowlisted filter values and validated before rendering.
- Every source contract has deterministic unit/integration coverage and a real-browser critical-flow test.
- The browser matrix is the durable manual acceptance record.

## Acceptance

1. Every dataset task and size option emits a source-valid exact value.
2. Dataset advanced filters combine without overwriting each other.
3. Community paper results stay inside the selected period for both sorts.
4. Raw arXiv loads through the local preview path without browser CORS failure.
5. Paper PDF and code links open only validated destinations.
6. Learn level filtering works and progress changes the visible action to Resume or Review after reload.
7. Full checks, coverage, Playwright, live-source checks, and dependency audit pass.
