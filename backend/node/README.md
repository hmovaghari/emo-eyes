# Optional legacy Node launcher

Kept outside the frontend while backend development is paused.

For local development only, run `node backend/node/serve.cjs` from the repository root, or double-click `Start-EMO.cmd` in this directory. The server serves the root `index.html` and `vendor/mediapipe` assets on the loopback interface; keep the console open while using it.

The frontend does not need this server on GitHub Pages and contains no launcher links or Node setup instructions. Do not include this directory in a frontend-only deployment artifact.
