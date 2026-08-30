# Beacon Circle Icon Design

## Decision

Scout Lab will replace its compass-and-signal icon with Beacon Circle, a minimal mark selected from six visual directions and three container treatments.

Beacon Circle communicates one useful signal emerging from noise. It is friendly, recognizable, and legible at the 16px size used by Chrome. The design removes visual details that do not survive at extension-icon scale.

## Geometry

The source artwork uses a transparent square canvas with a centered dark charcoal circle. Inside the circle:

- one amber center point represents the selected signal;
- two symmetrical green arcs represent discovery and transmission;
- arc ends are rounded;
- all elements are optically centered and preserve clear negative space.

The icon contains no compass needle, compass ring, cardinal points, blue accent, gradient, shadow, lettering, or secondary ornament.

## Color

- Background circle: Scout Lab charcoal, `#17232d`.
- Signal arcs: Scout Lab green, `#16c784`.
- Center point: Scout Lab amber, `#ffb51b`.
- Canvas outside the circle: transparent.

These colors remain fixed across light and dark browser themes. The charcoal circle provides the contrast boundary, so no theme-specific icon variant is required.

## Assets

Maintain one exact vector master and derive lossless PNG files at:

- `16x16`
- `32x32`
- `48x48`
- `128x128`

The vector master is the geometry source of truth. PNG files are the Manifest V3 runtime and Chrome Web Store assets. The icon in the Scout Lab rail uses the same `48x48` runtime asset.

Store screenshots and the small promotional tile are regenerated after the runtime icon changes so every public-facing asset shows Beacon Circle. Existing screenshot composition and listing copy remain unchanged.

## Release Handling

The existing Chrome Web Store draft already contains package version `1.0.0`. The replacement package therefore uses version `1.0.1` in the manifest, package metadata, cache-busting query strings, package filename, release tests, and release documentation.

No product behavior, permissions, source contracts, storage schema, listing claims, or privacy disclosures change in this release.

## Verification

Automated release checks must verify:

- manifest and package versions are `1.0.1`;
- all four runtime PNG files exist and have exact dimensions;
- the store icon is `128x128`;
- screenshots remain `1280x800`;
- the promotional tile remains `440x280`;
- the production ZIP contains only approved runtime files;
- the packaged extension opens a real Chrome new-tab page successfully;
- unit, integration, browser, live-source, package, audit, and release checks pass.

Visual review must inspect the icon at `128px`, `48px`, `32px`, and `16px` against both light and dark surfaces. At `16px`, the amber point and both green arcs must remain distinct without blurred ornament or collapsed gaps.

After verification, upload `1.0.1` to the existing Web Store draft, replace the store icon and regenerated public assets, save the draft, and recheck all submission requirements. Final submission for review remains a separate user-confirmed action.
