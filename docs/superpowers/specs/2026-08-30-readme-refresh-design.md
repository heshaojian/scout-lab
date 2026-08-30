# Scout Lab README Refresh Design

## Goal

Replace the brief project summary with a user-first README that accurately represents Scout Lab 1.0.4 as implemented and tested. The README should help a new user understand the product and install it, while giving contributors enough architecture and verification context to work safely.

## Audience

The document serves two readers in this order:

1. People evaluating or installing Scout Lab.
2. Contributors maintaining source integrations, persistence, UI behavior, and releases.

## Content Order

1. Product name, one-sentence promise, quality badges, and current screenshots.
2. Product purpose and workbench overview.
3. Core user workflows: discover, filter, save, annotate, archive, and configure.
4. Installation from source and local preview.
5. Data freshness, caching, source failures, and privacy.
6. Architecture and repository map.
7. Development, testing, packaging, and release commands.
8. Links to detailed product, UI, testing, privacy, and store documentation.

## Accuracy Rules

- Describe only behavior present in the current runtime or enforced by current tests.
- Identify Scout Lab as a Manifest V3 Chrome new-tab extension with no build step.
- List all six current workbenches: Today, Code, Models, Datasets, Papers, and Library.
- Explain the six-hour query-aware cache and startup warming of all remote workbenches.
- State that changed network filters produce distinct requests and cache entries.
- Explain that GitHub Code uses GitHub Trending only and does not fall back to GitHub Search.
- Explain Models and Datasets using their current Hugging Face source-aligned controls without reproducing every menu value.
- Explain Papers as Hugging Face Daily Papers plus raw arXiv `cs.AI` and `cs.LG`.
- Explain automatic Library membership through a favorite or non-empty comment, including hidden-item review.
- Explain local browser persistence, validated JSON backup/import, and manual daily Markdown archive to a user-selected folder.
- Do not claim automatic iCloud background sync; link to design documents only as internal project history where useful.
- Include Standard/Large text size, System/Light/Dark theme, Comfortable/Compact density, startup section, link behavior, Today mix, and saved filter defaults.
- State the current release as 1.0.4 only where a fixed version is useful.

## Visual Treatment

Use the existing store screenshots already tracked in the repository. Show Today first, then Code and Models in a compact table so the README demonstrates the real interface without adding generated or external assets.

## Technical Detail

The architecture section will describe the actual modules:

- `workbenches.js` owns source-specific controls and cache TTL.
- `services/query.js` builds source requests and stable cache keys.
- `services/feeds.js` fetches, normalizes, caches, deduplicates, and handles source failures.
- `services/storage.js` owns local durable state and query caches.
- `services/library.js` owns historical saved-card behavior.
- `services/archive.js` and `archiveFormat.js` own folder access and Markdown export.
- `services/backup.js` validates portable JSON backups.
- `ui/` and `styles/` render the shared responsive interface.

## Verification

Before committing the README:

- verify every local link target exists;
- run the extension structural check;
- run unit/integration tests;
- confirm documented npm scripts match `package.json`;
- scan for stale references to removed Learn functionality, automatic iCloud sync, GitHub Search fallback, or old release versions;
- review the rendered Markdown structure and screenshot paths.

## Scope

This change updates project documentation only. It does not alter runtime behavior, permissions, storage formats, release packaging, or Chrome Web Store submission state.
