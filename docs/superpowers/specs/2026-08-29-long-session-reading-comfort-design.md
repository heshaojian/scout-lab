# Long-Session Reading Comfort Design

**Status:** Approved
**Date:** 2026-08-29

## Purpose

Scout Lab is a daily research surface that may remain open for hours. Its current Comfortable density still uses a four-column desktop grid and 10-12px supporting text, which makes sustained reading tiring. Comfortable density will become a reading-first layout while Compact density remains available for scanning more items at once.

## Scope

This change applies to the shared card grid in every workbench. It changes typography, spacing, responsive column count, and low-glare surface colors. It does not change card content, source adapters, filtering, navigation, annotations, storage, or feed behavior.

## Layout

Comfortable density uses:

- three columns on wide desktop viewports
- two columns on medium viewports
- one column on mobile
- wider cards with stable geometry and no horizontal overflow
- increased card padding and grid spacing
- four visible summary lines so wider cards provide useful reading context

Compact density remains the high-density option. It retains four columns and its current card type scale on wide desktop viewports, so it stays meaningfully denser than Comfortable.

Responsive behavior must account for the persistent navigation rail. Breakpoints are based on available page width, not font scaling with viewport width.

## Typography

Comfortable cards use these minimum targets:

| Element | Target |
| --- | --- |
| Card title | 18px, 1.3 line height |
| Summary | 15px, 1.6 line height |
| Metric and secondary metadata | 12-13px |
| Tags and badges | 12px |
| Card actions and links | 12-13px |

Text keeps normal letter spacing. Titles remain limited to two lines. Summaries remain clamped to preserve consistent grid rhythm, but Comfortable mode displays four lines. The wider card measure should usually keep prose between roughly 45 and 75 characters per line.

## Eye Comfort

Light theme uses a soft neutral page background and near-white card surfaces instead of a field of high-intensity pure white. Dark theme remains charcoal rather than pure black, with readable neutral text and sufficient muted-text contrast. Source colors remain accents and do not dominate the reading surface.

The change must preserve:

- WCAG-readable text contrast for normal and muted content
- clear keyboard focus indicators
- restrained borders and hover states
- no gradients, glow, blur, or decorative effects
- consistent visual hierarchy across all source tabs

No automatic time-based theme switching, blue-light filter, or color-temperature control is added. Those behaviors belong to the operating system and would create unnecessary settings complexity.

## Settings

The existing Density setting remains the control surface:

- **Comfortable:** three-column reading-first layout and larger type
- **Compact:** denser overview layout

No third density mode or font-size slider is introduced. Existing saved preferences continue to work without migration because the stored density values do not change.

## Testing

Automated tests must verify:

- Comfortable uses three columns at the desktop acceptance viewport.
- Comfortable card titles and summaries meet the minimum computed font sizes.
- Comfortable summaries use the intended reading line height.
- Compact remains denser than Comfortable.
- Medium and mobile viewports reduce to two and one columns without overflow.
- Filters, card actions, settings, and source-specific content remain functional.
- Existing unit, integration, live-source, and Playwright suites remain green.

Visual verification must inspect light and dark Comfortable layouts at desktop and mobile sizes for clipped text, overlap, excessive glare, uneven card geometry, and unreadable muted text.

## Acceptance Criteria

1. Comfortable mode displays three shared-grid cards per row on a wide desktop viewport.
2. Card titles are at least 18px and summaries are at least 15px in Comfortable mode.
3. Summary line height is at least 1.55 in Comfortable mode.
4. Badges, tags, metrics, metadata, and actions are not smaller than 12px in Comfortable mode.
5. Comfortable cards expose up to four summary lines and remain visually aligned.
6. Compact mode remains available and visibly denser.
7. The grid uses two columns on medium widths and one column on mobile without horizontal scrolling.
8. Light and dark themes avoid pure-white or pure-black page fields while retaining readable contrast.
9. All workbenches use the same revised card geometry.
10. Existing interactions and automated quality gates continue to pass.
