# Chrome Web Store Public Release Design

## Decision

Scout Lab will ship as a polished, free, public Chrome Web Store extension at version `1.0.0`. The item will publish automatically after Google approves it. This is a direct public launch rather than a trusted-tester or unlisted release.

## Product Identity

- Name: Scout Lab
- Category: Developer Tools
- Summary: A focused AI discovery workspace for every new tab.
- Single purpose: Replace Chrome's new-tab page with a focused workspace for discovering GitHub code, Hugging Face models and datasets, and AI research papers.
- Homepage and support: the public `heshaojian/scout-lab` GitHub repository and its issue tracker
- Price: free
- Regions: all Chrome Web Store regions supported by the publisher account

The listing must not imply endorsement by GitHub, Hugging Face, arXiv, Google, or Chrome. Those names may describe the sources Scout Lab reads, but the branding and visual identity remain original.

## Release Package

The manifest version changes from `0.4.0` to `1.0.0`. It includes packaged Scout Lab icons at 16, 32, 48, and 128 pixels. The extension continues to use Manifest V3, contains no remotely hosted code, and has no build-time or runtime dependency on `node_modules`.

A deterministic packaging command creates a ZIP containing only files required at runtime:

- `manifest.json`
- `newtab.html`
- packaged icons
- `src/` runtime JavaScript and CSS

The ZIP excludes tests, fixtures, documentation, coverage, development scripts, Git metadata, and dependencies. Packaging fails if required files are missing, if the manifest version differs from the intended release version, or if disallowed development files enter the archive.

## Permissions

Scout Lab requests only these host permissions:

- `https://github.com/*`: retrieve the public GitHub Trending page shown in Code
- `https://huggingface.co/*`: retrieve public model, dataset, and Daily Papers metadata
- `https://export.arxiv.org/*`: retrieve public arXiv Atom data for the Papers workbench

No GitHub account, Hugging Face account, browsing-history, tabs, identity, cookies, or analytics permission is requested. The File System Access API is invoked only after a user explicitly chooses an archive folder and is not a manifest permission.

## Privacy Position

Scout Lab has no developer-operated backend, account system, analytics, advertising, tracking, or sale of data.

Favorites, hidden state, comments, daily notes, settings, cached source results, and snapshots remain in browser-local storage. An archive is written only to a folder the user explicitly selects. Backup files are created or imported only after an explicit user action. The publisher does not receive these records.

Public source requests send only the selected source filters needed to retrieve results. Scout Lab does not send personal notes, favorites, settings, or archive content to GitHub, Hugging Face, arXiv, or the publisher.

A public `PRIVACY.md` and GitHub Pages privacy page disclose:

- what is stored locally
- which public sources receive requests
- that the publisher does not collect or sell user data
- how users delete local data
- how users contact the publisher
- Chrome Web Store Limited Use compliance

Dashboard privacy answers:

- Remote code: No
- User data collection by the publisher: No
- Data sale, advertising, credit, or unrelated use: No
- Limited Use certification: Yes

## Store Listing

The English listing contains:

- a concise summary no longer than 132 characters
- an overview paragraph
- a short feature list covering Today, Code, Models, Datasets, Papers, Library, themes, filters, local annotations, and backup/archive behavior
- a clear disclosure that installing Scout Lab replaces Chrome's new-tab page
- homepage, support, and privacy URLs

The listing avoids keyword stuffing, performance superlatives, unverifiable claims, testimonials, and feature references removed from the product.

## Visual Assets

The release uses one original Scout Lab identity across the extension and listing:

- 128x128 store icon plus 16x16, 32x32, and 48x48 manifest variants
- three 1280x800 screenshots captured from the actual release UI
- one 440x280 small promotional tile

The icon uses a simple, recognizable scouting or signal motif that remains legible at 16 pixels. It contains no third-party logos and no small text.

Screenshots show actual functionality with current data or deterministic representative data:

1. Today in comfortable dark mode
2. Code with GitHub Trending filters and repository cards
3. Models or Datasets with source-specific filters and consistent cards

Screenshots use square corners, full bleed, and no misleading browser or store badges. The promotional tile uses the same identity and a restrained amount of text.

## Documentation Cleanup

Before packaging, current documentation is updated to remove obsolete Learn references. README feature, architecture, and privacy descriptions must match version `1.0.0` exactly.

## Verification

The release gate includes:

- extension structure check
- all unit and integration tests
- coverage thresholds of at least 80 percent for statements, branches, functions, and lines
- all Playwright browser tests
- bounded live checks for GitHub, Hugging Face, and arXiv
- dependency audit with no high-severity vulnerabilities
- manifest permission and remote-code review
- ZIP content inspection and unpacked-install smoke test
- icon rendering at every packaged size
- screenshot dimension and visual inspection
- privacy policy, listing copy, and dashboard disclosure consistency review

## Dashboard Workflow

After the release commit is pushed:

1. Upload the verified ZIP as a new Chrome Web Store item.
2. Complete the English store listing and upload the approved assets.
3. Complete the privacy fields with the exact declarations above.
4. Select free, public distribution in all supported regions.
5. Review every dashboard warning and resolve any mismatch.
6. Pause immediately before `Submit for Review` and obtain action-time confirmation.
7. Submit with automatic publishing after approval.

The dashboard upload and form completion transmit the public package and listing to Google. The final submission is a representational action and is never performed without immediate confirmation.

## Success Criteria

- The uploaded package is version `1.0.0` and contains only production files.
- The extension installs cleanly and all retained workbenches function from the packaged build.
- The listing has an original icon, at least three accurate screenshots, and the required promotional tile.
- The privacy policy and dashboard disclosures exactly match runtime behavior.
- Google accepts the item for review without unresolved validation errors.
- After explicit final confirmation, the item is submitted as a free public extension configured to publish automatically after approval.

## References

- [Register a developer account](https://developer.chrome.com/docs/webstore/register)
- [Prepare an extension](https://developer.chrome.com/docs/webstore/prepare)
- [Publish in the Chrome Web Store](https://developer.chrome.com/docs/webstore/publish/)
- [Complete a store listing](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [Complete privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [Chrome Web Store program policies](https://developer.chrome.com/docs/webstore/program-policies/policies)
