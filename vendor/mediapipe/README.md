# Bundled MediaPipe assets

Runtime: @mediapipe/tasks-vision 0.10.32, downloaded from https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/.

Upstream: https://github.com/google-ai-edge/mediapipe. The upstream Apache-2.0 license is included in LICENSE. Existing license notices in the distributed JavaScript are preserved.

Models downloaded on 2026-09-15:

- Hand gestures: https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/latest/gesture_recognizer.task
- Face landmarks: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

The gesture source uses an upstream latest URL, but the local bytes are pinned by the SHA-256 values below. No runtime requests to these hosts are made. Serve this directory together with index.html; do not omit the WASM files.

## SHA-256

- `vision_bundle.mjs`: `de83c48ff329717a27aeb528d5ef5f47f077c628a5302dc483aca5b513e7464b`
- `wasm/vision_wasm_internal.js`: `6f6b86509cf9e163ea1cfec7edc8cf53732699c04781e4c21c557c1ba402310e`
- `wasm/vision_wasm_internal.wasm`: `cb3ec20026a9aecc2a81a93c25630ceb5389297ddb7a5f0bd61dd09cde606b9b`
- `wasm/vision_wasm_nosimd_internal.js`: `9f8fc960e363f0fb2f42f7937b97ae9cf9a5630490f71031fa90caa9bb121938`
- `wasm/vision_wasm_nosimd_internal.wasm`: `924274fcd5ac8985f6570a8573e7971b7bd2d580ba1b8f3beb0ba8f95db6347c`
- `gesture_recognizer.task`: `97952348cf6a6a4915c2ea1496b4b37ebabc50cbbf80571435643c455f2b0482`
- `face_landmarker.task`: `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`
