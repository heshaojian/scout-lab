# Adjustable Typography Implementation Plan

## Phase 1: Regression Tests

1. Update settings tests first to require `textSize: large` by default, accept `standard`, and normalize malformed values to Large independently from theme and density.
2. Extend first-paint tests to require `data-text-size` before application boot for both missing and stored preferences.
3. Extend Settings renderer and browser tests to require a Standard/Large segmented control, immediate application, reload persistence, and reset to Large.
4. Add computed-style browser assertions for Large minimum sizes and Standard compatibility across the rail, controls, cards, notes, and Settings drawer.
5. Exercise Standard/Large with Comfortable/Compact at 1440x900, 900x900, and 390x844 without horizontal overflow or overlap.
6. Update release tests first to require version `1.0.4` and `scout-lab-1.0.4.zip`.

## Phase 2: Preference And First Paint

1. Add `textSize` to normalized preferences with `large` as the fallback and factory default.
2. Apply `data-text-size` from both the pre-render script and the runtime appearance function.
3. Add the existing segmented-control pattern to Settings between Theme and Density.
4. Preserve the preference through existing settings storage, backup, import, and reset paths without a schema wipe.

## Phase 3: Typography And Layout

1. Keep Standard values unchanged.
2. Add Large root token overrides for card typography and reserved text heights.
3. Add Large selector overrides for the rail, header, controls, status, note strip, model-specific metadata, and Settings drawer.
4. Set the Large desktop rail to 248px and enlarge control heights where required.
5. Preserve established responsive column behavior and ensure mobile rules override rail geometry correctly.

## Phase 4: Release And Verification

1. Bump manifest, package metadata, lockfile, cache-busting imports, checks, package name, and smoke test to `1.0.4`.
2. Run extension checks and all unit/integration tests with at least 80 percent coverage in every enforced category.
3. Run the complete Playwright suite and the expanded typography matrix.
4. Run live upstream contracts and packaged-extension parity.
5. Run dependency audit, secret scan, diff review, and `git diff --check`, then commit locally without pushing.
