// Run with: node --test tests/gestures.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function harness() {
  let now = 10000, timerId = 0;
  const timers = new Map(), elements = {};
  function element() {
    const classes = new Set();
    return { value: 3, checked: true, style: {}, dataset: {},
      classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) },
      setAttribute(k, v) { this[k] = v; }, getAttribute(k) { return this[k]; },
      addEventListener(name, callback) { this.handlers ??= {}; this.handlers[name] = callback; }, getBoundingClientRect() { return { width: 240, height: 270 }; },
      querySelector(k) { this.children ??= {}; return this.children[k] ??= element(); }
    };
  }
  const context = {
    NodeFilter: { SHOW_TEXT: 4 },
    location: { protocol: 'http:' },
    document: { documentElement: {}, createTreeWalker: () => ({ nextNode: () => null }), getElementById: k => elements[k] ??= element(), querySelectorAll: () => [],
      createElement: () => ({ getContext: () => ({}) }), addEventListener() {} },
    matchMedia: () => ({ matches: false }), performance: { now: () => now },
    innerWidth: 1000, innerHeight: 700, addEventListener() {}, requestAnimationFrame() {},
    setTimeout: (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; },
    clearTimeout: id => timers.delete(id), setInterval() {}, clearInterval() {}, console
  };
  let script = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  script = script.replace(/\}\)\(\);\s*$/, `globalThis.api = {
    classifyGesture, consumeGesture, selectMood, stopCamera, reactToMotion,
    ready: () => { gestureState = 'ready'; },
    state: () => ({ mood, selectedMood, gestureState })
  };})();`);
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../i18n.js'), 'utf8'), context);
  vm.runInContext(script, context);
  return { api: context.api, elements,
    advance(ms) { now += ms; },
    send(result) { context.api.consumeGesture(result, now); },
    flush(ms) { for (const [id, timer] of [...timers]) if (timer.ms === ms) { timers.delete(id); timer.fn(); } }
  };
}
const hand = (categoryName, score = .9) => ({ hands: [[{ categoryName, score }]], face: [] });
const face = scores => ({ hands: [], face: Object.entries(scores).map(([categoryName, score]) => ({ categoryName, score })) });

test('all supported hands map to explicit emotions; weak/unknown hands are ignored', () => {
  const { api } = harness();
  for (const [name, mood] of Object.entries({ Closed_Fist: 'angry', Thumb_Down: 'angry', Thumb_Up: 'happy', Victory: 'excited', Open_Palm: 'cheeky', Pointing_Up: 'thinking', ILoveYou: 'love' })) {
    assert.equal(api.classifyGesture(hand(name).hands, []).mood, mood);
  }
  assert.equal(api.classifyGesture(hand('Thumb_Down', .4).hands, []), null);
  assert.equal(api.classifyGesture(hand('None').hands, []), null);
});

test('kiss, smile and deliberate wink; talking and ordinary blinking do not count', () => {
  const { api } = harness();
  const classify = scores => api.classifyGesture([], face(scores).face);
  assert.equal(classify({ mouthPucker: .8, jawOpen: .05 }).mood, 'love');
  assert.equal(classify({ mouthPucker: .8, jawOpen: .5 }), null);
  assert.equal(classify({ mouthSmileLeft: .8, mouthSmileRight: .7 }).mood, 'happy');
  assert.equal(classify({ eyeBlinkLeft: .9, eyeBlinkRight: .1 }).mood, 'cheeky');
  assert.equal(classify({ eyeBlinkLeft: .9, eyeBlinkRight: .9 }), null);
  assert.equal(classify({}), null);
});

test('full result pipeline requires sustained evidence and recovers after release', () => {
  const h = harness();
  h.send(hand('Closed_Fist')); assert.equal(h.api.state().mood, 'normal');
  for (let i = 0; i < 4; i++) { h.advance(150); h.send(hand('Closed_Fist')); }
  assert.equal(h.api.state().mood, 'angry');
  h.flush(160); assert.equal(h.elements.stage.dataset.mood, 'angry');
  h.advance(150); h.send(hand('Closed_Fist'));
  h.flush(2400); h.flush(160);
  assert.equal(h.api.state().mood, 'normal');
});

test('single noisy gesture and separated detections never accumulate', () => {
  const h = harness(); h.send(hand('Thumb_Down'));
  h.advance(3200); h.send(hand('Thumb_Down'));
  assert.equal(h.api.state().mood, 'normal');
  h.advance(150); h.send(hand('Thumb_Up'));
  h.advance(150); h.send(hand('Thumb_Down'));
  assert.equal(h.api.state().mood, 'normal');
});

test('manual selection wins, cancels recovery, and camera stop restores selection', () => {
  const h = harness();
  h.send(hand('Victory'));
  for (let i = 0; i < 4; i++) { h.advance(150); h.send(hand('Victory')); }
  assert.equal(h.api.state().mood, 'excited');
  h.api.selectMood('shy'); h.flush(2400);
  for (let i = 0; i < 5; i++) { h.advance(150); h.send(hand('Thumb_Down')); }
  assert.equal(h.api.state().mood, 'shy');
  h.advance(3200);
  for (let i = 0; i < 5; i++) { h.advance(150); h.send(hand('Thumb_Down')); }
  assert.equal(h.api.state().mood, 'angry');
  h.api.stopCamera(); assert.equal(h.api.state().mood, 'shy');
  assert.equal(h.api.state().gestureState, 'off');
});

test('motion can update the meter but cannot replace semantic reactions', () => {
  const h = harness(); h.api.ready(); h.api.reactToMotion(.8, 10000);
  assert.equal(h.api.state().mood, 'normal');
  assert(h.elements['motion-level'].value > 0);
});

test('matching results from a slow CPU still confirm the gesture', () => {
  const h = harness();
  h.send(hand('Thumb_Up'));
  h.advance(900); h.send(hand('Thumb_Up'));
  assert.equal(h.api.state().mood, 'happy');
});

test('mood picker clicks update the saved selection and protect it from gestures', () => {
  const h = harness();
  h.elements['mood-picker'].handlers.click({ target: { closest: () => ({ dataset: { selectMood: 'love' } }) } });
  assert.equal(h.api.state().selectedMood, 'love');
  h.send(hand('Thumb_Down')); h.advance(900); h.send(hand('Thumb_Down'));
  assert.equal(h.api.state().mood, 'love');
});
