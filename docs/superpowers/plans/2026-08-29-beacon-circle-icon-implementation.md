# Beacon Circle Icon Implementation

## Phase 1: Release Contract

1. Update release and package tests first to require version `1.0.1`, the `scout-lab-1.0.1.zip` artifact, and `1.0.1` cache-busting imports.
2. Add tests for a committed Beacon Circle vector master and for the absence of the removed compass/blue visual vocabulary in that master.
3. Run the focused release tests and confirm they fail before implementation.

## Phase 2: Canonical Icon Assets

1. Add an exact SVG master with a transparent canvas, charcoal circle, amber point, and two green rounded arcs.
2. Add a deterministic icon-generation script that renders the master to 16px, 32px, 48px, and 128px PNG files.
3. Generate the four runtime assets and visually inspect every size on light and dark surfaces.

## Phase 3: Release Metadata and Store Graphics

1. Update the manifest, package metadata, lockfile, HTML cache keys, JavaScript import cache keys, extension checker, packaging script, smoke test, and release tests to `1.0.1`.
2. Regenerate the three 1280x800 listing screenshots and the 440x280 promotional tile so they show Beacon Circle.
3. Update current release documentation where the active package filename or version is stated; preserve historical `1.0.0` specifications as historical records.

## Phase 4: Verification and Review

1. Run the focused release tests, extension checker, full unit/integration coverage suite, Playwright browser suite, live-source contracts, package smoke test, dependency audit, secret scan, and `git diff --check`.
2. Inspect the production ZIP and confirm it contains only approved runtime files.
3. Review the complete diff for correctness, privacy consistency, excessive permissions, remote code, and unrelated changes.

## Phase 5: Delivery

1. Commit the verified `1.0.1` release with a conventional commit and push `main`.
2. Upload `scout-lab-1.0.1.zip` to the existing Chrome Web Store item.
3. Replace the store icon, screenshots, and small promotional tile; save and revalidate the draft.
4. Stop immediately before the final Submit for review action and request the required publication confirmation.
