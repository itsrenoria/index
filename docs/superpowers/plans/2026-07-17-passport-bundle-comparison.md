# Passport Bundle Comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fine-grained passport ranking with a binary positive/negative access model and a mobile-first interface centered on eight Albanian-base bundle scenarios.

**Architecture:** Keep the retrieved 199-destination dataset embedded in `index.html`. Pure functions classify entries, calculate passport and bundle access, partition scenarios, and drive one focused scenario view plus a secondary destination lookup; Node VM tests verify the same functions used by the browser.

**Tech Stack:** Semantic HTML, embedded CSS, vanilla JavaScript, Node.js built-in `node:test`, `assert`, and `vm`, Safari Computer Use for visual and interaction verification.

## Global Constraints

- Deliver one self-contained `index.html` with no build step, framework, external dependency, external font, or runtime network request.
- Treat home, visa-free, visa on arrival, ETA/eVisitor, and lightweight registration as equal positive access.
- Treat eVisa, visa required, not admitted, and unknown labels as equal negative access.
- Display exact source labels and stated stay lengths without using them for ranking.
- Use Albania as the shared baseline without mentioning personal or family context.
- Preserve all 199 retrieved Passport Index destinations and the four published Passport Index scores as secondary reference metrics.
- Design for a 360-pixel mobile viewport first and never rely on color alone.

---

### Task 1: Replace the ranking model with binary access weights

**Files:**
- Modify: `tests/passport-dashboard.test.cjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: normalized entries shaped as `{ raw, type, days }`.
- Produces: `accessWeight(entry): "positive" | "negative"` and `compareEntries(a,b): -1 | 0 | 1`.

- [ ] **Step 1: Replace the old ranking assertions with failing binary-model tests**

Add tests equivalent to:

```js
assert.equal(api.compareEntries({ type: 'visa-free', days: 30 }, { type: 'eta', days: 180 }), 0);
assert.equal(api.compareEntries({ type: 'visa-on-arrival', days: 7 }, { type: 'visa-free', days: 360 }), 0);
assert.equal(api.compareEntries({ type: 'evisa', days: null }, { type: 'visa-required', days: null }), 0);
assert.equal(api.compareEntries({ type: 'eta', days: 30 }, { type: 'evisa', days: null }), 1);
assert.equal(api.accessWeight({ type: 'registration' }), 'positive');
assert.equal(api.accessWeight({ type: 'not-admitted' }), 'negative');
```

- [ ] **Step 2: Run the tests and confirm the old duration/type ranking fails**

Run: `node --test tests/passport-dashboard.test.cjs`

Expected: FAIL because visa-free currently outranks ETA and longer stays currently break ties.

- [ ] **Step 3: Implement the binary model**

Define a positive type set and make `compareEntries` compare only `accessWeight`. Remove `TYPE_RANK` and all duration-based ranking.

- [ ] **Step 4: Run the complete test file**

Run: `node --test tests/passport-dashboard.test.cjs`

Expected: binary-model tests PASS; obsolete UI tests may still fail until Task 3, but no engine regression is allowed.

- [ ] **Step 5: Commit the access model**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "refactor: simplify passport access weights"
```

### Task 2: Add bundle and scenario calculations with TDD

**Files:**
- Modify: `tests/passport-dashboard.test.cjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: destination rows, passport code arrays, and binary access weights.
- Produces: `bundleAccess(row,codes)`, `compareBundles(row,left,right)`, `buildScenario(data,definition)`, `summarizePassport(data,code)`, and `SCENARIOS`.

- [ ] **Step 1: Add failing bundle tests**

Assert the wished-for API:

```js
assert.equal(api.bundleAccess(azerbaijan, ['al']), 'positive');
assert.equal(api.bundleAccess(angola, ['al']), 'negative');
assert.equal(api.bundleAccess(angola, ['al', 'gr']), 'positive');
assert.equal(api.summarizePassport(api.DESTINATIONS, 'al').total, 199);
```

Also assert that adding a passport never reduces the positive count.

- [ ] **Step 2: Add failing scenario-partition tests**

For every entry in `SCENARIOS`, assert:

```js
const result = api.buildScenario(api.DESTINATIONS, definition);
assert.equal(result.rightAdds.length + result.leftKeeps.length + result.bothCover.length + result.neitherCovers.length, 199);
assert.equal(new Set([...result.rightAdds, ...result.leftKeeps, ...result.bothCover, ...result.neitherCovers].map(x => x.destination)).size, 199);
```

Assert the eight exact left/right bundle definitions from the design spec.

- [ ] **Step 3: Run tests and confirm the new API is missing**

Run: `node --test tests/passport-dashboard.test.cjs`

Expected: FAIL with missing bundle/scenario functions.

- [ ] **Step 4: Implement minimal bundle and scenario functions**

Use `Array.prototype.some` for bundle union access and partition each destination into exactly one named scenario array. Calculate `combinedPositive` for upgrade definitions from the union of both sides.

- [ ] **Step 5: Run all engine tests**

Run: `node --test tests/passport-dashboard.test.cjs`

Expected: all binary, bundle, scenario, and data-coverage tests PASS.

- [ ] **Step 6: Commit the scenario engine**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "feat: add passport bundle scenarios"
```

### Task 3: Replace the dashboard with the mobile-first scenario interface

**Files:**
- Modify: `tests/passport-dashboard.test.cjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: passport summaries, scenario definitions, scenario partitions, and destination rows.
- Produces: passport cards, native scenario selector, featured scenario card, expandable outcome lists, and destination lookup.

- [ ] **Step 1: Replace obsolete static UI assertions with failing mobile-interface checks**

Assert `index.html` contains:

```js
assert.match(html, /id="passport-cards"/);
assert.match(html, /<label for="scenario-select">/);
assert.match(html, /id="scenario-view"/);
assert.match(html, /id="right-adds-list"/);
assert.match(html, /id="left-keeps-list"/);
assert.match(html, /<details[^>]*id="destination-explorer"/);
assert.match(html, /<label for="destination-select">/);
```

Assert the old always-visible matrix and its `destination-body` are absent.

- [ ] **Step 2: Run tests and confirm the old dashboard fails the new structure**

Run: `node --test tests/passport-dashboard.test.cjs`

Expected: FAIL on missing scenario and destination-lookup landmarks.

- [ ] **Step 3: Implement the simplified semantic markup and CSS**

Replace the large hero, overview grid, filter bar, and table with:

- Compact explanatory header.
- Scroll-snap passport card row at narrow widths.
- One labeled scenario selector.
- One rendered scenario article with four outcome counts.
- Native `<details>` elements for full destination groups.
- Collapsed destination lookup.

Use a single red accent, minimum 44-pixel control targets, one-column layout at 360 pixels, and progressive two-column detail groups above 760 pixels.

- [ ] **Step 4: Implement rendering and interaction functions**

Add `renderPassportCards`, `renderScenario`, `renderOutcomeList`, `renderDestination`, and `init`. Populate the selector from `SCENARIOS` and update only the featured scenario when it changes.

- [ ] **Step 5: Run all automated tests**

Run: `node --test tests/passport-dashboard.test.cjs`

Expected: all tests PASS with no warnings.

- [ ] **Step 6: Commit the mobile interface**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "feat: simplify passport bundle interface"
```

### Task 4: Verify the final offline artifact

**Files:**
- Modify if a regression is found: `tests/passport-dashboard.test.cjs`
- Modify if a regression is found: `index.html`

**Interfaces:**
- Consumes: completed local HTML artifact.
- Produces: verified file ready in the main workspace.

- [ ] **Step 1: Run automated verification**

Run:

```bash
node --test tests/passport-dashboard.test.cjs
git diff --check
git status --short
```

Expected: all tests PASS, no whitespace errors, and a clean working tree after commits.

- [ ] **Step 2: Open the worktree file directly in Safari**

Verify the file loads from `file:///Users/miloakil/Documents/VISA/.worktrees/passport-dashboard/index.html` without a server or network request.

- [ ] **Step 3: Exercise every interaction**

Change through all eight scenarios, expand each outcome group, use destination lookup, verify exact labels and days remain visible, operate controls by keyboard, and confirm source/warning copy.

- [ ] **Step 4: Inspect mobile-first behavior**

Confirm the narrow layout has no horizontal page overflow, passport cards scroll intentionally, touch targets remain at least 44 pixels, and scenario details remain readable. Confirm desktop enhancement remains restrained rather than recreating the old dense dashboard.

- [ ] **Step 5: Fix defects with red-green regression tests**

For each defect, add a failing test first, verify the failure, implement the smallest correction, and re-run the full test file.

- [ ] **Step 6: Review, merge locally, and verify the merged workspace**

Request independent code review, address all critical and important findings, merge `feat/passport-dashboard` into `master`, run the complete test command from `/Users/miloakil/Documents/VISA`, and remove the owned worktree only after the merged verification passes.

