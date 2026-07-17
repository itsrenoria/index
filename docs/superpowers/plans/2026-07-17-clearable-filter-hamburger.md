# Clearable Browse Filter and Hamburger Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a clearable destination-style Browse filter, clickable home brand, and accessible hamburger navigation to the self-contained Passport Index page.

**Architecture:** Reuse the existing destination control shell and Browse state in `index.html`. Keep the native status select, add explicit clear/empty behavior, and replace the visible header links with a hidden semantic nav controlled by a single button.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node.js built-in test runner, Safari responsive testing.

## Global Constraints

- The page remains self-contained and dependency-free.
- Default state remains Albania + Visa free and the initial destination remains Viet Nam.
- The status clear action preserves the selected passport and renders no destination rows until another group is selected.
- The clickable brand uses `href="./"` and reloads the default state.
- Check / Reach / Compare / Browse are available only through the hamburger menu at every viewport width.
- The hamburger and all menu links retain at least 44px touch height and visible keyboard focus.
- Preserve the unrelated untracked root `.DS_Store`.

---

### Task 1: Clearable Destination-Style Access Selector

**Files:**
- Modify: `tests/passport-dashboard.test.cjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: `selectedPassportCode`, `selectedPassportGroup`, `renderPassportBrowser()`, `passportBrowserMarkup()`, and `.destination-control-shell`.
- Produces: `#passport-status-clear`; empty `selectedPassportGroup`; empty Browse markup; destination-style `.passport-status-shell`.

- [ ] **Step 1: Write failing clear-state tests**

Assert that `passportBrowserMarkup(data, 'al', '')` returns the prompt and no `.passport-browser-row`, and that `filterPassportDestinations(data, 'al', '')` returns an empty array. Assert the markup contains a `Clear access status` button and a placeholder option with `value=""`.

- [ ] **Step 2: Write failing interaction and style tests**

Assert the status select and clear button share `.destination-control-shell`, the shell has a separated arrow area, and the clear button has a 44px target. Assert the clear listener sets `selectedPassportGroup = ''`, sets the select value to empty, calls `renderPassportBrowser()`, and the shared renderer emits `Choose an access status for ${passportName(selectedPassportCode)}.` when cleared.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `node --test --test-name-pattern="clear access status|destination-style access selector|passport browser" tests/passport-dashboard.test.cjs`

Expected: failures for missing clear button, placeholder, empty-state markup, and clear listener.

- [ ] **Step 4: Implement the minimal clearable control**

Wrap the select and clear button in a `.destination-control-shell.passport-status-shell`. Add an empty placeholder option. Keep `Visa free` selected initially. Add clear-button CSS and an arrow pseudo-element separated by a rule. Update `passportBrowserMarkup` and `renderPassportBrowser` to produce the exact empty prompt and live-region message when `selectedPassportGroup` is empty. Clear without resetting `selectedPassportCode`.

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
node --test --test-name-pattern="clear access status|destination-style access selector|passport browser" tests/passport-dashboard.test.cjs
node --test tests/passport-dashboard.test.cjs
git diff --check
```

Expected: all pass and diff check is silent.

---

### Task 2: Clickable Brand and Hamburger Menu

**Files:**
- Modify: `tests/passport-dashboard.test.cjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: `.site-header`, `.bundle-masthead`, `.bundle-brand`, `.section-nav`, and existing section anchors.
- Produces: clickable `.bundle-brand`; `#site-menu-toggle`; hidden `#site-menu`; `setSiteMenuOpen(open)`; outside, link, and Escape close behavior.

- [ ] **Step 1: Write failing semantic markup tests**

Assert the brand is `<a class="bundle-brand" href="./" aria-label="Passport Index home">`. Assert the hamburger button has the exact IDs/ARIA attributes, the nav has `id="site-menu" hidden`, and the four existing links remain present inside it.

- [ ] **Step 2: Write failing interaction and responsive tests**

Assert `setSiteMenuOpen(open)` synchronizes `hidden`, `aria-expanded`, and the Open/Close accessible names. Assert button toggle, link close, Escape close/focus return, and outside pointer close listeners exist. Assert the old always-visible segmented mobile rules are absent and the popover has desktop right alignment, mobile full-width placement, and 44px menu items.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `node --test --test-name-pattern="clickable brand|hamburger|page menu" tests/passport-dashboard.test.cjs`

Expected: failures because the brand is not a link and the nav is always visible.

- [ ] **Step 4: Implement the minimal accessible menu**

Convert the brand wrapper to the specified anchor. Add the toggle button with a three-line CSS icon. Hide the semantic nav initially and style it as a bordered popover. Implement `setSiteMenuOpen(open)`, toggle click, link close, Escape close/focus return, and outside pointer close. Delete obsolete segmented-header CSS.

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
node --test --test-name-pattern="clickable brand|hamburger|page menu" tests/passport-dashboard.test.cjs
node --test tests/passport-dashboard.test.cjs
git diff --check
```

Expected: all pass and diff check is silent.

---

### Task 3: Review, Responsive QA, and Publication

**Files:**
- Modify only if QA finds a regression: `index.html`, `tests/passport-dashboard.test.cjs`

- [ ] **Step 1: Run the complete suite and diff check**

Run `node --test tests/passport-dashboard.test.cjs` and `git diff --check`.

- [ ] **Step 2: Inspect Safari at 320px, 440px, and desktop**

Verify the closed/open menu, brand link, status clear button, empty state, restored selection, touch targets, and absence of horizontal overflow.

- [ ] **Step 3: Request independent final review**

Review all feature commits against the design spec and fix every Critical or Important finding.

- [ ] **Step 4: Commit, merge, and verify again**

Use Conventional Commit messages, fast-forward into the main workspace, and rerun the full suite.

- [ ] **Step 5: Push and verify GitHub Pages**

Push to `origin/main`, wait for the exact workflow SHA to succeed, and verify the public HTML contains the clickable brand, menu toggle, and clear control.
