# Remove Learn Workbench Design

**Status:** Approved for implementation
**Date:** 2026-08-29
**Product:** Scout Lab Chrome new-tab extension

## 1. Summary

Scout Lab will remove Learn as a product workbench and permanently delete all structured Learn data from active local state. The removal includes navigation, Today composition, settings, source code, progress tracking, Library filters, caches, snapshots, backups, tests, and documentation.

Previously exported JSON files and iCloud Markdown files remain untouched. Future imports of an older Scout Lab backup discard Learn records so removed data cannot re-enter the application.

## 2. Goals

1. Remove the Learn workbench and every user-facing Learn control.
2. Remove unused Learn source, progress, rendering, storage, and styling code.
3. Purge all structured Learn records already stored in the active browser origin.
4. Preserve unrelated favorites, comments, settings, notes, snapshots, and source data.
5. Accept version-1 backups for portability while sanitizing Learn data during migration.
6. Keep Today, Library, backup, and future automatic iCloud behavior internally consistent.

## 3. Non-Goals And Deletion Boundary

This migration does not:

- inspect or rewrite free-form daily-note text that happens to mention learning or a course
- delete previously exported backup files from the filesystem
- rewrite existing iCloud Markdown archives
- delete ordinary GitHub, Hugging Face, or arXiv cards merely because their text contains the word `learn`
- remove Scout Lab's broader goal of learning through code, models, datasets, and papers

Structured Learn data is identified by product-owned fields, not text search. A record is Learn data when any of these is true:

- its item ID begins with `learn:`
- its normalized card has `source: "learn"`
- its normalized card has `section: "learn"`
- its normalized card has `type: "Learn"`
- it is stored in the Learn progress map or Learn workbench settings

## 4. Product Surface Removal

Remove:

- the Learn navigation tab and workbench definition
- focus, format, level, and progress filters
- curated Hugging Face and Google learning-source cards
- Start, Resume, Review, and progress-selector behavior
- Learn from startup-workbench choices
- Learn from Today composition settings
- Learn content-type and Learning source filters in Library
- Learn-specific badge color and UI branches

Library remains the final navigation tab after Papers. It contains Code, Model, Dataset, and Paper cards only.

## 5. Today Composition

Today continues to use the saved source filters for the remaining four discovery lanes:

- Code: default 2
- Models: default 1
- Datasets: default 1
- Papers: default 2

The default Today queue therefore changes from seven cards to six. Today fetches no curated learning source and contains no empty Learn placeholder.

Today composition validation keeps the existing per-lane range of 0-4 and total range of 1-12, now calculated across four lanes. Stored mixes drop the `learn` key. A legacy mix containing Learn is normalized by preserving all valid remaining lane values and revalidating their total; if the remaining total is invalid, the complete new default mix is used.

## 6. One-Time Local Migration

A versioned migration runs before settings, annotations, snapshots, or initial workbench state are read. It is idempotent and records completion under a local migration marker.

The migration performs these operations as one bounded local transaction with rollback to the pre-migration values if a write throws:

1. Remove the `learn-progress` storage entry.
2. Remove Learn annotation entries, including favorited, commented, hidden, and snapshotted Library cards.
3. Remove the Learn filter and filter-default maps from settings.
4. Remove the Learn Today-mix lane.
5. Change selected or fixed startup workbench `learn` to `today`.
6. Remove `sections.learn` from every daily snapshot.
7. Remove Learn cards from every remaining snapshot section, including Today.
8. Remove Learn source status and filter metadata embedded in snapshots.
9. Remove every query-cache entry to guarantee that no cached Today or Learn result survives.
10. Write the migration marker only after all persistent changes succeed.

Free-form daily notes are preserved byte-for-byte. The iCloud directory handle and operational archive state are not modified.

## 7. Runtime Architecture Cleanup

Delete the curated Learn source module and its dedicated tests. Remove Learn branches from feed loading, Today aggregation, application state, card rendering, archive formatting, settings rendering, URL source allowlists, and workbench normalization.

The application no longer exposes `getLearnProgress`, `setLearnProgress`, or a `learnProgress` state field. Shared card rendering remains source-neutral for the four retained card types.

The migration sanitizer is the only retained compatibility logic for recognizing legacy Learn records. It belongs beside durable-data migration and backup parsing, not in active feed or UI modules.

## 8. Backup Version 2

New exports use backup version 2. The durable payload contains:

- `settings`
- `userState`
- `dailyNotes`
- `snapshots`

`learnProgress` is not present in version 2. Version-2 parsing remains strict and rejects unsupported keys.

The parser continues to accept version-1 backups. Before applying normal validation, the version-1 migration:

1. Discards the entire `learnProgress` map.
2. Removes Learn workbench settings and Today-mix values.
3. Removes Learn annotations and Library card snapshots.
4. Removes Learn snapshot sections, cards, filters, and source status.
5. Produces a normalized version-2 payload.
6. Validates every retained field through the version-2 validators.

Import review no longer reports a learning-progress count. Applying an imported backup cannot recreate the Learn tab or any Learn record. Backup merge behavior remains newest-entry-wins for retained annotations and date-key merge for retained daily records.

## 9. Existing External Files

Scout Lab does not enumerate, rewrite, or delete previously exported JSON or iCloud Markdown files. Those files are outside active browser state and may no longer be authorized.

If the user explicitly imports an old version-1 JSON backup later, Scout Lab sanitizes it according to section 8. Existing readable Markdown remains historical text and is never interpreted as application state.

## 10. Automatic iCloud Backup Alignment

The approved automatic iCloud backup design is updated before implementation:

- remove learning progress from the durable payload
- remove learning-progress changes from automatic backup triggers
- retain all other local-first, permission, recovery, status, and restore rules
- sanitize version-1 files during explicit iCloud restore

No automatic iCloud implementation is bundled into the Learn-removal change unless separately planned and approved.

## 11. Documentation

Current product, UI, testing, acceptance, architecture, and pending automatic-iCloud specifications must describe six workbenches: Today, Code, Models, Datasets, Papers, and Library.

Historical implemented specifications and plans may retain their original Learn-era text when needed as an accurate record, but current-design documents must link to this removal decision and clearly mark Learn as removed. Tests and acceptance matrices must not require a removed workbench.

## 12. Testing

Migration unit tests cover:

- complete structured Learn deletion
- preservation of unrelated data and free-form notes
- selected/startup fallback to Today
- Today-mix normalization
- snapshot and cache cleaning
- idempotence
- rollback after a simulated storage write failure

Backup tests cover:

- version-2 export without `learnProgress`
- strict version-2 validation
- version-1 import and Learn sanitization
- retained unsafe-URL rejection
- inability of old Learn annotations or snapshots to reappear

Feed, settings, UI, and archive tests are updated for four discovery lanes and four retained card types. Obsolete Learn source and browser tests are deleted.

Playwright verifies:

- no Learn navigation or settings option
- Today has six default cards and no Learn request
- Library has no Learn-specific filter option
- legacy local state is purged before the first render
- navigation, search, filters, actions, backup, themes, density, and responsive layout still work

The full extension check, unit coverage, Playwright suite, live-source contract check, dependency audit, and real-browser console inspection remain release gates.

## 13. Acceptance Criteria

- Learn does not appear in navigation, Today, Settings, Library filters, archive output, or active documentation.
- No runtime request targets a curated Learn resource.
- No active source, progress, rendering, storage, styling, or test module exists solely for Learn.
- Existing structured Learn data is deleted before the first post-update render.
- Unrelated annotations, daily notes, snapshots, settings, and archive handles remain intact.
- Legacy selected/startup Learn values resolve to Today.
- Today defaults to 2 Code, 1 Model, 1 Dataset, and 2 Papers.
- New backups are version 2 and contain no `learnProgress` field.
- Version-1 backups remain importable but cannot restore any Learn data.
- Existing external backup and Markdown files are not modified.
- The migration is idempotent, bounded, rollback-protected, and fully tested.
