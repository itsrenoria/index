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

test('passport summaries reconcile positive and negative access to 199', () => {
  const { api } = loadPage();
  for (const passport of api.PASSPORTS) {
    const summary = api.summarizePassport(api.DESTINATIONS, passport.code);
    assert.equal(summary.positive + summary.negative, 199);
    assert.equal(summary.total, 199);
  }
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
  assert.match(html, /<input[^>]+id="destination-select"[^>]+type="search"[^>]+list="destination-options"/);
  assert.match(html, /<datalist id="destination-options"><\/datalist>/);
  assert.match(html, /id="passport-cards"/);
  assert.match(html, /id="direct-comparisons"/);
  assert.doesNotMatch(html, /id="scenario-select"/);
  assert.doesNotMatch(html, /Bundle scenarios/);
  assert.doesNotMatch(html, /id="destination-explorer"/);
  assert.doesNotMatch(html, /const SCENARIOS|function bundleAccess|function compareBundles|function buildScenario|\.scenario-card|\.bundle-scoreboard|\.outcome-grid/);
  assert.match(html, /Visa on arrival may (?:carry|involve) a (?:border )?fee/i);
});

test('page styles are mobile-first with intentional card scrolling and touch targets', () => {
  const { html } = loadPage();
  assert.match(html, /scroll-snap-type:\s*x mandatory/);
  assert.match(html, /min-height:\s*44px/);
  assert.match(html, /@media \(min-width:\s*760px\)/);
  assert.match(html, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.ok(html.indexOf('.unique-list { max-height: 25rem') > html.indexOf('@media (min-width: 960px)'));
});

test('page is self-contained and includes source and travel warning', () => {
  const { html } = loadPage();
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:/i);
  assert.match(html, /href="https:\/\/www\.passportindex\.org\/comparebyPassport\.php/);
  assert.match(html, /verify (?:the )?rules with official sources before travel/i);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
});

test('skip link stays hidden until keyboard focus', () => {
  const { html } = loadPage();
  assert.match(html, /\.skip-link\s*\{[^}]*position:\s*fixed[^}]*transform:\s*translateY\(-200%\)/s);
  assert.match(html, /\.skip-link:focus\s*\{[^}]*transform:\s*translateY\(0\)/s);
});
