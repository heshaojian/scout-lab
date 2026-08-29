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

### Build

Source: GitHub

Purpose: discover AI repositories worth inspecting.

Examples:

- LLM tools
- agent frameworks
- RAG systems
- model-serving utilities
- evaluation tools
- multimodal projects

Cards should show repo name, description, language, stars, forks, and today/week/month signal when available.

### Models

Source: Hugging Face

Purpose: see what models are being released, liked, downloaded, or discussed.

Cards should show model name, owner, task tags, likes/downloads when available, and direct model link.

### Datasets

Source: Hugging Face

Purpose: learn what problems people are training and evaluating against.

Datasets are important because they reveal demand, task framing, and evaluation culture. This section should not be treated as secondary to models.

Cards should show dataset name, owner, tags, likes/downloads when available, and direct dataset link.

### Papers

Source: Hugging Face Papers

Purpose: show papers with community context and links to code or arXiv when available.

Cards should show paper title, short summary, upvotes or discussion signal when available, and links to GitHub/arXiv where present.

### Research

Sources: arXiv `cs.AI` and `cs.LG`

Purpose: provide access to the raw research feed without letting it dominate the experience.

This section should be filtered aggressively. arXiv is powerful but noisy, so the default view should prioritize papers related to:

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

Cards should show title, authors, category, submitted date, abstract snippet, and PDF/abstract links.

### Learn

Sources: curated learning materials

Purpose: provide one practical next learning step.

Initial sources:

- Hugging Face Learn
- Hugging Face Cookbook
- Google Machine Learning Crash Course
- selected foundational AI/ML resources

This section should feel curated, not scraped. It is acceptable to start with a maintained local list and add live sources later.

## First-Screen Experience

The first screen is the product. There should be no marketing hero and no onboarding wall.

Layout:

- top bar with the Scout Lab name and a compact source switcher
- section tabs: Build, Models, Datasets, Papers, Research, Learn
- optional small filter row for timeframe and topic
- dense card grid optimized for scanning
- right or top summary area for "today's signal" if it earns its place

The interface should make it easy to scan 10-20 items without feeling like a social feed.

## Card Contract

All feeds should normalize into one card model:

```ts
type FeedCard = {
  id: string;
  source: "github" | "huggingface" | "arxiv" | "learn";
  section: "build" | "models" | "datasets" | "papers" | "research" | "learn";
  title: string;
  url: string;
  summary: string;
  tags: string[];
  metricLabel?: string;
  metricValue?: string;
  secondaryMetricLabel?: string;
  secondaryMetricValue?: string;
  owner?: string;
  publishedAt?: string;
};
```

The UI should not need to know source-specific response shapes. Source adapters own parsing and normalization.

## Information Hierarchy

Every card should answer:

1. What is it?
2. Why might I care?
3. How strong is the signal?
4. Where can I open it?

Avoid overloading cards with every available metric. One primary metric is usually enough.

## Visual Direction

Scout Lab should feel like a quiet research bench:

- compact
- calm
- readable
- utilitarian
- original, but not performative

Do not use a large marketing hero, decorative gradients, or generic "AI dashboard" styling. The visual identity should come from source badges, precise spacing, strong typography, and a grid that feels designed for daily inspection.

Suggested tone:

- light interface by default
- restrained dark mode later
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

Recommended structure:

```txt
src/
  app/
    App.tsx
    routes.ts
  components/
    FeedCard.tsx
    FeedTabs.tsx
    FilterBar.tsx
    EmptyState.tsx
  services/
    cache.ts
    github.ts
    huggingface.ts
    arxiv.ts
    learnSources.ts
  state/
    feeds.ts
    settings.ts
  types/
    feed.ts
  styles/
    tokens.css
    app.css
```

Each source service should expose one source-specific fetch function and return normalized `FeedCard` objects.

## Data Flow

1. User opens a new tab.
2. App loads current section and filters from local settings.
3. Feed state checks cache by source + section + filters.
4. If cache is fresh, render cached cards immediately.
5. If cache is missing or stale, fetch source data.
6. Source adapter normalizes data into `FeedCard[]`.
7. UI renders cards and stores a fresh cache entry.
8. If fetch fails, UI keeps old cache if available and shows a compact error state.

## Error Handling

Failures should not blank the whole page.

Expected behavior:

- source fails but cached data exists: show cached data with a small stale marker
- source fails and no cache exists: show source-specific empty/error state
- one source fails: other tabs continue working
- parsing changes upstream: show raw link fallback where possible

## Filters

Initial filters should stay simple:

- section
- timeframe for GitHub where supported: today, this week, this month
- topic filter: all, agents, LLMs, RAG, evaluation, multimodal
- research noise filter: on by default

Avoid building a complex settings system early.

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
- cache and fallback states
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
