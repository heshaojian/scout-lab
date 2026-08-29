# Browser Acceptance Matrix

Use this matrix for release verification in the unpacked Chrome extension or the local extension preview. Record evidence in the pull request; do not mark a case passed from unit-test results alone.

## Environments

Run the affected cases in each supported viewport:

| Viewport | Size |
| --- | --- |
| Wide desktop | 1440 x 900 |
| Compact desktop | 900 x 900 |
| Mobile | 390 x 844 |

For theme or layout changes, repeat the affected cases with System, Light, and Dark themes and Comfortable and Compact density.

## Shell And Navigation

- [ ] Today, Code, Models, Datasets, Papers, and Learn tabs open the correct workbench.
- [ ] The active tab, page title, source label, filters, and grid update together.
- [ ] Search filters the current cards and clearing search restores them.
- [ ] Reset filters restores the saved defaults for the current workbench.
- [ ] Save as default persists current filters after reload.
- [ ] Refresh fetches the active query without showing cards from the previous query.
- [ ] Settings opens, traps focus, closes with its button and Escape, and restores focus.
- [ ] No unexpected horizontal page overflow, clipped controls, overlapping text, or layout shift appears.
- [ ] Keyboard navigation reaches every interactive control with a visible focus state.

## Source Workbenches

- [ ] Today honors its configured source counts and labels unavailable slots clearly.
- [ ] Code time range, language, sort, topic, and search controls change the visible query meaning.
- [ ] Code cards show repository identity, description, language, total stars, period stars, and destination link.
- [ ] Models task, library, sort, access, topic, and search controls work and metrics are labeled correctly.
- [ ] Datasets task, size, sort, access, topic, and search controls work and metrics are labeled correctly.
- [ ] Papers source mode, category, time, sort, topic, and search controls work.
- [ ] Papers switch correctly between community papers and raw arXiv entries.
- [ ] Learn category, level, progress, topic, and search controls work.
- [ ] Learn progress changes persist and Resume opens the selected resource.

## Card Actions And Links

- [ ] Clicking a card destination opens the expected source URL.
- [ ] Foreground link mode opens in the current tab.
- [ ] Background link mode requests a background tab without changing the current page.
- [ ] Favorite toggles immediately and persists after reload.
- [ ] Hide removes the card, persists after reload, and can be restored through the hidden-items flow.
- [ ] Comment creates, edits, and removes a note without changing the source content.
- [ ] Card actions remain usable on desktop, compact desktop, and mobile.

## Settings And Persistence

- [ ] Theme changes immediately; System follows the operating-system theme without reload.
- [ ] No wrong-theme flash appears during startup.
- [ ] Density changes the grid and control spacing without clipping content.
- [ ] Startup workbench opens on a fresh page and persists after reload.
- [ ] Today composition steppers enforce their minimum, maximum, and total constraints.
- [ ] Reset preferences restores product defaults while preserving favorites, hidden items, comments, progress, and snapshots.
- [ ] Export downloads valid JSON without caches or an iCloud directory handle.
- [ ] Import rejects malformed, oversized, or unsupported files without partial writes.
- [ ] Export then import round-trips supported preferences and learning data.

## Archive And Resilience

- [ ] Connect archive folder requires an explicit user gesture.
- [ ] Save today writes readable Markdown with source-specific fields to the selected folder.
- [ ] Cached content renders before a successful refresh when available.
- [ ] Empty, stale, network-error, and parser-fallback states are understandable and preserve usable cached content.
- [ ] A partial Today source failure does not hide successful source results.
- [ ] No Scout Lab console errors, failed local assets, or new extension permission warnings appear.

## Destination Spot Check

Open at least one visible destination from each source and confirm the page resolves to the same item shown on the card:

- [ ] GitHub repository
- [ ] Hugging Face model
- [ ] Hugging Face dataset
- [ ] Hugging Face paper or arXiv abstract
- [ ] Curated learning resource
