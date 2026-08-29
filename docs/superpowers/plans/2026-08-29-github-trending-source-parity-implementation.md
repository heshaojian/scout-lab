# GitHub Trending Source Parity Implementation Plan

**Design:** `docs/superpowers/specs/2026-08-29-github-trending-source-parity-design.md`

## Phase 1: Lock the Contract with Tests

1. Add Code filter normalization tests for `spokenLanguage`, including English, Chinese, invalid values, and legacy saved settings.
2. Replace Search-fallback query tests with canonical Trending URL tests.
3. Add feed tests proving Code never requests GitHub Search and returns a source error when Trending fails.
4. Add UI and browser tests for four Code controls, spoken-language interaction, exact result ordering, and the unavailable state.
5. Add proxy validation tests for allowed and rejected local Trending requests.

## Phase 2: Exact Source Implementation

1. Add the compact spoken-language options to the Code workbench.
2. Build GitHub URLs with `spoken_language_code` and remove the Search URL builder.
3. Add a transport selector that uses the local same-origin endpoint only for localhost HTTP previews.
4. Remove GitHub Search normalization and fallback logic from the Code feed.
5. Version Code cache identity so old Search-backed entries are ignored.
6. Render source failures with Retry and an exact `Open GitHub Trending` link.

## Phase 3: Local Preview Transport

1. Replace the Python development server with a static Node server.
2. Add an allowlisted `GET /__scout/github-trending` endpoint.
3. Validate time, programming language, and spoken language before building the upstream URL.
4. Forward only the upstream status and HTML body with safe response headers.
5. Point Playwright at the same server used by daily local preview.

## Phase 4: Documentation and Verification

1. Update product/UI documentation and the acceptance matrix.
2. Run extension validation, unit/integration coverage, Playwright, live source checks, dependency audit, and diff checks.
3. Compare ordered titles and period-star values from Scout Lab parsing against live GitHub Trending for Any, English, and Chinese.
4. Verify the local preview manually at desktop and mobile sizes with no console errors.
5. Review security and code quality, commit, push, and wait for both GitHub Actions workflows.
