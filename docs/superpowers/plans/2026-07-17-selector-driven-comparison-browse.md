# Selector-driven Comparison and Browse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the six always-visible comparison cards and Browse passport buttons with shared destination-style selectors that render one selected view at a time.

**Architecture:** Keep the app self-contained in `index.html`. Add one reusable DOM selector controller for passport and status choices, then connect independent comparison and Browse state to the existing calculation and markup helpers. The existing test file remains the regression boundary and gains focused selector, empty-state, rendering, and responsive assertions.

**Tech Stack:** Semantic HTML, mobile-first CSS, vanilla JavaScript, Node.js built-in test runner.

## Global Constraints

- Both sections initially show selectors only and no result card or rows.
- Every new selector matches the Destination control's border, background, height, focus outline, clear action, dropdown arrow, and listbox treatment.
- Direct comparisons render only after two different passports are selected.
- The second comparison selector remains disabled until the first passport is selected.
- Browse renders all 199 destinations immediately after a passport is selected.
- Browse Access Status starts disabled at `ALL`; options are `ALL`, `VISA FREE`, `ON ARRIVAL`, and `VISA NEEDED`.
- Exact destination statuses remain visible in Browse rows.
- Preserve the embedded Passport Index data, access weighting, Passport reach, Check a Destination, and overall editorial style.
- Keep the page dependency-free and self-contained.

---

### Task 1: Reusable choice selector

**Files:**
- Modify: `index.html:70-87` selector CSS
- Modify: `index.html:5073-5221` interface initialization
- Test: `tests/passport-dashboard.test.cjs`

**Interfaces:**
- Consumes: option records shaped as `{ value: string, label: string, disabled?: boolean }`.
- Produces: `choiceOptionsMarkup(options, selectedValue, optionIdPrefix = 'choice-option'): string` and `initChoiceSelector(control, config): ChoiceSelector`.
- `ChoiceSelector` exposes `value(): string`, `setValue(value, notify = false): void`, `setDisabled(disabled): void`, `refresh(): void`, and `close(): void`.
- `config` contains `options(): ChoiceOption[]`, `placeholder: string`, `initialValue?: string`, and `onChange(value: string): void`.

- [ ] **Step 1: Write failing selector markup and controller tests**

Add tests that require the generic helper, semantic controls, and shared style:

```js
test('choice selector markup exposes selected and disabled options', () => {
  const { api } = loadPage();
  const markup = api.choiceOptionsMarkup([
    { value: 'al', label: 'Albania' },
    { value: 'gr', label: 'Greece', disabled: true },
  ], 'al');
  assert.match(markup, /role="option"[^>]+data-value="al"[^>]+aria-selected="true"/);
  assert.match(markup, /role="option"[^>]+data-value="gr"[^>]+aria-disabled="true"/);
});

test('shared choice selectors match the Destination control', () => {
  const { html } = loadPage();
  assert.match(html, /\.choice-selector\s*\{[^}]*position:\s*relative/s);
  assert.match(html, /\.choice-selector-shell\s*\{[^}]*border:\s*1px solid #8d877c[^}]*background:\s*var\(--v2-card\)/s);
  assert.match(html, /\.choice-selector-trigger\s*\{[^}]*min-height:\s*44px/s);
  assert.match(html, /\.choice-selector-options\s*\{[^}]*position:\s*absolute[^}]*top:\s*calc\(100% \+ 4px\)/s);
  assert.match(html, /function initChoiceSelector\(control, config\)/);
  assert.match(html, /event\.key === 'ArrowDown'[\s\S]*?event\.key === 'ArrowUp'[\s\S]*?event\.key === 'Enter'[\s\S]*?event\.key === 'Escape'/);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
node --test --test-name-pattern='choice selector' tests/passport-dashboard.test.cjs
```

Expected: FAIL because `choiceOptionsMarkup`, `.choice-selector`, and `initChoiceSelector` do not exist.

- [ ] **Step 3: Add shared selector HTML/CSS primitives**

Add these reusable classes beside the Destination control styles:

```css
.choice-selector { position: relative; min-width: 0; }
.choice-selector label { display: block; margin-bottom: .45rem; font: 800 .62rem/1.2 var(--v2-mono); letter-spacing: .09em; text-transform: uppercase; }
.choice-selector-shell { display: flex; min-width: 0; border: 1px solid #8d877c; background: var(--v2-card); }
.choice-selector-shell:focus-within { outline: 3px solid #c9843b; outline-offset: 2px; }
.choice-selector-trigger { flex: 1 1 auto; min-width: 0; min-height: 44px; padding: .65rem .75rem; overflow: hidden; border: 0; background: transparent; color: var(--v2-ink); font: 600 1rem/1.2 var(--v2-serif); text-align: left; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.choice-selector-trigger:disabled { color: var(--v2-muted); cursor: not-allowed; }
.choice-selector-clear, .choice-selector-arrow { position: relative; flex: 0 0 44px; min-width: 44px; min-height: 44px; border: 0; border-left: 1px solid var(--v2-rule); background: transparent; color: var(--v2-ink); cursor: pointer; }
.choice-selector-clear[hidden] { display: none; }
.choice-selector-arrow::after { position: absolute; top: 50%; left: 50%; width: 8px; height: 8px; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor; content: ""; transform: translate(-50%, -65%) rotate(45deg); }
.choice-selector-options { position: absolute; z-index: 6; top: calc(100% + 4px); right: 0; left: 0; max-height: min(55vh, 320px); margin: 0; padding: .3rem; overflow-y: auto; border: 1px solid var(--v2-ink); background: var(--v2-card); box-shadow: 6px 7px 0 rgba(23,33,29,.12); list-style: none; }
.choice-selector-options[hidden] { display: none; }
.choice-selector-option { min-height: 42px; padding: .7rem .75rem; border-bottom: 1px solid var(--v2-rule); font: 700 .84rem/1.25 var(--v2-sans); cursor: pointer; }
.choice-selector-option[aria-disabled="true"] { color: var(--v2-muted); cursor: not-allowed; opacity: .55; }
.choice-selector-option.is-active { background: #eee3d2; outline: 2px solid var(--v2-green); outline-offset: -2px; }
```

Each concrete selector uses this structure:

```html
<div class="choice-selector" data-choice-selector>
  <label for="example-selector">Example</label>
  <div class="choice-selector-shell">
    <button class="choice-selector-trigger" id="example-selector" type="button" role="combobox" aria-expanded="false" aria-controls="example-options">Choose an option</button>
    <button class="choice-selector-clear" type="button" aria-label="Clear example" hidden>×</button>
    <button class="choice-selector-arrow" type="button" aria-label="Browse example options" aria-expanded="false" aria-controls="example-options"></button>
  </div>
  <ul class="choice-selector-options" id="example-options" role="listbox" hidden></ul>
</div>
```

- [ ] **Step 4: Implement option markup and controller behavior**

Add the helper near `destinationOptionsMarkup`:

```js
function choiceOptionsMarkup(options, selectedValue, optionIdPrefix = 'choice-option') {
  return options.map((option, index) => `<li class="choice-selector-option" id="${escapeHtml(optionIdPrefix)}-${index}" role="option" data-value="${escapeHtml(option.value)}" aria-selected="${option.value === selectedValue}" aria-disabled="${Boolean(option.disabled)}" tabindex="-1">${escapeHtml(option.label)}</li>`).join('');
}
```

Add `initChoiceSelector(control, config)` inside the app script. It must:

```js
function initChoiceSelector(control, config) {
  const trigger = control.querySelector('.choice-selector-trigger');
  const clear = control.querySelector('.choice-selector-clear');
  const arrow = control.querySelector('.choice-selector-arrow');
  const listbox = control.querySelector('.choice-selector-options');
  let selectedValue = config.initialValue || '';
  let activeIndex = -1;
  let disabled = false;

  const options = () => config.options();
  const selectedOption = () => options().find(({ value }) => value === selectedValue);
  const sync = () => {
    trigger.textContent = selectedOption()?.label || config.placeholder;
    clear.hidden = !selectedValue || disabled;
    trigger.disabled = disabled;
    arrow.disabled = disabled;
    listbox.innerHTML = choiceOptionsMarkup(options(), selectedValue, `${listbox.id}-option`);
  };
  const close = () => {
    listbox.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    arrow.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
    activeIndex = -1;
  };
  const open = () => {
    if (disabled) return;
    listbox.innerHTML = choiceOptionsMarkup(options(), selectedValue, `${listbox.id}-option`);
    listbox.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    arrow.setAttribute('aria-expanded', 'true');
  };
  const choose = (value, notify = true) => {
    const option = options().find((item) => item.value === value && !item.disabled);
    if (value && !option) return;
    selectedValue = value;
    sync();
    close();
    if (notify) config.onChange(selectedValue);
  };

  trigger.addEventListener('click', open);
  arrow.addEventListener('click', () => listbox.hidden ? open() : close());
  clear.addEventListener('click', () => choose(''));
  listbox.addEventListener('click', (event) => {
    const option = event.target.closest('[data-value]');
    if (option && option.getAttribute('aria-disabled') !== 'true') choose(option.dataset.value);
  });
  control.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { close(); trigger.focus(); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (listbox.hidden) open();
      const enabledOptions = Array.from(listbox.querySelectorAll('[role="option"]')).filter((option) => option.getAttribute('aria-disabled') !== 'true');
      if (!enabledOptions.length) return;
      activeIndex = event.key === 'ArrowDown'
        ? (activeIndex + 1) % enabledOptions.length
        : (activeIndex <= 0 ? enabledOptions.length - 1 : activeIndex - 1);
      listbox.querySelectorAll('[role="option"]').forEach((option) => option.classList.remove('is-active'));
      const activeOption = enabledOptions[activeIndex];
      activeOption.classList.add('is-active');
      trigger.setAttribute('aria-activedescendant', activeOption.id);
      activeOption.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      const enabledOptions = Array.from(listbox.querySelectorAll('[role="option"]')).filter((option) => option.getAttribute('aria-disabled') !== 'true');
      const activeOption = enabledOptions[activeIndex];
      if (activeOption) choose(activeOption.dataset.value);
    }
  });
  control.addEventListener('focusout', (event) => {
    if (!control.contains(event.relatedTarget)) close();
  });
  document.addEventListener('pointerdown', (event) => {
    if (!control.contains(event.target)) close();
  });
  sync();

  return {
    value: () => selectedValue,
    setValue: (value, notify = false) => choose(value, notify),
    setDisabled: (nextDisabled) => { disabled = nextDisabled; sync(); if (disabled) close(); },
    refresh: sync,
    close,
  };
}
```

- [ ] **Step 5: Export the markup helper and verify GREEN**

Add `choiceOptionsMarkup` to `globalThis.PassportDashboard`, then run:

```bash
node --test --test-name-pattern='choice selector' tests/passport-dashboard.test.cjs
node --test tests/passport-dashboard.test.cjs
```

Expected: focused tests PASS; full suite remains green.

- [ ] **Step 6: Commit the shared selector**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "feat: add reusable choice selector"
```

---

### Task 2: On-demand direct comparison

**Files:**
- Modify: `index.html:108-132` comparison CSS
- Modify: `index.html:232-238` comparison markup
- Modify: `index.html:5058-5112` comparison state and initialization
- Test: `tests/passport-dashboard.test.cjs`

**Interfaces:**
- Consumes: `PASSPORTS`, `comparisonCardMarkup(definition)`, and `initChoiceSelector`.
- Produces: `selectedComparisonLeft: string`, `selectedComparisonRight: string`, and `renderSelectedComparison(): void`.

- [ ] **Step 1: Replace static-comparison expectations with failing on-demand tests**

Update the former all-comparisons test and add:

```js
test('Direct comparisons starts empty with two destination-style passport selectors', () => {
  const { html } = loadPage();
  assert.match(html, /id="comparison-left-selector"/);
  assert.match(html, /id="comparison-right-selector"[^>]+disabled/);
  assert.match(html, /id="comparison-status"[^>]+aria-live="polite"/);
  assert.match(html, /id="direct-comparisons"[\s\S]*?Choose two passports to compare\./);
  assert.doesNotMatch(html, /DIRECT_COMPARISONS\.map\(comparisonCardMarkup\)/);
});

test('Direct comparisons renders one card only for two distinct passports', () => {
  const { html } = loadPage();
  assert.match(html, /let selectedComparisonLeft = '';/);
  assert.match(html, /let selectedComparisonRight = '';/);
  assert.match(html, /function renderSelectedComparison\(\)[\s\S]*?!selectedComparisonLeft \|\| !selectedComparisonRight[\s\S]*?Choose two passports to compare\./);
  assert.match(html, /comparisonCardMarkup\(\{[\s\S]*?left: selectedComparisonLeft,[\s\S]*?right: selectedComparisonRight/);
  assert.match(html, /disabled: passport\.code === selectedComparisonLeft/);
  assert.match(html, /comparisonRightSelector\.setDisabled\(!selectedComparisonLeft\)/);
  assert.match(html, /selectedComparisonRight === selectedComparisonLeft[\s\S]*?setValue\(''\)/);
});
```

- [ ] **Step 2: Run comparison tests and verify RED**

Run:

```bash
node --test --test-name-pattern='Direct comparisons' tests/passport-dashboard.test.cjs
```

Expected: FAIL because the section still renders six cards and has no passport selectors.

- [ ] **Step 3: Replace the section markup with two selectors and one result host**

Use:

```html
<div class="selector-grid comparison-selector-grid">
  <div class="choice-selector" id="comparison-left-control" data-choice-selector>
    <label for="comparison-left-selector">First passport</label>
    <div class="choice-selector-shell">
      <button class="choice-selector-trigger" id="comparison-left-selector" type="button" role="combobox" aria-expanded="false" aria-controls="comparison-left-options">Choose passport</button>
      <button class="choice-selector-clear" type="button" aria-label="Clear first passport" hidden>×</button>
      <button class="choice-selector-arrow" type="button" aria-label="Browse first passport options" aria-expanded="false" aria-controls="comparison-left-options"></button>
    </div>
    <ul class="choice-selector-options" id="comparison-left-options" role="listbox" hidden></ul>
  </div>
  <div class="choice-selector" id="comparison-right-control" data-choice-selector>
    <label for="comparison-right-selector">Second passport</label>
    <div class="choice-selector-shell">
      <button class="choice-selector-trigger" id="comparison-right-selector" type="button" role="combobox" aria-expanded="false" aria-controls="comparison-right-options" disabled>Choose passport</button>
      <button class="choice-selector-clear" type="button" aria-label="Clear second passport" hidden>×</button>
      <button class="choice-selector-arrow" type="button" aria-label="Browse second passport options" aria-expanded="false" aria-controls="comparison-right-options" disabled></button>
    </div>
    <ul class="choice-selector-options" id="comparison-right-options" role="listbox" hidden></ul>
  </div>
</div>
<p class="live-status" id="comparison-status" aria-live="polite" aria-atomic="true">Choose two passports to compare.</p>
<div class="comparison-grid" id="direct-comparisons"><p class="section-empty">Choose two passports to compare.</p></div>
```

- [ ] **Step 4: Add independent comparison state and rendering**

Implement:

```js
let selectedComparisonLeft = '';
let selectedComparisonRight = '';

function renderSelectedComparison() {
  const host = document.querySelector('#direct-comparisons');
  const status = document.querySelector('#comparison-status');
  if (!selectedComparisonLeft || !selectedComparisonRight) {
    host.innerHTML = '<p class="section-empty">Choose two passports to compare.</p>';
    status.textContent = 'Choose two passports to compare.';
    return;
  }
  host.innerHTML = comparisonCardMarkup({
    id: `${selectedComparisonLeft}-${selectedComparisonRight}`,
    left: selectedComparisonLeft,
    right: selectedComparisonRight,
  });
  status.textContent = `Comparing ${passportName(selectedComparisonLeft)} and ${passportName(selectedComparisonRight)}.`;
}
```

Initialize both selectors as follows:

```js
const passportSelectorOptions = () => PASSPORTS.map(({ code, name }) => ({ value: code, label: name }));
let comparisonRightSelector;

const comparisonLeftSelector = initChoiceSelector(
  document.querySelector('#comparison-left-control'),
  {
    options: passportSelectorOptions,
    placeholder: 'Choose passport',
    onChange: (value) => {
      selectedComparisonLeft = value;
      if (!selectedComparisonLeft || selectedComparisonRight === selectedComparisonLeft) {
        selectedComparisonRight = '';
        comparisonRightSelector.setValue('');
      }
      comparisonRightSelector.setDisabled(!selectedComparisonLeft);
      comparisonRightSelector.refresh();
      renderSelectedComparison();
    },
  },
);

comparisonRightSelector = initChoiceSelector(
  document.querySelector('#comparison-right-control'),
  {
    options: () => PASSPORTS.map(({ code, name }) => ({
      value: code,
      label: name,
      disabled: code === selectedComparisonLeft,
    })),
    placeholder: 'Choose passport',
    onChange: (value) => {
      selectedComparisonRight = value;
      renderSelectedComparison();
    },
  },
);
comparisonRightSelector.setDisabled(true);
```

Remove `renderDirectComparisons()` and its initialization call. Keep `DIRECT_COMPARISONS` only because existing data-partition tests use it as the canonical six-pair fixture.

- [ ] **Step 5: Add mobile-first control layout and verify GREEN**

Add:

```css
.selector-grid { display: grid; gap: .8rem; margin-bottom: 1rem; }
.section-empty { margin: 0; padding: 1.2rem; border: 1px solid var(--v2-rule); background: var(--v2-card); color: var(--v2-muted); font-size: .8rem; }
@media (min-width: 760px) {
  .comparison-selector-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
```

Run:

```bash
node --test --test-name-pattern='Direct comparisons|direct comparison|comparison markup' tests/passport-dashboard.test.cjs
node --test tests/passport-dashboard.test.cjs
```

Expected: comparison tests and full suite PASS.

- [ ] **Step 6: Commit the comparison view**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "feat: make comparisons selectable"
```

---

### Task 3: On-demand Browse with ALL

**Files:**
- Modify: `index.html:133-160` Browse CSS
- Modify: `index.html:240-266` Browse markup
- Modify: `index.html:4974-5050` Browse helpers
- Modify: `index.html:5062-5221` Browse state and initialization
- Test: `tests/passport-dashboard.test.cjs`

**Interfaces:**
- Consumes: `PASSPORTS`, `BROWSER_ACCESS_GROUPS`, `filterPassportDestinations`, `passportBrowserMarkup`, and `initChoiceSelector`.
- Produces: `selectedPassportCode: string`, `selectedPassportGroup: 'all' | 'visa-free' | 'on-arrival' | 'visa-needed'`, and `renderPassportBrowser(): void`.

- [ ] **Step 1: Write failing empty-state, ALL, and selector tests**

Replace button-specific Browse tests with:

```js
test('Browse starts empty with Passport and disabled ALL status selectors', () => {
  const { html } = loadPage();
  assert.match(html, /id="passport-browser-selector"/);
  assert.match(html, /id="passport-status-selector"[^>]+disabled/);
  assert.match(html, /id="passport-browser-results"[\s\S]*?Choose a passport to view destinations\./);
  assert.doesNotMatch(html, /class="passport-choice"/);
  assert.match(html, /let selectedPassportCode = '';/);
  assert.match(html, /let selectedPassportGroup = 'all';/);
});

test('Browse ALL includes every exact-status destination', () => {
  const { api } = loadPage();
  const rows = api.filterPassportDestinations(api.DESTINATIONS, 'al', 'all');
  const markup = api.passportBrowserMarkup(api.DESTINATIONS, 'al', 'all');
  assert.equal(rows.length, 199);
  assert.equal((markup.match(/class="passport-browser-row"/g) || []).length, 199);
  assert.match(markup, /access-pill home">Home country/);
  assert.match(markup, /access-pill not-admitted">Not admitted/);
});

test('Browse passport selection enables status and clearing resets ALL', () => {
  const { html } = loadPage();
  assert.match(html, /passportSelector = initChoiceSelector/);
  assert.match(html, /passportStatusSelector = initChoiceSelector/);
  assert.match(html, /selectedPassportCode = value;[\s\S]*?passportStatusSelector\.setDisabled\(!selectedPassportCode\)/);
  assert.match(html, /if \(!selectedPassportCode\)[\s\S]*?selectedPassportGroup = 'all';[\s\S]*?passportStatusSelector\.setValue\('all'\)/);
});
```

- [ ] **Step 2: Run Browse tests and verify RED**

Run:

```bash
node --test --test-name-pattern='Browse starts|Browse ALL|Browse passport selection' tests/passport-dashboard.test.cjs
```

Expected: FAIL because Browse still has four buttons, starts with Albania, and has no `all` group.

- [ ] **Step 3: Extend filtering and markup for ALL and empty passport state**

Change groups and filtering to:

```js
const BROWSER_ACCESS_GROUPS = [
  ['all', 'All'],
  ['visa-free', 'Visa free'],
  ['on-arrival', 'On arrival'],
  ['visa-needed', 'Visa needed'],
];

function filterPassportDestinations(data, passportCode, group) {
  if (!passportCode) return [];
  if (group === 'all') return data;
  const groupStatuses = {
    'visa-free': ['visa-free', 'eta', 'evisitor', 'entry-form'],
    'on-arrival': ['on-arrival'],
    'visa-needed': ['evisa', 'visa-needed'],
  }[group] || [];
  return data.filter((row) => groupStatuses.includes(accessStatus(row[passportCode])));
}
```

Update `passportBrowserMarkup`:

```js
function passportBrowserMarkup(data, passportCode, group = 'all') {
  if (!passportCode) return '<p class="section-empty">Choose a passport to view destinations.</p>';
  const passport = PASSPORTS.find(({ code }) => code === passportCode);
  if (!passport) return '';
  const filteredRows = filterPassportDestinations(data, passportCode, group);
  const rows = filteredRows.map((row) => {
    const entry = row[passportCode];
    const status = accessStatus(entry);
    return `<li class="passport-browser-row"><span class="destination-name">${escapeHtml(row.destination)}</span><span class="passport-browser-status"><span class="passport-browser-raw">${escapeHtml(entry.raw)}</span><span class="passport-browser-badges"><span class="access-pill ${status}">${statusLabel(status)}</span></span></span></li>`;
  }).join('');
  return `<div class="passport-browser-summary"><strong>${escapeHtml(passport.name)}</strong><span>${filteredRows.length} destinations</span></div><ol class="passport-browser-list">${rows}</ol>`;
}
```

- [ ] **Step 4: Replace Browse controls with shared selectors**

Use a `.selector-grid.browser-selector-grid` containing:

```html
<div class="choice-selector" id="passport-browser-control" data-choice-selector>
  <label for="passport-browser-selector">Passport</label>
  <div class="choice-selector-shell">
    <button class="choice-selector-trigger" id="passport-browser-selector" type="button" role="combobox" aria-expanded="false" aria-controls="passport-browser-options">Choose passport</button>
    <button class="choice-selector-clear" type="button" aria-label="Clear passport" hidden>×</button>
    <button class="choice-selector-arrow" type="button" aria-label="Browse passport options" aria-expanded="false" aria-controls="passport-browser-options"></button>
  </div>
  <ul class="choice-selector-options" id="passport-browser-options" role="listbox" hidden></ul>
</div>
<div class="choice-selector" id="passport-status-control" data-choice-selector>
  <label for="passport-status-selector">Access status</label>
  <div class="choice-selector-shell">
    <button class="choice-selector-trigger" id="passport-status-selector" type="button" role="combobox" aria-expanded="false" aria-controls="passport-status-options" disabled>All</button>
    <button class="choice-selector-clear" type="button" aria-label="Reset access status" hidden>×</button>
    <button class="choice-selector-arrow" type="button" aria-label="Browse access status options" aria-expanded="false" aria-controls="passport-status-options" disabled></button>
  </div>
  <ul class="choice-selector-options" id="passport-status-options" role="listbox" hidden></ul>
</div>
```

Initialize state and selectors:

```js
let selectedPassportCode = '';
let selectedPassportGroup = 'all';

const passportStatusSelector = initChoiceSelector(
  document.querySelector('#passport-status-control'),
  {
    options: () => BROWSER_ACCESS_GROUPS.map(([value, label]) => ({ value, label })),
    placeholder: 'All',
    initialValue: 'all',
    onChange: (value) => {
      selectedPassportGroup = value || 'all';
      if (!value) passportStatusSelector.setValue('all');
      renderPassportBrowser();
    },
  },
);
passportStatusSelector.setDisabled(true);

const passportSelector = initChoiceSelector(
  document.querySelector('#passport-browser-control'),
  {
    options: () => PASSPORTS.map(({ code, name }) => ({ value: code, label: name })),
    placeholder: 'Choose passport',
    onChange: (value) => {
      selectedPassportCode = value;
      passportStatusSelector.setDisabled(!selectedPassportCode);
      if (!selectedPassportCode) {
        selectedPassportGroup = 'all';
        passportStatusSelector.setValue('all');
      }
      renderPassportBrowser();
    },
  },
);
```

`renderPassportBrowser()` must emit `Choose a passport to view destinations.` when no passport is selected and `Showing ${rows.length} destinations for ${passportName(selectedPassportCode)}.` otherwise.

- [ ] **Step 5: Add responsive Browse selector layout and verify GREEN**

Remove `.passport-choices`, `.passport-choice`, `.passport-status-shell`, and the old native-select CSS. Add:

```css
@media (min-width: 760px) {
  .browser-selector-grid { grid-template-columns: minmax(0, 1fr) minmax(14rem, .65fr); }
}
```

Run:

```bash
node --test --test-name-pattern='Browse|passport browser' tests/passport-dashboard.test.cjs
node --test tests/passport-dashboard.test.cjs
git diff --check
```

Expected: Browse tests and full suite PASS; no whitespace errors.

- [ ] **Step 6: Commit the Browse view**

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "feat: make passport browsing selectable"
```

---

### Task 4: Responsive interaction QA and final cleanup

**Files:**
- Modify if required: `index.html`
- Modify if required: `tests/passport-dashboard.test.cjs`

**Interfaces:**
- Consumes: the completed shared selectors, comparison state, and Browse state.
- Produces: a verified, self-contained selector-driven page ready for integration.

- [ ] **Step 1: Run the final automated verification**

Run:

```bash
node --test tests/passport-dashboard.test.cjs
git diff --check
rg -n "passport-choice|passport-status-filter|renderDirectComparisons\(\)" index.html tests/passport-dashboard.test.cjs
```

Expected: all tests PASS; diff check exits zero; the obsolete identifiers return no matches.

- [ ] **Step 2: Run local desktop interaction QA**

Serve the page locally and verify in Safari or the in-app browser:

```bash
python3 -m http.server 8765
```

At desktop width verify:

- Direct comparisons starts with two empty side-by-side selectors and one prompt.
- One selection leaves the prompt; two distinct selections render exactly one card.
- Changing and clearing either passport updates or hides the card.
- Browse starts empty with ALL disabled.
- Choosing a passport renders 199 rows and enables ALL.
- Each grouped status filter updates the count and keeps exact badges.
- Every selector opens, closes, clears, and remains within the viewport.

- [ ] **Step 3: Run 390px mobile interaction QA**

Verify:

- Comparison and Browse selectors stack without horizontal scrolling.
- Dropdowns remain on-screen and above results.
- 44px controls are comfortably tappable.
- Results retain existing mobile typography and spacing.
- Arrow navigation, Enter, Escape, outside click, and focus-leave dismissal work.

- [ ] **Step 4: Request independent code review**

Review the full feature range against:

- The approved spec at `docs/superpowers/specs/2026-07-17-selector-driven-comparison-browse-design.md`.
- Shared-selector accessibility and disabled states.
- Empty initial rendering and one-card-only behavior.
- ALL including Home country and Not admitted.
- Removal of obsolete button/native-select code.

Fix every Critical and Important issue, then re-run the focused test and full suite.

- [ ] **Step 5: Commit any QA fixes**

If QA or review required changes:

```bash
git add index.html tests/passport-dashboard.test.cjs
git commit -m "fix: polish selectable passport views"
```

If no files changed, do not create an empty commit.

- [ ] **Step 6: Verify the final branch state**

Run:

```bash
node --test tests/passport-dashboard.test.cjs
git diff --check
git status --short
git log --oneline -6
```

Expected: all tests PASS, diff check exits zero, and only the pre-existing root `.DS_Store` remains untracked outside the feature commits.
