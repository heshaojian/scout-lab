# Source Description And README Fallback Design

## Goal

Ensure Code and Models cards display accurate, source-backed descriptions. Scout Lab must never label generated generic prose as a source description.

## Description Priority

Each card resolves its summary in this order:

1. A non-empty narrative description supplied by the list source.
2. A safe excerpt from the repository or model `README.md`.
3. A factual metadata summary assembled only from source fields.

GitHub Trending normally supplies repository descriptions, so README requests are limited to repositories whose Trending description is absent. The Hugging Face Models list API does not supply narrative descriptions, so visible model families use model-card README excerpts when available.

## Source Retrieval

### GitHub Code

- Keep GitHub Trending as the only ranking and list source.
- For a repository with no Trending description, request its public GitHub repository page through the existing `github.com` permission.
- Extract the first useful paragraph from the rendered README region on that page.
- Do not add GitHub Search or GitHub API permissions.

### Hugging Face Models

- Keep the current Hugging Face Models list API for ranking, filters, and metadata.
- After model-family grouping, request `https://huggingface.co/{model-id}/raw/main/README.md` for visible representative cards that lack a narrative description.
- Related variants do not receive separate README requests unless they later become representative cards.

## Excerpt Rules

README content is untrusted source text. The parser returns plain text only and:

- removes YAML front matter;
- ignores headings, badges, images, HTML-only blocks, tables, code fences, and link-reference definitions;
- skips empty, navigation, installation-only, and boilerplate paragraphs;
- strips Markdown formatting while retaining human-readable link labels;
- collapses whitespace;
- limits output to 420 characters without cutting through HTML or executable content.

The existing UI HTML escaping remains the final rendering boundary.

## Performance And Cache

- Cache excerpts independently by source and item ID for seven days.
- Limit README fetch concurrency to four requests.
- Apply a five-second timeout to each README request.
- Stop workbench enrichment after an eight-second overall deadline and use factual fallbacks for unfinished requests.
- Enrich at most the visible 24 representative cards returned by a workbench.
- Reuse excerpt caches across filter combinations and new tabs.
- Deduplicate simultaneous requests for the same README.
- A missing, malformed, timed-out, or blocked README is a normal fallback condition and must not fail the workbench.

## Rendering And Fallback

The workbench waits for bounded README enrichment before committing its final result to the six-hour query cache. Cards whose README cannot produce a useful excerpt use a factual summary:

- Code: repository language and available star/fork metadata.
- Models: task, parameter count, library or format, license, access, and inference availability.

No card should display generic text such as `text generation model on Hugging Face` or `No description provided` when useful source metadata is available.

## Cache Compatibility

- Bump the GitHub source revision so old Code caches and daily snapshots are not trusted.
- Add a Models description revision to its query key so old generic summaries are not reused.
- README excerpt caches use their own versioned key and remain independent of six-hour workbench caches.

## Error Handling

- README fetch errors are swallowed only at the enrichment boundary and resolve to the factual summary.
- GitHub Trending failures retain the current honest unavailable state.
- Hugging Face list failures retain stale workbench-cache behavior.
- A README failure never substitutes a different repository or model.

## Testing

Unit tests cover Markdown cleanup, GitHub rendered-README extraction, source-description precedence, factual fallbacks, truncation, cache reuse, request deduplication, timeout/failure handling, and immutability.

Integration tests cover Code and Models enrichment with mocked README responses, query revision invalidation, bounded representative requests, and persistence in the workbench cache.

Browser tests verify that displayed summaries use source descriptions or README excerpts, generic fabricated summaries are absent, filtering remains functional, and README failures leave usable cards.

The full deterministic, coverage, E2E, live-source, and packaged-extension gates run before release.

## Scope

This change does not alter rankings, filters, card geometry, permissions, Library membership, backup format, or archive behavior.
