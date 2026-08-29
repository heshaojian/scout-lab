# Long-Session Reading Comfort Implementation Plan

**Design:** `docs/superpowers/specs/2026-08-29-long-session-reading-comfort-design.md`

## Phase 1: Lock the Comfort Contract with Tests

1. Add a Playwright reading-comfort test that selects Comfortable density and measures desktop grid columns.
2. Assert computed card title, summary, metadata, tag, badge, and action font sizes meet the approved minimums.
3. Assert summary line height and four-line clamp behavior.
4. Assert Compact density remains four columns and denser than Comfortable.
5. Add medium and mobile viewport checks for two and one columns with no horizontal overflow.

## Phase 2: Implement Shared Reading Tokens

1. Add explicit Comfortable typography, card spacing, card height, and summary-line tokens at the root level.
2. Keep Compact values scoped under `data-density="compact"` so saved preferences remain compatible.
3. Apply the tokens consistently to titles, summaries, metadata, tags, badges, actions, and comment text.
4. Change the Comfortable wide grid to three columns while preserving four columns for Compact.
5. Add medium and mobile responsive rules based on available layout width.

## Phase 3: Reduce Long-Session Glare

1. Soften light-theme page and card surfaces without reducing text contrast.
2. Keep dark-theme surfaces charcoal rather than black and improve muted text legibility where needed.
3. Preserve source accent colors, focus visibility, restrained borders, and existing interaction states.

## Phase 4: Documentation and Verification

1. Update UI and testing documentation with the measurable reading-comfort contract.
2. Run extension validation, unit/integration coverage, Playwright, live-source checks, dependency audit, and diff checks.
3. Inspect Comfortable and Compact layouts in light and dark themes at desktop, medium, and mobile viewports.
4. Verify no clipped text, overlap, horizontal overflow, console errors, or broken controls.
5. Complete an independent correctness/accessibility review, commit, push, and wait for GitHub Actions.
