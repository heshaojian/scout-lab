# GitHub Code Live Parity Design

## Goal

Make the Code workbench a faithful, current view of GitHub Trending. With the same source filters selected, Scout Lab must show the same repositories, in the same order, with the same period-star, total-star, and fork values as GitHub.

## Verified Problem

Scout Lab's parser and request construction match GitHub when the filters are identical. The confusing differences come from product behavior around that source:

- A fresh Scout Lab profile defaults to `This week`, while GitHub Trending defaults to `Today`.
- The Code workbench exposes an `AI topic` filter that GitHub Trending does not provide. Selecting it locally removes repositories from GitHub's ordered list.
- Code responses can be served from an unlabelled 30-minute cache, so the page can differ from GitHub until the user presses Refresh.
- The packaged-extension smoke test proves that the new-tab override loads, but it does not prove that the packaged extension can fetch and render live GitHub Trending data.

## Product Contract

### Source-native controls

Code retains only the controls provided by GitHub Trending:

1. Time range: `Today`, `This week`, `This month`
2. Spoken language, including `Any`, `English`, and `Chinese`
3. Programming language

The `AI topic` control is removed from Code. Scout Lab does not re-rank or locally filter GitHub Trending results.

### Default period

The factory default is `Today`, matching GitHub Trending's default page. No storage migration is required: fresh installs use `Today`, while an explicitly saved existing period remains the user's choice. The local verification profile is reset before acceptance testing so it exercises the factory default.

### Live loading

Opening Code always performs a live GitHub Trending request for the selected filters. In-flight requests remain deduplicated, but a completed Code response is not silently reused as a 30-minute cache entry when the user returns to the tab.

The Today queue may continue using its own bounded composition cache so that normal new-tab startup does not repeatedly fetch every source. This exception does not change the standalone Code contract.

Changing a Code filter and pressing Refresh also perform live requests. A source failure shows the existing honest unavailable state and never substitutes GitHub Search or old repository cards.

### Freshness and provenance

The Code status row shows:

- `GitHub Trending`
- a `Live` freshness label with the successful update time
- a direct `Open on GitHub` link built from the selected filters

The timestamp is display-only metadata from the successful response. It is not presented when the source is unavailable.

## Data Flow

1. `buildGithubRequest` maps the three source-native filters to the GitHub Trending URL.
2. `fetchCode` fetches the HTML and parses repository cards in source order.
3. `parseGithubTrending` extracts repository identity, description, programming language, period stars, total stars, and forks.
4. The Code workbench renders every parsed card without topic filtering or re-sorting.
5. The status includes the exact source URL and successful fetch timestamp.
6. Navigation back to Code requests live data instead of accepting a completed Code cache entry.

## Error Handling

- Empty or changed GitHub markup is a source failure, not an empty successful list.
- Failed requests render no stale Code cards.
- The unavailable state includes Retry and the exact GitHub Trending source link.
- GitHub Search is never called or displayed as a fallback.

## Testing

### Unit and integration

- Factory Code defaults use `Today` and contain no topic field or topic control.
- GitHub request URLs preserve time, spoken language, and programming language.
- Code does not apply local topic filtering.
- Re-entering Code performs a new live request even when a valid Code cache entry exists.
- Successful status metadata contains `sourceUrl` and `updatedAt`; failures do not claim live freshness.

### Browser tests

- Code exposes exactly the three source-native controls.
- Default Code results preserve fixture order and metrics.
- Navigation away from and back to Code triggers another request.
- Live timestamp and source link are visible and correct.
- English, Chinese, programming-language, period, failure, and mobile flows remain covered.

### Packaged-extension acceptance

The release smoke test launches the packaged extension, opens Code, waits for a successful live GitHub response, and verifies that:

- at least one repository is rendered;
- the rendered repository order equals the order parsed from the same GitHub Trending page;
- rendered period-star values equal GitHub's values;
- no source-unavailable state or runtime error is present.

The live-source contract continues checking default, English, and Chinese GitHub pages.

## Release Impact

The correction requires a manifest version greater than the submitted `1.0.1` package. The implementation will prepare `1.0.2`; publishing actions remain separate from implementation and verification.
