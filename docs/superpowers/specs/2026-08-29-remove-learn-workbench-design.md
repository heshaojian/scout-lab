# Remove Learn Workbench Design

**Status:** Approved for implementation
**Date:** 2026-08-29
**Product:** Scout Lab Chrome new-tab extension

## 1. Summary

Scout Lab will remove Learn as a product workbench and permanently delete all structured Learn data from active local state. The removal includes navigation, Today composition, settings, source code, progress tracking, Library filters, caches, snapshots, backups, tests, and documentation.

Previously exported JSON files and iCloud Markdown files remain untouched. Because Scout Lab is still a development build, this release resets all active browser data instead of migrating it, and older backups are no longer accepted.

## 2. Goals

1. Remove the Learn workbench and every user-facing Learn control.
2. Remove unused Learn source, progress, rendering, storage, and styling code.
3. Reset all Scout Lab data already stored in the active browser origin.
4. Start from one clean Learn-free storage and backup schema.
5. Reject older backups instead of carrying development-era compatibility code.
6. Keep Today, Library, backup, and future automatic iCloud behavior internally consistent.

## 3. Non-Goals And Deletion Boundary

The reset deletes active free-form notes wholesale with the rest of local Scout Lab state, but it does not:

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

Today composition validation keeps the existing per-lane range of 0-4 and total range of 1-12, now calculated across four lanes. Unknown lane keys are ignored.

## 6. One-Time Development Reset

Before settings, annotations, snapshots, or archive state are read, Scout Lab checks a schema marker. When the current Learn-free schema marker is absent, it performs one complete origin-local reset:

1. Remove every `scout-lab:` localStorage entry, including settings, annotations, notes, snapshots, caches, and prior markers.
2. Delete the `scout-lab` IndexedDB database, including the stored archive directory handle.
3. Write the new schema marker only after the reset completes.
4. Continue startup with factory defaults and no personal data.

The reset is idempotent. If a storage operation fails, the marker is not written and startup reports a reset error rather than reading a partially reset state. The local preview and installed extension have different origins, so each resets independently on its first post-update launch.

## 7. Runtime Architecture Cleanup

Delete the curated Learn source module and its dedicated tests. Remove Learn branches from feed loading, Today aggregation, application state, card rendering, archive formatting, settings rendering, URL source allowlists, and workbench normalization.

The application no longer exposes `getLearnProgress`, `setLearnProgress`, or a `learnProgress` state field. Shared card rendering remains source-neutral for the four retained card types.

No Learn migration sanitizer or compatibility adapter remains in runtime code.

## 8. Backup Version 2

New exports use backup version 2. The durable payload contains:

- `settings`
- `userState`
- `dailyNotes`
- `snapshots`

`learnProgress` is not present in version 2. Version-2 parsing remains strict and rejects unsupported keys and every non-version-2 envelope, including version 1. Import review no longer reports a learning-progress count. Backup merge behavior remains newest-entry-wins for retained annotations and date-key merge for retained daily records.

## 9. Existing External Files

Scout Lab does not enumerate, rewrite, or delete previously exported JSON or iCloud Markdown files. Those files are outside active browser state and may no longer be authorized.

Old version-1 JSON backups are rejected as unsupported. Existing readable Markdown remains historical text and is never interpreted as application state.

## 10. Automatic iCloud Backup Alignment

The approved automatic iCloud backup design is updated before implementation:

- remove learning progress from the durable payload
- remove learning-progress changes from automatic backup triggers
- retain all other local-first, permission, recovery, status, and restore rules
- accept only version-2 files during explicit iCloud restore

No automatic iCloud implementation is bundled into the Learn-removal change unless separately planned and approved.

## 11. Documentation

Current product, UI, testing, acceptance, architecture, and pending automatic-iCloud specifications must describe six workbenches: Today, Code, Models, Datasets, Papers, and Library.

Historical implemented specifications and plans may retain their original Learn-era text when needed as an accurate record, but current-design documents must link to this removal decision and clearly mark Learn as removed. Tests and acceptance matrices must not require a removed workbench.

## 12. Testing

Migration unit tests cover:

- complete origin-local data reset
- factory-default startup after reset
- reset of the IndexedDB archive handle
- idempotence
- no schema marker after a simulated reset failure

Backup tests cover:

- version-2 export without `learnProgress`
- strict version-2 validation
- version-1 rejection
- retained unsafe-URL rejection

Feed, settings, UI, and archive tests are updated for four discovery lanes and four retained card types. Obsolete Learn source and browser tests are deleted.

Playwright verifies:

- no Learn navigation or settings option
- Today has six default cards and no Learn request
- Library has no Learn-specific filter option
- legacy local state is completely reset before the first render
- navigation, search, filters, actions, backup, themes, density, and responsive layout still work

The full extension check, unit coverage, Playwright suite, live-source contract check, dependency audit, and real-browser console inspection remain release gates.

## 13. Acceptance Criteria

- Learn does not appear in navigation, Today, Settings, Library filters, archive output, or active documentation.
- No runtime request targets a curated Learn resource.
- No active source, progress, rendering, storage, styling, or test module exists solely for Learn.
- All previous Scout Lab browser data and the archive handle are reset before the first post-update render.
- The first post-reset render uses factory defaults.
- Today defaults to 2 Code, 1 Model, 1 Dataset, and 2 Papers.
- New backups are version 2 and contain no `learnProgress` field.
- Version-1 backups are rejected as unsupported.
- Existing external backup and Markdown files are not modified.
- The development reset is idempotent, bounded, failure-aware, and fully tested.
