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

test('page contains the focused scenario and destination lookup landmarks', () => {
  const { html } = loadPage();
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /id="passport-cards"/);
  assert.match(html, /<label for="scenario-select">/);
  assert.match(html, /id="scenario-view"/);
  assert.match(html, /id="right-adds-list"/);
  assert.match(html, /id="left-keeps-list"/);
  assert.match(html, /<details[^>]*id="destination-explorer"/);
  assert.match(html, /<label for="destination-select">/);
  assert.doesNotMatch(html, /id="destination-body"/);
});

test('page styles are mobile-first with intentional card scrolling and touch targets', () => {
  const { html } = loadPage();
  assert.match(html, /scroll-snap-type:\s*x mandatory/);
  assert.match(html, /min-height:\s*44px/);
  assert.match(html, /@media \(min-width:\s*760px\)/);
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

test('skip link stays hidden until keyboard focus', () => {
  const { html } = loadPage();
  assert.match(html, /\.skip-link\s*\{[^}]*position:\s*fixed[^}]*transform:\s*translateY\(-200%\)/s);
  assert.match(html, /\.skip-link:focus\s*\{[^}]*transform:\s*translateY\(0\)/s);
});
