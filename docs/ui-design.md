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
| Learn              |                                                    |
| Library            |                                                    |
|                    |                                                    |
| iCloud Connected   +----------------------------------------------------+
| [Save today]       | Daily note + archive preview                       |
+-------------------+----------------------------------------------------+
```

## Sections

### Today

The default section. It mixes a small cross-source queue in the same grid and card design used by every source tab. It has Search and Refresh but no filter bar: topic exploration belongs to the individual source tabs.

### Code

GitHub Trending repositories in the shared grid. Controls: time range, spoken language, programming language, and AI topic. Trending is the only Code source.

### Models

Hugging Face models in the shared grid. Controls: rank, task, parameter size, and access.

### Datasets

Hugging Face datasets in the shared grid. Sort, exact grouped task, rows, and modality are the primary controls. Format, type, language, license, access, and AI topic are independent advanced filters. The cards expose source-provided rows, modality, format, and dataset type without changing the shared card anatomy.

### Papers

Hugging Face Daily Papers and arXiv in the shared grid. A source segment switches between Community and Raw arXiv, with time, topic/category, and source-valid sort controls. Community Trending ranks upvotes inside the chosen period; raw arXiv uses a fixed local-preview proxy and exposes validated PDF links.

### Learn

A curated catalog in the shared grid. In-progress resources appear first. Controls: focus, format, level, and progress; cards show effort and use Start, Resume, or Review according to saved progress.

### Library

A local review workbench in the shared grid. It has Search but no Refresh because it makes no source request. View switches between All, Favorites, and Notes; additional controls filter by content type and source, then sort by recent update, recent save, or title. A hidden item remains visible here when it is still favorited or annotated.

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

- Favorite: keep this item in Library and the daily archive
- Hide: remove this item from the visible feed
- Comment: add a personal note
- Open: go to the source page

The app should call the visible action "Hide", not "Remove", because the source item still exists. In Library, a hidden card exposes Unhide and remains reviewable.

Favorite or a non-empty Comment adds an item to Library automatically. Removing the favorite and clearing the comment removes it immediately. Library stores a safe display snapshot with the annotation, so the card remains readable after live results change.

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

Comfortable density is optimized for sustained reading with wider cards, larger type, and low-glare surfaces. Detailed behavior and acceptance criteria live in [Long-Session Reading Comfort](./superpowers/specs/2026-08-29-long-session-reading-comfort-design.md).

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

The durable historical review contract lives in [Library-First Review](./superpowers/specs/2026-08-29-library-first-review-design.md).

The source contracts for the final three discovery tabs live in [Datasets, Papers, and Learn Reliability](./superpowers/specs/2026-08-29-datasets-papers-learn-reliability-design.md).

The complete Hugging Face dataset facet and hybrid sort contract lives in [Hugging Face Dataset Facets](./superpowers/specs/2026-08-29-hugging-face-dataset-facets-design.md).
