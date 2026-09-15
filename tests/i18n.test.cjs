const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function setup(storage) {
  const root = {}, picker = {};
  const context = { localStorage: storage, document: { documentElement: root, getElementById: () => picker } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../i18n.js'), 'utf8'), context);
  return { api: context.EMOI18n, root };
}

test('language switches retranslate live messages and parameters without replacing application state', () => {
  const { api, root } = setup({ getItem: () => null, setItem() {} });
  const status = {};
  api.setText(status, 'gestureReaction', { gesture: 'لایک', mood: 'خوشحال' });
  assert.equal(status.textContent, 'لایک ← خوشحال');
  api.setLanguage('en');
  assert.equal(status.textContent, 'Thumbs up → Happy');
  assert.equal(root.dir, 'ltr');
  api.setLanguage('fa');
  assert.equal(status.textContent, 'لایک ← خوشحال');
  assert.equal(root.dir, 'rtl');
});

test('blocked storage and invalid saved values fall back safely to Persian', () => {
  for (const storage of [
    { getItem() { throw Error('Blocked'); }, setItem() { throw Error('Blocked'); } },
    { getItem: () => 'invalid', setItem() {} }
  ]) {
    const { api } = setup(storage);
    assert.equal(api.getLanguage(), 'fa');
    api.setLanguage('en');
    assert.equal(api.translate('روشن کردن دوربین'), 'Turn camera on');
    api.setLanguage('invalid');
    assert.equal(api.getLanguage(), 'en');
  }
});

test('saved English preference is restored', () => {
  const { api } = setup({ getItem: () => 'en', setItem() {} });
  assert.equal(api.getLanguage(), 'en');
});

test('every Persian application message has an English translation', () => {
  const { api } = setup({ getItem: () => 'en', setItem() {} });
  const app = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  for (const match of app.matchAll(/(['"])([^'"\r\n]*[\u0600-\u06ff][^'"\r\n]*)\1/g)) {
    assert(!/[\u0600-\u06ff]/.test(api.translate(match[2])), 'Missing translation: ' + match[2]);
  }
});
