# Direct Passport Comparisons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace bundle scenarios with a self-contained page that offers top-level destination search and six always-visible direct comparisons for Albania, Greece, Germany, and the United States.

**Architecture:** Keep the retrieved 199-row dataset, pure comparison functions, UI, and tests in the existing single-file application. Add a practical access annotation beside the binary ranking, derive six direct passport pairs, and render search results plus pair cards from the same pure functions used by the Node VM tests.

**Tech Stack:** Semantic HTML, embedded CSS, vanilla JavaScript, Node.js `node:test`, Safari Computer Use.

## Global Constraints

- Deliver one offline `index.html` with no external fonts, scripts, images, or network requests.
- Positive ranking includes home, visa-free, ETA/eVisitor, visa on arrival, and lightweight registration.
- Negative ranking includes eVisa, visa required, not admitted, and unknown.
- Stay length does not affect ranking; exact raw Passport Index labels and days remain visible.
- Free/pre-cleared and on-arrival annotations do not alter the binary rank.
- Show all six direct passport pairings without a scenario selector or passport bundles.
- Keep touch targets at least 44 pixels and preserve reduced-motion behavior.

---

### Task 1: Practical access annotations and direct comparison engine

**Files:**
- Modify: `index.html` application constants and pure functions near `POSITIVE_TYPES`, `accessWeight`, and `buildScenario`
- Test: `tests/passport-dashboard.test.cjs`

**Interfaces:**
- Consumes: an entry object `{ raw, type, days }` and a destination row with `al`, `gr`, `de`, and `us` entries.
- Produces: `accessMode(entry): 'free-precleared' | 'on-arrival' | 'visa-needed'`; `DIRECT_COMPARISONS`; `comparePassports(data, leftCode, rightCode)` returning `leftOnly`, `rightOnly`, `bothPositive`, and `bothNegative` arrays.

- [ ] **Step 1: Write failing tests for access annotations and six pairs**

```js
assert.equal(api.accessMode({ type: 'visa-free' }), 'free-precleared');
assert.equal(api.accessMode({ type: 'eta' }), 'free-precleared');
assert.equal(api.accessMode({ type: 'visa-on-arrival' }), 'on-arrival');
assert.equal(api.accessMode({ type: 'evisa' }), 'visa-needed');
assert.deepEqual(Array.from(api.DIRECT_COMPARISONS, ({ left, right }) => [left, right]), [
  ['al', 'gr'], ['al', 'de'], ['al', 'us'], ['gr', 'de'], ['gr', 'us'], ['de', 'us'],
]);
```

- [ ] **Step 2: Run focused tests and confirm they fail**

Run: `node --test --test-name-pattern='access annotation|six direct' tests/passport-dashboard.test.cjs`

Expected: FAIL because `accessMode` and `DIRECT_COMPARISONS` are not exported.

- [ ] **Step 3: Add the annotation and pair engine**

```js
const DIRECT_COMPARISONS = [
  { id: 'al-gr', left: 'al', right: 'gr' },
  { id: 'al-de', left: 'al', right: 'de' },
  { id: 'al-us', left: 'al', right: 'us' },
  { id: 'gr-de', left: 'gr', right: 'de' },
  { id: 'gr-us', left: 'gr', right: 'us' },
  { id: 'de-us', left: 'de', right: 'us' },
];

function accessMode(entry) {
  if (entry?.type === 'visa-on-arrival') return 'on-arrival';
  if (accessWeight(entry) === 'positive') return 'free-precleared';
  return 'visa-needed';
}

function comparePassports(data, leftCode, rightCode) {
  const result = { leftOnly: [], rightOnly: [], bothPositive: [], bothNegative: [] };
  for (const row of data) {
    const outcome = compareBundles(row, [leftCode], [rightCode]);
    const key = { leftKeeps: 'leftOnly', rightAdds: 'rightOnly', bothCover: 'bothPositive', neitherCovers: 'bothNegative' }[outcome];
    result[key].push(row);
  }
  return result;
}
```

- [ ] **Step 4: Test the engine and full 199-row partition**

Run: `node --test --test-name-pattern='access annotation|six direct|partitions all destinations' tests/passport-dashboard.test.cjs`

Expected: all selected tests pass and each direct pair totals 199 unique destinations.

- [ ] **Step 5: Commit the engine**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "refactor: compare passports directly"
```

---

### Task 2: Destination search and passport summaries

**Files:**
- Modify: `index.html` search markup, summary helpers, and search renderer
- Test: `tests/passport-dashboard.test.cjs`

**Interfaces:**
- Consumes: `DESTINATIONS`, a partial query string, `accessMode(entry)`, and passport codes.
- Produces: `findDestination(data, query): row | null`; `summarizePassportModes(data, code): { positive, negative, freePrecleared, onArrival, total }`; four live search result cards.

- [ ] **Step 1: Write failing search and mode-summary tests**

```js
assert.equal(api.findDestination(api.DESTINATIONS, 'viet').destination, 'VIET NAM');
assert.equal(api.findDestination(api.DESTINATIONS, 'not a destination'), null);
const summary = api.summarizePassportModes(api.DESTINATIONS, 'al');
assert.equal(summary.freePrecleared + summary.onArrival, summary.positive);
assert.equal(summary.positive + summary.negative, 199);
```

- [ ] **Step 2: Run focused tests and confirm the new summary test fails**

Run: `node --test --test-name-pattern='destination lookup|mode summary' tests/passport-dashboard.test.cjs`

Expected: destination lookup passes if already present; mode summary fails until implemented.

- [ ] **Step 3: Implement partial lookup, datalist suggestions, and summary breakdown**

Use a search input with `list="destination-options"`. Normalize case and diacritics, prefer exact matches, then prefix matches, then substring matches. Render all four raw statuses and access-mode pills on every valid input; render “No matching destination” when no row matches.

```js
function summarizePassportModes(data, passportCode) {
  const base = summarizePassport(data, passportCode);
  const freePrecleared = data.filter((row) => accessMode(row[passportCode]) === 'free-precleared').length;
  const onArrival = data.filter((row) => accessMode(row[passportCode]) === 'on-arrival').length;
  return { ...base, freePrecleared, onArrival };
}
```

- [ ] **Step 4: Run search and summary tests**

Run: `node --test --test-name-pattern='destination lookup|mode summary|source labels' tests/passport-dashboard.test.cjs`

Expected: all selected tests pass.

- [ ] **Step 5: Commit destination-first behavior**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "feat: add destination-first passport search"
```

---

### Task 3: Six always-visible comparison cards

**Files:**
- Modify: `index.html` main markup, CSS, and rendering functions
- Test: `tests/passport-dashboard.test.cjs`

**Interfaces:**
- Consumes: `DIRECT_COMPARISONS`, `comparePassports`, `passportName`, raw destination entries, and summary metrics.
- Produces: `#direct-comparisons` containing six `.comparison-card` elements with left-only and right-only destinations plus shared counts.

- [ ] **Step 1: Write failing structural tests**

```js
assert.match(html, /id="destination-search"/);
assert.match(html, /id="direct-comparisons"/);
assert.doesNotMatch(html, /id="scenario-select"/);
assert.doesNotMatch(html, /Bundle scenarios/);
assert.match(html, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
```

- [ ] **Step 2: Run structural tests and confirm they fail**

Run: `node --test --test-name-pattern='direct comparison interface' tests/passport-dashboard.test.cjs`

Expected: FAIL while scenario markup and selector remain.

- [ ] **Step 3: Replace scenario markup and renderer**

Remove the scenario select, bundle scoreboards, bundle labels, and expandable duplicated outcome groups. Add one comparison section and render six cards. Each card must include:

```html
<article class="comparison-card">
  <header><!-- left name, versus, right name --></header>
  <div class="shared-counts"><!-- both positive and both negative counts --></div>
  <div class="unique-columns">
    <section><!-- all left-only destinations with both raw labels --></section>
    <section><!-- all right-only destinations with both raw labels --></section>
  </div>
</article>
```

Keep unique lists visible without `<details>` or selectors. Limit excessive desktop card height with an internal scroll area while leaving mobile reading natural.

- [ ] **Step 4: Simplify CSS and copy**

Retain the warm editorial system, make search the first interactive block, use a one-column comparison stack below 760px and a two-column grid at or above 960px, preserve 44-pixel inputs, and include this note near the model explanation:

> Visa-free and ETA/eVisitor access is normally free or pre-cleared. Visa on arrival may carry a border fee. They remain equally positive in this comparison.

- [ ] **Step 5: Run the complete test suite**

Run: `node --test tests/passport-dashboard.test.cjs && git diff --check`

Expected: all tests pass; no whitespace errors.

- [ ] **Step 6: Commit the interface**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "feat: show all direct passport comparisons"
```

---

### Task 4: Browser verification and integration

**Files:**
- Modify if defects are found: `index.html`, `tests/passport-dashboard.test.cjs`

**Interfaces:**
- Consumes: the completed offline page and automated test suite.
- Produces: Safari-verified desktop/mobile HTML merged into the main workspace.

- [ ] **Step 1: Run fresh automated verification**

Run: `node --test tests/passport-dashboard.test.cjs && git diff --check && git status --short`

Expected: all tests pass, no diff errors, clean status.

- [ ] **Step 2: Verify in Safari with Computer Use**

Reload the worktree `index.html`, search for `VIET NAM`, confirm four exact raw statuses render, inspect all six comparison headings, verify no scenario selector exists, resize Safari to a narrow mobile width, and confirm search, cards, and unique lists remain readable.

- [ ] **Step 3: Request independent review**

Review the range from the current feature base to `HEAD` against the approved spec. Fix every Critical and Important issue with a failing regression test first.

- [ ] **Step 4: Merge locally and verify the main workspace**

From `/Users/miloakil/Documents/VISA`, merge `feat/passport-dashboard` into `master`, rerun the complete test suite, open `/Users/miloakil/Documents/VISA/index.html` in Safari, then remove the owned `.worktrees/passport-dashboard` worktree and delete the merged feature branch.
