# Scout Lab UI Design

## Goal

Scout Lab should make each new tab productive in under 30 seconds.

The screen should help the user:

- notice one strong AI signal
- scan a small queue of code, model, dataset, and paper items
- favorite, hide, or comment on anything
- save a daily learning trace to iCloud Drive

## Layout

The approved source-native layout uses:

- a left rail for identity, section navigation, and iCloud archive status
- a workbench header with source-specific controls
- a unique content layout for every section
- a daily note and archive preview strip

```txt
+-------------------+----------------------------------------------------+
| Scout Lab          | Workbench title                     [Search] [↻]   |
| AI learning tab    | [Source-specific controls]                          |
|                   +----------------------------------------------------+
| Today              | Source-native workbench                            |
| Code               |                                                    |
| Models             |                                                    |
| Datasets           |                                                    |
| Papers             |                                                    |
|                    |                                                    |
| iCloud Connected   +----------------------------------------------------+
| [Save today]       | Daily note + archive preview                       |
+-------------------+----------------------------------------------------+
```

## Sections

### Today

The default section. It uses a briefing layout with a lead signal, source lanes, and the next learning item.

### Code

GitHub repositories in a dense grid. Controls: mode, time range, language, and AI topic.

### Models

Hugging Face models in a comparison shelf. Controls: rank, task, parameter size, and access.

### Datasets

Hugging Face datasets in a comparison table that becomes structured cards on narrow screens. Controls: rank, task, size, and additional language/license/benchmark filters.

### Papers

Hugging Face Daily Papers and arXiv in an editorial list. A source segment switches between Community and Raw arXiv, with time, topic/category, and source-valid sort controls.

### Learn

A curated learning path with Continue learning, Courses, and Cookbooks and exercises. Controls: focus, format, and progress.

## Topic Vocabulary

Initial filters:

- All
- Agents
- LLMs
- RAG
- Eval
- Multimodal

Topic is a source-translated workbench control. It does not imply that every source supports identical query semantics.

## Source-Specific Metrics

- GitHub period stars appear only in true Trending results.
- GitHub API fallbacks show total stars without a growth label.
- Hugging Face trending score is labelled as a source rank signal.
- Community papers show upvotes and comments.
- Raw arXiv papers show categories and dates, never popularity.

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

- Show 12-24 items per workbench, depending on layout density.
- Never blank the page if one source fails.
- Keep stale cached data visible when possible.
- Never show old-section items beneath a newly selected workbench.
- Hidden items stay hidden across refreshes.
- Favorited items stay visible in the reading list and daily archive.
- Comments autosave locally.
- iCloud export is manual-first: the user clicks "Save today".

Detailed behavior and complete acceptance criteria live in [Source-Native Workbenches](./superpowers/specs/2026-08-28-source-native-workbenches-design.md).
