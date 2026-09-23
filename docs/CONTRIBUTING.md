# Contributing

## Making a change

1. Branch: `git checkout -b fix/kanban-toolbar`
2. Edit `project-tracker.html`.
3. Bump the version in **all three** places (below).
4. Add a `CHANGELOG.md` entry and a matching in-app changelog entry.
5. `node tools\check.js`
6. Test in the browser (below).
7. Commit, push, open a PR.

## The three version locations

```js
const APP_VERSION = "6.44";                     // constant
```
```html
<span class="ver-badge" id="verBadge" ...>v6.44</span>
```
```js
{ v: "6.44", tag: "fixes", items: [ ... ] }     // top of the in-app changelog
```

`tag` is one of `feature`, `fixes`, `performance`, `interface`, `storage`.
`tools\check.js` fails if the three disagree.

## Checks before pushing

```powershell
node tools\check.js
```

It verifies that every script block parses, the three versions agree, every
`getElementById` target exists, no `\uXXXX` escapes leaked into the markup,
storage writes are still read back, and destructive paths still snapshot first.

Then, in the browser:

- Open the file and confirm your data loads
- **Settings > Data > Save & verify** reports green
- Reload - data survives
- Exercise what you changed on both Projects and Issues
- Drag the window narrow and wide if you touched layout

The checks catch what fails silently; the browser catches the rest.

## Writing the changelog

Entries are read by whoever hits the bug next. State **what was wrong and why**:

> Fixed: the All Owners filter wrapped onto a second line. The search box was
> holding a 200px minimum and refusing to give any of it up, so once the heading
> and buttons had taken their share there was no room for the last select.

Not:

> Fixed toolbar layout issue.

## Conventions worth keeping

- **Comment the reasoning, not the mechanics.** Note why a guard exists and what
  breaks without it.
- **Consolidate fighting style blocks** rather than appending another.
- **Verify storage writes** by reading them back.
- **Batch DOM reads and writes** separately.
- **Snapshot before anything destructive** (`await pushBackup()`).
- **One level of sub-task nesting**, enforced at the point of nesting.
- **Call `rebuildStatusConstants()`** after replacing `state.settings`.

## Commits

```
fix(import): clear the Issues search box after importing
feat(storage): connect data file for browsers that discard storage
perf(table): batch clamp measurement into two layouts
docs(readme): explain file:// storage scoping
```

## Releasing

```powershell
git tag -a v6.44 -m "v6.44 - import search box fix"
git push origin v6.44
```

Attach `project-tracker.html` to the GitHub release so it can be downloaded
directly.
