# Scout Lab UI Design

## Goal

Scout Lab should make each new tab productive in under 30 seconds.

The screen should help the user:

- notice one strong AI signal
- scan a small queue of code, model, dataset, and paper items
- favorite, hide, or comment on anything
- save a daily learning trace to iCloud Drive

## Layout

The approved filtered-grid layout uses:

- a left rail for identity, section navigation, and iCloud archive status
- a workbench header with source-specific controls
- one identical content-card grid for every section
- a daily note and archive preview strip

```txt
+-------------------+----------------------------------------------------+
| Scout Lab          | Workbench title                     [Search] [↻]   |
| AI learning tab    | [Source-specific controls]                          |
|                   +----------------------------------------------------+
| Today              | Consistent content-card grid                       |
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

The default section. It mixes a small cross-source queue in the same grid and card design used by every source tab.

### Code

GitHub Trending repositories in the shared grid. Controls: time range, spoken language, programming language, and AI topic. Trending is the only Code source.

### Models

Hugging Face models in the shared grid. Controls: rank, task, parameter size, and access.

### Datasets

Hugging Face datasets in the shared grid. Controls: rank, task, size, and additional language/license/benchmark filters.

### Papers

Hugging Face Daily Papers and arXiv in the shared grid. A source segment switches between Community and Raw arXiv, with time, topic/category, and source-valid sort controls.

### Learn

A curated catalog in the shared grid. The first card is the current learning item, followed by courses, cookbooks, and exercises. Controls: focus, format, and progress.

## Shared Card Anatomy

Every content card uses the same dimensions and information order:

1. Source/type badge and primary metric
2. Title
3. Three-line summary
4. Up to four tags
5. Secondary metadata row
6. Favorite, Hide, Comment, and Open actions

Source colors identify content without changing card geometry. Missing metadata is omitted or labelled `Not specified`; it never changes the footer position.

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
- GitHub source failures show no substitute repository cards.
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

## Friendly Settings

Settings opens as a compact right-side drawer, becoming a full-width overlay on mobile. It includes system/light/dark theme, comfortable/compact density, startup and link-opening behavior, Today source composition, saved workbench defaults, and validated backup/restore. Preferences apply immediately and preserve the shared workbench grid.

Detailed settings behavior and acceptance criteria live in [Friendly Settings](./superpowers/specs/2026-08-29-friendly-settings-design.md).

## MVP Interaction Rules

- Show 12-24 items per workbench, depending on layout density.
- Never blank the page if one source fails.
- Keep stale cached data visible when possible.
- Never show old-section items beneath a newly selected workbench.
- Hidden items stay hidden across refreshes.
- Favorited items stay visible in the reading list and daily archive.
- Comments autosave locally.
- iCloud export is manual-first: the user clicks "Save today".

Detailed behavior and complete acceptance criteria live in [Filtered Grid Workbenches](./superpowers/specs/2026-08-28-source-native-workbenches-design.md).
