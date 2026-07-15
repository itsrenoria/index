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

test('visa-free outranks eVisa', () => {
  const { api } = loadPage();
  assert.equal(
    api.compareEntries(
      { type: 'visa-free', days: 90 },
      { type: 'evisa', days: null },
    ),
    1,
  );
});

test('a longer stay wins within the same entry type', () => {
  const { api } = loadPage();
  assert.equal(
    api.compareEntries(
      { type: 'visa-free', days: 180 },
      { type: 'visa-free', days: 90 },
    ),
    1,
  );
});

test('equal entry type and stay length tie', () => {
  const { api } = loadPage();
  assert.equal(
    api.compareEntries(
      { type: 'eta', days: 90 },
      { type: 'eta', days: 90 },
    ),
    0,
  );
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
