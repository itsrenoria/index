# Browse Results Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate Browse one passport controls from its results and render the selected passport list inside a comparison-style card with a stronger title header.

**Architecture:** Keep the page self-contained in `index.html`. Preserve all Browse state, filtering, selector, and row-rendering behavior; change only the section structure, result wrapper, header markup, and responsive presentation. Extend the existing Node regression suite to lock the empty state, separate-card structure, semantic title, count, and responsive rules.

**Tech Stack:** Semantic HTML, mobile-first CSS, vanilla JavaScript, Node.js built-in test runner.

## Global Constraints

- Browse selectors sit directly below the section heading, matching Direct comparisons.
- The empty state contains no result card.
- A selected passport renders one standalone bordered result card.
- The result card header contains `Passport access`, a semantic passport-name heading, and a destination count.
- Albania, Greece, Germany, and United States titles must wrap cleanly without horizontal overflow.
- Existing selection, `ALL`, filtering, clear/reset, live-status, exact badge, keyboard, and touch-target behavior remains unchanged.
- The page stays dependency-free and self-contained.

---

### Task 1: Separate Browse controls and results

**Files:**
- Modify: `index.html:157-170`
- Modify: `index.html:263-281`
- Modify: `index.html:5059-5069`
- Test: `tests/passport-dashboard.test.cjs:380-425`

**Interfaces:**
- Consumes: `passportBrowserMarkup(data, passportCode, group)` and the existing `#passport-browser-results` host.
- Produces: `.passport-browser-result-card`, `.passport-browser-header`, `.passport-browser-title`, and `.passport-browser-count` markup and styles.

- [ ] **Step 1: Write failing structure and header tests**

Add these focused tests:

```js
test('Browse selectors sit outside a separate result card', () => {
  const { html, api } = loadPage();
  const section = html.match(/<section class="bundle-section" id="passport-browser"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  assert.match(section, /class="selector-grid browser-selector-grid"[\s\S]*?id="passport-browser-results"/);
  assert.doesNotMatch(section, /passport-browser-panel|passport-browser-controls/);

  const emptyMarkup = api.passportBrowserMarkup(api.DESTINATIONS, '', 'all');
  assert.match(emptyMarkup, /Choose a passport to view destinations\./);
  assert.doesNotMatch(emptyMarkup, /passport-browser-result-card/);
});

test('Browse result card gives every passport a semantic formatted title', () => {
  const { html, api } = loadPage();
  for (const passport of api.PASSPORTS) {
    const markup = api.passportBrowserMarkup(api.DESTINATIONS, passport.code, 'all');
    assert.match(markup, /<article class="passport-browser-result-card">/);
    assert.match(markup, /class="passport-browser-eyebrow">Passport access<\/span>/);
    assert.match(markup, new RegExp(`<h3 class="passport-browser-title">${passport.name}<\\/h3>`));
    assert.match(markup, /class="passport-browser-count">199 destinations<\/span>/);
  }
  assert.match(html, /\.passport-browser-header\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(html, /\.passport-browser-title\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(html, /@media \(min-width:\s*760px\)[\s\S]*?\.passport-browser-header\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) auto/s);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
node --test --test-name-pattern='Browse selectors sit outside|Browse result card gives' tests/passport-dashboard.test.cjs
```

Expected: both tests fail because the section still uses `passport-browser-panel`, controls and results share one wrapper, and the result markup has no card or semantic heading.

- [ ] **Step 3: Move the selectors directly into the section**

Replace the current `.passport-browser-panel` block with this structure, retaining the existing selector internals exactly:

```html
<div class="selector-grid browser-selector-grid">
  <div class="choice-selector" id="passport-browser-control" data-choice-selector>
    <label for="passport-browser-selector">Passport</label>
    <div class="choice-selector-shell"><button class="choice-selector-trigger" id="passport-browser-selector" type="button" role="combobox" aria-expanded="false" aria-controls="passport-browser-options">Choose passport</button><button class="choice-selector-clear" type="button" aria-label="Clear passport" hidden>×</button><button class="choice-selector-arrow" type="button" aria-label="Browse passport options" aria-expanded="false" aria-controls="passport-browser-options"></button></div>
    <ul class="choice-selector-options" id="passport-browser-options" role="listbox" hidden></ul>
  </div>
  <div class="choice-selector" id="passport-status-control" data-choice-selector>
    <label for="passport-status-selector">Access status</label>
    <div class="choice-selector-shell"><button class="choice-selector-trigger" id="passport-status-selector" type="button" role="combobox" aria-expanded="false" aria-controls="passport-status-options" disabled>ALL</button><button class="choice-selector-clear" type="button" aria-label="Reset access status" hidden>×</button><button class="choice-selector-arrow" type="button" aria-label="Browse access status options" aria-expanded="false" aria-controls="passport-status-options" disabled></button></div>
    <ul class="choice-selector-options" id="passport-status-options" role="listbox" hidden></ul>
  </div>
</div>
<p class="live-status" id="passport-browser-status" aria-live="polite" aria-atomic="true">Choose a passport to view destinations.</p>
<div id="passport-browser-results"><p class="section-empty">Choose a passport to view destinations.</p></div>
```

The actual edit must preserve both complete existing `.choice-selector` blocks; only remove the enclosing `.passport-browser-panel` and `.passport-browser-controls` elements.

- [ ] **Step 4: Render a standalone result card and title header**

Change the final return in `passportBrowserMarkup` to:

```js
const destinationLabel = `${filteredRows.length} ${filteredRows.length === 1 ? 'destination' : 'destinations'}`;
return `<article class="passport-browser-result-card">
  <header class="passport-browser-header">
    <div class="passport-browser-heading"><span class="passport-browser-eyebrow">Passport access</span><h3 class="passport-browser-title">${escapeHtml(passport.name)}</h3></div>
    <span class="passport-browser-count">${destinationLabel}</span>
  </header>
  <ol class="passport-browser-list">${rows}</ol>
</article>`;
```

Keep the existing early returns and row-generation code unchanged.

- [ ] **Step 5: Replace the obsolete panel styles with result-card styles**

Remove:

```css
.passport-browser-panel { border: 1px solid var(--v2-ink); background: var(--v2-card); box-shadow: 8px 9px 0 rgba(23,33,29,.06); }
.passport-browser-controls { padding: 1rem; border-bottom: 1px solid var(--v2-rule); background: #eee3d2; }
.passport-browser-summary { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; padding: 1rem; border-bottom: 2px solid var(--v2-ink); }
.passport-browser-summary strong { font: 600 1.35rem/1 var(--v2-serif); }
.passport-browser-summary span { color: var(--v2-muted); font: 800 .56rem/1.2 var(--v2-mono); letter-spacing: .05em; text-transform: uppercase; }
```

Add:

```css
.passport-browser-result-card { min-width: 0; overflow: hidden; border: 1px solid var(--v2-rule); background: var(--v2-card); box-shadow: 6px 7px 0 rgba(23,33,29,.04); }
.passport-browser-header { display: grid; grid-template-columns: minmax(0, 1fr); gap: .7rem; padding: 1rem; border-bottom: 2px solid var(--v2-ink); background: #f3eadb; }
.passport-browser-heading { min-width: 0; }
.passport-browser-eyebrow { display: block; margin-bottom: .35rem; color: var(--v2-red); font: 800 .52rem/1 var(--v2-mono); letter-spacing: .09em; text-transform: uppercase; }
.passport-browser-title { margin: 0; font: 600 clamp(1.65rem, 7vw, 2.2rem)/.95 var(--v2-serif); letter-spacing: -.025em; overflow-wrap: anywhere; }
.passport-browser-count { justify-self: start; padding: .42rem .55rem; border: 1px solid var(--v2-rule); background: var(--v2-card); color: var(--v2-ink); font: 800 .56rem/1 var(--v2-mono); letter-spacing: .03em; text-transform: uppercase; }
```

Inside the existing `@media (min-width: 760px)` block add:

```css
.passport-browser-header { grid-template-columns: minmax(0, 1fr) auto; align-items: end; }
.passport-browser-count { justify-self: end; }
```

- [ ] **Step 6: Run focused and full verification**

Run:

```bash
node --test --test-name-pattern='Browse selectors sit outside|Browse result card gives|Browse ALL|passport browser filters' tests/passport-dashboard.test.cjs
node --test tests/passport-dashboard.test.cjs
git diff --check
```

Expected: focused tests pass, the full suite has zero failures, and whitespace validation exits zero.

- [ ] **Step 7: Commit the result-card change**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "style: separate browse results card"
```

---

### Task 2: Responsive interaction QA and final review

**Files:**
- Modify if required: `index.html`
- Modify if required: `tests/passport-dashboard.test.cjs`

**Interfaces:**
- Consumes: the completed Browse result card and existing selectors.
- Produces: a reviewed, responsive, self-contained page ready for integration.

- [ ] **Step 1: Run local mobile and desktop QA**

Serve the page:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

At 390 × 844 and 1280 × 900 verify:

- the selectors align exactly like Direct comparisons;
- the empty state has no result-card border or shadow;
- selecting each passport renders one result card;
- Albania, Greece, Germany, and United States titles remain readable without horizontal overflow;
- the destination count stacks below the title on mobile and aligns to the right on desktop;
- `ALL` renders 199 rows, filters retain existing counts and exact badges, and clearing restores the prompt;
- no console warnings or errors occur.

- [ ] **Step 2: Request independent code review**

Review the feature range against:

- `docs/superpowers/specs/2026-07-17-browse-results-card-design.md`;
- separation of controls and results;
- semantic heading and responsive title treatment;
- preserved Browse behavior and absence of obsolete panel code;
- regression-test quality.

Fix every Critical and Important issue before proceeding.

- [ ] **Step 3: Commit review fixes if required**

If review changes are necessary:

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "fix: polish browse results card"
```

Do not create an empty commit when no files changed.

- [ ] **Step 4: Run final verification**

Run:

```bash
node --test tests/passport-dashboard.test.cjs
git diff --check
if rg -n "passport-browser-panel|passport-browser-controls|passport-browser-summary" index.html; then exit 1; else echo "obsolete Browse panel styles: none"; fi
git status --short --branch
git log --oneline -6
```

Expected: the full suite has zero failures, no whitespace errors or obsolete panel identifiers remain, and the feature branch is clean.
