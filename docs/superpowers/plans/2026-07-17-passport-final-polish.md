# Passport Comparison Final Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove obsolete code, strengthen comparison-card hierarchy, simplify copy, add a complete single-passport destination browser, and normalize desktop/mobile spacing in the self-contained passport page.

**Architecture:** Keep the embedded 199-row dataset and active pure helpers inside `index.html`. Render the new browser from the same access and annotation functions used by search and comparisons, while the Node VM suite verifies pure markup and structural behavior. Preserve the offline single-file application.

**Tech Stack:** Semantic HTML, embedded CSS, vanilla JavaScript, Node.js `node:test`, Safari Computer Use.

## Global Constraints

- Keep one offline `index.html` with no external scripts, fonts, images, or network requests.
- Preserve all 199 Passport Index destination rows and the four published mobility scores.
- Keep all six direct passport comparisons visible.
- Preserve exact raw access labels and stay lengths.
- Keep factual visa-free/ETA and visa-on-arrival fee notes.
- Do not include personal or family context.
- Keep controls at least 44 pixels tall, visible focus styles, and reduced-motion behavior.
- Keep comparison cards one column on mobile and two columns on desktop.

---

### Task 1: Remove dead and redundant code

**Files:**
- Modify: `index.html` CSS and application exports
- Test: `tests/passport-dashboard.test.cjs`

**Interfaces:**
- Consumes: the current active application and test suite.
- Produces: a smaller application retaining `accessWeight`, `accessMode`, `summarizePassport`, `summarizePassportModes`, `findDestination`, `comparePassports`, and active render helpers.

- [ ] **Step 1: Add a failing dead-code test**

```js
test('superseded helpers and unused styles are absent', () => {
  const { html, api } = loadPage();
  assert.equal(api.compareEntries, undefined);
  assert.equal(api.rowOutcome, undefined);
  assert.equal(api.classifyEntry, undefined);
  assert.doesNotMatch(html, /body::before|\.sr-only\s*\{/);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test --test-name-pattern='superseded helpers' tests/passport-dashboard.test.cjs`

Expected: FAIL because retained helpers and selectors still exist.

- [ ] **Step 3: Remove obsolete functions, exports, selectors, and their obsolete tests**

Delete `classifyEntry`, `compareEntries`, `rowOutcome`, `body::before`, and `.sr-only`. Remove tests that exercise only those deleted helpers. Consolidate duplicate `.destination-results` and `.destination-result` declarations without changing rendered behavior.

- [ ] **Step 4: Run the complete suite**

Run: `node --test tests/passport-dashboard.test.cjs && git diff --check`

Expected: all remaining and new tests pass with no whitespace errors.

- [ ] **Step 5: Commit cleanup**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "refactor: remove obsolete passport code"
```

---

### Task 2: Strengthen comparison-card visual hierarchy

**Files:**
- Modify: `index.html` comparison CSS and `comparisonCardMarkup`
- Test: `tests/passport-dashboard.test.cjs`

**Interfaces:**
- Consumes: `comparePassports(data, leftCode, rightCode)` and `comparisonRowsMarkup`.
- Produces: comparison cards containing `.metric-tile`, `.unique-header`, `.unique-eyebrow`, and `.unique-count` elements.

- [ ] **Step 1: Add failing markup and responsive-style tests**

```js
test('comparison markup separates metrics, passport headers, and destination rows', () => {
  const { api } = loadPage();
  const markup = api.comparisonCardMarkup({ id: 'al-gr', left: 'al', right: 'gr' });
  assert.equal((markup.match(/class="metric-tile/g) || []).length, 2);
  assert.equal((markup.match(/class="unique-header/g) || []).length, 2);
  assert.match(markup, /unique-eyebrow">Unique access/);
  assert.match(markup, /unique-count">1 destination/);
});
```

Also assert CSS defines distinct positive and negative metric accents and a tinted unique header.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --test --test-name-pattern='comparison markup separates' tests/passport-dashboard.test.cjs`

Expected: FAIL because the new hierarchy classes are absent.

- [ ] **Step 3: Implement the new comparison hierarchy**

Render shared counts as:

```html
<div class="metric-tile metric-positive"><strong>107</strong><span>Positive on both</span></div>
<div class="metric-tile metric-negative"><strong>37</strong><span>Negative on both</span></div>
```

Render each unique section header as:

```html
<header class="unique-header">
  <div><span class="unique-eyebrow">Unique access</span><h4>Albania</h4></div>
  <span class="unique-count">1 destination</span>
</header>
```

Use restrained green/red accents, a tinted header surface, stronger borders, and compact spacing. Preserve exact destination rows and desktop-only bounded list scrolling.

- [ ] **Step 4: Run the full suite and inspect generated markup**

Run: `node --test tests/passport-dashboard.test.cjs && git diff --check`

Expected: all tests pass.

- [ ] **Step 5: Commit hierarchy changes**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "style: clarify passport comparison hierarchy"
```

---

### Task 3: Simplify content and section descriptions

**Files:**
- Modify: `index.html` hero, search, overview, comparison, and note copy
- Test: `tests/passport-dashboard.test.cjs`

**Interfaces:**
- Consumes: the existing semantic page structure.
- Produces: short factual descriptions from the approved design.

- [ ] **Step 1: Add a failing content test**

```js
assert.match(html, /Search entry requirements and compare four passports across 199 destinations\./);
assert.match(html, /See the entry status for every passport\./);
assert.match(html, /Access totals for each passport\./);
assert.match(html, /Destinations available to only one of the two passports\./);
assert.doesNotMatch(html, /recalculated|simplified model|shared access stays condensed|switching views/);
```

- [ ] **Step 2: Run the content test and verify failure**

Run: `node --test --test-name-pattern='content is concise' tests/passport-dashboard.test.cjs`

Expected: FAIL while explanatory legacy copy remains.

- [ ] **Step 3: Replace descriptions with approved factual copy**

Keep the two factual fee notes as separate short rows. Do not change the source or travel warning.

- [ ] **Step 4: Run the full suite**

Run: `node --test tests/passport-dashboard.test.cjs && git diff --check`

Expected: all tests pass.

- [ ] **Step 5: Commit content cleanup**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "copy: simplify passport descriptions"
```

---

### Task 4: Add the single-passport destination browser

**Files:**
- Modify: `index.html` markup, browser CSS, pure markup helper, and initialization
- Test: `tests/passport-dashboard.test.cjs`

**Interfaces:**
- Consumes: `PASSPORTS`, `DESTINATIONS`, `accessWeight`, `accessMode`, `modeLabel`, and `escapeHtml`.
- Produces: `passportBrowserMarkup(data, passportCode): string`, four `.passport-choice` buttons, and `#passport-browser-results` with 199 rows.

- [ ] **Step 1: Add failing pure-helper and structural tests**

```js
test('passport browser renders every destination for one selected passport', () => {
  const { api } = loadPage();
  const markup = api.passportBrowserMarkup(api.DESTINATIONS, 'al');
  assert.equal((markup.match(/class="passport-browser-row"/g) || []).length, 199);
  assert.match(markup, /AFGHANISTAN/);
  assert.match(markup, /ZIMBABWE/);
  assert.match(markup, /rank-pill negative">Negative/);
  assert.match(markup, /EVISA/);
});
```

Static structure must include `id="passport-browser"`, four buttons with `data-passport`, Albania with `aria-pressed="true"`, and the results host.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --test --test-name-pattern='passport browser' tests/passport-dashboard.test.cjs`

Expected: FAIL because the browser helper and markup do not exist.

- [ ] **Step 3: Implement pure browser markup**

```js
function passportBrowserMarkup(data, passportCode) {
  return data.map((row) => {
    const entry = row[passportCode];
    const rank = accessWeight(entry);
    const mode = accessMode(entry);
    return `<article class="passport-browser-row">...</article>`;
  }).join('');
}
```

Each row includes destination, exact raw status, rank pill, and practical mode pill.

- [ ] **Step 4: Add selection controls and event handling**

Render four real buttons. On click, update all `aria-pressed` states and rerender `#passport-browser-results` for the selected code. Initialize with Albania and 199 rows.

- [ ] **Step 5: Style desktop and mobile results**

Desktop rows use stable destination, status, rank, and mode columns. Mobile rows stack metadata under the destination. The list remains fully rendered, unpaginated, and uncapped.

- [ ] **Step 6: Run the complete suite**

Run: `node --test tests/passport-dashboard.test.cjs && git diff --check`

Expected: all tests pass.

- [ ] **Step 7: Commit the feature**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "feat: add single-passport destination browser"
```

---

### Task 5: Normalize spacing and verify both viewports

**Files:**
- Modify if defects are found: `index.html`, `tests/passport-dashboard.test.cjs`

**Interfaces:**
- Consumes: the finished page.
- Produces: desktop/mobile verified spacing and interaction behavior.

- [ ] **Step 1: Add static spacing safeguards**

Assert one shared section spacing custom property or consistent section-padding declaration, no large fixed empty spacer, no horizontal overflow rule regression, and 44-pixel controls.

- [ ] **Step 2: Run the complete automated verification**

Run: `node --test tests/passport-dashboard.test.cjs && git diff --check && git status --short`

Expected: all tests pass and the feature worktree is clean after commits.

- [ ] **Step 3: Verify in Safari with Computer Use**

At desktop width, inspect the complete page, metric tiles, unique headers, two-column comparison grid, passport browser, and footer spacing. Select all four passports and verify each list shows 199 rows. Search a destination and verify exact source labels.

Resize Safari to a narrow mobile width. Verify comparison hierarchy, natural list flow, segmented control wrapping, stacked passport rows, focus states, and absence of horizontal overflow.

- [ ] **Step 4: Fix discovered defects with regression tests first**

For each defect, add a failing static or pure-helper test, verify failure, implement the smallest correction, and rerun the full suite.

- [ ] **Step 5: Request independent final review**

Review the complete feature range against `docs/superpowers/specs/2026-07-17-passport-final-polish-design.md`. Fix every Critical and Important issue before integration.

- [ ] **Step 6: Merge locally and verify the delivered path**

Merge the feature branch into `master`, run the complete suite from `/Users/miloakil/Documents/VISA`, open `/Users/miloakil/Documents/VISA/index.html` in Safari, remove the owned worktree, and delete the merged feature branch.

---

### Task 6: Publish the verified page to GitHub

**Files:**
- No additional source changes expected

**Interfaces:**
- Consumes: the verified `master` branch and `https://github.com/itsrenoria/index.git`.
- Produces: a non-force push to the repository's default publishing branch.

- [ ] **Step 1: Verify GitHub tooling and repository state**

Run:

```bash
gh --version
gh auth status
git status --short
git ls-remote --symref https://github.com/itsrenoria/index.git HEAD
```

Expected: GitHub authentication is valid, only the pre-existing root `.DS_Store` remains untracked, and the remote default branch or empty-repository state is known.

- [ ] **Step 2: Configure and fetch the requested remote**

If `origin` is absent, add it with:

```bash
git remote add origin https://github.com/itsrenoria/index.git
git fetch origin
```

If `origin` already exists, confirm it points to the requested URL before fetching. Do not replace an unrelated remote without reporting it.

- [ ] **Step 3: Preserve remote history and push without force**

For an empty repository, push the verified local branch as `main`:

```bash
git push -u origin master:main
```

For an existing repository, fetch its default branch, confirm the local history can be integrated without discarding remote commits, then push the verified result to that default branch. Never use `--force`.

- [ ] **Step 4: Verify the published commit**

Confirm the remote branch SHA matches the local delivered commit and inspect repository Pages configuration with `gh api repos/itsrenoria/index/pages` when available. Report whether GitHub Pages is already active or still needs to be enabled in repository settings.
