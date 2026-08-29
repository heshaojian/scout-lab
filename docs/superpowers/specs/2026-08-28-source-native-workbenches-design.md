# Scout Lab Filtered Grid Workbenches

**Status:** Implemented and verified
**Date:** 2026-08-28  
**Product:** Scout Lab Chrome new-tab extension

## 1. Summary

Scout Lab will keep one consistent content-card grid inside a shared application shell while adding source-specific filtering to six workbenches:

- Today: a concise cross-source card queue
- Code: GitHub repository cards
- Models: Hugging Face model cards
- Datasets: Hugging Face dataset cards
- Papers: community and raw-research cards
- Learn: curated learning cards

The workbenches share navigation, search, topic vocabulary, card geometry, item actions, daily notes, local persistence, and iCloud archiving. Each workbench owns its filters, default ranking, metadata mapping, loading state, and fallback behavior.

The product remains a focused daily scanner. It will not become a general-purpose database browser.

## 2. Goals

1. Make each tab useful through source-specific filters while preserving one consistent grid and card design.
2. Let the user change the few filters that materially improve daily discovery.
3. Label trends, totals, dates, and community signals honestly.
4. Keep common actions predictable across every content type.
5. Preserve fast new-tab startup through cached-first rendering.
6. Support a complete daily archive containing the exact visible context and user annotations.

## 3. Non-Goals

- GitHub account authentication or private repository access
- Hugging Face account authentication or gated asset downloading
- Automated paper summarization performed by Scout Lab
- A full RSS reader, bookmark manager, or web search engine
- Infinite scrolling or large result-set exploration
- Social features, notifications, engagement streaks, or recommendations based on behavioral profiling
- Cloud sync beyond the existing user-selected iCloud Drive folder

## 4. Product Principles

### 4.1 Shared geometry, source-native meaning

Every tab uses the same grid, card dimensions, information order, action placement, spacing, keyboard behavior, loading states, and archive behavior. Filters and metadata labels reflect what each source is good at.

### 4.2 Focused controls

Each workbench exposes no more than four primary controls before an optional overflow menu. Defaults should produce a useful screen without configuration.

### 4.3 Metric honesty

- GitHub total stars must not be described as stars gained.
- GitHub Trending period stars may only be shown when parsed from GitHub's public Trending page.
- Hugging Face trending score is a source ranking signal, not a quality score.
- Model and dataset downloads are cumulative source metrics, not unique users or quality measures.
- arXiv has no popularity signal; its feed is ranked only by date or query relevance.
- Cached or fallback results must be visibly labelled.

### 4.4 Daily orientation

Every workbench should support a useful decision within 30 seconds: open, favorite, hide, annotate, or move to the next item.

## 5. Shared Application Shell

The existing left rail remains the stable navigation surface. The main area changes with the active workbench.

```txt
+------------------+-------------------------------------------------------+
| Scout Lab        | Workbench title                         Search  Refresh |
| AI learning tab  | Workbench-specific controls                           |
|                  +-------------------------------------------------------+
| Today            | Consistent content-card grid                          |
| Code             |                                                       |
| Models           |                                                       |
| Datasets         |                                                       |
| Papers           |                                                       |
| Learn            |                                                       |
|                  +-------------------------------------------------------+
| iCloud archive   | Daily note and archive status                         |
+------------------+-------------------------------------------------------+
```

### 5.1 Shared controls

- Section navigation
- Search within the active result set
- Refresh current query
- Favorite, Hide, Comment, and Open actions
- Daily learning note
- iCloud folder connection and Save today
- Cached/fallback source status

### 5.2 Topic vocabulary

The shared topic vocabulary remains:

- All
- Agents
- LLMs
- RAG
- Evaluation
- Multimodal

Topic is rendered inside the active workbench filter bar rather than as a global row that implies identical source behavior. Each adapter translates a topic into source-appropriate query terms or tags.

### 5.3 Filter behavior

- Changing a filter updates the current query and persists it for that workbench.
- The UI renders cached data immediately when a matching query cache exists.
- Network requests are deduplicated by query key.
- Search is local and does not trigger a request on every keystroke.
- A `Reset filters` command restores that workbench's defaults.
- Loading a new query must never show cards from the previous query or section.

### 5.4 Shared grid and card contract

Every workbench renders content through the same responsive grid:

- Wide desktop: four equal columns
- Desktop/tablet: three or two equal columns as space decreases
- Mobile: one column
- Stable 14-pixel gap
- Cards use the same minimum height, padding, border, radius, and footer position

Every card uses this information order:

1. Source/type badge and primary metric
2. Title
3. Summary clamped to three lines
4. Up to four tags
5. Secondary metadata row
6. Favorite, Hide, Comment, and Open actions

Source colors, labels, and metrics may change. Card geometry, typography scale, and action placement may not. Missing optional values are omitted or shown as `Not specified` without shifting the action footer.

## 6. Today Workbench

### 6.1 Purpose

Today answers: "What deserves my attention now?"

### 6.2 Layout

Today uses the same reusable card grid as every source tab:

```txt
+------------------+------------------+------------------+------------------+
| Code card        | Code card        | Model card       | Dataset card     |
+------------------+------------------+------------------+------------------+
| Paper card       | Paper card       | Learn card       |                  |
+------------------+------------------+------------------+------------------+
```

On narrow screens, cards reflow while preserving the same priority order.

### 6.3 Controls

- Topic: default All
- Refresh

Today does not expose source-specific filters. It uses the saved default query for each source workbench.

### 6.4 Selection

The briefing contains:

- 2 Code items
- 1 Model
- 1 Dataset
- 2 Papers, preferring one community paper and one arXiv paper
- 1 next learning item

The first card is the highest-ranked visible non-Learn item, but it keeps the standard card design. Today does not invent a cross-source numeric score.

## 7. Code Workbench

### 7.1 Purpose

Code helps the user discover AI repositories worth reading, running, or learning from.

### 7.2 Layout

Use the shared content-card grid. Repository cards map these values into the shared slots:

- Owner/repository name
- Description
- Primary language and language color
- Period stars when available
- Total stars
- Forks
- Creation date when the Search fallback is active
- Up to three AI topic tags
- Shared item actions

Contributor avatars and developer ranking are excluded from the first implementation because they add requests without improving the primary learning decision.

### 7.3 Controls

1. Time: `Today`, `This week`, `This month`
2. Language: `All`, `Python`, `TypeScript`, `JavaScript`, `Jupyter Notebook`, `Rust`, `Go`, `C++`, `Java`
3. Topic: shared topic vocabulary

Defaults: `This week`, `All languages`, `All topics`. Trending is the only user-facing Code mode.

### 7.4 Data strategy

#### Trending

Fetch GitHub's public Trending HTML:

```txt
https://github.com/trending/{language}?since={daily|weekly|monthly}
```

Parse repository identity, description, language, total stars, forks, and period stars from each repository article. Enrich only missing stable repository metadata through the official repository API when the request budget permits.

Trending is inherently a fragile HTML integration. Parser fixtures must cover representative GitHub markup. If parsing fails:

1. Show a matching cached Trending result when available.
2. Otherwise load a matching recent-repository Search from the official API.
3. Label the fallback `GitHub search fallback`.
4. Never display a period-star value from the fallback.

#### Search fallback

Use GitHub repository search with:

- AI topic query
- `created:>=` selected period start
- selected `language:` qualifier
- `archived:false`
- sort by total stars descending

The Search fallback is never shown as a selectable mode. Existing saved `New & rising` or `Active` values migrate to Trending by dropping the legacy field.

### 7.5 Rate limits

- Cache each distinct GitHub query for at least 30 minutes.
- Deduplicate simultaneous matching requests.
- Do not query while a dropdown is merely open.
- Keep GitHub API enrichment bounded to visible items and concurrency-limited.
- Preserve the last good cache across transient rate-limit failures.

## 8. Models Workbench

### 8.1 Purpose

Models helps the user compare noteworthy model releases and decide which model page is worth inspecting.

### 8.2 Layout

Use the shared content-card grid. Model cards map these values into the shared slots:

- Model ID and owner
- Pipeline task
- Library or format
- Created or modified date
- Trending score when that ranking is active
- Downloads and likes
- License
- Access state when available
- Shared item actions

The layout should make task, recency, and access easier to compare than long descriptions.

### 8.3 Controls

1. Rank: `Trending`, `Newest`, `Downloads`, `Likes`
2. Task: `All`, `Text generation`, `Image-text-to-text`, `Text-to-image`, `Feature extraction`, `Automatic speech recognition`
3. Size: `Any`, `<1B`, `1B-7B`, `7B-30B`, `30B+`
4. Access: `All`, `Open`, `Gated`

Defaults: `Trending`, `All tasks`, `Any size`, `All access`.

### 8.4 Data strategy

Use the Hugging Face models endpoint. Translate controls to source-supported `sort`, `pipeline_tag`, `num_parameters`, and `gated` parameters. Preserve source-provided tags rather than guessing model attributes from names.

When an attribute is not present in the list response, omit it from the item rather than displaying an empty label or inferred value.

## 9. Datasets Workbench

### 9.1 Purpose

Datasets helps the user compare what problems, languages, scales, and evaluation practices are receiving attention.

### 9.2 Layout

Use the shared content-card grid. Dataset cards map these values into the shared slots:

- Dataset ID and owner
- Description
- Primary task
- Size category
- Language
- License
- Downloads and likes
- Updated date
- Shared item actions

### 9.3 Controls

1. Rank: `Trending`, `Newest`, `Downloads`, `Likes`
2. Task: `All`, `Text generation`, `Retrieval`, `Question answering`, `Classification`, `Image`, `Audio`
3. Size: `Any`, `<10K`, `10K-1M`, `1M-100M`, `100M+`
4. More menu: Language, License, `Official benchmarks only`

Defaults: `Trending`, `All tasks`, `Any size`, no additional restrictions.

### 9.4 Data strategy

Use the Hugging Face datasets endpoint. Translate controls into `sort`, task-category, size-category, language, license, and benchmark filters. Parse normalized task, size, language, and license values from source tags.

Missing metadata is displayed as `Not specified`, not as an empty card slot.

## 10. Papers Workbench

### 10.1 Purpose

Papers supports two different research behaviors without pretending they are the same feed:

- Community: discover papers receiving attention on Hugging Face
- Raw arXiv: inspect recent `cs.AI` and `cs.LG` submissions

### 10.2 Layout

Use the shared content-card grid. Paper cards map these values into the shared slots:

- Source and category
- Title
- Authors
- Two- or three-line summary
- Published/submitted date
- Source-specific signal
- Abstract and PDF links when available
- Shared item actions

Community cards show upvotes and comments. arXiv cards show categories and dates only.

### 10.3 Controls

1. Source: `Community`, `Raw arXiv`
2. Time: `Today`, `This week`, `This month`
3. Topic/category:
   - Community: shared topic vocabulary
   - Raw arXiv: `cs.AI + cs.LG`, `cs.AI`, `cs.LG`, plus shared topic vocabulary
4. Sort:
   - Community: `Trending`, `Recent`
   - Raw arXiv: `Newest`, `Relevance`

Defaults: `Community`, `This week`, `All topics`, `Trending`.

### 10.4 Hugging Face Daily Papers

Use the Daily Papers endpoint with date, ISO week, or month and `trending` or `publishedAt` sorting. Normalize:

- Paper ID and URL
- Title
- Authors
- Source summary or source-provided AI summary
- AI keywords
- Publication date
- Upvotes
- Comment count
- Organization when present

The UI must identify source-provided AI summaries as `HF summary`.

### 10.5 arXiv

Use the Atom API with:

- Category expression for `cs.AI`, `cs.LG`, or both
- Optional shared-topic expression against title/abstract/all fields
- `submittedDate` range for the selected time window
- `submittedDate` or relevance sorting
- A maximum of 24 results

Normalize:

- arXiv ID and abstract URL
- PDF URL
- Title
- Authors
- Abstract
- Primary and secondary categories
- Published and updated dates
- Author comment when available

Cache an arXiv query for one day. Avoid repeated multi-page requests; if pagination is later added, wait at least three seconds between sequential API calls.

## 11. Learn Workbench

### 11.1 Purpose

Learn turns the curated link list into a small personal syllabus rather than another popularity feed.

### 11.2 Layout

Learn uses the shared content-card grid. The first card is the current in-progress item, followed by courses, cookbooks, and exercises. Progress is shown in the card's secondary metadata row without changing the shared geometry.

### 11.3 Controls

1. Focus: shared topic vocabulary plus `Fundamentals`
2. Format: `All`, `Course`, `Cookbook`, `Exercise`
3. Progress: `All`, `Not started`, `In progress`, `Done`

Defaults: `All focus`, `All formats`, `All progress`.

### 11.4 Catalog

The first catalog contains maintained local metadata for:

- Hugging Face LLM Course
- Hugging Face Agents Course
- Hugging Face Context Course
- Hugging Face Open-Source AI Cookbook
- Google Machine Learning Crash Course

Each learning item includes:

- Stable ID
- Title and URL
- Source
- Focus tags
- Format
- Level
- Estimated effort when the source provides it
- Optional ordered units or resume URL

### 11.5 Progress

The user can set `Not started`, `In progress`, or `Done`. Opening a not-started item marks it in progress only after explicit confirmation or a visible progress action; opening a link alone must not claim completion.

Progress is stored locally and included in the daily archive.

## 12. Data Contracts

### 12.1 Shared item

```js
{
  id,
  source,
  section,
  type,
  title,
  url,
  summary,
  tags,
  owner,
  publishedAt,
  metrics: [{ id, label, value, meaning }],
  links: [{ id, label, url }],
  details: {}
}
```

`details` is source-specific and rendered only by the owning workbench. The shared shell uses only the common fields and does not inspect source response shapes.

### 12.2 Query state

```js
{
  section,
  topic,
  controls: {},
  search: ""
}
```

Each workbench declares:

```js
{
  id,
  defaults,
  controls,
  fetch,
  mapCardMetadata,
  cacheTtl
}
```

The shared renderer owns grid and card markup. Workbenches cannot provide alternate list, table, shelf, or feature-card markup.

### 12.3 Cache key

Cache keys use a stable serialization of source, section, and all network-affecting controls. Local search does not create a new network cache entry.

## 13. State And Persistence

- Store filter settings per workbench.
- Preserve existing favorite, hidden, and comment state by stable item ID.
- Store Learn progress separately from generic item annotations.
- Store the current daily snapshot as a cross-source briefing plus each workbench query used to generate it.
- Migrate existing `selectedTopic` into each workbench's topic default on first load.
- Ignore unknown legacy fields without deleting user data.

State updates create new objects and do not mutate existing state in place.

## 14. Daily Archive

The daily Markdown archive contains:

1. Daily note
2. Today's briefing grouped by source
3. Favorites
4. Hidden items
5. Comments
6. Learn progress changed that day
7. Active filters used for each archived feed
8. Cached/fallback status when relevant

The archive stores source metrics with labels and meanings. It does not archive raw API payloads.

## 15. Loading, Empty, And Error States

### 15.1 Cached-first loading

If matching cached data exists, render it immediately with a subtle refreshing indicator. Do not replace usable content with a full-page spinner.

### 15.2 Empty state

An empty state names the active restrictions and provides `Reset filters`. It does not imply the entire source is empty.

### 15.3 Partial failure

- Today renders successful source cards even if another source fails.
- A failed workbench retains matching stale data when available.
- Fallback source or mode is named explicitly.
- Refresh errors remain in the workbench and do not use blocking alerts.
- iCloud permission prompts remain user initiated.

### 15.4 Parser failure

GitHub Trending parser failure is distinct from a network failure. Log a concise local diagnostic, use cached/fallback data, and display `Trending format changed; showing GitHub search fallback` when necessary.

## 16. Responsive And Accessibility Requirements

- No horizontal page overflow at 390, 768, 900, 1280, or 1440 CSS pixels.
- The shared grid collapses from four to three, two, and one columns without changing card anatomy.
- All controls are keyboard reachable and have visible focus states.
- Filter controls have programmatic labels and current-value announcements.
- Segmented controls use appropriate selected-state semantics.
- Status changes use a non-intrusive live region.
- Icon-only item actions have tooltips and accessible names.
- Text never depends on source color alone.
- Reduced-motion preference disables non-essential transitions.
- Loading does not shift stable toolbar or navigation dimensions.

## 17. Security And Privacy

- No API tokens or credentials are required for the first implementation.
- No source response is inserted as unsanitized HTML.
- GitHub Trending HTML is parsed as inert DOM; only normalized text and validated HTTPS URLs are retained.
- External URLs must use `https:` and expected source hosts before rendering.
- User comments and notes are escaped before rendering and Markdown-exported as text.
- Network access remains limited to GitHub, Hugging Face, and arXiv hosts declared in the extension manifest.
- No browsing or learning history leaves the device through Scout Lab.

## 18. Test Strategy And Acceptance Criteria

### 18.1 Unit tests

- Query builders for every workbench and control combination
- Stable cache-key serialization
- GitHub Trending HTML parser fixtures
- GitHub API, Hugging Face model/dataset/paper, and arXiv Atom normalization
- Topic translation per source
- Metric labels and fallback semantics
- State migration and immutable updates
- Daily archive generation
- URL validation and HTML escaping

Target: at least 80% statement and branch coverage for source adapters, query state, storage, and archive formatting.

### 18.2 Integration tests

- Workbench filter change to request, cache, normalization, and shared-card render
- Cached-first refresh behavior
- GitHub Trending parser failure to official-search fallback
- Today partial-source failure
- Favorite, Hide, Comment, and Learn progress persistence across reload
- Daily snapshot and Markdown archive with source-specific fields
- No previous-section cards during query loading

### 18.3 End-to-end tests

Run the unpacked extension or an equivalent extension-context harness and verify:

1. Open each workbench and confirm the same grid and card geometry with the correct source-specific controls.
2. Change every primary control and verify visible query meaning.
3. Search locally and reset filters.
4. Favorite, hide, comment, and restore state after reload.
5. Switch Papers between Community and Raw arXiv.
6. Change Learn progress and resume the selected item.
7. Trigger cached, empty, stale, network-error, and parser-fallback states.
8. Connect an archive folder with user participation, save today, and inspect the Markdown file.
9. Verify keyboard navigation and visible focus.
10. Verify no Scout Lab console errors.

### 18.4 Live-source contract tests

Use bounded read-only requests to confirm:

- GitHub Trending still contains parseable repository entries and period stars.
- GitHub search returns expected repository fields.
- Hugging Face models and datasets return requested filters and metrics.
- Hugging Face Daily Papers returns paper, summary, upvote, and comment fields.
- arXiv returns Atom entries with abstract, author, category, date, and links.

These tests must tolerate source downtime and must not make the deterministic unit suite depend on live network availability.

### 18.5 Visual tests

Capture and inspect Today, Code, Models, Datasets, Papers, and Learn at:

- 1440 x 900
- 900 x 900
- 390 x 844

Verify no overlap, clipping, horizontal overflow, unstable control dimensions, empty primary content, or illegible metadata.

### 18.6 Release gate

Implementation is complete only when:

- Static checks pass.
- Unit and integration tests pass with at least 80% target-module coverage.
- End-to-end critical flows pass.
- Live-source contract checks complete or are reported as unavailable with fixture coverage passing.
- All six visual states pass desktop, tablet, and mobile inspection.
- No critical or high security findings remain.
- The extension health check and manifest validation pass.
- The working tree contains only intentional changes.

## 19. Implementation Boundaries

The first implementation may split the current large `src/app.js` and `src/services/feeds.js` into focused modules, because source-specific controls and adapters cannot remain maintainable inside one renderer and one feed service. The refactor should stay limited to:

- Workbench definitions and metadata mapping
- Shared grid and card rendering
- Source adapters and query builders
- Shared item actions and shell
- Query-aware storage and cache
- Tests and fixtures required by this specification

Unrelated styling, archive-provider expansion, account systems, build frameworks, and cloud services remain out of scope.

## 20. Research Basis

- GitHub repository search supports stars, forks, dates, language, topic, license, and activity qualifiers, but its documented API does not expose period star gain.
- GitHub's public Trending page exposes daily, weekly, and monthly repository lists with period-star labels.
- Hugging Face model and dataset APIs support trending, newest, downloads, and likes sorting plus source-specific filters.
- Hugging Face Daily Papers supports date, week, month, trending/recent sorting, community metrics, and source-provided summaries.
- arXiv supports category, field, Boolean, submitted-date, relevance, and date queries, but no popularity metric.
- Curated Learn sources are intentionally maintained locally so Scout Lab can define a stable learning path without pretending that course popularity equals usefulness.
