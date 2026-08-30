# Library-First Review Design

## Purpose

Library is the durable review space for content the user chose to keep or annotate. It answers: what did I save, what did I write, and what should I revisit? It is not another live feed and does not fetch a source.

## Membership

Membership is automatic. An item belongs to Library when it is favorited or has a non-empty comment. Removing the favorite and deleting the comment removes it. A hidden item still appears in Library when it meets the membership rule; Hide only suppresses it from discovery feeds.

## Navigation And Layout

Library is a first-class tab after Learn and uses the identical content-card grid. The header contains Search and no Refresh button. The filter bar contains:

- View: All, Favorites, Notes
- Content type: All, Code, Models, Datasets, Papers, Learn
- Source: All, GitHub, Hugging Face, arXiv, Learning
- Sort: Recently updated, Recently saved, Title

Cards preserve their source metadata and actions. Existing comments remain visible and editable. The Favorite and Comment actions update Library membership immediately.

## Persistence

An annotation that qualifies for Library stores a validated, bounded snapshot of the normalized card plus `savedAt` and `updatedAt`. The snapshot contains only fields needed to render and open the card. It never depends on an expiring feed cache.

Existing qualifying annotations are migrated from the newest matching daily snapshot when possible. Unresolvable legacy IDs remain safely stored but cannot be shown until their source item is encountered again.

Library snapshots are included in the existing backup through the annotation map. Import validates all URLs and size limits. No new extension permission, cloud account, or database is introduced.

## Empty And Failure States

An empty Library explains that favoriting or commenting adds items automatically. Since Library is local, source outages do not affect it. Invalid or unsafe persisted card snapshots are excluded or rejected during import.

## Acceptance

- Favorite or comment adds a durable Library card immediately.
- Removing both removes the card immediately.
- A hidden but annotated card remains reviewable in Library.
- Search, View, Content type, Source, and Sort work independently and together.
- Library survives reload, backup/export/import, live source changes, and cache expiry.
- Existing daily snapshots backfill resolvable historical annotations.
- Desktop and mobile layouts have no overflow and preserve all card actions and links.
