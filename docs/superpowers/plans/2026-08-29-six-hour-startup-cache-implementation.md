# Six-Hour Startup Cache Implementation Plan

## Phase 1: Regression Tests

1. Add unit tests for a startup coordinator that starts Today, Code, Models, Datasets, and Papers concurrently with exact normalized filters.
2. Prove a rejected background request is contained by settled results and cannot reject the complete warmup.
3. Add cache tests proving matching results are reused before six hours, refreshed after six hours, and separated when filters change.
4. Add browser coverage proving cold startup warms every remote workbench and later tab navigation does not issue duplicate requests.
5. Update release tests first to require version `1.0.3` and `scout-lab-1.0.3.zip`.

## Phase 2: Runtime

1. Set one shared six-hour TTL on every remote workbench.
2. Add a focused startup cache coordinator under `src/services/` that receives current filters and settings, starts all exact workbench queries immediately, and returns both per-section promises and an all-settled completion promise.
3. Allow the app loader to consume an already-started request for the visible workbench.
4. Start cache warming during boot, render the active workbench from its warmup request, and leave other requests to settle independently.
5. Remove the Code-only automatic cache bypass so normal navigation is cache-first; retain explicit force behavior for Refresh.

## Phase 3: Release Metadata

1. Bump manifest, package metadata, lockfile, cache-busting imports, checks, package filename, and smoke test to `1.0.3`.
2. Build the local Chrome Web Store ZIP without uploading or publishing it.

## Phase 4: Verification

1. Run static extension checks and all unit/integration tests with at least 80 percent coverage in every enforced category.
2. Run the complete Playwright suite, including cold-start warming, navigation cache reuse, filter changes, and manual refresh.
3. Run all live upstream contracts.
4. Load the packaged extension and verify GitHub Trending parity.
5. Run dependency audit, secret scan, diff review, and `git diff --check` before committing locally.
