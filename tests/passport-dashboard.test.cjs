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

test('positive access outranks negative access', () => {
  const { api } = loadPage();
  assert.equal(
    api.compareEntries(
      { type: 'visa-free', days: 90 },
      { type: 'evisa', days: null },
    ),
    1,
  );
});

test('visa-free, visa on arrival, and ETA have equal weight', () => {
  const { api } = loadPage();
  assert.equal(
    api.compareEntries(
      { type: 'visa-free', days: 30 },
      { type: 'eta', days: 180 },
    ),
    0,
  );
  assert.equal(
    api.compareEntries(
      { type: 'visa-on-arrival', days: 7 },
      { type: 'visa-free', days: 360 },
    ),
    0,
  );
});

test('permitted stay length never changes comparison weight', () => {
  const { api } = loadPage();
  assert.equal(
    api.compareEntries(
      { type: 'visa-free', days: 7 },
      { type: 'visa-free', days: 360 },
    ),
    0,
  );
});

test('eVisa, visa required, and not admitted have equal negative weight', () => {
  const { api } = loadPage();
  assert.equal(api.compareEntries({ type: 'evisa' }, { type: 'visa-required' }), 0);
  assert.equal(api.compareEntries({ type: 'visa-required' }, { type: 'not-admitted' }), 0);
});

test('access weight classifies registration as positive and not-admitted as negative', () => {
  const { api } = loadPage();
  assert.equal(api.accessWeight({ type: 'registration' }), 'positive');
  assert.equal(api.accessWeight({ type: 'not-admitted' }), 'negative');
});

test('row outcome returns the strongest passport', () => {
  const { api } = loadPage();
  const sample = {
    destination: 'AZERBAIJAN',
    gr: { type: 'evisa', days: 30 },
    al: { type: 'visa-free', days: 90 },
    us: { type: 'evisa', days: 30 },
    de: { type: 'evisa', days: 30 },
  };

  assert.deepEqual(Array.from(api.rowOutcome(sample).winners), ['al']);
});

test('source labels are classified without hiding their raw wording', () => {
  const { api } = loadPage();
  assert.deepEqual(
    { ...api.classifyEntry('EVISITORS 90') },
    { raw: 'EVISITORS 90', type: 'eta', days: 90 },
  );
  assert.deepEqual(
    { ...api.classifyEntry('ARRIVAL CARD 30') },
    { raw: 'ARRIVAL CARD 30', type: 'registration', days: 30 },
  );
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

test('bundle access uses the best available passport in the bundle', () => {
  const { api } = loadPage();
  const azerbaijan = api.DESTINATIONS.find((row) => row.destination === 'AZERBAIJAN');
  const angola = api.DESTINATIONS.find((row) => row.destination === 'ANGOLA');

  assert.equal(api.bundleAccess(azerbaijan, ['al']), 'positive');
  assert.equal(api.bundleAccess(angola, ['al']), 'negative');
  assert.equal(api.bundleAccess(angola, ['al', 'gr']), 'positive');
});

test('adding a passport never reduces positive bundle access', () => {
  const { api } = loadPage();
  const albania = api.summarizeBundle(api.DESTINATIONS, ['al']);
  const albaniaGreece = api.summarizeBundle(api.DESTINATIONS, ['al', 'gr']);
  const albaniaGreeceUs = api.summarizeBundle(api.DESTINATIONS, ['al', 'gr', 'us']);

  assert.ok(albaniaGreece.positive >= albania.positive);
  assert.ok(albaniaGreeceUs.positive >= albaniaGreece.positive);
  assert.equal(albania.total, 199);
});

test('passport summaries reconcile positive and negative access to 199', () => {
  const { api } = loadPage();
  for (const passport of api.PASSPORTS) {
    const summary = api.summarizePassport(api.DESTINATIONS, passport.code);
    assert.equal(summary.positive + summary.negative, 199);
    assert.equal(summary.total, 199);
  }
});

test('scenario definitions cover the eight requested bundle comparisons', () => {
  const { api } = loadPage();
  const definitions = Array.from(api.SCENARIOS, ({ left, right }) => [Array.from(left), Array.from(right)]);
  assert.deepEqual(definitions, [
    [['al'], ['gr']],
    [['al', 'gr'], ['us']],
    [['al'], ['us']],
    [['al', 'gr'], ['al', 'us']],
    [['al', 'gr', 'us'], ['al', 'us']],
    [['al', 'us'], ['al', 'de']],
    [['al', 'gr'], ['al', 'de']],
    [['al', 'gr', 'us'], ['al', 'de']],
  ]);
});

test('every scenario partitions all destinations exactly once', () => {
  const { api } = loadPage();
  for (const definition of api.SCENARIOS) {
    const result = api.buildScenario(api.DESTINATIONS, definition);
    const partition = [
      ...result.rightAdds,
      ...result.leftKeeps,
      ...result.bothCover,
      ...result.neitherCovers,
    ];
    assert.equal(partition.length, 199, definition.id);
    assert.equal(new Set(partition.map((row) => row.destination)).size, 199, definition.id);
  }
});

function sampleRows() {
  return [
    {
      destination: 'AZERBAIJAN',
      gr: { type: 'evisa', days: 30, raw: 'EVISA 30' },
      al: { type: 'visa-free', days: 90, raw: 'VISA-FREE 90' },
      us: { type: 'evisa', days: 30, raw: 'EVISA 30' },
      de: { type: 'evisa', days: 30, raw: 'EVISA 30' },
    },
    {
      destination: 'ANGOLA',
      gr: { type: 'visa-free', days: 30, raw: 'VISA-FREE 30' },
      al: { type: 'evisa', days: null, raw: 'EVISA' },
      us: { type: 'visa-free', days: 30, raw: 'VISA-FREE 30' },
      de: { type: 'visa-free', days: 30, raw: 'VISA-FREE 30' },
    },
    {
      destination: 'ALGERIA',
      gr: { type: 'visa-required', days: null, raw: 'VISA REQUIRED' },
      al: { type: 'visa-required', days: null, raw: 'VISA REQUIRED' },
      us: { type: 'visa-required', days: null, raw: 'VISA REQUIRED' },
      de: { type: 'visa-required', days: null, raw: 'VISA REQUIRED' },
    },
  ];
}

test('summary totals reconcile wins, tied best, and behind for every passport', () => {
  const { api } = loadPage();
  const summary = api.summarize(sampleRows());

  assert.deepEqual(
    {
      wins: summary.al.wins,
      tiedBest: summary.al.tiedBest,
      behind: summary.al.behind,
    },
    { wins: 1, tiedBest: 1, behind: 1 },
  );

  for (const passport of api.PASSPORTS) {
    const metrics = summary[passport.code];
    assert.equal(metrics.wins + metrics.tiedBest + metrics.behind, 3);
  }
});

test('destination search is case insensitive', () => {
  const { api } = loadPage();
  const rows = api.filterRows(sampleRows(), { search: 'azer' });
  assert.deepEqual(Array.from(rows, (row) => row.destination), ['AZERBAIJAN']);
});

test('passport advantage excludes universal ties', () => {
  const { api } = loadPage();
  const rows = api.filterRows(sampleRows(), { advantage: 'al' });
  assert.deepEqual(Array.from(rows, (row) => row.destination), ['AZERBAIJAN']);
});

test('differences-only removes rows where all four outcomes tie', () => {
  const { api } = loadPage();
  const rows = api.filterRows(sampleRows(), { differencesOnly: true });
  assert.deepEqual(
    Array.from(rows, (row) => row.destination).sort(),
    ['ANGOLA', 'AZERBAIJAN'],
  );
});

test('entry-type filter matches a category in any passport column', () => {
  const { api } = loadPage();
  const rows = api.filterRows(sampleRows(), { type: 'evisa' });
  assert.deepEqual(
    Array.from(rows, (row) => row.destination).sort(),
    ['ANGOLA', 'AZERBAIJAN'],
  );
});

test('difference sorting orders rows from strongest gap to weakest', () => {
  const { api } = loadPage();
  const rows = api.filterRows(sampleRows(), { sort: 'difference' });
  const scores = rows.map(api.differenceScore);
  assert.deepEqual(Array.from(scores), [...scores].sort((a, b) => b - a));
  assert.equal(rows.at(-1).destination, 'ALGERIA');
});

test('page contains accessible summary and explorer landmarks', () => {
  const { html } = loadPage();
  assert.match(html, /<a class="skip-link" href="#explorer">/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /id="summary-grid"/);
  assert.match(html, /id="winner-overview"/);
  assert.match(html, /<label for="search">/);
  assert.match(html, /<label for="entry-type">/);
  assert.match(html, /<label for="advantage">/);
  assert.match(html, /<label for="sort">/);
  assert.match(html, /<caption>/);
  assert.match(html, /id="destination-body"/);
});

test('page is self-contained and includes source and travel warning', () => {
  const { html } = loadPage();
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:/i);
  assert.match(html, /href="https:\/\/www\.passportindex\.org\/comparebyPassport\.php/);
  assert.match(html, /verify (?:the )?rules with official sources before travel/i);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
});

test('screen-reader context is visually hidden without removing it from accessibility', () => {
  const { html } = loadPage();
  assert.match(html, /\.sr-only\s*\{[^}]*position:\s*absolute[^}]*clip:/s);
});
