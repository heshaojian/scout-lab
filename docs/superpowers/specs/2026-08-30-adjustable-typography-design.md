# Adjustable Typography Design

## Goal

Scout Lab should remain comfortable during hours of reading. Users can choose Standard or Large text independently from layout density, with Large as the default for new and existing installations.

## Preference Contract

Settings adds a segmented `Text size` control under Appearance with two values:

- `Standard` preserves the current typography and dimensions.
- `Large` increases text and the dimensions needed to contain it safely.

The preference is stored as `preferences.textSize`. Missing, malformed, or unsupported values normalize to `large`. This makes Large the default for existing settings that predate the preference without requiring a destructive data migration.

Reset preferences restores Large. Export and import include the preference through the existing durable settings payload.

## First Paint

The pre-render appearance script reads the stored text-size preference and writes `data-text-size` to the document root alongside theme and density. Missing or invalid values resolve to `large`.

The application repeats the same normalized assignment whenever appearance settings change. This keeps startup and runtime behavior consistent and prevents an initial Standard-to-Large flash.

## Typography Scale

Standard retains the existing CSS values exactly.

Large uses explicit design tokens and selector overrides rather than viewport scaling or browser-style zoom. Target sizes are:

- brand title: 21px;
- sidebar supporting text: 12-13px;
- intention text: 15px;
- navigation and inherited input text: at least 17px;
- main workbench title: 26px;
- header subtitle: 14px;
- filters, status, buttons, and compact metadata: 13-14px;
- card title: 20px;
- card summary and daily note: 16px;
- card badges, tags, metrics, labels, and metadata: 13px;
- card actions and destination links: 14px;
- Settings headings, labels, controls, help, and messages: 12-15px according to hierarchy.

Letter spacing remains unchanged except for the existing uppercase kicker treatment. Font size does not scale with viewport width.

## Layout Adaptation

Large text must not be squeezed into Standard-sized controls. Large mode therefore:

- widens the desktop rail from 228px to 248px;
- increases navigation, input, select, segmented-control, and button heights where needed;
- increases card title and summary reserved heights so card footers remain aligned;
- permits labels to wrap where truncation would hide essential meaning;
- enlarges the Settings drawer modestly while preserving a 100vw mobile maximum;
- keeps the existing three-, two-, and one-column Comfortable grid and four-column Compact grid unless responsive minimum widths require the established fallback breakpoint.

Text must not overlap, clip, create horizontal page overflow, or resize fixed controls when labels change. Mobile rail and toolbar behavior continues to follow the existing responsive layout.

## Density Independence

Text size and density are orthogonal preferences:

- Standard + Comfortable keeps the current reading layout.
- Standard + Compact keeps the current dense layout.
- Large + Comfortable is the new default and prioritizes sustained reading.
- Large + Compact keeps compact spacing and column behavior while using readable Large typography.

Changing one preference must not mutate the other.

## Settings Experience

Appearance presents controls in this order: Theme, Text size, Density. The control uses the existing segmented setting pattern and applies immediately.

The Settings drawer itself follows the selected text size, allowing the user to judge the effect while the drawer remains open. Focus remains on the selected control after rerender, matching existing settings behavior.

## Accessibility And Safety

Both modes retain visible focus states, semantic labels, minimum touch-target dimensions, theme contrast, and reduced-motion-neutral behavior. The implementation uses text content through existing escaped rendering paths and introduces no new permissions or remote resources.

## Verification

Automated tests must prove:

1. Missing or invalid preferences normalize to Large.
2. Standard and Large persist independently from density and theme.
3. The pre-render script applies Large before application boot and restores stored Standard without a flash.
4. The Settings control applies immediately, remains selected after reload, and reset restores Large.
5. Backup export/import preserves the text-size preference.
6. Large desktop typography meets the target minimums on the sidebar, main controls, cards, notes, and Settings drawer.
7. Standard retains the existing typography values.
8. Standard/Large combined with Comfortable/Compact produces no horizontal overflow or incoherent overlap at 1440x900, 900x900, and 390x844.
9. The complete unit, integration, end-to-end, live-source, and packaged-extension suites pass with at least 80 percent coverage in every enforced category.

## Release Boundary

The implementation prepares the next patch release and local Chrome Web Store ZIP. Pushing, uploading, or modifying the submitted store item remains a separate explicitly requested action.
