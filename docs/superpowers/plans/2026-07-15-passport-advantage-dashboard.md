# Passport Advantage Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a polished, offline-ready `index.html` that compares the 2026 Passport Index destination rules for Albanian, Greek, German, and United States passports.

**Architecture:** One HTML file embeds normalized source data, CSS, and JavaScript. Pure comparison and aggregation functions feed both the summary and the destination matrix; DOM rendering consumes those functions behind a document guard so the logic can be tested with Node's built-in test runner.

**Tech Stack:** Semantic HTML, embedded CSS, vanilla JavaScript, Node.js built-in `node:test`, `assert`, and `vm`; Safari Computer Use for source retrieval.

## Global Constraints

- Deliver one `index.html` file with no runtime network request, build step, framework, external dependency, or external font.
- Include every destination exposed by Passport Index's prepared 2026 comparison.
- Rank visa-free, visa on arrival, ETA, eVisa, and visa required in that order; use longer stated stay as the same-category tie-breaker.
- Preserve combined source labels and rank them by the easiest stated path.
- Generate summary figures from the same data used by the destination matrix.
- Do not mention personal citizenship context.
- Use semantic, keyboard-accessible controls and never rely on color alone.

---

### Task 1: Retrieve and normalize Passport Index data

**Files:**
- Create temporarily: `/tmp/passport-index-2026.json`
- Test by inspection: Passport Index comparison open in Safari

**Interfaces:**
- Consumes: Safari accessibility rows for Greece, Albania, United States of America, and Germany.
- Produces: JSON array entries shaped as `{ destination, gr: { raw, type, days }, al: {...}, us: {...}, de: {...} }`.

- [ ] **Step 1: Capture all virtualized rows**

Use Computer Use to scroll the prepared Safari comparison from top to bottom. Parse each visible accessibility row into a map keyed by destination and persist the map to `/tmp/passport-index-2026.json`.

- [ ] **Step 2: Validate source coverage**

Run:

```bash
node -e "const d=require('/tmp/passport-index-2026.json'); console.log(d.length, new Set(d.map(x=>x.destination)).size)"
```

Expected: both numbers are identical and cover the complete destination list exposed by the table.

- [ ] **Step 3: Inspect category samples**

Run:

```bash
node -e "const d=require('/tmp/passport-index-2026.json'); for(const n of ['ANGOLA','AUSTRALIA','AZERBAIJAN','ALGERIA','BANGLADESH']) console.log(n,d.find(x=>x.destination===n))"
```

Expected: samples cover visa-free, ETA/eVisitor, eVisa, visa required, and visa on arrival without losing stay lengths.

### Task 2: Build the comparison engine with TDD

**Files:**
- Create: `tests/passport-dashboard.test.cjs`
- Create: `index.html`

**Interfaces:**
- Consumes: embedded `PASSPORTS`, `DESTINATIONS`, and `TYPE_RANK` constants.
- Produces: `classifyEntry(raw)`, `compareEntries(a,b)`, `rowOutcome(row)`, `summarize(data)`, and `filterRows(data,state)` on `globalThis.PassportDashboard`.

- [ ] **Step 1: Write failing engine tests**

Create a Node test that extracts the application script from `index.html`, evaluates it in a VM context, and asserts:

```js
assert.equal(api.compareEntries({ type: 'visa-free', days: 90 }, { type: 'evisa', days: null }), 1);
assert.equal(api.compareEntries({ type: 'visa-free', days: 180 }, { type: 'visa-free', days: 90 }), 1);
assert.equal(api.compareEntries({ type: 'eta', days: 90 }, { type: 'eta', days: 90 }), 0);
assert.deepEqual(api.rowOutcome(sample).winners, ['al']);
```

- [ ] **Step 2: Verify the test fails for the missing page**

Run: `node --test tests/passport-dashboard.test.cjs`

Expected: FAIL because `index.html` or `PassportDashboard` does not exist.

- [ ] **Step 3: Implement the minimal embedded engine**

Create `index.html` with an application script containing the embedded data and the five pure functions. Guard DOM startup with:

```js
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}
```

- [ ] **Step 4: Verify engine tests pass**

Run: `node --test tests/passport-dashboard.test.cjs`

Expected: all engine tests PASS.

- [ ] **Step 5: Commit the engine**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "feat: add passport comparison engine"
```

### Task 3: Add summaries and explorer interactions with TDD

**Files:**
- Modify: `tests/passport-dashboard.test.cjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: normalized rows and engine outcomes.
- Produces: summary metrics plus deterministic search, category, passport-advantage, differences-only, and sort results.

- [ ] **Step 1: Add failing aggregation and filtering tests**

Assert that summaries reconcile to the number of destinations and that filters return only matching rows. Include tests for case-insensitive destination search, Albania wins, differences only, entry-category matching, alphabetical sorting, and difference-strength sorting.

- [ ] **Step 2: Verify the new tests fail**

Run: `node --test tests/passport-dashboard.test.cjs`

Expected: FAIL on missing or incomplete aggregation/filter behavior.

- [ ] **Step 3: Implement minimal aggregation and filtering behavior**

Add pure implementations, state management, control handlers, URL-free reset behavior, and render functions for passport cards, winner overview, filter result count, and matrix rows.

- [ ] **Step 4: Verify all interaction logic tests pass**

Run: `node --test tests/passport-dashboard.test.cjs`

Expected: all tests PASS with no warnings.

- [ ] **Step 5: Commit interactions**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "feat: add passport summary and filters"
```

### Task 4: Apply the archival travel-document interface

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: rendered summary and matrix markup.
- Produces: responsive, accessible, polished desktop and mobile interface.

- [ ] **Step 1: Add structural static checks**

Extend the Node test to assert the page contains a skip link, one `h1`, labeled search and select controls, a table caption, a source link, a travel-rule warning, `prefers-reduced-motion`, and no `http` resource URLs outside the explicit Passport Index source link.

- [ ] **Step 2: Verify static checks fail**

Run: `node --test tests/passport-dashboard.test.cjs`

Expected: FAIL on missing interface structure or styling hooks.

- [ ] **Step 3: Implement the complete visual layer**

Add embedded CSS and semantic markup for an editorial passport-office aesthetic: paper-and-ink palette, subtle route-map background, typographic hierarchy using local font stacks, passport-specific accent rules, compact status chips with symbols, sticky matrix headers, mobile card behavior, visible focus, staged reveal, and reduced-motion overrides.

- [ ] **Step 4: Verify static and logic tests pass**

Run: `node --test tests/passport-dashboard.test.cjs`

Expected: all tests PASS.

- [ ] **Step 5: Commit the interface**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "feat: finish passport advantage dashboard"
```

### Task 5: Browser verification and final reconciliation

**Files:**
- Modify if defects are found: `index.html`
- Modify if a regression test is needed: `tests/passport-dashboard.test.cjs`

**Interfaces:**
- Consumes: completed local `index.html`.
- Produces: verified offline artifact ready for user review.

- [ ] **Step 1: Run automated verification**

Run:

```bash
node --test tests/passport-dashboard.test.cjs
git diff --check
```

Expected: all tests PASS and no whitespace errors.

- [ ] **Step 2: Open the file directly in Safari**

Use Computer Use to open the absolute `file:///Users/miloakil/Documents/VISA/index.html` URL and inspect the rendered desktop layout.

- [ ] **Step 3: Exercise the experience**

Verify search, every select, the differences-only toggle, Albania quick filter, both sort modes, reset, row winner labels, summary totals, horizontal scrolling, focus visibility, and the source/warning copy.

- [ ] **Step 4: Verify responsive and reduced-motion behavior**

Inspect narrow and wide layouts, confirm no clipped controls or unreadable matrix cells, and confirm the reduced-motion rule disables staged transitions.

- [ ] **Step 5: Re-run the full suite after any defect fixes**

For each defect, add a failing regression test before changing production code, then run `node --test tests/passport-dashboard.test.cjs` until clean.

- [ ] **Step 6: Commit final verification fixes if present**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "fix: polish passport dashboard verification"
```

