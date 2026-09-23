# Project Tracker

A single-file client project and production issue tracker for SGX FX. The
entire application - markup, styles and logic - lives in one HTML file with no
build step, no dependencies and no server. Open it in a browser and it runs.

| Path | Purpose |
|---|---|
| `project-tracker.html` | The application. The only file that ships. |
| `CHANGELOG.md` | Release history. Mirrors the in-app changelog. |
| `docs/ARCHITECTURE.md` | File layout, state model, storage model. |
| `docs/CONTRIBUTING.md` | How to make and release a change. |
| `tools/check.js` | Pre-commit checks. |

## Running it

Open `project-tracker.html` in Chrome or Edge.

For day-to-day use, serve it over HTTP rather than opening it from disk:

```powershell
python -m http.server 8080
# then open http://localhost:8080/project-tracker.html
```

This matters. A page opened as `file:///...` has no real origin, and browsers
scope its storage to the exact filename - so a renamed or re-downloaded copy
opens empty, and some configurations discard its storage entirely. Serving over
`localhost` gives every version one stable origin.

## Storage

Three layers, in descending order of authority:

1. **Connected data file** - a real JSON file on disk, written on every change
   via the File System Access API. Independent of browser storage. Chromium
   only. Set it up in **Settings > Data > Connect data file**. This is the
   reliable option.
2. **IndexedDB** - primary in-browser store, not bound by the localStorage quota.
3. **localStorage** - a synchronous cache so start-up needs no async work.

Every write is read back and verified; a browser that accepts a write and
silently discards it is detected and reported rather than assumed to have
worked. **Settings > Data > Save & verify** checks all three on demand.

## Features

- Projects and production issues, each with one level of sub-tasks
- Records can be nested under another record, or promoted back out
- Kanban board with drag-to-update status
- Configurable status registry, categories and column views
- CSV import/export; JSON import with a preview before committing
- Local snapshots at open and every 15 minutes
- Jira status sync by CSV, and Zendesk ticket linking
- Light and dark themes with customisable colours

## Versioning

The version appears in three places, which must agree: the `APP_VERSION`
constant, the header badge, and the top entry of the in-app changelog.
`tools/check.js` enforces this. Tag each release `v6.44` and so on.

## Licence

Internal SGX FX tool. Not for distribution outside the organisation.
