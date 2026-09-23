# Architecture

## Shape of the file

`project-tracker.html` is one document containing the markup, twelve `<script>`
blocks and a series of `<style>` blocks. There is no build step: what you edit
is what runs.

Rough order within the file:

1. **Markup** - header, the four pages (`pageProjects`, `pageIssues`,
   `pageKanban`, `settingsBack`), modals, toast.
2. **Constants and helpers** - storage keys, status registry defaults, `esc()`,
   date formatting.
3. **Storage** - `load()`, `save()`, IndexedDB wrappers, the data-file engine.
4. **State and rendering** - `state`, `render()`, `renderTable()`,
   `renderIssuesTable()`, `renderKanban()`.
5. **Event wiring** - delegated handlers on each table body.
6. **Settings** - panels, themes, backups, CSV, Jira sync, changelog data.
7. **Styles** - a base sheet plus one appended block per release.

### On the appended style blocks

Each release appends a `<style>` block rather than editing earlier rules, so the
cascade carries its own history and any rule can be traced to a version. This is
deliberate but it accumulates: v6.30-6.34 left five blocks that contradicted each
other, and v6.35 had to collapse them into one. **When a block starts fighting an
earlier one, consolidate rather than appending a sixth.**

## State

```js
state = {
  projects: [ { id, client, name, description, comments, rag, owner,
                requested, due, jira, archived, priority, subtasks: [] } ],
  issues:   [ { id, client, title, description, comments, status, severity,
                environment, owner, reporter, reported, resolved, zendesk,
                jira, projectId, archived, priority, subtasks: [] } ],
  settings: { views, activeViewId, projectStatuses, issueStatuses,
              categories, zendeskBaseUrl, jiraBaseUrl, jiraJql, ... },
  currentPage, openRows, openIssueRows, savedAt, schemaVersion
}
```

Only **one level of nesting** is supported. `subtasks` entries never have their
own `subtasks`. Any code that nests a record must refuse when that record already
has children - flattening or discarding them silently loses work. See
`nestTopLevel()`.

### Priorities are per client

Each client is numbered from 1 independently, and rows sort by client first
(`byClientThenPriority`). Anything that moves a record between clients must
renumber both groups: `renumberClient()` on the old client and
`nextPriorityFor()` on the new one. Dragging across clients is refused rather
than renumbering two groups silently.

### Schema changes

`normaliseState()` is the single upgrade path. Every reader - the localStorage
cache, the IndexedDB copy, an imported file, a restored snapshot, a connected
data file - goes through it, so a new field needs seeding in exactly one place.
`STORAGE_KEY` carries a schema number; bumping it orphans existing data, which
is why `load()` falls back to scanning for older tracker keys.

### Statuses are configurable

`RAG_ORDER`, `RAG_LABEL`, `ISTATUS_ORDER` and `ISTATUS_LABEL` are **derived**
from `state.settings.*Statuses` by `rebuildStatusConstants()`. Anything that
replaces `state.settings` must call it afterwards, or rows carry statuses the
app cannot resolve and tables render empty. This was the v6.37 import bug.

Behaviour comes from category **flags** (`terminal`, `countsComplete`,
`aggregate`, `rowStyle`), never from a category's name. Comparing against the
literal strings "done" or "waiting" is how renaming a category used to break row
styling and the progress bars.

## Storage, in order of authority

**1. Connected data file.** A real file on disk via the File System Access API.
Writes debounced 400ms and never overlapped (`fileWriting` guard). The handle is
kept in IndexedDB so it reopens silently. Chromium only.

**2. IndexedDB.** Primary in-browser store. Writes debounced 150ms, flushed on
`pagehide`, `beforeunload` and `visibilitychange`.

**3. localStorage.** A synchronous cache so start-up paints without awaiting
anything.

### Two payload shapes

`save()` writes `state` directly to localStorage. IndexedDB, snapshots and JSON
exports wrap it as `{ savedAt, schemaVersion, appVersion, data }`. Anything
reading saved data must handle both - `unwrapSaved()` exists for this. Getting it
wrong shows an empty tracker while the data sits intact on disk.

### Writes are verified, not assumed

`setItem()` returning without throwing does **not** mean the value survived. In a
private window, with site data blocked, or on some `file://` pages, the write is
accepted and discarded. Every save reads the value back and compares. Preserve
this property in any new storage code.

## Rendering

`render()` rebuilds only the visible page; hidden tables set a pending flag
(`pendingProjectTable` / `pendingIssueTable`) and are built on page switch via
`flushPendingTables()`.

Two performance rules worth preserving:

- **Never interleave DOM reads and writes in a loop.** Reading a height after a
  write forces a full re-layout. `wrapAndMeasure()` is write-all, read-all,
  write-all - two layouts regardless of row count. Interleaved, a 200-row table
  cost roughly 400.
- **Do not animate per-row properties.** Hover was transitioning the background
  of every cell, so moving the pointer while scrolling animated hundreds of
  elements at once.

Table bodies use delegated listeners keyed on `data-*` attributes
(`data-editsub="pid|sid"`). A new row action needs three things: the attribute in
the row template, the selector added to the `closest()` list, and a branch in the
action handler. Miss the selector and the button silently does nothing.

## Things that fail silently

The recurring theme in this codebase's bug history. None of these throw:

- A mistyped `getElementById` id returns `null`, and the usual `if (el)` guard
  skips the work. This is the v6.44 import bug. `tools/check.js` now checks it.
- A status id that no longer resolves renders an empty table rather than erroring.
- An accepted-then-discarded storage write looks identical to a successful one.
- A `data-*` action with no matching selector is simply never dispatched.
