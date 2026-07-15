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
