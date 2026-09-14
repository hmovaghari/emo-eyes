# 🤖 emo-eyes

An interactive, lightweight, and expressive web-based simulation of robotic eyes, inspired by the **EMO** desktop companion. 

`emo-eyes` brings the personality of a desktop robot to any web browser using pure web technologies. Whether you want to use it as a digital pet or as a UI inspiration for your own robotics projects, `emo-eyes` provides smooth, high-quality animations with minimal overhead.

## ✨ Features

- **Dynamic Eye-Tracking:** The eyes smoothly follow your mouse cursor or touch input.
- **Expressive Moods:** Switch between multiple emotions (Happy, Sad, Angry, Surprised, Sleepy, and Normal) with a simple click or tap.
- **Natural Animations:** Includes procedural blinking, occasional double-blinks, and "winks" for a lifelike feel.
- **Local Gesture Recognition:** Bundled MediaPipe models recognize hands and facial expressions in a Web Worker. Camera images stay on your device; no cloud inference or runtime CDN downloads are needed.
- **Responsive & Fullscreen:** Works perfectly on desktop monitors, tablets, and smartphones.
- **Robot Aesthetic:** Features a subtle scanline and vignette overlay to mimic a real OLED/LCD robotic display.

## 🚀 How to Use

1. Clone this repository, including the `vendor/mediapipe` directory (about 35 MB).
2. On Windows, double-click **Start-EMO.cmd**. It starts a local-only server and opens your browser; keep its console window open while using EMO. It uses Node.js from PATH or the bundled Codex runtime when available. Alternatively, run `node serve.cjs` and open the printed address, or use `python -m http.server 8000 --bind 127.0.0.1` and open `http://localhost:8000`. Gesture recognition needs HTTP on localhost or HTTPS; opening `index.html` directly still supports the basic eyes but cannot load the gesture worker.
3. **Pro Tip:** Press `F11` to enter Fullscreen mode for the ultimate EMO experience!

## 🛠️ Tech Stack

- **HTML5:** Semantic structure.
- **CSS3:** Advanced animations, glows, and responsive layouts.
- **JavaScript (ES6+):** Mathematical eye-tracking logic and state management for expressions.
- **MediaPipe Tasks Vision 0.10.32:** Local hand gesture recognition and face blendshapes, with bundled WASM and model assets. See [third-party sources](vendor/mediapipe/README.md).

## Camera gestures

Turn on the camera and wait for the Persian gesture status to say it is ready. Keep your hand or face visible with good lighting and hold a gesture for roughly half a second.

| Gesture | Robot reaction |
| --- | --- |
| Puckered lips (kiss-like expression), or the I-love-you hand sign | Love |
| Closed fist or thumbs down | Angry |
| Thumbs up or smile | Happy |
| Victory sign | Excited |
| Open palm or deliberate wink | Cheeky |
| Pointing up | Thinking |

Kiss detection is a heuristic based on lip puckering with a mostly closed mouth, not an understanding of intent or a trained blowing-kiss action classifier. It can confuse similar lip movements. Hand gestures take priority over smiles; puckered lips take priority over hands. Simultaneous hands use the highest-confidence recognized gesture.

Short detections are ignored. A held gesture keeps its reaction active; the robot returns to your selected mood about 2.4 seconds after the gesture disappears. Manual mood selection has priority for three seconds.

In smart mode, general motion only steers the eyes. Uncheck the smart-gesture option to return to simple motion reactions (gentle movement = happy, strong movement = surprised). The sensitivity slider controls that simple motion mode, not hand/face recognition. If models fail to load, the UI reports the failure and falls back to simple motion; toggle smart recognition off and on to retry. Camera-off and backgrounding the page terminate the worker and camera stream.

Run the gesture regression tests with `node --test tests/gestures.test.cjs`. Real webcam accuracy depends on lighting, framing, and pose; automated tests do not establish real-world recognition accuracy.

The camera panel displays detected hand/face counts and per-frame processing latency. Matching predictions are allowed to arrive slowly (up to a three-second gap), so slower laptops can still confirm a held gesture.

For a real-model browser regression test, install Playwright and use an installed Edge browser, then run `node tests/gestures-browser.cjs`. Alternatively, set `PLAYWRIGHT_MODULE` to an existing Playwright installation. This feeds an official thumbs-up image through the full camera pipeline at normal speed and with 750 ms additional latency per frame, asserting that the eyes actually become happy.

## 📸 Preview
*(Tip: Add a screenshot or a GIF of your eyes moving here to make your README pop!)*

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
