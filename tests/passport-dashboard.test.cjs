const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');

function loadPage() {
  const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
  const script = html.match(/<script id="app">([\s\S]*?)<\/script>/);
  assert.ok(script, 'index.html should contain the embedded application script');

  const context = { console, Intl, URLSearchParams };
  vm.runInNewContext(script[1], context);
  return { html, api: context.PassportDashboard };
}

test('access weights group convenient and visa-needed entries', () => {
  const { api } = loadPage();
  for (const type of ['home', 'visa-free', 'visa-on-arrival', 'eta', 'registration']) {
    assert.equal(api.accessWeight({ type, days: 7 }), 'positive', type);
    assert.equal(api.accessWeight({ type, days: 360 }), 'positive', type);
  }
  for (const type of ['evisa', 'visa-required', 'not-admitted']) {
    assert.equal(api.accessWeight({ type }), 'negative', type);
  }
  assert.equal(api.accessWeight({ type: 'registration' }), 'positive');
  assert.equal(api.accessWeight({ type: 'not-admitted' }), 'negative');
});

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

test('superseded helpers and unused styles are absent', () => {
  const { html, api } = loadPage();
  assert.equal(api.compareEntries, undefined);
  assert.equal(api.rowOutcome, undefined);
  assert.equal(api.classifyEntry, undefined);
  assert.doesNotMatch(html, /body::before|\.sr-only\s*\{/);
});

test('the embedded dataset contains every retrieved destination exactly once', () => {
  const { api } = loadPage();
  assert.equal(api.DESTINATIONS.length, 199);
  assert.equal(new Set(api.DESTINATIONS.map((row) => row.destination)).size, 199);
  assert.deepEqual(
    Array.from(api.DESTINATIONS, ({ destination }) => destination),
    Array.from(api.DESTINATIONS, ({ destination }) => destination)
      .sort(new Intl.Collator('en', { sensitivity: 'base' }).compare),
  );
  assert.equal(
    api.DESTINATIONS.find((row) => row.destination === 'AZERBAIJAN').al.raw,
    'VISA-FREE 90',
  );
  assert.equal(
    api.DESTINATIONS.find((row) => row.destination === 'AUSTRALIA').gr.raw,
    'EVISITORS 90',
  );
});

test('destination lookup supports case-insensitive names and useful partial queries', () => {
  const { api } = loadPage();
  assert.equal(api.findDestination(api.DESTINATIONS, 'viet nam').destination, 'VIET NAM');
  assert.equal(api.findDestination(api.DESTINATIONS, 'azer').destination, 'AZERBAIJAN');
  assert.equal(api.findDestination(api.DESTINATIONS, 'nam').destination, 'NAMIBIA');
  assert.equal(api.findDestination(api.DESTINATIONS, 'et nam').destination, 'VIET NAM');
  assert.equal(api.findDestination(api.DESTINATIONS, 'not a destination'), null);
});

test('destination options filter partial typing and expose every destination when empty', () => {
  const { api } = loadPage();
  assert.deepEqual(
    Array.from(api.filterDestinationOptions(api.DESTINATIONS, 'azer'), ({ destination }) => destination),
    ['AZERBAIJAN'],
  );
  assert.equal(api.filterDestinationOptions(api.DESTINATIONS, '').length, 199);
  assert.equal(api.filterDestinationOptions(api.DESTINATIONS, 'not a destination').length, 0);
});

test('typing and browsing share one integrated destination listbox', () => {
  const { html, api } = loadPage();
  assert.match(html, /class="destination-control-shell"/);
  assert.match(html, /<input[^>]+id="destination-select"[^>]+role="combobox"[^>]+aria-controls="destination-options"/);
  assert.match(html, /<button[^>]+id="destination-dropdown"[^>]+aria-label="Browse destinations"/);
  assert.match(html, /<ul[^>]+id="destination-options"[^>]+role="listbox"/);
  const optionsMarkup = api.destinationOptionsMarkup(api.DESTINATIONS);
  assert.equal((optionsMarkup.match(/role="option"/g) || []).length, 199);
  assert.match(optionsMarkup, /data-destination="VIET NAM"[^>]*>VIET NAM<\/li>/);
  assert.match(html, /\.destination-dropdown-trigger\s*\{[^}]*min-height:\s*44px/s);
  assert.match(html, /\.destination-options\s*\{[^}]*position:\s*absolute[^}]*top:\s*calc\(100%\s*\+\s*4px\)/s);
  assert.doesNotMatch(html, /<select[^>]+id="destination-dropdown"|<datalist/);
});

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

test('destination and comparison markup preserve exact source labels and direct statuses', () => {
  const { api } = loadPage();
  const vietNam = api.findDestination(api.DESTINATIONS, 'viet nam');
  const searchMarkup = api.destinationResultMarkup(vietNam);
  const comparisonMarkup = api.comparisonCardMarkup({ id: 'de-us', left: 'de', right: 'us' });

  assert.match(searchMarkup, /VISA-FREE 45/);
  assert.match(searchMarkup, /EVISA 90/);
  assert.match(searchMarkup, /rank-pill positive[^>]*>Positive/);
  assert.match(searchMarkup, /rank-pill negative[^>]*>Negative/);
  assert.match(searchMarkup, /access-pill visa-free[^>]*>Visa free/);
  assert.match(searchMarkup, /access-pill evisa[^>]*>eVisa/);
  assert.match(comparisonMarkup, /VIET NAM/);
  assert.match(comparisonMarkup, /Germany:<\/b> VISA-FREE 45/);
  assert.match(comparisonMarkup, /United States:<\/b> EVISA 90/);
});

test('comparison markup separates shared metrics, passport headers, and destinations', () => {
  const { html, api } = loadPage();
  const markup = api.comparisonCardMarkup({ id: 'al-gr', left: 'al', right: 'gr' });
  assert.equal((markup.match(/class="metric-tile/g) || []).length, 2);
  assert.equal((markup.match(/class="unique-header/g) || []).length, 2);
  assert.equal((markup.match(/class="unique-body"/g) || []).length, 2);
  assert.match(markup, /unique-eyebrow">Unique access/);
  assert.match(markup, /unique-count">1 destination/);
  assert.match(html, /\.metric-tile\.metric-positive\s*\{[^}]*border-top:/s);
  assert.match(html, /\.metric-tile\.metric-negative\s*\{[^}]*border-top:/s);
  assert.match(html, /\.unique-header\s*\{[^}]*background:/s);
});

test('passport summaries reconcile positive and negative access to 199', () => {
  const { api } = loadPage();
  for (const passport of api.PASSPORTS) {
    const summary = api.summarizePassport(api.DESTINATIONS, passport.code);
    assert.equal(summary.positive + summary.negative, 199);
    assert.equal(summary.total, 199);
  }
});

test('passport reach cards use circular country flags', () => {
  const { html, api } = loadPage();
  assert.deepEqual(Array.from(api.PASSPORTS, ({ flag }) => flag), ['🇦🇱', '🇬🇷', '🇩🇪', '🇺🇸']);
  for (const passport of api.PASSPORTS) {
    assert.match(api.passportCardMarkup(passport, api.DESTINATIONS), new RegExp(`class="bundle-seal"[^>]*>${passport.flag}<`));
  }
  assert.match(html, /\.bundle-seal\s*\{[^}]*border-radius:\s*50%/s);
});

test('passport reach reports exact accessible-abroad counts', () => {
  const { api } = loadPage();
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
    const card = api.passportCardMarkup(passport, api.DESTINATIONS);
    assert.match(card, new RegExp(`<strong>${summary.accessibleAbroad}<\\/strong><span>accessible abroad<\\/span>`));
  }
});

test('destination search omits the home passport while retaining the other three', () => {
  const { api } = loadPage();
  for (const passport of api.PASSPORTS) {
    const homeRow = api.DESTINATIONS.find((row) => row[passport.code].type === 'home');
    assert.ok(homeRow, passport.code);
    const markup = api.destinationResultMarkup(homeRow);
    assert.equal((markup.match(/class="destination-result"/g) || []).length, 3, passport.code);
    assert.doesNotMatch(markup, new RegExp(`<strong>${passport.name}<\\/strong>`), passport.code);
    for (const otherPassport of api.PASSPORTS.filter(({ code }) => code !== passport.code)) {
      assert.match(markup, new RegExp(`<strong>${otherPassport.name}<\\/strong>`), `${passport.code}/${otherPassport.code}`);
    }
  }
});

test('six direct comparison definitions cover every passport pairing once', () => {
  const { api } = loadPage();
  assert.deepEqual(
    Array.from(api.DIRECT_COMPARISONS, ({ left, right }) => [left, right]),
    [['al', 'gr'], ['al', 'de'], ['al', 'us'], ['gr', 'de'], ['gr', 'us'], ['de', 'us']],
  );
});

test('each direct comparison partitions all destinations exactly once', () => {
  const { api } = loadPage();
  for (const { id, left, right } of api.DIRECT_COMPARISONS) {
    const result = api.comparePassports(api.DESTINATIONS, left, right);
    const partition = [
      ...result.leftOnly,
      ...result.rightOnly,
      ...result.bothPositive,
      ...result.bothNegative,
    ];
    assert.equal(partition.length, 199, id);
    assert.equal(new Set(partition.map((row) => row.destination)).size, 199, id);
  }
});

test('direct comparison rows land in the correct positive and negative buckets', () => {
  const { api } = loadPage();
  const result = api.comparePassports(api.DESTINATIONS, 'al', 'gr');
  const destinations = (rows) => new Set(rows.map((row) => row.destination));

  assert.ok(destinations(result.leftOnly).has('AZERBAIJAN'));
  assert.ok(destinations(result.rightOnly).has('ANGOLA'));
  assert.ok(destinations(result.bothPositive).has('ALBANIA'));
  assert.ok(destinations(result.bothNegative).has('AFGHANISTAN'));
});

test('page contains destination-first search and direct comparisons without bundle controls', () => {
  const { html } = loadPage();
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /id="destination-search"/);
  assert.match(html, /<label for="destination-select">/);
  assert.match(html, /<input[^>]+id="destination-select"[^>]+type="search"[^>]+role="combobox"/);
  assert.match(html, /<ul[^>]+id="destination-options"[^>]+role="listbox"/);
  assert.match(html, /id="passport-cards"/);
  assert.match(html, /id="direct-comparisons"/);
  assert.doesNotMatch(html, /id="scenario-select"/);
  assert.doesNotMatch(html, /Bundle scenarios/);
  assert.doesNotMatch(html, /id="destination-explorer"/);
  assert.doesNotMatch(html, /const SCENARIOS|function bundleAccess|function compareBundles|function buildScenario|\.scenario-card|\.bundle-scoreboard|\.outcome-grid/);
});

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
  assert.match(html, /disabled: code === selectedComparisonLeft/);
  assert.match(html, /comparisonRightSelector\.setDisabled\(!selectedComparisonLeft\)/);
  assert.match(html, /selectedComparisonRight === selectedComparisonLeft[\s\S]*?setValue\(''\)/);
});

test('section content is concise and descriptive', () => {
  const { html } = loadPage();
  assert.match(html, /Search entry requirements and compare four passports across 199 destinations\./);
  assert.match(html, /See the entry status for every passport\./);
  assert.match(html, /Access totals for each passport\./);
  assert.match(html, /Destinations available to only one of the two passports\./);
  assert.match(html, /Browse destinations by access status\./);
  assert.doesNotMatch(html, /recalculated|simplified model|shared access stays condensed|switching views/i);
});

test('destination result grid auto-fits home searches without a blank track', () => {
  const { html } = loadPage();
  assert.match(
    html,
    /\.destination-results\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*12rem\),\s*1fr\)\)/s,
  );
  assert.doesNotMatch(html, /\.destination-results\s*\{[^}]*grid-template-columns:\s*(?:1fr\s+1fr|repeat\(4,)/s);
});

test('masthead brand resets the page and menu links reach every primary section', () => {
  const { html } = loadPage();
  const header = html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0];
  assert.match(html, /<title>Passport Index<\/title>/);
  assert.match(html, /<span>Passport Index<\/span>/);
  assert.doesNotMatch(html, /Passport comparisons|Four passports · six comparisons/i);
  assert.ok(header);
  assert.match(header, /<a class="bundle-brand-link" href="\.\/" aria-label="Passport Index home">/);
  assert.match(header, /<button[^>]+class="site-menu-toggle"[^>]+id="site-menu-toggle"[^>]+aria-expanded="false"[^>]+aria-controls="site-menu"[^>]+aria-label="Open page menu"/);
  assert.match(header, /<nav class="section-nav" id="site-menu" aria-label="Page sections" hidden>/);
  assert.match(html, /<img class="bundle-mark"[^>]+src="data:image\/png;base64,/);
  assert.doesNotMatch(html, /<span class="bundle-mark">P<\/span>/);
  assert.match(html, /Passport access · country by country/i);
  assert.doesNotMatch(html, /Access legend|weight-note|weight-row|weight-badge/);
  assert.doesNotMatch(header, /2026 DATA/i);
  assert.doesNotMatch(header, /199 DESTINATIONS/i);
  assert.doesNotMatch(html, /bundle-date/);
  assert.match(html, /@media \(max-width:\s*480px\)[\s\S]*?\.site-header/);
  for (const [target, label] of [
    ['destination-search', 'Check'],
    ['passport-reach', 'Reach'],
    ['comparisons', 'Compare'],
    ['passport-browser', 'Browse'],
  ]) {
    assert.match(html, new RegExp(`<a href="#${target}">${label}<\\/a>`));
  }
  assert.match(html, /\.section-nav\s*\{[^}]*position:\s*absolute[^}]*right:\s*0/s);
});

test('hamburger menu is compact on mobile and supports expected dismissal behavior', () => {
  const { html } = loadPage();
  assert.match(html, /@media \(max-width:\s*480px\)[\s\S]*?\.site-header \.bundle-shell\s*\{[^}]*width:\s*100%/s);
  assert.match(html, /\.site-menu-toggle\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px/s);
  assert.match(html, /function setSiteMenuOpen\(open\)[\s\S]*?siteMenu\.hidden = !open;[\s\S]*?aria-expanded[\s\S]*?Close page menu[\s\S]*?Open page menu/);
  assert.match(html, /siteMenuToggle\.addEventListener\('click',[\s\S]*?setSiteMenuOpen/);
  assert.match(html, /siteMenu\.addEventListener\('click',[\s\S]*?closest\('a'\)[\s\S]*?setSiteMenuOpen\(false\)/);
  assert.match(html, /document\.addEventListener\('keydown',[\s\S]*?event\.key === 'Escape'[\s\S]*?!siteMenu\.hidden[\s\S]*?setSiteMenuOpen\(false\)[\s\S]*?siteMenuToggle\.focus\(\)/);
  assert.doesNotMatch(html, /siteHeader\.addEventListener\('keydown'/);
  assert.match(html, /document\.addEventListener\('pointerdown',[\s\S]*?!siteHeader\.contains\(event\.target\)[\s\S]*?setSiteMenuOpen\(false\)/);
  assert.doesNotMatch(html, /\.section-nav-list\s*\{[^}]*overflow-x:\s*auto|\.section-nav li \+ li\s*\{[^}]*border-left/s);
});

test('destination listbox closes when keyboard focus leaves the composite control', () => {
  const { html } = loadPage();
  assert.match(html, /destinationControl\.addEventListener\('focusout',[\s\S]*?relatedTarget[\s\S]*?closeDestinationOptions\(\)/);
  assert.match(html, /destinationDropdown\.addEventListener\('keydown',[\s\S]*?event\.key === 'Escape'[\s\S]*?closeDestinationOptions\(\)/);
});

test('Browse access filter includes ALL and groups exact statuses into three choices', () => {
  const { api } = loadPage();
  assert.deepEqual(
    Array.from(api.BROWSER_ACCESS_GROUPS, (group) => Array.from(group)),
    [
      ['all', 'All'],
      ['visa-free', 'Visa free'],
      ['on-arrival', 'On arrival'],
      ['visa-needed', 'Visa needed'],
    ],
  );

  const expected = [
    ['visa-free', 80, new Set(['visa-free', 'eta', 'evisitor', 'entry-form'])],
    ['on-arrival', 27, new Set(['on-arrival'])],
    ['visa-needed', 91, new Set(['evisa', 'visa-needed'])],
  ];
  for (const [group, count, allowedStatuses] of expected) {
    const rows = api.filterPassportDestinations(api.DESTINATIONS, 'al', group);
    const statuses = rows.map((row) => api.accessStatus(row.al));
    assert.equal(rows.length, count, group);
    assert.ok(statuses.every((status) => allowedStatuses.has(status)), group);
    assert.ok(statuses.every((status) => !['home', 'not-admitted'].includes(status)), group);
  }
});

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
  assert.match(api.passportBrowserMarkup(api.DESTINATIONS, 'us', 'all'), /access-pill not-admitted">Not admitted/);
});

test('passport browser filters counts while preserving direct status badges', () => {
  const { api } = loadPage();
  const visaFreeMarkup = api.passportBrowserMarkup(api.DESTINATIONS, 'al', 'visa-free');
  assert.match(visaFreeMarkup, /80 destinations/);
  assert.equal((visaFreeMarkup.match(/class="passport-browser-row"/g) || []).length, 80);
  assert.match(visaFreeMarkup, /access-pill visa-free">Visa free/);
  assert.match(visaFreeMarkup, /access-pill eta">ETA/);
  assert.match(visaFreeMarkup, /access-pill entry-form">Entry form/);
  assert.doesNotMatch(visaFreeMarkup, /rank-pill|>Positive<|>Negative</);

  const visaNeededMarkup = api.passportBrowserMarkup(api.DESTINATIONS, 'al', 'visa-needed');
  assert.match(visaNeededMarkup, /91 destinations/);
  assert.equal((visaNeededMarkup.match(/class="passport-browser-row"/g) || []).length, 91);
  assert.match(visaNeededMarkup, /access-pill evisa">eVisa/);
  assert.match(visaNeededMarkup, /access-pill visa-needed">Visa needed/);
});

test('Browse passport selection enables status and clearing resets ALL', () => {
  const { html } = loadPage();
  assert.match(html, /initChoiceSelector\(document\.querySelector\('#passport-browser-control'\)/);
  assert.match(html, /passportStatusSelector = initChoiceSelector/);
  assert.match(html, /selectedPassportCode = value;[\s\S]*?passportStatusSelector\.setDisabled\(!selectedPassportCode\)/);
  assert.match(html, /if \(!selectedPassportCode\)[\s\S]*?selectedPassportGroup = 'all';[\s\S]*?passportStatusSelector\.setValue\('all'\)/);
  assert.match(html, /id="passport-browser-status"[^>]+aria-live="polite"[^>]+aria-atomic="true"/);
  assert.doesNotMatch(html, /id="passport-browser-results"[^>]+aria-live=/);
  assert.match(html, /clearValue:\s*'all'/);
});

test('page styles are mobile-first with intentional card scrolling and touch targets', () => {
  const { html } = loadPage();
  assert.match(html, /scroll-snap-type:\s*x mandatory/);
  assert.match(html, /min-height:\s*44px/);
  assert.match(html, /@media \(min-width:\s*760px\)/);
  assert.match(html, /@media \(max-width:\s*480px\)[\s\S]*?\.section-nav\s*\{[^}]*right:\s*0[^}]*left:\s*0[^}]*width:\s*100%/s);
  assert.match(html, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.ok(html.indexOf('.unique-list { max-height: 25rem') > html.indexOf('@media (min-width: 960px)'));
});

test('section rhythm uses shared responsive spacing without oversized fixed gaps', () => {
  const { html } = loadPage();
  assert.match(html, /--section-space:\s*clamp\(/);
  assert.match(html, /\.bundle-section\s*\{[^}]*padding:\s*var\(--section-space\) 0/s);
  assert.doesNotMatch(html, /(?:margin|padding)(?:-top|-bottom)?:\s*(?:[5-9]\d|\d{3,})px/);
  assert.match(html, /\.choice-selector-trigger\s*\{[^}]*min-height:\s*44px/s);
});

test('page is self-contained and includes source and travel warning', () => {
  const { html } = loadPage();
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:/i);
  assert.doesNotMatch(html, /@import|url\(\s*['"]?https?:|<iframe\b|\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/i);
  for (const [image] of html.matchAll(/<img\b[^>]*>/gi)) {
    assert.match(image, /src="data:image\/png;base64,/i);
  }
  assert.match(html, /href="https:\/\/www\.passportindex\.org\/comparebyPassport\.php/);
  assert.match(html, /verify (?:the )?rules with official sources before travel/i);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
});

test('skip link stays hidden until keyboard focus', () => {
  const { html } = loadPage();
  assert.match(html, /\.skip-link\s*\{[^}]*position:\s*fixed[^}]*transform:\s*translateY\(-200%\)/s);
  assert.match(html, /\.skip-link:focus\s*\{[^}]*transform:\s*translateY\(0\)/s);
});
