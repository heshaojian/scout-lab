# Complete Model Task Taxonomy Implementation Plan

## 1. Lock the taxonomy contract

- Add the official grouped catalog to Models UI tests.
- Assert 52 visible tasks, seven modality groups, and excluded hidden tasks.
- Extend Models E2E coverage to select every task and inspect the API request.

## 2. Add generic grouped-select rendering

- Extend option metadata with an optional group label.
- Render consecutive grouped options inside escaped native `<optgroup>` elements.
- Keep ungrouped options and all existing controls backward compatible.

## 3. Replace the partial Models list

- Export a complete immutable Models task option catalog.
- Preserve Hugging Face values, labels, modality groups, and visibility rules.
- Keep `All tasks` first and ungrouped.

## 4. Verify and review

- Run focused tests during the red/green cycle.
- Run the complete unit, E2E, coverage, extension, live-source, and dependency checks.
- Review the diff for taxonomy drift, unsafe rendering, and unrelated changes.

