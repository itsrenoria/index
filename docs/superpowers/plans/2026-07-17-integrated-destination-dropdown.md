# Integrated Destination Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a native destination dropdown inside the existing search control while preserving free typing and partial matching.

**Architecture:** Keep the page self-contained in `index.html`. Add one pure exact-match helper and one shared options-markup helper, then synchronize a native select with the existing search input and render path. Extend the existing Node VM suite and verify the integrated control in Safari.

**Tech Stack:** Semantic HTML, embedded CSS, vanilla JavaScript, Node.js `node:test`, Safari Computer Use.

## Global Constraints

- Keep the page self-contained with no new dependencies or external resources.
- Preserve all 199 destinations and current passport data.
- Preserve partial matching in the typed search.
- Use a native select with an accessible label and a minimum 44-pixel target.
- Keep the search input, datalist suggestions, and dropdown synchronized on exact selections.
- Preserve all comparison, passport-browser, source-label, and access-classification behavior.

---

### Task 1: Add the integrated destination dropdown

**Files:**
- Modify: `index.html` search markup, CSS, helpers, and initialization
- Test: `tests/passport-dashboard.test.cjs`

**Interfaces:**
- Consumes: `DESTINATIONS`, `normalizeDestinationQuery`, `findDestination`, `renderDestination`, and `escapeHtml`.
- Produces: `exactDestinationValue(data, query): string`, `destinationOptionsMarkup(data): string`, `#destination-dropdown`, and synchronized input/select behavior.

- [ ] **Step 1: Write failing helper and structure tests**

Add:

```js
test('exact destination selection distinguishes exact names from partial typing', () => {
  const { api } = loadPage();
  assert.equal(api.exactDestinationValue(api.DESTINATIONS, 'viet nam'), 'VIET NAM');
  assert.equal(api.exactDestinationValue(api.DESTINATIONS, 'azer'), '');
  assert.equal(api.exactDestinationValue(api.DESTINATIONS, 'not a destination'), '');
});

test('integrated dropdown exposes every destination beside the search input', () => {
  const { html, api } = loadPage();
  assert.match(html, /class="destination-control-shell"/);
  assert.match(html, /<select[^>]+id="destination-dropdown"[^>]+aria-label="Choose a destination"/);
  assert.equal((api.destinationOptionsMarkup(api.DESTINATIONS).match(/<option /g) || []).length, 199);
  assert.match(html, /\.destination-dropdown-wrap\s*\{[^}]*min-height:\s*44px/s);
});
```

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```bash
node --test --test-name-pattern='exact destination selection|integrated dropdown' tests/passport-dashboard.test.cjs
```

Expected: FAIL because the helpers and select do not exist.

- [ ] **Step 3: Add pure synchronization helpers**

Add after `findDestination`:

```js
function exactDestinationValue(data, query) {
  const normalized = normalizeDestinationQuery(query);
  return data.find((row) => normalizeDestinationQuery(row.destination) === normalized)?.destination || '';
}

function destinationOptionsMarkup(data) {
  return data.map((row) => `<option value="${escapeHtml(row.destination)}"></option>`).join('');
}
```

Export both helpers through `PassportDashboard`.

- [ ] **Step 4: Add the integrated native select markup**

Replace the single input wrapper with:

```html
<div class="destination-control">
  <label for="destination-select">Destination</label>
  <div class="destination-control-shell">
    <input id="destination-select" type="search" list="destination-options" autocomplete="off" placeholder="Try Viet Nam">
    <span class="destination-dropdown-wrap">
      <select id="destination-dropdown" aria-label="Choose a destination">
        <option value="">Choose a destination</option>
      </select>
    </span>
  </div>
  <datalist id="destination-options"></datalist>
</div>
```

- [ ] **Step 5: Style the control as one integrated unit**

Replace the existing destination input rules with:

```css
.destination-control-shell { display: flex; min-width: 0; border: 1px solid #8d877c; background: var(--v2-card); }
.destination-control input { flex: 1 1 auto; min-width: 0; min-height: 44px; padding: .65rem .75rem; border: 0; background: transparent; color: var(--v2-ink); font: 600 1rem/1.2 var(--v2-serif); }
.destination-dropdown-wrap { position: relative; flex: 0 0 48px; min-height: 44px; border-left: 1px solid var(--v2-rule); }
.destination-dropdown-wrap::after { position: absolute; top: 50%; left: 50%; width: 8px; height: 8px; border-right: 2px solid var(--v2-ink); border-bottom: 2px solid var(--v2-ink); content: ""; pointer-events: none; transform: translate(-50%, -65%) rotate(45deg); }
.destination-dropdown-wrap select { position: absolute; inset: 0; width: 100%; min-height: 44px; opacity: 0; cursor: pointer; }
.destination-control-shell:focus-within { outline: 3px solid #c9843b; outline-offset: 2px; }
```

Update the shared focus selector so it no longer applies a second outline directly to the input.

- [ ] **Step 6: Synchronize both controls**

In `initDirectInterface`, populate both controls from `destinationOptionsMarkup(DESTINATIONS)`, set both to `VIET NAM`, and use:

```js
const updateFromInput = () => {
  destinationDropdown.value = exactDestinationValue(DESTINATIONS, destinationSelect.value);
  renderDestination(findDestination(DESTINATIONS, destinationSelect.value));
};

const updateFromDropdown = () => {
  if (!destinationDropdown.value) return;
  destinationSelect.value = destinationDropdown.value;
  renderDestination(findDestination(DESTINATIONS, destinationDropdown.value));
};
```

Bind `input` and `change` on the search field to `updateFromInput`, and `change` on the select to `updateFromDropdown`.

- [ ] **Step 7: Run the complete suite**

Run:

```bash
node --test tests/passport-dashboard.test.cjs && git diff --check
```

Expected: all tests pass with no whitespace errors.

- [ ] **Step 8: Verify in Safari**

At desktop and 440-pixel widths, confirm the dropdown is visually integrated, opens all destinations, has no horizontal overflow, and keeps a 44-pixel target. Select Azerbaijan and confirm the input and four-passport result update. Type `viet`, confirm partial matching still renders Viet Nam while the dropdown returns to its neutral state, then type `VIET NAM` and confirm exact synchronization.

- [ ] **Step 9: Commit the feature**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "feat: add integrated destination dropdown"
```

---

### Task 2: Integrate and publish the verified change

**Files:**
- No additional source changes expected

**Interfaces:**
- Consumes: the verified feature branch and `origin/main`.
- Produces: the same verified commit on local `master`, remote `main`, and GitHub Pages.

- [ ] **Step 1: Request read-only final review**

Review the feature range against `docs/superpowers/specs/2026-07-17-integrated-destination-dropdown-design.md`. Fix every Critical and Important issue test-first.

- [ ] **Step 2: Merge locally and rerun verification**

Fast-forward the feature branch into `master`, then run:

```bash
node --test tests/passport-dashboard.test.cjs && git diff --check
```

- [ ] **Step 3: Push without force**

```bash
git push origin master:main
```

- [ ] **Step 4: Verify GitHub Pages**

Confirm the remote `main` SHA matches local HEAD, the Pages build reaches `built`, and `https://itsrenoria.github.io/index/` contains `<title>Direct Passport Comparison</title>`.
