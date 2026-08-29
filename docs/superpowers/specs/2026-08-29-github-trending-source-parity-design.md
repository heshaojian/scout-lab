# GitHub Trending Source Parity Design

**Date:** 2026-08-29  
**Status:** Approved for implementation  
**Scope:** Scout Lab Code workbench

## Problem

The Code workbench currently attempts to fetch GitHub Trending HTML and silently switches to GitHub Search when that request fails. A normal HTTP preview cannot read `github.com` HTML because GitHub does not grant cross-origin access, so the preview commonly displays Search results that do not match GitHub Trending.

The workbench also omits GitHub's spoken-language filter. GitHub accepts this filter through the `spoken_language_code` query parameter.

## Product Contract

The Code workbench represents GitHub Trending and no other ranking source.

- It must never show GitHub Search, a curated repository, or cached substitute as Trending.
- If GitHub Trending is unavailable, show a clear unavailable state with a retry action and a link to GitHub Trending.
- Previously cached Search results must be invalidated and must not reappear.
- With `AI topic` set to `All`, repository order, repository identity, and period-star values must match GitHub for the same time, programming-language, and spoken-language filters.
- With a specific AI topic selected, Scout Lab may return a subset of the fetched Trending list, but it must preserve GitHub's original ordering.

## Code Filters

The Code filter row contains four controls in this order:

1. `Time range`: Today, This week, This month
2. `Spoken language`: Any, English, Chinese, Japanese, Korean, Spanish, French, German, Portuguese, Russian
3. `Language`: the existing programming-language list
4. `AI topic`: the existing Scout Lab topic list

Spoken-language values map directly to GitHub:

| Label | Value |
| --- | --- |
| Any | `all` |
| English | `en` |
| Chinese | `zh` |
| Japanese | `ja` |
| Korean | `ko` |
| Spanish | `es` |
| French | `fr` |
| German | `de` |
| Portuguese | `pt` |
| Russian | `ru` |

`Any` omits `spoken_language_code`; every other value sets it once. The programming-language filter remains in the Trending path, and the time range maps to GitHub's `daily`, `weekly`, and `monthly` values.

## Source Transport

### Installed extension

The extension page fetches GitHub Trending directly. The existing `https://github.com/*` host permission authorizes this cross-origin request from the extension origin.

### Local preview

Replace the plain Python static server with a small Node development server. It serves repository files and exposes one same-origin endpoint for GitHub Trending HTML.

The endpoint is deliberately narrow:

- only `GET` is accepted;
- only the GitHub Trending repository path is requested upstream;
- only known time, programming-language, and spoken-language values are accepted;
- arbitrary target URLs, request bodies, cookies, authorization headers, and user headers are rejected or ignored;
- upstream responses are returned as text with `no-store` caching.

The application chooses the local endpoint only on `http:` or `https:` localhost previews. A `chrome-extension:` page continues to request GitHub directly.

No third-party proxy is used.

## Data Flow

1. Normalize saved Code filters. Legacy `mode` fields are dropped and missing `spokenLanguage` values become `all`.
2. Build the canonical GitHub Trending URL.
3. Select direct extension transport or the local preview endpoint.
4. Fetch HTML and reject non-success responses.
5. Parse `article.Box-row` entries into the shared card contract.
6. Reject a successful-looking response that contains no repository cards.
7. Apply the optional AI-topic subset without reordering cards.
8. Render the exact result or an unavailable state.

## Error Behavior

There is no repository-data fallback.

On a network, HTTP, timeout, or parser failure, the Code results area shows:

- `GitHub Trending is unavailable`
- a concise reason that does not expose sensitive details;
- `Retry`;
- `Open GitHub Trending`, using the exact selected filter URL.

An AI-topic filter that legitimately matches no Trending repositories uses a separate empty-filter state and offers `Clear AI topic`. It is not reported as a source failure.

## Cache Migration

The Code cache identity gains an explicit source revision. Existing Code caches created from GitHub Search or older source behavior are ignored. Other workbench caches and durable user data remain unchanged.

Successful Trending data may still be cached for request deduplication and ordinary startup performance, but a failed live request must not display cached cards. This cache is an optimization, not a user-visible fallback.

## Testing

### Unit

- Normalize missing and supported spoken-language values.
- Drop legacy Code modes.
- Build exact GitHub URLs for Any, English, and Chinese.
- Preserve parameter combinations for time and programming language.
- Reject unsupported proxy parameters.
- Parse repository titles, order, total stars, forks, and period stars from a representative Trending fixture.

### Integration

- Code makes one Trending request and never calls GitHub Search.
- Network, HTTP, and malformed-markup failures produce the unavailable state.
- Legacy Search cache entries are ignored.
- AI-topic filtering preserves source order.

### Browser

- Code renders four filters and no Mode control.
- English and Chinese change the request and visible result set.
- A proxied Trending response renders repository order and star metrics exactly.
- A failed Trending response renders no repository cards and exposes Retry plus the exact GitHub link.
- Filter controls, cards, actions, settings, and navigation remain operable at desktop and mobile widths.

### Live contract

- Fetch daily, weekly, and monthly GitHub Trending pages.
- Fetch at least English and Chinese spoken-language variants.
- Confirm each response contains repository cards and valid destination links.
- Compare the parser's ordered titles and period-star values with the same live HTML.

All existing quality gates remain required, including at least 80% coverage in statements, branches, functions, and lines.

## Non-Goals

- GitHub Developers Trending
- GitHub star or sponsor actions
- The complete GitHub spoken-language catalog
- A remote Scout Lab backend
- Search-based or third-party Trending approximations

## References

- [GitHub Trending](https://github.com/trending)
- [Chrome extension cross-origin network requests](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests)
