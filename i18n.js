(function () {
  'use strict';
  // Persian source strings are stable keys for existing UI messages.
  const english = {
    'روشن کردن دوربین': 'Turn camera on', 'خاموش کردن دوربین': 'Turn camera off',
    'لغو درخواست دوربین': 'Cancel camera request',
    'واکنش به حرکت • پردازش فقط روی دستگاه شما': 'Motion reactions • Processing stays on your device',
    'حساسیت حرکت': 'Motion sensitivity', 'شدت حرکت تشخیص‌داده‌شده': 'Detected motion level',
    'واکنش هوشمند به دست و صورت': 'Smart hand and face reactions',
    'با روشن کردن دوربین، تشخیص ژست فعال می‌شود.': 'Turn on the camera to enable gesture recognition.',
    'تلاش دوباره برای تشخیص': 'Retry recognition', 'جزئیات خطای تشخیص': 'Recognition error details',
    'راهنمای ژست‌ها': 'Gesture guide', 'پیش‌نمایش آینه‌ای دوربین': 'Mirrored camera preview',
    'انتخاب حالت چشم‌ها': 'Choose an eye expression',
    'لب‌ها را مثل بوس جمع کن یا 🤟 نشان بده ← عاشق': 'Pucker your lips or show 🤟 → Love',
    'مشت ✊ یا 👎 ← عصبانی': 'Fist ✊ or 👎 → Angry', '👍 یا لبخند ← خوشحال': '👍 or a smile → Happy',
    '✌️ ← هیجان‌زده': '✌️ → Excited', 'کف دست باز 🖐️ ← شیطون': 'Open palm 🖐️ → Cheeky',
    'اشاره به بالا ☝️ ← در حال فکر': 'Point up ☝️ → Thinking', 'چشمک ← شیطون': 'Wink → Cheeky',
    'دست یا صورت را روبه‌روی دوربین، با نور کافی، حدود نیم‌ثانیه ثابت نگه دار. تشخیص بوس تخمینی است. انتخاب دستی تا ۳ ثانیه اولویت دارد.': 'Keep your hand or face in view with good lighting for about half a second. Kiss detection is approximate. Manual selection takes priority for 3 seconds.',
    'پردازش روی دستگاه است؛ تصویر ذخیره یا ارسال نمی‌شود.': 'Processing stays on your device. Images are not saved or sent.',
    'کلیک/لمس = تغییر حالت': 'Click / tap = change mood', 'حرکت = دنبال کردن': 'Move = follow',
    'عادی': 'Normal', 'خوشحال': 'Happy', 'ناراحت': 'Sad', 'غمگین': 'Sad', 'عصبانی': 'Angry',
    'متعجب': 'Surprised', 'خواب‌آلود': 'Sleepy', 'عاشق': 'Love', 'مشکوک': 'Suspicious',
    'گیج': 'Dizzy', 'شیطون': 'Cheeky', 'بی‌حوصله': 'Bored', 'هیجان‌زده': 'Excited',
    'خجالتی': 'Shy', 'در حال فکر': 'Thinking',
    'مشت': 'Fist', 'شست رو به پایین': 'Thumbs down', 'لایک': 'Thumbs up', 'علامت پیروزی': 'Victory sign',
    'کف دست باز': 'Open palm', 'اشاره به بالا': 'Pointing up', 'علامت دوستت دارم': 'I love you sign',
    'بوس': 'Kiss', 'لبخند': 'Smile', 'چشمک': 'Wink',
    'دوربین خاموش است؛ برای تشخیص ژست دوباره روشنش کن.': 'The camera is off. Turn it on to recognize gestures.',
    'دوربین خاموش است': 'Camera is off',
    'برای دسترسی به دوربین، نسخهٔ آنلاین برنامه را در مرورگر باز کنید.': 'Open the hosted version in your browser to access the camera.',
    'در انتظار اجازهٔ دسترسی به دوربین…': 'Waiting for camera permission…',
    'اتصال دوربین قطع شد؛ دوباره روشن کنید.': 'Camera disconnected. Turn it on again.',
    'حرکت آرام و پیوسته = خوشحالی؛ حرکت شدید = تعجب. اگر واکنش کم است، حساسیت را بیشتر کنید.': 'Gentle sustained motion = happy; strong motion = surprised. Increase sensitivity if needed.',
    'اجازهٔ دوربین داده نشد؛ دسترسی را در تنظیمات مرورگر فعال کنید.': 'Camera permission was denied. Allow access in your browser settings.',
    'دوربینی پیدا نشد؛ اتصال دوربین را بررسی کنید.': 'No camera found. Check its connection.',
    'دوربین در دسترس نیست؛ برنامه‌های دیگرِ استفاده‌کننده را ببندید.': 'Camera unavailable. Close other apps using it.',
    'راه‌اندازی دوربین ناموفق بود؛ دوباره تلاش کنید.': 'Could not start the camera. Try again.',
    'دوربین با خروج از صفحه خاموش شد؛ برای ادامه دوباره روشن کنید.': 'The camera was turned off when you left the page. Turn it on again to continue.',
    'بارگذاری کتابخانهٔ تشخیص…': 'Loading the recognition library…',
    'بارگذاری مدل دست؛ بار اول ممکن است زمان ببرد…': 'Loading the hand model. The first load may take a while…',
    'مدل دست آماده است؛ بارگذاری مدل صورت…': 'Hand model ready. Loading the face model…',
    'دست یا صورت دیده شد؛ ژست واضح نیست. روبه‌روی دوربین نگه دار.': 'Hand or face detected, but the gesture is unclear. Hold it facing the camera.',
    'دست یا صورت پیدا نشد؛ روبه‌روی دوربین و در نور کافی قرار بگیر.': 'No hand or face detected. Face the camera in good lighting.',
    'ژست دیده شد؛ انتخاب دستی فعلاً اولویت دارد.': 'Gesture detected. Your manual selection has priority for now.',
    'تشخیص ژست متوقف شده است.': 'Gesture recognition has stopped.',
    'تشخیص ژست بارگذاری نشد؛ دوربین در حالت ساده است. «تلاش دوباره» را بزن.': 'Recognition could not load. Basic motion is active. Select Retry recognition.',
    'ابتدا دوربین را روشن کن.': 'Turn on the camera first.',
    'گزینهٔ واکنش هوشمند خاموش است؛ برای تشخیص ژست تیک آن را بزن.': 'Smart reactions are off. Check the option to recognize gestures.',
    'تشخیص ژست به نسخهٔ آنلاین برنامه و مرورگر سازگار نیاز دارد.': 'Gesture recognition needs the hosted version and a supported browser.',
    'در حال آماده‌سازی تشخیص دست و صورت…': 'Preparing hand and face recognition…',
    'دوربین روشن است؛ نگاه حرکت را دنبال می‌کند و احساس با ژست تغییر می‌کند.': 'Camera is on. Motion guides the gaze; gestures change the mood.',
    'آماده؛ یک ژست نشان بده یا لبخند بزن.': 'Ready. Show a gesture or smile.',
    'حالت ساده: حرکت آرام و پیوسته = خوشحالی؛ حرکت شدید = تعجب.': 'Basic mode: gentle sustained motion = happy; strong motion = surprised.'
  };
  const templates = {
    gesturePending: { fa: '{gesture}؟ کمی نگه دار…', en: '{gesture}? Hold it briefly…' },
    gestureReaction: { fa: '{gesture} ← {mood}', en: '{gesture} → {mood}' },
    visionStats: { fa: 'دست: {hands} • صورت: {faces} • پردازش: {time} میلی‌ثانیه', en: 'Hands: {hands} • Faces: {faces} • Processing: {time} ms' }
  };
  let language = 'fa';
  try { if (localStorage.getItem('emo-language') === 'en') language = 'en'; } catch (_) { /* Storage may be blocked. */ }
  const dynamic = new Map(), staticBindings = [];
  function translate(key, params = {}) {
    const message = templates[key] ? templates[key][language] : language === 'en' ? (english[key] || key) : key;
    return String(message).replace(/\{(\w+)\}/g, (_, name) => {
      const value = String(params[name] ?? '');
      return language === 'en' ? (english[value] || value) : value;
    });
  }
  function setText(element, key, params) {
    dynamic.set(element, { key, params });
    element.textContent = translate(key, params);
  }
  function setLanguage(next) {
    if (next !== 'fa' && next !== 'en') return;
    language = next;
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'fa' ? 'rtl' : 'ltr';
    staticBindings.forEach(binding => {
      if (binding.attribute) binding.node.setAttribute(binding.attribute, translate(binding.key));
      else binding.node.nodeValue = binding.prefix + translate(binding.key) + binding.suffix;
    });
    dynamic.forEach((value, node) => { node.textContent = translate(value.key, value.params); });
    document.getElementById('language-picker').value = next;
    try { localStorage.setItem('emo-language', next); } catch (_) { /* Keep the session usable. */ }
  }
  function init() {
    // Bind text nodes independently so labels, checkboxes, and line breaks survive translation.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest('script, style, [data-no-i18n]')) continue;
      const key = node.nodeValue.trim();
      if (!english[key]) continue;
      staticBindings.push({ node, key, prefix: node.nodeValue.match(/^\s*/)[0], suffix: node.nodeValue.match(/\s*$/)[0] });
    }
    document.querySelectorAll('[aria-label]').forEach(node => {
      const key = node.getAttribute('aria-label');
      if (english[key]) staticBindings.push({ node, key, attribute: 'aria-label' });
    });
    document.getElementById('language-picker').addEventListener('change', event => setLanguage(event.target.value));
    setLanguage(language);
  }
  globalThis.EMOI18n = { translate, setText, setLanguage, init, getLanguage: () => language };
})();
