# GitHub Code Live Parity Implementation Plan

## Goal

Make Scout Lab's Code tab a faithful, current view of GitHub Trending for the selected GitHub-native filters.

## Phase 1: Regression tests

1. Update unit expectations so a fresh Code workbench uses `Today` and exposes only time range, spoken language, and programming language.
2. Replace topic-subset feed tests with tests proving Code preserves the complete GitHub Trending response and records a live update timestamp.
3. Add a regression proving standalone Code does not reuse a completed cache entry while simultaneous matching requests remain deduplicated.
4. Update browser tests to require three source-native controls, the direct GitHub source link, and a new request when Code is entered or refreshed.
5. Extend the packaged-extension smoke test to compare its rendered titles and period-star values with a direct GitHub Trending fetch using the same filters.

## Phase 2: Runtime changes

1. Change fresh Code defaults from `week` to `day` and remove the Code-only AI topic control and state.
2. Remove local topic filtering from the GitHub feed path.
3. Force standalone Code loads to request GitHub live while preserving in-flight request deduplication and Today-view caching.
4. Record `updatedAt` on successful GitHub responses and render a compact live status plus a validated `Open on GitHub` link.

## Phase 3: Release metadata

1. Bump the extension and package versions to `1.0.2`.
2. Update cache-busting imports, package names, release checks, and release contract tests.
3. Build `dist/scout-lab-1.0.2.zip`; do not upload, publish, or alter the pending Chrome Web Store submission in this task.

## Phase 4: Verification

1. Run unit and integration tests with coverage and require at least 80%.
2. Run the full Playwright suite.
3. Run live-source parity checks against GitHub, Hugging Face, and arXiv.
4. Package the extension and run the expanded packaged-extension smoke/parity test.
5. Review the final diff for correctness, security, secrets, and release scope, then commit locally using a conventional commit.
