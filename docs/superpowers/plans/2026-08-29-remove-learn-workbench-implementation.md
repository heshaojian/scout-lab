# Remove Learn Workbench Implementation

1. Add red tests for the idempotent local migration, rollback behavior, legacy settings fallback, complete structured Learn deletion, and unrelated-data preservation.
2. Add red backup tests for version-2 exports, strict version-2 validation, version-1 sanitizing import, and removal of Learn from import summaries.
3. Add red feed, settings, UI, archive, and Playwright assertions for four Today lanes, six default Today cards, no Learn navigation, no Learn settings, and no Learn Library filters.
4. Implement a focused durable-data sanitizer and one-time storage migration that runs before initial application state is read.
5. Remove the Learn workbench, source module, progress storage and rendering, Today lane, settings controls, Library facets, active URL allowlist, styles, and obsolete tests.
6. Upgrade backup creation to version 2 and migrate sanitized version-1 payloads before applying strict current validation.
7. Update current product, UI, testing, acceptance, and automatic-iCloud documentation while preserving historical design records.
8. Run extension validation, unit coverage, full Playwright, live-source checks, dependency audit, diff/security review, and real-browser inspection at desktop and mobile widths.
