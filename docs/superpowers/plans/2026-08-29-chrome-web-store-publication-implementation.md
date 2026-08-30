# Chrome Web Store Public Release Implementation

## Phase 1: Release Contracts

1. Add failing tests for release version `1.0.0`, required manifest icons, production-only ZIP contents, store-asset dimensions, and current documentation language.
2. Add a deterministic release metadata module containing the approved title, summary, description, single-purpose statement, permission justifications, privacy answers, and distribution settings.
3. Add tests that ensure listing and privacy claims remain consistent with the manifest and runtime behavior.

## Phase 2: Brand And Store Assets

1. Generate an original Scout Lab master icon with a simple signal/scouting motif and no third-party marks or small text.
2. Derive crisp 128, 48, 32, and 16 pixel PNG icons and inspect every size.
3. Capture three 1280x800 screenshots from the actual release UI: Today dark, Code filters, and Models or Datasets filters.
4. Create and inspect a 440x280 small promotional tile using the same identity.
5. Store source assets outside the extension package and runtime icons inside `assets/icons/`.

## Phase 3: Privacy And Documentation

1. Add `PRIVACY.md` covering local storage, public-source requests, explicit archive/backup actions, deletion, contact, no collection or sale, and Limited Use compliance.
2. Add a static `docs/privacy.html` page suitable for GitHub Pages.
3. Update README feature and architecture language to match the Learn-free `1.0.0` product.
4. Add `docs/store-listing.md` with final dashboard field values and asset paths.

## Phase 4: Manifest And Packaging

1. Change manifest and package version to `1.0.0` and add all required icon declarations.
2. Add a deterministic packaging script that copies only runtime files and creates `dist/scout-lab-1.0.0.zip`.
3. Add package inspection tests that reject development files and verify every runtime import resolves inside the ZIP.
4. Extend the extension checker to validate release icons and manifest metadata.

## Phase 5: Verification

1. Run extension checks, unit tests, coverage, Playwright, live-source checks, dependency audit, and diff validation.
2. Inspect all icons and store graphics visually and verify exact dimensions.
3. Load the packaged release as an unpacked extension and smoke-test retained workbenches, settings, Library, and links.
4. Review the package for secrets, remote code, excessive permissions, stale Learn references, and policy/listing contradictions.

## Phase 6: Publish Preparation

1. Commit and push the verified `1.0.0` release.
2. Publish the privacy page and verify its public URL.
3. Upload the ZIP and listing assets to the registered Chrome Web Store item.
4. Complete privacy and distribution fields using `docs/store-listing.md`.
5. Resolve dashboard validation errors and stop before `Submit for Review`.
6. Obtain immediate user confirmation, then submit for public automatic publishing after approval.
