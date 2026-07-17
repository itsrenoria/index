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

test('access annotation separates free or pre-cleared entry from arrival entry', () => {
  const { api } = loadPage();
  assert.equal(api.accessMode({ type: 'visa-free' }), 'free-precleared');
  assert.equal(api.accessMode({ type: 'eta' }), 'free-precleared');
  assert.equal(api.accessMode({ type: 'registration' }), 'free-precleared');
  assert.equal(api.accessMode({ type: 'visa-on-arrival' }), 'on-arrival');
  assert.equal(api.accessMode({ type: 'evisa' }), 'visa-needed');
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

test('destination and comparison markup preserve exact source labels and access modes', () => {
  const { api } = loadPage();
  const vietNam = api.findDestination(api.DESTINATIONS, 'viet nam');
  const searchMarkup = api.destinationResultMarkup(vietNam);
  const comparisonMarkup = api.comparisonCardMarkup({ id: 'de-us', left: 'de', right: 'us' });

  assert.match(searchMarkup, /VISA-FREE 45/);
  assert.match(searchMarkup, /EVISA 90/);
  assert.match(searchMarkup, /rank-pill positive[^>]*>Positive/);
  assert.match(searchMarkup, /rank-pill negative[^>]*>Negative/);
  assert.match(searchMarkup, /Free \/ pre-cleared/);
  assert.match(searchMarkup, /Visa needed/);
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

test('passport mode summaries split positive access into free-precleared and on-arrival', () => {
  const { api } = loadPage();
  for (const passport of api.PASSPORTS) {
    const summary = api.summarizePassportModes(api.DESTINATIONS, passport.code);
    assert.equal(summary.freePrecleared + summary.onArrival, summary.positive, passport.code);
    assert.equal(summary.positive + summary.negative, 199, passport.code);
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

test('page contains destination-first search and all direct comparisons without bundle controls', () => {
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
  assert.match(html, /Visa on arrival may (?:carry|include|involve) a (?:border )?fee/i);
});

test('section content is concise and descriptive', () => {
  const { html } = loadPage();
  assert.match(html, /Search entry requirements and compare four passports across 199 destinations\./);
  assert.match(html, /See the entry status for every passport\./);
  assert.match(html, /Access totals for each passport\./);
  assert.match(html, /Destinations available to only one of the two passports\./);
  assert.match(html, /Visa on arrival may include a border fee\./);
  assert.match(html, /View every destination for one passport\./);
  assert.doesNotMatch(html, /recalculated|simplified model|shared access stays condensed|switching views/i);
});

test('masthead navigation links to every primary section and the search legend follows results', () => {
  const { html } = loadPage();
  assert.match(html, /<title>Passport Index<\/title>/);
  assert.match(html, /<span>Passport Index<\/span>/);
  assert.doesNotMatch(html, /Passport comparisons|Four passports · six comparisons/i);
  assert.match(html, /<nav[^>]+class="section-nav"[^>]+aria-label="Page sections"/);
  for (const [target, label] of [
    ['destination-search', 'Check destination'],
    ['passport-reach', 'Passport reach'],
    ['comparisons', 'Comparisons'],
    ['passport-browser', 'Browse one passport'],
  ]) {
    assert.match(html, new RegExp(`<a href="#${target}">${label}<\\/a>`));
  }
  const resultsIndex = html.indexOf('id="destination-results"');
  const legendIndex = html.indexOf('class="weight-note"');
  const reachIndex = html.indexOf('id="passport-reach"');
  assert.ok(resultsIndex < legendIndex && legendIndex < reachIndex);
  assert.match(html, /\.section-nav-list\s*\{[^}]*margin-inline:\s*auto[^}]*overflow-x:\s*auto[^}]*white-space:\s*nowrap/s);
});

test('destination listbox closes when keyboard focus leaves the composite control', () => {
  const { html } = loadPage();
  assert.match(html, /destinationControl\.addEventListener\('focusout',[\s\S]*?relatedTarget[\s\S]*?closeDestinationOptions\(\)/);
  assert.match(html, /destinationDropdown\.addEventListener\('keydown',[\s\S]*?event\.key === 'Escape'[\s\S]*?closeDestinationOptions\(\)/);
});

test('passport browser renders every destination for each selected passport', () => {
  const { api } = loadPage();
  for (const passport of api.PASSPORTS) {
    const markup = api.passportBrowserMarkup(api.DESTINATIONS, passport.code);
    assert.equal((markup.match(/class="passport-browser-row"/g) || []).length, 199, passport.code);
    assert.match(markup, /AFGHANISTAN/);
    assert.match(markup, /ZIMBABWE/);
    assert.match(markup, /rank-pill negative">Negative/);
    assert.match(markup, /EVISA/);
  }
});

test('passport browser offers four accessible choices with Albania selected', () => {
  const { html } = loadPage();
  assert.match(html, /id="passport-browser"/);
  assert.equal((html.match(/<button[^>]+class="passport-choice"[^>]+data-passport=/g) || []).length, 4);
  assert.match(html, /data-passport="al" aria-pressed="true"/);
  assert.match(html, /id="passport-browser-status"[^>]+aria-live="polite"[^>]+aria-atomic="true"/);
  assert.doesNotMatch(html, /id="passport-browser-results"[^>]+aria-live=/);
  assert.match(html, /--v2-muted:\s*#53605a/);
});

test('page styles are mobile-first with intentional card scrolling and touch targets', () => {
  const { html } = loadPage();
  assert.match(html, /scroll-snap-type:\s*x mandatory/);
  assert.match(html, /min-height:\s*44px/);
  assert.match(html, /@media \(min-width:\s*760px\)/);
  assert.match(html, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.ok(html.indexOf('.unique-list { max-height: 25rem') > html.indexOf('@media (min-width: 960px)'));
});

test('section rhythm uses shared responsive spacing without oversized fixed gaps', () => {
  const { html } = loadPage();
  assert.match(html, /--section-space:\s*clamp\(/);
  assert.match(html, /\.bundle-section\s*\{[^}]*padding:\s*var\(--section-space\) 0/s);
  assert.doesNotMatch(html, /(?:margin|padding)(?:-top|-bottom)?:\s*(?:[5-9]\d|\d{3,})px/);
  assert.match(html, /\.passport-choice\s*\{[^}]*min-height:\s*44px/s);
});

test('page is self-contained and includes source and travel warning', () => {
  const { html } = loadPage();
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:/i);
  assert.doesNotMatch(html, /@import|url\(\s*['"]?https?:|<(?:img|iframe)\b|\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/i);
  assert.match(html, /href="https:\/\/www\.passportindex\.org\/comparebyPassport\.php/);
  assert.match(html, /verify (?:the )?rules with official sources before travel/i);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
});

test('skip link stays hidden until keyboard focus', () => {
  const { html } = loadPage();
  assert.match(html, /\.skip-link\s*\{[^}]*position:\s*fixed[^}]*transform:\s*translateY\(-200%\)/s);
  assert.match(html, /\.skip-link:focus\s*\{[^}]*transform:\s*translateY\(0\)/s);
});
