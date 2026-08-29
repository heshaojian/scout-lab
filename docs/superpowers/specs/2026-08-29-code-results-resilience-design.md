# Code Results Resilience

## Problem

The Code workbench can render an empty grid with its default filters. In a normal localhost preview, GitHub Trending HTML is blocked by browser cross-origin policy. Scout Lab then uses GitHub Search, but the current query combines a recent creation window with a hard minimum-star threshold. A valid GitHub response with zero items is treated as success, so the final safe fallback never runs.

The automated suite tests the parser, a populated Search fallback, and source failures independently. It does not exercise the complete browser path from a blocked Trending request through an empty Search response to visible Code content.

## Result Guarantee

After a Code request completes, Scout Lab must return at least one safe, usable result:

1. Parsed GitHub Trending repository cards.
2. GitHub Search repository cards using the selected time, language, and topic.
3. A trusted GitHub discovery card when both live sources are unavailable or empty.

The final card is explicitly labeled as a fallback. Scout Lab never invents repository metrics or presents fallback content as a matching live result.

## Query Behavior

GitHub Search already sorts recent repositories by stars. Hard minimum-star qualifiers are removed from topic clauses because combining them with a one-day, one-week, or one-month creation window can eliminate every result. Topic, language, archive status, time range, sort, order, and result limit remain intact. Search is an internal fallback for Trending, not a user-selectable Code mode.

The default fallback remains focused on repositories tagged `artificial-intelligence`. Topic-specific workbenches continue to use their corresponding GitHub topic.

## Feed Behavior

The Code adapter validates both response shape and result count:

- malformed Search data is a source failure;
- a Trending fallback Search with no repository items is a source failure;
- any Code source failure without usable cache returns the trusted GitHub discovery card;
- restrictive Trending filters may also return the discovery card, with the status clearly explaining that no live repositories matched;
- stale cached repository cards remain preferred over the discovery card.

This behavior stays in `src/services/feeds.js`; rendering continues to consume the shared card contract without source-specific exceptions.

## Browser Regression Gate

Add a deterministic Playwright smoke test that starts the local preview, intercepts the two GitHub requests, reproduces a blocked Trending request plus an empty Search response, and verifies:

- Code completes loading;
- at least one card is visible;
- the empty-state panel is absent;
- the fallback status is visible;
- the card destination is an HTTPS URL on `github.com`.

A second case supplies a Search repository and verifies that its title and star metric render. Network interception keeps pull-request CI independent of GitHub availability and rate limits.

## Verification

The release gate is:

1. Query tests prove time-bounded GitHub searches do not include hard minimum-star qualifiers.
2. Feed tests prove blocked Trending plus empty Search returns the trusted Code fallback.
3. Feed tests prove malformed Search responses cannot produce an unexplained empty grid.
4. Playwright proves the complete default Code workbench is non-empty and links to GitHub.
5. Existing unit, integration, coverage, live-source, audit, and extension checks pass.
6. The real localhost preview is refreshed and verified with live requests.

## Boundaries

- No hosted proxy or backend is introduced.
- No GitHub account or personal token is required in the extension.
- No new extension permissions are added.
- Other workbenches keep their existing empty-result semantics.
