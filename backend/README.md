# Backend (reserved)

This directory is separate from the browser application. No frontend script imports it, calls it, or displays controls for it.

`node/` preserves the previous optional local static-file server and Windows launcher. They are development helpers, not a gesture-recognition API, and are not required by GitHub Pages. They are kept here while the future backend architecture is undecided.

An ASP.NET backend can be introduced later without changing how the existing browser-only models run. No ASP.NET project or backend integration is enabled yet.
