# Balanced Models Workbench Implementation Plan

## 1. Lock the source contract with tests

- Add query tests for all seven sort mappings and both directions.
- Add query tests for task, size, base-only, inference, library, license, access, and app parameters.
- Add filter normalization tests for new defaults and malformed stored values.

## 2. Normalize model facts and families

- Extract parameter count, library, license, access, inference providers, base model relation, and dates.
- Make the primary metric follow the selected sort.
- Group related variants immutably and retain validated child links.
- Filter updated-date ranges after normalization.

## 3. Build the balanced filter surface

- Add exact Hugging Face sort labels and common tasks.
- Add accessible quick toggles for base-only and inference availability.
- Add a native More filters disclosure for secondary selectors.
- Keep saved defaults and reset behavior on the existing settings path.

## 4. Render grouped model cards

- Keep the shared card structure.
- Add a collapsed related-variants section only when a family has variants.
- Escape all source text and validate every destination.
- Add responsive styles for the new controls and disclosure.

## 5. Verify daily-heavy-use behavior

- Add Models E2E coverage for each control and request mapping.
- Verify sort order, grouping, variant links, card links, search, favorite, hide, comment, saved defaults, and reset.
- Verify comfortable and compact density, light and dark themes, and desktop/tablet/mobile overflow.
- Run unit/integration tests, coverage, E2E tests, repeated E2E stress runs, extension checks, live-source checks, link checks, and dependency audit.
