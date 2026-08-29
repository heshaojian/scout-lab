# Friendly Settings Implementation Plan

**Design:** [Friendly Settings](../specs/2026-08-29-friendly-settings-design.md)

## Goal

Implement the approved daily-use settings without changing Scout Lab's shared card grid or adding extension permissions.

## Sequence

1. Add a pure versioned settings module with independent normalization for preferences, current filters, saved defaults, and Today composition.
2. Extend local storage with version-one migration, saved-default operations, preference reset, and portable daily-data enumeration.
3. Add a pure backup module that validates size, schema, enums, strings, collections, dates, timestamps, and supported source URLs before making any writes.
4. Make Today composition configurable, replace hidden cards within each requested source lane, alternate paper sources, and report shortfalls.
5. Add a settings renderer for the responsive drawer, grouped controls, workbench summaries, import review, and confirmations.
6. Add application coordination for immediate preference updates, startup selection, system-theme reaction, filter default commands, export/import, focus management, and background links.
7. Convert CSS colors and spacing to semantic theme/density tokens, then style the drawer at desktop and mobile widths.
8. Update extension validation and documentation where the implemented contract changes.

## Test-First Slices

### Settings and storage

- migration preserves selected workbench and current filters
- malformed values fall back independently
- Today totals remain within 1-12 and each lane within 0-4
- current filters and saved defaults remain separate
- reset preferences preserves user learning data

### Backup

- export contains supported durable data only
- import rejects malformed, oversized, unsafe, or unsupported data atomically
- annotations and progress merge by newest `updatedAt`
- daily notes and snapshots replace matching dates and preserve unmatched dates
- export/import round trip is stable

### Feeds and UI

- Today obeys every source count and alternates paper lanes
- hidden cards do not consume requested slots
- shortfalls are visible in status
- settings controls render accessible state and summaries
- primary and secondary links expose the opening behavior hook

### Browser acceptance

- every settings control persists after reload
- System, Light, and Dark render every surface correctly
- Comfortable and Compact remain stable across wide, compact, and mobile widths
- drawer open, close, backdrop, Escape, focus trap, and focus restoration work
- each source tab, filter, card action, note, progress control, reset, default save, export, import, and link path works
- no console errors, overflow, unexpected permission changes, or broken destination URLs

## Completion Gate

The feature is complete only after unit tests, coverage, extension checks, live-source checks, dependency audit, browser screenshots, console inspection, and destination-link verification pass. Any unverified browser behavior is reported explicitly rather than inferred from unit tests.
