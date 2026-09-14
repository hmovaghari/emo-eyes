# Test fixture attribution

`hand_thumb_up.jpg` is the official MediaPipe Samples Android gesture-recognizer test image:

https://github.com/google-ai-edge/mediapipe-samples/blob/main/examples/gesture_recognizer/android/app/src/androidTest/assets/hand_thumb_up.jpg

Source repository: Google AI Edge MediaPipe Samples (Apache-2.0). The license text is included at `../../vendor/mediapipe/LICENSE`.

The browser regression test feeds this image through a canvas camera stream, the video element, the actual bundled models, and the UI. It tests normal processing and an additional 750 ms of latency per result. It does not mock model predictions or establish accuracy for other poses.
