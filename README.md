# Scout Lab

Scout Lab is an AI learning new-tab extension.

Its job is simple: every new tab should surface a small set of useful AI signals from open sources such as GitHub, Hugging Face, arXiv, and curated learning materials.

## Product Direction

Scout Lab is intentionally not a general search page, bookmark manager, or news dashboard. It is a focused daily learning surface for:

- discovering AI repositories worth inspecting
- tracking notable models and datasets
- skimming research without drowning in noise
- finding one useful concept or tutorial to study next

## Planned Feeds

- Code: GitHub AI repositories
- Models: Hugging Face models
- Datasets: Hugging Face datasets
- Papers: arXiv cs.AI and cs.LG
- Learn: curated AI learning resources

## Local Development

Scout Lab is a Manifest V3 extension with no build step.

```bash
npm run check
python3 -m http.server 5179
```

Open `http://127.0.0.1:5179/newtab.html` to preview the page, or load the repository root as an unpacked Chrome extension.

## MVP Features

- new-tab override
- daily AI signal view
- GitHub code feed
- Hugging Face model and dataset feeds
- arXiv paper feed for `cs.AI` and `cs.LG`
- curated learning links
- topic lenses
- favorite, hide, and comment actions
- local cache and daily snapshot
- manual Markdown archive to a chosen iCloud Drive folder

## Status

This repository starts fresh to avoid carrying over unrelated code, design, or licensing baggage from earlier experiments.
