(function () {
  "use strict";
  EMOI18n.init();
  var setText = EMOI18n.setText;
  /* ================= State ================= */
  var eyes = [document.getElementById("eyeL"), document.getElementById("eyeR")];
  var pupils = eyes.map(function (e) { return e.querySelector(".pupil"); });
  var moodEl = document.getElementById("mood");

  var mouse = { x: innerWidth / 2, y: innerHeight / 3 };
  var cur = { x: 0, y: 0 };          // current pupil offset (px)
  var mood = "normal";
  var moodTimer = null;
  var selectedMood = 'normal', reactionTimer = null, reactionCooldown = 0;
  var manualUntil = 0, transitionTimer = null, transitionVersion = 0;
  var reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  var stage = document.getElementById('stage');

  var MOODS = ["normal", "happy", "sad", "angry", "surprised", "sleepy", "love", "suspicious", "dizzy", "cheeky", "bored", "excited", "shy", "thinking"];
  var MOOD_FA = {
    normal: "عادی", happy: "خوشحال", sad: "غمگین",
    angry: "عصبانی", surprised: "متعجب", sleepy: "خواب‌آلود", love: "عاشق", suspicious: "مشکوک", dizzy: "گیج", cheeky: "شیطون", bored: "بی‌حوصله", excited: "هیجان‌زده", shy: "خجالتی", thinking: "در حال فکر"
  };

  /* ================= Pointer tracking ================= */
  var lastPointer = 0;
  function setPointer(x, y) { mouse.x = x; mouse.y = y; lastPointer = performance.now(); }
  addEventListener("mousemove", function (e) { setPointer(e.clientX, e.clientY); });
  addEventListener("touchmove", function (e) {
    if (e.touches.length) setPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  /* Compare small grayscale frames; no images leave this page. */
  var cameraButton = document.getElementById("camera-toggle");
  var cameraStatus = document.getElementById("camera-status");
  var video = document.getElementById("camera-preview");
  var canvas = document.createElement("canvas");
  canvas.width = 80; canvas.height = 60;
  var context = canvas.getContext("2d", { willReadFrequently: true });
  var stream = null, cameraRequest = 0, cameraTimer = null, previousFrame = null;
  var cameraTarget = { x: .5, y: .5, time: -Infinity };

  function stopCamera(message) {
    stopGestureRecognition(message || 'دوربین خاموش است؛ برای تشخیص ژست دوباره روشنش کن.');
    cameraRequest++;
    clearInterval(cameraTimer);
    cameraTimer = null;
    if (stream) stream.getTracks().forEach(function (track) { track.stop(); });
    stream = null;
    video.srcObject = null;
    video.classList.remove("active");
    previousFrame = null;
    cameraTarget.time = -Infinity;
    motionEnergy = 0;
    gentleFrames = 0;
    motionLevel.value = 0;
    reactionCooldown = 0;
    clearTimeout(reactionTimer);
    if (mood !== selectedMood) { mood = selectedMood; applyMood(); }
    setText(cameraButton, "روشن کردن دوربین");
    cameraButton.setAttribute("aria-pressed", "false");
    setText(cameraStatus, message || "دوربین خاموش است");
  }

  var motionEnergy = 0, cameraWarmup = 0, gentleFrames = 0;
  var motionLevel = document.getElementById('motion-level');
  var motionSensitivity = document.getElementById('motion-sensitivity');
  function reactToMotion(energy, now) {
    var gain = Number(motionSensitivity.value) / 3;
    energy *= gain;
    motionLevel.value = Math.min(100, Math.round(energy * 2500));
    var sudden = energy > .018;
    gentleFrames = energy > .0015 ? gentleFrames + 1 : 0;
    motionEnergy += (energy - motionEnergy) * .3;
    // Semantic gestures own emotions while ready; motion still guides the gaze.
    if (gestureState === 'ready' || gestureState === 'loading') return;
    if ((!sudden && gentleFrames < 5) || now < cameraWarmup || now < manualUntil || now < reactionCooldown) return;
    reactionCooldown = now + 3200;
    gentleFrames = 0;
    clearTimeout(reactionTimer);
    mood = sudden ? 'surprised' : 'happy';
    applyMood();
    showMood();
    reactionTimer = setTimeout(function () {
      mood = selectedMood;
      applyMood();
      showMood();
    }, 1800);
  }

  function readMotion() {
    if (video.readyState < 2) return;
    // Recover an inactive recognizer without toggling the working camera.
    if (stream && smartGestures.checked && gestureState === 'off' && !document.hidden) startGestureRecognition();
    context.drawImage(video, 0, 0, 80, 60);
    var pixels = context.getImageData(0, 0, 80, 60).data;
    var frame = new Float32Array(4800), meanChange = 0;
    for (var i = 0; i < frame.length; i++) {
      frame[i] = pixels[i * 4] * .299 + pixels[i * 4 + 1] * .587 + pixels[i * 4 + 2] * .114;
      if (previousFrame) meanChange += frame[i] - previousFrame[i];
    }
    if (previousFrame) {
      meanChange /= frame.length;
      var weight = 0, x = 0, y = 0, changed = 0;
      for (var j = 0; j < frame.length; j++) {
        // Ignore sensor noise and uniform exposure changes.
        var delta = Math.abs(frame[j] - previousFrame[j] - meanChange);
        if (delta < 14) continue;
        changed++;
        weight += delta;
        x += (j % 80) * delta;
        y += Math.floor(j / 80) * delta;
      }
      if (changed > 12 && changed < frame.length * .65) {
        var now = performance.now();
        var blend = now - cameraTarget.time > 1800 ? 1 : .35;
        cameraTarget.x += (1 - x / weight / 79 - cameraTarget.x) * blend;
        cameraTarget.y += (y / weight / 59 - cameraTarget.y) * blend;
        cameraTarget.time = now;
        reactToMotion(weight / (frame.length * 255), now);
      } else {
        reactToMotion(0, performance.now());
      }
    }
    previousFrame = frame;
  }

  cameraButton.addEventListener("click", async function () {
    if (stream || cameraTimer === "pending") { stopCamera(); return; }
    if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setText(cameraStatus, "برای دسترسی به دوربین، نسخهٔ آنلاین برنامه را در مرورگر باز کنید.");
      return;
    }
    var request = ++cameraRequest;
    cameraTimer = "pending";
    setText(cameraButton, "لغو درخواست دوربین");
    setText(cameraStatus, "در انتظار اجازهٔ دسترسی به دوربین…");
    try {
      var acquired = await navigator.mediaDevices.getUserMedia({
        audio: false, video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
      });
      if (request !== cameraRequest) {
        acquired.getTracks().forEach(function (track) { track.stop(); });
        return;
      }
      stream = acquired;
      stream.getVideoTracks()[0].addEventListener("ended", function () {
        if (request === cameraRequest) stopCamera("اتصال دوربین قطع شد؛ دوباره روشن کنید.");
      });
      video.srcObject = stream;
      await video.play();
      if (request !== cameraRequest) return;
      video.classList.add("active");
      setText(cameraButton, "خاموش کردن دوربین");
      cameraButton.setAttribute("aria-pressed", "true");
      setText(cameraStatus, "حرکت آرام و پیوسته = خوشحالی؛ حرکت شدید = تعجب. اگر واکنش کم است، حساسیت را بیشتر کنید.");
      cameraWarmup = performance.now() + 1200;
      cameraTimer = setInterval(readMotion, 80);
      startGestureRecognition();
    } catch (error) {
      if (request !== cameraRequest) return;
      var messages = {
        NotAllowedError: "اجازهٔ دوربین داده نشد؛ دسترسی را در تنظیمات مرورگر فعال کنید.",
        NotFoundError: "دوربینی پیدا نشد؛ اتصال دوربین را بررسی کنید.",
        NotReadableError: "دوربین در دسترس نیست؛ برنامه‌های دیگرِ استفاده‌کننده را ببندید."
      };
      stopCamera(messages[error.name] || "راه‌اندازی دوربین ناموفق بود؛ دوباره تلاش کنید.");
    }
  });
  addEventListener("pagehide", function () { stopCamera(); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopCamera("دوربین با خروج از صفحه خاموش شد؛ برای ادامه دوباره روشن کنید.");
  });

  /* ================= Local semantic gesture recognition ================= */
  var smartGestures = document.getElementById('smart-gestures');
  var gestureStatus = document.getElementById('gesture-status');
  var visionFeedback = document.getElementById('vision-feedback');
  var gestureRetry = document.getElementById('gesture-retry');
  var gestureError = document.getElementById('gesture-error');
  var gestureState = 'off', gestureWorker = null, gestureInterval = null;
  var gestureWatchdog = null, gestureBusy = false, gestureVideoTime = -1;
  var candidateKey = '', candidateSince = 0, candidateLastSeen = 0;
  var candidateFrames = 0;
  var acceptedKey = '', acceptedAt = -Infinity;
  var HAND_REACTIONS = {
    Closed_Fist: ['angry', 'مشت'], Thumb_Down: ['angry', 'شست رو به پایین'],
    Thumb_Up: ['happy', 'لایک'], Victory: ['excited', 'علامت پیروزی'],
    Open_Palm: ['cheeky', 'کف دست باز'], Pointing_Up: ['thinking', 'اشاره به بالا'],
    ILoveYou: ['love', 'علامت دوستت دارم']
  };

  // This function runs in a classic worker: WASM inference never blocks the eyes.
  function visionWorkerMain() {
    var handModel, faceModel;
    self.onmessage = async function (event) {
      var data = event.data;
      try {
        if (data.type === 'init') {
          self.postMessage({ type: 'progress', label: 'بارگذاری کتابخانهٔ تشخیص…' });
          var vision = await import(data.base + 'vision_bundle.mjs');
          var files = await vision.FilesetResolver.forVisionTasks(data.base + 'wasm');
          self.postMessage({ type: 'progress', label: 'بارگذاری مدل دست؛ بار اول ممکن است زمان ببرد…' });
          handModel = await vision.GestureRecognizer.createFromOptions(files, {
            baseOptions: { modelAssetPath: data.base + 'gesture_recognizer.task', delegate: 'CPU' },
            runningMode: 'VIDEO', numHands: 2,
            minHandDetectionConfidence: .6, minHandPresenceConfidence: .6,
            cannedGesturesClassifierOptions: { scoreThreshold: .65 }
          });
          self.postMessage({ type: 'progress', label: 'مدل دست آماده است؛ بارگذاری مدل صورت…' });
          faceModel = await vision.FaceLandmarker.createFromOptions(files, {
            baseOptions: { modelAssetPath: data.base + 'face_landmarker.task', delegate: 'CPU' },
            runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: true,
            minFaceDetectionConfidence: .6, minFacePresenceConfidence: .6
          });
          self.postMessage({ type: 'ready' });
        } else if (data.type === 'frame') {
          try {
            var hands = handModel.recognizeForVideo(data.bitmap, data.time);
            var face = faceModel.detectForVideo(data.bitmap, data.time);
            self.postMessage({ type: 'result', hands: hands.gestures,
              handCount: hands.landmarks.length, faceCount: face.faceLandmarks.length,
              capturedAt: data.time,
              face: face.faceBlendshapes[0] ? face.faceBlendshapes[0].categories : [] });
          } finally { data.bitmap.close(); }
        }
      } catch (error) {
        self.postMessage({ type: 'error', message: String(error.message || error) });
      }
    };
  }

  function classifyGesture(hands, face) {
    var scores = {};
    face.forEach(function (item) { scores[item.categoryName] = item.score; });
    function score(name) { return scores[name] || 0; }
    // Puckering with a mostly closed mouth is a kiss-like expression, not emotion inference.
    if (score('mouthPucker') > .55 && score('jawOpen') < .25 &&
        Math.max(score('mouthSmileLeft'), score('mouthSmileRight')) < .35) {
      return { key: 'kiss', mood: 'love', label: 'بوس' };
    }
    var best = null;
    hands.forEach(function (categories) {
      var top = categories[0];
      if (top && top.score >= .65 && HAND_REACTIONS[top.categoryName] && (!best || top.score > best.score)) best = top;
    });
    if (best) {
      var reaction = HAND_REACTIONS[best.categoryName];
      return { key: best.categoryName, mood: reaction[0], label: reaction[1] };
    }
    if (Math.min(score('mouthSmileLeft'), score('mouthSmileRight')) > .5) {
      return { key: 'smile', mood: 'happy', label: 'لبخند' };
    }
    var left = score('eyeBlinkLeft'), right = score('eyeBlinkRight');
    if ((left > .65 && right < .25) || (right > .65 && left < .25)) {
      return { key: 'wink', mood: 'cheeky', label: 'چشمک' };
    }
    return null;
  }

  function consumeGesture(result, now) {
    var detected = classifyGesture(result.hands || [], result.face || []);
    if (!detected) {
      if (now - candidateLastSeen > 500) {
        candidateKey = ''; acceptedKey = ''; candidateFrames = 0;
        setText(gestureStatus, result.handCount || result.faceCount ?
          'دست یا صورت دیده شد؛ ژست واضح نیست. روبه‌روی دوربین نگه دار.' :
          'دست یا صورت پیدا نشد؛ روبه‌روی دوربین و در نور کافی قرار بگیر.');
      }
      return;
    }
    // A slow CPU may return fewer than two results per second. Do not discard
    // consecutive matching results just because inference took over 500 ms.
    if (detected.key !== candidateKey || now - candidateLastSeen > 3000) {
      candidateKey = detected.key;
      candidateSince = now;
      candidateFrames = 0;
    }
    candidateFrames++;
    candidateLastSeen = now;
    if (now < manualUntil) {
      setText(gestureStatus, 'ژست دیده شد؛ انتخاب دستی فعلاً اولویت دارد.');
      return;
    }
    if (candidateFrames < 2 || now - candidateSince < (detected.key === 'wink' ? 220 : 450)) {
      setText(gestureStatus, 'gesturePending', { gesture: detected.label });
      return;
    }
    if (detected.key !== acceptedKey && now - acceptedAt < 700) return;
    setText(gestureStatus, 'gestureReaction', { gesture: detected.label, mood: MOOD_FA[detected.mood] });
    if (acceptedKey !== detected.key || mood !== detected.mood) {
      acceptedKey = detected.key; acceptedAt = now;
      mood = detected.mood; applyMood(); showMood();
    }
    // Keep the reaction while the gesture is held; recover after it disappears.
    clearTimeout(reactionTimer);
    reactionTimer = setTimeout(function () {
      acceptedKey = '';
      mood = selectedMood; applyMood(); showMood();
    }, 2400);
  }

  function stopGestureRecognition(reason) {
    clearInterval(gestureInterval); clearTimeout(gestureWatchdog);
    if (gestureWorker) gestureWorker.terminate();
    gestureWorker = null; gestureInterval = null; gestureBusy = false;
    gestureVideoTime = -1; gestureState = 'off';
    candidateKey = ''; acceptedKey = ''; candidateLastSeen = 0; acceptedAt = -Infinity;
    candidateFrames = 0;
    if (gestureStatus) setText(gestureStatus, reason || 'تشخیص ژست متوقف شده است.');
    if (visionFeedback) setText(visionFeedback, '');
  }

  function failGestureRecognition(error) {
    console.warn('Gesture recognition unavailable:', error);
    stopGestureRecognition();
    clearTimeout(reactionTimer);
    if (mood !== selectedMood) { mood = selectedMood; applyMood(); }
    gestureState = 'error';
    setText(gestureStatus, 'تشخیص ژست بارگذاری نشد؛ دوربین در حالت ساده است. «تلاش دوباره» را بزن.');
    gestureRetry.hidden = false;
    gestureError.hidden = false;
    setText(gestureError.querySelector('p'), String(error && error.message || error));
  }

  function startGestureRecognition() {
    if (gestureState === 'loading' || gestureState === 'ready') return;
    stopGestureRecognition();
    if (!stream) { setText(gestureStatus, 'ابتدا دوربین را روشن کن.'); return; }
    if (!smartGestures.checked) { setText(gestureStatus, 'گزینهٔ واکنش هوشمند خاموش است؛ برای تشخیص ژست تیک آن را بزن.'); return; }
    if (!window.Worker || !window.createImageBitmap || !window.OffscreenCanvas || location.protocol === 'file:') {
      failGestureRecognition('تشخیص ژست به نسخهٔ آنلاین برنامه و مرورگر سازگار نیاز دارد.'); return;
    }
    gestureState = 'loading';
    gestureRetry.hidden = true;
    gestureError.hidden = true;
    setText(gestureStatus, 'در حال آماده‌سازی تشخیص دست و صورت…');
    var blobURL = URL.createObjectURL(new Blob(['(' + visionWorkerMain.toString() + ')();'], { type: 'text/javascript' }));
    try {
      var worker = new Worker(blobURL);
      gestureWorker = worker;
      worker.onerror = function (event) { if (gestureWorker === worker) failGestureRecognition(event.message); };
      worker.onmessage = function (event) {
        if (gestureWorker !== worker) return;
        clearTimeout(gestureWatchdog);
        if (event.data.type === 'progress') {
          setText(gestureStatus, event.data.label);
          gestureWatchdog = setTimeout(function () {
            if (gestureWorker === worker) failGestureRecognition('Model loading timed out after 120 seconds. Check your connection and retry.');
          }, 120000);
          return;
        }
        if (event.data.type === 'error') { failGestureRecognition(event.data.message); return; }
        if (event.data.type === 'ready') {
          gestureState = 'ready';
          setText(cameraStatus, 'دوربین روشن است؛ نگاه حرکت را دنبال می‌کند و احساس با ژست تغییر می‌کند.');
          setText(gestureStatus, 'آماده؛ یک ژست نشان بده یا لبخند بزن.');
          gestureInterval = setInterval(async function () {
            if (gestureBusy || video.readyState < 2 || video.currentTime === gestureVideoTime) return;
            gestureBusy = true;
            gestureVideoTime = video.currentTime;
            gestureWatchdog = setTimeout(function () {
              if (gestureWorker === worker) failGestureRecognition('Inference timed out');
            }, 15000);
            try {
              var bitmap = await createImageBitmap(video);
              if (gestureWorker !== worker) { bitmap.close(); return; }
              worker.postMessage({ type: 'frame', bitmap: bitmap, time: performance.now() }, [bitmap]);
            } catch (error) { if (gestureWorker === worker) failGestureRecognition(error); }
          }, 140);
        } else if (event.data.type === 'result') {
          gestureBusy = false;
          var now = performance.now();
          var elapsed = Math.round(now - event.data.capturedAt);
          setText(visionFeedback, 'visionStats', { hands: event.data.handCount, faces: event.data.faceCount, time: elapsed });
          consumeGesture(event.data, now);
        }
      };
      worker.postMessage({ type: 'init', base: new URL('vendor/mediapipe/', location.href).href });
      gestureWatchdog = setTimeout(function () {
        if (gestureWorker === worker) failGestureRecognition('Model loading timed out');
      }, 120000);
    } catch (error) { failGestureRecognition(error); }
    finally { URL.revokeObjectURL(blobURL); }
  }
  smartGestures.addEventListener('change', function () {
    clearTimeout(reactionTimer);
    if (mood !== selectedMood) { mood = selectedMood; applyMood(); }
    stopGestureRecognition();
    startGestureRecognition();
    if (stream && !smartGestures.checked) setText(cameraStatus, 'حالت ساده: حرکت آرام و پیوسته = خوشحالی؛ حرکت شدید = تعجب.');
  });
  gestureRetry.addEventListener('click', function () {
    smartGestures.checked = true;
    stopGestureRecognition();
    startGestureRecognition();
  });

  /* ================= Mood handling ================= */
  function showMood() {
    setText(moodEl, MOOD_FA[mood]);
    moodEl.classList.add("show");
    clearTimeout(moodTimer);
    moodTimer = setTimeout(function () { moodEl.classList.remove("show"); }, 1400);
  }

  function cycleMood() {
    selectMood(MOODS[(MOODS.indexOf(selectedMood) + 1) % MOODS.length]);
  }

  // Shapes use physical left/right coordinates, independent of the page's RTL text.
  var EXPRESSIONS = {
    normal: ['M32 28 Q50 22 68 28 Q76 50 68 72 Q50 78 32 72 Q24 50 32 28', 'M32 28 Q50 22 68 28 Q76 50 68 72 Q50 78 32 72 Q24 50 32 28'],
    happy: ['M20 61 L50 31 L80 61', 'M20 61 L50 31 L80 61'],
    sad: ['M20 53 Q50 48 80 30 L78 62 Q52 79 25 65 Z', 'M20 30 Q50 48 80 53 L75 65 Q48 79 22 62 Z'],
    angry: ['M18 32 L82 52 L77 68 Q47 80 24 62 Z', 'M18 52 L82 32 L76 62 Q53 80 23 68 Z'],
    surprised: ['M50 17 A25 33 0 1 1 49.9 17 Z', 'M50 17 A25 33 0 1 1 49.9 17 Z'],
    sleepy: ['M21 58 Q50 66 79 58', 'M21 58 Q50 66 79 58'],
    love: ["M50 78 C40 69 16 52 19 35 C22 17 43 18 50 33 C57 18 78 17 81 35 C84 52 60 69 50 78Z","M50 78 C40 69 16 52 19 35 C22 17 43 18 50 33 C57 18 78 17 81 35 C84 52 60 69 50 78Z"],
    suspicious: ["M20 52 L78 45 L76 61 Q50 69 23 60Z","M32 28 Q50 22 68 28 Q76 50 68 72 Q50 78 32 72 Q24 50 32 28"],
    dizzy: ["M50 50 C40 37 29 53 41 64 C60 80 82 55 67 34 C45 7 11 35 23 63 C35 90 82 85 85 50","M50 50 C40 37 29 53 41 64 C60 80 82 55 67 34 C45 7 11 35 23 63 C35 90 82 85 85 50"],
    cheeky: ["M20 61 L50 31 L80 61","M22 50 Q50 59 78 50"],
    bored: ["M22 55 L78 55","M22 55 L78 55"],
    excited: ["M50 17 L60 38 L83 41 L66 57 L70 81 L50 69 L30 81 L34 57 L17 41 L40 38Z","M50 17 L60 38 L83 41 L66 57 L70 81 L50 69 L30 81 L34 57 L17 41 L40 38Z"],
    shy: ["M34 45 Q42 37 50 45 L50 61 Q42 69 34 61Z","M50 45 Q58 37 66 45 L66 61 Q58 69 50 61Z"],
    thinking: ["M30 28 Q46 20 61 27 L61 53 Q46 62 30 53Z","M30 39 Q47 30 66 34 L64 49 Q47 56 32 49Z"]
  };
  function selectMood(next) {
    clearTimeout(reactionTimer);
    manualUntil = performance.now() + 3000;
    selectedMood = next;
    mood = next;
    applyMood();
    showMood();
  }
  function applyMood() {
    var version = ++transitionVersion;
    var next = mood;
    clearTimeout(transitionTimer);
    document.querySelectorAll('[data-select-mood]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.selectMood === selectedMood));
    });
    function render() {
      if (version !== transitionVersion) return;
      stage.dataset.mood = next;
      eyes.forEach(function (eye, i) {
        eye.querySelector('.expression').setAttribute('d', EXPRESSIONS[next][i]);
        eye.classList.remove('blink');
      });
      stage.classList.remove('changing-mood');
    }
    // Close the light shapes before swapping incompatible SVG paths, then reopen.
    if (reducedMotion.matches || !eyes[0].querySelector('.expression').getAttribute('d')) {
      render();
    } else {
      stage.classList.add('changing-mood');
      transitionTimer = setTimeout(render, 160);
    }
  }
  document.getElementById('mood-picker').addEventListener('click', function (event) {
    var button = event.target.closest('[data-select-mood]');
    if (!button) return;
    selectMood(button.dataset.selectMood);
  });
  applyMood();

  addEventListener("click", function (e) {
    if (!e.target.closest("#camera-controls, #mood-picker, #language-controls")) cycleMood();
  });
  addEventListener("keydown", function (e) {
    if (!e.target.closest("#camera-controls, #mood-picker, #language-controls") && !e.repeat && (e.code === "Space" || e.code === "Enter")) cycleMood();
  });

  /* ================= Blinking ================= */
  function blinkOnce() {
    eyes.forEach(function (e) { e.classList.add("blink"); });
    setTimeout(function () { eyes.forEach(function (e) { e.classList.remove("blink"); }); }, 130);
  }
  function doubleBlink() {
    blinkOnce();
    setTimeout(blinkOnce, 280);
  }
  function wink() {
    var e = eyes[Math.random() < .5 ? 0 : 1];
    e.classList.add("blink");
    setTimeout(function () { e.classList.remove("blink"); }, 500);
  }

  (function blinkLoop() {
    var wait = 2200 + Math.random() * 3500;
    setTimeout(function () {
      if (mood !== "sleepy" && !stage.classList.contains("changing-mood")) {
        if (Math.random() < .18) doubleBlink();
        else if (Math.random() < .12) wink();
        else blinkOnce();
      }
      blinkLoop();
    }, wait);
  })();

  /* ================= Idle behaviors ================= */
  // Occasional glance around (brief auto target override)
  var glance = { active: false, x: 0, y: 0 };
  (function idleLoop() {
    var wait = 3000 + Math.random() * 5000;
    setTimeout(function () {
      var r = Math.random();
      if (r < .5) {
        // glance
        var a = Math.random() * Math.PI * 2;
        glance.active = true;
        glance.x = Math.cos(a) * maxOffset(eyes[0]).x;
        glance.y = Math.sin(a) * maxOffset(eyes[0]).y;
        setTimeout(function () { glance.active = false; }, 700 + Math.random() * 900);
      }
      idleLoop();
    }, wait);
  })();

  /* ================= Pupil follow (smooth) ================= */
  function maxOffset(eye) {
    var r = eye.getBoundingClientRect();
    return { x: r.width * .16, y: r.height * .16 };
  }
  var lastTick = performance.now();
  function tick() {
    var now = performance.now();
    var elapsed = Math.min(50, now - lastTick);
    lastTick = now;
    var tx = 0, ty = 0;
    if (stream && performance.now() - cameraTarget.time < 1800 && performance.now() - lastPointer > 1000) {
      var cameraOffset = maxOffset(eyes[0]);
      tx = (cameraTarget.x * 2 - 1) * cameraOffset.x;
      ty = (cameraTarget.y * 2 - 1) * cameraOffset.y;
    } else if (stream && now - lastPointer > 1000) {
      tx = 0; ty = 0;
    } else if (glance.active) {
      tx = glance.x; ty = glance.y;
    } else {
      var dx = mouse.x - innerWidth / 2;
      var dy = mouse.y - innerHeight / 2;
      var d = Math.hypot(dx, dy) || 1;
      var strength = Math.min(1, d / (innerWidth * .35));
      var m = maxOffset(eyes[0]);
      tx = (dx / d) * m.x * strength;
      ty = (dy / d) * m.y * strength;
    }
    // Let each expression carry its own posture and response speed.
    if (mood === 'sad') { tx *= .65; ty = ty * .5 + 7; }
    if (mood === 'sleepy') { tx *= .4; ty = ty * .3 + 9; }
    if (mood === 'happy') ty -= 4;
    if (mood === 'shy') { tx *= .45; ty = ty * .3 + 10; }
    if (mood === 'thinking') { tx = tx * .25 + 9; ty = ty * .2 - 12; }
    if (mood === 'bored') { tx = tx * .3 - 12; ty *= .2; }
    if (mood === 'suspicious') { tx *= .7; ty *= .3; }
    var ease = ['sleepy', 'bored', 'suspicious'].includes(mood) ? .025 : mood === 'angry' ? .14 : .08;

    if (stream && now - cameraTarget.time < 1000) ease = Math.max(ease, .06 + motionEnergy * .4);
    ease = 1 - Math.pow(1 - ease, elapsed / (1000 / 60));
    // Frame-rate independent easing
    cur.x += (tx - cur.x) * ease;
    cur.y += (ty - cur.y) * ease;

    pupils.forEach(function (p) {
      p.style.transform = "translate(calc(-50% + " + cur.x.toFixed(1) + "px), calc(-50% + " + cur.y.toFixed(1) + "px))";
    });
    requestAnimationFrame(tick);
  }
  tick();

})();
