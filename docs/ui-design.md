# Scout Lab UI Design

## Goal

Scout Lab should make each new tab productive in under 30 seconds.

The screen should help the user:

- notice one strong AI signal
- scan a small queue of code, model, dataset, and paper items
- favorite, hide, or comment on anything
- save a daily learning trace to iCloud Drive

## Layout

The approved MVP layout uses:

- a left rail for identity, section navigation, and iCloud archive status
- a top filter bar for topic lenses
- a primary "Today's signal" module
- a compact learning prompt
- a daily queue card grid
- a daily note and archive preview strip

```txt
+-------------------+----------------------------------------------------+
| Scout Lab          | [All] [Agents] [LLMs] [RAG] [Eval] [Multimodal]   |
| AI learning tab    |                                      [Filter] [↻] |
|                   +----------------------------------------------------+
| Today              | Today's signal                 Learning prompt     |
| Code               |                                                    |
| Models             +----------------------------------------------------+
| Datasets           | Today's queue                                      |
| Papers             | [Code] [Model] [Dataset] [Paper]                  |
|                    |                                                    |
| iCloud Connected   +----------------------------------------------------+
| [Save today]       | Daily note + archive preview                       |
+-------------------+----------------------------------------------------+
```

## Sections

### Today

The default section. It mixes the most useful items across sources and includes a learning prompt.

### Code

GitHub repositories. This section means runnable or readable code, not generic AI news.

### Models

Hugging Face models. This section helps the user notice model releases and useful weights.

### Datasets

Hugging Face datasets. This section helps the user understand what people are training and evaluating against.

### Papers

Hugging Face Papers and arXiv. This section is for ideas and research context. arXiv results should be filtered by default to reduce noise.

## Topic Lenses

Initial filters:

- All
- Agents
- LLMs
- RAG
- Eval
- Multimodal

Filters should affect all feed sections, not just one source.

## Card Actions

Every card supports:

- Favorite: keep this item in the reading list and daily archive
- Hide: remove this item from the visible feed
- Comment: add a personal note
- Open: go to the source page

The app should call the visible action "Hide", not "Remove", because the source item still exists.

## Daily Archive

Scout Lab stores daily results locally first. The user can optionally connect an iCloud Drive folder using the browser's directory picker.

Target archive structure:

```txt
iCloud Drive/
  Scout Lab/
    2026/
      08/
        2026-08-29.md
    saved/
      saved-items.json
    settings.json
```

The daily Markdown file should include:

- today's signal
- visible queue
- favorites
- hidden items
- comments
- learning note

## Visual Style

The UI should feel like a compact research bench:

- light, calm, and utilitarian
- no marketing hero
- no generic AI dashboard decoration
- stable card sizes
- small source/type badges
- restrained color accents by item type
- readable typography and clear spacing

The design should stay focused on daily learning, not engagement loops.

## MVP Interaction Rules

- Show 12-20 cards per section.
- Never blank the page if one source fails.
- Keep stale cached data visible when possible.
- Hidden items stay hidden across refreshes.
- Favorited items stay visible in the reading list and daily archive.
- Comments autosave locally.
- iCloud export is manual-first: the user clicks "Save today".

