# Today Without Topic Filter Design

## Decision

Today is a fixed cross-source briefing, not another discovery workbench. Remove its Topic control and the entire empty filter bar while keeping Search and Refresh.

## Data Behavior

Today composes its configured Code, Models, Datasets, Papers, and Learn lanes using each source tab's own filter state. It must not replace those source topics with a Today-wide topic. Legacy saved Today values such as `{ "topic": "agents" }` normalize to an empty filter object and have no effect.

## Scope

- Keep topic controls in Code, Models, Datasets, and Papers.
- Keep Today composition controls in Settings.
- Keep Today search as a local search across the composed cards.
- Keep Today Refresh and existing source/cache failure behavior.

## Acceptance

- Today renders no Topic select, Reset button, or filters region.
- Today still renders its complete configured lane mix.
- A legacy Today topic cannot filter or override source-tab topics.
- Source tabs retain their existing topic controls and behavior.
