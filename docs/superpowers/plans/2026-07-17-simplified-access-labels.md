# Simplified Access Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace umbrella entry wording with direct status labels, exact visa-free counts, and compact mobile navigation copy.

**Architecture:** Keep the self-contained page structure. Replace `accessMode`/`modeLabel` with a shared direct-status key and label mapping used by destination search and passport browsing, while Passport Reach counts `visa-free` entries directly. Update only embedded CSS, HTML copy, vanilla JavaScript helpers, and the existing Node VM tests.

**Tech Stack:** Semantic HTML, embedded CSS, vanilla JavaScript, Node.js `node:test`, Safari Computer Use.

## Global Constraints

- Keep all 199 destinations and existing source labels unchanged.
- Keep positive/negative ranking and comparison buckets unchanged.
- Use these direct labels: Home country, Visa free, ETA, eVisitor, Entry form, On arrival, eVisa, Visa needed, Not admitted.
- Passport Reach must label and count only `visa-free` entries as Visa free.
- Navigation labels must be Check, Reach, Compare, Browse.
- Keep the page self-contained with no dependencies or external assets.
- Preserve 44-pixel navigation touch targets and keyboard accessibility.

---

### Task 1: Direct entry-status badges and exact Passport Reach count

**Files:**
- Modify: `index.html:94-98, 4843-4864, 4918-4975, 5100-5120`
- Test: `tests/passport-dashboard.test.cjs:30-40, 149-157, 90-112, 245-258`

**Interfaces:**
- Consumes: entry objects shaped as `{ raw: string, type: string, days?: number }`.
- Produces: `accessStatus(entry): string`, `statusLabel(status): string`, and `summarizePassportModes(data, passportCode).visaFree: number`.

- [ ] **Step 1: Write failing direct-status tests**

Replace the umbrella access annotation test with:

```js
test('access status uses direct entry labels', () => {
  const { api } = loadPage();
  const cases = [
    [{ type: 'home', raw: 'HOME COUNTRY' }, 'home', 'Home country'],
    [{ type: 'visa-free', raw: 'VISA-FREE 90' }, 'visa-free', 'Visa free'],
    [{ type: 'eta', raw: 'ETA 90' }, 'eta', 'ETA'],
    [{ type: 'eta', raw: 'EVISITORS 90' }, 'evisitor', 'eVisitor'],
    [{ type: 'registration', raw: 'ARRIVAL CARD 90' }, 'entry-form', 'Entry form'],
    [{ type: 'visa-on-arrival', raw: 'VISA ON ARRIVAL 30' }, 'on-arrival', 'On arrival'],
    [{ type: 'evisa', raw: 'EVISA 30' }, 'evisa', 'eVisa'],
    [{ type: 'visa-required', raw: 'VISA REQUIRED' }, 'visa-needed', 'Visa needed'],
    [{ type: 'not-admitted', raw: 'NOT ADMITTED' }, 'not-admitted', 'Not admitted'],
  ];
  for (const [entry, status, label] of cases) {
    assert.equal(api.accessStatus(entry), status);
    assert.equal(api.statusLabel(status), label);
  }
  assert.equal(api.accessMode, undefined);
});
```

- [ ] **Step 2: Write failing Passport Reach and rendered-markup tests**

Replace the mode-summary test and extend the markup test with:

```js
test('passport reach reports exact visa-free and on-arrival counts', () => {
  const { api } = loadPage();
  for (const passport of api.PASSPORTS) {
    const summary = api.summarizePassportModes(api.DESTINATIONS, passport.code);
    const exactVisaFree = api.DESTINATIONS.filter((row) => row[passport.code].type === 'visa-free').length;
    assert.equal(summary.visaFree, exactVisaFree, passport.code);
    assert.equal(summary.positive + summary.negative, 199, passport.code);
    const card = api.passportCardMarkup(passport, api.DESTINATIONS);
    assert.match(card, new RegExp(`<strong>${exactVisaFree}<\\/strong>Visa free`));
    assert.doesNotMatch(card, /Free \/ pre-cleared/);
  }
});

test('search and passport browsing show home country as its own status', () => {
  const { api } = loadPage();
  for (const passport of api.PASSPORTS) {
    const homeRow = api.DESTINATIONS.find((row) => row[passport.code].type === 'home');
    assert.ok(homeRow, passport.code);
    assert.match(api.destinationResultMarkup(homeRow), /access-pill home">Home country/);
    assert.match(api.passportBrowserMarkup(api.DESTINATIONS, passport.code), /access-pill home">Home country/);
  }
});
```

- [ ] **Step 3: Run focused tests and verify the expected failure**

Run:

```bash
node --test --test-name-pattern='direct entry labels|exact visa-free|home country as its own status' tests/passport-dashboard.test.cjs
```

Expected: FAIL because `accessStatus`, `statusLabel`, and `visaFree` do not exist and the old umbrella labels are still rendered.

- [ ] **Step 4: Implement direct status and label helpers**

Replace `accessMode` and `modeLabel` with:

```js
function accessStatus(entry) {
  if (entry?.type === 'eta') return /^EVISITORS\b/.test(entry.raw || '') ? 'evisitor' : 'eta';
  return {
    home: 'home',
    'visa-free': 'visa-free',
    registration: 'entry-form',
    'visa-on-arrival': 'on-arrival',
    evisa: 'evisa',
    'visa-required': 'visa-needed',
    'not-admitted': 'not-admitted',
  }[entry?.type] || 'visa-needed';
}

function statusLabel(status) {
  return {
    home: 'Home country',
    'visa-free': 'Visa free',
    eta: 'ETA',
    evisitor: 'eVisitor',
    'entry-form': 'Entry form',
    'on-arrival': 'On arrival',
    evisa: 'eVisa',
    'visa-needed': 'Visa needed',
    'not-admitted': 'Not admitted',
  }[status];
}
```

Use `accessStatus(entry)` and `statusLabel(status)` in `destinationResultMarkup` and `passportBrowserMarkup`. Export both helpers and remove `accessMode` from `PassportDashboard`.

- [ ] **Step 5: Implement exact Visa Free summary**

Change `summarizePassportModes` and the card metric to:

```js
function summarizePassportModes(data, passportCode) {
  const summary = summarizePassport(data, passportCode);
  const visaFree = data.filter((row) => row[passportCode].type === 'visa-free').length;
  const onArrival = data.filter((row) => row[passportCode].type === 'visa-on-arrival').length;
  return { ...summary, visaFree, onArrival };
}
```

```html
<span><strong>${metrics.visaFree}</strong>Visa free</span>
```

- [ ] **Step 6: Replace umbrella badge styles with direct status groups**

Use:

```css
.access-pill.home, .access-pill.visa-free, .access-pill.eta, .access-pill.evisitor, .access-pill.entry-form { color: var(--v2-green); background: var(--v2-soft-green); }
.access-pill.on-arrival { color: #75520d; background: #f0e1b7; }
.access-pill.evisa, .access-pill.visa-needed, .access-pill.not-admitted { color: var(--v2-red); background: var(--v2-soft-red); }
```

Remove `.access-pill.free-precleared` and confirm no rendered `Visa needed / restricted` or `Free / pre-cleared` wording remains.

- [ ] **Step 7: Run focused and complete tests**

Run:

```bash
node --test tests/passport-dashboard.test.cjs && git diff --check
```

Expected: all tests pass and the whitespace check is clean.

---

### Task 2: Compact legend and mobile navigation

**Files:**
- Modify: `index.html:172-195`
- Test: `tests/passport-dashboard.test.cjs:205-238, 265-276`

**Interfaces:**
- Consumes: existing anchor targets `#destination-search`, `#passport-reach`, `#comparisons`, and `#passport-browser`.
- Produces: exact visible navigation labels Check, Reach, Compare, Browse and compact legend copy.

- [ ] **Step 1: Write failing copy and no-scroll tests**

Update the navigation test to require:

```js
for (const [target, label] of [
  ['destination-search', 'Check'],
  ['passport-reach', 'Reach'],
  ['comparisons', 'Compare'],
  ['passport-browser', 'Browse'],
]) {
  assert.match(html, new RegExp(`<a href="#${target}">${label}<\\/a>`));
}
assert.match(html, /Visa-free, ETA or eVisitor\./);
assert.match(html, /May include a border fee\./);
assert.doesNotMatch(html, /normally free or pre-cleared|Visa on arrival may include/);
```

Add a mobile-fit assertion:

```js
assert.match(html, /@media \(max-width:\s*480px\)[\s\S]*?\.section-nav-list\s*\{[^}]*overflow-x:\s*visible/s);
```

- [ ] **Step 2: Run focused copy test and verify failure**

Run:

```bash
node --test --test-name-pattern='masthead navigation|mobile-first' tests/passport-dashboard.test.cjs
```

Expected: FAIL because the old long labels and legend sentences remain and no small-screen no-scroll rule exists.

- [ ] **Step 3: Apply the approved copy**

Use these exact anchors:

```html
<li><a href="#destination-search">Check</a></li>
<li><a href="#passport-reach">Reach</a></li>
<li><a href="#comparisons">Compare</a></li>
<li><a href="#passport-browser">Browse</a></li>
```

Use these exact legend rows:

```html
<div class="weight-row"><span class="weight-badge free">Free entry</span><span>Visa-free, ETA or eVisitor.</span></div>
<div class="weight-row"><span class="weight-badge arrival">On arrival</span><span>May include a border fee.</span></div>
```

- [ ] **Step 4: Make the four labels fit without mobile scrolling**

Add before the existing `min-width` media queries:

```css
@media (max-width: 480px) {
  .section-nav-list { justify-content: space-between; gap: 0; overflow-x: visible; }
  .section-nav li { flex: 1 1 25%; }
  .section-nav a { justify-content: center; padding-inline: .35rem; }
}
```

- [ ] **Step 5: Run the full suite and Safari verification**

Run:

```bash
node --test tests/passport-dashboard.test.cjs && git diff --check
```

In Safari at 440 pixels, confirm all four navigation labels are visible without horizontal scrolling, both legend rows remain compact, home-country badges read Home country, and the Passport Reach card reads Visa free.

- [ ] **Step 6: Commit and publish**

```bash
git add index.html tests/passport-dashboard.test.cjs docs/superpowers/plans/2026-07-17-simplified-access-labels.md
git commit -m "feat: simplify passport access labels"
git push origin HEAD:main
```

Confirm the remote `main` SHA matches local HEAD and GitHub Pages serves the new Check, Reach, Compare, Browse navigation.
