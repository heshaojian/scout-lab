# Scout Lab Product Design

## Summary

Scout Lab is a focused AI learning new-tab extension.

The product replaces a generic browser start page with a small daily research bench. It should help the user notice useful AI signals from GitHub, Hugging Face, arXiv, and curated learning sources, then choose one thing to inspect or learn.

## Name

**Scout Lab**

The name intentionally stays small and practical:

- Scout: find useful signals before they become obvious
- Lab: inspect, learn, compare, and experiment
- Together: a personal workspace for discovering what matters in AI today

Full extension title:

**Scout Lab - AI Learning New Tab**

Tagline:

**Find one useful AI signal every time you open a tab.**

## Product Goal

Scout Lab should answer this question on every new tab:

> What is one useful AI thing I can learn, inspect, or build from today?

The extension is not trying to be a complete research database. It is a daily orientation surface: fast to scan, opinionated about sources, and quiet enough to support learning instead of distraction.

## Audience

Primary user:

- a builder or operator learning AI through real examples
- someone who wants to follow open-source AI without reading every feed
- someone who learns by moving between repos, models, datasets, papers, and tutorials

The design should optimize for repeated daily use rather than one-time exploration.

## Core Sections

Scout Lab uses one shared shell and one consistent content-card grid across six filtered workbenches. The detailed behavior, data contracts, failure states, and acceptance criteria are defined in [Filtered Grid Workbenches](./superpowers/specs/2026-08-28-source-native-workbenches-design.md).

### Today

Sources: all configured sources

Purpose: provide a concise daily briefing without inventing a cross-source popularity score.

The briefing grid contains two code items, one model, one dataset, two papers, and the next learning item. Every item uses the same card structure as its source tab. Each source uses its saved default query.

### Code

Source: GitHub

Purpose: discover AI repositories worth inspecting.

Examples:

- LLM tools
- agent frameworks
- RAG systems
- model-serving utilities
- evaluation tools
- multimodal projects

The workbench is exclusively a GitHub Trending view with daily, weekly, and monthly ranges, spoken language, programming language, and AI topic controls. Cards show repo name, description, language, total stars, forks, and period stars from GitHub's public Trending page. Code never substitutes GitHub Search or another ranking source.

### Models

Source: Hugging Face

Purpose: see what models are being released, liked, downloaded, or discussed.

The workbench uses a balanced discovery-and-runtime layout. Its visible controls are Hugging Face-aligned sorting, task, parameter size, Base models only, and Inference available. The Task menu includes every pipeline that Hugging Face marks as visible in its Models filter, grouped by official modality. Library or format, license, access, application compatibility, and updated date are available under More filters.

The sort menu follows Hugging Face exactly: Trending, Most likes, Most downloads, Recently created, Recently updated, Most parameters, and Least parameters. Quantizations, fine-tunes, adapters, and merges are grouped beneath their base model by default so one model family cannot overwhelm the grid. Items show model name, owner, task, parameter count, library or format, license, access, inference availability, dates, likes, downloads, trending score, and direct model and variant links when those fields are available.

### Datasets

Source: Hugging Face

Purpose: learn what problems people are training and evaluating against.

Datasets are important because they reveal demand, task framing, and evaluation culture. This section should not be treated as secondary to models.

The workbench uses the shared content-card grid. Sort, grouped task, row count, and modality stay visible; format, type, language, license, access, and AI topic sit under More filters. The sort menu follows Hugging Face: Trending, Most likes, Most downloads, Recently created, Recently updated, Most rows, Least rows, Largest total size, and Smallest total size. Cards surface row count, modalities, formats, and Benchmark or Traces type when Hugging Face supplies them.

### Papers

Sources: Hugging Face Daily Papers and arXiv

Purpose: support both community discovery and raw research inspection without treating them as the same signal.

The Community mode shows Hugging Face upvotes, comments, and source-provided summaries. The Raw arXiv mode filters `cs.AI`, `cs.LG`, or both by date and topic. arXiv remains aggressively filtered around:

- LLMs
- agents
- reasoning
- RAG
- evaluation
- benchmarks
- multimodal systems
- diffusion
- alignment
- inference
- datasets

Cards show title, authors, date, summary or abstract snippet, source-specific signals, and PDF/abstract links. arXiv cards never display a popularity metric.

### Learn

Sources: curated learning materials

Purpose: provide one practical next learning step.

Initial sources:

- Hugging Face Learn
- Hugging Face Cookbook
- Google Machine Learning Crash Course
- selected foundational AI/ML resources

This section is a curated personal syllabus, not a scraped popularity feed. It tracks Not started, In progress, and Done states for maintained course, cookbook, and exercise links.

## First-Screen Experience

The first screen is the product. There should be no marketing hero and no onboarding wall.

Layout:

- left rail with Scout Lab identity, section navigation, and archive status
- sections: Today, Code, Models, Datasets, Papers, Learn
- workbench-specific filter bar with no more than four primary controls
- one stable content-card grid with source-specific filters and metadata
- shared daily note and archive status

The interface should make it easy to scan 10-20 items without feeling like a social feed.

## Card Contract

All feeds should normalize into one card model:

```ts
type FeedCard = {
  id: string;
  source: "github" | "huggingface" | "arxiv" | "learn";
  section: "code" | "models" | "datasets" | "papers" | "learn";
  title: string;
  url: string;
  summary: string;
  tags: string[];
  metrics: Array<{ id: string; label: string; value: string; meaning: string }>;
  links: Array<{ id: string; label: string; url: string }>;
  owner?: string;
  publishedAt?: string;
  details: Record<string, unknown>;
};
```

The UI should not need to know source-specific response shapes. Source adapters own parsing and normalization.

## Information Hierarchy

Every item should answer:

1. What is it?
2. Why might I care?
3. How strong is the signal?
4. Where can I open it?

Avoid overloading an item with every available metric. Each source adapter selects the two or three fields that fit the shared card slots and retains remaining metadata in `details`.

## Visual Direction

Scout Lab should feel like a quiet research bench:

- compact
- calm
- readable
- utilitarian
- original, but not performative

Do not use a large marketing hero, decorative gradients, or generic "AI dashboard" styling. The visual identity should come from source badges, precise spacing, strong typography, and a grid that feels designed for daily inspection.

Suggested tone:

- system-following appearance by default
- original light and restrained dark themes
- subtle source colors for GitHub, Hugging Face, arXiv, and Learn
- cards with stable height and predictable metadata placement

## Removed Legacy Scope

Scout Lab should not carry over unrelated features from the older GitHuber experiment.

Remove:

- generic Web / Images / News / Videos / Maps search tabs
- generic search engine configuration
- bookmark sidebar
- bookmark editing
- top-sites import
- image upload
- Qiniu token/upload flows
- Koa/MySQL/admin/login server code
- old cloud sync assumptions

Keep or rebuild from scratch:

- Chrome new-tab override
- feed cache
- source adapters
- simple settings
- theme preference
- link opening behavior

## Architecture

Target structure:

```txt
src/
  app.js
  workbenches/
    today.js
    code.js
    models.js
    datasets.js
    papers.js
    learn.js
  components/
    shell.js
    controls.js
    itemActions.js
    status.js
  services/
    github.js
    huggingface.js
    arxiv.js
    learnSources.js
    storage.js
    archive.js
  styles/
    app.css
```

Each source service should expose one source-specific fetch function and return normalized `FeedCard` objects.

## Data Flow

1. User opens a new tab.
2. App loads current workbench and its saved filters from local settings.
3. The workbench builds a stable query and checks cache by source + all network-affecting filters.
4. If cache is fresh, render cached cards immediately.
5. If cache is missing or stale, fetch source data.
6. Source adapter normalizes data into shared item fields plus source-specific `details`.
7. The shared grid renderer displays normalized cards using source-selected metadata and stores a fresh cache entry.
8. If fetch fails, UI keeps old cache if available and shows a compact error state.

## Error Handling

Failures should not blank the whole page.

Expected behavior:

- source fails but cached data exists: show cached data with a small stale marker
- source fails and no cache exists: show source-specific empty/error state
- GitHub Trending fails: show no repository cards, plus Retry and the exact GitHub Trending link
- one source fails: other tabs continue working
- parsing changes upstream: show an honest source error and direct source link

## Filters

Initial filters should stay simple:

- section
- timeframe for GitHub where supported: today, this week, this month
- spoken language for GitHub: Any, English, Chinese, Japanese, Korean, Spanish, French, German, Portuguese, Russian
- topic filter: all, agents, LLMs, RAG, evaluation, multimodal
- research noise filter: on by default

Keep settings workflow-first and intentionally small. The first settings release covers theme, density, startup behavior, link opening, Today composition, filter defaults, and explicit backup/restore. Detailed behavior lives in [Friendly Settings](./superpowers/specs/2026-08-29-friendly-settings-design.md).

## Copyright And Source Policy

Scout Lab should be built as an original project.

Do not copy source code, styling, assets, docs, or distinctive layout from the older GitHuber extension or other projects. API responses and public metadata can be consumed according to the source's terms, but the implementation, UI, docs, and naming should be original.

Use official APIs where possible. If scraping is required, keep parsing minimal, cache responsibly, and avoid reproducing long copyrighted text.

## MVP Definition

The first usable version should include:

- Chrome extension shell with new-tab override
- Scout Lab name and focused UI
- Build tab with GitHub AI repo feed
- Models tab with Hugging Face model feed
- Datasets tab with Hugging Face dataset feed
- Research tab with arXiv filtered feed
- Learn tab with curated links
- cache and source-error states
- local build instructions

Papers can be included in MVP if the source is easy to fetch cleanly; otherwise add it immediately after.

## Verification

Before calling the MVP usable:

- build the extension bundle
- open the built page locally
- confirm GitHub cards show nonzero signal metrics
- confirm Hugging Face model and dataset cards render
- confirm arXiv cards render with title/date/category
- confirm failed source requests do not break other sections
- confirm the repo contains only original Scout Lab code and docs
