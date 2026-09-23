# Changelog

Mirrors the in-app changelog (Settings > Changelog). Newest first.

## v6.44 - Import search box
- Fixed: after an import the Issues search box was not cleared. The code cleared
  an element named `searchIssues`, but the box is `searchIssue`, so a term typed
  beforehand kept filtering the newly imported issues out of view - the exact
  symptom the surrounding code was written to prevent.
- Found by a new repository check that cross-references every `getElementById`
  target against the ids present in the markup. A wrong id fails silently in
  JavaScript, so nothing else would have caught it.

## v6.43 - Data file storage
- Added **Connect data file**. Data is kept in a real file on disk and every
  change is written straight to it, so it no longer depends on browser storage.
- Reconnects and reloads from the file automatically on open.
- Connecting to a file that already holds data asks whether to load or overwrite,
  so pointing it at an existing export is a safe recovery route.
- File indicator beside the version number; red if a write fails.
- Save & verify confirms the file write and treats it as authoritative.

## v6.42 - Save & verify
- Added **Save & verify**: saves, forces the database write out, then reads both
  copies back and counts the records to prove they were kept.
- Reports each store separately so a partial failure stays visible.
- Renamed **Save Data** to **Export to file** - it wrote a file to disk and never
  touched browser storage, so its name meant the opposite of what it did.

## v6.41 - Verified saves
- Saves are no longer assumed to work. A browser can accept a write and silently
  discard it; every save now reads the value back and confirms it stayed.
- Storage is tested at start-up, with a banner if writes do not survive.
- After an import the pending database write is flushed immediately, and the
  result states whether the data was saved or only loaded into the page.

## v6.40 - Import preview
- Imports show a preview first: saved date, originating version, counts, archived
  records, and the first few records by name.
- Replace and Add alongside are radio options stating the outcome of each.
- A file with no projects or issues is flagged and Import is disabled.
- Nothing is committed until the dialog is accepted.

## v6.39 - Import prompt
- The replace/merge question is only asked when there is existing data to replace.
- Uses the app's own dialog rather than a raw browser prompt.

## v6.38 - file:// storage scoping
- An empty tracker opened from a file now explains that local files are scoped to
  their exact filename in some browsers, so each build gets its own storage.

## v6.37 - Load and import fixes
- Saved data is written in two shapes - bare state, and wrapped as
  `{ savedAt, data }`. Several readers understood only one and saw no projects.
- Imports never brought records up to the current schema, and imported settings
  replaced the status registry, so rows carried unresolvable statuses and the
  table rendered empty.
- Imports now normalise, rebuild the status tables, snapshot first, clear stale
  filters, switch to Projects and report counts.
- Start-up looks for data under an earlier storage key and adopts the most recent.

## v6.36 - Responsive toolbar
- The Kanban toolbar is a single row at every width: it never wraps, never clips.
- Give-way order: heading strapline, heading, search box, filter dropdowns, then
  button labels, which collapse to a glyph with a tooltip.

## v6.35 - Toolbar consolidation
- Fixed an overflow between roughly 900px and 960px that clipped the All Owners
  filter off the right edge.
- Replaced the five stacked style blocks left by v6.30-6.34 with one.

## v6.29 - Scroll performance
- Row hover was animated, starting a transition on every cell of a row.
- The hover handler ran on every cell passed over and searched the table twice
  each time; it now caches the highlighted group.
- The clamp routine interleaved reads and writes, forcing roughly 400 layouts on
  a 200-row table. Now batched: two layouts regardless of row count.
- Only the visible table is rebuilt.

## v6.28 - Sub-task nesting
- A project can be moved under another project, and an issue under another issue.
- Sub-tasks can be promoted back to the top level.
- A record that still has sub-tasks cannot be nested, since only one level of
  nesting is supported.
- A snapshot is taken before each conversion.

Earlier releases are in the in-app changelog under Settings > Changelog.
