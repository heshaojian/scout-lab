# Six-Hour Startup Cache Design

## Goal

Opening Scout Lab should prepare every remote discovery tab using current filter settings without repeating network work unnecessarily. Matching results remain valid for six hours. Missing, expired, or differently parameterized queries are fetched and cached.

## Scope

The startup coordinator covers Today, Code, Models, Datasets, and Papers. Library remains entirely local and does not participate in remote cache warming.

This change does not alter source parsing, card design, filter options, durable favorites or notes, or iCloud archive behavior.

## Cache Contract

All remote workbenches use a six-hour cache TTL.

Cache identity remains query-based. A key includes the workbench, its normalized filters, and any source revision or Today-composition inputs already required by that workbench. Two requests reuse data only when these values match exactly.

Therefore:

- opening another new tab within six hours reuses matching cached results;
- an expired query is fetched again;
- changing any filter or sort produces a different key and fetches that query immediately;
- returning to a previously used query within six hours reuses its matching entry;
- a manual Refresh bypasses the cache for the active workbench;
- simultaneous identical requests share the existing in-flight request rather than issuing duplicate network calls.

## Startup Flow

After local settings and annotations are loaded, Scout Lab starts a single cache-warming operation for the current queries of Today, Code, Models, Datasets, and Papers.

The requests run concurrently. Today continues to compose its queue from the source workbenches. Its internal source requests use the same query cache and in-flight deduplication as direct workbench requests. This allows overlap between Today and the standalone tabs without duplicate upstream calls.

The visible startup workbench renders as soon as its result is available. Background work for the other workbenches continues independently and stores its results for later tab navigation. Opening a warmed tab then reads the matching cache rather than making another request.

If the current Papers configuration differs from the paper queries needed by Today, both exact queries are cached. This preserves the user's selected Papers semantics while still preparing Today's mixed queue.

## Refresh Behavior

Normal startup and tab navigation are cache-first. They do not force a network request while an exact cache entry is valid.

Filter changes are naturally fetch-first because the changed normalized parameters produce a new cache key. If that exact query was previously cached less than six hours ago, it may be reused.

The existing Refresh command remains an explicit force refresh for the active workbench only. A Today refresh may refresh the source queries needed to rebuild Today, but it does not indiscriminately force unrelated saved filter combinations.

## Status And Failure Handling

Each cache entry retains its source status and save time. Cached results remain visibly distinguishable through existing status metadata where applicable.

A background failure must not clear or interrupt another workbench. Valid cached data is returned before attempting the network. For an expired query, existing source-specific failure behavior remains in force: supported sources may show stale saved data or a fallback, while Code keeps its explicit GitHub-unavailable state rather than silently presenting stale repositories.

Startup warming errors are contained per workbench and do not reject the entire startup operation.

## Implementation Boundaries

The application owns orchestration and visibility. The feed service owns query identity, TTL enforcement, cache reads and writes, and in-flight deduplication.

The startup coordinator should be a focused function that receives the normalized filter map and user settings, starts the required fetches, and returns per-workbench results. It must not mutate filters or user state.

## Verification

Automated coverage must prove:

1. A cold startup prepares every remote workbench.
2. A second startup inside six hours issues no duplicate upstream requests for matching queries.
3. Entries older than six hours are refreshed.
4. A changed filter fetches the new query and leaves other valid queries untouched.
5. Returning to a previously cached query reuses it within the TTL.
6. Manual Refresh bypasses the active query cache.
7. Overlapping Today and standalone requests remain deduplicated.
8. One failed background source does not prevent other workbenches from warming.
9. The complete unit, integration, end-to-end, live-source, and packaged-extension suites pass with at least 80 percent coverage in every enforced category.

## Release Boundary

The implementation prepares the next patch release and its local Chrome Web Store ZIP. Pushing, uploading, or changing the submitted store item remains a separate explicitly requested action.
