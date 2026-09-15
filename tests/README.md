# Development tests

These scripts use Node.js only as a test runner. They are not backend services, are not imported by `index.html`, and are not part of the frontend deployment.

Run logic regression tests:

```sh
node --test tests/gestures.test.cjs
```

For the real-model browser regression test, install Playwright and use an installed Edge browser:

```sh
node tests/gestures-browser.cjs
```

Alternatively, set `PLAYWRIGHT_MODULE` to an existing Playwright installation. This test feeds the official thumbs-up fixture through the full camera pipeline at normal speed and with 750 ms additional latency per frame, asserting that the eyes actually become happy. It starts its own temporary test server and does not depend on the optional launcher under `backend/node/`.
