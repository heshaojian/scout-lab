# Scout Lab

[![Quality](https://github.com/heshaojian/scout-lab/actions/workflows/quality.yml/badge.svg)](https://github.com/heshaojian/scout-lab/actions/workflows/quality.yml)
[![Live sources](https://github.com/heshaojian/scout-lab/actions/workflows/live-sources.yml/badge.svg)](https://github.com/heshaojian/scout-lab/actions/workflows/live-sources.yml)

Scout Lab is an AI discovery new-tab extension.

Its job is simple: every new tab surfaces a focused set of useful AI signals from GitHub, Hugging Face, and arXiv.

## Product Direction

Scout Lab is intentionally not a general search page, bookmark manager, or news dashboard. It is a focused daily learning surface for:

- discovering AI repositories worth inspecting
- tracking notable models and datasets
- skimming research without drowning in noise
- preserving useful discoveries and personal notes in a local Library

## Feeds

- Code: GitHub AI repositories
- Models: Hugging Face models
- Datasets: Hugging Face datasets
- Papers: arXiv cs.AI and cs.LG

## Local Development

Scout Lab is a Manifest V3 extension with no build step.

```bash
npm run check
npm test
npm run test:coverage
npm run test:live
npm run dev
```

Open `http://127.0.0.1:5179/newtab.html` to preview the page, or load the repository root as an unpacked Chrome extension.

The complete automated test map, browser acceptance cases, coverage gate, and maintenance rules are documented in [Testing](./docs/testing.md).

## Features

- new-tab override
- daily AI signal view
- exact GitHub Trending code feed with spoken-language filtering
- Hugging Face model and dataset feeds
- arXiv paper feed for `cs.AI` and `cs.LG`
- topic lenses
- source-specific rank, time, language, task, size, access, and category filters
- one consistent responsive card grid across every section
- system, light, and dark themes with comfortable or compact density
- configurable startup workbench, link opening, and Today source mix
- saved filter defaults for every workbench
- validated JSON backup and restore for durable local data
- favorite, hide, and comment actions
- local cache and daily snapshot
- manual Markdown archive to a chosen iCloud Drive folder

## Architecture

Scout Lab has no build step. Source adapters normalize GitHub, Hugging Face, and arXiv data into a shared card contract. Query-aware local caches preserve fast startup, while versioned preferences, favorites, hidden items, comments, daily notes, and snapshots remain on-device. Explicit JSON backup keeps durable data portable without exporting caches or the iCloud folder handle.

## Privacy

Scout Lab has no account, analytics, advertising, tracking, or publisher-operated backend. Preferences, annotations, and snapshots stay in the browser. See the [Privacy Policy](./PRIVACY.md).
