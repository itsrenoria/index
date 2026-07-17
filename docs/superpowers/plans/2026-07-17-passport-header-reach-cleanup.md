# Passport Header and Reach Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the Passport Index brand and navigation, reconcile compact Reach totals, simplify Browse rows, and omit a selected home passport from destination results.

**Architecture:** Keep the application in the existing self-contained `index.html` and extend the existing pure rendering helpers so behavior remains testable through `PassportDashboard`. Generate one transparent raster logo, retain the final project asset under `assets/`, and embed its compact base64 representation into the HTML.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node.js built-in test runner, built-in image generation, PNG alpha post-processing, Safari responsive testing.

## Global Constraints

- The page remains self-contained.
- The unified header shows the logo, `PASSPORT INDEX`, and Check / Reach / Compare / Browse without wrapping or horizontal navigation scrolling at 320px and 440px.
- At mobile widths, the brand and four navigation links form one full-width segmented bar with shared background, vertical dividers, no loose gaps, and at least 44px touch height.
- The red hero descriptor is exactly `PASSPORT ACCESS · COUNTRY BY COUNTRY`.
- The `2026 DATA / 199 DESTINATIONS` data stamp and its CSS are absent at every viewport width.
- Reach `Visa free` combines `visa-free`, `eta`, and `registration`; Reach totals exclude `home`.
- Destination search omits only the passport whose selected destination entry has type `home`.
- Browse keeps direct status badges and removes Positive / Negative rank badges.
- Browse provides one persistent three-group dropdown and preserves direct status labels inside grouped results.
- Preserve the root `.DS_Store` as an unrelated untracked file.

---

### Task 1: Reconcile Search, Reach, and Browse Behavior

**Files:**
- Modify: `tests/passport-dashboard.test.cjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: `DESTINATIONS`, `PASSPORTS`, `accessStatus(entry)`, `statusLabel(status)`, and `summarizePassport(data, passportCode)`.
- Produces: `summarizePassportModes(data, passportCode)` returning `{ negative, visaFree, onArrival, accessibleAbroad }`; `destinationResultMarkup(row)` omitting home passports; `passportBrowserMarkup(data, passportCode)` with direct status badges only.

- [ ] **Step 1: Write failing Reach reconciliation tests**

Add assertions for the exact summaries:

```js
const expected = {
  al: { visaFree: 80, onArrival: 27, accessibleAbroad: 107 },
  gr: { visaFree: 131, onArrival: 29, accessibleAbroad: 160 },
  de: { visaFree: 132, onArrival: 29, accessibleAbroad: 161 },
  us: { visaFree: 121, onArrival: 34, accessibleAbroad: 155 },
};
for (const passport of api.PASSPORTS) {
  const summary = api.summarizePassportModes(api.DESTINATIONS, passport.code);
  assert.deepEqual(
    { visaFree: summary.visaFree, onArrival: summary.onArrival, accessibleAbroad: summary.accessibleAbroad },
    expected[passport.code],
  );
  assert.equal(summary.accessibleAbroad, summary.visaFree + summary.onArrival);
}
```

- [ ] **Step 2: Write failing search and Browse tests**

For every passport home row, assert that `destinationResultMarkup` contains three result articles, omits the home passport name, and retains the other three. Assert that `passportBrowserMarkup` contains `access-pill` status markup but no `rank-pill`, `>Positive<`, or `>Negative<`.

- [ ] **Step 3: Run the focused tests and verify RED**

Run: `node --test --test-name-pattern="reach|home passport|Browse" tests/passport-dashboard.test.cjs`

Expected: FAIL because Reach still counts only literal visa-free entries, home search still renders four passports, and Browse still renders rank badges.

- [ ] **Step 4: Implement the minimal behavior**

Update `summarizePassportModes` to count `visa-free`, `eta`, and `registration` as the Reach `visaFree` subtotal; count only `visa-on-arrival` as `onArrival`; set `accessibleAbroad` to their sum; retain `negative` from `summarizePassport`.

Update `passportCardMarkup` to use `accessibleAbroad` as the headline and label it `accessible abroad`.

Filter `PASSPORTS` in `destinationResultMarkup` before mapping:

```js
return PASSPORTS
  .filter((passport) => row[passport.code].type !== 'home')
  .map((passport) => { /* existing result markup */ })
  .join('');
```

Remove `rank`, `rankLabel`, and the `rank-pill` span from `passportBrowserMarkup` while retaining the raw source label and direct `access-pill`.

- [ ] **Step 5: Run the complete suite and verify GREEN**

Run: `node --test tests/passport-dashboard.test.cjs`

Expected: all tests pass.

- [ ] **Step 6: Commit Task 1**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "feat: reconcile passport reach and destination results"
```

---

### Task 2: Generate and Integrate the Unified Header

**Files:**
- Create: `assets/passport-mark.png`
- Modify: `tests/passport-dashboard.test.cjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: existing `.bundle-masthead`, `.bundle-brand`, `.section-nav`, `.section-nav-list`, and `.bundle-kicker` visual language.
- Produces: one sticky `.site-header` containing only the brand and navigation; embedded `<img class="bundle-mark">`; restored hero descriptor; no data stamp, legend markup, or legend-only CSS.

- [ ] **Step 1: Write failing header, descriptor, and legend tests**

Assert that:

```js
assert.match(html, /<header class="site-header">[\s\S]*?<nav class="section-nav"/);
assert.match(html, /<img class="bundle-mark"[^>]+src="data:image\/png;base64,/);
assert.match(html, /Passport access · country by country/i);
assert.doesNotMatch(html, /Access legend|weight-note|weight-row|weight-badge/);
assert.doesNotMatch(html, /2026 DATA|199 DESTINATIONS|bundle-date/);
assert.match(html, /@media \(max-width:\s*480px\)[\s\S]*?\.site-header/);
```

Also assert that the former text-only `<span class="bundle-mark">P</span>` is absent.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --test-name-pattern="masthead|header|legend|descriptor" tests/passport-dashboard.test.cjs`

Expected: FAIL because the header and nav are separate, the logo is text, the descriptor is absent, and the legend exists.

- [ ] **Step 3: Generate the logo through the built-in image tool**

Use this normalized prompt:

```text
Use case: logo-brand
Asset type: compact website navigation mark
Primary request: a minimalist front-facing passport icon, recognizable at 28 pixels
Style/medium: flat vector-friendly geometric mark, editorial and restrained
Color palette: near-black deep green passport with one small muted red accent
Composition/framing: centered square icon with generous padding
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for removal
Constraints: no text, no letters, no numbers, no gradients, no shadows, no texture, no watermark; do not use #ff00ff in the mark
```

Copy the generated source into a temporary project location, remove the chroma key with the installed imagegen helper, downscale the final alpha PNG to a compact web size, validate transparent corners and legibility, then save it as `assets/passport-mark.png`.

- [ ] **Step 4: Implement the unified header and hero cleanup**

Move the navigation inside `.site-header`, remove the data stamp and `.bundle-date` styles entirely, and use compact mobile CSS so the brand and all four nav items fit in one row. Replace the text mark with the transparent PNG embedded as a base64 data URI. Add `<p class="bundle-kicker">Passport access · country by country</p>` above the hero heading. Remove the legend markup and delete `.weight-note`, `.weight-row`, and `.weight-badge` rules.

- [ ] **Step 5: Run the complete suite and verify GREEN**

Run: `node --test tests/passport-dashboard.test.cjs`

Expected: all tests pass.

- [ ] **Step 6: Commit Task 2**

```bash
git add assets/passport-mark.png index.html tests/passport-dashboard.test.cjs
git commit -m "feat: unify passport header and navigation"
```

---

### Task 3: Add the Browse Access Filter

**Files:**
- Modify: `tests/passport-dashboard.test.cjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: `accessStatus(entry)`, `statusLabel(status)`, `PASSPORTS`, `DESTINATIONS`, and the existing passport-choice state.
- Produces: `BROWSER_ACCESS_GROUPS`; `filterPassportDestinations(data, passportCode, group)`; `passportBrowserMarkup(data, passportCode, group = 'visa-free')`; persistent `selectedPassportGroup`; one `#passport-status-filter` select control.

- [ ] **Step 1: Write failing pure-filter tests**

Assert that `BROWSER_ACCESS_GROUPS` equals:

```js
[
  ['visa-free', 'Visa free'],
  ['on-arrival', 'On arrival'],
  ['visa-needed', 'Visa needed'],
]
```

Assert that Albania `visa-free` returns 80 rows whose direct statuses are limited to `visa-free`, `eta`, `evisitor`, or `entry-form`; Albania `on-arrival` returns 27 direct `on-arrival` rows; and Albania `visa-needed` returns 91 rows whose direct statuses are `evisa` or `visa-needed`. Assert no group includes `home` or `not-admitted`.

- [ ] **Step 2: Write failing markup and state tests**

Assert that the HTML contains a labelled `#passport-status-filter` select with exactly the three group options and no All/Home/Not admitted option. Assert Albania `visa-free` markup reports `80 destinations`, contains 80 list rows, and preserves direct `access-pill visa-free`, `access-pill eta`, and `access-pill entry-form` badges. Assert Albania `visa-needed` preserves both `access-pill evisa` and `access-pill visa-needed`. Assert both passport and group change listeners call one render function using the persistent selected values.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `node --test --test-name-pattern="Browse access filter|passport browser" tests/passport-dashboard.test.cjs`

Expected: FAIL because the group constants, helper, control, state, and grouped rendering do not exist.

- [ ] **Step 4: Implement the minimal filter**

Define the exact three-group option list and a pure filtering helper that maps direct statuses to the selected group. Extend `passportBrowserMarkup` with a default `group = 'visa-free'`, filter before row rendering, and show `${rows.length} destinations` while leaving each row's direct badge unchanged.

Add a compact labelled select beside the passport controls. Track `selectedPassportCode` and `selectedPassportGroup`; use one `renderPassportBrowser()` function from both change listeners without resetting the other selected value.

- [ ] **Step 5: Run focused and complete tests and verify GREEN**

Run:

```bash
node --test --test-name-pattern="Browse access filter|passport browser" tests/passport-dashboard.test.cjs
node --test tests/passport-dashboard.test.cjs
git diff --check
```

Expected: focused and complete suites pass; diff check is silent.

- [ ] **Step 6: Commit Task 3**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "feat: filter passport destinations by access status"
```

---

### Task 4: Make the Mobile Header a Segmented Menu Bar

**Files:**
- Modify: `tests/passport-dashboard.test.cjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: `.site-header`, `.bundle-masthead`, `.bundle-brand`, `.section-nav`, and `.section-nav-list` from Task 2.
- Produces: one full-width mobile segmented header with the brand as the first cell and four adjacent navigation cells.

- [ ] **Step 1: Write failing mobile-menu and data-stamp regression tests**

Assert the mobile media rule gives `.site-header .bundle-shell` full width, removes the nav gap, gives the brand a right divider, gives adjacent nav items dividers, and keeps link touch height at 44px. Replace the coupled data-stamp assertion with independent rejections:

```js
assert.doesNotMatch(html, /2026 DATA/i);
assert.doesNotMatch(html, /199 DESTINATIONS/i);
assert.doesNotMatch(html, /bundle-date/);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test --test-name-pattern="mobile header|masthead" tests/passport-dashboard.test.cjs`

Expected: FAIL because the mobile header has inset shell margins and no cell dividers, and because the former data-stamp test does not independently guard both labels.

- [ ] **Step 3: Implement the smallest segmented-bar correction**

Within the existing mobile media rule, make the header shell full width, add compact inline padding to the brand cell, add a right border between brand and nav, remove loose gaps, and add subtle dividers between navigation cells. Preserve the existing shared paper background, one-row layout, focus styling, and 44px link height.

- [ ] **Step 4: Run focused and complete tests and verify GREEN**

Run:

```bash
node --test --test-name-pattern="mobile header|masthead" tests/passport-dashboard.test.cjs
node --test tests/passport-dashboard.test.cjs
git diff --check
```

Expected: focused and complete suites pass; diff check is silent.

- [ ] **Step 5: Commit Task 4**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "fix: unify mobile passport navigation"
```

---

### Task 5: Responsive Visual Verification and Publication

**Files:**
- Modify if required by QA: `index.html`
- Modify if required by QA: `tests/passport-dashboard.test.cjs`

**Interfaces:**
- Consumes: the completed self-contained page.
- Produces: verified mobile and desktop rendering and a deployed `origin/main` commit.

- [ ] **Step 1: Run static verification**

Run:

```bash
node --test tests/passport-dashboard.test.cjs
git diff --check
```

Expected: all tests pass and `git diff --check` returns no output.

- [ ] **Step 2: Inspect Safari at 320px, 440px, and desktop width**

Verify that the unified header stays on one row, all nav labels are visible, no horizontal scrolling appears, touch targets remain usable, the logo is crisp, the legend is absent, home searches show three cards, Reach cards reconcile, and Browse has direct status badges only.

- [ ] **Step 3: Fix any visual defect test-first**

If QA finds a defect, add a focused failing assertion, reproduce it, make the smallest CSS or markup correction, and rerun the complete suite.

- [ ] **Step 4: Request independent review**

Review the full feature commit range against `docs/superpowers/specs/2026-07-17-passport-header-reach-cleanup-design.md`. Fix all Critical and Important findings before publication.

- [ ] **Step 5: Merge and verify after integration**

Fast-forward the reviewed feature branch into the main workspace and rerun the full suite plus `git diff --check`.

- [ ] **Step 6: Push and verify GitHub Pages**

Push the local integration branch to `origin/main`, confirm the remote SHA, wait for the matching GitHub Pages build to report `built`, and fetch the public HTML to verify the header descriptor and updated code are live.
