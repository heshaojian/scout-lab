# Scout Lab Friendly Settings

**Status:** Proposed for written review
**Date:** 2026-08-29
**Product:** Scout Lab Chrome new-tab extension

## 1. Summary

Scout Lab will add a compact, workflow-first Settings surface. The first release will make the new tab more comfortable for daily use without turning it into a general browser dashboard.

Version one includes:

- system, light, and dark themes
- comfortable and compact density
- configurable startup workbench
- foreground or background link opening
- configurable Today source composition
- user-defined default filters for each workbench
- validated JSON backup and restore

The settings system remains local, permission-light, and consistent with Scout Lab's focused AI-learning purpose.

## 2. Goals

1. Make Scout Lab comfortable in both bright and low-light environments.
2. Reduce repeated setup for the user's normal daily workflow.
3. Let the user control the Today queue without exposing source internals.
4. Preserve the distinction between current filters and intentional defaults.
5. Make personal settings and annotations portable without exporting feed caches.
6. Keep every setting understandable without documentation.

## 3. Non-Goals

- generic search-engine selection
- bookmark or top-site management
- arbitrary user-authored CSS or color pickers
- per-source custom card templates
- background notifications or scheduled fetching
- Chrome Sync in version one
- cloud accounts or a Scout Lab backend
- font-family selection, localization, or extensive accessibility profiles in version one

High contrast, text scaling, reduced motion, localization, and Chrome Sync remain possible later additions. They are not part of this implementation.

## 4. Product Principles

### 4.1 Workflow first

Settings should remove repeated work. Appearance controls are useful, but Today composition, startup behavior, and filter defaults should receive equal product attention.

### 4.2 Small surface

Settings is one drawer with grouped controls, not a separate dashboard. Every option takes effect immediately except importing a backup, which requires a review and confirmation step.

### 4.3 Predictable reset behavior

Current filters continue to persist automatically. A separate saved-default layer defines what `Reset filters` restores.

### 4.4 Permission-light portability

Version one uses the existing local data model and explicit file export/import. It does not add account access or synchronization permissions.

## 5. Settings Surface

### 5.1 Entry point

Add a Settings icon button to the bottom of the left rail near the archive controls. The button has an accessible `Settings` label and tooltip.

Selecting it opens a right-side drawer:

- desktop: 380-420 pixels wide
- compact and mobile layouts: full-width overlay
- unframed sections separated by borders, not nested cards
- fixed header containing `Settings` and a close icon
- independently scrollable body

The drawer closes through its close button, `Escape`, or backdrop selection. Closing never discards changes because ordinary preferences save immediately.

### 5.2 Sections

The drawer contains these sections in order:

1. Appearance
2. Opening and startup
3. Today queue
4. Workbench defaults
5. Data and reset

## 6. Appearance

### 6.1 Theme

Use a three-option segmented control:

- `System` (default)
- `Light`
- `Dark`

`System` follows the operating-system color preference and responds when it changes. An explicit Light or Dark choice overrides the system preference.

The dark theme uses neutral near-black surfaces rather than pure black:

- page background: deep neutral charcoal
- cards and controls: one elevation step lighter
- primary text: soft white
- secondary text: accessible cool gray
- borders: visible without becoming bright outlines
- source colors: preserved but adjusted for dark-background contrast

Native form controls and scrollbars must use the matching `color-scheme`. Theme initialization occurs before the main application renders so a new tab does not flash the wrong theme.

### 6.2 Density

Use a two-option segmented control:

- `Comfortable` (default)
- `Compact`

Compact mode changes spacing, card minimum height, summary line count, and grid gap. It does not change card anatomy, hide required actions, or reduce accessible control targets below 36 pixels.

Density does not change the selected source, filters, or result count.

## 7. Opening And Startup

### 7.1 Startup workbench

Use a select control with:

- `Last used` (default, preserving current behavior)
- `Today`
- `Code`
- `Models`
- `Datasets`
- `Papers`
- `Learn`

`Last used` opens the most recently visited workbench. A fixed choice always opens that workbench in a new tab while still remembering the last-used workbench in case the user later returns to that mode.

### 7.2 Open links

Use a two-option segmented control:

- `Foreground tab` (default)
- `Background tab`

The preference applies to primary Open actions and secondary source links such as paper PDFs. Modified clicks and middle clicks retain normal browser behavior.

If background-tab creation is unavailable in a local web preview, Scout Lab falls back to a normal new tab and shows no blocking error. The installed extension must open the requested destination without changing Scout Lab's current state.

## 8. Today Queue

The user configures counts for five content groups:

- Code: 0-4, default 2
- Models: 0-4, default 1
- Datasets: 0-4, default 1
- Papers: 0-4, default 2
- Learn: 0-4, default 1

Use labeled numeric steppers. The combined total must remain between 1 and 12. Invalid totals are prevented in the control and explained inline.

Selection rules:

- Each group keeps the ranking produced by its saved workbench defaults.
- Papers alternate Community and Raw arXiv results when both are available, beginning with Community.
- Hidden items do not consume a requested slot.
- If one group cannot fill its count, Scout Lab does not silently replace it with another source; the Today status reports the shortfall.
- Changing the composition refreshes Today only when Today is active. Otherwise it applies on the next visit.

Default composition remains seven cards: 2 Code, 1 Model, 1 Dataset, 2 Papers, and 1 Learn.

## 9. Workbench Defaults

### 9.1 Current versus default filters

Scout Lab stores two layers:

- current filters: the values used during the latest session
- default filters: the values restored by `Reset filters`

Current filters continue to save automatically.

### 9.2 Save current filters

Each source workbench adds a `Save as default` command beside `Reset filters`. Today does not need this command because its topic is part of its current state and its source mix is configured in Settings.

After saving:

- show a short inline confirmation
- do not refetch because the active query has not changed
- subsequent Reset actions restore the new defaults

The Workbench defaults Settings section lists each workbench and provides:

- a concise summary of its saved defaults
- `Restore factory default` for that workbench
- `Restore all factory defaults` at the bottom of the section

Factory restoration changes default filters only. It does not clear current results, favorites, comments, progress, notes, or caches.

## 10. Data And Reset

### 10.1 Export

`Export backup` downloads:

```txt
scout-lab-backup-YYYY-MM-DD.json
```

The versioned backup contains:

- preferences
- current and default filters
- favorites, hidden states, and comments
- learning progress
- daily notes
- daily snapshots

It excludes:

- network caches
- transient loading or error state
- iCloud directory handles
- secrets or authentication data

### 10.2 Import

`Import backup` accepts one JSON file. Scout Lab validates:

- supported schema version
- expected object shapes
- allowed sections and enum values
- string and collection size limits
- safe URLs where URLs are present

Before applying the import, show a summary of the settings, annotations, progress entries, notes, and snapshots found.

Import uses merge behavior:

- imported preferences and filter defaults replace the corresponding preferences
- item annotations and progress use the entry with the newest `updatedAt`
- daily notes and snapshots replace matching dates and preserve unmatched local dates
- caches remain untouched

The user must confirm `Import backup` after reviewing the summary. Invalid files leave all existing data unchanged and show a concise inline error.

### 10.3 Reset preferences

`Reset preferences` restores theme, density, startup, opening behavior, Today composition, and workbench filter defaults. It does not delete annotations, progress, daily notes, snapshots, or the iCloud folder connection.

A confirmation dialog must state that personal learning data will be preserved.

## 11. Settings Schema

Extend the normalized settings object with a versioned preference block:

```js
{
  version: 2,
  selectedSection: 'models',
  filters: { /* current filters by workbench */ },
  filterDefaults: { /* user defaults by workbench */ },
  preferences: {
    theme: 'system',
    density: 'comfortable',
    startupSection: 'last-used',
    openLinks: 'foreground',
    todayMix: {
      code: 2,
      models: 1,
      datasets: 1,
      papers: 2,
      learn: 1
    }
  }
}
```

All reads pass through schema normalization. Unknown values fall back independently instead of invalidating the entire settings object. Existing version-one settings migrate without losing selected sections or current filters.

## 12. Architecture

Use focused modules:

```txt
src/
  settings.js                 preference schema and normalization
  services/
    backup.js                 export, validation, merge, and import
    storage.js                persistence and migration
  ui/
    settings.js               drawer and control rendering
  styles/
    app.css                   semantic theme and density tokens
```

Responsibilities:

- `settings.js` owns defaults, enums, normalization, and Today total validation.
- `storage.js` owns persisted reads, writes, and migration.
- `backup.js` owns the portable format and never accesses the DOM.
- `ui/settings.js` renders controls and emits commands; it does not implement storage rules.
- `app.js` applies settings to the shell and coordinates workbench refreshes.

Theme and density are represented through root data attributes and semantic CSS custom properties. Components do not branch on theme names.

## 13. Error Handling

- A malformed stored preference falls back only that preference.
- An invalid Today total cannot be saved.
- A failed background-tab request falls back to a normal new tab.
- A failed export reports an inline error and does not alter state.
- A failed import makes no writes.
- A failed settings write keeps the current in-memory selection and reports that it could not be saved.
- Theme changes never wait on network activity.

## 14. Accessibility And Interaction

- All settings controls have visible labels.
- Segmented controls expose pressed state.
- Numeric steppers expose source name and current value.
- The drawer traps focus while open and restores focus to Settings when closed.
- `Escape` closes the drawer unless an import confirmation is active.
- Theme palettes meet WCAG AA contrast for normal text and controls.
- System theme changes are announced visually without a page reload, not through a noisy live-region message.
- Reduced-motion system preferences are honored even though a separate control is deferred.

## 15. Verification

### 15.1 Unit tests

- version-one to version-two settings migration
- independent fallback for malformed preferences
- Today composition total and range validation
- current versus default filter behavior
- theme, density, startup, and opening enums
- backup serialization excludes cache and directory handles
- import rejects malformed, oversized, and unsupported files atomically
- annotation/progress merge by `updatedAt`

### 15.2 Integration tests

- opening and closing the Settings drawer
- immediate theme and density application
- system theme reaction
- startup selection on a fresh page
- foreground and background link behavior
- Today composition to fetch and render counts
- Save as default followed by Reset filters
- export followed by import round trip
- Reset preferences preserves learning data

### 15.3 Browser acceptance

Test light, dark, and system themes at wide desktop, compact desktop, and mobile widths. For every combination verify:

- no flash of the wrong theme
- no horizontal page or control overflow
- readable cards, tags, controls, focus rings, and archive states
- consistent one-to-four-column grid behavior
- settings drawer focus and close behavior
- all settings persist across reload
- source links open according to the configured behavior
- no console errors or new permission warnings

## 16. Acceptance Criteria

The feature is complete when:

1. Theme, density, startup, link opening, Today composition, and saved defaults work after reload.
2. Dark mode covers every surface and native control without unreadable or light-only remnants.
3. Reset filters restores user defaults; factory reset restores product defaults.
4. Today renders the requested source counts or clearly reports unavailable slots.
5. Export/import round-trips supported user data without exporting caches or iCloud handles.
6. Import validation is atomic and cannot corrupt existing local data.
7. The drawer is keyboard-accessible and responsive.
8. Existing feeds, actions, snapshots, and manual iCloud archiving continue to pass their full test suite.
