# Automatic iCloud Backup Design

**Status:** Approved for implementation
**Date:** 2026-08-29
**Product:** Scout Lab Chrome new-tab extension

## 1. Summary

Scout Lab will automatically mirror all durable application data to a user-selected iCloud Drive folder on one Mac. Browser storage remains the primary working copy, so every action stays immediate and continues to work offline. iCloud is a recoverable backup, not a second live database.

The user authorizes one folder through the existing `Choose folder` action. After connection, durable mutations schedule a debounced backup without another click while write permission remains granted. If permission expires or a write fails, Scout Lab preserves the local change, marks the backup as pending, and retries when the extension next has access.

## 2. Goals

1. Back up every durable Scout Lab record automatically after it changes.
2. Keep favorite, comment, hide, settings, note, and snapshot actions fast and local-first.
3. Survive interrupted writes with a second complete recovery file.
4. Make backup health visible without adding distracting notifications.
5. Restore only from validated data and only after explicit user confirmation.
6. Add no server, account, native helper, or Chrome manifest permission.

## 3. Non-Goals

- multi-Mac or multi-device synchronization
- record merging or conflict resolution
- CloudKit integration
- background writes after every Scout Lab page has closed
- automatic replacement of local data during startup
- backing up expiring query caches or the directory handle itself
- replacing the readable daily Markdown archive

The installed extension and the local `127.0.0.1` preview are different browser origins. Each must connect its own folder handle, and their local state is not merged.

## 4. Durable Data Contract

Automatic backup uses the existing versioned Scout Lab backup envelope and includes exactly the durable fields returned by `getDurableData()`:

- settings and saved filter defaults
- user annotations, including favorites, hidden state, comments, and Library card snapshots
- daily notes
- daily source snapshots

Query caches, transient UI state, notices, open comment editors, pending requests, and the iCloud directory handle are excluded. The existing backup validator, URL allowlist, size limit, and atomic local import behavior remain authoritative for recovery.

## 5. Folder Layout

The selected directory is the Scout Lab root:

```text
Scout Lab/
  backup/
    latest.json
    recovery.json
  daily/
    2026/
      08/
        2026-08-29.json
  archive/
    2026/
      08/
        2026-08-29.md
```

`latest.json`, `recovery.json`, and the dated JSON checkpoint contain the complete validated backup envelope. Fixed application-generated path segments prevent path traversal.

The existing `Save today` command continues to produce readable Markdown. Its implementation moves under `archive/YYYY/MM/` for consistency, but Markdown remains an explicit journal action rather than part of every automatic state write.

## 6. Connection And Permission

`Choose folder` remains a deliberate user gesture and opens `showDirectoryPicker({ mode: "readwrite" })`. Scout Lab stores the returned `FileSystemDirectoryHandle` in IndexedDB, as it does today.

At startup Scout Lab retrieves the handle and calls `queryPermission({ mode: "readwrite" })` without prompting:

- `granted`: enable automatic backup and retry pending work.
- `prompt`: show `Reconnect iCloud`; call `requestPermission()` only from that user action.
- `denied`: show `Reconnect iCloud` and retain local pending state.
- no handle: show `Choose folder`.

Connecting or reconnecting successfully triggers an immediate full backup. The extension never opens a permission prompt merely because a new tab was created.

When this feature first appears over an existing connected archive handle, missing sync metadata is treated as dirty and triggers one initial full backup. Selecting a different folder writes a full backup to the new folder and does not delete files from the previously selected folder.

## 7. Mutation And Scheduling Flow

All durable writes go through the storage service. After a successful local write, storage marks iCloud state dirty and emits one backup-needed signal. Covered mutations are:

- favorite, comment, hide, and unhide
- daily-note edits
- daily snapshot writes
- settings, current filters, and saved defaults
- preference reset
- validated backup import

The backup coordinator waits 1,000 milliseconds after the newest mutation. Repeated changes reset this debounce so typing a comment or note does not write once per character.

Only one filesystem write job may run at a time. If state changes during a write, the current immutable payload finishes and one additional job starts with the newest durable state. Jobs never run concurrently and never replace newer local state with an older payload.

The operational sync record is local-only and contains:

- `dirty`: whether local durable state is newer than the confirmed iCloud write
- `lastSavedAt`: timestamp of the last complete three-file write
- `lastAttemptAt`: timestamp of the latest attempt
- `lastError`: bounded user-safe error category, without file contents

The dirty flag is set before scheduling. It is cleared only after every required file closes successfully. A dirty record is retried on the next new tab when permission is already granted.

## 8. Filesystem Write Protocol

Each job creates one backup envelope and serializes it once. It then performs these writes sequentially:

1. `backup/recovery.json`
2. `backup/latest.json`
3. `daily/YYYY/MM/YYYY-MM-DD.json`

Each file uses `createWritable()`, writes the complete JSON string, and closes before the next write begins. The recovery file is completed first so an interrupted `latest.json` write still leaves one complete candidate. The daily file is the latest complete checkpoint for that calendar day, not an append-only event log.

A failure at any step leaves `dirty: true`. Scout Lab does not report success unless all three files close. It does not delete or truncate local durable state when a filesystem operation fails.

## 9. Status And Controls

The existing archive area becomes the compact iCloud backup status surface:

- `Saved to iCloud` when the latest job completed and local state is clean.
- `Saving` while a job is active.
- `Changes pending` when local state is dirty and an ordinary write error occurred.
- `Reconnect iCloud` when a handle exists but write permission is not granted.
- `Not connected` when no handle exists.

The status includes the last successful save time when available. `Choose folder` or `Reconnect iCloud` remains the only permission-related command. `Save today` remains available for the readable Markdown journal and does not replace automatic JSON backup.

Failures use concise messages and never expose stack traces, filesystem internals, or personal file contents. Local actions never wait for the status animation or filesystem completion.

## 10. Restore

Settings adds `Restore latest iCloud backup` when a handle is connected and readable. Restore is always explicit:

1. Read both `backup/latest.json` and `backup/recovery.json` when present.
2. Parse and validate each with the existing backup parser.
3. Select the valid candidate with the newest `exportedAt` value.
4. Show the existing import summary and require confirmation.
5. Apply data through the existing atomic import path.
6. Mark the resulting local state dirty and write a fresh automatic backup.

If neither candidate validates, local data remains untouched and Settings reports that no valid iCloud backup was found. Scout Lab never restores automatically during startup.

## 11. Error Handling

- Permission loss: keep local state, show `Reconnect iCloud`, retry only after a user gesture restores access.
- Folder unavailable or iCloud temporarily offline: keep `Changes pending` and retry on the next mutation or startup.
- Page closes during a write: local dirty state remains; the next page retries.
- Serialization or size validation failure: keep local state, show a bounded backup error, and do not write an invalid file.
- One invalid recovery candidate: use the other candidate if it validates.
- Both candidates invalid or missing: do not modify local data.

## 12. Security And Privacy

- All data stays in the browser profile and the user-selected local/iCloud folder.
- No durable content is transmitted to a Scout Lab server or third party.
- Paths and filenames are fixed application values plus validated `YYYY-MM-DD` segments.
- Imported URLs continue to use the existing source-host allowlist.
- No secrets, credentials, browser history, or filesystem paths are added to backup content.
- The directory handle remains in IndexedDB and is not included in export files.

## 13. Testing

Unit tests cover debounce, dirty-state transitions, immutable payload capture, serialized jobs, retry behavior, and status mapping.

Filesystem integration tests use deterministic fake directory and file handles to verify folder creation, write order, complete file closure, permission loss, partial failure, and newest-valid restore selection.

Backup tests verify that automatic files preserve every durable field, exclude caches and handles, enforce the current size boundary, and reject unsafe Library URLs.

Playwright tests cover connect, automatic save after representative mutations, coalesced note typing, visible status changes, reload retry, reconnect behavior, explicit restore confirmation, and unchanged local data after invalid recovery files. Desktop and mobile layouts must remain overflow-free.

Manual Chrome acceptance verifies the installed extension against an actual iCloud Drive folder because the local preview has a different origin and folder permission.

## 14. Acceptance Criteria

- A local durable change is visible immediately and schedules backup without clicking `Save today`.
- Rapid changes produce one serialized backup job after the debounce interval.
- Every successful job writes complete `recovery.json`, `latest.json`, and dated JSON files in order.
- All durable data round-trips through the automatic backup and explicit restore path.
- Caches, directory handles, and transient UI state never enter the backup.
- A write or permission failure never loses or rolls back local data.
- Dirty changes retry automatically when permission remains granted.
- Permission prompts occur only after `Choose folder` or `Reconnect iCloud` user actions.
- Status accurately distinguishes saved, saving, pending, reconnect-required, and disconnected states.
- Restore selects the newest valid complete candidate and never applies invalid data.
- The installed extension can write to a user-selected iCloud Drive folder without new manifest permissions.
